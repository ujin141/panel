import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get recent posts
    const { data: posts, error: postsError } = await supabase
      .from('content_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    let totalViews = 0;
    let totalDms = 0;

    // 2. Simulate traffic for posts that have 0 views
    for (const post of posts || []) {
      if (post.views === 0) {
        // Base random traffic
        let baseViews = Math.floor(Math.random() * 3000) + 500; // 500 to 3500 views
        let baseDms = Math.floor(baseViews * (Math.random() * 0.03 + 0.005)); // 0.5% to 3.5% conversion

        // Type modifiers
        if (post.type === 'scarcity') {
          baseDms = Math.floor(baseViews * (Math.random() * 0.02 + 0.025)); // 2.5% to 4.5% conversion
        } else if (post.type === 'curiosity') {
          baseViews = Math.floor(baseViews * 1.5); // 50% more views
          baseDms = Math.floor(baseViews * (Math.random() * 0.01 + 0.02)); // 2.0% to 3.0% conversion
        }

        const updates = { views: baseViews, dms: baseDms, comments: Math.floor(baseDms / 3) };

        await supabase
          .from('content_posts')
          .update(updates)
          .eq('id', post.id);

        totalViews += baseViews;
        totalDms += baseDms;
      } else {
        totalViews += post.views;
        totalDms += post.dms;
      }
    }

    // 3. Update or create today's growth_metrics
    const today = new Date().toISOString().split('T')[0];
    const { data: existingMetric } = await supabase
      .from('growth_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    let newViews = (existingMetric?.views || 0) + Math.floor(Math.random() * 500) + 100;
    let newDms = (existingMetric?.dms || 0) + Math.floor(Math.random() * 20) + 5;
    let newWaitlist = (existingMetric?.waitlist_count || 0) + Math.floor(Math.random() * 5);

    if (existingMetric) {
      await supabase
        .from('growth_metrics')
        .update({ views: newViews, dms: newDms, waitlist_count: newWaitlist })
        .eq('id', existingMetric.id);
    } else {
      await supabase
        .from('growth_metrics')
        .insert({
          user_id: user.id,
          date: today,
          views: newViews,
          dms: newDms,
          waitlist_count: newWaitlist,
          installs: Math.floor(newWaitlist * 0.3)
        });
    }

    // 4. Alert Threshold Check
    // Get thresholds
    const { data: thresholds } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const checkThresholds = thresholds?.length ? thresholds : [
      { metric: 'dmRate', min_value: 2.0 }
    ];

    const currentDmRate = totalViews > 0 ? (totalDms / totalViews) * 100 : 0;

    for (const t of checkThresholds) {
      if (t.metric === 'dmRate' && currentDmRate < t.min_value && currentDmRate > 0) {
        // Create an alert
        await supabase
          .from('growth_alerts')
          .insert({
            user_id: user.id,
            title: 'DM 전환율 하락 감지',
            description: `평균 DM 전환율이 ${currentDmRate.toFixed(2)}%로, 목표치인 ${t.min_value}%보다 낮습니다.`,
            severity: 'warning',
            status: 'active',
            metric: 'DM 전환율',
            threshold: t.min_value,
            current_value: parseFloat(currentDmRate.toFixed(2)),
            action_suggestion: '희소성을 자극하는(수량 한정, 마감 임박) 훅(Hook)을 전면 배치해보세요.'
          });
      }
    }

    return NextResponse.json({ success: true, message: 'Simulation completed successfully.' });

  } catch (error: any) {
    console.error('Simulator error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run simulator' }, { status: 500 });
  }
}
