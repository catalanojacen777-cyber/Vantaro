import { NextResponse, type NextRequest } from 'next/server';

/**
 * Forward the requested path so server layouts can build an accurate
 * "return to" link when a session has expired. Authorization itself happens
 * in each layout and route handler, never here.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/app/:path*'] };
