import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

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

const FALLBACK_STRATEGY = {
  phases: [
    {
      title: 'Phase 1: 씨앗 단계 (0→100명)',
      duration: '1~2주',
      actions: [
        'Threads에 하루 3~5개 호기심 유도형 게시글 포스팅',
        '댓글/DM 반응 유저에게 즉시 1:1 DM 발송',
        '대기자 랜딩 페이지 운영',
        '여성 뷰티/라이프스타일 계정과 상호 팔로우 확장',
      ],
    },
    {
      title: 'Phase 2: 싹 단계 (100→500명)',
      duration: '2~4주',
      actions: [
        '가장 높은 DM 전환률 게시글 유형 집중 확대',
        '기존 대기자 후기 콘텐츠로 재활용',
        '인스타 릴스 1~2개/주 제작',
        '대기자 중 고가치 유저 선별 초대',
      ],
    },
    {
      title: 'Phase 3: 파도 단계 (500→1,000명)',
      duration: '4~8주',
      actions: [
        '인게이지먼트 높은 Threads 계정 협업',
        '유저 UGC 적극 리포스팅',
        '위클리 성장 리포트 공개로 신뢰 구축',
        '한정 초대 캠페인으로 희소성 극대화',
      ],
    },
  ],
  contentDirection: [
    '📸 뒷이야기 포맷: 앱을 어떻게 쓰는지 일상 공유',
    '🔮 3가지 비밀 포맷: 타겟 고민 공감 + 해결책 암시',
    '💌 당신만 알려주는 포맷: 선별된 느낌의 초대',
    '📊 숫자 포맷: 사회적 증거 활용',
    '🎭 감정 포맷: 비포어/애프터 변화 스토리',
  ],
  funnelDesign: [
    '조회수 → DM: 호기심 자극 + 명확한 CTA',
    'DM → 필터링: 2~3개 질문으로 관심도 확인',
    '필터링 → 대기자: 긍정 응답자에게 랜딩 링크 발송',
    '대기자 → 설치: 최우선 그룹 초대 + 개인화 메시지',
    '설치 → 공유: 친구 초대 기능 + 콘텐츠 제공',
  ],
};

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    const { category, target } = body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({ strategy: FALLBACK_STRATEGY, fallback: true });
    }

    const prompt = `
당신은 그로스 해킹 전문가입니다.
다음 앱을 위한 0→1000명 유저 확보 전략을 JSON 형태로 작성해주세요.

앱 카테고리: ${category}
타겟 유저: ${target || '20~30대 한국 여성'}
채널: Threads, Instagram DM 퍼널 중심
예산: 0원 (유기적 성장만)

다음 JSON 구조로 응답하세요:
{
  "phases": [
    { "title": "", "duration": "", "actions": ["", ""] }
  ],
  "contentDirection": [""],
  "funnelDesign": [""]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const strategy = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ strategy });
  } catch (error: any) {
    console.error('Strategy generation error:', error);

    // 결제 한도 초과 → 폴백 전략 반환
    if (isOpenAIBillingError(error)) {
      return NextResponse.json({
        strategy: FALLBACK_STRATEGY,
        fallback: true,
        warning: 'OpenAI 크레딧 한도 초과. 기본 전략을 표시합니다.',
      });
    }

    return NextResponse.json({ error: '전략 생성에 실패했습니다' }, { status: 500 });
  }
}
