import { NextRequest, NextResponse } from 'next/server';

const PIN = process.env.APP_PIN!;
const SECRET = process.env.PIN_SESSION_SECRET || 'panel-ai-secret';
const SESSION_VALUE = `authenticated:${SECRET}`;
const COOKIE_NAME = 'panel_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7일

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN이 필요합니다.' }, { status: 400 });
    }

    if (pin !== PIN) {
      // 잠깐의 딜레이로 브루트포스 방지
      await new Promise(r => setTimeout(r, 500));
      return NextResponse.json({ error: '핀 번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // 인증 성공 → 세션 쿠키 발급
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    return res;
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE() {
  // 로그아웃
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return res;
}
