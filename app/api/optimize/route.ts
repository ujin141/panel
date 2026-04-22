import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. 데이터 수집 (최근 게시물, 메트릭, 알림)
    const { data: posts } = await supabase
      .from('content_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: metrics } = await supabase
      .from('growth_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7);

    // 2. 데이터 가공 (프론트엔드 차트용)
    // 2.1 유형별 성과
    const typeStats: Record<string, { views: number, dms: number, count: number }> = {};
    const topPosts = [];
    
    for (const p of posts || []) {
      const t = p.type || '일반';
      
      const contentParts = (p.content || '').split('|||');
      const actualContent = contentParts[0];
      const postUrl = contentParts[1] || '';

      if (!typeStats[t]) typeStats[t] = { views: 0, dms: 0, count: 0 };
      typeStats[t].views += p.views || 0;
      typeStats[t].dms += p.dms || 0;
      typeStats[t].count += 1;

      if ((p.views || 0) > 0) {
        topPosts.push({
          id: p.id,
          content: actualContent,
          url: postUrl,
          type: t,
          platform: p.platform,
          views: p.views,
          dms: p.dms,
          dmRate: parseFloat(((p.dms / p.views) * 100).toFixed(2))
        });
      }
    }

    topPosts.sort((a, b) => b.dmRate - a.dmRate); // 전환율 높은 순

    const contentTypeData = Object.keys(typeStats).map(t => {
      const stat = typeStats[t];
      const rate = stat.views > 0 ? (stat.dms / stat.views) * 100 : 0;
      return {
        type: t === 'scarcity' ? '희소성형' : t === 'curiosity' ? '호기심 유도형' : t === 'emotion' ? '감정 자극형' : t,
        dmRate: parseFloat(rate.toFixed(2)),
        views: stat.views,
        color: t === 'scarcity' ? '#f97316' : t === 'curiosity' ? '#3b82f6' : '#a855f7'
      };
    }).sort((a, b) => b.dmRate - a.dmRate);

    // 2.2 시간대 데이터는 하드코딩을 제거하고 AI가 동적으로 생성하도록 비워둡니다.
    // 2.3 전체 평균
    let totalViews = 0, totalDms = 0;
    (metrics || []).forEach(m => { totalViews += m.views; totalDms += m.dms; });
    const avgDmRate = totalViews > 0 ? (totalDms / totalViews) * 100 : 0;

    // 3. OpenAI 분석 요청
    const targetAccount = (posts && posts.length > 0) ? posts[0].target || '분석된 계정' : '분석된 계정';

    const promptData = {
      accountName: `@${targetAccount}`,
      avgDmRate,
      topPosts: topPosts.slice(0, 3).map(p => ({ content: p.content.substring(0, 100), type: p.type, dmRate: p.dmRate })),
      typePerformance: contentTypeData
    };

    let aiSuggestions = [];
    let aiTargets = [];
    let aiTimeData = [];
    let aiBestTime = "분석 중...";

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `당신은 최정상급 인스타그램 퍼포먼스 마케팅 AI 에이전트입니다. 
당신이 현재 분석하고 있는 타겟 계정은 "${promptData.accountName}" 입니다.
주어진 이 계정의 실제 성과 데이터와 게시물을 딥 분석하여, 이 계정(@${targetAccount})만의 브랜드 특성과 틈새시장에 완전히 맞춰진 초개인화된 4가지를 JSON으로 반환하세요.

1. suggestions: 이 계정만을 위한 3개의 구체적이고 실전적인 개선 전략
2. targets: 이 계정이 공략해야 할 3개의 핵심 타겟층
3. timeData: 이 계정의 타겟 고객들이 가장 활발한 8개의 시간대별 성과 흐름 (time은 '7시', '9시', '11시', '13시', '15시', '18시', '20시', '22시', rate는 0.5~5.0 사이의 수치)
4. bestTime: 위 timeData 중 가장 rate가 높은 최적 발행 시간 문자열 (예: "오후 6시 (예상)")

형식:
{
  "suggestions": [ { "id": "1", "insight": "...", "suggestion": "...", "priority": "high", "type": "..." } ],
  "targets": [ { "segment": "...", "score": 95, "reason": "..." } ],
  "timeData": [ { "time": "7시", "rate": 1.2 } ],
  "bestTime": "오후 6시 (예상)"
}`
            },
            {
              role: 'user',
              content: JSON.stringify(promptData)
            }
          ]
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');
        aiSuggestions = result.suggestions || [];
        aiTargets = result.targets || [];
        aiTimeData = result.timeData || [];
        aiBestTime = result.bestTime || "오후 6시 (예상)";
      } catch (aiErr) {
        console.error('OpenAI Error:', aiErr);
      }
    }

    // Fallback if AI fails or no key
    if (aiSuggestions.length === 0) {
      aiSuggestions = [{ id: '1', insight: '데이터 부족', suggestion: '시뮬레이터를 돌려보세요.', priority: 'medium', type: '안내' }];
      aiTargets = [{ segment: '20대 여성', score: 90, reason: '일반적인 타겟' }];
    }
    if (aiTimeData.length === 0) {
      aiTimeData = [
        { time: '7시', rate: 1.2 }, { time: '9시', rate: 2.9 }, { time: '11시', rate: 2.1 },
        { time: '13시', rate: 1.8 }, { time: '15시', rate: 1.5 }, { time: '18시', rate: 2.7 },
        { time: '20시', rate: 2.4 }, { time: '22시', rate: 1.9 },
      ];
    }

    return NextResponse.json({
      data: {
        overview: {
          avgDmRate: avgDmRate.toFixed(2),
          topType: contentTypeData[0]?.type || '-',
          topTypeRate: contentTypeData[0]?.dmRate || 0,
          bestTime: aiBestTime
        },
        contentTypeData,
        timeData: aiTimeData,
        topPosts: topPosts.slice(0, 3),
        suggestions: aiSuggestions,
        targets: aiTargets
      }
    });

  } catch (error: any) {
    console.error('Optimize API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze' }, { status: 500 });
  }
}
