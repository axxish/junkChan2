// supabase/functions/create-user/index.ts (v5 - Abstracted)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import{
  createApiHandler
} from '../_shared/util.ts'
import{
  fnName
}from '../template/template.ts'


Deno.serve(createApiHandler(fnName));