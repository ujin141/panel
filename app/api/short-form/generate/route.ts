import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

// ─── 한국어 주제 → 영문 Pexels 키워드 ───
function getVideoKeywords(topic: string, category: string): string {
  const t = topic.toLowerCase();
  const c = category.toLowerCase();

  if (t.includes('다이어트') || t.includes('운동') || t.includes('헬스')) return 'fitness workout gym motivation';
  if (t.includes('카페') || t.includes('커피') || t.includes('디저트')) return 'coffee cafe aesthetic cozy';
  if (t.includes('맛집') || t.includes('음식') || t.includes('레시피') || t.includes('요리')) return 'food cooking restaurant delicious';
  if (t.includes('여행') || t.includes('해외') || t.includes('유럽')) return 'travel adventure landscape nature';
  if (t.includes('일상') || t.includes('브이로그') || t.includes('루틴')) return 'lifestyle morning routine daily';
  if (t.includes('뷰티') || t.includes('메이크업') || t.includes('스킨')) return 'beauty makeup skincare glow';
  if (t.includes('재테크') || t.includes('투자') || t.includes('돈') || t.includes('부업')) return 'finance money business success';
  if (t.includes('ai') || t.includes('챗gpt') || t.includes('기술')) return 'technology computer screen digital';
  if (t.includes('자기계발') || t.includes('성공') || t.includes('독서')) return 'study motivation productivity desk';
  if (c.includes('뷰티')) return 'beauty skincare glow aesthetic';
  if (c.includes('여행')) return 'travel scenic landscape cinematic';
  if (c.includes('재테크')) return 'finance office laptop money';
  if (c.includes('운동')) return 'fitness workout gym energy';
  if (c.includes('요리')) return 'cooking food kitchen chef';
  if (c.includes('it')) return 'technology digital screen coding';

  return 'lifestyle aesthetic cinematic vertical';
}

