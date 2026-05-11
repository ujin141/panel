import { NextResponse, type NextRequest } from 'next/server';

const SECRET = process.env.PIN_SESSION_SECRET || 'panel-ai-secret';
const SESSION_VALUE = `authenticated:${SECRET}`;
const COOKIE_NAME = 'panel_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 / 공개 경로는 통과
  const isPublic =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/api/auth/pin') ||
    pathname.startsWith('/api/template-preview') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  // 세션 쿠키 확인
  const session = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = session === SESSION_VALUE;

  // 보호된 페이지/API 경로
  const isProtectedPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/waitlist') ||
    pathname.startsWith('/schedule') ||
    pathname.startsWith('/alerts') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/dm-funnel') ||
    pathname.startsWith('/card-news') ||
    pathname.startsWith('/strategy') ||
    pathname === '/';

  const isProtectedApi =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth');

  // 미인증 → 로그인 페이지로
  if (!isAuthenticated && (isProtectedPage || isProtectedApi)) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 인증된 유저가 /login에 접근 시 대시보드로
  if (isAuthenticated && pathname === '/login') {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
