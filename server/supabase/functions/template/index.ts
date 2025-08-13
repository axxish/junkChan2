// supabase/functions/create-user/index.ts (v5 - Abstracted)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js";
import { createApiHandler, CORS_HEADERS, createAdminClient,
  errorResponse
} from "../_shared/util.ts";

export async function fnName(req: Request): Promise<Response> {

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables.");
    }
    


  let adminClient = createClient(supabaseUrl, supabaseServiceKey);
  let result = adminClient.from('tests').select("*").eq("key", "Marco").maybeSingle();
  const { data, error } = await result;
  if (error) {
    console.error("Error fetching data:", error);
    return errorResponse(500, "Internal Server Error");
  }
  console.log("Data fetched successfully:", data);
  return new Response(JSON.stringify(data), { status: 200, headers: CORS_HEADERS });
}

//Deno.serve(createApiHandler(fnName));
Deno.serve(fnName)