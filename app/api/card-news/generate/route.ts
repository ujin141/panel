import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

// ─── 슬라이드 텍스트 생성 ──────────────────────────────────────────────────────
async function generateSlides(topic: string, category: string, brandName: string) {
  const categoryPrompts: Record<string, string> = {
    tips: `"${topic}" 주제로 인스타그램 카드뉴스 5장을 만들어줘. 커버(1장) + 꿀팁 3가지(3장) + 마무리(1장) 구성으로.`,
    facts: `"${topic}" 주제로 인스타그램 카드뉴스 5장을 만들어줘. 커버(1장) + 통계/사실 3가지(3장) + 마무리(1장) 구성으로.`,
    story: `"${topic}" 주제로 인스타그램 카드뉴스 5장을 만들어줘. 커버(1장) + 스토리 단계 3개(3장) + 마무리(1장) 구성으로.`,
    promo: `"${topic}" 주제로 인스타그램 카드뉴스 5장을 만들어줘. 커버(1장) + 핵심 혜택 3가지(3장) + CTA(1장) 구성으로.`,
    howto: `"${topic}" 주제로 인스타그램 카드뉴스 5장을 만들어줘. 커버(1장) + 단계별 방법 3가지(3장) + 마무리(1장) 구성으로.`,
  };

  const prompt = categoryPrompts[category] || categoryPrompts.tips;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 인스타그램 카드뉴스 전문 카피라이터입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
각 슬라이드는 title(짧게 2줄 이내, 임팩트있게), body(본문, 커버는 비워두기), tag(슬라이드 번호 "01 / 05" 형식)를 포함합니다.
제목은 줄바꿈을 \\n으로 표현하세요. 한국어로 작성하고 25자 이내로 짧고 강렬하게 쓰세요.`,
      },
      {
        role: 'user',
        content: `${prompt}
브랜드명: ${brandName}

JSON 형식:
{
  "slides": [
    { "id": "1", "title": "커버 제목\\n두번째줄", "body": "", "tag": "01 / 05" },
    { "id": "2", "title": "슬라이드 제목", "body": "본문 내용 (2-3문장)", "tag": "02 / 05", "number": "01" },
    { "id": "3", "title": "슬라이드 제목", "body": "본문 내용 (2-3문장)", "tag": "03 / 05", "number": "02" },
    { "id": "4", "title": "슬라이드 제목", "body": "본문 내용 (2-3문장)", "tag": "04 / 05", "number": "03" },
    { "id": "5", "title": "마무리 제목", "body": "팔로우/저장 유도 문구", "tag": "05 / 05" }
  ]
}`,
      },
    ],
    temperature: 0.8,
    max_tokens: 1000,
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
        content: `당신은 인스타그램 마케터입니다. 반드시 아래 JSON 형식으로만 응답하세요.
{
  "caption": "게시글 본문 (이모지 포함, 3-5문장, 저장/팔로우 유도 마무리)",
  "hashtags": ["해시태그1", "해시태그2", ... (15-20개)]
}`,
      },
      {
        role: 'user',
        content: `"${topic}" 카드뉴스의 인스타그램 게시글 캡션과 해시태그를 작성해줘.
카테고리: ${categoryHint[category] || categoryHint.tips}
브랜드명: ${brandName}
해시태그는 인기 태그와 니치 태그를 섞어서 한국어 위주로 작성해줘.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 600,
  });

  const raw = completion.choices[0].message.content ?? '{}';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── 캡션 폴백 ───────────────────────────────────────────────────────────────
