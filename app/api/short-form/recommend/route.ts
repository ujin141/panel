import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { brandName, category, type = 'custom' } = await req.json();
    
    // 1. Supabase에서 사용자의 최근 성과 게시물 가져오기
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let accountContext = '';
    
    if (user) {
      const { data: posts } = await supabase
        .from('content_posts')
        .select('content, views, dms')
        .eq('user_id', user.id)
        .order('views', { ascending: false })
        .limit(5);
        
      if (posts && posts.length > 0) {
        accountContext = `
[우리 계정 최근 우수 게시물 성과]
${posts.map(p => `- 내용: ${p.content.split('|||')[0]}\n  조회수: ${p.views}, 전환수: ${p.dms}`).join('\n')}
`;
      }
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({
        recommendations: [
          { topic: '다이어트 성공하는 현실 식단', reason: '최근 조회수 폭발하는 직장인 공감형 키워드입니다.', category: '정보/꿀팁', estimatedViews: '30만~50만', viralScore: 92, analysis: '바쁜 직장인들의 결핍인 시간과 건강을 동시에 건드려 시청 지속시간이 매우 길게 나옵니다.' },
          { topic: '요즘 뜨는 성수동 숨은 핫플', reason: '검색량이 급증하고 있는 트렌드 키워드입니다.', category: '브이로그/일상', estimatedViews: '15만~25만', viralScore: 85, analysis: '데이트 코스를 찾는 2030 세대의 공유가 5배 이상 터지는 위치 기반 떡상 아이템입니다.' },
          { topic: '월 100만원 부수입 만드는 법', reason: '저장과 공유가 무조건 일어나는 킬러 주제입니다.', category: '정보/꿀팁', estimatedViews: '50만~100만', viralScore: 99, analysis: '모든 사람의 근원적 결핍인 돈을 타격하며, 무조건 다시 보기 위해 저장 버튼을 누릅니다.' }
        ]
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    if (type === 'viral') {
      systemPrompt = `당신은 대한민국 인스타그램 릴스 및 유튜브 쇼츠 트렌드를 완벽하게 분석하는 '메가 트렌드 헌터'입니다.
현재 시간은 ${currentDate} (2026년) 입니다. 과거 낡은 트렌드 말고, 현재 2026년 최신 숏폼 플랫폼에서 **[${category}]** 분야를 중심으로 가장 조회수가 폭발적으로 터지고 있는 무조건 떡상하는 실시간 메가 트렌드 주제 3가지를 추천해 주세요.
반드시 **[${category}]** 카테고리에 맞는 주제여야 하며, 대중들이 가장 열광하는 자극적이고 도파민 터지는 주제여야 합니다.

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "제안하는 떡상 숏폼 주제 (예: 99%가 모르는 카카오톡 숨겨진 기능)",
      "reason": "왜 이 주제가 지금 조회수가 터지고 있는지 트렌드 분석 (30자 이내)",
      "category": "${category}",
      "estimatedViews": "예상 조회수 (예: 30만~100만)",
      "viralScore": 95,
      "analysis": "숏폼 알고리즘 관점에서 왜 터질 수밖에 없는지, 시청자들의 어떤 도파민을 자극하는지 100자 이내로 상세하게 분석"
    }
  ]
}`;
      userPrompt = `타겟 카테고리: ${category}\n브랜드명: ${brandName || '일반 계정'} (참고만 하고 무조건 조회수 터지는 트렌드로 추천해라)`;
    } else {
      systemPrompt = `당신은 조회수 100만을 무조건 터뜨리는 인스타그램 릴스/유튜브 쇼츠 콘텐츠 기획의 신입니다.
현재 시간은 ${currentDate} (2026년) 입니다. 최신 2026년 데이터를 기반으로, 사용자의 브랜드명, 기존 성과 데이터, 그리고 요청된 **[${category}]** 카테고리에 가장 잘 맞으면서 현재 숏폼 알고리즘 트렌드에서 무조건 조회수가 폭발할 주제 3가지를 추천해 주세요.

[초극강 바이럴 최적화 법칙]
1. 시청자의 결핍(돈, 시간, 외모, 건강)을 건드릴 것.
2. 강력한 호기심 유발 (예: "99%가 모르는", "절대 하면 안 되는", "의사들도 숨기는")
3. 구체적인 타겟팅 (예: "30대 직장인", "자취생")

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "제안하는 구체적인 숏폼 주제 (예: 30대 직장인 뱃살 2주 컷 현실 식단)",
      "reason": "왜 이 주제가 조회수가 폭발할 수밖에 없는지 핵심 요약 (30자 이내)",
      "category": "${category}",
      "estimatedViews": "예상 조회수 (예: 50만~100만)",
      "viralScore": 98,
      "analysis": "현재 ${category} 시장의 숏폼 트렌드와 결합하여 시청 지속시간(Retention)과 공유가 왜 터질지 100자 이내로 상세하게 분석"
    }
  ]
}`;
      userPrompt = `브랜드명: ${brandName || '일반 계정'}\n타겟 카테고리: ${category}\n${accountContext}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json({ recommendations: parsed.recommendations || [] });
  } catch (error: any) {
    console.error('Trend recommend error:', error);
    return NextResponse.json({ error: error.message || '주제 추천 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
