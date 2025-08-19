// supabase/functions/boards/index.ts (Simple Version)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SupabaseClient } from "jsr:@supabase/supabase-js"
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("boards function initialized (Simple Version)");

/**
 * The core business logic for fetching ALL boards.
 * This is a simple, non-paginated endpoint.
 */
async function handleGetBoards(_req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Perform a simple database query to get all boards.
  const { data, error } = await supabaseAdmin
    .from('boards')
    // Select all columns.
    .select('*')
    // Order the results by name for a consistent, user-friendly list.
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching boards:", error);
    return errorResponse(500, "Could not fetch boards.");
  }

  

  // 2. Return the data as a simple JSON array.
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// This is a public, read-only endpoint, so no rate limiting is needed.
Deno.serve(createApiHandler(handleGetBoards));