import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

// 안전한 에러 로깅 — DB 내부 정보 노출 방지
function safeLog(label: string, error: unknown) {
  const e = error as any;
  console.error(label, {
    code: e?.code,
    status: e?.status,
    // message는 개발 환경에서만 출력
    ...(process.env.NODE_ENV === 'development' && { message: e?.message }),
  });
}

export async function GET() {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('growth_alerts')
      .select('*')
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    safeLog('Alerts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();

    const { id, status } = await request.json();

    // 허용된 상태값만 수락
    if (!['resolved', 'snoozed', 'active'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('growth_alerts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', OWNER_ID)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    safeLog('Alerts PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
