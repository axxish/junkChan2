// supabase/functions/create-user/index.ts (v5 - Abstracted)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  CORS_HEADERS,
  createAdminClient,
  createApiHandler,
  errorResponse,
} from "../_shared/util.ts";

console.log("create-user function initialized (v5 - Abstracted)");

async function handleCreateUser(req: Request): Promise<Response> {
  // 1. Parse and Validate Input
  const { email, password, username } = await req.json();

  if (!email || !password || !username) {
    return errorResponse(400, "Email, password, and username are required.");
  }
  if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return errorResponse(
      400,
      "Username must be at least 3 characters long and contain only letters, numbers, and underscores.",
    );
  }

  // 2. Perform Database Operations
  const supabaseAdmin = createAdminClient();

  const { data: { user }, error: authError } = await supabaseAdmin.auth.admin
    .createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

  if (authError) return errorResponse(409, "This email is already registered.");
  if (!user) return errorResponse(500, "Could not create user.");

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({ id: user.id, username: username, role: "USER" });

  if (profileError) {
    if (profileError.code === "23505") {
      return errorResponse(409, "This username is already taken.");
    }
    return errorResponse(500, "Could not create user profile.");
  }

  // 3. Return Success Response
  return new Response(JSON.stringify(user), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// This is our "main" function.
// We pass our business logic to the handler factory.
Deno.serve(createApiHandler(handleCreateUser));
