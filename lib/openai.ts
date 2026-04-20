import OpenAI from 'openai';

// 지연 초기화 — 빌드 시에는 인스턴스를 생성하지 않음
// (빌드 중에는 OPENAI_API_KEY가 없어서 즉시 초기화하면 build error 발생)
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// 기존 코드 호환성을 위한 proxy export
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as any)[prop];
  },
});