// ─── Pexels 세로형 HD 비디오 ───
async function fetchVideoUrl(keywords: string): Promise<string> {
  const query = encodeURIComponent(`${keywords} vertical`);

  if (process.env.PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${query}&orientation=portrait&size=large&per_page=10`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        const videos: any[] = data.videos || [];
        if (videos.length > 0) {
          // 여러 결과 중 랜덤 선택 (다양성)
          const picked = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
          // HD 세로 우선 → HD → 첫번째
          const file =
            picked.video_files.find((f: any) => f.quality === 'hd' && f.height > f.width) ||
            picked.video_files.find((f: any) => f.quality === 'hd') ||
            picked.video_files[0];
          if (file?.link) return file.link;
        }
      }
    } catch (e) {
      console.warn('[Pexels] fetch failed', e);
    }
  }

  // Fallback: Mixkit 무료 에셋 (카테고리별)
  const fallbacks: Record<string, string> = {
    fitness: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-running-on-a-treadmill-4048-large.mp4',
    coffee:  'https://assets.mixkit.co/videos/preview/mixkit-pouring-coffee-in-a-cup-seen-up-close-46487-large.mp4',
    food:    'https://assets.mixkit.co/videos/preview/mixkit-hands-preparing-a-chicken-salad-in-close-up-9487-large.mp4',
    travel:  'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-mountainous-river-canyon-40247-large.mp4',
    beauty:  'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-face-cream-in-front-of-a-mirror-39871-large.mp4',
    finance: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-in-a-cafe-39904-large.mp4',
    default: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-drinking-coffee-in-a-cafe-39837-large.mp4',
  };
  const k = keywords.toLowerCase();
  if (k.includes('fitness') || k.includes('workout')) return fallbacks.fitness;
  if (k.includes('coffee') || k.includes('cafe')) return fallbacks.coffee;
  if (k.includes('food') || k.includes('cooking')) return fallbacks.food;
  if (k.includes('travel')) return fallbacks.travel;
  if (k.includes('beauty') || k.includes('makeup')) return fallbacks.beauty;
  if (k.includes('finance') || k.includes('money')) return fallbacks.finance;
  return fallbacks.default;
}

// ─── 메인 핸들러 ───
export async function POST(req: NextRequest) {
  try {
    const { topic, category, brandName } = await req.json();
    if (!topic) return NextResponse.json({ error: '주제가 필요합니다' }, { status: 400 });

    // API 키 없으면 fallback
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      const kw = getVideoKeywords(topic, category);
      const videoUrl = await fetchVideoUrl(kw);
      return NextResponse.json({
        script: [
          { id:'1', type:'hook',     text:`🔥 ${topic} 지금 당장 보세요`, duration:2 },
          { id:'2', type:'agitate',  text:`대부분이 모르는 치명적 실수 1가지`,     duration:2 },
          { id:'3', type:'solution', text:`이렇게만 바꾸면 됩니다. 딱 30초면 끝`, duration:4 },
          { id:'4', type:'cta',      text:`댓글에 '정보' 남기면 DM 쏩니다 👇`,    duration:2 },
        ],
        videoUrl,
        caption: `이거 모르면 진짜 손해입니다 😱\n\n${topic}에 대해 아무도 안 알려준 핵심 정리했어요.\n\n🎁 댓글에 '정보' 남기면 DM으로 풀버전 쏴드림!\n🔖 까먹기 전에 무조건 저장\n👉 @${brandName} 팔로우하면 매주 꿀팁 드립니다`,
        hashtags: ['#릴스', '#쇼츠', `#${topic.replace(/\s/g,'')}`, '#꿀팁', '#정보공유', '#알고리즘'],
      });
    }

    const now = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.92,
      messages: [
        {
          role: 'system',
          content: `당신은 2026년 한국 숏폼 시장 최상위 크리에이터이자 콘텐츠 디렉터입니다. 매달 조회수 5,000만을 달성합니다.
현재 날짜: ${now}.

━━━ 2026 바이럴 숏폼 포맷 TOP 5 ━━━
1. [POV 공감형] "POV: 퇴근하고 또 야식 시킴" → 시청자가 주인공
2. [솔직 고백형] "솔직히 말할게요. 저도 3년간 몰랐어요" → 진정성
3. [숫자 리스트형] "아무도 안 알려준 3가지" → 끝까지 보게 만드는 구조
4. [반전 폭로형] "이거 하면 안 된다는 거 거짓말입니다" → 반전 호기심
5. [Before/After형] "3개월 전 vs 지금" → 극적 변화 자극

━━━ 카테고리별 최적 톤 ━━━
정보/꿀팁: 단호한 전문가 톤. 숫자·데이터 필수
브이로그/일상: B컷 리얼리티. 불완전함이 공감 유발
유머/공감: 과장 리액션. 직장인·자취생 밈 활용
홍보/리뷰: 솔직 후기 포맷. 단점 언급이 신뢰↑

━━━ 훅 공식 (0~2초, 인사 절대 금지) ━━━
① 충격 선언: "이거 계속 하면 망합니다 🚨"
② 호기심 갭: "99%가 모르는 OOO의 진실"
③ 직접 지목: "자취생이면 무조건 저장하세요"
④ 반전 설정: "OOO 하지 마세요 (근데 저는 함)"
⑤ 숫자 훅: "딱 3가지만 알면 인생 달라집니다"

━━━ 자막 필수 규칙 ━━━
• hook/agitate: 20자 이내 | solution: 30자 이내 | cta: 20자 이내
• 이모지 1~2개 필수 포함
• 구어체 직접화법, 완결된 문장

━━━ 응답 JSON (이 형식만) ━━━
{
  "script": [
    {"id":"1","type":"hook",    "text":"훅 자막 20자이내","duration":2},
    {"id":"2","type":"agitate", "text":"공감 자막 20자이내","duration":2},
    {"id":"3","type":"solution","text":"핵심① 30자이내","duration":4},
    {"id":"4","type":"solution","text":"핵심② 30자이내","duration":4},
    {"id":"5","type":"cta",     "text":"행동유도 20자이내","duration":2}
  ],
  "caption": "도발적첫줄\n\n핵심가치2~3줄\n\n🎁 댓글에OO남기면DM!\n🔖저장필수\n👉@브랜드팔로우",
  "hashtags": ["#릴스","#쇼츠","#카테고리","#키워드1","#키워드2","#꿀팁","#알고리즘","#정보"],
  "videoSearchKeywords": "Pexels 영문 키워드 3~4개"
}`,

        },
        {
          role: 'user',
          content: `주제: ${topic}\n영상 스타일: ${category}\n브랜드명: ${brandName}\n\n위 주제로 2026년 숏폼 트렌드에 맞는 최고 퀄리티 바이럴 대본을 만들어 주세요.`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    // 비디오 키워드: AI 제안 우선, 없으면 주제 기반 추론
    const kw = parsed.videoSearchKeywords || getVideoKeywords(topic, category);
    const videoUrl = await fetchVideoUrl(kw);

    return NextResponse.json({
      script:   parsed.script   || [],
      videoUrl,
      caption:  parsed.caption  || '',
      hashtags: parsed.hashtags || [],
    });

  } catch (error: any) {
    console.error('[short-form/generate]', error);
    return NextResponse.json({ error: error.message || '대본 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
