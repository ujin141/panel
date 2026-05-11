import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: '이름은 필수입니다' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert([{
        user_id: OWNER_ID,
        name: body.name.trim().slice(0, 100),
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
    console.error('Waitlist POST error:', (error as any)?.code || 'unknown');
    return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { id, ...updates } = await request.json();

    const { data, error } = await supabase
      .from('waitlist_entries')
      .update(updates)
      .eq('id', id)
      .eq('user_id', OWNER_ID)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Waitlist PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
