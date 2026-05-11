import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// 실시간 뉴스/트렌드 수집
async function fetchNews(query: string): Promise<string[]> {
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
    while ((m = r1.exec(xml)) !== null && titles.length < 10) titles.push(m[1].trim());
    if (titles.length === 0) {
      const r2 = /<title>(.*?)<\/title>/g;
      let skip = 0;
      while ((m = r2.exec(xml)) !== null && titles.length < 10) {
        if (skip++ < 1) continue;
        titles.push(m[1].replace(/&amp;/g, '&').trim());
      }
    }
    return titles;
  } catch { return []; }
}

async function fetchGoogleTrends(): Promise<string[]> {
  try {
    const url = 'https://trends.google.com/trends/hottrends/atom/feed?pn=p73';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
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
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  try {
    const { niche, currentFollowers = 0, targetFollowers = 10000, postingFreq = '매일', brandName = '' } = await req.json();

    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    // 실시간 데이터 수집
    const [news1, news2, trends] = await Promise.all([
      fetchNews(`${niche || '인스타그램'} 트렌드 2026 when:7d`),
      fetchNews(`인스타그램 팔로워 성장 2026 when:7d`),
      fetchGoogleTrends(),
    ]);

    const allData = [...news1, ...news2, ...trends]
      .filter(Boolean).filter((t, i, a) => a.indexOf(t) === i).slice(0, 30);

    const liveData = allData.length > 0
      ? `[실시간 수집 데이터 ${allData.length}건]\n${allData.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '[AI 자체 2026년 최신 분석 모드]';

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ plan: getSamplePlan(niche, currentFollowers, targetFollowers), realtime: false });
    }

    const gptRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 2026년 대한민국 인스타그램 팔로워 성장 극대화 전문 해커입니다.
오늘: ${today}
목표: 팔로워를 최대한 빠르게, 최대치로 폭발적으로 늘리는 실전 전략을 제공합니다.
원칙:
- 실시간 트렌드와 알고리즘을 결합한 팔로워 획득 공식
- 콘텐츠 유형별 팔로워 전환율 극대화 전략
- 해시태그·탐색탭·협업·저장유도까지 전방위 전략
- 숫자와 구체적 행동 지침 중심`,
        },
        {
          role: 'user',
          content: `계정 정보:
- 니치(분야): ${niche || '일반'}
- 현재 팔로워: ${currentFollowers.toLocaleString()}명
- 목표 팔로워: ${targetFollowers.toLocaleString()}명
- 포스팅 빈도: ${postingFreq}
- 브랜드명: ${brandName || '없음'}

${liveData}

위 실시간 데이터를 반영해서, 지금 당장 팔로워를 최대한 빠르게 폭발시킬 수 있는 종합 전략을 JSON으로 반환해줘.

{
  "summary": {
    "estimatedDays": 90,
    "dailyFollowerGain": "100~300",
    "totalProjection": "9,000~27,000",
    "keyInsight": "핵심 한 줄 인사이트 (실시간 데이터 기반)"
  },
  "contentFormula": [
    {
      "type": "콘텐츠 유형 (예: 릴스/카드뉴스/스토리)",
      "ratio": "주간 비율 (예: 50%)",
      "followerConvRate": "팔로워 전환율 (예: 2.5%)",
      "bestTime": "최적 업로드 시간 (예: 저녁 7~9시)",
      "hook": "이 유형에서 팔로우를 폭발시키는 핵심 후킹 공식",
      "example": "실제 적용 예시 제목 (${niche} 니치에 맞게)"
    }
  ],
  "hashtagStrategy": {
    "structure": "해시태그 구조 설명",
    "topTags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4", "#해시태그5"],
    "nicheTags": ["#니치태그1", "#니치태그2", "#니치태그3"],
    "trendingTags": ["#트렌딩태그1", "#트렌딩태그2"],
    "avoidTags": ["피해야 할 태그 예시"],
    "tip": "해시태그 운용 핵심 팁"
  },
  "growthHacks": [
    {
      "hack": "팔로워 폭발 해킹 전략 이름",
      "desc": "구체적 실행 방법 (2~3문장)",
      "impact": "높음 | 보통 | 낮음",
      "effort": "낮음 | 보통 | 높음",
      "expectedGain": "예상 주간 팔로워 증가"
    }
  ],
  "weeklySchedule": [
    {
      "day": "월요일",
      "contentType": "릴스",
      "topic": "구체적 주제",
      "goal": "이 날의 팔로워 목표"
    }
  ],
  "ctaTemplates": [
    {
      "type": "CTA 유형 (댓글유도/팔로우유도/저장유도)",
      "template": "실제 캡션에 쓸 수 있는 CTA 문구",
      "effectiveness": "효과도 점수 (1~10)"
    }
  ],
  "algorithmTips": [
    "2026년 인스타 알고리즘 핵심 팁 1",
    "팁 2",
    "팁 3",
    "팁 4",
    "팁 5"
  ]
}

contentFormula 4개, growthHacks 6개, weeklySchedule 7일, ctaTemplates 5개, algorithmTips 5개를 반드시 채워줘.`,
        },
      ],
      temperature: 0.85,
      max_tokens: 3000,
    });

    const text = gptRes.choices[0].message.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const plan = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ plan, realtime: allData.length > 0, fetchedCount: allData.length });

  } catch (err: any) {
    console.error('[follow-growth]', err?.message?.slice(0, 80));
    return NextResponse.json({ plan: getSamplePlan('일반', 0, 10000), realtime: false });
  }
}

