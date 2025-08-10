// supabase/functions/generate-avatar-upload-url/index.ts (v2 - Production Ready)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js"

import {
  createAdminClient,
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'


const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];






async function handleGenerateUrl(req: Request): Promise<Response> {
  // 1. Authenticate the user
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

  // 2. Get and VALIDATE the file type declared by the client
  const { fileType } = await req.json();

  if (!fileType) {
    return errorResponse(400, 'Bad Request: "fileType" is required.');
  }
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    return errorResponse(400, `Bad Request: File type "${fileType}" is not allowed.`);
  }

  // 3. Define the secure path and create the admin client
  const avatarPath = `${user.id}`; // remove the extension for flexibility
  const supabaseAdmin = createAdminClient();

  // 4. Generate the signed URL with upload options
  const { data, error } = await supabaseAdmin.storage
    .from('avatars')
    .createSignedUploadUrl(avatarPath, {
      // `upsert: true` means it will overwrite an existing file at the same path.
      upsert: true, 
    });

  if (error) {
    console.error('Error creating signed URL:', error);
    return errorResponse(500, 'Could not create signed URL for upload.');
  }

  // 5. Return a slightly modified response object.
  // We need to tell the frontend what Content-Type header it MUST use.
  const responseData = {
    ...data,
    requiredHeaders: {
      'Content-Type': fileType
    }
  };

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(createApiHandler(handleGenerateUrl));