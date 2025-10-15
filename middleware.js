import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('session');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Если нет сессии и не страница логина
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если есть сессия и пытается зайти на логин
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)'],
};