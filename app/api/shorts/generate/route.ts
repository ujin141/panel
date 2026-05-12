import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

const VIDEO_THEMES = {
  'lifestyle': [
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-drinking-coffee-in-a-cafe-39837-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-in-a-cafe-39904-large.mp4',
  ],
  'fitness': [
    'https://assets.mixkit.co/videos/preview/mixkit-man-exercising-on-a-stationary-bike-23130-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-man-doing-push-ups-on-the-beach-1169-large.mp4',
  ],
  'nature': [
    'https://assets.mixkit.co/videos/preview/mixkit-walking-on-the-beach-in-the-sunset-39871-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-island-39831-large.mp4',
  ],
  'food': [
    'https://assets.mixkit.co/videos/preview/mixkit-making-pasta-in-kitchen-34695-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-woman-eating-a-hamburger-4019-large.mp4',
  ],
  'tech': [
    'https://assets.mixkit.co/videos/preview/mixkit-close-up-of-a-person-typing-on-a-laptop-5473-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-futuristic-devices-99786-large.mp4',
  ],
};

function pickVideoUrl(keywords: string): string {
  const kw = keywords.toLowerCase();
  if (kw.includes('coffee') || kw.includes('cafe') || kw.includes('lifestyle')) {
    return VIDEO_THEMES.lifestyle[Math.floor(Math.random() * VIDEO_THEMES.lifestyle.length)];
  }
  if (kw.includes('gym') || kw.includes('workout') || kw.includes('fitness')) {
    return VIDEO_THEMES.fitness[Math.floor(Math.random() * VIDEO_THEMES.fitness.length)];
  }
  if (kw.includes('food') || kw.includes('cooking') || kw.includes('recipe')) {
    return VIDEO_THEMES.food[Math.floor(Math.random() * VIDEO_THEMES.food.length)];
  }
  if (kw.includes('tech') || kw.includes('laptop') || kw.includes('coding')) {
    return VIDEO_THEMES.tech[Math.floor(Math.random() * VIDEO_THEMES.tech.length)];
  }
  if (kw.includes('beach') || kw.includes('nature') || kw.includes('travel')) {
    return VIDEO_THEMES.nature[Math.floor(Math.random() * VIDEO_THEMES.nature.length)];
  }
  // Pexels fallback
  return VIDEO_THEMES.lifestyle[0];
}

