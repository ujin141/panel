import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── 실시간 Google News 수집 ──────────────────────────────────────────────────
async function fetchLiveNews(query: string): Promise<string[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    const titles: string[] = [];
    const r1 = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    let m: RegExpExecArray | null;
    while ((m = r1.exec(xml)) !== null && titles.length < 12) {
      titles.push(m[1].trim());
    }
    if (titles.length === 0) {
      const r2 = /<title>(.*?)<\/title>/g;
      let skip = 0;
      while ((m = r2.exec(xml)) !== null && titles.length < 12) {
        if (skip++ < 1) continue;
        titles.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim());
      }
    }
    return titles;
  } catch {
    return [];
  }
}

// ── Google Trends ────────────────────────────────────────────────────────────
async function fetchGoogleTrends(): Promise<string[]> {
  try {
    const url = 'https://trends.google.com/trends/hottrends/atom/feed?pn=p73';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    const titles: string[] = [];
    const r = /<title>(.*?)<\/title>/g;
    let m: RegExpExecArray | null;
    let skip = 0;
    while ((m = r.exec(xml)) !== null && titles.length < 15) {
      if (skip++ < 1) continue;
      titles.push(m[1].replace(/&amp;/g, '&').trim());
    }
    return titles;
  } catch {
    return [];
  }
}

// ── 카테고리별 수집 키워드 ───────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  travel:  ['여행 인기 2026', '봄 여행 핫플 when:7d'],
  beauty:  ['뷰티 트렌드 2026', '스킨케어 인기 when:7d'],
  finance: ['재테크 부업 2026', '돈 버는 법 트렌드 when:7d'],
  fitness: ['다이어트 트렌드 2026', '홈트 인기 when:7d'],
  mindset: ['자기계발 2026 트렌드', 'N잡러 when:7d'],
  food:    ['요리 레시피 트렌드 2026', '맛집 인기 when:7d'],
  it:      ['AI 트렌드 2026 인스타', 'ChatGPT 활용 when:7d'],
  daily:   ['직장인 트렌드 2026', '라이프스타일 인기 when:7d'],
};

export async function POST(req: NextRequest) {
  try {
    const { brandName, category, type = 'custom' } = await req.json();

    const catTranslations: Record<string, string> = {
      travel: '여행/맛집', beauty: '뷰티/패션', finance: '재테크/돈',
      fitness: '운동/다이어트', mindset: '자기계발/동기부여',
      food: '요리/레시피', it: 'IT/AI/꿀팁', daily: '일상/공감',
    };
    const catKr = catTranslations[category] || category;

    // 실시간 뉴스 수집
    const catKeywords = CATEGORY_KEYWORDS[category] || ['인스타 트렌드 when:7d', '카드뉴스 바이럴 when:7d'];
    const [news1, news2, trends] = await Promise.all([
      fetchLiveNews(catKeywords[0]),
      fetchLiveNews(catKeywords[1] || catKeywords[0]),
      fetchGoogleTrends(),
    ]);

    const allTitles = [...news1, ...news2, ...trends]
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 30);

    const liveData = allTitles.length > 0
      ? `[실시간 수집 데이터 (${allTitles.length}건)]\n${allTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '[실시간 데이터 없음 - AI 자체 2026년 트렌드 분석으로 대체]';

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
        accountContext = `\n[내 계정 최근 성과]\n${posts.map(p =>
          `- ${p.content.split('|||')[0]} | 조회: ${p.views} | 전환: ${p.dms}`
        ).join('\n')}`;
      }
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ recommendations: getFallback(catKr) });
    }

    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'viral') {
      systemPrompt = `당신은 2026년 대한민국 인스타그램 카드뉴스 트래픽 폭발 전문가입니다.
오늘: ${today}
아래 실시간 수집된 최신 뉴스/트렌드 데이터를 분석하여, 지금 당장 [${catKr}] 카테고리에서 인스타그램 저장·공유가 폭발할 카드뉴스 주제 3개를 선별합니다.

바이럴 법칙:
1. 결핍 자극 (돈·외모·건강·불안) → 무조건 저장 버튼 유도
2. 강력한 숫자+호기심 ("99%가 모르는", "단 3가지", "절대 하면 안 되는")
3. 리스트형 구성이 저장율 300% 높음
4. 실시간 뉴스 이슈와 연결될수록 초기 확산력 폭발`;

      userPrompt = `카테고리: ${catKr}
브랜드: ${brandName || '일반 계정'}

${liveData}${accountContext}

위 실시간 데이터를 반영해서, 지금 이 순간 인스타 저장이 폭발할 카드뉴스 주제 3개를 JSON으로:
{
  "recommendations": [
    {
      "topic": "카드뉴스 주제 (20자 이내, 임팩트 있게)",
      "reason": "왜 지금 트래픽이 폭발하는지 (30자 이내, 수집된 데이터 근거 포함)",
      "category": "${category}",
      "estimatedViews": "예상 인스타 조회수 (예: 20만~50만)",
      "viralScore": 97,
      "analysis": "어떤 심리 트리거+알고리즘이 작동하는지 구체적으로 (60자 이내)"
    }
  ]
}`;
    } else {
      systemPrompt = `당신은 2026년 인스타그램 카드뉴스 기획의 신입니다.
오늘: ${today}
실시간 뉴스 데이터를 분석해서, [${catKr}] 카테고리에 맞는 최적 카드뉴스 주제 3개를 추천합니다.

핵심 원칙:
- 실제 이슈 + 감성 트리거 결합
- 리스트형·숫자형 제목 우선
- 저장 유도를 위한 정보 밀도 높은 주제
- 브랜드 계정 성격에 맞는 전문성 어필`;

      userPrompt = `브랜드: ${brandName || '일반 계정'}
카테고리: ${catKr}

${liveData}${accountContext}

실시간 데이터 기반 맞춤 카드뉴스 주제 3개 JSON:
{
  "recommendations": [
    {
      "topic": "구체적인 카드뉴스 주제 (20자 이내)",
      "reason": "왜 저장이 폭발하는지 심리 분석 (30자 이내)",
      "category": "${category}",
      "estimatedViews": "예상 조회수",
      "viralScore": 92,
      "analysis": "타겟층과 확산 메커니즘 구체 분석 (60자 이내)"
    }
  ]
}`;
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json({
      recommendations: parsed.recommendations || [],
      realtime: allTitles.length > 0,
      fetchedCount: allTitles.length,
    });
  } catch (error: any) {
    console.error('Recommend error:', error);
    return NextResponse.json({ error: error.message || '주제 추천 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

function getFallback(catKr: string) {
  return [
    {
      topic: `${catKr} 99%가 모르는 비밀 5가지`,
      reason: '호기심+결핍 자극으로 저장 폭발',
      category: 'general',
      estimatedViews: '10만~30만',
      viralScore: 95,
      analysis: '정보 격차를 자극하는 제목으로 저장률 최상위권 달성 가능',
    },
    {
      topic: `2026년 지금 당장 해야 할 ${catKr} TOP 3`,
      reason: '연도+긴박감 조합으로 클릭율 극대화',
      category: 'general',
      estimatedViews: '5만~15만',
      viralScore: 90,
      analysis: '현재성+행동 유도 조합으로 탐색탭 노출 최적화',
    },
    {
      topic: `전문가도 절대 안 알려주는 ${catKr} 꿀팁`,
      reason: '전문가 권위+비밀 프레임 저장율 상위',
      category: 'general',
      estimatedViews: '3만~10만',
      viralScore: 85,
      analysis: '신뢰도+희귀성 조합으로 공유 확산 유도',
    },
  ];
}
