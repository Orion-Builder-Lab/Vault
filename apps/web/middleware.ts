import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextMiddleware, NextRequest } from 'next/server';

const middleware = auth((req: NextRequest & { auth: unknown }) => {
  const isLoggedIn = !!(req as { auth?: { user?: unknown } }).auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith('/login');
  const isApiAuth = pathname.startsWith('/api/auth');
  const isPublic = isAuthPage || isApiAuth;

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}) as NextMiddleware;

export default middleware;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
