// supabase/functions/_shared/utils.ts
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js"

// --- Existing Helpers (slightly modified) ---

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Renamed and re-ordered arguments for clarity (status code first).
export function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing environment variables.");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * A higher-order function that wraps an API endpoint's logic.
 * This is the central piece of our API architecture.
 * 
 * It handles:
 * 1. CORS preflight requests.
 * 2. Creating a single Supabase admin client per request.
 * 3. Performing optional, declarative rate-limiting based on action type.
 * 4. Injecting the admin client into the core logic handler (Dependency Injection).
 * 5. Managing top-level error catching for unexpected failures.
 * 
 * @param {Function} handler - The async function containing the core business logic.
 *                             It MUST accept `req: Request` and `supabaseAdmin: SupabaseClient`.
 * @param {object} [options] - Optional configuration for the handler.
 * @param {string} [options.actionType] - The action type for rate limiting (e.g., 'avatar_upload').
 * @returns {Function} A Deno request handler ready to be served.
 */
export function createApiHandler(
  handler: (req: Request, supabaseAdmin: SupabaseClient) => Promise<Response>,
  options?: { actionType?: string }
) {
  return async (req: Request): Promise<Response> => {
    // 1. Handle CORS preflight requests immediately.
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
      // 2. Create the Supabase admin client ONCE per request.
      const supabaseAdmin = createAdminClient();

      // 3. Perform rate limiting if an actionType is specified in the options.
      if (options?.actionType) {
        // Determine the identity for rate limiting (prioritizing user ID over IP).
        const authHeader = req.headers.get('Authorization');
        let userId: string | undefined;

        // If there's an auth header, try to resolve the user ID from the JWT.
        if (authHeader) {
          const supabase:SupabaseClient = createClient(
            Deno.env.get('SUPABASE_URL')!, 
            Deno.env.get('SUPABASE_ANON_KEY')!, 
            { global: { headers: { Authorization: authHeader } } }
          );
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            userId = user.id;
          }
        }
        
        // Always get the IP as a fallback for anonymous or unauthenticated requests.
        const ip = req.headers.get('x-forwarded-for')?.split(',').shift()?.trim();

        // Call the rate-limiting logic using the client we already created.
        const { error: rateLimitError } = await checkRateLimit(supabaseAdmin, {
          actionType: options.actionType,
          userId: userId, // Will be undefined if user is not logged in
          ip: ip,         // checkRateLimit will use this if userId is falsy
        });

        // If the user is rate-limited, stop execution and return the error.
        if (rateLimitError) {
          return rateLimitError;
        }
      }

      // 4. Execute the core business logic handler.
      // We inject the `supabaseAdmin` client we created into the handler.
      return await handler(req, supabaseAdmin);

    } catch (error) {
      // 5. Catch any unhandled errors from the handler and return a generic 500.
      console.error('Unhandled Error in handler wrapper:', error);
      return errorResponse(500, 'An internal server error occurred.');
    }
  };
}
/**
 * rate-limiting function that checks if a user or IP
 * has exceeded the allowed number of actions in a given time window.
 * 
 * @param {SupabaseClient} supabaseAdmin - The admin client for DB access.
 * @param {object} params - Parameters for the rate limit check.
 * @param {string} params.actionType - The name of the action being performed (e.g., 'avatar_upload').
 * @param {string} [params.userId] - The user's ID (for authenticated users). This is prioritized.
 * @param {string} [params.ip] - The user's IP address (for anonymous users). Used if userId is not provided.
 * @returns {Promise<{error: Response | null}>} An object containing a `Response` object if the user is
 *                                              rate-limited, or `null` if they are allowed to proceed.
 */
export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  params: { actionType: string, userId?: string, ip?: string }
) {
  const { actionType, userId, ip } = params;
  const identifier = userId ? { type: 'user_id', value: userId } : { type: 'ip_address', value: ip };

  if (!identifier.value) {
    console.error(`Rate limit check for action '${actionType}' failed: No identifier.`);
    return { error: errorResponse(500, "Server configuration error.") };
  }


  const { data: config, error: configError } = await supabaseAdmin
    .from('app_config')
    .select('key, value') 
    .in('key', [`${actionType}_limit_count`, `${actionType}_limit_minutes`]);
  
  if (configError || !config || config.length < 2) {
    console.error(`Rate limit config missing in 'app_config' for action: ${actionType}`);
    return { error: errorResponse(500, "Server configuration error.") };
  }


  const limitCountStr = config.find(c => c.key === `${actionType}_limit_count`)?.value;
  const limitMinutesStr = config.find(c => c.key === `${actionType}_limit_minutes`)?.value;

  // Add a check to ensure we actually found the values before parsing.
  if (!limitCountStr || !limitMinutesStr) {
    console.error(`Incomplete rate limit config in 'app_config' for action: ${actionType}`);
    return { error: errorResponse(500, "Server configuration error.") };
  }
  
  const limitCount = parseInt(limitCountStr, 10);
  const limitMinutes = parseInt(limitMinutesStr, 10);
  
  // 2. Calculate the time window.
  const timeWindowStart = new Date(Date.now() - limitMinutes * 60 * 1000).toISOString();
  
  // 3. Build and execute the query to count recent actions.
  const query = supabaseAdmin
    .from('action_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action_type', actionType)
    .gte('created_at', timeWindowStart)
    .eq(identifier.type, identifier.value);

  const { count, error: countError } = await query;

  if (countError) {
    console.error('Error counting actions for rate limit:', countError);
    return { error: errorResponse(500, "Could not verify rate limit.") };
  }

  // 4. Enforce the limit.
  if (count !== null && count >= limitCount) {
    const message = `Too Many Requests. Limit is ${limitCount} requests per ${limitMinutes} minutes.`;
    return { error: errorResponse(429, message) };
  }

  // 5. If all checks pass, the action is allowed.
  return { error: null };
}