// supabase/functions/create-board/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js"
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("create-board function initialized");

/**
 * The core business logic for creating a new board.
 * This is a protected endpoint, restricted to ADMIN users.
 */
async function handleCreateBoard(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Authenticate the user AND check their role.
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return errorResponse(401, 'Unauthorized: User not authenticated.');
  }

  // Fetch the user's profile to check their role.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'ADMIN') {
    return errorResponse(403, 'Forbidden: You do not have permission to create a board.');
  }

  // 2. Parse and Validate Input from the request body
  const { slug, name, description } = await req.json();
  if (!slug || !name) {
    return errorResponse(400, 'Bad Request: "slug" and "name" are required.');
  }

  // 3. Perform the database insert.
  const { data: newBoard, error: insertError } = await supabaseAdmin
    .from('boards')
    .insert({
      slug: slug,
      name: name,
      description: description // This can be null
    })
    .select()
    .single();

  if (insertError) {
    // Handle the case where the slug is not unique.
    if (insertError.code === '23505') { // unique_violation
      return errorResponse(409, `Conflict: A board with slug "${slug}" already exists.`);
    }
    console.error("Error creating board:", insertError);
    return errorResponse(500, "Could not create board.");
  }

  // 4. Return the newly created board object.
  // The database trigger has already fired automatically in the background.
  return new Response(JSON.stringify(newBoard), {
    status: 201, // 21 Created
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// This endpoint does not need rate limiting, as it's an infrequent admin-only action.
Deno.serve(createApiHandler(handleCreateBoard));