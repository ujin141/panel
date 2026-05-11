import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('scheduled_posts')
      .select('*')
      .eq('user_id', OWNER_ID)
      .order('scheduled_at', { ascending: true });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert([{
        user_id: OWNER_ID,
        platform: body.platform,
        content: body.content,
        content_type: body.content_type || 'curiosity',
        scheduled_at: body.scheduled_at || null,
        status: body.scheduled_at ? 'scheduled' : 'draft',
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { id, ...updates } = await request.json();

    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', OWNER_ID)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { id } = await request.json();
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', OWNER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
