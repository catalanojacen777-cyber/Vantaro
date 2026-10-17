import { errorResponse, requireSameOrigin } from '@/lib/security/request';

type Handler<C> = (req: Request, ctx: C) => Promise<Response> | Response;

/** Wrap a route handler: same-origin check for writes and uniform errors. */
export function handle<C = unknown>(fn: Handler<C>, opts: { allowCrossOrigin?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (!opts.allowCrossOrigin && req.method !== 'GET' && req.method !== 'HEAD') requireSameOrigin(req);
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
