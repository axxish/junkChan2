// supabase/functions/create-post/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js"
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("create-post function initialized");
  
const ACTION_TYPE_ANON = 'anon_create_post';
const ACTION_TYPE_AUTH = 'auth_create_post';

async function handleCreatePost(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Parse and Validate Input
  const { boardSlug, imagePath, comment } = await req.json();
  if (!boardSlug || !imagePath) {
    return errorResponse(400, 'Bad Request: "boardSlug" and "imagePath" are required.');
  }
  if (!imagePath.startsWith('posts/')) {
    return errorResponse(400, 'Bad Request: Invalid image path.');
  }

  // 2. Look up the Board ID from the slug
  const { data: board, error: boardError } = await supabaseAdmin
    .from('boards')
    .select('id')
    .eq('slug', boardSlug)
    .single();

  if (boardError || !board) {
    return errorResponse(404, `Board with slug "${boardSlug}" not found.`);
  }
  
  // 3. Determine if the user is authenticated or anonymous
  const authHeader = req.headers.get('Authorization');
  let userId: string | undefined;

  if (authHeader) {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  // 4. Construct the Post Record
  const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(imagePath);
  const postRecord = {
    board_id: board.id,
    user_id: userId, // Will be null if anonymous
    image_url: urlData.publicUrl,
    comment: comment,
    poster_ip: userId ? null : req.headers.get('x-forwarded-for')?.split(',').shift()?.trim(),
  };

  // 5. Insert the post into the database
  const { data: newPost, error: insertError } = await supabaseAdmin
    .from('posts')
    .insert(postRecord)
    .select()
    .single();

  if (insertError) {
    console.error("Error creating post:", insertError);
    return errorResponse(500, "Could not create post.");
  }
  
  // 6. Log the action for rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',').shift()?.trim();
  await supabaseAdmin.from('action_logs').insert({
    user_id: userId,
    ip_address: ip,
    action_type: userId ? ACTION_TYPE_AUTH : ACTION_TYPE_ANON,
  });

  // 7. Return the newly created post object
  return new Response(JSON.stringify(newPost), {
    status: 201, // 201 Created
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// We will add the rate limit to the wrapper once we decide on the action type.
// For now, let's build it without the declarative rate limit in the wrapper.
Deno.serve(createApiHandler(handleCreatePost));