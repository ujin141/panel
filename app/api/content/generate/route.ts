import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

// ─── 폴백 데이터 ────────────────────────────────────────────────────────────────
const FALLBACK: Record<string, string[]> = {
  curiosity: [
    '나 요즘 이 앱 쓰는데\n솔직히 좀 신기해서 공유함\n\n20대 여성들한테만 베타 오픈 중이라\n아직 일반 공개는 안 됨\n\n궁금하면 DM으로 "신청" 보내줘 ✉️',
    '친구한테 추천받은 앱인데\n써보고 나서 이걸 왜 이제 알았지 싶었어\n\n지금은 초대받은 사람만 쓸 수 있어서\n관심 있으면 댓글에 "나도" 달아줘',
    '요즘 인스타 알고리즘이 이걸 숨기고 있는 것 같은데\n직접 써봤더니 진짜 효과 있었어\n\nDM으로 "어떤 앱?" 보내면 알려줄게',
    '솔직히 이거 아직 대부분 모르는 앱인데\n나만 알기엔 너무 아까워서 공유함\n\n관심 있으면 DM 줘 👇',
    '이 앱 쓰고 나서 일상이 달라진 거 실화임?\n\n아직 베타라서 신청자만 받고 있어\nDM으로 연락 주면 링크 보내줄게',
    '이거 공유해도 되나 싶었는데\n진짜 도움받은 사람한테는 알려줘야 할 것 같아서\n\nDM으로 "알려줘" 보내주면 안내해드릴게요',
    '베타 테스트 참여자 후기 보다가 나도 신청했는데\n생각보다 훨씬 좋아서 놀랐어\n\n관심 있으면 DM ✉️',
    '나한테 이런 앱 진작 있었으면 했을 것 같아서 공유\n\n근데 아직 소수만 받고 있어서\n빠르게 DM 줘야 할 수도 있어',
    '갑자기 왜 플레이스토어 최상위에 뜨지 싶어서 봤더니\n베타 종료 전 마지막 초대래\n\n관심 있으면 지금 DM',
    '이거 쓰면서 진짜 궁금했던 것들이 해결됐어\n\n아직 일부 유저만 접근 가능한데\n원하면 DM으로 초대 요청해봐',
  ],
  emotion: [
    '솔직히 말하면 나 이 앱 없었으면\n이번 달 많이 힘들었을 것 같아\n\n20대 여자들 다 쓰면 좋겠다고 생각해서\n공유하는 거야 🤍\n\n궁금하면 DM 줘',
    '예전의 나한테 이 앱 알려줄 수 있었으면 했을 것 같아\n\n지금도 놓치고 싶지 않아서 매일 쓰고 있어\n관심 있는 사람 있으면 DM으로 신청해줘',
    '이거 공유하는 게 맞는 건지 모르겠는데\n나한테 진짜 도움이 많이 됐어서\n\n비슷한 고민 있는 분들 DM 주세요 💌',
    '모두에게 주기엔 너무 특별한 앱이라\n진짜 관심 있는 사람만 초대할게\n\nDM으로 "신청" 보내줘',
    '내 삶의 루틴이 달라진 게 이 앱 때문인 거 알면서도\n매일 쓰게 됨\n\n궁금한 사람 댓글로 🖤',
    '처음엔 반신반의했는데\n한 달 써보고 진짜 달라짐을 느꼈어\n\n원하는 분들한테만 공유할게요 DM 주세요',
    '나 혼자 쓰기 아까운 앱 찾았어\n\n주변 친구들한테도 알려줬는데 다들 좋아해서\n여기도 공유해봄\n\nDM으로 "나도" 보내줘',
    '요즘 이 앱 덕분에 많이 나아진 것 같아\n\n비슷한 상황인 분들 있으면 함께해요\nDM 언제든 환영 💌',
    '이런 거 SNS에 올리는 타입 아닌데\n진짜 도움됐다는 생각에 올려봄\n\n궁금하면 DM으로 물어봐줘',
    '이거 쓰기 전이랑 후가 진짜 다른 것 같아\n\n관심 있는 분 계시면 DM으로 연락 주세요 🤍',
  ],
  scarcity: [
    '초대 인원 50명 중 47명 마감됨\n\n아직 3자리 남아서 올리는 거야\n지금 DM 안 하면 진짜 기회 없어',
    '이번 베타 세션은 이번 주 금요일에 닫혀\n\n지금 DM 안 보내면 다음 시즌은\n언제인지 모름\n\n빠르게 연락 줘 ⏳',
    '정말 선별해서 초대하고 있는 거라\n아무나 드리진 않아요\n\n진지하게 써보실 분만 DM 주세요',
    '지금 대기자 118명인데\n앱 설치 링크는 50명한테만 드려요\n\n이미 100명 넘어서 빠르게 신청해야 해',
    '포스팅 삭제 전에 빠르게 DM 주세요\n자주 올리진 않거든요\n\n"신청" 보내주면 바로 안내드릴게요 🖤',
    '오늘 자정에 베타 신청 마감이에요\n\n딱 7자리 남았고 더 이상 연장 없어요\n지금 DM 주세요',
    '이번 주까지만 받아요\n다음 시즌은 6개월 뒤라 지금 아니면 기회 없어요\n\nDM 주시면 바로 안내드릴게요',
    '지금 이 게시글 보는 사람만 알 수 있는 정보예요\n\n링크 곧 내릴 예정이라\n빨리 DM 주세요 ✉️',
    '엊그제 올렸을 때 하루만에 20명 꽉 찼어요\n\n남은 자리 5개\n지금 신청 안 하면 또 대기해야 해요',
    '오픈 알림 신청자 중 랜덤 5명만 먼저 초대해요\n\n지금 DM으로 "신청" 보내주세요\n내일까지만 받아요',
  ],
  informational: [
    '일본 여행 전에 꼭 알아야 할 것들 정리해봤어 ✈️\n\n1️⃣ IC카드 미리 충전해 두기\n2️⃣ 구글맵 오프라인 저장 필수\n3️⃣ 편의점 ATM으로 현금 뽑기\n4️⃣ 식당 예약은 무조건 미리\n5️⃣ 짐 보관 서비스 (코인로커) 위치 파악\n\n저장해두면 진짜 도움돼 🔖',
    '여행 갈 때 항공권 가장 싸게 사는 타이밍\n\n✅ 출발 2~3개월 전이 제일 저렴\n✅ 화·수요일 검색 시 더 낮은 가격 뜸\n✅ 시크릿 창으로 검색 (가격 추적 방지)\n✅ 스카이스캐너 가격 알림 설정해두기\n\n알고 나면 다시는 비싸게 못 삼 💸',
    '인스타 여행 콘텐츠 저장 많이 받는 공식\n\n📌 제목: "~하는 법" or "~하는 방법"\n📌 숫자 + 리스트 형식 사용\n📌 실제 경험담 + 구체적 정보\n📌 해시태그 5~7개 (과하면 오히려 손해)\n\n저장률 높이면 알고리즘이 알아서 퍼줌 ✨',
    '숙소 예약할 때 진짜 저렴하게 하는 법\n\n1. 부킹닷컴 vs 에어비앤비 둘 다 비교\n2. 체크인 날짜 하루씩 바꿔보기\n3. 지도 검색으로 숨은 숙소 찾기\n4. 앱 전용 할인 쿡폰 확인\n5. 리뷰 최근 순으로 꼭 확인\n\n이것만 알아도 숙박비 30% 아낄 수 있어 🏨',
    '여행 짐 싸는 법 (기내 반입 가능한 것들)\n\n✅ 액체류 100ml 이하, 1L 지퍼백 1개\n✅ 보조배터리는 위탁 불가 (기내만 가능)\n✅ 음식물은 대부분 반입 가능 (과일 제외)\n✅ 우산·삼각대 기내 반입 가능\n\n모르면 공항에서 다 버려야 하니까 저장해 💼',
    '환전 수수료 0원으로 여행 가는 방법\n\n📍 트래블월렛 / 트래블로그 카드 만들기\n→ 현지에서 원화 환전 없이 바로 결제\n→ 환전 수수료 없음\n→ 현지 ATM 출금도 가능\n\n해외여행 갈 때마다 이것만 들고 가 💳',
    '여행 사진 잘 찍히는 꿀팁 7가지\n\n1. 역광보다 사이드 라이팅 찾기\n2. 황금시간대 (해 뜰 때 / 질 때)\n3. 구도는 삼분할 법칙\n4. 배경 단순하게 정리\n5. 인물보다 배경 먼저 초점\n6. 다양한 각도로 10장 이상 찍기\n7. 폰 렌즈 닦기 (가장 중요 ❗)\n\n저장해두고 다음 여행 때 써봐 📸',
    '공항에서 절대 하면 안 되는 것들\n\n❌ 출발 1시간 30분 전에 도착\n❌ 여권 유효기간 확인 안 하기\n❌ 보조배터리 위탁 수하물에 넣기\n❌ 충전 안 된 폰으로 탑승권 저장\n❌ 면세품 픽업 게이트 확인 안 하기\n\n이 중 하나라도 걸리면 진짜 힘들어짐 😭',
    '인스타 여행 계정 팔로워 1000명 만든 방법\n\n📌 니치 + 지역 조합 해시태그 사용\n예: #오사카맛집 #도쿄카페 #파리여행\n📌 릴스 > 피드 > 스토리 우선순위\n📌 같은 시간대에 꾸준히 올리기 (알고리즘)\n📌 댓글에 진짜 대화하듯 답글\n\n6개월 꾸준히 했더니 생각보다 빠르게 늘었어',
    '식당 웨이팅 없이 맛집 가는 방법\n\n✅ 평일 오전 11시~11시 30분 도착\n✅ 혼자 or 2인 방문이 웨이팅 빠름\n✅ 카카오맵 실시간 웨이팅 확인\n✅ 재방문율 높은 곳 = 진짜 맛집 지표\n✅ 인스타 최신 게시물 시간 확인 (오래된 정보 주의)\n\n저장해두면 여행 때 진짜 유용함 🍽️',
  ],
};

