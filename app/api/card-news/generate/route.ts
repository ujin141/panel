import { NextRequest, NextResponse } from 'next/server';
import { openai, getOpenAI } from '@/lib/openai';

export const dynamic = 'force-dynamic';

// ─── 슬라이드 텍스트 생성 ──────────────────────────────────────────────────────
async function generateSlides(topic: string, category: string, brandName: string) {
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

  const instruction = categoryTranslations[category] || category;
  const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 대한민국 인스타그램 카드뉴스 트래픽을 지배하는 최고의 알고리즘 해커이자 마케터입니다.
현재 날짜는 ${currentDate} (2026년) 입니다. 본문에 포함되는 모든 정보, 팩트, 수치, 사례는 무조건 2026년 최신 기준이어야 합니다. 낡은 과거 데이터는 철저히 배제하세요.
무조건 저장이 터지고 공유가 일어나는 미친 카드뉴스를 만들어야 합니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

🔥 트래픽 폭발을 위한 도파민 해킹 7대 법칙:
1. 커버(Hook): 스크롤을 0.1초 만에 멈추게 하는 극단적 대비, 숫자, 금지어, 공포를 자극하세요.
   예: "99%가 속고 있는", "10년차 전문가가 무덤까지 가져갈", "제발 OOO 하지 마세요"
2. 본문(Agitate & Value): 뻔한 소리는 쓰레기입니다. "이건 몰랐지?" 할 만한 희귀 정보나 뼈때리는 팩트폭력을 리스트 형태로 전달하세요.
3. 시각적 구조화: 텍스트는 최대한 줄이고, 이모지를 활용해 1초 만에 직관적으로 읽히게 하세요.
   (📍장소 ✈️교통 🍜음식 💰비용 🕐시간 🔥핫플 💡핵심 ✅체크 🚨경고)
4. 본문 각 포인트는 무조건 20자 이내로 팩트만 타격감 있게 배치하세요.
5. 저장/공유 트리거: 마지막 정보 슬라이드에는 "까먹기 전에 무조건 저장🔖", "친구 태그해서 알려주기" 멘트를 교묘하게 넣으세요.
6. 마지막 슬라이드(CTA): "더 많은 비밀 정보는 @계정명 팔로우"로 강력한 팔로우 압박을 넣으세요.
7. 줄바꿈은 반드시 \\n으로 처리하여 시각적 타격감을 주세요.
8. [중요] 슬라이드 개수 동적 할당: 사용자가 제시한 주제에 특정 개수(예: '5가지', '10곳', '7개')가 명시되어 있다면, **반드시 그 개수만큼 본문 슬라이드를 생성**하세요. 
   - 예: '10곳' -> 커버 1장 + 본문 10장 + CTA 1장 = 총 12장.
   - 개수가 명시되어 있지 않다면 기본적으로 본문 3~4장을 생성하세요.
   - 각 슬라이드의 \`tag\` 필드는 '현재 페이지 번호 / 총 페이지 수' 형식으로 정확하게 계산해서 넣으세요.

주제별 떡상 작성법:
- 정보/꿀팁: 모르면 돈 잃고 시간 날리는 치명적인 꿀팁, 단계별 리스트업.
- 여행: 절대 실패 안하는 현지인 찐 루트, 웨이팅 피하는 꼼수.
- 자기계발/돈: 뼈때리는 현실 조언, 구체적 액션 플랜 필수.

JSON 형식 (아래는 3가지 본문일 때의 예시일 뿐, 주제의 개수에 맞춰 슬라이드 배열 크기를 동적으로 조절하세요):
{
  "slides": [
    { "id": "1", "title": "[극단적 도파민 훅]\\n[결과/부제]", "body": "", "tag": "01 / 05" },
    { "id": "2", "title": "도파민 폭발 핵심 정보 1", "body": "🚨 구체적 팩트 1 (20자 이내)\\n✅ 구체적 팩트 2 (20자 이내)\\n💡 진짜 아무도 모르는 꿀팁", "tag": "02 / 05", "number": "01" },
    { "id": "3", "title": "도파민 폭발 핵심 정보 2", "body": "🔥 구체적 팩트 1 (20자 이내)\\n✅ 구체적 팩트 2 (20자 이내)\\n💰 실용적인 수치 정보", "tag": "03 / 05", "number": "02" },
    { "id": "4", "title": "도파민 폭발 핵심 정보 3", "body": "⭐ 구체적 팩트 1 (20자 이내)\\n✅ 구체적 팩트 2 (20자 이내)\\n👉 당장 실천해야 할 것", "tag": "04 / 05", "number": "03" },
    { "id": "5", "title": "안 저장하면\\n100% 후회합니다 🔖", "body": "💾 까먹기 전에 무조건 저장하세요\\n👉 팔로우하고 상위 1% 꿀팁 받기", "tag": "05 / 05" }
  ]
}`,
      },
      {
        role: 'user',
        content: `주제: "${topic}"
카드뉴스 유형: ${instruction}
브랜드명: ${brandName}

위 주제로 인스타그램 조회수 폭발할 카드뉴스 5장을 JSON으로 작성해줘.

[커버 슬라이드 제목 예시]
- 주제가 "오사카 여행"이면: "99%가 모르는 오사카\\n현지인 맛집 TOP 5"
- 주제가 "제주 숙소"이면: "숙박비 30% 아끼는\\n제주 숙소 진짜 꿀팁"
- 주제가 "다이어트"이면: "헬스장 안 가도\\n한 달 -5kg 가능한 이유"

[본문 포인트 예시]
주제: "오사카 도톤보리 맛집"
- 슬라이드2 본문: "🍜 金龍라멘 24시 오픈, 줄서도 필수\\n💰 650엔, 간장+돈코츠 반반 추천\\n🕐 오전 11시 웨이팅 없는 황금타임"
- 슬라이드3 본문: "🦀 카니도라쿠 1등 대게 버터구이\\n💰 시장가 대비 30% 저렴한 도톤보리점\\n📍 신사이바시 방향 출구로 도보 3분"

이처럼 구체적인 실제 정보+수치+위치를 반드시 포함해줘.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 1800,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}


// ─── 캡션 + 해시태그 생성 ────────────────────────────────────────────────────
async function generateCaption(topic: string, category: string, brandName: string): Promise<{ caption: string; hashtags: string[] }> {
  const categoryHint: Record<string, string> = {
    tips: '꿀팁/노하우 공유 톤으로',
    facts: '정보 전달 + 신뢰감 있는 톤으로',
    story: '공감대 형성, 스토리텔링 톤으로',
    promo: '제품/서비스 홍보, 구매 유도 톤으로',
    howto: '단계별 안내, 친절한 톤으로',
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 대한민국 1위 바이럴 마케터이자 인스타그램 알고리즘 해커입니다. 반드시 아래 JSON 형식으로만 응답하세요.

🔥 알고리즘 폭발 캡션 4대 공식:
1. 첫 줄(Hook): 스크롤을 멈추는 가장 자극적인 한 문장 ("99%가 매일 하면서도 모르는 최악의 습관")
2. 본문(Value): 짧고 팩트 위주의 문장 2~3개. 너무 길게 쓰지 마세요.
3. 폭발적 인게이지먼트(DM 자동화 유도): 알고리즘은 '댓글'을 가장 좋아합니다. "댓글로 '비밀'이라고 남겨주시면 OOOO 링크를 DM으로 보내드릴게요!" 같은 강력한 오토 DM 유도 문구를 반드시 넣으세요.
4. 팔로우/저장 압박: "까먹기 전에 저장🔖", "더 많은 꿀팁은 @계정명 팔로우" 강제 삽입.

해시태그 전략:
- 알고리즘 노출용 소형 태그(1천~1만) 5개
- 중형 태그(1만~10만) 8개
- 대형 태그(10만+) 5개
- 검색 유입을 노린 실질적이고 구체적인 한글 키워드 위주.

{
  "caption": "[첫줄 떡상 훅]\\n\\n[핵심 가치 2~3문장]\\n\\n🎁 댓글에 'OO'이라고 남겨주시면, 관련 꿀팁 링크를 DM으로 보내드릴게요!\\n\\n🔖 나중에 또 보려면 지금 바로 저장!\\n👉 매주 이런 꿀팁 받기: @{브랜드명} 팔로우",
  "hashtags": ["태그1", "태그2", ... (18-20개)]
}`,
      },
      {
        role: 'user',
        content: `주제: "${topic}"
카테고리: ${categoryHint[category] || categoryHint.tips}
브랜드명: ${brandName}

위 주제로 댓글(오토DM 유도), 저장, 팔로우가 미친 듯이 터질 인스타그램 캡션과 해시태그를 작성해줘.

[캡션 예시 - 주제: 오사카 여행]
"오사카 가서 이거 모르면 진짜 10만 원 손해 봅니다 😳\\n\\n현지인만 아는 도톤보리 찐 맛집이랑 웨이팅 피하는 법 정리했어요.\\n\\n🎁 댓글에 '오사카'라고 남겨주시면, 10초 만에 구글맵 맛집 리스트 공유 링크를 DM으로 쏴드릴게요!\\n\\n🔖 까먹기 전에 무조건 저장 필수\\n✈️ 매주 일본 현지 꿀팁 올립니다 → @${brandName} 팔로우"

이처럼 강력한 후킹 + 댓글(DM) 유도 + 저장/팔로우 강요를 모두 담아줘.`,
      },
    ],
    temperature: 0.85,
    max_tokens: 700,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── 캡션 폴백 ───────────────────────────────────────────────────────────────
