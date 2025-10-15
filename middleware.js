import { NextResponse } from 'next/server';

export function middleware(request) {
  // Ищем cookie сессии, которую Appwrite устанавливает автоматически
  const session = request.cookies.get('a_session_' + process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Если сессии нет, а пользователь пытается зайти не на страницу логина
  if (!session && !isLoginPage) {
    // Отправляем его на /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если сессия есть, а пользователь зашел на /login
  if (session && isLoginPage) {
    // Отправляем его в админку (на главную)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // В остальных случаях ничего не делаем
  return NextResponse.next();
}

// Указываем, на каких путях должен работать middleware (на всех, кроме системных файлов)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};