async function fetchPexelsVideo(keywords: string): Promise<string> {
  if (!process.env.PEXELS_API_KEY) return pickVideoUrl(keywords);
  try {
    const query = encodeURIComponent(`${keywords} cinematic vertical`);
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${query}&orientation=portrait&per_page=10&size=medium`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    if (res.ok) {
      const data = await res.json();
      const videos = data.videos || [];
      if (videos.length > 0) {
        const picked = videos[Math.floor(Math.random() * Math.min(videos.length, 5))];
        const file = picked.video_files?.find((f: any) => f.quality === 'hd' && f.height > f.width)
          || picked.video_files?.[0];
        if (file?.link) return file.link;
      }
    }
  } catch (e) {
    console.warn('Pexels error:', e);
  }
  return pickVideoUrl(keywords);
}

export async function POST(req: NextRequest) {
  try {
    const { topic, style, platform, bgStyle, brandName, duration } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: '주제를 입력해주세요' }, { status: 400 });
    }

    const targetDuration = duration || 30; // seconds
    const now = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    let scenes: any[] = [];
    let caption = '';
    let hashtags: string[] = [];
    let videoKeywords = 'aesthetic lifestyle vertical';
    let musicSuggestion = '';
    let videoUrl = '';

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      // Fallback
      scenes = [
        { id: '1', type: 'hook', emoji: '🔥', text: `${topic} 때문에 고민이시죠?`, subtext: '', duration: 3, fontSize: 'xl', color: '#FFD700' },
        { id: '2', type: 'agitate', emoji: '😤', text: '대부분이 이 실수를 합니다', subtext: '지금 당장 고쳐야 합니다', duration: 4, fontSize: 'lg', color: '#FF6B6B' },
        { id: '3', type: 'solution', emoji: '💡', text: '딱 3가지만 기억하세요', subtext: '①간단 ②빠른 ③효과 보장', duration: 8, fontSize: 'lg', color: '#69DB7C' },
        { id: '4', type: 'result', emoji: '📈', text: '이걸로 결과가 달라집니다', subtext: '직접 해보면 압니다', duration: 5, fontSize: 'lg', color: '#74C0FC' },
        { id: '5', type: 'cta', emoji: '👇', text: `댓글에 '비밀' 남기면 DM 드려요`, subtext: '팔로우도 잊지 마세요', duration: 4, fontSize: 'md', color: '#DA77F2' },
      ];
      caption = `이거 모르면 손해입니다 😭\n\n${topic}에 대한 진짜 꿀팁 공유합니다\n\n💌 댓글에 '비밀' 남기면 상세 자료 DM으로 드립니다!\n🔖 나중에 보려면 저장 필수\n👉 @${brandName} 팔로우하면 매주 꿀팁 드려요`;
      hashtags = [`#${topic.replace(/\s/g, '')}`, '#숏츠', '#릴스', '#꿀팁', '#정보공유', `#${brandName}`];
      musicSuggestion = '트렌디한 비트 (BPM 120~140)';
      videoKeywords = 'lifestyle aesthetic vertical';
    } else {
      const sysPrompt = `당신은 2026년 현재 대한민국 ${platform === 'youtube' ? '유튜브 쇼츠' : platform === 'tiktok' ? '틱톡' : '인스타그램 릴스'} 알고리즘을 완벽히 파악한 바이럴 콘텐츠 전략가입니다.
현재 날짜: ${now}. 모든 정보는 2026년 최신 기준.

주제와 스타일에 맞는 ${targetDuration}초 분량 숏츠 대본을 생성하세요.

[플랫폼 특성]
- 인스타그램 릴스: 감성/공감형, 저장 유도
- 유튜브 쇼츠: 정보/재미형, 구독 유도  
- 틱톡: 트렌드/챌린지형, 공유 유도

[필수 구조 - HASC 공식]
1. hook (0~3초): 스크롤 멈추게 하는 충격적 첫 자막. "안녕하세요" 절대 금지.
2. agitate (4~8초): 공감과 고통 자극. 시청자가 "맞아 나 이거야"라고 느끼게
3. solution (9~22초): 빠른 밀도의 실질 해결책. 짧게 끊어치기.
4. cta (마지막 5초): 저장/팔로우/댓글 강력 유도

각 scene의 text는 화면 자막으로 표시될 문장입니다. 20자 이내로 임팩트 있게.
subtext는 부가 설명 (15자 이내, 없으면 빈 문자열).
duration은 해당 자막이 화면에 표시되는 시간(초).
전체 duration 합계가 ${targetDuration}초에 최대한 맞게.

응답 형식 (JSON):
{
  "scenes": [
    { "id": "1", "type": "hook", "emoji": "🔥", "text": "자막 메인 문장", "subtext": "부가 설명", "duration": 3, "fontSize": "xl", "color": "#FFD700" },
    { "id": "2", "type": "agitate", "emoji": "😤", "text": "자막", "subtext": "", "duration": 5, "fontSize": "lg", "color": "#FF6B6B" },
    { "id": "3", "type": "solution", "emoji": "💡", "text": "자막", "subtext": "세부 내용", "duration": 12, "fontSize": "lg", "color": "#69DB7C" },
    { "id": "4", "type": "cta", "emoji": "👇", "text": "댓글에 '키워드' 남기면 DM", "subtext": "팔로우도 잊지마", "duration": 4, "fontSize": "md", "color": "#DA77F2" }
  ],
  "caption": "인스타 캡션 전체 (이모지, 개행, CTA 포함)",
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8", "#태그9", "#태그10"],
  "videoKeywords": "Pexels 검색용 영문 키워드 3개",
  "musicSuggestion": "어울리는 BGM 무드 설명"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: `주제: ${topic}\n스타일: ${style}\n플랫폼: ${platform}\n배경 스타일: ${bgStyle}\n브랜드명: ${brandName}\n목표 길이: ${targetDuration}초` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      scenes = parsed.scenes || [];
      caption = parsed.caption || '';
      hashtags = parsed.hashtags || [];
      videoKeywords = parsed.videoKeywords || 'aesthetic lifestyle';
      musicSuggestion = parsed.musicSuggestion || '';
    }

    // 배경 영상 fetch
    if (bgStyle === 'video') {
      videoUrl = await fetchPexelsVideo(videoKeywords);
    }

    return NextResponse.json({ scenes, caption, hashtags, videoUrl, musicSuggestion });
  } catch (err: any) {
    console.error('Shorts generate error:', err);
    return NextResponse.json({ error: err.message || '생성 실패' }, { status: 500 });
  }
}
