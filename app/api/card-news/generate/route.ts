import { NextRequest, NextResponse } from 'next/server';
import { openai, getOpenAI } from '@/lib/openai';

export const dynamic = 'force-dynamic';

// ─── 슬라이드 텍스트 생성 ──────────────────────────────────────────────────────
async function generateSlides(topic: string, category: string, brandName: string, language: string = 'ko') {
  const categoryTranslations: Record<string, string> = {
    travel: '여행/맛집(Travel/Food)',
    beauty: '뷰티/패션(Beauty/Fashion)',
    finance: '재테크/돈(Finance/Money)',
    fitness: '운동/다이어트(Fitness/Diet)',
    mindset: '자기계발/동기부여(Mindset/Motivation)',
    food: '요리/레시피(Food/Recipe)',
    it: 'IT/AI/꿀팁(IT/Tech/Tips)',
    daily: '일상/공감(Daily/Relatable)',
  };

  const instruction = categoryTranslations[category] || category;
  const currentDate = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 주제에서 숫자 추출 (2~20 범위만 유효)
  // 패턴1: 숫자 + 단위어 (e.g. "5가지", "7곳")
  // 패턴2: BEST/TOP + 숫자 (e.g. "BEST 9", "TOP 5")
  // 패턴3: 숫자 + BEST/TOP (e.g. "9 BEST")
  // 패턴4: 주제 내 단독 숫자 (e.g. "성수동 맛집 9")
  const extractCount = (t: string): number | null => {
    const patterns = [
      /(\d+)\s*(?:곳|가지|개|군데|장소|맛집|카페|명소|핫플|레스토랑|스팟|방법|단계|스텝|ways|tips|places|things|steps)/i,
      /(?:BEST|TOP|추천|필수|꿀팁|best|top)\s*(\d+)/i,
      /(\d+)\s*(?:BEST|TOP|best|top)/i,
      /\b(\d+)\b/,
    ];
    for (const re of patterns) {
      const m = t.match(re);
      if (m) {
        const n = parseInt(m[1]);
        if (n >= 2 && n <= 20) return n;
      }
    }
    return null;
  };
  const requestedCount = extractCount(topic);
  const totalSlides = requestedCount ? requestedCount + 2 : 5;
  const bodySlides = requestedCount || 3;

  const slideCountInstruction = requestedCount
    ? `⚠️ [필수] 주제에 "${requestedCount}"가 명시되어 있으므로 반드시 본문 슬라이드 ${bodySlides}개를 생성하세요. 총 ${totalSlides}장 (커버1 + 본문${bodySlides} + CTA1). / Must generate ${bodySlides} body slides. Total ${totalSlides} slides.`
    : `슬라이드는 커버 1장 + 본문 3장 + CTA 1장 = 총 5장으로 구성하세요. / Slides must be: 1 Cover + 3 Body + 1 CTA = Total 5 slides.`;

  const sysPromptKo = `당신은 대한민국 인스타그램 저장수·조회수 폭발을 전문으로 하는 최상위 알고리즘 해커입니다.
현재 날짜: ${currentDate}
반드시 JSON 형식으로만 응답하세요.

## 7대 뇌과학 바이럴 슬라이드 공식 (반드시 적용)
1. [커버] 손실 혐오 훅: "이거 모르면 X만원 손해", "지금 당장 멈춰야 할 OO", "99%가 모르는" → 뇌는 손실에 2.5배 반응
2. [슬라이드2] 호기심 격차 증폭: 문제를 먼저 던지고 해결책은 다음 슬라이드에 → 끝까지 읽게 만듦
3. [본문] 숫자 구체성: "3가지", "7분", "월 47만원" 같은 구체적 숫자 → 신뢰도 300% 상승
4. [본문] 이모지 리스트: 한 포인트당 한 줄 (20자 이내), 빠른 스캔 가능하게
5. [마지막 본문] 사회적 증거: "이미 XX명이 실천 중", "전문가도 추천하는" 문구
6. [CTA] 저장 압박: "지금 저장 안 하면 다시 못 찾아요" → FOMO 자극
7. [CTA] 팔로우 이유: "@브랜드 팔로우하면 이런 꿀팁 매주 받아요" → 즉각적 가치 제시

## 슬라이드 구조 공식
- 커버(1장): 극강 훅 제목 + 빈 본문 (이미지가 전부)
- 본문(N장): 제목=핵심 포인트, 본문=구체 팩트 3~5개 (이모지 리스트)
- CTA(1장): 저장+팔로우 압박 (댓글 DM 유도 포함)

## 팩트체크 규칙 (위반 시 콘텐츠 신뢰도 붕괴)
- 확인 불가 매장명·주소·가격 절대 금지
- 불확실한 정보는 "~대", "~내외" 같은 범위 표현 사용
- 존재 불명확 장소 → 동네 단위(성수동, 을지로)까지만

JSON 형식:
{
  "slides": [
    { "id": "1", "title": "스크롤 멈추는\\n극강 훅 제목", "body": "", "tag": "01 / N" },
    { "id": "2", "title": "핵심 포인트 제목", "body": "🚨 충격 팩트 (구체적 숫자 포함)\\n✅ 즉시 써먹는 방법\\n💡 아무도 안 알려준 꿀팁\\n🔑 전문가 비결", "tag": "02 / N", "number": "01" },
    { "id": "N", "title": "저장 안 하면\\n진짜 후회합니다 🔖", "body": "💾 지금 바로 저장 필수\\n🎁 댓글에 '정보' → DM으로 링크 드려요\\n👉 팔로우하고 매주 꿀팁 받기", "tag": "N / N" }
  ]
}`;

  const sysPromptEn = `You are a top global Instagram growth hacker specializing in maximizing saves and reach.
Current date: ${currentDate}. All information must be up-to-date.
Respond strictly in JSON format.

## 7 Neuro-Science Viral Slide Rules (MANDATORY)
1. [Cover] Loss Aversion Hook: "Stop doing OOO", "You're losing $X not knowing this" → Brain responds 2.5x stronger to loss
2. [Slide 2] Curiosity Gap: Raise the problem first, deliver solution on next slide → forces people to keep reading
3. [Body] Specificity: Use concrete numbers — "3 steps", "saves $470/month", "7 minutes" → trust jumps 300%
4. [Body] Emoji List: One point per line (under 50 chars), easy to scan
5. [Last Body] Social Proof: "Already used by XX people", "Experts recommend this" phrasing
6. [CTA] Save Urgency: "Save now or you'll never find this again" → triggers FOMO
7. [CTA] Follow Value: "Follow @brand for weekly tips like this" → immediate value proposition

## FACT-CHECK RULES (MANDATORY)
- NEVER fabricate store names, addresses, or exact prices
- Use ranges for prices: "around $15", "under $20/month"
- For locations: neighborhood level only

JSON format:
{
  "slides": [
    { "id": "1", "title": "Hook\\nSubtitle", "body": "", "tag": "01 / N" },
    { "id": "2", "title": "Key Point Title", "body": "🚨 Shocking fact (with specific number)\\n✅ Actionable right now\\n💡 Secret nobody tells you\\n🔑 Expert-level insight", "tag": "02 / N", "number": "01" },
    { "id": "N", "title": "Save this or\\nyou WILL regret it 🔖", "body": "💾 Save right now\\n🎁 Comment 'INFO' → I'll DM the link\\n👉 Follow for weekly tips", "tag": "N / N" }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: language === 'en' ? sysPromptEn : sysPromptKo,
      },
      {
        role: 'user',
        content: language === 'en' ? 
`Topic: "${topic}"
Category: ${instruction}
Brand Name: ${brandName}

${slideCountInstruction}

Calculate "tag" exactly as "current number / total slides".
Apply ALL 7 viral rules. Make every slide scroll-stopping. Be specific with numbers.
Never invent specific business names or addresses.` 
: 
`주제: "${topic}"
카드뉴스 유형: ${instruction}
브랜드명: ${brandName}

${slideCountInstruction}

tag는 "현재번호 / 총슬라이드수" 형식으로 정확히 계산.
7대 바이럴 규칙 전부 적용. 숫자를 구체적으로 써서 신뢰도 높이기.
매장명·주소 지어내지 말 것.`,
      },
    ],
    temperature: 0.85,
    max_tokens: 4000,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}


// ─── 캡션 + 해시태그 생성 ────────────────────────────────────────────────────
async function generateCaption(topic: string, category: string, brandName: string, language: string = 'ko'): Promise<{ caption: string; hashtags: string[] }> {
  const categoryHint: Record<string, string> = {
    tips: '꿀팁/노하우 공유 톤으로',
    facts: '정보 전달 + 신뢰감 있는 톤으로',
    story: '공감대 형성, 스토리텔링 톤으로',
    promo: '제품/서비스 홍보, 구매 유도 톤으로',
    howto: '단계별 안내, 친절한 톤으로',
  };

  const sysPromptKo = `당신은 대한민국 SNS 바이럴 마케팅 1위 전문가입니다. 반드시 JSON 형식으로만 응답하세요.
댓글·저장·팔로우를 동시에 폭발시키는 캡션과 해시태그를 작성합니다.

## 캡션 공식 (순서 준수)
1. 첫줄: 스크롤 멈추는 훅 ("이거 모르면 진짜 손해", "솔직히 충격받았어요")
2. 공백 한 줄
3. 핵심 가치 2~3문장 (읽는 즉시 저장 욕구 발생)
4. 공백 한 줄
5. 댓글 DM 유도: "댓글에 'OO' 남기면 → DM으로 [구체적 혜택] 드려요!"
6. 공백 한 줄
7. 저장 압박 + 팔로우 이유 제시

## 해시태그 전략 (20개)
- 인기 태그 5개 (#꿀팁 #정보공유 #저장필수 등)
- 중간 태그 10개 (주제 관련 구체적)
- 틈새 태그 5개 (롱테일, 경쟁 낮은 것)

⚠️ 캡션에 검증 안 된 매장명·주소·가격 절대 금지. 불확실하면 일반 표현 사용.

{
  "caption": "첫줄 훅\\n\\n핵심 가치 설명\\n\\n🎁 댓글에 'OO' 남기시면 DM으로 [혜택] 드려요!\\n\\n🔖 지금 저장 안 하면 나중에 못 찾아요\\n👉 @{브랜드명} 팔로우하면 매주 이런 꿀팁 드려요",
  "hashtags": ["태그1", "태그2", "...(총 20개)"]
}`;

  const sysPromptEn = `You are a top global viral Instagram marketer. Respond strictly in JSON format.
Write captions and hashtags that maximize comments, saves, and follows simultaneously.

## Caption Formula (follow this order)
1. First line: Scroll-stopping hook ("You're losing money not knowing this", "This honestly shocked me")
2. Empty line
3. Core value 2-3 sentences (creates instant urge to save)
4. Empty line
5. Comment DM bait: "Comment 'INFO' below → I'll DM you [specific benefit]!"
6. Empty line
7. Save urgency + follow value proposition

## Hashtag Strategy (20 tags)
- 5 popular tags (#tips #savethis #lifehacks etc.)
- 10 mid-range topic-specific tags
- 5 niche long-tail tags (low competition)

⚠️ Never include unverified store names, addresses, or prices.

{
  "caption": "Hook line\\n\\nCore value explanation\\n\\n🎁 Comment 'INFO' below → I'll DM you [benefit]!\\n\\n🔖 Save this now or you'll never find it again\\n👉 Follow @{brandName} for weekly tips like this",
  "hashtags": ["tag1", "tag2", "...(20 total)"]
}`;

  const userPromptKo = `주제: "${topic}"
카테고리: ${categoryHint[category] || categoryHint.tips}
브랜드명: ${brandName}

댓글(오토DM 유도), 저장, 팔로우가 터질 인스타그램 캡션과 해시태그 18~20개를 작성해줘.`;

  const userPromptEn = `Topic: "${topic}"
Category: ${category}
Brand Name: ${brandName}

Write an engaging Instagram caption that drives comments (Auto-DM), saves, and follows, along with 18-20 highly relevant hashtags.
IMPORTANT: Do NOT fabricate specific place names, addresses, or prices. Only mention verified, real information.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: language === 'en' ? sysPromptEn.replace('{brandName}', brandName) : sysPromptKo.replace('{브랜드명}', brandName) },
      { role: 'user', content: language === 'en' ? userPromptEn : userPromptKo },
    ],
    temperature: 0.75,
    max_tokens: 1000,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── 캡션 폴백 ───────────────────────────────────────────────────────────────
function buildFallbackCaption(topic: string, category: string, brandName: string, language: string = 'ko'): { caption: string; hashtags: string[] } {
  if (language === 'en') {
    return {
      caption: `Did you know about ${topic}? You're missing out if you don't! 😳\n\nI've packed all the essential points into these slides.\n\n🎁 Comment 'INFO' and I'll DM you the detailed link!\n\n🔖 Save this so you don't lose it!\n👉 Follow ${brandName} for weekly tips.`,
      hashtags: [`#${topic.replace(/\s/g, '')}`, '#tips', '#saveforlater', '#hacks', '#infoshare', '#useful', '#instagram', '#carousel']
    };
  }
  const caption = `혹시 ${topic} 제대로 알고 계셨나요? 모르면 진짜 손해예요 😳\n\n꼭 알아야 할 핵심만 골라서 카드뉴스로 만들었어요.\n\n🎁 댓글에 '정보'라고 남겨주시면 DM으로 상세 링크 드릴게요!\n\n🔖 나중에 또 찾으려면 지금 저장!\n👉 ${brandName} 팔로우하면 매주 꿀팁 드려요`;
  const hashtags = [`#${topic.replace(/\s/g, '')}`, '#꿀팁', '#저장필수', '#정보공유', '#생활꿀팁', '#팁공유', '#유용한정보', '#노하우', '#실용정보', '#추천', '#팔로우', '#소통해요', '#알아두면좋은것', '#인스타그램', '#카드뉴스'];
  return { caption, hashtags };
}

// ─── 한국어 주제 → Unsplash 키워드 매핑 ──────────────────────────────────────
function topicToUnsplashKeywords(topic: string, extra = ''): string {
  const kw = topic.toLowerCase();
  if (kw.includes('성수')) return 'seongsu,seoul,korea,cafe,brick,street';
  if (kw.includes('홍대') || kw.includes('홍익')) return 'hongdae,seoul,korea,street,art,urban';
  if (kw.includes('강남') || kw.includes('청담')) return 'gangnam,seoul,korea,luxury,urban,city';
  if (kw.includes('제주')) return 'jeju,korea,island,coast,cliff,nature';
  if (kw.includes('부산') || kw.includes('해운대')) return 'busan,korea,beach,bridge,sea,city';
  if (kw.includes('서울') || kw.includes('한국')) return 'seoul,korea,skyline,city,modern';
  if (kw.includes('교토') || kw.includes('기온')) return 'kyoto,japan,torii,shrine,bamboo,temple';
  if (kw.includes('도쿄') || kw.includes('시부야')) return 'shibuya,tokyo,japan,neon,crossing,night';
  if (kw.includes('오사카') || kw.includes('도톤보리')) return 'dotonbori,osaka,japan,neon,canal,food';
  if (kw.includes('일본')) return 'japan,travel,temple,cherry blossom,shrine';
  if (kw.includes('발리')) return 'bali,indonesia,rice terrace,temple,tropical,jungle';
  if (kw.includes('방콕') || kw.includes('태국')) return 'bangkok,thailand,temple,golden,grand palace';
  if (kw.includes('싱가포르')) return 'singapore,marina bay,supertree,night,skyline';
  if (kw.includes('산토리니') || kw.includes('그리스')) return 'santorini,greece,blue dome,white,sunset,caldera';
  if (kw.includes('파리') || kw.includes('프랑스')) return 'paris,france,eiffel tower,seine,cafe';
  if (kw.includes('이탈리아')) return 'amalfi coast,italy,mediterranean,cliff,colorful';
  if (kw.includes('두바이')) return 'dubai,burj khalifa,desert,skyline,luxury';
  if (kw.includes('몰디브')) return 'maldives,overwater bungalow,turquoise,beach,coral';
  if (kw.includes('하와이')) return 'hawaii,beach,volcanic,tropical,napali coast,ocean';
  if (kw.includes('뉴욕') || kw.includes('미국')) return 'new york,manhattan,skyline,brooklyn bridge';
  if (kw.includes('맛집') || kw.includes('음식') || kw.includes('카페')) return 'food,restaurant,cafe,delicious,aesthetics';
  if (kw.includes('숙소') || kw.includes('호텔') || kw.includes('리조트')) return 'hotel,resort,pool,luxury,travel';
  if (kw.includes('뷰티') || kw.includes('스킨') || kw.includes('화장')) return 'skincare,beauty,cosmetics,flatlay,makeup';
  if (kw.includes('다이어트') || kw.includes('헬스') || kw.includes('운동')) return 'fitness,healthy food,workout,lifestyle,nature';
  return extra || 'travel,landscape,scenic,beautiful,destination';
}

// ─── GPT로 정밀 키워드 추출 ────────────────────────────────────────────────
async function getUnsplashKeywordsViaGPT(topic: string, slideContext = ''): Promise<string> {
  try {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Output ONLY a comma-separated list of 4-6 English keywords for Unsplash image search. No explanation.`,
        },
        {
          role: 'user',
          content: `Topic: "${topic}"${slideContext ? `\nSlide: "${slideContext}"` : ''}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 60,
    });
    const kw = res.choices[0].message.content?.trim().replace(/\n/g, ',') || '';
    return kw || topicToUnsplashKeywords(topic);
  } catch {
    return topicToUnsplashKeywords(topic);
  }
}

