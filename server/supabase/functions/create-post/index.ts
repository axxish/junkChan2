// supabase/functions/create-post/index.ts (Aligned with DB Config)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js";
import {
  checkRateLimit,
  CORS_HEADERS,
  createApiHandler,
  errorResponse,
} from "../_shared/util.ts";

console.log("create-post function initialized (DB-Aligned)");

// --- CHANGE 1: Use the exact action names from your app_config table ---
const ACTION_TYPES = {
  POST_ANON: "anon_create_post",
  POST_AUTH: "auth_create_post",
};

async function handleCreatePost(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<Response> {
  // 1. Parse all possible parameters from the request body.
  const { boardSlug, threadId, imagePath, comment, subject } = await req.json();

  const isReply = !!threadId;
  const isThread = !isReply;

  // 2. Initial Validation
  if (!boardSlug && !threadId) {
    return errorResponse(
      400,
      'Bad Request: A post must have either a "boardSlug" or a "threadId".',
    );
  }
  if (boardSlug && !imagePath) {
    return errorResponse(
      400,
      "Bad Request: An image is required to create a new thread.",
    );
  }

  if (isThread && (!subject || subject.trim().length === 0)) {
    return errorResponse(
      400,
      "Bad Request: Thread title (subject) is required for new threads.",
    );
  }
  // NEW: Prevent sending a subject when creating a reply
  if (isReply && subject) {
    return errorResponse(
      400,
      "Bad Request: Replies cannot have a subject/title.",
    );
  }

  // 3. Determine user authentication status.
  const authHeader = req.headers.get("Authorization");
  let userId: string | undefined;
  if (authHeader) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  }
  const isAuth = !!userId;

  // 4. DYNAMIC RATE LIMITING: Check the limit based on auth status.

  const actionType = isAuth ? ACTION_TYPES.POST_AUTH : ACTION_TYPES.POST_ANON;
  const ip = req.headers.get("x-forwarded-for")?.split(",").shift()?.trim();

  const { error: rateLimitError } = await checkRateLimit(supabaseAdmin, {
    actionType: actionType,
    userId: userId,
    ip: ip,
  });
  if (rateLimitError) return rateLimitError;

  // 5. Call the unified database RPC.
  const { data, error } = await supabaseAdmin.rpc("create_post2", {
    p_board_slug: boardSlug,
    p_thread_id: threadId,
    p_image_path: imagePath,
    p_comment: comment,
    p_user_id: userId,
    p_poster_ip: isAuth ? null : ip,
    p_subject: subject,
  });

  if (error) {
    if (error.message.includes("not found")) {
      return errorResponse(404, error.message);
    }
    if (error.code === "23505") {
      return errorResponse(
        409,
        "Conflict: This image has already been used to start a thread.",
      );
    }
    return errorResponse(500, "Could not create post.");
  }

  // 6. Log the successful action.
  await supabaseAdmin.from("action_logs").insert({
    user_id: userId,
    ip_address: ip,
    action_type: actionType, // Use the same simplified actionType
  });

  // 7. Format and return the success response.
  const newPost = data[0].j;
  let responseData = { ...newPost };
  if (newPost.image_path) {
    const { data: urlData } = supabaseAdmin.storage.from("posts").getPublicUrl(
      newPost.image_path,
    );
    responseData = { ...responseData, image_url: urlData.publicUrl };
    delete responseData.image_path;
  }

  return new Response(JSON.stringify(responseData), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// The Deno.serve call is simple and clean.
Deno.serve(createApiHandler(handleCreatePost));
