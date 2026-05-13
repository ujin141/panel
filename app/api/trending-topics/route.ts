import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Google News RSS 수집 ─────────────────────────────────────────────────────
async function fetchGoogleNews(query: string, lang: string = 'ko'): Promise<string[]> {
  try {
    const hl = lang === 'en' ? 'en' : 'ko';
    const gl = lang === 'en' ? 'US' : 'KR';
    const ceid = lang === 'en' ? 'US:en' : 'KR:ko';
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    const titles: string[] = [];
    const r1 = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    let m: RegExpExecArray | null;
    while ((m = r1.exec(xml)) !== null && titles.length < 15) {
      titles.push(m[1].trim());
    }
    if (titles.length === 0) {
      const r2 = /<title>(.*?)<\/title>/g;
      let skip = 0;
      while ((m = r2.exec(xml)) !== null && titles.length < 15) {
        if (skip++ < 1) continue;
        titles.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim());
      }
    }
    return titles;
  } catch {
    return [];
  }
}

// ── Google Trends RSS ───────────────────────────────────────────────────
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
    while ((m = r.exec(xml)) !== null && titles.length < 20) {
      if (skip++ < 1) continue;
      titles.push(m[1].replace(/&amp;/g, '&').trim());
    }
    return titles;
  } catch {
    return [];
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') || '';
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';
  const platform = req.nextUrl.searchParams.get('platform') || 'instagram'; // 'instagram' | 'tiktok'
  const isEn = lang === 'en';
  const isTikTok = platform === 'tiktok';

  const today = new Date().toLocaleDateString(isEn ? 'en-US' : 'ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // 카테고리별 수집 키워드
  const categoryKeywordsKo: Record<string, string[]> = {
    travel:  ['여행 트렌드', '봄 여행 2026', '핫플레이스'],
    beauty:  ['뷰티 트렌드', '스킨케어 2026', '화장품 인기'],
    finance: ['재테크 2026', '주식 부업 트렌드', '돈 버는 법'],
    fitness: ['다이어트 트렌드', '홈트 2026', '운동 트렌드'],
    mindset: ['자기계발 트렌드', '동기부여', 'N잡러'],
    food:    ['요리 트렌드', '맛집 2026', '레시피 인기'],
    it:      ['AI 트렌드 2026', '앱 추천', 'ChatGPT 활용'],
    daily:   ['직장인 트렌드', '라이프스타일 2026', '공감 콘텐츠'],
  };
  const categoryKeywordsEn: Record<string, string[]> = {
    travel:  ['travel trends 2026', 'best destinations', 'hidden gems travel'],
    beauty:  ['beauty trends 2026', 'skincare routine', 'makeup hacks'],
    finance: ['side hustle 2026', 'investing tips', 'passive income'],
    fitness: ['fitness trends 2026', 'home workout', 'weight loss tips'],
    mindset: ['self improvement', 'productivity hacks', 'motivation tips'],
    food:    ['food trends 2026', 'easy recipes', 'meal prep ideas'],
    it:      ['AI trends 2026', 'tech tips', 'ChatGPT hacks'],
    daily:   ['lifestyle trends', 'life hacks 2026', 'relatable content'],
  };

  const catKeywords = isEn ? categoryKeywordsEn : categoryKeywordsKo;
  const baseKeywords = category && catKeywords[category]
    ? catKeywords[category]
    : isEn
      ? (isTikTok ? ['TikTok trends 2026', 'viral TikTok content', 'short video trends'] : ['Instagram trends 2026', 'social media growth', 'viral content'])
      : (isTikTok ? ['틱톡 트렌드', '2026 숏폼 트렌드', '틱톡 바이럴'] : ['인스타그램 트렌드', '2026 SNS 트렌드', '카드뉴스 인기']);

  // 병렬 수집
  const platformKw = isTikTok
    ? (isEn ? 'TikTok viral when:7d' : '틱톡 바이럴 when:7d')
    : (isEn ? 'Instagram carousel viral when:7d' : '인스타그램 카드뉴스 바이럴 when:7d');
  const [trend1, trend2, trend3, googleTrends] = await Promise.all([
    fetchGoogleNews(`${baseKeywords[0]} when:3d`, lang),
    fetchGoogleNews(`${baseKeywords[1] || (isEn ? (isTikTok ? 'viral TikTok' : 'viral Instagram') : (isTikTok ? '틱톡 인기' : '인스타 바이럴'))} when:7d`, lang),
    fetchGoogleNews(platformKw, lang),
    fetchGoogleTrends(lang),
  ]);

  const allRaw = [...trend1, ...trend2, ...trend3, ...googleTrends]
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 40);

  const fetchedCount = allRaw.length;
  const fetchedData = fetchedCount > 0
    ? `[${isEn ? 'Real-time collected news/trends' : '실시간 수집된 뉴스/트렌드'} (${fetchedCount})]\n${allRaw.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : isEn ? '[Real-time data collection failed - using AI analysis]' : '[실시간 데이터 수집 실패 - AI 자체 최신 분석으로 대체]';

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
    return NextResponse.json({
      cardTopics: isEn ? getSampleCardTopicsEn() : getSampleCardTopics(),
      aiWritingTopics: isEn ? getSampleAiTopicsEn() : getSampleAiTopics(),
      realtime: false,
    });
  }

  try {
    const catLabelKo: Record<string, string> = {
      travel: '여행/맛집', beauty: '뷰티/패션', finance: '재테크/돈',
      fitness: '운동/다이어트', mindset: '자기계발/동기부여',
      food: '요리/레시피', it: 'IT/AI/꿀팁', daily: '일상/공감', all: '전체',
    };
    const catLabelEn: Record<string, string> = {
      travel: 'Travel/Food', beauty: 'Beauty/Fashion', finance: 'Finance/Money',
      fitness: 'Fitness/Diet', mindset: 'Mindset/Motivation',
      food: 'Cooking/Recipe', it: 'IT/AI/Tips', daily: 'Daily/Lifestyle', all: 'All',
    };
    const catLabel = category || 'all';
    const catName = isEn ? (catLabelEn[catLabel] || 'All') : (catLabelKo[catLabel] || '전체');

    const platformNameKo = isTikTok ? '틱톡 (글로벌)' : '인스타그램';
    const platformNameEn = isTikTok ? 'TikTok (Global)' : 'Instagram';

    // TikTok은 항상 글로벌 영어권 타깃 프롬프트 사용
    const sysPromptTikTokGlobal = `You are the world's #1 TikTok viral content strategist targeting GLOBAL audiences (US, UK, Australia, Canada, Europe).
Today: ${today}
Target: Non-Korean, English-speaking global TikTok users aged 16-35 (Gen Z + Millennials)
Role: Identify topics that will explode to MILLIONS of views on global TikTok RIGHT NOW.
TikTok Global Viral Formula:
- Hook in FIRST 1-3 SECONDS (stop the scroll)
- Universal emotional triggers: shock, humor, FOMO, inspiration, controversy, satisfying
- Challenge / duet / stitch potential = more reach
- Trending audio compatibility
- "For You Page" algorithm: watch time + shares + comments > likes
- Avoid culturally specific Korean topics — must appeal globally
Core principles:
- ONLY select topics currently trending on global TikTok FYP
- Tap into universal desires: money, relationships, beauty, health, conspiracy, life hacks
- Short-form = 3-second hook + emotional payoff + shareable moment
- ALL output must be in ENGLISH (keywords, hooks, hashtags, reasons — everything)`;

    const sysPromptKo = isTikTok ? sysPromptTikTokGlobal : `당신은 2026년 대한민국 SNS 트래픽 폭발 전문 콘텐츠 전략가입니다.
오늘: ${today}
역할: 실시간 뉴스·트렌드 데이터를 분석하여 지금 당장 인스타그램 카드뉴스와 블로그/AI 글쓰기 주제로 사용하면 트래픽이 폭발할 키워드를 선별합니다.
인스타그램 특성: 카드뉴스 저장율, 정보성 콘텐츠, 해시태그 최적화, 30대 이상 타깃
핵심 원칙:
- 지금 이 순간 실제로 검색량·공유가 폭발 중인 주제만 선별
- 사람들의 결핍(돈·외모·건강·불안)과 호기심을 동시에 자극
- 카드뉴스는 저장 폭발 주제, AI글쓰기는 'SEO 검색량'이 폭발할 주제로 분리`;

    const sysPromptEn = isTikTok ? sysPromptTikTokGlobal : `You are a top global social media content strategist specializing in viral Instagram growth.
Today: ${today}
Role: Analyze real-time news & trend data to identify keywords that will generate explosive traffic for Instagram carousel posts and blog/AI writing topics.
Instagram specifics: carousel save rate, informational content, hashtag optimization, 25-40 age group
Core principles:
- Select only topics with currently exploding search volume and shares
- Tap into universal desires (money, appearance, health, FOMO) and curiosity
- Card news = massive SAVES, AI writing = SEO traffic topics`;

    // TikTok은 항상 영어 글로벌 프롬프트 사용
    const contentTypeKo = isTikTok ? 'Global TikTok video topic (under 60 chars, scroll-stopping)' : '카드뉴스 주제 제목 (20자 이내, 저장 폭발형)';
    const hookDescKo = isTikTok ? 'First 3-second hook line (under 30 chars, instant-share worthy)' : '첫 슬라이드에 쓸 후킹 문구 (15자 이내, 충격적으로)';
    const userPromptTikTok = `Category: ${catName} | Platform: Global TikTok (targeting US/UK/AU/CA/EU audiences)
Today (${today}) real-time collected data:
${fetchedData}

Analyze the data and respond ONLY in JSON. ALL text must be in ENGLISH.
Generate topics that will go VIRAL on global TikTok FYP for non-Korean, English-speaking audiences.

{
  "cardTopics": [
    {
      "rank": 1,
      "keyword": "Global TikTok video concept (under 60 chars, viral potential)",
      "hook": "First 3-second hook text (under 30 chars, scroll-stopper)",
      "hotScore": 98,
      "estimatedViews": "1M~10M views",
      "saves": "Viral share rate",
      "reason": "Why this explodes on global TikTok FYP right now (under 70 chars)",
      "hashtags": ["#globaltiktok", "#fyp", "#viral"],
      "source": "Global TikTok Trends | Google News | AI Analysis",
      "category": "${catName}",
      "urgency": "Immediately"
    }
  ],
  "aiWritingTopics": [
    {
      "rank": 1,
      "keyword": "English blog/content topic targeting global readers (under 80 chars, SEO)",
      "searchVolume": "Est. monthly global searches (e.g., 50K~200K)",
      "competition": "Low",
      "hotScore": 92,
      "reason": "Why this ranks high for global English search (under 70 chars)",
      "longtailKeywords": ["global longtail 1", "global longtail 2"],
      "contentAngle": "Best angle to rank #1 for global English readers (under 80 chars)",
      "source": "Google News | TikTok Trends | AI Analysis",
      "category": "${catName}"
    }
  ]
}

Return exactly 6 TikTok global viral topics and 6 English writing topics.
Focus on topics that resonate with GLOBAL English-speaking audiences (US, UK, AU, CA, Europe).
Do NOT include Korea-specific content. Think: What's trending on US/UK TikTok FYP TODAY?
ALL keywords, hooks, hashtags, and reasons must be in ENGLISH.`;

    const userPromptKo = isTikTok ? userPromptTikTok : `카테고리: ${catName} | 플랫폼: 인스타그램
오늘(${today}) 실시간 수집 데이터:
${fetchedData}

위 데이터를 분석해서 아래 JSON 형식으로 정확히 응답해줘. 반드시 JSON만 응답.

{
  "cardTopics": [
    {
      "rank": 1,
      "keyword": "카드뉴스 주제 제목 (20자 이내, 저장 폭발형)",
      "hook": "첫 슬라이드에 쓸 후킹 문구 (15자 이내, 충격적으로)",
      "hotScore": 97,
      "estimatedViews": "10만~30만",
      "saves": "높음",
      "reason": "왜 지금 이 주제가 저장이 터지는지 (30자 이내)",
      "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3"],
      "source": "구글트렌드 | 구글뉴스 | AI분석",
      "category": "${catName}",
      "urgency": "즉시"
    }
  ],
  "aiWritingTopics": [
    {
      "rank": 1,
      "keyword": "블로그/AI글쓰기 주제 제목 (30자 이내, SEO 최적화형)",
      "searchVolume": "월 검색량 추정 (예: 2만~5만)",
      "competition": "낮음",
      "hotScore": 92,
      "reason": "왜 지금 이 키워드로 쓰면 상위 노출되는지 (30자 이내)",
      "longtailKeywords": ["롱테일키워드1", "롱테일키워드2"],
      "contentAngle": "어떤 각도로 글을 쓰면 1위가 되는지 (40자 이내)",
      "source": "구글뉴스 | 구글트렌드 | AI분석",
      "category": "${catName}"
    }
  ]
}