function buildFallbackCaption(topic: string, category: string, brandName: string): { caption: string; hashtags: string[] } {
  const captions: Record<string, string> = {
    tips: `혹시 ${topic} 제대로 알고 계셨나요? 모르면 진짜 손해예요 😳\n\n꼭 알아야 할 핵심만 골라서 카드뉴스로 만들었어요.\n슬라이드 끝까지 보시면 바로 써먹을 수 있어요 💡\n\n나중에 또 찾으려면 지금 저장해두세요 🔖\n매주 이런 꿀팁 올려드려요 → ${brandName} 팔로우 필수 👆`,
    facts: `이 사실 알고 나면 생각이 완전히 달라질 거예요 😮\n\n${topic}에 대해 대부분이 모르는 놀라운 데이터만 모았어요.\n슬라이드 넘기면서 확인해보세요 📊\n\n유용했다면 저장 필수 🔖 나중에 못 찾아요!\n더 많은 인사이트는 ${brandName}에서 매주 업로드 ✨`,
    story: `공감되는 분 손들어요 🙋 저도 똑같이 겪었거든요.\n\n${topic}에 관한 진짜 이야기, 솔직하게 풀어봤어요.\n마지막 슬라이드까지 보시면 분명 도움될 거예요 💬\n\n공감됐다면 저장해두세요 🔖 친구한테 공유해도 좋아요!\n더 솔직한 이야기는 ${brandName} 팔로우하면 매주 올라와요 🤍`,
    promo: `이거 진작 알았더라면 얼마나 좋았을까요 😭\n\n${topic}, 고민이 많으셨죠? 이 카드뉴스 한 장으로 해결돼요.\n슬라이드 넘겨서 핵심만 확인하세요 🚀\n\n관심 있으신 분 DM 주세요 📩 빠르게 답드려요!\n${brandName} 팔로우하면 이런 정보 가장 먼저 받아보실 수 있어요 💪`,
    howto: `이 순서대로만 하면 진짜 됩니다 ✅\n\n${topic}, 많은 분들이 어렵다고 하시는데 생각보다 쉬워요.\n슬라이드 보면서 하나씩 따라해보세요 📋\n\n나중에 써먹으려면 지금 저장해두세요 💾 안 저장하면 후회해요!\n매주 이렇게 쉬운 방법 올려드려요 → ${brandName} 팔로우 👇`,
  };

  const hashtagSets: Record<string, string[]> = {
    tips: [`#${topic}`, '#꿀팁', '#저장필수', '#정보공유', '#생활꿀팁', '#팁공유', '#인스타그램팁', '#유용한정보', '#노하우', '#실용정보', '#일상꿀팁', '#추천', '#팔로우', '#소통해요', '#알아두면좋은것'],
    facts: [`#${topic}`, '#알고보면', '#놀라운사실', '#정보', '#데이터', '#인사이트', '#몰랐던사실', '#트렌드', '#지식', '#저장필수', '#정보공유', '#팔로우', '#소통', '#알쓸신잡', '#유용한정보'],
    story: [`#${topic}`, '#공감', '#솔직후기', '#리얼스토리', '#경험담', '#일상', '#소통해요', '#공감백퍼', '#진솔한이야기', '#저장', '#팔로우', '#인스타일상', '#감성', '#공감스타그램', '#이야기'],
    promo: [`#${topic}`, '#추천', '#후기', '#솔직리뷰', '#정보공유', '#꿀팁', '#저장필수', '#팔로우', '#DM문의', '#소통', '#인스타마켓', '#제품추천', '#라이프스타일', '#한정', '#이벤트'],
    howto: [`#${topic}`, '#방법', '#저장필수', '#따라하기', '#단계별', '#초보자도가능', '#가이드', '#꿀팁', '#노하우', '#실천', '#자기계발', '#성장', '#팔로우', '#소통', '#유용한정보'],
  };

  return {
    caption: captions[category] || captions.tips,
    hashtags: hashtagSets[category] || hashtagSets.tips,
  };
}

