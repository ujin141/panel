import { NextRequest, NextResponse } from 'next/server';
import { requirePinSession, OWNER_ID } from '@/lib/pinAuth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── 실시간 Google News 수집 ──────────────────────────────────────────────────
async function fetchLiveNews(query: string, lang: string = 'ko'): Promise<string[]> {
  try {
    const hlgl = lang === 'en' ? 'hl=en&gl=US&ceid=US:en' : 'hl=ko&gl=KR&ceid=KR:ko';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${hlgl}`;
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
async function fetchGoogleTrends(lang: string = 'ko'): Promise<string[]> {
  try {
    const pn = lang === 'en' ? 'p1' : 'p73'; // p1=US, p73=KR
    const url = `https://trends.google.com/trends/hottrends/atom/feed?pn=${pn}`;
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
const CATEGORY_KEYWORDS_KO: Record<string, string[]> = {
  travel:  ['여행 인기 2026', '봄 여행 핫플 when:7d'],
  beauty:  ['뷰티 트렌드 2026', '스킨케어 인기 when:7d'],
  finance: ['재테크 부업 2026', '돈 버는 법 트렌드 when:7d'],
  fitness: ['다이어트 트렌드 2026', '홈트 인기 when:7d'],
  mindset: ['자기계발 2026 트렌드', 'N잡러 when:7d'],
  food:    ['요리 레시피 트렌드 2026', '맛집 인기 when:7d'],
  it:      ['AI 트렌드 2026 인스타', 'ChatGPT 활용 when:7d'],
  daily:   ['직장인 트렌드 2026', '라이프스타일 인기 when:7d'],
};

const CATEGORY_KEYWORDS_EN: Record<string, string[]> = {
  travel:  ['travel trends 2026', 'best travel destinations when:7d'],
  beauty:  ['beauty trends 2026', 'skincare trending when:7d'],
  finance: ['side hustle 2026', 'money saving tips trending when:7d'],
  fitness: ['fitness trends 2026', 'workout routine trending when:7d'],
  mindset: ['self improvement 2026', 'motivation trending when:7d'],
  food:    ['food recipe trending 2026', 'cooking trends when:7d'],
  it:      ['AI trends 2026 instagram', 'ChatGPT tips when:7d'],
  daily:   ['lifestyle trends 2026', 'relatable content trending when:7d'],
};

export async function POST(req: NextRequest) {
  try {
    const { brandName, category, type = 'custom', language = 'ko' } = await req.json();
    const isEn = language === 'en';

    const catTranslationsKo: Record<string, string> = {
      travel: '여행/맛집', beauty: '뷰티/패션', finance: '재테크/돈',
      fitness: '운동/다이어트', mindset: '자기계발/동기부여',
      food: '요리/레시피', it: 'IT/AI/꿀팁', daily: '일상/공감',
    };
    const catTranslationsEn: Record<string, string> = {
      travel: 'Travel/Food', beauty: 'Beauty/Fashion', finance: 'Finance/Money',
      fitness: 'Fitness/Diet', mindset: 'Mindset/Motivation',
      food: 'Cooking/Recipe', it: 'IT/AI/Tips', daily: 'Daily/Relatable',
    };
    const catLabel = isEn ? (catTranslationsEn[category] || category) : (catTranslationsKo[category] || category);

    // 실시간 뉴스 수집
    const kwMap = isEn ? CATEGORY_KEYWORDS_EN : CATEGORY_KEYWORDS_KO;
    const catKeywords = kwMap[category] || (isEn ? ['instagram trends when:7d', 'viral content when:7d'] : ['인스타 트렌드 when:7d', '카드뉴스 바이럴 when:7d']);
    const [news1, news2, trends] = await Promise.all([
      fetchLiveNews(catKeywords[0], language),
      fetchLiveNews(catKeywords[1] || catKeywords[0], language),
      fetchGoogleTrends(language),
    ]);

    const allTitles = [...news1, ...news2, ...trends]
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .slice(0, 30);

    const liveData = allTitles.length > 0
      ? `[${isEn ? `Live data collected (${allTitles.length} items)` : `실시간 수집 데이터 (${allTitles.length}건)`}]\n${allTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : `[${isEn ? 'No live data - using AI trend analysis instead' : '실시간 데이터 없음 - AI 자체 2026년 트렌드 분석으로 대체'}]`;

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
        accountContext = isEn
          ? `\n[My Account Recent Performance]\n${posts.map(p =>
              `- ${p.content.split('|||')[0]} | Views: ${p.views} | Conversions: ${p.dms}`
            ).join('\n')}`
          : `\n[내 계정 최근 성과]\n${posts.map(p =>
              `- ${p.content.split('|||')[0]} | 조회: ${p.views} | 전환: ${p.dms}`
            ).join('\n')}`;
      }
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ recommendations: getFallback(catLabel, isEn) });
    }

    const today = new Date().toLocaleDateString(isEn ? 'en-US' : 'ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'viral') {
      if (isEn) {
        systemPrompt = `You are a global Instagram carousel traffic explosion expert in 2026.
Today: ${today}
Analyze the real-time collected news/trend data below and select 3 carousel topics in the [${catLabel}] category that will generate explosive saves and shares on Instagram right now.

Viral Rules:
1. Trigger scarcity (money, appearance, health, anxiety) → force save button
2. Strong numbers + curiosity ("99% don't know", "Only 3 things", "Never do this")
3. List-format content gets 300% higher save rates
4. The more connected to real-time news issues, the more explosive initial spread`;

        userPrompt = `Category: ${catLabel}
Brand: ${brandName || 'General Account'}

${liveData}${accountContext}

Based on the real-time data above, give me 3 carousel topics that will explode in saves right now, as JSON:
{
  "recommendations": [
    {
      "topic": "Carousel topic (under 50 chars, impactful)",
      "reason": "Why this will go viral now (under 60 chars, cite data)",
      "category": "${category}",
      "estimatedViews": "Estimated Instagram views (e.g. 200K~500K)",
      "viralScore": 97,
      "analysis": "What psychological trigger + algorithm effect is at play (under 100 chars)"
    }
  ]
}`;
      } else {
        systemPrompt = `당신은 2026년 대한민국 인스타그램 카드뉴스 트래픽 폭발 전문가입니다.
오늘: ${today}
아래 실시간 수집된 최신 뉴스/트렌드 데이터를 분석하여, 지금 당장 [${catLabel}] 카테고리에서 인스타그램 저장·공유가 폭발할 카드뉴스 주제 3개를 선별합니다.

바이럴 법칙:
1. 결핍 자극 (돈·외모·건강·불안) → 무조건 저장 버튼 유도
2. 강력한 숫자+호기심 ("99%가 모르는", "단 3가지", "절대 하면 안 되는")
3. 리스트형 구성이 저장율 300% 높음
4. 실시간 뉴스 이슈와 연결될수록 초기 확산력 폭발`;

        userPrompt = `카테고리: ${catLabel}
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
      }
    } else {
      if (isEn) {
        systemPrompt = `You are a god-tier Instagram carousel content strategist in 2026.
Today: ${today}
Analyze real-time news data to recommend the 3 best carousel topics for the [${catLabel}] category.

Core Principles:
- Combine real issues + emotional triggers
- Prioritize list/number-based titles
- Information-dense topics for high save rates
- Show expertise matching the brand account`;

        userPrompt = `Brand: ${brandName || 'General Account'}
Category: ${catLabel}

${liveData}${accountContext}

Data-driven custom carousel topic recommendations (3 topics) as JSON:
{
  "recommendations": [
    {
      "topic": "Specific carousel topic (under 50 chars)",
      "reason": "Why saves will explode - psychological analysis (under 60 chars)",
      "category": "${category}",
      "estimatedViews": "Estimated views",
      "viralScore": 92,
      "analysis": "Target audience and spread mechanism analysis (under 100 chars)"
    }
  ]
}`;
      } else {
        systemPrompt = `당신은 2026년 인스타그램 카드뉴스 기획의 신입니다.
오늘: ${today}
실시간 뉴스 데이터를 분석해서, [${catLabel}] 카테고리에 맞는 최적 카드뉴스 주제 3개를 추천합니다.

핵심 원칙:
- 실제 이슈 + 감성 트리거 결합
- 리스트형·숫자형 제목 우선
- 저장 유도를 위한 정보 밀도 높은 주제
- 브랜드 계정 성격에 맞는 전문성 어필`;

        userPrompt = `브랜드: ${brandName || '일반 계정'}
카테고리: ${catLabel}

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
    return NextResponse.json({ error: error.message || 'An error occurred during topic recommendation.' }, { status: 500 });
  }
}

function getFallback(catLabel: string, isEn: boolean) {
  if (isEn) {
    return [
      {
        topic: `5 Secrets About ${catLabel} That 99% Don't Know`,
        reason: 'Curiosity + scarcity triggers explosive saves',
        category: 'general',
        estimatedViews: '100K~300K',
        viralScore: 95,
        analysis: 'Title exploiting information gap drives top-tier save rates',
      },
      {
        topic: `TOP 3 ${catLabel} Things You Must Do in 2026`,
        reason: 'Year + urgency combo maximizes click rate',
        category: 'general',
        estimatedViews: '50K~150K',
        viralScore: 90,
        analysis: 'Timeliness + call-to-action combo optimizes Explore tab exposure',
      },
      {
        topic: `${catLabel} Pro Tips Experts Won't Tell You`,
        reason: 'Expert authority + secret frame = top save rate',
        category: 'general',
        estimatedViews: '30K~100K',
        viralScore: 85,
        analysis: 'Trust + scarcity combo drives share virality',
      },
    ];
  }
  return [
    {
      topic: `${catLabel} 99%가 모르는 비밀 5가지`,
      reason: '호기심+결핍 자극으로 저장 폭발',
      category: 'general',
      estimatedViews: '10만~30만',
      viralScore: 95,
      analysis: '정보 격차를 자극하는 제목으로 저장률 최상위권 달성 가능',
    },
    {
      topic: `2026년 지금 당장 해야 할 ${catLabel} TOP 3`,
      reason: '연도+긴박감 조합으로 클릭율 극대화',
      category: 'general',
      estimatedViews: '5만~15만',
      viralScore: 90,
      analysis: '현재성+행동 유도 조합으로 탐색탭 노출 최적화',
    },
    {
      topic: `전문가도 절대 안 알려주는 ${catLabel} 꿀팁`,
      reason: '전문가 권위+비밀 프레임 저장율 상위',
      category: 'general',
      estimatedViews: '3만~10만',
      viralScore: 85,
      analysis: '신뢰도+희귀성 조합으로 공유 확산 유도',
    },
  ];
}
