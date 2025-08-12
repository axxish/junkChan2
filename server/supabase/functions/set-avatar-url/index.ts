// supabase/functions/set-avatar-url/index.ts (v4 - Final, using getPublicUrl)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js"

import {
  createAdminClient,
  errorResponse,
  createApiHandler,
  CORS_HEADERS
} from '../_shared/util.ts'

console.log("set-avatar-url function initialized (v4 - Final)");

async function handleSetAvatarUrl(req: Request): Promise<Response> {
  // 1. Authenticate the user.
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

  // 2. Parse and Validate Input.
  const { avatarPath } = await req.json();
  if (!avatarPath || typeof avatarPath !== 'string' || !avatarPath.startsWith('avatars/')) {
    return errorResponse(400, 'Bad Request: A valid "avatarPath" is required.');
  }

  // 3. THE CRITICAL SECURITY CHECK: Enforce Path Ownership
  const pathOwnerId = avatarPath.split('/')[1];
  if (user.id !== pathOwnerId) {
    return errorResponse(403, 'Forbidden: You do not have permission to set this avatar path.');
  }

  // 4. THE FIX: Construct the public URL using the built-in helper.
  const supabaseAdmin = createAdminClient();
  const { data: urlData } = supabaseAdmin
    .storage
    .from('avatars') // The bucket name
    .getPublicUrl(avatarPath); // The path to the file

  const fullAvatarUrl = urlData.publicUrl;
  // 5. Perform the database update.
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      avatar_url: fullAvatarUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Set avatar URL error:', updateError);
    return errorResponse(500, 'Could not update user profile with avatar URL.');
  }

  // 6. Return a success response.
  return new Response(JSON.stringify({ message: "Avatar URL set successfully." }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(createApiHandler(handleSetAvatarUrl));