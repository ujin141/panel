import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── 공통: XML title 파싱 헬퍼 ────────────────────────────────────────────────
function parseXmlTitles(xml: string, max = 15): string[] {
  const titles: string[] = [];
  let m: RegExpExecArray | null;
  // CDATA 방식 (RSS 2.0)
  const r1 = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/g;
  while ((m = r1.exec(xml)) !== null && titles.length < max) {
    const t = m[1].trim();
    if (t) titles.push(t);
  }
  // 일반 태그 방식 (Atom / RSS)
  if (titles.length === 0) {
    const r2 = /<title[^>]*>([^<]{3,})<\/title>/g;
    let skip = 0;
    while ((m = r2.exec(xml)) !== null && titles.length < max) {
      if (skip++ < 1) continue; // 피드 제목 건너뜀
      const t = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
      if (t) titles.push(t);
    }
  }
  return titles;
}

// ── 1. Naver News RSS (한국어, 카테고리별, API키 불필요) ────────────────────────
// sectionId: 100=정치 101=경제 102=사회 103=생활/문화 104=세계 105=IT/과학
async function fetchNaverNews(sectionIds: string[]): Promise<string[]> {
  try {
    const results = await Promise.all(
      sectionIds.map(async (id) => {
        const xml = await robustFetch(`https://rss.naver.com/main/rss2.0.xml?sectionId=${id}`, 6000);
        return xml ? parseXmlTitles(xml, 10) : [];
      })
    );
    return results.flat();
  } catch {
    return [];
  }
}

// ── 2. YouTube Trending Atom Feed (API키 불필요) ────────────────────────────
async function fetchYouTubeTrending(regionCode: string = 'KR'): Promise<string[]> {
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?chart=mostpopular&regionCode=${regionCode}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    // YouTube Atom: <title> 안에 영상 제목
    const titles: string[] = [];
    let m: RegExpExecArray | null;
    const r = /<title>([^<]{4,})<\/title>/g;
    let skip = 0;
    while ((m = r.exec(xml)) !== null && titles.length < 20) {
      if (skip++ < 1) continue; // 채널명 건너뜀
      titles.push(m[1].replace(/&amp;/g, '&').trim());
    }
    return titles;
  } catch {
    return [];
  }
}

// ── 3. Reddit Top Posts RSS (영어, API키 불필요) ────────────────────────────
async function fetchReddit(subreddits: string[]): Promise<string[]> {
  try {
    const results = await Promise.all(
      subreddits.map(async (sub) => {
        const res = await fetch(`https://www.reddit.com/r/${sub}/top.rss?t=day&limit=10`, {
          headers: { 'User-Agent': 'TrendBot/1.0 (Next.js app)' },
          next: { revalidate: 0 },
        });
        const xml = await res.text();
        return parseXmlTitles(xml, 8);
      })
    );
    return results.flat();
  } catch {
    return [];
  }
}

// ── 4. Hacker News Top Stories (IT 카테고리, API키 불필요) ─────────────────
async function fetchHackerNews(): Promise<string[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      next: { revalidate: 0 },
    });
    const ids: number[] = await res.json();
    const top10 = ids.slice(0, 10);
    const stories = await Promise.all(
      top10.map(async (id) => {
        try {
          const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            next: { revalidate: 0 },
          });
          const item = await r.json();
          return (item?.title as string) || '';
        } catch {
          return '';
        }
      })
    );
    return stories.filter(Boolean);
  } catch {
    return [];
  }
}

// ── 5. 국내 주요 언론 RSS (조선/중앙/동아 — API키 불필요) ─────────────────────
async function fetchKoreanMajorNews(): Promise<string[]> {
  const feeds = [
    'https://www.chosun.com/arc/outboundfeeds/rss/',
    'https://rss.joins.com/joins_news_list.xml',
    'https://rss.donga.com/total.xml',
  ];
  try {
    const results = await Promise.all(
      feeds.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(4000),
          });
          const xml = await res.text();
          return parseXmlTitles(xml, 8);
        } catch {
          return [];
        }
      })
    );
    return results.flat();
  } catch {
    return [];
  }
}

// ── 6. BBC News RSS (영어 글로벌 — API키 불필요) ────────────────────────────
async function fetchBBCNews(): Promise<string[]> {
  const feeds = [
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
  ];
  try {
    const results = await Promise.all(
      feeds.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            next: { revalidate: 0 },
            signal: AbortSignal.timeout(4000),
          });
          const xml = await res.text();
          return parseXmlTitles(xml, 10);
        } catch {
          return [];
        }
      })
    );
    return results.flat();
  } catch {
    return [];
  }
}

