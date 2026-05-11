import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const language = (formData.get('language') as string) || 'ko';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const transcription = await (openai.audio.transcriptions.create as Function)({
      file,
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const segments = (transcription.segments ?? []).map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));

    return NextResponse.json({ segments, language });
  } catch (err: any) {
    console.error('Whisper error:', err?.message);
    // Fallback: 크레딧 부족 시 샘플 자막 반환
    const fallback = [
      { start: 0,  end: 3,  text: language === 'ja' ? 'こんにちは！' : language === 'en' ? 'Hello!' : '안녕하세요!' },
      { start: 3,  end: 6,  text: language === 'ja' ? 'このビデオをお楽しみください' : language === 'en' ? 'Enjoy this video' : '영상을 즐겨주세요' },
      { start: 6,  end: 10, text: language === 'ja' ? 'ありがとうございました' : language === 'en' ? 'Thank you!' : '감사합니다!' },
    ];
    return NextResponse.json({ segments: fallback, fallback: true });
  }
}