인스타그램 주제 6개, AI글쓰기 주제 6개를 반드시 반환해줘.
각 주제는 서로 다른 내용이어야 하며, 지금 당장 트래픽이 폭발할 수 있는 주제만 선별해줘.`;

    const userPromptEn = `Category: ${catName}
Today (${today}) real-time collected data:
${fetchedData}

Analyze the above data and respond in the exact JSON format below. Respond with JSON ONLY.
ALL content must be in ENGLISH — keywords, hooks, reasons, hashtags, everything in English.

{
  "cardTopics": [
    {
      "rank": 1,
      "keyword": "Card news topic title (under 60 chars, save-worthy)",
      "hook": "First slide hook (under 40 chars, shocking)",
      "hotScore": 97,
      "estimatedViews": "100K~300K",
      "saves": "High",
      "reason": "Why this topic drives saves right now (under 60 chars)",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "source": "Google Trends | Google News | AI Analysis",
      "category": "${catName}",
      "urgency": "Immediately"
    }
  ],
  "aiWritingTopics": [
    {
      "rank": 1,
      "keyword": "Blog/AI writing topic title (under 80 chars, SEO optimized)",
      "searchVolume": "Est. monthly searches (e.g., 20K~50K)",
      "competition": "Low",
      "hotScore": 92,
      "reason": "Why writing about this now ranks high (under 60 chars)",
      "longtailKeywords": ["longtail keyword 1", "longtail keyword 2"],
      "contentAngle": "Best angle for #1 ranking (under 80 chars)",
      "source": "Google News | Google Trends | AI Analysis",
      "category": "${catName}"
    }
  ]
}

