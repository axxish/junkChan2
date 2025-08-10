// supabase/functions/login-user/index.ts (v2 - with username support)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js"

import {
  createAdminClient,
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("login-user function initialized (v2 - with username support)");



async function handleLoginUser(req: Request): Promise<Response> {
  const loginErrorMsg = 'Incorrect email, username or password.';

  // 1. Parse and Validate Input
  const { loginIdentifier, password } = await req.json();

  if (!loginIdentifier || !password) {
    return errorResponse(400, 'A login identifier and password are required.');
  }

  let userEmail = '';

  // 2. Determine if the identifier is an email or username
  const isAdminClientNeeded = !/@/.test(loginIdentifier);

  if (isAdminClientNeeded) {
    // It's a username, so we must find the corresponding email.
    const supabaseAdmin = createAdminClient();

    // Step 2a: Find the profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', loginIdentifier)
      .single();

    if (profileError || !profile) {
      // Username not found, return a generic auth error for security.
      return errorResponse(401, loginErrorMsg);
    }

    // Step 2b: Retrieve the user's email from the auth schema using their ID
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
      profile.id
    );

    if (authUserError || !authUser.user) {
        // This indicates a data integrity issue (profile exists but auth user doesn't).
        console.error(`Data integrity issue: Profile ${profile.id} has no matching auth user.`);
        return errorResponse(500, 'An internal error occurred.');
    }
    
    userEmail = authUser.user.email!;

  } else {
    // It's an email, so we can use it directly.
    userEmail = loginIdentifier;
  }
  
  // 3. Attempt to sign the user in using the determined email
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password,
  });

  if (error) {
    // This will now catch wrong passwords for both username and email logins.
    return errorResponse(401, loginErrorMsg);
  }

  // 4. Return Success Response
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Wrap our business logic with the handler
Deno.serve(createApiHandler(handleLoginUser));