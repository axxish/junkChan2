// supabase/functions/generate-post-upload-url/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import {
  createAdminClient,
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("generate-post-upload-url function initialized");

// This helper is simple and doesn't need to be wrapped.
async function handleGeneratePostUrl(req: Request): Promise<Response> {
  // We don't need to validate the user, but we do need the file type.
  const { fileType } = await req.json();
  if (!['image/png', 'image/jpeg', 'image/gif'].includes(fileType)) {
    return errorResponse(400, `Bad Request: File type "${fileType}" is not allowed.`);
  }

  // Generate a unique path for the image to prevent collisions.
  const imagePath = `posts/${crypto.randomUUID()}`;

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.storage
    .from('posts') // Upload to a 'posts' bucket
    .createSignedUploadUrl(imagePath, { upsert: false }); // upsert: false prevents overwriting
  if (error) {
    console.error('Error creating post upload URL:', error);
    return errorResponse(500, 'Could not create signed URL for post upload.');
  }
  
  // As before, we return the data and the required header for the frontend.
  const responseData = { ...data, requiredHeaders: { 'Content-Type': fileType } };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(createApiHandler(handleGeneratePostUrl));