Return exactly 6 card news topics and 6 AI writing topics.
Each topic must be unique and have explosive traffic potential RIGHT NOW.
IMPORTANT: ALL text must be in English for a global audience.`;

    const gptRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: isTikTok ? sysPromptTikTokGlobal : (isEn ? sysPromptEn : sysPromptKo) },
        { role: 'user', content: isTikTok ? userPromptTikTok : (isEn ? userPromptEn : userPromptKo) },
      ],
      temperature: 0.85,
      max_tokens: 2000,
    });

    const text = gptRes.choices[0].message.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      cardTopics: result.cardTopics || [],
      aiWritingTopics: result.aiWritingTopics || [],
      realtime: fetchedCount > 0,
      fetchedCount,
      fetchedAt: new Date().toISOString(),
      category: catName,
    });
  } catch (err: any) {
    console.error('[trending-topics] error:', err?.message?.slice(0, 80));
    return NextResponse.json({
      cardTopics: isEn ? getSampleCardTopicsEn() : getSampleCardTopics(),
      aiWritingTopics: isEn ? getSampleAiTopicsEn() : getSampleAiTopics(),
      realtime: false,
    });
  }
}

function getSampleCardTopics() {
  return [
    { rank: 1, keyword: '2026 인스타 알고리즘 완전 정복', hook: '이거 모르면 손해!', hotScore: 98, estimatedViews: '20만~50만', saves: '높음', reason: 'SNS 운영자 필수 저장 콘텐츠', hashtags: ['#인스타그램', '#알고리즘', '#SNS마케팅'], source: 'AI분석', category: '전체', urgency: '즉시' },
    { rank: 2, keyword: '직장인 월급 외 수입 만드는 법 5가지', hook: '회사만 다니면 늦습니다', hotScore: 96, estimatedViews: '15만~40만', saves: '높음', reason: '경제 불안 심리 자극, 저장 폭발', hashtags: ['#부업', '#N잡러', '#재테크'], source: 'AI분석', category: '재테크/돈', urgency: '즉시' },
    { rank: 3, keyword: 'AI로 하루 2시간 만에 콘텐츠 100개 만들기', hook: '남들 다 하는데 나만 모름?', hotScore: 95, estimatedViews: '10만~30만', saves: '높음', reason: 'AI 활용 효율화 관심 폭발', hashtags: ['#AI활용', '#ChatGPT', '#콘텐츠'], source: 'AI분석', category: 'IT/AI/꿀팁', urgency: '즉시' },
    { rank: 4, keyword: '봄 다이어트 2주 만에 -3kg 현실 방법', hook: '이 방법만 알면 됩니다', hotScore: 93, estimatedViews: '8만~25만', saves: '높음', reason: '봄 시즌 다이어트 검색 폭발', hashtags: ['#다이어트', '#봄다이어트', '#홈트'], source: 'AI분석', category: '운동/다이어트', urgency: '즉시' },
    { rank: 5, keyword: '99%가 모르는 카카오 숨겨진 기능 7가지', hook: '당신만 모르고 있었음', hotScore: 91, estimatedViews: '7만~20만', saves: '높음', reason: '실생활 꿀팁 저장율 최고', hashtags: ['#카카오톡', '#스마트폰꿀팁', '#앱활용'], source: 'AI분석', category: 'IT/AI/꿀팁', urgency: '이번주' },
    { rank: 6, keyword: '2026 서울 핫플 TOP 10 최신 업데이트', hook: '여기 아직도 모름?', hotScore: 89, estimatedViews: '5만~15만', saves: '보통', reason: '봄 나들이 시즌 위치 정보 수요', hashtags: ['#서울핫플', '#서울여행', '#데이트코스'], source: 'AI분석', category: '여행/맛집', urgency: '이번주' },
  ];
}

function getSampleCardTopicsEn() {
  return [
    { rank: 1, keyword: 'Master the 2026 Instagram Algorithm', hook: "You're losing reach!", hotScore: 98, estimatedViews: '200K~500K', saves: 'High', reason: 'Every creator needs this — save-worthy', hashtags: ['#Instagram', '#Algorithm', '#SocialMedia'], source: 'AI Analysis', category: 'All', urgency: 'Immediately' },
    { rank: 2, keyword: '5 Side Hustles That Pay $5K/Month', hook: 'Your 9-5 is not enough', hotScore: 96, estimatedViews: '150K~400K', saves: 'High', reason: 'Financial anxiety drives massive saves', hashtags: ['#SideHustle', '#PassiveIncome', '#Money'], source: 'AI Analysis', category: 'Finance/Money', urgency: 'Immediately' },
    { rank: 3, keyword: 'Create 100 Posts in 2 Hours with AI', hook: "Everyone knows but you", hotScore: 95, estimatedViews: '100K~300K', saves: 'High', reason: 'AI productivity hacks trending globally', hashtags: ['#AITools', '#ChatGPT', '#ContentCreation'], source: 'AI Analysis', category: 'IT/AI/Tips', urgency: 'Immediately' },
    { rank: 4, keyword: 'Lose 7 Pounds in 2 Weeks — Real Method', hook: 'This actually works', hotScore: 93, estimatedViews: '80K~250K', saves: 'High', reason: 'Summer body season search spike', hashtags: ['#WeightLoss', '#Diet', '#Fitness'], source: 'AI Analysis', category: 'Fitness/Diet', urgency: 'Immediately' },
    { rank: 5, keyword: '7 Hidden iPhone Features 99% Dont Know', hook: "You've been missing out", hotScore: 91, estimatedViews: '70K~200K', saves: 'High', reason: 'Tech tips always go viral', hashtags: ['#iPhone', '#TechTips', '#LifeHacks'], source: 'AI Analysis', category: 'IT/AI/Tips', urgency: 'This week' },
    { rank: 6, keyword: 'Top 10 Destinations for 2026 on a Budget', hook: 'Stop overpaying!', hotScore: 89, estimatedViews: '50K~150K', saves: 'Medium', reason: 'Travel season search volume rising', hashtags: ['#Travel', '#BudgetTravel', '#Wanderlust'], source: 'AI Analysis', category: 'Travel/Food', urgency: 'This week' },
  ];
}

function getSampleAiTopics() {
  return [
    { rank: 1, keyword: '2026년 직장인 부업 종류 추천 월 100만원 현실 후기', searchVolume: '3만~8만', competition: '보통', hotScore: 97, reason: '경기침체+부업 관심 최고조', longtailKeywords: ['직장인 투잡 세금', '부업 시작 방법'], contentAngle: '실제 수익 인증 포함한 생생한 후기 형식으로', source: 'AI분석', category: '재테크/돈' },
    { rank: 2, keyword: 'ChatGPT로 블로그 글쓰기 완전 자동화 방법 2026', searchVolume: '2만~5만', competition: '낮음', hotScore: 95, reason: 'AI글쓰기 수요 전년 대비 300% 증가', longtailKeywords: ['AI 블로그 자동화', '챗GPT 글쓰기'], contentAngle: '스텝별 따라하기 가이드 + 실제 결과물 캡처', source: 'AI분석', category: 'IT/AI/꿀팁' },
    { rank: 3, keyword: '봄 여행지 추천 2026 국내외 TOP 15 가성비', searchVolume: '5만~12만', competition: '높음', hotScore: 93, reason: '봄 시즌 여행 검색량 급증', longtailKeywords: ['4월 여행지 추천', '봄꽃 여행 코스'], contentAngle: '가격 정보+예약 꿀팁 포함한 실용적 정보글', source: 'AI분석', category: '여행/맛집' },
    { rank: 4, keyword: '인스타그램 팔로워 1만 만들기 현실적인 방법 2026', searchVolume: '1만~3만', competition: '낮음', hotScore: 91, reason: '계정 성장 니즈 지속 상승', longtailKeywords: ['인스타 팔로워 늘리기', '인스타 알고리즘 2026'], contentAngle: '월별 성장 로드맵 형식, 숫자로 증명', source: 'AI분석', category: 'IT/AI/꿀팁' },
    { rank: 5, keyword: '40대 홈트레이닝 루틴 주 3회 체지방 감량 실제 후기', searchVolume: '8천~2만', competition: '낮음', hotScore: 89, reason: '40대 건강 관심 폭발, 경쟁 낮음', longtailKeywords: ['40대 운동 루틴', '중년 다이어트'], contentAngle: '실제 변화 전후 사진 + 구체적 주간 루틴표', source: 'AI분석', category: '운동/다이어트' },
    { rank: 6, keyword: '2026 자취방 인테리어 저렴하게 꾸미기 다이소 활용', searchVolume: '2만~6만', competition: '보통', hotScore: 87, reason: '1인 가구 증가+다이소나이제이션 트렌드', longtailKeywords: ['자취방 인테리어', '다이소 인테리어'], contentAngle: '예산별 쇼핑리스트 + 전후 비교 사진', source: 'AI분석', category: '일상/공감' },
  ];
}

function getSampleAiTopicsEn() {
  return [
    { rank: 1, keyword: 'Best Side Hustles 2026: Realistic $3K/Month Guide', searchVolume: '30K~80K', competition: 'Medium', hotScore: 97, reason: 'Economic uncertainty + side income interest at peak', longtailKeywords: ['side hustle taxes', 'how to start a side business'], contentAngle: 'Include real income proof with step-by-step breakdown', source: 'AI Analysis', category: 'Finance/Money' },
    { rank: 2, keyword: 'How to Automate Blog Writing with ChatGPT 2026', searchVolume: '20K~50K', competition: 'Low', hotScore: 95, reason: 'AI writing demand up 300% year over year', longtailKeywords: ['AI blog automation', 'ChatGPT writing tips'], contentAngle: 'Step-by-step tutorial with actual output screenshots', source: 'AI Analysis', category: 'IT/AI/Tips' },
    { rank: 3, keyword: 'Top 15 Budget Travel Destinations 2026', searchVolume: '50K~120K', competition: 'High', hotScore: 93, reason: 'Travel season search volume surging', longtailKeywords: ['cheap travel 2026', 'best value destinations'], contentAngle: 'Include pricing info + booking hacks for each destination', source: 'AI Analysis', category: 'Travel/Food' },
    { rank: 4, keyword: 'How to Grow Instagram to 10K Followers in 2026', searchVolume: '10K~30K', competition: 'Low', hotScore: 91, reason: 'Account growth demand consistently rising', longtailKeywords: ['grow Instagram followers', 'Instagram algorithm 2026'], contentAngle: 'Monthly growth roadmap with real numbers and proof', source: 'AI Analysis', category: 'IT/AI/Tips' },
    { rank: 5, keyword: 'Home Workout Routine for Fat Loss — Real Results', searchVolume: '8K~20K', competition: 'Low', hotScore: 89, reason: 'Health interest exploding, low competition niche', longtailKeywords: ['home workout plan', 'fat loss routine'], contentAngle: 'Before/after photos + specific weekly schedule', source: 'AI Analysis', category: 'Fitness/Diet' },
    { rank: 6, keyword: 'Budget Room Makeover Ideas 2026 Under $100', searchVolume: '20K~60K', competition: 'Medium', hotScore: 87, reason: 'Solo living trend + budget decoration rising', longtailKeywords: ['room makeover cheap', 'budget decor ideas'], contentAngle: 'Budget shopping list + before/after comparison photos', source: 'AI Analysis', category: 'Daily/Lifestyle' },
  ];
}