function isOpenAIBillingError(error: any): boolean {
  const msg = error?.message || error?.error?.message || '';
  const code = error?.status || error?.code || error?.error?.code || '';
  return (
    msg.includes('Billing hard limit') ||
    msg.includes('quota') ||
    msg.includes('insufficient_quota') ||
    code === 'insufficient_quota' ||
    error?.status === 429 ||
    error?.status === 400
  );
}

function buildFallback(type: string, count: number): string[] {
  const pool = FALLBACK[type] || FALLBACK.curiosity;
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    results.push(pool[i % pool.length]);
  }
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { platform, type, target, count = 10, category, brandService, topic } = await request.json();

    // API 키 없으면 즉시 폴백 반환
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ results: buildFallback(type, count), fallback: true });
    }

    const typeDesc = {
      curiosity:     '호기심을 자극하고 DM을 유도하는',
      emotion:       '감정을 자극하고 공감을 유발하는',
      scarcity:      '희소성과 긴박감으로 즉각 행동을 유발하는',
      informational: '유용한 정보와 팀을 제공해 저장·공유를 유도하는',
    }[type as string] || '';

    const platformDesc = platform === 'threads'
      ? 'Threads (짧고 임팩트 있게, 3~6줄 분량)'
      : 'Instagram (캡션 형식, 해시태그 5~8개 포함, 150자 이내)';

    const categoryLine = category ? `카테고리/분야: ${category}` : '';
    const brandLine    = brandService ? `브랜드/서비스명: ${brandService} (이 이름을 자연스럽게 녹여서 쓰세요)` : '';
    const topicLine    = topic ? `핵심 주제/키워드: ${topic} (이 주제를 바탕으로 글을 쓰세요)` : '';

    // 정보성 글은 별도 프롬프트 (리스트 형식, 저장/공유 유도)
    const isInfoType = type === 'informational';
    const goalLine = isInfoType
      ? '목표: 저장·공유를 유도하는 실용적 정보 제공'
      : '목표: 게시글을 본 유저가 DM을 보내거나 대기자 등록을 하도록 유도';
    const extraRules = isInfoType
      ? `- 숫자 리스트 형식 (1. 2. 3. 또는 ✅ ✔️ 📌 등 이모지 활용)
- 실용적이고 구체적인 정보 (막연한 내용 금지)
- 마지막 줄에 저장 권유 멘트 추가 (저장해두면 유용해요, 저장해두기 🔖 등)
- 분야 전문가가 쓴 것처럼 신뢰감 있게
- 리스트 항목은 5~8개가 적당`
      : `- 너무 광고처럼 보이지 않게, 실제 유저가 쓴 것처럼
- 카테고리에 맞는 용어와 공감대를 활용`;

    const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
