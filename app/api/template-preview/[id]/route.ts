import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 템플릿 ID → 이미지 파일 매핑
const IMAGE_MAP: Record<string, string> = {
  'reels-highlight':    'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_reels_highlight_1776911918616.png',
  'kpop-mv':            'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_kpop_mv_1776911933817.png',
  'travel-vlog':        'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_travel_vlog_1776911948493.png',
  'fashion-lookbook':   'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_fashion_lookbook_1776911964333.png',
  'workout-motivation': 'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_workout_1776911991714.png',
  'aesthetic-lofi':     'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_aesthetic_lofi_1776912008149.png',
  'cinematic-montage':  'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_cinematic_1776912021795.png',
  'birthday-celebration': 'C:\\Users\\ujin1\\.gemini\\antigravity\\brain\\898f6366-2514-40fc-8924-2de378849bac\\tpl_birthday_1776912040372.png',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const filePath = IMAGE_MAP[params.id];
  if (!filePath || !fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
