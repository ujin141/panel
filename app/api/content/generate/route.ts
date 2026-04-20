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
    const { platform, type, target, count = 10 } = await request.json();

    // API 키 없으면 즉시 폴백 반환
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ results: buildFallback(type, count), fallback: true });
    }

    const typeDesc = {
      curiosity: '호기심을 자극하고 DM을 유도하는',
      emotion: '감정을 자극하고 공감을 유발하는',
      scarcity: '희소성과 긴박감으로 즉각 행동을 유발하는',
    }[type] || '';

    const platformDesc = platform === 'threads'
      ? 'Threads (트위터 형식, 짧고 임팩트 있게)'
      : 'Instagram (캡션, 해시태그 포함)';

    const prompt = `
당신은 한국 SNS 바이럴 컨텐츠 전문가입니다.
다음 조건으로 SNS 게시글을 ${count}개 생성해주세요.

플랫폼: ${platformDesc}
게시글 유형: ${typeDesc} 게시글
타겟 유저: ${target || '20~30대 한국 여성'}
목표: 게시글을 본 유저가 DM을 보내거나 대기자 등록을 하도록 유도

규칙:
- 각 게시글은 서로 다른 방식으로 작성
- 자연스러운 한국어로 작성 (SNS 구어체)
- 너무 광고처럼 보이지 않게
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
    const results = text.split('---').map(s => s.trim()).filter(Boolean);

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
