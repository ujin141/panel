import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

// 한국어 주제 -> 영문 스톡 비디오 키워드 매핑
function getSearchKeywords(topic: string): string {
  const kw = topic.toLowerCase();
  if (kw.includes('다이어트') || kw.includes('운동')) return 'fitness workout gym';
  if (kw.includes('카페') || kw.includes('커피')) return 'cafe coffee aesthetic';
  if (kw.includes('맛집') || kw.includes('음식')) return 'food cooking delicious';
  if (kw.includes('여행') || kw.includes('휴양')) return 'travel vacation ocean nature';
  if (kw.includes('일상') || kw.includes('브이로그')) return 'lifestyle vlog daily';
  if (kw.includes('뷰티') || kw.includes('메이크업')) return 'beauty makeup skincare';
  if (kw.includes('재테크') || kw.includes('돈')) return 'finance money business office';
  return 'aesthetic lifestyle vertical';
}

// Pexels API에서 세로형 비디오 검색
async function fetchVideoUrl(keywords: string): Promise<string> {
  const enhancedKeywords = keywords ? `${keywords} cinematic aesthetic 4k professional` : 'cinematic aesthetic vertical 4k';
  const query = encodeURIComponent(enhancedKeywords);
  
  if (process.env.PEXELS_API_KEY) {
    try {
      const res = await fetch(`https://api.pexels.com/videos/search?query=${query}&orientation=portrait&per_page=5`, {
        headers: { Authorization: process.env.PEXELS_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        const videos = data.videos || [];
        if (videos.length > 0) {
          // HD 화질의 세로 비디오 선택
          const videoFile = videos[0].video_files.find((f: any) => f.quality === 'hd' && f.height > f.width) 
                            || videos[0].video_files[0];
          if (videoFile && videoFile.link) return videoFile.link;
        }
      }
    } catch (e) {
      console.warn('Pexels video fetch failed', e);
    }
  }

  // Fallback videos (Mixkit free assets)
  const fallbacks = [
    'https://assets.mixkit.co/videos/preview/mixkit-young-woman-drinking-coffee-in-a-cafe-39837-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-in-a-cafe-39904-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-walking-on-the-beach-in-the-sunset-39871-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beautiful-island-39831-large.mp4'
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export async function POST(req: NextRequest) {
  try {
    const { topic, category, brandName } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: '주제가 필요합니다' }, { status: 400 });
    }

    let script = [];
    let videoUrl = '';
    let caption = '';
    let hashtags = [];

    let videoSearchKeywords = 'aesthetic vertical';

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      // API 키 없는 경우 Fallback 데이터
      script = [
        { id: '1', type: 'hook', text: `혹시 ${topic} 고민이신가요?`, duration: 2 },
        { id: '2', type: 'body', text: '대부분이 놓치는 치명적인 실수 1가지!', duration: 3 },
        { id: '3', type: 'body', text: '지금 당장 이렇게 바꿔보세요.', duration: 3 },
        { id: '4', type: 'cta', text: `더 많은 정보는 ${brandName} 팔로우!`, duration: 2 }
      ];
      caption = `이번 릴스 끝까지 안보시면 손해입니다 😭\n\n${brandName} 팔로우 하시고 더 많은 꿀팁 받아보세요!`;
      hashtags = ['#릴스', `#${topic.replace(/\s/g, '')}`, '#꿀팁', '#정보공유'];
    } else {
      const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

      // OpenAI로 대본 생성
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
        {
          role: 'system',
          content: `당신은 대한민국 조회수 1,000만을 무조건 찍어내는 '초극강 바이럴 숏폼(릴스/쇼츠) 알고리즘 해커'입니다.
현재 날짜는 ${currentDate} (2026년) 입니다. 대본에 포함되는 모든 정보, 팩트, 수치, 사례는 무조건 2026년 최신 기준이어야 합니다. 낡은 과거 데이터는 철저히 배제하세요.
주어진 주제로 15~30초 분량의 임팩트 있는 세로형 숏폼 대본과 인스타그램 캡션을 JSON 형식으로 반환하세요.

🔥 [알고리즘 폭발 숏폼 4대 법칙 (세일즈 훅 구조)]
1. hook (0~2초): 시청자의 뇌를 해킹하는 도파민 훅. 인사말 절대 금지. ("안녕하세요" X)
   예: "지금 당장 OOO 버리세요", "99%가 매일 하면서도 모르는 최악의 습관"
2. agitate (3~6초): 시청자의 결핍, 고통, 뼈때리는 현실을 극한으로 후벼파서 공감 유도.
   예: "매번 이렇게 하다 돈만 날리셨죠?", "솔직히 진짜 귀찮아서 포기하잖아요."
3. solution (7~20초): 빠르고 밀도 높은 팩트 기반 해결책 제시. 말은 무조건 짧게 끊어치기.
   예: "이 루틴 하나면 끝납니다. 첫째, OOO하세요. 둘째, OOO하세요."
4. cta (마지막 2초): 오토 DM 자동화를 위한 폭발적 행동 유도.
   예: "댓글에 '비밀'이라고 남기면 상세 링크 보내드릴게요", "까먹기 전에 무조건 저장"

응답 형식:
{
  "script": [
    { "id": "1", "type": "hook", "text": "화면에 뜰 도발적 자막 (예: 헬스장 등록? 당장 취소하세요)", "duration": 2 },
    { "id": "2", "type": "agitate", "text": "화면에 뜰 뼈때리는 자막 (예: 또 3일 나가고 기부하셨죠?)", "duration": 2 },
    { "id": "3", "type": "solution", "text": "화면에 뜰 해결책 자막 (예: 방구석 맨몸 루틴 딱 2가지만 하세요)", "duration": 4 },
    { "id": "4", "type": "cta", "text": "화면에 뜰 행동 유도 자막 (예: 댓글에 '루틴' 남기면 풀영상 DM 쏩니다)", "duration": 3 }
  ],
  "caption": "인스타 본문: [도발적 첫줄]\\n\\n[짧은 핵심 가치]\\n\\n🎁 댓글에 'OO' 남기면 DM으로 링크 쏴드림!\\n🔖 까먹기 전에 무조건 저장\\n👉 매주 꿀팁 받으려면 @{브랜드명} 팔로우",
  "hashtags": ["#알고리즘노출태그", "#태그2"],
  "videoSearchKeywords": "Pexels 등 스톡 비디오 검색을 위한 정확한 영문 키워드 3~4개 (예: 'coffee pouring cafe', 'gym workout fitness', 'office typing laptop')"
}`
        },
          {
            role: 'user',
            content: `주제: ${topic}\n스타일: ${category}\n브랜드명: ${brandName}`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(completion.choices[0].message.content || '{}');
      script = parsed.script || [];
      caption = parsed.caption || '';
      hashtags = parsed.hashtags || [];
      videoSearchKeywords = parsed.videoSearchKeywords || 'aesthetic vertical';
    }

    // AI가 도출한 키워드를 바탕으로 비디오 가져오기
    videoUrl = await fetchVideoUrl(videoSearchKeywords);

    return NextResponse.json({
      script,
      videoUrl,
      caption,
      hashtags
    });

  } catch (error: any) {
    console.error('Short-form generation error:', error);
    return NextResponse.json({ error: error.message || '대본 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