// ── 7. Product Hunt RSS (IT/스타트업 — API키 불필요) ─────────────────────────
async function fetchProductHunt(): Promise<string[]> {
  try {
    const res = await fetch('https://www.producthunt.com/feed', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    return parseXmlTitles(xml, 10);
  } catch {
    return [];
  }
}

// ── 8. 연합뉴스 RSS (국내 1위 통신사 — API키 불필요) ──────────────────────────
async function fetchYonhap(): Promise<string[]> {
  try {
    const xml = await robustFetch('https://www.yna.co.kr/rss/news.xml', 6000);
    return xml ? parseXmlTitles(xml, 15) : [];
  } catch {
    return [];
  }
}

// ── 9. YTN RSS (24시간 뉴스 — API키 불필요) ────────────────────────────────────
async function fetchYTN(): Promise<string[]> {
  try {
    const xml = await robustFetch('https://www.ytn.co.kr/rss/rss.php?ptype=all', 6000);
    return xml ? parseXmlTitles(xml, 12) : [];
  } catch {
    return [];
  }
}

// ── 10. 강화된 RSS 패치 헬퍼 (재시도 + 타임아웃) ────────────────────────────────
async function robustFetch(url: string, timeoutMs = 5000): Promise<string> {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml,application/xml,text/xml,*/*' },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch {
      if (attempt === 1) return '';
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return '';
}

// ── 11. Apify - Google Trends 실시간 한국 급상승 (APIFY_API_TOKEN 사용) ────────
// actor: petr_cermak/google-trends-scraper (무료 플랜 사용 가능)
async function fetchGoogleTrendsApify(keywords: string[]): Promise<string[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return [];
  try {
    // Apify Google Trends Scraper 동기 실행 (최대 20초)
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/petr_cermak~google-trends-scraper/run-sync-get-dataset-items?token=${token}&timeout=20&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms: keywords.slice(0, 3),
          geo: 'KR',
          timeRange: 'now 1-d',
          category: 0,
          gprop: '',
        }),
        signal: AbortSignal.timeout(22000),
      }
    );
    if (!runRes.ok) return [];
    const items: Array<{ interestOverTime?: { value?: number; formattedValue?: string }[]; query?: string }> = await runRes.json();
    // 관심도 높은 키워드만 추출
    const results: string[] = [];
    for (const item of items) {
      if (item.query) results.push(item.query);
    }
    return results.slice(0, 10);
  } catch {
    return [];
  }
}

// ── 12. Apify - 네이버 뉴스 스크래핑 (카테고리별 최신 헤드라인) ──────────────────
async function fetchNaverNewsApify(query: string): Promise<string[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) return [];
  try {
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/drobnikj~crawler-google-places/run-sync-get-dataset-items?token=${token}&timeout=15&memory=256`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}&sort=1&ds=&de=&mynews=0&office_type=0&office_section_code=0&news_office_checked=&nso=so:dd,p:1d` }],
          maxRequestsPerCrawl: 1,
          maxConcurrency: 1,
        }),
        signal: AbortSignal.timeout(17000),
      }
    );
    // Apify 네이버 뉴스 스크래퍼는 복잡하므로 실패 시 빈 배열 반환
    return [];
  } catch {
    return [];
  }
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') || '';
  const lang = req.nextUrl.searchParams.get('lang') || 'ko';
  const platform = req.nextUrl.searchParams.get('platform') || 'instagram'; // 'instagram' | 'tiktok'
  const isTikTok = platform === 'tiktok';
  // TikTok은 무조건 해외 글로벌 타깃 → lang 파라미터 무시하고 강제로 영어 처리
  const isEn = isTikTok ? true : (lang === 'en');

  const now = new Date();
  const today = now.toLocaleDateString(isEn ? 'en-US' : 'ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  // 매 요청마다 다른 시간+랜덤 시드 → GPT가 언제나 새 주제 생성
  const nowStr = now.toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const h = now.getHours();
  const timeOfDay = h < 6 ? '새벽' : h < 12 ? '오전' : h < 18 ? '오후' : '저녁';
  const randomSeed = Math.random().toString(36).slice(2, 8).toUpperCase();

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

  // ── 카테고리별 Naver 섹션 ID 매핑 ──────────────────────────────────────────
  const naverSectionMap: Record<string, string[]> = {
    travel:  ['103', '104'],
    beauty:  ['103'],
    finance: ['101'],
    fitness: ['103'],
    mindset: ['103'],
    food:    ['103'],
    it:      ['105'],
    daily:   ['103', '102'],
  };
  const naverSections = (category && naverSectionMap[category])
    ? naverSectionMap[category]
    : ['101', '103', '105']; // 기본: 경제 + 생활문화 + IT

  // ── 카테고리별 Reddit 서브레딧 매핑 ──────────────────────────────────────────
  const redditMap: Record<string, string[]> = {
    travel:  ['travel', 'solotravel', 'backpacking', 'digitalnomad'],
    beauty:  ['SkincareAddiction', 'MakeupAddiction', 'AsianBeauty', 'beauty'],
    finance: ['personalfinance', 'financialindependence', 'investing', 'passive_income'],
    fitness: ['fitness', 'loseit', 'bodyweightfitness', 'intermittentfasting'],
    mindset: ['GetMotivated', 'selfimprovement', 'productivity', 'DecidingToBeBetter'],
    food:    ['food', 'EatCheapAndHealthy', 'Cooking', 'MealPrepSunday'],
    it:      ['technology', 'artificial', 'ChatGPT', 'MachineLearning'],
    daily:   ['LifeProTips', 'mildlyinteresting', 'relationship_advice', 'antiwork'],
  };
  const redditSubs = (category && redditMap[category])
    ? redditMap[category]
    : ['LifeProTips', 'technology', 'worldnews', 'personalfinance', 'GetMotivated'];

  // ── 병렬 수집 (10개 소스 동시) ──────────────────────────────────────────────
  const [
    naverTitles, youtubeTitles, redditTitles, hnTitles,
    koreanNewsTitles, bbcTitles, phTitles, yonhapTitles, ytnTitles,
    googleTrendsTitles,
  ] = await Promise.all([
    isEn ? Promise.resolve([]) : fetchNaverNews(naverSections),
    fetchYouTubeTrending(isEn ? 'US' : 'KR'),
    fetchReddit(redditSubs),
    fetchHackerNews(),
    isEn ? Promise.resolve([]) : fetchKoreanMajorNews(),
    fetchBBCNews(),
    (category === 'it' || !category) ? fetchProductHunt() : Promise.resolve([]),
    isEn ? Promise.resolve([]) : fetchYonhap(),
    isEn ? Promise.resolve([]) : fetchYTN(),
    // Google Trends via Apify (APIFY_API_TOKEN 사용, 한국 실시간 급상승 키워드)
    isEn ? Promise.resolve([]) : fetchGoogleTrendsApify(baseKeywords),
  ]);

  // 소스별 레이블 구분 → GPT가 복수 소스 교차 신호 분석 가능
  const buildSection = (label: string, items: string[]) =>
    items.length > 0
      ? `[${label} — ${items.length}건]\n${items.slice(0, 12).map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : null;

  const sections = [
    buildSection(isEn ? '🔥 Google Trends KR (Real-time via Apify)' : '🔥 Google Trends KR 실시간 급상승 (수집)', googleTrendsTitles),
    buildSection(isEn ? 'YouTube Trending' : 'YouTube 실시간 트렌딩', youtubeTitles),
    buildSection(isEn ? 'Naver News (Economy/Lifestyle/IT)' : '네이버 뉴스 (경제/생활/IT)', naverTitles),
    buildSection(isEn ? 'Korean Major Press (Chosun/JoongAng/Donga)' : '국내 주요 언론 (조선/중앙/동아)', koreanNewsTitles),
    buildSection(isEn ? 'Yonhap News (Korea No.1 Wire)' : '연합뉴스 (국내 1위 통신사)', yonhapTitles),
    buildSection(isEn ? 'YTN 24h Breaking News' : 'YTN 24시간 속보', ytnTitles),
    buildSection('BBC Global News', bbcTitles),
    buildSection(isEn ? 'Reddit Top Posts Today' : 'Reddit 오늘의 탑 포스트', redditTitles),
    buildSection('Hacker News Top', hnTitles),
    buildSection('Product Hunt Today', phTitles),
  ].filter(Boolean);

  const allUniq = [...googleTrendsTitles, ...naverTitles, ...youtubeTitles, ...redditTitles, ...hnTitles, ...koreanNewsTitles, ...bbcTitles, ...phTitles, ...yonhapTitles, ...ytnTitles]
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
  const fetchedCount = allUniq.length;

  const freshTag = `[${nowStr} ${timeOfDay} | 세션ID: ${randomSeed}]`;
  const fetchedData = fetchedCount > 0
    ? `=== 실시간 멀티소스 데이터 ${freshTag} (총 ${fetchedCount}건, ${sections.length}개 소스 활성) ===\n⚡ 이번 세션(${randomSeed})은 반드시 이전과 다른 신선한 주제를 발굴할 것.\n⚡ 복수 소스 동시 등장 = 최고 트래픽 신호 — 최우선!\n\n${sections.join('\n\n')}`
    : `${freshTag} [실시간 데이터 없음] — AI가 ${timeOfDay} 시간대 최신 트렌드 자체 분석. 이전 세션과 다른 주제 필수.`;

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
    const sysPromptTikTokGlobal = `You are the world's #1 TikTok FYP algorithm expert. Your mission: identify topics that will reach 1M~50M views on GLOBAL TikTok RIGHT NOW.
Today: ${today}

## Target Audience (STRICT)
- Global English-speaking viewers: US (40%), UK (20%), Australia (15%), Canada (10%), Europe (15%)
- Age 16-34 (Gen Z + Young Millennials)
- DO NOT create Korean-specific content. Think US/UK TikTok FYP.

## TikTok 2026 FYP Algorithm Formula
- Watch-through rate (70%+) > Shares (20%) > Comments (7%) > Likes (3%)
- First 0-3 seconds: MUST stop the scroll (pattern interrupt = shock/curiosity/humor)
- Hook formula: "POV:", "I can't believe...", "Nobody talks about...", "This is why...", "Wait for it..."
- Retention trick: withhold the payoff until the last 5 seconds
- Duet/Stitch/Challenge potential = 3x algorithm boost
- Trending audio + niche topic = FYP gold

## 7 Global Gen Z Viral Psychology Triggers
1. **Pattern Interrupt**: Unexpected visual or statement in first frame → brain can't scroll past
2. **Curiosity Gap**: "The thing nobody tells you about..." → must watch to the end
3. **Social Identity**: "If you're a [type of person], watch this" → instant self-selection
4. **Controversy Bait**: Mildly controversial take → comment section explodes
5. **FOMO Trigger**: "Everyone is doing this and you don't know yet" → share immediately
6. **Emotional Payoff**: Satisfying, heartwarming, or shocking reveal → rewatch + share
7. **Life Hack Utility**: "This saves you $X/hour" → save rate goes through the roof

## Content Formats That ALWAYS Go Viral (2026)
- POV: (point of view scenarios)
- "I tried X for 30 days" (challenge/experiment)
- "Things that [profession] don't tell you"
- "Before vs After" (transformation)
- "Day in the life of..." (aspirational)
- "Unpopular opinion: ..." (controversy)
- Storytime (parasocial connection)
- "Rating my followers' [X]" (interactive)

## ABSOLUTE RULES
- ALL output MUST be in English (keywords, hooks, hashtags, viralFormat, reasons — EVERYTHING)
- NO Korean content, NO K-pop-only topics, NO Korean-market-only references
- Each topic must have real potential to hit the US/UK/AU TikTok FYP
- viralFormat must be one of: POV | Challenge | Storytime | LifeHack | BeforeAfter | UnpopularOpinion | DayInTheLife | Experiment`;

    const sysPromptKo = isTikTok ? sysPromptTikTokGlobal : `당신은 대한민국 SNS 조회수·저장수 폭발을 전문으로 하는 최상위 바이럴 콘텐츠 전략가입니다.
오늘: ${today}

## 핵심 미션
9개 실시간 소스(YouTube·네이버·연합뉴스·YTN·조선/중앙/동아·BBC·Reddit·HN·Product Hunt)의 데이터를 교차 분석해,
지금 이 순간 인스타그램에서 저장 폭발 + 조회수 최대치를 달성할 카드뉴스 주제를 선별합니다.

## 7대 뇌과학 기반 바이럴 심리 트리거
1. **손실 혐오(Loss Aversion)**: "안 하면 손해", "모르면 나만 뒤처짐" → 뇌는 이익보다 손실에 2.5배 반응
2. **호기심 격차(Curiosity Gap)**: "99%가 모르는", "아무도 안 알려주는" → 정보 공백이 생기면 반드시 채우려 함
3. **사회적 증거(Social Proof)**: "이미 XX만명이", "전문가들이 선택한" → 타인 행동을 따라하는 본능
4. **권위 효과(Authority)**: "의사/변호사/재테크 전문가가", "대기업 임원이 쓰는" → 전문가 출처 = 신뢰+저장
5. **희소성+긴박감(Scarcity+Urgency)**: "지금 당장", "이번 달만", "곧 사라지는" → 즉각적 행동 유발
6. **자아 연결(Identity)**: "직장인이라면", "30대라면", "N잡러라면" → 내 얘기라는 느낌 = 저장+공유
7. **숫자의 힘(Specificity)**: "7가지", "3단계", "TOP 5" → 구체적 숫자 = 정보 신뢰도 300% 상승

## 인스타그램 2026 알고리즘 공식
- 저장(35%) > 공유(25%) > 댓글(20%) > 재생(15%) > 좋아요(5%) 순 가중치
- 슬라이드 1: 0.3초 안에 스크롤 멈추게 하는 충격 문구 필수
- 슬라이드 2: "그래서 뭐가 문제야?" 유발 → 끝까지 읽게 만듦
- 최적 업로드: 화·목·금 저녁 9~11시 (직장인 침대 스크롤 타임)
- 최적 길이: 7~10슬라이드 (정보량 충분 + 이탈 방지)

## 복수 소스 교차 신호 우선 법칙
여러 소스에 동시에 등장하는 주제 = 지금 이 순간 대중 뇌리에 박힌 주제 = 최고 저장율 보장
→ crossSourceCount가 높을수록 최우선 배치

## 절대 피해야 할 주제 (알고리즘 억제)
- 정치·분쟁 관련 (도달 -70%)
- 오래된 정보 (저장 -80%)
- 너무 광범위한 주제 (저장 -60%, 타깃 없는 콘텐츠)`;


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
      "keyword": "Global TikTok video concept (under 60 chars, FYP viral)",
      "hook": "First 0-3 second hook (under 30 chars, pattern interrupt)",
      "hotScore": 98,
      "estimatedViews": "5M~50M views",
      "saves": "Viral share + save rate",
      "viralFormat": "POV|Challenge|Storytime|LifeHack|BeforeAfter|UnpopularOpinion|DayInTheLife|Experiment",
      "psychTrigger": "PatternInterrupt|CuriosityGap|SocialIdentity|ControversyBait|FOMO|EmotionalPayoff|Utility",
      "reason": "Why this explodes on US/UK TikTok FYP right now (under 70 chars)",
      "hashtags": ["#fyp", "#viral", "#foryou", "#trending"],
      "source": "Global TikTok Trends | Reddit | YouTube US | AI Analysis",
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

Return exactly 12 TikTok global viral topics and 6 English writing topics.
Focus on topics that resonate with GLOBAL English-speaking audiences (US, UK, AU, CA, Europe).
Do NOT include Korea-specific content. Think: What's blowing up on US/UK TikTok FYP TODAY?
EstimatedViews must be realistic for TikTok (minimum 500K, target 1M~50M).
ALL keywords, hooks, hashtags, viralFormat, psychTrigger, and reasons must be in ENGLISH.`;

    const userPromptKo = isTikTok ? userPromptTikTok : `카테고리: ${catName} | 플랫폼: 인스타그램 카드뉴스
오늘(${today}) 실시간 멀티소스 데이터:
${fetchedData}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 임무: 조회수·저장수 최대치 카드뉴스 주제 선별
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 0 — 조회수 폭발 카테고리 필터 (모든 주제에 강제 적용)
아래 7개 카테고리에서만 주제를 선별하라. 검증된 100만+ 조회수 카테고리임:
1. 돈/재테크 (월급, 부업, ETF, N잡, 절약, 세금환급) → 저장율 38%, 최대 500만 뷰
2. 다이어트/몸 변화 (살빼기, 홈트, 식단, 뱃살, 체중감량) → 저장율 34%, 최대 300만 뷰
3. AI/IT 꿀팁 (ChatGPT, 앱기능, 자동화, 생산성) → 공유율 1위, 최대 400만 뷰
4. 연애/심리/관계 (연애심리, MBTI, 자존감, 이별) → 댓글 폭발, 최대 200만 뷰
5. 직장인 공감 (야근, 퇴사, 상사, 월급쟁이, 직장스트레스) → 공유+저장 동시, 최대 250만 뷰
6. 스킨케어/뷰티 (피부관리, 루틴, 노화방지) → 여성 저장율 최고, 최대 150만 뷰
7. 음식/맛집/레시피 (요리꿀팁, 다이어트식단, 맛집) → 꾸준한 대형 트래픽
8. 여행/핫플 (서울핫플, 국내여행, 해외여행, 봄나들이, 데이트코스, 숙소꿀팁) → 시즌 폭발, 최대 200만 뷰

아래 제목 패턴을 반드시 활용하라 (검증된 100만 뷰 템플릿):
- "직장인이라면 무조건 저장할 OO 꿀팁 N가지"
- "이거 모르면 매달 XX만원 손해입니다"
- "99%가 모르는 OO의 진짜 비밀"
- "전문가들이 절대 안 알려주는 OO 방법"
- "월 OO만원 버는 사람들의 공통점 N가지"
- "OO하는 사람 vs OO 안 하는 사람 차이"
- "현지인만 아는 OO 숨겨진 핫플 N곳"
- "여행 전에 절대 몰라서는 안 될 OO 꿀팁"
- "이번 주말 가기 딱 좋은 OO 여행지 TOP N"
- "OO 여행 예산 XX만원으로 완성하는 법"

### STEP 1 — 크로스소스 교차 분석 (최우선)
위 데이터에서 복수의 소스(YouTube + 네이버 + 언론 + Reddit 등)에 동시에 등장하는 주제를 찾아라.
→ 2개 이상 소스에 등장 = 지금 이 순간 대중 관심이 폭발 중인 신호 = 최우선 선택

### STEP 2 — 카드뉴스 바이럴 공식 적용
아래 5가지 검증된 바이럴 공식 중 주제에 맞는 것을 선택해 적용:
- 🔢 숫자형: "XX가지 방법", "TOP 10", "3단계로" → 정보 밀도 높아 저장율 최고
- ⚔️ 비교형: "A vs B", "XX하는 사람 vs XX 안 하는 사람" → 공유 폭발
- 🔒 비밀형: "99%가 모르는", "아무도 안 알려주는", "숨겨진" → 클릭 충동
- ⚠️ 경고형: "이거 안 하면 손해", "지금 당장 멈춰야 할", "XX의 위험" → 저장+공유
- 💬 공감형: "직장인이라면 공감", "이런 경험 있으면", "XX인 당신에게" → 댓글 폭발

### STEP 3 — 인스타그램 알고리즘 최적화 기준
- 저장 > 공유 > 댓글 > 좋아요 (알고리즘 가중치 순서)
- 첫 슬라이드 후킹 문구가 스크롤을 멈추게 해야 함 (0.3초 안에 결정)
- "나중에 써먹겠다" 심리 → 저장 폭발 → 알고리즘 확산
- 30대 직장인/주부/N잡러가 저녁 9~11시에 저장하는 주제

### STEP 4 — 트래픽 윈도우 판단
- "즉시": 이슈가 터진지 48시간 이내 → 황금 타이밍
- "이번주": 3~7일 내 트렌드 피크 예상
- "이번달": 시즌성 주제, 꾸준한 검색량

반드시 JSON만 응답. 다른 텍스트 없이.

{
  "cardTopics": [
    {
      "rank": 1,
      "keyword": "카드뉴스 제목 (20자 이내, 숫자/비밀/경고형 포함)",
      "hook": "슬라이드1 후킹 문구 (15자 이내, 0.3초 안에 멈추게)",
      "hotScore": 99,
      "estimatedViews": "30만~100만",
      "saves": "폭발",
      "viralFormula": "숫자형|비교형|비밀형|경고형|공감형 중 1개",
      "psychTrigger": "손실혐오|호기심격차|사회적증거|권위효과|희소성|자아연결|숫자힘 중 1개",
      "crossSourceCount": 3,
      "reason": "복수소스 교차 신호 + 저장 폭발 이유 (40자 이내)",
      "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4", "#해시태그5"],
      "source": "YouTube트렌딩 | 네이버뉴스 | AI분석",
      "category": "${catName}",
      "trafficWindow": "즉시|이번주|이번달",
      "bestPostingTime": "화·목·금 저녁 9~11시|주말 오전 10~12시|평일 점심 12~13시 중 1개",
      "urgency": "즉시"
    }
  ],
  "aiWritingTopics": [
    {
      "rank": 1,
      "keyword": "블로그/AI글쓰기 주제 (30자 이내, SEO 블루오션형)",
      "searchVolume": "월 검색량 추정 (예: 2만~5만)",
      "competition": "낮음",
      "hotScore": 95,
      "reason": "검색량 급등 + 경쟁 낮음 = 상위노출 확실 (40자 이내)",
      "longtailKeywords": ["롱테일1", "롱테일2", "롱테일3"],
      "contentAngle": "1위 되는 글쓰기 각도 (40자 이내)",
      "source": "네이버뉴스 | YouTube | AI분석",
      "category": "${catName}"
    }
  ]
}

카드뉴스 주제 12개, AI글쓰기 주제 6개를 반드시 반환해줘.
- 카드뉴스 12개: crossSourceCount 높은 순 정렬, 각각 다른 viralFormula 사용
- 카드뉴스 estimatedViews 기준: 최소 10만 이상, 가능하면 100만+ 주제 우선
- 100만+ 가능 주제: 돈/재테크/다이어트/AI/연애/직장 스트레스 카테고리 최우선
- AI글쓰기 6개: 검색량 높고 경쟁 낮은 블루오션만
- 절대 중복 주제 없이, 지금 이 순간 트래픽 최대치 보장 주제만
- 주제가 부족하면 데이터에서 힌트를 얻어 AI가 확장·발굴해도 됨`;

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
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: isTikTok ? sysPromptTikTokGlobal : (isEn ? sysPromptEn : sysPromptKo) },
        { role: 'user', content: isTikTok ? userPromptTikTok : (isEn ? userPromptEn : userPromptKo) },
      ],
      temperature: 0.95,
      max_tokens: 4500,
    });

    const text = gptRes.choices[0].message.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const result = JSON.parse(jsonMatch[0]);
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    return NextResponse.json({
      cardTopics: result.cardTopics || [],
      aiWritingTopics: result.aiWritingTopics || [],
      realtime: fetchedCount > 0,
      fetchedCount,
      fetchedAt: new Date().toISOString(),
      sessionId: randomSeed,
      category: catName,
    }, { headers });
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
    { rank: 1, keyword: '직장인이 절대 모르는 연말정산 환급 꿀팁 7가지', hook: '이거 모르면 수십만원 손해', hotScore: 99, estimatedViews: '100만~300만', saves: '폭발', viralFormula: '숫자형', psychTrigger: '손실혐오', crossSourceCount: 4, reason: '세금 환급 관심 폭발, 저장율 1위 카테고리', hashtags: ['#연말정산', '#직장인꿀팁', '#세금환급', '#재테크', '#돈버는법'], source: 'AI분석', category: '재테크/돈', trafficWindow: '즉시', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '즉시' },
    { rank: 2, keyword: '99%가 모르는 다이어트 실패 진짜 이유 3가지', hook: '이래서 살이 안 빠졌구나', hotScore: 98, estimatedViews: '50만~150만', saves: '폭발', viralFormula: '비밀형', psychTrigger: '호기심격차', crossSourceCount: 4, reason: '다이어트 정보 저장율 압도적 1위', hashtags: ['#다이어트', '#살빼기', '#다이어트방법', '#체중감량', '#헬스'], source: 'AI분석', category: '운동/다이어트', trafficWindow: '즉시', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '즉시' },
    { rank: 3, keyword: 'AI로 월 300만원 버는 현실적인 방법 5가지', hook: '나만 모르고 있었음', hotScore: 97, estimatedViews: '50만~200만', saves: '폭발', viralFormula: '숫자형', psychTrigger: '사회적증거', crossSourceCount: 3, reason: 'AI 수익화 관심 폭발, 경제 불안 자극', hashtags: ['#AI부업', '#ChatGPT', '#N잡러', '#부업추천', '#온라인수입'], source: 'AI분석', category: 'IT/AI/꿀팁', trafficWindow: '즉시', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '즉시' },
    { rank: 4, keyword: '30대가 지금 당장 시작해야 할 재테크 TOP 5', hook: '40대 되면 늦습니다', hotScore: 96, estimatedViews: '30만~100만', saves: '폭발', viralFormula: '경고형', psychTrigger: '긴박감', crossSourceCount: 3, reason: '30대 재테크 FOMO 자극, 저장 폭발', hashtags: ['#재테크', '#30대재테크', '#ETF', '#주식', '#노후준비'], source: 'AI분석', category: '재테크/돈', trafficWindow: '즉시', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '즉시' },
    { rank: 5, keyword: '직장인 vs 프리랜서 연봉 2000만원 차이 나는 이유', hook: '월급쟁이가 손해인 이유', hotScore: 95, estimatedViews: '20만~80만', saves: '높음', viralFormula: '비교형', psychTrigger: '자아연결', crossSourceCount: 3, reason: '직장인 공감 폭발, 공유+저장 동시', hashtags: ['#직장인', '#프리랜서', '#연봉', '#N잡', '#퇴사'], source: 'AI분석', category: '일상/공감', trafficWindow: '즉시', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '즉시' },
    { rank: 6, keyword: '피부과 의사가 절대 안 알려주는 피부 관리법', hook: '이거 알면 피부과 안 가도 됨', hotScore: 94, estimatedViews: '20만~70만', saves: '높음', viralFormula: '권위형', psychTrigger: '권위효과', crossSourceCount: 2, reason: '피부 관리 저장율 TOP, 전문가 권위 신뢰', hashtags: ['#피부관리', '#스킨케어', '#뷰티꿀팁', '#피부과', '#뷰티'], source: 'AI분석', category: '뷰티/패션', trafficWindow: '이번주', bestPostingTime: '주말 오전 10~12시', urgency: '이번주' },
    { rank: 7, keyword: '카카오톡 99%가 모르는 숨겨진 기능 9가지', hook: '당신만 몰랐던 기능', hotScore: 93, estimatedViews: '15만~50만', saves: '높음', viralFormula: '비밀형', psychTrigger: '호기심격차', crossSourceCount: 2, reason: '실생활 앱 꿀팁 저장율 최고', hashtags: ['#카카오톡', '#스마트폰꿀팁', '#앱기능', '#IT꿀팁', '#생활꿀팁'], source: 'AI분석', category: 'IT/AI/꿀팁', trafficWindow: '이번주', bestPostingTime: '평일 점심 12~13시', urgency: '이번주' },
    { rank: 8, keyword: '헬스 초보가 3개월 만에 몸 바꾼 현실 루틴', hook: '이것만 따라하면 됩니다', hotScore: 92, estimatedViews: '10만~40만', saves: '높음', viralFormula: '공감형', psychTrigger: '사회적증거', crossSourceCount: 2, reason: '운동 시작자 공감 폭발, 구체적 루틴 저장', hashtags: ['#헬스초보', '#운동루틴', '#다이어트', '#홈트', '#헬스'], source: 'AI분석', category: '운동/다이어트', trafficWindow: '이번주', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '이번주' },
    { rank: 9, keyword: '2026 봄 서울 핫플 TOP 10 현지인 추천', hook: '관광객은 모르는 찐 핫플', hotScore: 91, estimatedViews: '10만~35만', saves: '높음', viralFormula: '숫자형', psychTrigger: '희소성', crossSourceCount: 2, reason: '봄 나들이 시즌, 위치 정보 저장 폭발', hashtags: ['#서울핫플', '#서울여행', '#봄나들이', '#데이트코스', '#주말'], source: 'AI분석', category: '여행/맛집', trafficWindow: '이번달', bestPostingTime: '주말 오전 10~12시', urgency: '이번달' },
    { rank: 10, keyword: '20대가 지금 시작하면 40대에 10억 만드는 법', hook: '복리의 마법 실제 계산', hotScore: 90, estimatedViews: '10만~30만', saves: '높음', viralFormula: '경고형', psychTrigger: '손실혐오', crossSourceCount: 2, reason: '20대 재테크 조급함 자극, FOMO 저장', hashtags: ['#20대재테크', '#10억만들기', '#ETF투자', '#부자되는법', '#재테크'], source: 'AI분석', category: '재테크/돈', trafficWindow: '이번달', bestPostingTime: '화·목·금 저녁 9~11시', urgency: '이번달' },
    { rank: 11, keyword: '직장인 점심 1만원으로 건강하게 먹는 법 7가지', hook: '편의점 말고 이걸 드세요', hotScore: 88, estimatedViews: '8만~25만', saves: '보통', viralFormula: '숫자형', psychTrigger: '자아연결', crossSourceCount: 1, reason: '직장인 공감 + 실용 정보 저장', hashtags: ['#직장인점심', '#건강식', '#다이어트식단', '#편의점', '#직장생활'], source: 'AI분석', category: '요리/레시피', trafficWindow: '이번달', bestPostingTime: '평일 점심 12~13시', urgency: '이번달' },
    { rank: 12, keyword: '연애 초기에 절대 하면 안 되는 행동 5가지', hook: '이것 때문에 차였습니다', hotScore: 87, estimatedViews: '8만~20만', saves: '보통', viralFormula: '경고형', psychTrigger: '자아연결', crossSourceCount: 1, reason: '연애 공감 콘텐츠 댓글+저장 동반', hashtags: ['#연애', '#연애꿀팁', '#썸', '#데이트', '#연애상담'], source: 'AI분석', category: '일상/공감', trafficWindow: '이번달', bestPostingTime: '주말 오전 10~12시', urgency: '이번달' },
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