// ─── 이미지 URL 가져오기 ──────────────────────────────────────────────────────
async function fetchUnsplashUrl(keywords: string, sig: number = 0): Promise<string | null> {
  if (process.env.PEXELS_API_KEY) {
    try {
      const searchQuery = keywords.split(',').map(k => k.trim()).slice(0, 4).join(' ');
      const q = encodeURIComponent(searchQuery);
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${q}&orientation=square&per_page=15&page=1`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! }, next: { revalidate: 0 } }
      );
      if (res.ok) {
        const data = await res.json();
        const photos: any[] = data?.photos || [];
        if (photos.length > 0) {
          const idx = sig % photos.length;
          const photo = photos[idx];
          const url = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
          if (url) return url;
        }
      }
    } catch (err: any) {
      console.warn('[pexels] fetch failed:', err?.message?.slice(0, 60));
    }
  }

  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const q = encodeURIComponent(keywords);
      const url = `https://api.unsplash.com/photos/random?query=${q}&orientation=squarish&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (res.ok) {
        const data = await res.json();
        return data?.urls?.regular || data?.urls?.full || null;
      }
    } catch {}
  }

  const encodedKw = encodeURIComponent(keywords);
  return `https://source.unsplash.com/featured/1080x1080/?${encodedKw}&sig=${sig}`;
}