function buildFallbackCaption(topic: string, category: string, brandName: string): { caption: string; hashtags: string[] } {
  const captions: Record<string, string> = {
    tips: `✨ ${topic}에 대해 꼭 알아야 할 꿀팁을 모아봤어요!\n\n처음 시작하는 분들도 쉽게 따라할 수 있도록 정리했습니다 🙌\n\n저장해두고 필요할 때 꺼내보세요 💾\n\n더 많은 정보는 프로필 링크를 확인해주세요 👆`,
    facts: `📊 ${topic}에 대한 놀라운 사실들을 알고 계셨나요?\n\n데이터로 확인하면 더욱 명확해지는 이야기입니다 📈\n\n유용했다면 저장 & 팔로우 부탁드려요!\n\n더 많은 인사이트는 ${brandName}에서 만나보세요 ✨`,
    story: `💬 ${topic}에 관한 이야기를 나눠볼게요.\n\n많은 분들이 공통으로 겪는 경험인데요, 이렇게 해결될 수 있어요 🌱\n\n공감되셨다면 저장해두세요 🔖\n\n${brandName}에서 더 많은 이야기를 만나보세요!`,
    promo: `🚀 ${topic}을 소개합니다!\n\n고민하고 계셨다면 바로 이 순간이 시작할 타이밍이에요 ⚡\n\n관심 있으신 분들은 DM이나 프로필 링크로 문의해주세요 📩\n\n${brandName}가 함께하겠습니다 💪`,
    howto: `📋 ${topic} 방법, 이렇게 하면 됩니다!\n\n순서대로 따라하면 누구나 쉽게 할 수 있어요 🎯\n\n저장해두고 나중에 참고하세요 💾\n\n${brandName}에서 더 많은 방법을 알려드릴게요 👇`,
  };

  const hashtagSets: Record<string, string[]> = {
    tips: [`#${topic}`, '#꿀팁', '#노하우', '#인스타그램', '#성장', '#팁공유', '#일상', '#라이프스타일', '#자기계발', '#뷰티팁', '#생활꿀팁', '#추천', '#정보공유', '#실용정보', '#저장'],
    facts: [`#${topic}`, '#통계', '#사실', '#정보', '#데이터', '#인사이트', '#알고보면', '#놀라운사실', '#정보공유', '#트렌드', '#뉴스', '#지식', '#학습', '#성장', '#인스타그램'],
    story: [`#${topic}`, '#스토리', '#일상', '#공감', '#이야기', '#경험담', '#솔직후기', '#리얼스토리', '#진솔한이야기', '#소통', '#팔로우', '#인스타일상', '#감성', '#공감백퍼', '#저장'],
    promo: [`#${topic}`, '#홍보', '#추천', '#신상', '#구매', '#리뷰', '#후기', '#제품추천', '#쇼핑', '#라이프스타일', '#인스타마켓', '#소통', '#팔로우', '#DM문의', '#한정'],
    howto: [`#${topic}`, '#방법', '#how_to', '#튜토리얼', '#단계별', '#초보자', '#입문', '#가이드', '#쉽게따라하기', '#정보', '#꿀팁', '#노하우', '#자기계발', '#성장', '#저장필수'],
  };

  return {
    caption: captions[category] || captions.tips,
    hashtags: hashtagSets[category] || hashtagSets.tips,
  };
}

