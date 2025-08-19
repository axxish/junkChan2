// supabase/functions/post/index.ts (Simple & Type-Safe)

import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";
import {
  CORS_HEADERS,
  createApiHandler,
  errorResponse,
} from "../_shared/util.ts";
import { FullThread, Reply } from "../_shared/types.ts";

console.log("post function initialized (Simple & Type-Safe)");

// This is our main handler that now routes based on the HTTP method.
async function handlePost(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  // We check the request method to decide what to do.
  if (req.method === "GET") {
    return await handleGetPost(req, supabaseAdmin);
  } else if (req.method === "DELETE") {
    return await handleDeletePost(req, supabaseAdmin);
  }

  return errorResponse(405, "Method Not Allowed");
}

async function handleGetPost(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  // 1. Extract parameters...
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const postId = parseInt(pathParts[pathParts.length - 1], 10);
  if (isNaN(postId)) return errorResponse(400, "Invalid post ID.");
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("replies_limit") || "100", 10);
  const offset = (page - 1) * limit;

  // 2. Call our database RPC.
  const { data, error } = await supabaseAdmin.rpc("get_thread_by_id", {
    p_post_id: postId,
    p_replies_limit: limit,
    p_replies_offset: offset,
  });

  if (error) {
    console.error("Error fetching thread:", error);
    return errorResponse(500, "Could not fetch thread.");
  }

  // 3. Apply our updated type and process the data.
  const threadData = data as FullThread;

  // If the OP was not found, the `op` field will be null.
  if (!threadData.op) {
    return errorResponse(404, `Post with ID ${postId} not found.`);
  }

  // Add image_url to the OP if it has an image_path.
  if (threadData.op.image_path) {
    const { data: urlData } = supabaseAdmin.storage.from("posts").getPublicUrl(
      threadData.op.image_path,
    );
    threadData.op.image_url = urlData.publicUrl;
  }

  // Add image_url to any replies that have an image_path.
  threadData.replies.forEach((reply: Reply) => {
    if (reply.image_path) {
      const { data: urlData } = supabaseAdmin.storage.from("posts")
        .getPublicUrl(reply.image_path);
      reply.image_url = urlData.publicUrl;
    }
  });

  // 4. Return the modified data, which now correctly includes the 'users' array from the DB.
  return new Response(JSON.stringify(threadData), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function handleDeletePost(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  // 1. Authenticate the user AND check their role. This is a protected action.
  const authHeader = req.headers.get("Authorization")!;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return errorResponse(401, "Unauthorized");
  }

  // Fetch the user's profile to check their role.
  const { data: profile } = await supabaseAdmin.from("profiles").select("role")
    .eq("id", user.id).single();
  if (!profile || !["ADMIN", "MODERATOR"].includes(profile.role)) {
    return errorResponse(
      403,
      "Forbidden: You do not have permission to delete posts.",
    );
  }
  // 2. Extract the post ID from the URL path.
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const postId = parseInt(pathParts[pathParts.length - 1], 10);
  if (isNaN(postId)) {
    return errorResponse(400, "Invalid post ID provided.");
  }

  // 3. CRITICAL NEW STEP: Find all image paths that need to be deleted.
  // We need to find the image for the post itself, AND for all its replies if it's an OP.
  const { data: postsToDelete, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("image_path")
    // Select the post itself OR any of its replies.
    .or(`id.eq.${postId},thread_id.eq.${postId}`)
    // Filter for only those that actually have an image.
    .not("image_path", "is", null);

  if (fetchError) {
    console.error("Error fetching posts to delete:", fetchError);
    return errorResponse(500, "Could not fetch posts for deletion.");
  }

  // 4. CRITICAL NEW STEP: Delete the files from Storage.
  if (postsToDelete && postsToDelete.length > 0) {
    const pathsToDelete = postsToDelete.map((p) => p.image_path);

    // Call the Storage API to remove the files.
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from("posts")
      .remove(pathsToDelete);

    if (storageError) {
      // Log the error but don't necessarily stop. Deleting the DB record is more important.
      console.error(
        "Could not delete one or more storage objects:",
        storageError,
      );
    }
  }

  // 5. Perform the database delete operation.
  // The `ON DELETE CASCADE` will still handle cleaning up replies and mentions.
  const { error: deleteError } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    console.error("Error deleting post from database:", deleteError);
    return errorResponse(500, "Could not delete post.");
  }

  // 6. Return a success response.
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

Deno.serve(createApiHandler(handlePost));
