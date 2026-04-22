import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { brandName, category, type = 'custom' } = await req.json();
    
    const categoryTranslations: Record<string, string> = {
      travel: '여행/맛집',
      beauty: '뷰티/패션',
      finance: '재테크/돈',
      fitness: '운동/다이어트',
      mindset: '자기계발/동기부여',
      food: '요리/레시피',
      it: 'IT/AI/꿀팁',
      daily: '일상/공감'
    };
    const translatedCategory = categoryTranslations[category] || category;
    
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
          { topic: '인스타 떡상하는 상위 1% 카드뉴스 템플릿', reason: '실무자들이 환장하고 저장하는 레퍼런스입니다.', category: '정보/꿀팁', estimatedViews: '15만~30만', viralScore: 95, analysis: '마케터들의 실무 갈증을 해소하는 템플릿 제공으로 무한 공유가 일어납니다.' },
          { topic: '마케터라면 무조건 알아야 할 AI 툴 5가지', reason: '저장과 공유가 폭발적으로 일어나는 주제입니다.', category: '정보/꿀팁', estimatedViews: '5만~10만', viralScore: 88, analysis: '최신 AI 정보에 뒤쳐지기 싫은 심리를 자극하여 저장 버튼을 누르게 만듭니다.' },
          { topic: '초보 사장님을 위한 세금 폭탄 피하는 법', reason: '결핍과 공포를 자극하여 클릭률이 극대화됩니다.', category: '정보/꿀팁', estimatedViews: '20만~50만', viralScore: 98, analysis: '돈과 직결된 공포 마케팅으로 타겟층의 도파민을 강력하게 자극합니다.' }
        ]
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    if (type === 'viral') {
      systemPrompt = `당신은 대한민국 인스타그램 카드뉴스 트래픽을 폭발시키는 '메가 트렌드 헌터'입니다.
현재 시간은 ${currentDate} (2026년) 입니다. 
과거(2023년 등)의 트렌드는 절대 언급하지 마세요. 현재 2026년 최신 인스타그램 탐색탭에서 **[${translatedCategory}]** 분야를 중심으로, 가장 조회수와 저장이 폭발적으로 터지고 있는 글로벌/국내 실시간 카드뉴스 주제 3가지를 추천해 주세요.
반드시 **[${translatedCategory}]** 카테고리에 맞는 주제여야 하며, 대중의 도파민을 자극하고 무조건 '저장(Save)' 버튼을 누를 수밖에 없는 압도적인 주제여야 합니다.

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "제안하는 떡상 카드뉴스 주제 (예: 99%가 모르는 카카오톡 숨겨진 기능 5가지)",
      "reason": "왜 이 주제가 지금 트래픽이 폭발하는지 핵심 이유 (30자 이내)",
      "category": "${category}",
      "estimatedViews": "예상 조회수 (예: 10만~30만)",
      "viralScore": 95,
      "analysis": "어떤 심리적 트리거(공포, 이득, 호기심 등)가 작동하며, 알고리즘이 어떻게 타겟층에게 도달시킬지 100자 이내로 구체적으로 분석"
    }
  ]
}`;
      userPrompt = `타겟 카테고리: ${translatedCategory}\n브랜드명: ${brandName || '일반 계정'} (참고만 하고 무조건 트래픽 터지는 트렌드로 추천해라)`;
    } else {
      systemPrompt = `당신은 저장과 공유를 무조건 10배 이상 터뜨리는 인스타그램 카드뉴스 기획의 신입니다.
현재 시간은 ${currentDate} (2026년) 입니다. 과거의 낡은 트렌드 대신 2026년 현재 먹히는 최신 정보만 다루세요.
사용자의 브랜드명, 기존 성과 데이터, 그리고 요청된 **[${translatedCategory}]** 분야에 가장 잘 맞으면서 현재 인스타 알고리즘 트렌드에서 무조건 트래픽이 폭발할 카드뉴스 주제 3가지를 추천해 주세요.

[초극강 바이럴 최적화 법칙]
1. 시청자의 결핍(돈, 시간, 외모, 건강)을 강하게 건드릴 것.
2. 강력한 호기심 유발 (예: "99%가 모르는", "절대 하면 안 되는", "10년차 전문가가 숨기는")
3. 리스트형태 (예: "~하는 법 5가지", "BEST 3") - 카드뉴스는 무조건 리스트형이 저장이 많이 일어납니다.

응답 형식 (JSON):
{
  "recommendations": [
    {
      "topic": "제안하는 구체적인 카드뉴스 주제 (예: 30대 직장인 뱃살 2주 컷 현실 식단 BEST 5)",
      "reason": "왜 이 주제가 저장이 폭발할 수밖에 없는지 심리학적 분석 (30자 이내)",
      "category": "${category}",
      "estimatedViews": "예상 조회수 (예: 50만~100만)",
      "viralScore": 98,
      "analysis": "현재 ${translatedCategory} 시장의 트렌드와 결합하여 어떤 타겟층이 왜 열광할 수밖에 없는지 100자 이내로 상세하게 분석"
    }
  ]
}`;
      userPrompt = `브랜드명: ${brandName || '일반 계정'}\n타겟 카테고리: ${translatedCategory}\n${accountContext}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    
    return NextResponse.json({ recommendations: parsed.recommendations || [] });
  } catch (error: any) {
    console.error('Trend recommend error:', error);
    return NextResponse.json({ error: error.message || '주제 추천 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