// ─── DALL-E 3 이미지 생성 ─────────────────────────────────────────────────────
async function generateCoverImage(topic: string, category: string, theme: string): Promise<string> {
  const themeStyles: Record<string, string> = {
    dark: 'dark background, minimalist, modern design, high contrast',
    light: 'clean white background, airy minimal design, soft shadows',
    'gradient-pink': 'vibrant pink purple gradient background, feminine aesthetic, modern',
    'gradient-purple': 'rich purple indigo gradient background, elegant, premium',
    'gradient-blue': 'bright blue gradient background, fresh, energetic',
    black: 'pure black background, dramatic lighting, luxury aesthetic',
  };

  const categoryStyles: Record<string, string> = {
    tips: 'flat design icons, knowledge visualization, clean infographic style',
    facts: 'data visualization, charts, modern statistics infographic',
    story: 'storytelling illustration, warm human elements, relatable scene',
    promo: 'product showcase, marketing photography, aspirational lifestyle',
    howto: 'step-by-step visual guide, instructional design, clear process illustration',
  };

  const dallePrompt = `Instagram card news cover image for topic: "${topic}". 
Style: ${themeStyles[theme] || themeStyles.dark}, ${categoryStyles[category] || categoryStyles.tips}.
Square format 1:1, no text overlay, visually stunning, professional social media aesthetic, 
eye-catching composition. Korean beauty and lifestyle aesthetic.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: dallePrompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  return response.data[0].url ?? '';
}

// ─── 빌링 에러 감지 ──────────────────────────────────────────────────────────
function isOpenAIBillingError(error: any): boolean {
  const msg = error?.message || error?.error?.message || '';
  return (
    msg.includes('Billing hard limit') ||
    msg.includes('quota') ||
    msg.includes('insufficient_quota') ||
    error?.status === 429 ||
    error?.status === 400
  );
}

// ─── 카테고리별 슬라이드 템플릿 ───────────────────────────────────────────────
const slideTemplates: Record<string, (topic: string, brand: string) => Array<{id:string;title:string;body:string;tag:string;number?:string}>> = {
  tips: (topic, brand) => [
    { id:'1', title:`${topic}\n꿀팁 모음`, body:'', tag:'01 / 05' },
    { id:'2', title:`${topic} 꿀팁 #1`, body:`${topic}을 시작할 때 가장 먼저 해야 할 일이에요.\n작은 것부터 하나씩 실천하면 놀라운 변화가 생겨요.`, tag:'02 / 05', number:'01' },
    { id:'3', title:`${topic} 꿀팁 #2`, body:`많은 분들이 놓치는 포인트예요.\n꾸준히 반복하는 것만으로도 차이가 확실히 나요.`, tag:'03 / 05', number:'02' },
    { id:'4', title:`${topic} 꿀팁 #3`, body:`이것만 알면 ${topic}이 훨씬 쉬워져요.\n지금 당장 실천해볼 수 있는 방법이에요.`, tag:'04 / 05', number:'03' },
    { id:'5', title:`저장해두고\n나중에 써먹어요 🖤`, body:`유용했다면 저장 & 팔로우!\n더 많은 꿀팁은 ${brand}에서`, tag:'05 / 05' },
  ],
  facts: (topic, brand) => [
    { id:'1', title:`${topic}\n놀라운 사실`, body:'', tag:'01 / 05' },
    { id:'2', title:`${topic}, 이게 사실?`, body:`${topic}에 관해 대부분의 사람들이 모르는 통계예요.\n알고 나면 생각이 달라질 거예요.`, tag:'02 / 05', number:'01' },
    { id:'3', title:`알면 달라지는\n숫자`, body:`${topic}을 시작한 사람들 중 80%가 초반 한 달을 가장 어렵다고 해요.\n반대로 말하면, 한 달만 버티면 된다는 뜻이에요.`, tag:'03 / 05', number:'02' },
    { id:'4', title:`전문가들이\n말하는 핵심`, body:`${topic} 전문가들이 공통으로 강조하는 한 가지가 있어요.\n바로 '시작하는 것' 그 자체예요.`, tag:'04 / 05', number:'03' },
    { id:'5', title:`오늘부터\n시작해보세요 ✨`, body:`이 카드가 도움됐다면 저장!\n${brand}에서 더 많은 정보를 확인하세요`, tag:'05 / 05' },
  ],
  story: (topic, brand) => [
    { id:'1', title:`${topic}\n이야기`, body:'', tag:'01 / 05' },
    { id:'2', title:`처음엔\n저도 몰랐어요`, body:`${topic}을 처음 접했을 때는 어디서부터 시작해야 할지 막막했어요.\n지금 이 글을 읽는 분들과 같은 마음이었어요.`, tag:'02 / 05', number:'01' },
    { id:'3', title:`그런데 딱\n이것 하나가`, body:`우연히 알게 된 방법 하나가 ${topic}에 대한 관점을 완전히 바꿔줬어요.\n복잡하지 않아서 오히려 더 놀랐어요.`, tag:'03 / 05', number:'02' },
    { id:'4', title:`그 뒤로\n달라진 것들`, body:`${topic}을 꾸준히 하고 나서 생각지도 못한 변화들이 생겼어요.\n작은 습관 하나가 이렇게 많은 걸 바꿀 수 있다는 걸 처음 알았어요.`, tag:'04 / 05', number:'03' },
    { id:'5', title:`당신도\n할 수 있어요 🤍`, body:`저장하고 천천히 시작해보세요.\n${brand}가 함께할게요`, tag:'05 / 05' },
  ],
  promo: (topic, brand) => [
    { id:'1', title:`${topic}\n소개합니다`, body:'', tag:'01 / 05' },
    { id:'2', title:`이런 분들에게\n딱이에요`, body:`${topic}이 필요한 분들을 위해 준비했어요.\n고민이 있으셨다면 이제 해결될 거예요.`, tag:'02 / 05', number:'01' },
    { id:'3', title:`핵심 기능\n한눈에 보기`, body:`${topic}의 가장 큰 특징은 누구나 쉽게 시작할 수 있다는 점이에요.\n복잡한 과정 없이 바로 효과를 느낄 수 있어요.`, tag:'03 / 05', number:'02' },
    { id:'4', title:`실제 후기\n들어보세요`, body:`${topic}을 경험한 분들이 가장 많이 하는 말:\n"이걸 왜 이제 알았지..."`, tag:'04 / 05', number:'03' },
    { id:'5', title:`지금 바로\n시작하세요 🚀`, body:`DM 또는 링크로 문의주세요!\n${brand}가 도와드릴게요`, tag:'05 / 05' },
  ],
  howto: (topic, brand) => [
    { id:'1', title:`${topic}\n이렇게 하세요`, body:'', tag:'01 / 05' },
    { id:'2', title:`STEP 1\n준비하기`, body:`${topic}을 시작하기 전에 필요한 것들을 먼저 챙겨요.\n준비가 잘 되어 있을수록 중간에 포기할 확률이 낮아져요.`, tag:'02 / 05', number:'01' },
    { id:'3', title:`STEP 2\n실천하기`, body:`${topic}의 핵심은 작게 시작하는 거예요.\n처음부터 완벽하게 하려고 하면 오래 못 가요.`, tag:'03 / 05', number:'02' },
    { id:'4', title:`STEP 3\n유지하기`, body:`${topic}을 습관으로 만들려면 기록이 중요해요.\n눈에 보이는 변화가 생기면 더 하고 싶어져요.`, tag:'04 / 05', number:'03' },
    { id:'5', title:`해낼 수\n있어요 💪`, body:`저장하고 하나씩 따라해보세요!\n${brand}에서 더 자세한 방법을 알려드려요`, tag:'05 / 05' },
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

    try {
      [slidesData, captionData, coverImageUrl] = await Promise.all([
        generateSlides(effectiveTopic, effectiveCategory, effectiveBrand),
        generateCaption(effectiveTopic, effectiveCategory, effectiveBrand),
        generateCoverImage(effectiveTopic, effectiveCategory, theme || 'dark'),
      ]);
    } catch (innerError: any) {
      if (isOpenAIBillingError(innerError)) {
        return NextResponse.json({
          slides: buildFallbackSlides(effectiveTopic, effectiveBrand, effectiveCategory),
          caption: buildFallbackCaption(effectiveTopic, effectiveCategory, effectiveBrand),
          coverImageUrl: null,
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