// ─── 커버 이미지 ──────────────────────────────────────────────────────────────
async function generateCoverImage(topic: string, _category: string, _theme: string): Promise<string> {
  const keywords = await getUnsplashKeywordsViaGPT(topic);
  const url = await fetchUnsplashUrl(keywords, 0);
  if (!url) throw new Error('Unsplash 이미지를 가져올 수 없습니다');
  return url;
}

// ─── 슬라이드별 이미지 ────────────────────────────────────────────────────────
async function generateSlideImage(title: string, body: string, topic: string, _theme: string, slideIdx = 1): Promise<string | null> {
  try {
    const slideContext = `${title} - ${body}`.slice(0, 150);
    const keywords = await getUnsplashKeywordsViaGPT(topic, slideContext);
    return await fetchUnsplashUrl(keywords, slideIdx + 10);
  } catch {
    const fallbackKw = topicToUnsplashKeywords(topic);
    return `https://source.unsplash.com/featured/1080x1080/?${encodeURIComponent(fallbackKw)}&sig=${slideIdx}`;
  }
}

// ─── 빌링 에러 감지 ──────────────────────────────────────────────────────────
function isOpenAIBillingError(error: any): boolean {
  const msg = error?.message || error?.error?.message || '';
  return (
    msg.includes('Billing hard limit') ||
    msg.includes('quota') ||
    msg.includes('insufficient_quota') ||
    msg.includes('exceeded your current quota') ||
    error?.status === 429
  );
}

