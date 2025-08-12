// supabase/functions/post/index.ts (Simple & Type-Safe)

import { SupabaseClient, createClient } from "jsr:@supabase/supabase-js"
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'
import { FullThread, Reply } from '../_shared/types.ts'

console.log("post function initialized (Simple & Type-Safe)");

// This is our main handler that now routes based on the HTTP method.
async function handlePost(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // We check the request method to decide what to do.
  if (req.method === 'GET') {
    return await handleGetPost(req, supabaseAdmin);
  } else if (req.method === 'DELETE') {
    return await handleDeletePost(req, supabaseAdmin);
  }

  return errorResponse(405, "Method Not Allowed");



}


async function handleGetPost(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Extract parameters...

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const postId = parseInt(pathParts[pathParts.length - 1], 10);
  if (isNaN(postId)) return errorResponse(400, "Invalid post ID.");
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = (page - 1) * limit;

  // 2. Call our database RPC.
  const { data, error } = await supabaseAdmin.rpc('get_thread_by_id', {
    p_post_id: postId,
    p_replies_limit: limit,
    p_replies_offset: offset
  });

  if (error) {
    console.error("Error fetching thread:", error);
    return errorResponse(500, "Could not fetch thread.");
  }
  
  // 3. THE FIX: Cast the data and process it directly.
  const threadData = data as FullThread;
  
  // Add image_url to the OP if it has an image_path.
  if (threadData.op?.image_path) {
    const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(threadData.op.image_path);
    threadData.op.image_url = urlData.publicUrl;
  }
  
  // Add image_url to any replies that have an image_path.
  threadData.replies.forEach((reply: Reply) => {
    if (reply.image_path) {
      const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(reply.image_path);
      reply.image_url = urlData.publicUrl;
    }
  });

  // 4. Return the modified data.
  return new Response(JSON.stringify(threadData), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}


// This is the NEW handler for the DELETE logic.
async function handleDeletePost(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Authenticate the user AND check their role. This is a protected action.
  const authHeader = req.headers.get('Authorization')!
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return errorResponse(401, 'Unauthorized');
  }

  // Fetch the user's profile to check their role.
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['ADMIN', 'MODERATOR'].includes(profile.role)) {
    return errorResponse(403, 'Forbidden: You do not have permission to delete posts.');
  }

  // 2. Extract the post ID from the URL path.
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const postId = parseInt(pathParts[pathParts.length - 1], 10);
  if (isNaN(postId)) {
    return errorResponse(400, "Invalid post ID provided.");
  }

  // 3. Perform the delete operation.
  // This single command triggers all our database magic (cascading deletes and the storage trigger).
  const { error: deleteError } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error("Error deleting post:", deleteError);
    return errorResponse(500, "Could not delete post.");
  }

  // 4. Return a success response.
  // 204 No Content is the standard, correct HTTP status for a successful DELETE.
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

Deno.serve(createApiHandler(handlePost));