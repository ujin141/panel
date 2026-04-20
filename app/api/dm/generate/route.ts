import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export const dynamic = 'force-dynamic';

const FALLBACK_SCRIPTS: Record<string, string> = {
  first_response: `안녕하세요! 😊
게시글 보고 DM 주셨군요, 감사해요!

저희 앱은 지금 20~30대 여성분들을 대상으로
소규모 베타 테스트 중이에요.

혹시 어떤 부분이 가장 궁금하셨어요?
(간단히 알려주시면 맞춤 안내 드릴게요)`,

  filter: `와 감사해요! 진짜 관심 있으신 분들이랑만
함께하고 싶어서 한 가지만 여쭤볼게요 🙏

지금 주로 어떤 고민이 있으세요?
(저희 앱이 딱 도움 될 수 있는지 확인하려고요)

진지하게 써보실 의향 있으시면
바로 베타 초대 링크 드릴게요!`,

  waitlist: `완전 딱 맞는 분이시네요! 💌

지금 바로 대기자 리스트 등록하시면
앱 출시 즉시 알림받으실 수 있어요.

👇 여기서 등록하세요 (30초면 완료돼요)
[대기자 링크 삽입]

등록하시면 최우선으로 초대드릴게요 🖤`,
};

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

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
    const { stage, target, appDescription } = body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json({
        script: FALLBACK_SCRIPTS[stage] || FALLBACK_SCRIPTS.first_response,
        fallback: true,
      });
    }

    const stageDesc = {
      first_response: '처음 DM을 보내온 유저에게 보내는 첫 번째 응답 메시지',
      filter: '관심 있다고 응답한 유저에게 진짜 관심도를 확인하는 필터링 메시지',
      waitlist: '필터링을 통과한 유저를 대기자 리스트로 유도하는 클로징 메시지',
    }[stage];

    const prompt = `
당신은 1:1 DM 마케팅 전문가입니다.
다음 조건으로 DM 스크립트를 작성해주세요.

단계: ${stageDesc}
타겟 유저: ${target || '20~30대 한국 여성'}
앱 설명: ${appDescription || '초기 단계 스타트업 앱'}

규칙:
- 자연스럽고 친근한 한국어 구어체
- 너무 광고스럽지 않게
- 짧고 임팩트 있게 (150자 내외)
- 다음 행동을 명확하게 유도
- 줄바꿈을 적절히 사용

스크립트만 작성하세요 (설명 없이):
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const script = response.choices[0].message.content || '';
    return NextResponse.json({ script: script.trim() });
  } catch (error: any) {
    console.error('DM generation error:', error);

    // 결제 한도 초과 → 폴백 스크립트 반환
    if (isOpenAIBillingError(error)) {
      const stage = body?.stage || 'first_response';
      return NextResponse.json({
        script: FALLBACK_SCRIPTS[stage] || FALLBACK_SCRIPTS.first_response,
        fallback: true,
        warning: 'OpenAI 크레딧 한도 초과. 기본 스크립트를 표시합니다.',
      });
    }

    return NextResponse.json({ error: 'DM 스크립트 생성에 실패했습니다' }, { status: 500 });
  }
}
