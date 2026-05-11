import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entry_id');

    let query = supabase
      .from('crm_interactions')
      .select('*')
      .eq('user_id', OWNER_ID)
      .order('created_at', { ascending: false });

    if (entryId) query = query.eq('waitlist_entry_id', entryId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('crm_interactions')
      .insert([{
        user_id: OWNER_ID,
        waitlist_entry_id: body.waitlist_entry_id,
        type: body.type,
        content: body.content,
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { id } = await request.json();
    const { error } = await supabase
      .from('crm_interactions')
      .delete()
      .eq('id', id)
      .eq('user_id', OWNER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete interaction' }, { status: 500 });
  }
}