당신은 한국 SNS ${isInfoType ? '정보성 콘텐츠' : '바이럴 컨텐츠'} 전문가입니다.
현재 날짜는 ${currentDate} (2026년) 입니다. 본문에 포함되는 모든 최신 정보, 트렌드, 데이터, 사례는 무조건 2026년 기준이어야 합니다. 낡은 과거 데이터는 철저히 배제하세요.
다음 조건으로 SNS 게시글을 ${count}개 생성해주세요.
플랫폼: ${platformDesc}
게시글 유형: ${typeDesc} 게시글
${categoryLine}
${brandLine}
${topicLine}
타겟 유저: ${target || '20~30대 한국 여성'}
${goalLine}

규칙:
- 각 게시글은 서로 다른 주제/소재로 작성 (같은 표현 반복 금지)
- 자연스러운 한국어 SNS 구어체로 작성
${extraRules}
- 분야에 따른 구체적인 표현 사용
- 각 게시글은 ---로 구분
- 게시글 번호 없이 내용만 작성

${count}개의 게시글을 작성해주세요:
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    });

    const text = response.choices[0].message.content || '';
    const results = text.split('---').map((s: string) => s.trim()).filter(Boolean);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Content generation error:', error);

    // OpenAI 결제 한도 초과 → 폴백 데이터 반환
    if (isOpenAIBillingError(error)) {
      const { type = 'curiosity', count = 10 } = await request.json().catch(() => ({}));
      return NextResponse.json({
        results: buildFallback(type, count),
        fallback: true,
        warning: 'OpenAI 크레딧 한도 초과. 샘플 데이터를 표시합니다.',
      });
    }

    return NextResponse.json({ error: '콘텐츠 생성에 실패했습니다' }, { status: 500 });
  }
}
