import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('growth_logs')
      .select('*')
      .eq('user_id', OWNER_ID)
      .order('day_number', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch growth logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('growth_logs')
      .insert([{
        user_id: OWNER_ID,
        day_number: body.day_number,
        title: body.title,
        description: body.description,
        metrics: body.metrics || {},
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create growth log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauth = await requirePinSession();
  if (unauth) return unauth;

  try {
    const supabase = createClient();
    const { id } = await request.json();

    const { error } = await supabase
      .from('growth_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', OWNER_ID);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete growth log' }, { status: 500 });
  }
}
