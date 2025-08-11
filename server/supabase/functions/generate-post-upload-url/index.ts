// supabase/functions/generate-post-upload-url/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { SupabaseClient } from "jsr:@supabase/supabase-js" // Import SupabaseClient type
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("generate-post-upload-url function initialized");

// Define the action type for our declarative rate limiting
const ACTION_TYPE = 'anon_post_upload';
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

async function handleGeneratePostUrl(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  // 1. Validate Input
  const { fileType } = await req.json();
  if (!fileType) {
    return errorResponse(400, 'Bad Request: "fileType" is required.');
  }
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    return errorResponse(400, `Bad Request: File type "${fileType}" is not allowed.`);
  }

  // 2. Business Logic: Generate a unique path and the signed URL
  // A UUID ensures no filename collisions. We append the file extension for clarity.
  const fileExt = fileType.split('/')[1];
  const imagePath = `posts/${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabaseAdmin.storage
    .from('posts')
    .createSignedUploadUrl(imagePath, {
      // upsert: false is important to ensure we don't accidentally overwrite another random file.
      upsert: false, 
    });

  if (error) {
    console.error('Error creating post upload URL:', error);
    return errorResponse(500, 'Could not create signed URL for post upload.');
  }

  // 3. Log the successful action for rate limiting.
  // Since this is an anonymous endpoint, we log the IP address.
  const ip = req.headers.get('x-forwarded-for')?.split(',').shift()?.trim();
  await supabaseAdmin.from('action_logs').insert({
    ip_address: ip, // Log the IP instead of a user_id
    action_type: ACTION_TYPE,
  });

  // 4. Return the success response
  const responseData = { ...data, requiredHeaders: { 'Content-Type': fileType } };
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// Activate the handler with our declarative rate limiting.
// The wrapper will automatically use the IP address since the user is not authenticated.
Deno.serve(createApiHandler(handleGeneratePostUrl, { actionType: ACTION_TYPE }));