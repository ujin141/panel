import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ⚠️ 반드시 getUser()로 세션 검증 (토큰 검증 포함)
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /dashboard/* 및 /api/* 라우트는 인증 필요
  const isProtectedPage = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/content') ||
    pathname.startsWith('/waitlist') ||
    pathname.startsWith('/schedule') ||
    pathname.startsWith('/alerts') ||
    pathname.startsWith('/crm') ||
    pathname.startsWith('/dm-funnel') ||
    pathname.startsWith('/card-news') ||
    pathname.startsWith('/strategy');

  const isProtectedApi = pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth'); // auth 엔드포인트 제외

  // 미인증 유저 → 로그인 페이지로 리다이렉트
  if (!user && isProtectedPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';  // (auth) 그룹 → 실제 URL은 /login
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 미인증 API 호출 → 401 반환 (미들웨어 레벨 차단)
  if (!user && isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 이미 로그인한 유저가 auth 페이지 접근 시 대시보드로
  if (user && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