// ─── 한국어 주제 → Unsplash 키워드 매핑 ──────────────────────────────────────
function topicToUnsplashKeywords(topic: string, extra = ''): string {
  const kw = topic.toLowerCase();
  // 한국 국내 명소
  if (kw.includes('성수')) return 'seongsu,seoul,korea,cafe,brick,street';
  if (kw.includes('홍대') || kw.includes('홍익')) return 'hongdae,seoul,korea,street,art,urban';
  if (kw.includes('강남') || kw.includes('청담')) return 'gangnam,seoul,korea,luxury,urban,city';
  if (kw.includes('이태원') || kw.includes('한남')) return 'itaewon,seoul,korea,multicultural,night';
  if (kw.includes('을지로') || kw.includes('종로')) return 'seoul,korea,retro,neon,alley,vintage';
  if (kw.includes('북촌') || kw.includes('인사동') || kw.includes('경복궁')) return 'bukchon,hanok,seoul,korea,traditional,roof';
  if (kw.includes('전주')) return 'jeonju,hanok,village,korea,traditional';
  if (kw.includes('제주')) return 'jeju,korea,island,coast,cliff,nature';
  if (kw.includes('부산') || kw.includes('해운대') || kw.includes('광안리')) return 'busan,korea,beach,bridge,sea,city';
  if (kw.includes('경주')) return 'gyeongju,korea,pagoda,cherry blossom,historic';
  if (kw.includes('핫플') || kw.includes('인스타') || kw.includes('감성')) return 'seoul,korea,cafe,aesthetic,trendy,instagram';
  if (kw.includes('서울') || kw.includes('한국')) return 'seoul,korea,skyline,city,modern';
  // 일본
  if (kw.includes('교토') || kw.includes('기온')) return 'kyoto,japan,torii,shrine,bamboo,temple';
  if (kw.includes('도쿄') || kw.includes('시부야') || kw.includes('신주쿠')) return 'shibuya,tokyo,japan,neon,crossing,night';
  if (kw.includes('오사카') || kw.includes('도톤보리')) return 'dotonbori,osaka,japan,neon,canal,food';
  if (kw.includes('후지') || kw.includes('하코네')) return 'mount fuji,japan,lake,reflection,sakura';
  if (kw.includes('일본')) return 'japan,travel,temple,cherry blossom,shrine';
  // 동남아
  if (kw.includes('발리')) return 'bali,indonesia,rice terrace,temple,tropical,jungle';
  if (kw.includes('방콕') || kw.includes('태국')) return 'bangkok,thailand,temple,golden,grand palace';
  if (kw.includes('치앙마이')) return 'chiang mai,thailand,temple,lantern,mountain';
  if (kw.includes('싱가포르')) return 'singapore,marina bay,supertree,night,skyline';
  if (kw.includes('하롱') || kw.includes('하노이') || kw.includes('베트남')) return 'halong bay,vietnam,limestone,emerald,boats';
  if (kw.includes('다낭') || kw.includes('호이안')) return 'hoi an,vietnam,lantern,ancient,river,night';
  if (kw.includes('보라카이') || kw.includes('세부') || kw.includes('필리핀')) return 'boracay,philippines,white beach,turquoise,tropical';
  // 유럽
  if (kw.includes('산토리니') || kw.includes('그리스')) return 'santorini,greece,blue dome,white,sunset,caldera';
  if (kw.includes('파리') || kw.includes('프랑스')) return 'paris,france,eiffel tower,seine,cafe';
  if (kw.includes('로마') || kw.includes('아말피') || kw.includes('이탈리아')) return 'amalfi coast,italy,mediterranean,cliff,colorful';
  if (kw.includes('프라하') || kw.includes('체코')) return 'prague,old town,bridge,gothic,river';
  if (kw.includes('스위스') || kw.includes('알프스')) return 'swiss alps,mountain,snow,lake,village';
  if (kw.includes('스페인') || kw.includes('바르셀로나')) return 'barcelona,spain,sagrada familia,architecture,gaudi';
  if (kw.includes('포르투갈') || kw.includes('리스본')) return 'lisbon,portugal,tram,tiles,sunset,rooftop';
  if (kw.includes('터키') || kw.includes('카파도키아')) return 'cappadocia,turkey,hot air balloon,rock,sunrise';
  if (kw.includes('이스탄불')) return 'istanbul,turkey,mosque,bosphorus,bazaar';
  if (kw.includes('런던') || kw.includes('영국')) return 'london,big ben,thames,street,architecture';
  // 중동/기타
  if (kw.includes('두바이')) return 'dubai,burj khalifa,desert,skyline,luxury';
  if (kw.includes('몰디브')) return 'maldives,overwater bungalow,turquoise,beach,coral';
  if (kw.includes('하와이')) return 'hawaii,beach,volcanic,tropical,napali coast,ocean';
  if (kw.includes('뉴욕') || kw.includes('미국')) return 'new york,manhattan,skyline,brooklyn bridge';
  if (kw.includes('호주') || kw.includes('시드니')) return 'sydney,opera house,harbour,australia';
  if (kw.includes('뉴질랜드')) return 'new zealand,milford sound,fjord,mountain';
  if (kw.includes('모로코')) return 'marrakech,morocco,medina,colorful,souk';
  // 카테고리별
  if (kw.includes('맛집') || kw.includes('음식') || kw.includes('카페')) return 'food,restaurant,cafe,delicious,aesthetics';
  if (kw.includes('항공') || kw.includes('비행기')) return 'airplane,airport,sky,travel,window';
  if (kw.includes('숙소') || kw.includes('호텔') || kw.includes('리조트')) return 'hotel,resort,pool,luxury,travel';
  if (kw.includes('뷰티') || kw.includes('스킨') || kw.includes('화장')) return 'skincare,beauty,cosmetics,flatlay,makeup';
  if (kw.includes('다이어트') || kw.includes('헬스') || kw.includes('운동')) return 'fitness,healthy food,workout,lifestyle,nature';
  return extra || 'travel,landscape,scenic,beautiful,destination';
}

