import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECRET = process.env.PIN_SESSION_SECRET || 'panel-ai-secret';
const SESSION_VALUE = `authenticated:${SECRET}`;
const COOKIE_NAME = 'panel_session';

/**
 * API Route에서 PIN 세션을 확인하는 헬퍼.
 * 인증 실패 시 401 NextResponse를 반환, 성공 시 null 반환.
 * 
 * 사용법:
 * const unauth = await requirePinSession();
 * if (unauth) return unauth;
 */
export async function requirePinSession(): Promise<NextResponse | null> {
  const cookieStore = cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;

  if (session !== SESSION_VALUE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

/**
 * 나 혼자 쓰는 앱용 고정 owner ID.
 * DB 쿼리의 user_id 필터로 사용.
 * .env.local의 OWNER_ID 값을 사용하거나 기본값 'owner' 사용.
 */
export const OWNER_ID = process.env.OWNER_ID || 'panel-owner';