// ─── 폴백 슬라이드 템플릿 ─────────────────────────────────────────────────────
function buildFallbackSlides(topic: string, brandName: string, _category: string = 'tips', language: string = 'ko') {
  if (language === 'en') {
    return [
      { id: '1', title: `Secret tips about\n${topic} you didn't know`, body: '', tag: '01 / 05' },
      { id: '2', title: 'Mind-blowing\nfirst tip', body: `📌 The core point everyone misses\n✅ You can apply this today\n💡 Just doing this will change everything`, tag: '02 / 05', number: '01' },
      { id: '3', title: "If you didn't know,\nchange starts now", body: `🔥 Why so many people give up\n✅ Solved with this one method\n💰 A secret that saves time & money`, tag: '03 / 05', number: '02' },
      { id: '4', title: 'Hidden tip\nexperts use', body: `⭐ You'll wonder why you didn't know\n✅ Actionable tip right now\n👉 Common habit of experts`, tag: '04 / 05', number: '03' },
      { id: '5', title: `You'll lose this\nif you don't save 🔖`, body: `💾 Save it right now\n👉 Follow ${brandName} for weekly tips`, tag: '05 / 05' },
    ];
  }
  return [
    { id: '1', title: `99%가 모르는\n${topic} 진짜 꿀팁`, body: '', tag: '01 / 05' },
    { id: '2', title: '알면 소름 돋는\n첫 번째 꿀팁', body: `📌 대부분이 놓치는 핵심 포인트예요\n✅ 바로 오늘부터 써먹을 수 있어요\n💡 이것만 해도 결과가 확 달라집니다`, tag: '02 / 05', number: '01' },
    { id: '3', title: '이걸 몰랐다면\n지금부터 달라져요', body: `🔥 많은 분들이 시도하다 포기하는 이유\n✅ 딱 이 방법 하나로 해결됐어요\n💰 돈·시간 둘 다 아끼는 진짜 비법`, tag: '03 / 05', number: '02' },
    { id: '4', title: '전문가도 쓰는\n숨겨진 꿀팁', body: `⭐ 알고 나면 왜 몰랐나 싶을 방법\n✅ 지금 당장 실천 가능한 구체적 팁\n👉 ${topic} 고수들의 공통 습관`, tag: '04 / 05', number: '03' },
    { id: '5', title: `저장 안 하면\n나중에 못 찾아요 🔖`, body: `💾 지금 바로 저장해두세요\n👉 ${brandName} 팔로우하면 매주 꿀팁 드려요`, tag: '05 / 05' },
  ];
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
    const { topic, category, theme, brandName, language = 'ko' } = body;

    if (!topic && !category) {
      return NextResponse.json({ error: '주제 또는 카테고리가 필요합니다' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({
        slides: buildFallbackSlides(topic || '인스타그램 성장', brandName || 'My Brand', category || 'tips', language),
        caption: buildFallbackCaption(topic || '인스타그램 성장', category || 'tips', brandName || 'My Brand', language),
        coverImageUrl: null,
        fallback: true,
      });
    }

    const effectiveTopic = topic || '인스타그램 성장';
    const effectiveBrand = brandName || 'My Brand';
    const effectiveCategory = category || 'tips';

    let slidesData: any = { slides: buildFallbackSlides(effectiveTopic, effectiveBrand, effectiveCategory, language) };
    let captionData = buildFallbackCaption(effectiveTopic, effectiveCategory, effectiveBrand, language);
    let coverImageUrl: string | null = null;
    let imageError: string | null = null;
    let slideImages: (string | null)[] = [];

    try {
      const [slidesResult, captionResult] = await Promise.all([
        generateSlides(effectiveTopic, effectiveCategory, effectiveBrand, language),
        generateCaption(effectiveTopic, effectiveCategory, effectiveBrand, language),
      ]);
      slidesData = slidesResult;
      captionData = captionResult;

      try {
        coverImageUrl = await generateCoverImage(effectiveTopic, effectiveCategory, theme || 'dark');
      } catch (imgErr: any) {
        const fallbackKw = topicToUnsplashKeywords(effectiveTopic);
        coverImageUrl = `https://source.unsplash.com/featured/1080x1080/?${encodeURIComponent(fallbackKw)}&sig=0`;
      }

      const innerSlides: any[] = (slidesData.slides || []).slice(1);
      slideImages = [null];
      if (innerSlides.length > 0) {
        const results = await Promise.all(
          innerSlides.map((s: any, i: number) =>
            generateSlideImage(s.title || '', s.body || '', effectiveTopic, theme || 'dark', i + 1)
          )
        );
        slideImages = [null, ...results];
      }

    } catch (innerError: any) {
      if (isOpenAIBillingError(innerError)) {
        return NextResponse.json({
          slides: buildFallbackSlides(effectiveTopic, effectiveBrand, effectiveCategory, language),
          caption: buildFallbackCaption(effectiveTopic, effectiveCategory, effectiveBrand, language),
          coverImageUrl: null,
          slideImages: [],
          fallback: true,
          warning: 'OpenAI 크레딧 한도 초과. 샘플 슬라이드를 표시합니다.',
        });
      }
      throw innerError;
    }

    return NextResponse.json({
      slides: slidesData.slides,
      caption: captionData,
      coverImageUrl,
      slideImages,
      imageError,
    });

  } catch (error: any) {
    console.error('Card news generation error:', (error as any)?.code || 'unknown');

    if (isOpenAIBillingError(error)) {
      const t = body?.topic || '인스타그램 성장';
      const b = body?.brandName || 'My Brand';
      const c = body?.category || 'tips';
      const l = body?.language || 'ko';
      return NextResponse.json({
        slides: buildFallbackSlides(t, b, c, l),
        caption: buildFallbackCaption(t, c, b, l),
        coverImageUrl: null,
        fallback: true,
        warning: 'OpenAI 크레딧 한도 초과. 샘플 슬라이드를 표시합니다.',
      });
    }

    return NextResponse.json(
      { error: error.message || '생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
