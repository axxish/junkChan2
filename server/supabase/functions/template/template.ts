import {
  errorResponse,
} from '../_shared/util.ts'


export async function fnName(req: Request): Promise<Response> {
  return errorResponse(400, 'This is just a template function');
}