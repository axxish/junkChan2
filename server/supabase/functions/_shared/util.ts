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
 * This version handles CORS, creates a single admin client,
 * injects the client into the core logic, and manages top-level error catching.
 * 
 * @param {Function} handler - The async function containing the core business logic.
 *                             It MUST accept `req: Request` and `supabaseAdmin: SupabaseClient`.
 * @returns {Function} A Deno request handler ready to be served.
 */
export function createApiHandler(
  handler: (req: Request, supabaseAdmin: SupabaseClient) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // 1. Handle CORS preflight requests immediately.
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
      // 2. Create the Supabase admin client ONCE per request.
      const supabaseAdmin = createAdminClient();

      // 3. Execute the core business logic handler.
      // We inject the `supabaseAdmin` client we created into the handler.
      return await handler(req, supabaseAdmin);

    } catch (error) {
      // 4. Catch any unhandled errors from the handler and return a generic 500.
      console.error('Unhandled Error in handler wrapper:', error);
      return errorResponse(500, 'An internal server error occurred.');
    }
  };
}