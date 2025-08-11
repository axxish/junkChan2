// supabase/functions/generate-avatar-upload-url/index.ts (Final Version)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js" // Import SupabaseClient type

// Correct the path if your file is named utils.ts
import {
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

// --- CHANGE 1: Define the Action Type for rate limiting ---
const ACTION_TYPE = 'avatar_upload';
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// --- CHANGE 2: Modify the function signature to accept the injected client ---
async function handleGenerateUrl(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
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


  const avatarPath = `avatars/${user.id}`; 

  // 4. Generate the signed URL with upload options
  const { data, error } = await supabaseAdmin.storage
    .from('avatars')
    .createSignedUploadUrl(avatarPath, {
      upsert: true, 
    });

  if (error) {
    console.error('Error creating signed URL:', error);
    return errorResponse(500, 'Could not create signed URL for upload.');
  }

  // --- CHANGE 3: Log the successful action for future rate-limit checks ---
  await supabaseAdmin.from('action_logs').insert({
    user_id: user.id,
    action_type: ACTION_TYPE,
  });

  // 5. Return a success response.
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

// --- CHANGE 4: Tell the wrapper to enforce rate limiting for this action ---
Deno.serve(createApiHandler(handleGenerateUrl, { actionType: ACTION_TYPE }));