function getSamplePlan(niche: string, current: number, target: number) {
  return {
    summary: {
      estimatedDays: 90,
      dailyFollowerGain: '150~400',
      totalProjection: `${(current + 13500).toLocaleString()}~${(current + 36000).toLocaleString()}`,
      keyInsight: '2026년 릴스 저장율이 팔로워 전환의 핵심 — 저장 유도 CTA가 팔로우 버튼보다 3배 효과적',
    },
    contentFormula: [
      { type: '릴스 (Reels)', ratio: '50%', followerConvRate: '3.2%', bestTime: '저녁 7~9시, 점심 12~1시', hook: '첫 1초에 숫자+결핍 조합 → 무조건 저장 유도 → CTA로 팔로우', example: `${niche} 99%가 모르는 비밀 3가지 (저장필수)` },
      { type: '카드뉴스 (캐러셀)', ratio: '30%', followerConvRate: '2.1%', bestTime: '오전 10~11시, 저녁 8~10시', hook: '10장 꽉 찬 정보량 → 마지막 장에 팔로우 CTA 삽입', example: `${niche} 완전 정복 핵심 정리 (저장=나중에 보기)` },
      { type: '스토리 (Stories)', ratio: '15%', followerConvRate: '0.8%', bestTime: '아침 8~9시, 밤 10~11시', hook: '팔로워 투표/질문 스티커 → 참여율 높이면 탐색탭 노출 급증', example: `${niche} Q&A 실시간 답변` },
      { type: '정적 이미지', ratio: '5%', followerConvRate: '0.5%', bestTime: '오전 7~8시', hook: '인용구/명언 스타일 → 공유율 자극 → 프로필 방문 유도', example: `${niche} 핵심 한 줄 (공유해드세요)` },
    ],
    hashtagStrategy: {
      structure: '대형(100만+) 3개 + 중형(10~100만) 5개 + 소형(1~10만) 7개 + 브랜드 1개 = 최적 16개',
      topTags: ['#일상', '#정보공유', '#꿀팁', '#SNS마케팅', '#인스타그램'],
      nicheTags: [`#${niche}`, `#${niche}정보`, `#${niche}꿀팁`],
      trendingTags: ['#2026트렌드', '#알고리즘공략'],
      avoidTags: ['#follow4follow (봇 계정 유입)', '#f4f (스팸 필터링)'],
      tip: '포스팅마다 해시태그 세트를 3~4가지로 로테이션. 동일 태그 반복 사용 시 알고리즘 감점',
    },
    growthHacks: [
      { hack: '저장폭탄 콘텐츠 공식', desc: '"저장해두면 나중에 써먹는" 유형 — 체크리스트, 순서도, 비교표 형식. 저장 1건 = 팔로우 0.3건 전환율. 매주 최소 2개 이상 배치.', impact: '높음', effort: '보통', expectedGain: '주 200~500명' },
      { hack: '탐색탭 알고리즘 해킹', desc: '업로드 후 30분 내 5~10개 댓글 달기(지인 협조 or 자답). 초기 반응률이 높으면 탐색탭 배포 확률 4배 증가. 업로드 타이밍은 반드시 피크 시간대(저녁 7~9시).', impact: '높음', effort: '낮음', expectedGain: '주 300~800명' },
      { hack: '대댓글 폭격 전략', desc: '내 니치의 대형 계정(팔로워 5만+) 최신 게시물에 진짜 도움되는 댓글 5~10개 달기. 해당 계정 팔로워들이 프로필 방문 → 팔로우 전환율 1.5%.', impact: '높음', effort: '낮음', expectedGain: '주 100~300명' },
      { hack: '협업/콜라보 릴스', desc: '동일 니치의 1만~5만 계정과 콜라보 릴스 촬영. 상대 팔로워 5~15% 팔로우 전환 기대. 월 2회 목표로 실행.', impact: '높음', effort: '높음', expectedGain: '건당 500~2,000명' },
      { hack: '댓글 DM 자동화 CTA', desc: '댓글에 "비밀" 입력 시 DM으로 자료 발송. 참여율 급증 → 알고리즘 가중치 상승 → 탐색탭 도달. DM 발송 후 15%가 팔로우.', impact: '높음', effort: '보통', expectedGain: '주 150~400명' },
      { hack: '인스타 라이브 공략', desc: '주 1회 15~30분 라이브 → 알림으로 팔로워에게 직접 노출 + 비팔로워 탐색 탭 배포. 라이브 중 팔로우 유도 멘션 3회 이상 필수.', impact: '보통', effort: '높음', expectedGain: '주 50~200명' },
    ],
    weeklySchedule: [
      { day: '월요일', contentType: '릴스', topic: `${niche} 이번 주 반드시 알아야 할 3가지`, goal: '저장 100+, 팔로우 50+' },
      { day: '화요일', contentType: '스토리', topic: '팔로워 투표 + Q&A', goal: '참여율 10%+' },
      { day: '수요일', contentType: '카드뉴스', topic: `${niche} 완전 정복 10장 시리즈`, goal: '저장 200+, 팔로우 80+' },
      { day: '목요일', contentType: '릴스', topic: `99%가 모르는 ${niche} 꿀팁`, goal: '조회수 1만+, 팔로우 100+' },
      { day: '금요일', contentType: '정적이미지', topic: `${niche} 핵심 명언/인용구`, goal: '공유 50+' },
      { day: '토요일', contentType: '릴스', topic: `${niche} 비하인드/리얼 스토리`, goal: '공감 댓글 50+, 팔로우 120+' },
      { day: '일요일', contentType: '스토리', topic: '이번 주 콘텐츠 하이라이트', goal: '스토리 도달 500+' },
    ],
    ctaTemplates: [
      { type: '저장 유도', template: '🔖 이 정보 나중에 필요하실 때 못찾으면 손해!\n지금 바로 저장해두세요 👆\n저장이 곧 구독이에요 💜', effectiveness: 9 },
      { type: '팔로우 유도', template: `매주 ${niche} 꿀팁 올라오는데\n팔로우 안 하면 진짜 손해입니다 😭\n지금 바로 팔로우 → @${niche}`, effectiveness: 8 },
      { type: '댓글 DM 자동화', template: `📩 댓글에 '${niche}' 라고 남기면\n무료로 자료 DM 드립니다!\n(지금 딱 이틀만요 ⏰)`, effectiveness: 10 },
      { type: '공유 유도', template: '이거 진짜 도움될 사람 있으면\n부담없이 공유해주세요 🙏\n같이 성장해요!', effectiveness: 7 },
      { type: '다음 콘텐츠 예고', template: `내일 올라올 ${niche} 영상에서\n진짜 충격적인 정보 공개합니다...\n놓치기 싫으면 팔로우 필수 🔥`, effectiveness: 8 },
    ],
    algorithmTips: [
      '2026년 릴스 첫 1~3초 시청 완료율이 팔로워 전환의 가장 강력한 알고리즘 신호 — 후킹에 모든 것을 투자하라',
      '저장(Save) > 공유(Share) > 댓글 > 좋아요 순으로 알고리즘 가중치. 저장 유도 CTA를 모든 게시물에 필수 삽입',
      '업로드 후 골든타임 30분 — 팔로워 반응률이 임계치(5%) 넘으면 탐색탭 배포. 이때 댓글/대댓글로 반응 부스팅',
      '해시태그는 3~5개가 최적 (2026년 기준). 과거 30개 시대는 끝. 정밀 타겟 소형 태그가 팔로워 전환율 4배',
      '주 5회 이상 업로드 계정은 알고리즘 우선순위 부여. 릴스 3 + 카드뉴스 1 + 스토리 매일이 팔로워 성장 최적 조합',
    ],
  };
}
