import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { brandName, category, type = 'custom' } = await req.json();
    
    // 1. 최근 성과 게시물 가져오기
    const supabase = createClient();
    let accountContext = '';
    const unauth = await requirePinSession();
    if (!unauth) {
      const { data: posts } = await supabase
        .from('content_posts')
        .select('content, views, dms')
        .eq('user_id', OWNER_ID)
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
      systemPrompt = `당신은 2026년 한국 숏폼 플랫폼(인스타 릴스·유튜브 쇼츠·틱톡) 트렌드를 실시간으로 분석하는 '메가 트렌드 헌터'입니다.
현재: ${currentDate}.

[${category}] 카테고리에서 지금 가장 폭발적으로 조회수가 터지는 주제 3가지를 추천하세요.
2026년 인기 포맷(POV 공감형·솔직 고백형·숫자 리스트형·반전 폭로형·Before/After형) 중 각 주제에 맞는 포맷도 함께 제안하세요.

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "구체적 숏폼 주제 (예: POV: 요즘 직장인들이 몰래 쓰는 AI 꿀팁)",
      "format": "사용 포맷 (예: POV 공감형)",
      "reason": "지금 이 주제가 알고리즘에서 터지는 이유 (30자)",
      "category": "${category}",
      "estimatedViews": "예상 조회수",
      "viralScore": 95,
      "analysis": "시청자 심리·도파민 포인트 분석 100자"
    }
  ]
}`;
      userPrompt = `카테고리: ${category}\n브랜드: ${brandName || '일반'}`;
    } else {
      systemPrompt = `당신은 2026년 숏폼 알고리즘 최적화 전문가입니다.
현재: ${currentDate}.

[${category}] 카테고리에 맞으면서 현재 알고리즘에서 Retention(시청 지속시간)과 공유가 폭발할 주제 3가지를 추천하세요.

[2026 바이럴 법칙]
• 시청자 결핍(돈·시간·외모·건강·관계) 공략
• 구체적 타겟 설정 (예: "30대 직장인", "자취생 필수", "MBTI I형")
• 2026 포맷 적용: POV 공감형 / 솔직 고백형 / 숫자 리스트형 / 반전 폭로형
${accountContext}

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "구체적 주제 (예: 자취생이 몰래 쓰는 냉장고 정리법 3가지)",
      "format": "추천 포맷",
      "reason": "바이럴 핵심 이유 (30자)",
      "category": "${category}",
      "estimatedViews": "예상 조회수",
      "viralScore": 98,
      "analysis": "Retention과 공유가 터지는 이유 100자"
    }
  ]
}`;
      userPrompt = `브랜드: ${brandName || '일반'}\n카테고리: ${category}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.9,
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
