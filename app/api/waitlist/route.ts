import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    // ✅ 인증 확인 (기존에 누락되어 있었음 - 보안 수정)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // 입력값 검증
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: '이름은 필수입니다' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert([{
        user_id: user.id,  // 클라이언트 body.user_id 사용 금지 → 서버 검증 유저 ID 강제
        name: body.name.trim().slice(0, 100),              // 길이 제한
        instagram_id: body.instagram_id?.trim().slice(0, 50) || null,
        gender: body.gender || null,
        interests: Array.isArray(body.interests) ? body.interests.slice(0, 10) : [],
        status: 'pending',
        tags: [],
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    // ✅ 에러 상세 내용 노출 금지 — DB 테이블/쿼리 정보 숨김
    console.error('Waitlist POST error:', (error as any)?.code || 'unknown');
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...updates } = await request.json();

    const { data, error } = await supabase
      .from('waitlist_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Waitlist PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