// ─── GPT로 정밀 키워드 추출 (선택적) ────────────────────────────────────────
async function getUnsplashKeywordsViaGPT(topic: string, slideContext = ''): Promise<string> {
  try {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You extract precise Unsplash search keywords from a travel topic or slide content.
Rules:
- Output ONLY a comma-separated list of 4-6 English keywords
- Choose keywords that will find beautiful, relevant real photos on Unsplash
- Korean location examples:
  • "성수동 인스타 핫플" → "seongsu,seoul,korea,brick,cafe,street"
  • "홍대 감성 카페" → "hongdae,seoul,cafe,street,colorful,urban"
  • "제주 오름 뷰" → "jeju,korea,volcanic,island,nature,coast"
- International examples:
  • "교토 단풍 여행" → "kyoto,japan,autumn,maple,temple,red leaves"
  • "산토리니 3박" → "santorini,greece,white,blue dome,sunset,caldera"
- NO explanation, just keywords`,
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

// ─── 이미지 URL 가져오기 (Pexels 우선 → Unsplash 폴백) ──────────────────────
async function fetchUnsplashUrl(keywords: string, sig: number = 0): Promise<string | null> {
  // 방법 1: Pexels API (키 있을 때) — 가장 정확하고 안정적
  if (process.env.PEXELS_API_KEY) {
    try {
      // 쉼표 구분 키워드 → 공백 구분 검색어 (Pexels는 공백 검색이 더 정확)
      const searchQuery = keywords
        .split(',')
        .map(k => k.trim())
        .slice(0, 4)              // 최대 4개 키워드만 사용
        .join(' ');
      const q = encodeURIComponent(searchQuery);
      const perPage = 15;
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${q}&orientation=square&per_page=${perPage}&page=1`,
        {
          headers: { Authorization: process.env.PEXELS_API_KEY! },
          next: { revalidate: 0 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const photos: any[] = data?.photos || [];
        if (photos.length > 0) {
          // sig를 기반으로 다른 사진 선택 (슬라이드마다 다른 이미지)
          const idx = sig % photos.length;
          const photo = photos[idx];
          const url = photo?.src?.large2x || photo?.src?.large || photo?.src?.original;
          if (url) {
            console.log(`[pexels] sig=${sig} idx=${idx}/${photos.length} → ${url.slice(0, 70)}`);
            return url;
          }
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.warn('[pexels] API error:', res.status, errText.slice(0, 100));
      }
    } catch (err: any) {
      console.warn('[pexels] fetch failed:', err?.message?.slice(0, 60));
    }
  }

  // 방법 2: Unsplash API (키 있을 때)
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

  // 방법 3: Unsplash Source (무료, API키 불필요)
  const encodedKw = encodeURIComponent(keywords);
  return `https://source.unsplash.com/featured/1080x1080/?${encodedKw}&sig=${sig}`;
}


// ─── 커버 이미지 (Unsplash) ───────────────────────────────────────────────────
async function generateCoverImage(topic: string, _category: string, _theme: string): Promise<string> {
  console.log('[card-news] Fetching cover image from Unsplash for:', topic);
  const keywords = await getUnsplashKeywordsViaGPT(topic);
  console.log('[card-news] Cover keywords:', keywords);
  const url = await fetchUnsplashUrl(keywords, 0);
  if (!url) throw new Error('Unsplash 이미지를 가져올 수 없습니다');
  return url;
}

// ─── 슬라이드별 이미지 (Unsplash) ────────────────────────────────────────────
async function generateSlideImage(title: string, body: string, topic: string, _theme: string, slideIdx = 1): Promise<string | null> {
  try {
    // 슬라이드 제목+본문을 추가 컨텍스트로 GPT에 전달
    const slideContext = `${title} - ${body}`.slice(0, 150);
    const keywords = await getUnsplashKeywordsViaGPT(topic, slideContext);
    console.log(`[card-news] Slide[${slideIdx}] keywords: ${keywords}`);
    return await fetchUnsplashUrl(keywords, slideIdx + 10);
  } catch (err: any) {
    console.warn('[card-news] Slide image fetch failed:', err?.message?.slice(0, 60));
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
    // 주의: 400은 콘텐츠 정책 위반 등 일반 오류도 포함되므로 제외
  );
}

// ─── 카테고리별 슬라이드 템플릿 ───────────────────────────────────────────────
const slideTemplates: Record<string, (topic: string, brand: string) => Array<{id:string;title:string;body:string;tag:string;number?:string}>> = {
  tips: (topic, brand) => [
    { id:'1', title:`99%가 모르는\n${topic} 진짜 꿀팁`, body:'', tag:'01 / 05' },
    { id:'2', title:`알면 소름 돋는\n첫 번째 꿀팁`, body:`📌 대부분이 놓치는 핵심 포인트예요\n✅ 바로 오늘부터 써먹을 수 있어요\n💡 이것만 해도 결과가 확 달라집니다`, tag:'02 / 05', number:'01' },
    { id:'3', title:`이걸 몰랐다면\n지금부터 달라져요`, body:`🔥 많은 분들이 시도하다 포기하는 이유\n✅ 딱 이 방법 하나로 해결됐어요\n💰 돈·시간 둘 다 아끼는 진짜 비법`, tag:'03 / 05', number:'02' },
    { id:'4', title:`전문가도 쓰는\n숨겨진 꿀팁`, body:`⭐ 알고 나면 왜 몰랐나 싶을 방법\n✅ 지금 당장 실천 가능한 구체적 팁\n👉 ${topic} 고수들의 공통 습관`, tag:'04 / 05', number:'03' },
    { id:'5', title:`저장 안 하면\n나중에 못 찾아요 🔖`, body:`💾 지금 바로 저장해두세요\n👉 ${brand} 팔로우하면 매주 꿀팁 드려요`, tag:'05 / 05' },
  ],
  facts: (topic, brand) => [
    { id:'1', title:`이 사실 알면\n생각이 달라져요`, body:'', tag:'01 / 05' },
    { id:'2', title:`대부분이 모르는\n충격적인 統計`, body:`📊 전문가들도 놀란 실제 데이터예요\n✅ 알고 나면 행동이 달라지는 숫자\n💡 이게 왜 중요한지 슬라이드 끝까지 보세요`, tag:'02 / 05', number:'01' },
    { id:'3', title:`숫자로 보면\n완전히 달라 보여요`, body:`🔥 ${topic} 관련 가장 충격적인 수치\n✅ 이 데이터를 아는 사람은 1%뿐\n📌 출처: 최신 리서치·전문가 분석`, tag:'03 / 05', number:'02' },
    { id:'4', title:`이 사실을 알면\n지금 당장 달라지는 것`, body:`⭐ 아는 것과 모르는 것의 결정적 차이\n✅ 오늘부터 바뀌는 구체적 행동 방법\n👉 이미 아는 분들은 앞서 나가고 있어요`, tag:'04 / 05', number:'03' },
    { id:'5', title:`저장 안 하면\n나중에 후회해요 📊`, body:`💾 지금 저장해두세요, 나중에 찾기 어려워요\n👉 ${brand} 팔로우하면 이런 인사이트 매주!`, tag:'05 / 05' },
  ],
  story: (topic, brand) => [
    { id:'1', title:`공감되면\n마지막까지 봐주세요`, body:'', tag:'01 / 05' },
    { id:'2', title:`저도 처음엔\n이랬거든요`, body:`😅 솔직히 말하면 저도 완전 초보였어요\n✅ 아무것도 모르는 상태에서 시작했죠\n💡 근데 딱 이 한 가지가 모든 걸 바꿨어요`, tag:'02 / 05', number:'01' },
    { id:'3', title:`그때 이걸 알았더라면\n진짜 달랐을 텐데`, body:`🔥 몰랐을 때 얼마나 돌아갔는지 몰라요\n✅ 알고 나니까 이렇게 간단한 방법인데\n📌 지금 알았으니까 여러분은 앞서 나가는 거예요`, tag:'03 / 05', number:'02' },
    { id:'4', title:`그 이후\n내 삶이 바뀐 것들`, body:`⭐ 작은 변화 하나가 이렇게 많은 걸 바꿔요\n✅ 생각보다 훨씬 빠르게 결과가 보였어요\n👉 여러분도 분명 할 수 있어요`, tag:'04 / 05', number:'03' },
    { id:'5', title:`공감됐다면\n저장해두세요 🤍`, body:`💾 나중에 필요할 때 꺼내볼 수 있게요\n👉 ${brand} 팔로우하면 더 많은 이야기 드려요`, tag:'05 / 05' },
  ],
  promo: (topic, brand) => [
    { id:'1', title:`이거 진작 알았으면\n얼마나 좋았을까`, body:'', tag:'01 / 05' },
    { id:'2', title:`이런 고민 있으신 분\n손들어보세요 🙋`, body:`😭 저도 똑같은 고민 오래 했어요\n✅ 근데 이게 해결책이 됐어요\n💡 어렵지 않아요, 지금 바로 시작 가능해요`, tag:'02 / 05', number:'01' },
    { id:'3', title:`쓰고 나서\n가장 많이 하는 말`, body:`🔥 "이걸 왜 이제 알았지"\n✅ 실제로 써본 분들 100% 공통 반응\n📌 복잡한 과정 없이 효과 바로 느껴요`, tag:'03 / 05', number:'02' },
    { id:'4', title:`지금 시작하면\n이게 달라져요`, body:`⭐ 한 달 후에 내가 달라져 있을 거예요\n✅ 시작한 것만으로도 이미 앞서나가는 거예요\n👉 망설이는 1분이 가장 큰 손해예요`, tag:'04 / 05', number:'03' },
    { id:'5', title:`DM으로 문의하면\n바로 답드려요 🚀`, body:`📩 궁금한 거 편하게 DM 주세요\n👉 ${brand} 팔로우하면 최신 소식 바로 받아요`, tag:'05 / 05' },
  ],
  howto: (topic, brand) => [
    { id:'1', title:`이 순서대로만 하면\n진짜 됩니다`, body:'', tag:'01 / 05' },
    { id:'2', title:`STEP 1\n이것부터 시작하세요`, body:`📌 준비 없이 시작하면 50% 실패해요\n✅ 이 한 가지만 먼저 체크하면 달라요\n💡 5분이면 충분한 준비 방법이에요`, tag:'02 / 05', number:'01' },
    { id:'3', title:`STEP 2\n핵심은 이거예요`, body:`🔥 대부분이 여기서 막혀서 포기해요\n✅ 근데 이렇게 하면 술술 풀려요\n💡 처음엔 작게, 꾸준함이 전부예요`, tag:'03 / 05', number:'02' },
    { id:'4', title:`STEP 3\n이렇게 유지하세요`, body:`⭐ 1주일만 해도 차이가 느껴져요\n✅ 기록하면 포기 확률이 70% 줄어요\n👉 눈에 보이는 변화가 의욕을 만들어요`, tag:'04 / 05', number:'03' },
    { id:'5', title:`저장하고\n오늘 바로 시작해요 💪`, body:`💾 나중에 찾으려면 지금 저장 필수!\n👉 ${brand} 팔로우하면 더 쉬운 방법 알려드려요`, tag:'05 / 05' },
  ],
};

function buildFallbackSlides(topic: string, brandName: string, category: string = 'tips') {
  const builder = slideTemplates[category] || slideTemplates.tips;
  return builder(topic || '인스타그램 성장', brandName || 'My Brand');
}


// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
    const { topic, category, theme, brandName } = body;

    if (!topic && !category) {
      return NextResponse.json({ error: '주제 또는 카테고리가 필요합니다' }, { status: 400 });
    }

    // API 키 없으면 즉시 폴백
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({
        slides: buildFallbackSlides(topic || '인스타그램 성장', brandName || 'My Brand', category || 'tips'),
        caption: buildFallbackCaption(topic || '인스타그램 성장', category || 'tips', brandName || 'My Brand'),
        coverImageUrl: null,
        fallback: true,
      });
    }

    const effectiveTopic = topic || '인스타그램 성장';
    const effectiveBrand = brandName || 'My Brand';
    const effectiveCategory = category || 'tips';

    let slidesData: any = { slides: buildFallbackSlides(effectiveTopic, effectiveBrand, effectiveCategory) };
    let captionData = buildFallbackCaption(effectiveTopic, effectiveCategory, effectiveBrand);
    let coverImageUrl: string | null = null;
    let imageError: string | null = null;
    let slideImages: (string | null)[] = [];

    try {
      // 슬라이드와 캡션은 함께 시도 (이미지와 분리)
      const [slidesResult, captionResult] = await Promise.all([
        generateSlides(effectiveTopic, effectiveCategory, effectiveBrand),
        generateCaption(effectiveTopic, effectiveCategory, effectiveBrand),
      ]);
      slidesData = slidesResult;
      captionData = captionResult;

      // 커버 이미지 (Unsplash)
      try {
        coverImageUrl = await generateCoverImage(effectiveTopic, effectiveCategory, theme || 'dark');
        console.log('[card-news] Cover image URL:', coverImageUrl?.slice(0, 80));
      } catch (imgErr: any) {
        imageError = imgErr?.message || 'Unsplash 이미지 로드 실패';
        console.error('[card-news] Cover image failed:', imgErr?.message);
        // 폴백: Unsplash Source 직접 URL
        const fallbackKw = topicToUnsplashKeywords(effectiveTopic);
        coverImageUrl = `https://source.unsplash.com/featured/1080x1080/?${encodeURIComponent(fallbackKw)}&sig=0`;
        imageError = null;
      }

      // 슬라이드별 맞춤 이미지 (Unsplash, 병렬)
      const innerSlides: any[] = (slidesData.slides || []).slice(1);
      slideImages = [null];
      if (innerSlides.length > 0) {
        console.log(`[card-news] Fetching ${innerSlides.length} slide images from Unsplash...`);
        const results = await Promise.all(
          innerSlides.map((s: any, i: number) =>
            generateSlideImage(s.title || '', s.body || '', effectiveTopic, theme || 'dark', i + 1)
          )
        );
        slideImages = [null, ...results];
        console.log('[card-news] Done:', results.filter(Boolean).length, 'slide images');
      }

    } catch (innerError: any) {
      if (isOpenAIBillingError(innerError)) {
        return NextResponse.json({
          slides: buildFallbackSlides(effectiveTopic, effectiveBrand, effectiveCategory),
          caption: buildFallbackCaption(effectiveTopic, effectiveCategory, effectiveBrand),
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
      return NextResponse.json({
        slides: buildFallbackSlides(t, b, c),
        caption: buildFallbackCaption(t, c, b),
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
