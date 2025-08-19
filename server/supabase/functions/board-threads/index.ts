// supabase/functions/board-threads/index.ts (Updated for new RPC structure)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SupabaseClient } from "jsr:@supabase/supabase-js"
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'
// Import our updated interfaces
import { Thread, ReplyPreview } from '../_shared/types.ts'

console.log("board-threads function initialized (Updated for new RPC)");

async function handleGetBoardThreads(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Extract parameters from the request.
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const boardSlug = pathParts[pathParts.length - 1];
  if (!boardSlug) return errorResponse(400, "Board slug is required.");
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '15', 10);
  const offset = (page - 1) * limit;

  // 2. Call our database RPC.
  const { data, error } = await supabaseAdmin.rpc('get_threads_by_board_slug2', {
    p_board_slug: boardSlug,
    p_page_limit: limit,
    p_page_offset: offset
  });

  if (error) {
    if (error.message.includes('not found')) return errorResponse(404, error.message);
    console.error("Error fetching board threads:", error);
    return errorResponse(500, "Could not fetch board threads.");
  }
  
  // 3. Apply our type to the raw data from the database.
  const { threads, totalCount } = data as { threads: Thread[], totalCount: number };
  
  // 4. Process the data: add full public URLs for all images (OPs and replies).
  const threadsWithUrls = threads.map((thread: Thread) => {
    // Add image_url to the OP
    if (thread.image_path) {
      const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(thread.image_path);
      thread.image_url = urlData.publicUrl;
    }
    
    // Add image_url to any preview replies that have an image
    thread.latest_replies.forEach((reply: ReplyPreview) => {
      if (reply.image_path) {
        const { data: urlData } = supabaseAdmin.storage.from('posts').getPublicUrl(reply.image_path);
        reply.image_url = urlData.publicUrl;
      }
    });

    return thread;
  });

  // 5. Structure the final response.
  const responseData = {
    data: threadsWithUrls,
    meta: {
      total: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(createApiHandler(handleGetBoardThreads));