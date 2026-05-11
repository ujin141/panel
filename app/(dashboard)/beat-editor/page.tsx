'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Music, Video, Upload, Play, Pause, Download, Zap, X, Check, Settings } from 'lucide-react';

interface Beat {
  time: number;
  strength: number;
}

interface Clip {
  id: string;
  file: File;
  url: string;
  duration: number;   // 이미지는 비트 시간으로 구간 결정
  name: string;
  type: 'video' | 'image';  // 새로 추가: 이미지 지원
  assignedBeat: number | null;
  trimStart: number;
  trimEnd: number;
  volume: number;
}

// ─── CapCut 스타일 편집 템플릿 ───
type TransitionType = 'cut' | 'flash' | 'fade' | 'zoom-in' | 'slide-left';
type AspectRatioType = '16:9' | '9:16' | '1:1';

interface TemplateSlot {
  index: number;
  label: string;       // 예: "메인 장면", "클로즈업" 등
  hint: string;        // 업로드 가이드
  duration: number;    // 이 슬롯이 표시될 시간(초)
  transition: TransitionType;  // 다음 슬롯으로 전환 방식
  zoom?: number;       // 줌 배율 (1.0 = 그대로, 1.2 = 1.2배 zoom-in)
}

interface EditTemplate {
  id: string;
  name: string;
  emoji: string;
  category: string;
  desc: string;
  longDesc: string;
  slotCount: number;
  slots: TemplateSlot[];
  aspectRatio: AspectRatioType;
  // 색보정
  filter: { brightness: number; contrast: number; saturation: number; hue: number; sepia: number; vignette: number; blur: number; };
  // 자막 스타일
  subtitleStyle: { font: string; size: number; color: string; bg: boolean; position: 'top' | 'middle' | 'bottom'; };
  // 시각적 프리뷰용 컬러
  previewGradient: string;
  previewTextColor: string;
  bgColor: string;
  // 총 재생 시간 (초)
  totalDuration: number;
  // AI 생성 예시 이미지 URL
  exampleImage: string;
}

const EDIT_TEMPLATES: EditTemplate[] = [
  {
    id: 'reels-highlight',
    name: '릴스 하이라이트',
    emoji: '⚡',
    category: 'SNS',
    desc: '빠른 비트 컷 · 8장 · 0.5초씩',
    longDesc: '인스타그램 릴스 최적화 · 강렬한 색감으로 눈길을 사로잡는 하이라이트 편집',
    slotCount: 8,
    aspectRatio: '9:16',
    totalDuration: 4,
    slots: [
      { index: 0, label: '오프닝 장면', hint: '임팩트 있는 첫 장면', duration: 0.5, transition: 'cut' },
      { index: 1, label: '장면 2', hint: '클로즈업 or 행동 장면', duration: 0.5, transition: 'flash' },
      { index: 2, label: '장면 3', hint: '와이드샷 or 전체 배경', duration: 0.5, transition: 'cut' },
      { index: 3, label: '하이라이트', hint: '가장 멋진 순간', duration: 0.5, transition: 'flash', zoom: 1.15 },
      { index: 4, label: '장면 5', hint: '디테일 장면', duration: 0.5, transition: 'cut' },
      { index: 5, label: '장면 6', hint: '역동적인 장면', duration: 0.5, transition: 'flash' },
      { index: 6, label: '장면 7', hint: '감동적인 장면', duration: 0.5, transition: 'cut' },
      { index: 7, label: '엔딩', hint: '마무리 장면', duration: 0.5, transition: 'cut' },
    ],
    filter: { brightness: 112, contrast: 120, saturation: 145, hue: 0, sepia: 0, vignette: 25, blur: 0 },
    subtitleStyle: { font: '"Black Han Sans", sans-serif', size: 24, color: '#ffffff', bg: true, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #ff0050 0%, #7928ca 100%)',
    previewTextColor: '#fff',
    bgColor: '#0f0010',
    exampleImage: '/api/template-preview/reels-highlight',
  },
  {
    id: 'kpop-mv',
    name: 'K-pop 뮤직비디오',
    emoji: '✨',
    category: 'K-pop',
    desc: '아이돌 MV 스타일 · 10장 · 0.4초씩',
    longDesc: '아이돌 뮤직비디오 감성 · 선명한 색감과 빠른 컷으로 에너지 넘치는 영상',
    slotCount: 10,
    aspectRatio: '16:9',
    totalDuration: 4,
    slots: [
      { index: 0, label: '인트로', hint: '강렬한 첫 컷', duration: 0.4, transition: 'flash' },
      { index: 1, label: '장면 2', hint: '아티스트 클로즈업', duration: 0.4, transition: 'cut' },
      { index: 2, label: '댄스 장면', hint: '안무 와이드샷', duration: 0.4, transition: 'flash' },
      { index: 3, label: '장면 4', hint: '개인 컷', duration: 0.4, transition: 'cut' },
      { index: 4, label: '장면 5', hint: '팀 샷', duration: 0.4, transition: 'flash', zoom: 1.1 },
      { index: 5, label: '장면 6', hint: '드라마틱 장면', duration: 0.4, transition: 'cut' },
      { index: 6, label: '장면 7', hint: '조명 강조 장면', duration: 0.4, transition: 'flash' },
      { index: 7, label: '장면 8', hint: '댄스 클로즈업', duration: 0.4, transition: 'cut' },
      { index: 8, label: '장면 9', hint: '전체 퍼포먼스', duration: 0.4, transition: 'flash' },
      { index: 9, label: '엔딩 컷', hint: '마무리 포즈', duration: 0.4, transition: 'cut' },
    ],
    filter: { brightness: 115, contrast: 118, saturation: 145, hue: 320, sepia: 0, vignette: 18, blur: 0 },
    subtitleStyle: { font: '"Black Han Sans", sans-serif', size: 26, color: '#ffffff', bg: true, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)',
    previewTextColor: '#fff',
    bgColor: '#0a0015',
    exampleImage: '/api/template-preview/kpop-mv',
  },
  {
    id: 'travel-vlog',
    name: '여행 브이로그',
    emoji: '✈️',
    category: '여행',
    desc: '감성 여행 · 6장 · 2초씩 · 페이드',
    longDesc: '여행의 설렘과 아름다운 풍경을 담은 감성적인 브이로그 편집 스타일',
    slotCount: 6,
    aspectRatio: '16:9',
    totalDuration: 12,
    slots: [
      { index: 0, label: '도착 장면', hint: '첫 목적지 와이드샷', duration: 2, transition: 'fade' },
      { index: 1, label: '풍경 1', hint: '자연 or 도시 경치', duration: 2, transition: 'fade' },
      { index: 2, label: '현지 음식', hint: '로컬 푸드 or 카페', duration: 2, transition: 'fade', zoom: 1.08 },
      { index: 3, label: '활동 장면', hint: '투어 or 관광 명소', duration: 2, transition: 'fade' },
      { index: 4, label: '황금빛 순간', hint: '석양 or 야경', duration: 2, transition: 'fade' },
      { index: 5, label: '마무리', hint: '기념 사진 or 귀갓길', duration: 2, transition: 'fade' },
    ],
    filter: { brightness: 108, contrast: 108, saturation: 120, hue: 15, sepia: 8, vignette: 15, blur: 0 },
    subtitleStyle: { font: '"Noto Sans KR", sans-serif', size: 20, color: '#ffffff', bg: true, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
    previewTextColor: '#fff',
    bgColor: '#001a2c',
    exampleImage: '/api/template-preview/travel-vlog',
  },
  {
    id: 'fashion-lookbook',
    name: '패션 룩북',
    emoji: '👗',
    category: '패션',
    desc: '미니멀 감성 · 8장 · 1초씩 · 슬라이드',
    longDesc: '워시드아웃 톤의 세련된 패션 룩북 · OOTD나 제품 사진에 최적화',
    slotCount: 8,
    aspectRatio: '9:16',
    totalDuration: 8,
    slots: [
      { index: 0, label: '전신 룩', hint: '전체 코디 샷', duration: 1, transition: 'slide-left' },
      { index: 1, label: '디테일 1', hint: '상의 클로즈업', duration: 1, transition: 'cut' },
      { index: 2, label: '디테일 2', hint: '액세서리 or 하의', duration: 1, transition: 'slide-left' },
      { index: 3, label: '분위기 샷', hint: '배경과 함께', duration: 1, transition: 'fade' },
      { index: 4, label: '포즈 1', hint: '다른 각도 포즈', duration: 1, transition: 'cut' },
      { index: 5, label: '포즈 2', hint: '클로즈업 포즈', duration: 1, transition: 'slide-left', zoom: 1.05 },
      { index: 6, label: '착장 변경', hint: '다른 룩 or 레이어링', duration: 1, transition: 'cut' },
      { index: 7, label: '마무리 컷', hint: '대표 포즈', duration: 1, transition: 'fade' },
    ],
    filter: { brightness: 95, contrast: 105, saturation: 55, hue: 0, sepia: 22, vignette: 28, blur: 0 },
    subtitleStyle: { font: 'Inter, sans-serif', size: 16, color: '#f0e0d0', bg: false, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #d4a896 0%, #8b6c5c 100%)',
    previewTextColor: '#fff',
    bgColor: '#1a1208',
    exampleImage: '/api/template-preview/fashion-lookbook',
  },
  {
    id: 'workout-motivation',
    name: '운동 동기부여',
    emoji: '💪',
    category: '운동',
    desc: '에너지 폭발 · 12장 · 0.3초씩',
    longDesc: '강렬한 운동 하이라이트 · 헬스장, 야외운동, 스포츠 영상에 최적화',
    slotCount: 12,
    aspectRatio: '16:9',
    totalDuration: 3.6,
    slots: Array.from({ length: 12 }, (_, i) => ({
      index: i,
      label: `장면 ${i + 1}`,
      hint: i === 0 ? '강렬한 첫 동작' : i === 11 ? '마무리 동작' : '운동 동작 장면',
      duration: 0.3,
      transition: (i % 2 === 0 ? 'cut' : 'flash') as TransitionType,
      zoom: i % 3 === 1 ? 1.12 : undefined,
    })),
    filter: { brightness: 105, contrast: 150, saturation: 130, hue: 0, sepia: 0, vignette: 35, blur: 0 },
    subtitleStyle: { font: 'Oswald, sans-serif', size: 30, color: '#ffff00', bg: false, position: 'top' },
    previewGradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    previewTextColor: '#fff',
    bgColor: '#0f0500',
    exampleImage: '/api/template-preview/workout-motivation',
  },
  {
    id: 'aesthetic-lofi',
    name: '이스테틱 / Lofi',
    emoji: '🌸',
    category: '감성',
    desc: '파스텔 감성 · 6장 · 1.5초씩 · 페이드',
    longDesc: '부드러운 파스텔 색감과 필름 그레인으로 lofi 감성의 슬라이드쇼 제작',
    slotCount: 6,
    aspectRatio: '1:1',
    totalDuration: 9,
    slots: [
      { index: 0, label: '메인 장면', hint: '대표 감성 사진', duration: 1.5, transition: 'fade' },
      { index: 1, label: '디테일', hint: '꽃, 커피, 책 등 소품', duration: 1.5, transition: 'fade' },
      { index: 2, label: '풍경', hint: '창문, 하늘, 거리', duration: 1.5, transition: 'fade', zoom: 1.06 },
      { index: 3, label: '분위기', hint: '조명 or 텍스처', duration: 1.5, transition: 'fade' },
      { index: 4, label: '감성 샷', hint: '인물 or 실루엣', duration: 1.5, transition: 'fade' },
      { index: 5, label: '엔딩', hint: '여운 있는 마지막 컷', duration: 1.5, transition: 'fade' },
    ],
    filter: { brightness: 105, contrast: 88, saturation: 72, hue: 330, sepia: 18, vignette: 22, blur: 0.3 },
    subtitleStyle: { font: '"Noto Sans KR", sans-serif', size: 18, color: '#ffe4f0', bg: false, position: 'middle' },
    previewGradient: 'linear-gradient(135deg, #fce7f3 0%, #ddd6fe 50%, #bfdbfe 100%)',
    previewTextColor: '#5b21b6',
    bgColor: '#1a0d12',
    exampleImage: '/api/template-preview/aesthetic-lofi',
  },
  {
    id: 'cinematic-montage',
    name: '시네마틱 몽타주',
    emoji: '🎬',
    category: '영화',
    desc: '영화 느낌 · 5장 · 3초씩 · 레터박스',
    longDesc: '드라마틱한 색감과 레터박스 바로 영화 같은 분위기의 몽타주 영상',
    slotCount: 5,
    aspectRatio: '16:9',
    totalDuration: 15,
    slots: [
      { index: 0, label: '오프닝 숏', hint: '와이드 환경 샷', duration: 3, transition: 'fade' },
      { index: 1, label: '캐릭터 소개', hint: '주인공 or 핵심 대상', duration: 3, transition: 'cut' },
      { index: 2, label: '클라이맥스', hint: '가장 극적인 순간', duration: 3, transition: 'cut', zoom: 1.1 },
      { index: 3, label: '여운 장면', hint: '감정적인 장면', duration: 3, transition: 'fade' },
      { index: 4, label: '엔딩 크레딧', hint: '마지막 와이드 숏', duration: 3, transition: 'fade' },
    ],
    filter: { brightness: 82, contrast: 150, saturation: 80, hue: 0, sepia: 12, vignette: 65, blur: 0 },
    subtitleStyle: { font: 'Oswald, sans-serif', size: 22, color: '#f5e6c8', bg: false, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
    previewTextColor: '#f5e6c8',
    bgColor: '#000000',
    exampleImage: '/api/template-preview/cinematic-montage',
  },
  {
    id: 'birthday-celebration',
    name: '생일 축하',
    emoji: '🎂',
    category: '기념일',
    desc: '컬러풀 · 8장 · 1초씩 · 플래시',
    longDesc: '생일 파티 분위기의 화려하고 밝은 색감으로 기억에 남는 영상 제작',
    slotCount: 8,
    aspectRatio: '9:16',
    totalDuration: 8,
    slots: [
      { index: 0, label: '케이크 컷', hint: '케이크 or 생일 장식', duration: 1, transition: 'flash' },
      { index: 1, label: '주인공', hint: '주인공 밝은 표정', duration: 1, transition: 'cut' },
      { index: 2, label: '파티 장면 1', hint: '모임 전체 샷', duration: 1, transition: 'flash', zoom: 1.1 },
      { index: 3, label: '선물', hint: '선물 or 서프라이즈', duration: 1, transition: 'cut' },
      { index: 4, label: '웃음', hint: '함께하는 즐거운 순간', duration: 1, transition: 'flash' },
      { index: 5, label: '파티 장면 2', hint: '풍선 or 파티 소품', duration: 1, transition: 'cut' },
      { index: 6, label: '촛불 끄기', hint: '촛불 or 소원', duration: 1, transition: 'flash' },
      { index: 7, label: '단체 사진', hint: '함께한 모든 분들', duration: 1, transition: 'cut' },
    ],
    filter: { brightness: 118, contrast: 108, saturation: 148, hue: 0, sepia: 0, vignette: 10, blur: 0 },
    subtitleStyle: { font: '"Black Han Sans", sans-serif', size: 24, color: '#ffffff', bg: true, position: 'bottom' },
    previewGradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
    previewTextColor: '#fff',
    bgColor: '#1a0510',
    exampleImage: '/api/template-preview/birthday-celebration',
  },
];

type ExportQuality = 'ultra' | 'high' | 'standard';

const QUALITY_CONFIG: Record<ExportQuality, { label: string; desc: string; videoBps: number; icon: string }> = {
  ultra:    { label: '초고화질 4K',  desc: '3840×2160 · 50Mbps · 최고 품질',   videoBps: 50_000_000, icon: '💎' },
  high:     { label: '고화질 1080p', desc: '1920×1080 · 20Mbps · 권장',          videoBps: 20_000_000, icon: '⭐' },
  standard: { label: '표준 720p',    desc: '1280×720  · 8Mbps  · 빠른 내보내기', videoBps:  8_000_000, icon: '🚀' },
};

const FORMAT_CONFIG: Record<ExportFormat, { label: string; mime: string; ext: string }> = {
  mp4:  { label: 'MP4',  mime: 'video/mp4',  ext: 'mp4'  },
  webm: { label: 'WebM', mime: 'video/webm', ext: 'webm' },
  mov:  { label: 'MOV',  mime: 'video/mp4',  ext: 'mov'  },
};

/* ─── 레이어 합성 ─── */
type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten' | 'darken' | 'hard-light' | 'soft-light' | 'color-dodge' | 'color-burn';
type LayerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full' | 'custom';

interface VideoLayer {
  id: string;
  file: File;
  url: string;
  name: string;
  position: LayerPosition;
  // 커스텀 위치 (position='custom'일 때)
  x: number;      // 0~100 (%)
  y: number;      // 0~100 (%)
  width: number;  // 0~100 (%)
  height: number; // 0~100 (%)
  opacity: number;   // 0~1
  blendMode: BlendMode;
  muted: boolean;
  loop: boolean;
  visible: boolean;
}

const POSITION_PRESETS: Record<LayerPosition, { label: string; icon: string; x: number; y: number; w: number; h: number }> = {
  'full':         { label: '전체',     icon: '⬛', x: 0,  y: 0,  w: 100, h: 100 },
  'top-left':     { label: '좌상단',   icon: '↖',  x: 2,  y: 2,  w: 32,  h: 32  },
  'top-right':    { label: '우상단',   icon: '↗',  x: 66, y: 2,  w: 32,  h: 32  },
  'bottom-left':  { label: '좌하단',   icon: '↙',  x: 2,  y: 66, w: 32,  h: 32  },
  'bottom-right': { label: '우하단',   icon: '↘',  x: 66, y: 66, w: 32,  h: 32  },
  'center':       { label: '중앙',     icon: '⊕',  x: 25, y: 25, w: 50,  h: 50  },
  'custom':       { label: '직접 설정', icon: '✎',  x: 10, y: 10, w: 40,  h: 40  },
};

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: '일반',       value: 'normal'     },
  { label: '스크린',     value: 'screen'     },
  { label: '곱하기',     value: 'multiply'   },
  { label: '오버레이',   value: 'overlay'    },
  { label: '밝게',       value: 'lighten'    },
  { label: '어둡게',     value: 'darken'     },
  { label: '하드라이트', value: 'hard-light' },
  { label: '소프트라이트',value: 'soft-light'},
  { label: '컬러닷지',   value: 'color-dodge'},
  { label: '컬러번',     value: 'color-burn' },
];


interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
}

const SUBTITLE_LANGUAGES = [
  { code: 'ko', label: '🇰🇷 한국어' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'th', label: '🇹🇭 ภาษาไทย' },
  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
];

const FONT_FAMILIES = [
  { label: 'Inter',         value: 'Inter, sans-serif' },
  { label: 'Noto Sans KR',  value: '"Noto Sans KR", sans-serif' },
  { label: 'Black Han Sans',value: '"Black Han Sans", sans-serif' },
  { label: 'Nanum Gothic',  value: '"Nanum Gothic", sans-serif' },
  { label: 'Oswald',        value: 'Oswald, sans-serif' },
  { label: 'Bebas Neue',    value: '"Bebas Neue", sans-serif' },
  { label: 'Roboto',        value: 'Roboto, sans-serif' },
  { label: '돋움',            value: 'Dotum, sans-serif' },
  { label: '굴림',            value: 'Gulim, sans-serif' },
];

const FONT_WEIGHTS = [
  { label: '보통', value: '400' },
  { label: '중간', value: '600' },
  { label: '굵게', value: '700' },
  { label: '최굵', value: '900' },
];

const OUTLINE_PRESETS = [
  { label: '없음', value: 'none' },
  { label: '얇은 검정', value: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000' },
  { label: '두꺼운 검정', value: '-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000' },
  { label: '흰색 아웃라인', value: '-2px -2px 0 #fff,2px -2px 0 #fff,-2px 2px 0 #fff,2px 2px 0 #fff' },
  { label: '글로우', value: '0 0 8px rgba(255,255,255,0.9),0 0 20px rgba(255,255,255,0.5)' },
  { label: '드롭 섀도우', value: '2px 2px 6px rgba(0,0,0,0.8)' },
];


// ─── 유명 템플릿 프리셋 ───
interface BeatTemplate {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  category: string;
  // 색보정
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sepia: number;
  vignette: number;
  blur: number;
  // 자막
  subtitleFont: string;
  subtitleSize: number;
  subtitleColor: string;
  subtitleBg: boolean;
  subtitlePos: 'top' | 'center' | 'bottom';
  // 기타
  aspectRatio?: string;
  bgColor: string;
}

const BEAT_TEMPLATES: BeatTemplate[] = [
  {
    id: 'kpop',
    label: 'K-pop 고선명',
    emoji: '✨',
    desc: '선명한 색감 + 글로우 효과 · 아이돌 뮤비 스타일',
    category: '판방',
    brightness: 115, contrast: 115, saturation: 140, hue: 320, sepia: 0, vignette: 20, blur: 0,
    subtitleFont: '"Black Han Sans", sans-serif', subtitleSize: 26, subtitleColor: '#ffffff',
    subtitleBg: true, subtitlePos: 'bottom', bgColor: '#0a0015',
  },
  {
    id: 'cinematic',
    label: '시네마틱',
    emoji: '🎬',
    desc: '넣시 진한 색감 + 바이네트 · 영화 스타일',
    category: '영화',
    brightness: 82, contrast: 148, saturation: 85, hue: 0, sepia: 12, vignette: 65, blur: 0,
    subtitleFont: 'Oswald, sans-serif', subtitleSize: 22, subtitleColor: '#f5e6c8',
    subtitleBg: false, subtitlePos: 'bottom', bgColor: '#000000',
  },
  {
    id: 'travel',
    label: '트래블 블로그',
    emoji: '✈️',
    desc: '생동감 맞는 색감 + 한국어 자막 · 여행 콘텐츠',
    category: '여행',
    brightness: 108, contrast: 105, saturation: 125, hue: 0, sepia: 0, vignette: 15, blur: 0,
    subtitleFont: '"Noto Sans KR", sans-serif', subtitleSize: 20, subtitleColor: '#ffffff',
    subtitleBg: true, subtitlePos: 'bottom', bgColor: '#001a2c',
  },
  {
    id: 'fashion',
    label: '패션 / 미니멀',
    emoji: '👗',
    desc: '워시드아웃 톤 + 감성적 더마크 · 나린히 스타일',
    category: '패션',
    brightness: 95, contrast: 108, saturation: 55, hue: 0, sepia: 25, vignette: 30, blur: 0,
    subtitleFont: 'Inter, sans-serif', subtitleSize: 17, subtitleColor: '#f0e0d0',
    subtitleBg: false, subtitlePos: 'center', bgColor: '#1a1208',
  },
  {
    id: 'gaming',
    label: '게이밍 하이라이트',
    emoji: '🎮',
    desc: '네온 + 강력한 콘트라스트 · e-스포츠 스타일',
    category: '게임',
    brightness: 105, contrast: 145, saturation: 160, hue: 200, sepia: 0, vignette: 40, blur: 0,
    subtitleFont: 'Oswald, sans-serif', subtitleSize: 28, subtitleColor: '#00ffff',
    subtitleBg: true, subtitlePos: 'top', bgColor: '#000510',
  },
  {
    id: 'aesthetic',
    label: '이스트틱 / Lofi',
    emoji: '🌸',
    desc: '파스텔조 + 필름 그레인 · 로파이 감성',
    category: '이스튱',
    brightness: 105, contrast: 90, saturation: 80, hue: 330, sepia: 20, vignette: 25, blur: 0.4,
    subtitleFont: '"Noto Sans KR", sans-serif', subtitleSize: 18, subtitleColor: '#ffe4f0',
    subtitleBg: false, subtitlePos: 'center', bgColor: '#1a0d12',
  },
  {
    id: 'vintage',
    label: '빴테이지 필름',
    emoji: '📽️',
    desc: '필름 노이즈 + 오래된 색감 · 레트로 카세트 필름',
    category: '필름',
    brightness: 88, contrast: 118, saturation: 65, hue: 25, sepia: 45, vignette: 50, blur: 0,
    subtitleFont: '"Bebas Neue", sans-serif', subtitleSize: 22, subtitleColor: '#f5e6c0',
    subtitleBg: false, subtitlePos: 'bottom', bgColor: '#1a1000',
  },
  {
    id: 'dark-luxury',
    label: '다크 럭셔리',
    emoji: '💎',
    desc: '어두운 배경 + 그라데이션 가나스 · 럭셔리 브랜드',
    category: '럭셔리',
    brightness: 78, contrast: 135, saturation: 100, hue: 270, sepia: 5, vignette: 75, blur: 0,
    subtitleFont: 'Inter, sans-serif', subtitleSize: 19, subtitleColor: '#d4af37',
    subtitleBg: false, subtitlePos: 'center', bgColor: '#05000f',
  },
];


export default function BeatEditorPage() {
  const [bgmFile, setBgmFile] = useState<File | null>(null);
  const [bgmUrl, setBgmUrl] = useState('');
  const [bgmVolume, setBgmVolume] = useState(1);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.5);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bgmDuration, setBgmDuration] = useState(0);
  const [bgmStartTime, setBgmStartTime] = useState(0);
  const [bgmEndTime, setBgmEndTime] = useState(0);
  const [activeClipIdx, setActiveClipIdx] = useState(0);
  const [editTab, setEditTab] = useState<'clips'|'beats'>('clips');

  // 템플릿
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('mp4');
  const [exportQuality, setExportQuality] = useState<ExportQuality>('high');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);

  // 자막 상태
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([]);
  const [subtitleLang, setSubtitleLang] = useState('ko');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [subtitleFallback, setSubtitleFallback] = useState(false);
  const [subtitleTargetClipId, setSubtitleTargetClipId] = useState<string>('');

  // 자막 폰트 상세 설정
  const [subtitleFontSize, setSubtitleFontSize] = useState(22);
  const [subtitleBg, setSubtitleBg] = useState(true);
  const [subtitleBgColor, setSubtitleBgColor] = useState('#000000');
  const [subtitleBgOpacity, setSubtitleBgOpacity] = useState(80);
  const [subtitleFontFamily, setSubtitleFontFamily] = useState(FONT_FAMILIES[0].value);
  const [subtitleFontWeight, setSubtitleFontWeight] = useState('700');
  const [subtitleColor, setSubtitleColor] = useState('#ffffff');
  const [subtitleOutline, setSubtitleOutline] = useState(OUTLINE_PRESETS[1].value);
  const [subtitleLineHeight, setSubtitleLineHeight] = useState(1.4);
  const [subtitleLetterSpacing, setSubtitleLetterSpacing] = useState(0);
  const [subtitlePosition, setSubtitlePosition] = useState<'bottom'|'top'|'middle'>('bottom');

  // 색보정 (CSS filter)
  const [filterBrightness, setFilterBrightness] = useState(100);
  const [filterContrast, setFilterContrast] = useState(100);
  const [filterSaturation, setFilterSaturation] = useState(100);
  const [filterHue, setFilterHue] = useState(0);
  const [filterSepia, setFilterSepia] = useState(0);
  const [filterBlur, setFilterBlur] = useState(0);
  const [filterVignette, setFilterVignette] = useState(0);

  // ── 편집 템플릿 (CapCut 스타일) ──
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedEditTemplate, setSelectedEditTemplate] = useState<EditTemplate | null>(null);
  const [templateSlotFiles, setTemplateSlotFiles] = useState<(File | null)[]>([]);
  const [templateSlotUrls, setTemplateSlotUrls] = useState<(string | null)[]>([]);
  const [templateCategory, setTemplateCategory] = useState<string>('전체');
  const [previewTemplate, setPreviewTemplate] = useState<EditTemplate | null>(null);
  const [previewSlotIdx, setPreviewSlotIdx] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewElapsed, setPreviewElapsed] = useState(0); // 전체 재생 경과 초
  const previewIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewElapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 편집 전/후 비교
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50); // 0~100%

  // 레이어 합성 상태
  const [layers, setLayers] = useState<VideoLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);       // 버퍼 A
  const videoRef2 = useRef<HTMLVideoElement>(null);      // 버퍼 B
  const activeVideoRef = useRef<'a'|'b'>('a');           // 현재 활성 버퍼 (ref: 즉시 접근용)
  const [activeBuffer, setActiveBuffer] = useState<'a'|'b'>('a'); // React state용 (렌더 동기화)
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playStartTimeRef = useRef<number>(0);
  const lastBeatIdxRef = useRef<number>(-1);
  const lastTimeUpdateRef = useRef<number>(0);           // setCurrentTime 스로틀용

  // ─── 레이어 함수 ───
  const addVideoLayer = (files: FileList) => {
    const newLayers: VideoLayer[] = Array.from(files).map(file => {
      const preset = POSITION_PRESETS['bottom-right'];
      return {
        id: `layer-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^.]+$/, ''),
        position: 'bottom-right',
        x: preset.x, y: preset.y, width: preset.w, height: preset.h,
        opacity: 0.9,
        blendMode: 'normal',
        muted: true,
        loop: true,
        visible: true,
      };
    });
    setLayers(prev => [...prev, ...newLayers]);
    if (newLayers.length > 0) setSelectedLayerId(newLayers[0].id);
  };

  const updateLayer = (id: string, patch: Partial<VideoLayer>) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const removeLayer = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const moveLayerOrder = (id: string, dir: -1 | 1) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  };

  const applyPositionPreset = (id: string, pos: LayerPosition) => {
    const p = POSITION_PRESETS[pos];
    updateLayer(id, { position: pos, x: p.x, y: p.y, width: p.w, height: p.h });
  };

  const updateClip = (id: string, patch: Partial<Clip>) =>
    setClips(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    if (selectedClipId === id) setSelectedClipId(null);
  };

  const moveClip = (id: string, dir: -1 | 1) => {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next.map((c, i) => ({ ...c, assignedBeat: i < beats.length ? i : null }));
    });
  };

  useEffect(() => { if (audioRef.current) audioRef.current.volume = bgmVolume; }, [bgmVolume]);

  // 자막 자동 생성 (OpenAI Whisper)
  const generateSubtitles = async (clipId?: string) => {
    const targetId = clipId || subtitleTargetClipId || clips[0]?.id;
    const clip = clips.find(c => c.id === targetId);
    if (!clip) return alert('클립을 먼저 업로드해주세요.');

    setGeneratingSubtitles(true);
    setSubtitleFallback(false);
    setSubtitles([]);

    try {
      const form = new FormData();
      form.append('file', clip.file, clip.file.name);
      form.append('language', subtitleLang);

      const res = await fetch('/api/subtitle/generate', { method: 'POST', body: form });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setSubtitles(data.segments || []);
      setSubtitleFallback(!!data.fallback);
      setShowSubtitles(true);
    } catch (err) {
      console.error(err);
      alert('자막 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingSubtitles(false);
    }
  };

  // BGM 업로드 처리
  const handleBgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgmFile(file);
    const url = URL.createObjectURL(file);
    setBgmUrl(url);
    setBeats([]);
    setClips([]);
    setCurrentTime(0);
    setBgmStartTime(0);
    // duration 자동 읽기
    const tmp = new Audio(url);
    tmp.onloadedmetadata = () => {
      setBgmDuration(tmp.duration);
      setBgmEndTime(tmp.duration);
    };
  };

  // 비트 감지 (Web Audio API)
  const detectBeats = async () => {
    if (!bgmFile) return;
    setDetecting(true);
    try {
      const arrayBuffer = await bgmFile.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setBgmDuration(audioBuffer.duration);

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.05); // 50ms 윈도우
      const detected: Beat[] = [];

      // 에너지 기반 온셋 감지
      const energies: number[] = [];
      for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
          energy += channelData[i + j] ** 2;
        }
        energies.push(energy / windowSize);
      }

      // 로컬 평균 대비 피크 감지
      const avgWindow = 20;
      const minIntervalFrames = Math.floor(0.3 * (sampleRate / windowSize));

      let lastBeatIdx = -minIntervalFrames;
      for (let i = avgWindow; i < energies.length - avgWindow; i++) {
        const localAvg = energies.slice(i - avgWindow, i + avgWindow).reduce((a, b) => a + b, 0) / (avgWindow * 2);
        if (energies[i] > localAvg * sensitivity && i - lastBeatIdx > minIntervalFrames) {
          const time = (i * windowSize) / sampleRate;
          detected.push({ time, strength: Math.min(1, energies[i] / (localAvg * 3)) });
          lastBeatIdx = i;
        }
      }

      // 구간 필터링: bgmStartTime~bgmEndTime 범위의 비트만 사용
      const effectiveEnd = bgmEndTime > 0 ? bgmEndTime : audioBuffer.duration;
      const filtered = detected.filter(b => b.time >= bgmStartTime && b.time <= effectiveEnd);
      // 시작 시간 기준으로 offset 보정
      const offsetBeats = filtered.map(b => ({ ...b, time: b.time - bgmStartTime }));
      setBeats(offsetBeats);
      await audioCtx.close();

      // 클립에 비트 자동 배정
      autoAssignBeats(clips, offsetBeats);
    } catch (err) {
      console.error(err);
      alert('비트 감지 중 오류가 발생했습니다.');
    } finally {
      setDetecting(false);
    }
  };

  // 클립 자동 배정
  const autoAssignBeats = (clipList: Clip[], beatList: Beat[]) => {
    const updated = clipList.map((clip, i) => ({
      ...clip,
      assignedBeat: i < beatList.length ? i : null,
    }));
    setClips(updated);
  };

  // 클립/이미지 업로드 (영상 + 이미지 모두 지원)
  const handleClipsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newClips: Clip[] = files.map((file, i) => {
      const isImage = file.type.startsWith('image/');
      return {
        id: `clip-${Date.now()}-${i}`,
        file,
        url: URL.createObjectURL(file),
        duration: isImage ? 2 : 0,   // 이미지는 기본 2초 표시
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: isImage ? 'image' : 'video',
        assignedBeat: beats.length > 0 && (clips.length + i) < beats.length ? clips.length + i : null,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
      };
    });

    // 비디오만 duration 로드
    newClips.filter(c => c.type === 'video').forEach((clip) => {
      const vid = document.createElement('video');
      vid.src = clip.url;
      vid.onloadedmetadata = () => {
        setClips((prev) =>
          prev.map((c) => (c.id === clip.id ? { ...c, duration: vid.duration } : c))
        );
      };
    });

    setClips((prev) => {
      const updated = [...prev, ...newClips];
      if (beats.length > 0) autoAssignBeats(updated, beats);
      return updated;
    });

    // 첫 업로드 시 즉시 프리뷰
    if (clips.length === 0 && newClips.length > 0) {
      setActiveClipIdx(0);
      const first = newClips[0];
      setTimeout(() => {
        if (first.type === 'video' && videoRef.current) {
          videoRef.current.src = first.url;
          videoRef.current.load();
        }
      }, 100);
    }
  };

  // ─── 최신 값을 ref로 추적 (stale closure 방지) ───
  const clipsRef = useRef(clips);
  const beatsRef = useRef(beats);
  const activeClipIdxRef = useRef(activeClipIdx);
  const isPlayingRef = useRef(false);
  const bgmUrlRef = useRef(bgmUrl);
  const bgmStartTimeRef = useRef(bgmStartTime);
  const bgmEndTimeRef = useRef(bgmEndTime);
  useEffect(() => { clipsRef.current = clips; }, [clips]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);
  useEffect(() => { activeClipIdxRef.current = activeClipIdx; }, [activeClipIdx]);
  useEffect(() => { bgmUrlRef.current = bgmUrl; }, [bgmUrl]);
  useEffect(() => { bgmStartTimeRef.current = bgmStartTime; }, [bgmStartTime]);
  useEffect(() => { bgmEndTimeRef.current = bgmEndTime; }, [bgmEndTime]);

  // 프리로드: 비활성 버퍼에 다음 클립 미리 로드
  const preloadNext = (nextIdx: number) => {
    const curClips = clipsRef.current;
    if (!curClips[nextIdx]) return;
    // 현재 활성이 'a'(videoRef)면 비활성은 'b'(videoRef2)
    const inactive = activeVideoRef.current === 'a' ? videoRef2.current : videoRef.current;
    if (!inactive) return;
    const url = curClips[nextIdx].url;
    if (inactive.src !== url) {
      inactive.src = url;
      inactive.currentTime = curClips[nextIdx].trimStart || 0;
      inactive.load();
    }
  };

  // 클립 전환 (더블 버퍼 스왑) — DOM 직접 조작 없이 React state로 제어
  const switchToClip = (idx: number) => {
    const curClips = clipsRef.current;
    const clip = curClips[idx];
    if (!clip) return;

    const nextBuf = activeVideoRef.current === 'a' ? 'b' : 'a';
    const nextVid = nextBuf === 'a' ? videoRef.current : videoRef2.current;
    const prevVid = activeVideoRef.current === 'a' ? videoRef.current : videoRef2.current;
    if (!nextVid || !prevVid) return;

    if (clip.type === 'image') {
      // 이미지 클립: 비디오 버퍼 사용 안 함, 이전 비디오만 정지
      prevVid.pause();
      // activeBuffer 전환 → img 오버레이가 JSX에서 바로 표시됨
      activeVideoRef.current = nextBuf;
      setActiveBuffer(nextBuf);
      // 다음 클립 프리로드
      preloadNext((idx + 1) % curClips.length);
      return;
    }

    // 비활성 버퍼에 비디오 클립 세팅 후 재생
    if (nextVid.src !== clip.url) {
      nextVid.src = clip.url;
      nextVid.currentTime = clip.trimStart || 0;
    } else {
      nextVid.currentTime = clip.trimStart || 0;
    }
    nextVid.play().catch(() => {});
    prevVid.pause();

    // ref 즉시 업데이트 (tick 내부에서 사용)
    activeVideoRef.current = nextBuf;
    // React state 업데이트 → JSX가 올바른 opacity/zIndex를 렌더링
    setActiveBuffer(nextBuf);

    // 다음 클립 프리로드
    const afterIdx = (idx + 1) % curClips.length;
    preloadNext(afterIdx);
  };

  // ─── 편집 템플릿 적용 ───
  const applyEditTemplate = (tpl: EditTemplate, slotFiles: (File | null)[], slotUrls: (string | null)[]) => {
    // 슬롯 파일로 Clip 배열 생성
    const newClips: Clip[] = slotFiles
      .map((file, i) => {
        if (!file || !slotUrls[i]) return null;
        const isImage = file.type.startsWith('image/');
        return {
          id: `tpl-clip-${i}-${Date.now()}`,
          file,
          url: slotUrls[i]!,
          duration: tpl.slots[i]?.duration ?? 1,
          name: tpl.slots[i]?.label ?? `장면 ${i + 1}`,
          type: (isImage ? 'image' : 'video') as 'image' | 'video',
          assignedBeat: i,
          trimStart: 0,
          trimEnd: 0,
          volume: 1,
        };
      })
      .filter(Boolean) as Clip[];

    if (newClips.length === 0) return;

    // 클립 교체
    setClips(newClips);
    setActiveClipIdx(0);

    // 색보정 적용
    setFilterBrightness(tpl.filter.brightness);
    setFilterContrast(tpl.filter.contrast);
    setFilterSaturation(tpl.filter.saturation);
    setFilterHue(tpl.filter.hue);
    setFilterSepia(tpl.filter.sepia);
    setFilterVignette(tpl.filter.vignette);
    setFilterBlur(tpl.filter.blur);

    // 자막 스타일 적용
    setSubtitleFontFamily(tpl.subtitleStyle.font);
    setSubtitleFontSize(tpl.subtitleStyle.size);
    setSubtitleColor(tpl.subtitleStyle.color);
    setSubtitleBg(tpl.subtitleStyle.bg);
    setSubtitlePosition(tpl.subtitleStyle.position === 'middle' ? 'middle' : tpl.subtitleStyle.position);

    // 모달 닫기
    setShowTemplateModal(false);
    setSelectedEditTemplate(null);
    setTemplateSlotFiles([]);
    setTemplateSlotUrls([]);

    // 첫 클립 프리뷰
    setTimeout(() => {
      const first = newClips[0];
      if (first.type === 'video' && videoRef.current) {
        videoRef.current.src = first.url;
        videoRef.current.load();
        setActiveBuffer('a');
      }
    }, 100);
  };

  // ─── 재생/일시정지 ───
  const togglePlay = async () => {
    if (clips.length === 0) return;

    if (isPlayingRef.current) {
      // ── 정지 ──
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      videoRef.current?.pause();
      videoRef2.current?.pause();
      cancelAnimationFrame(animFrameRef.current);
      lastBeatIdxRef.current = -1;
    } else {
      // ── 재생 시작 ──
      isPlayingRef.current = true;
      lastBeatIdxRef.current = -1;
      activeClipIdxRef.current = 0;
      activeVideoRef.current = 'a';
      setActiveBuffer('a');   // 버퍼 A(videoRef)가 화면에 나오도록
      setIsPlaying(true);
      setActiveClipIdx(0);

      // 버퍼 A: 첫 클립 로드 및 재생
      if (videoRef.current) {
        const clip = clipsRef.current[0];
        if (clip) {
          videoRef.current.src = clip.url;
          videoRef.current.currentTime = clip.trimStart || 0;
          try { await videoRef.current.play(); } catch {}
        }
      }
      // 버퍼 B: 두 번째 클립 프리로드
      if (videoRef2.current && clipsRef.current.length > 1) {
        const clip2 = clipsRef.current[1];
        videoRef2.current.src = clip2.url;
        videoRef2.current.currentTime = clip2.trimStart || 0;
        videoRef2.current.load();
      }

      // BGM 재생 (bgmStartTime부터 시작)
      if (audioRef.current && bgmUrl) {
        audioRef.current.currentTime = bgmStartTime;
        try { await audioRef.current.play(); } catch {}
      }

      playStartTimeRef.current = performance.now();
      lastTimeUpdateRef.current = 0;
      tick();
    }
  };

  const tick = () => {
    if (!isPlayingRef.current) return;

    const curBeats = beatsRef.current;
    const curClips = clipsRef.current;
    const curBgmUrl = bgmUrlRef.current;
    const curBgmStart = bgmStartTimeRef.current;
    const curBgmEnd = bgmEndTimeRef.current;

    // 현재 재생 원시 시간 (BGM 있으면 오디오 currentTime, 없으면 wall clock)
    const rawT = (audioRef.current && curBgmUrl)
      ? audioRef.current.currentTime
      : (performance.now() - playStartTimeRef.current) / 1000;

    // bgmEndTime 도달 시 자동 정지
    const effectiveEndTime = curBgmEnd > 0 ? curBgmEnd : Infinity;
    if (curBgmUrl && rawT >= effectiveEndTime) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      videoRef.current?.pause();
      videoRef2.current?.pause();
      lastBeatIdxRef.current = -1;
      return;
    }

    // 비트 매핑용 시간 (bgmStartTime offset 보정)
    const t = rawT - (curBgmUrl ? curBgmStart : 0);

    // currentTime 업데이트 (200ms 스로틀 → 리렌더 최소화)
    const now = performance.now();
    if (now - lastTimeUpdateRef.current > 200) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(t);
    }

    if (curClips.length > 1) {
      if (curBeats.length > 0) {
        // ── 비트 기반: 새 비트에 도달할 때마다 다음 클립으로 순환 ──
        let beatIdx = -1;
        for (let i = curBeats.length - 1; i >= 0; i--) {
          if (t >= curBeats[i].time) { beatIdx = i; break; }
        }
        if (beatIdx >= 0 && beatIdx !== lastBeatIdxRef.current) {
          lastBeatIdxRef.current = beatIdx;
          const newClipIdx = (activeClipIdxRef.current + 1) % curClips.length;
          activeClipIdxRef.current = newClipIdx;
          setActiveClipIdx(newClipIdx);
          switchToClip(newClipIdx);
        }
      } else {
        // ── BGM 없음: wall clock 2초 간격으로 순환 ──
        const newClipIdx = Math.floor(t / 2) % curClips.length;
        if (newClipIdx !== activeClipIdxRef.current) {
          activeClipIdxRef.current = newClipIdx;
          setActiveClipIdx(newClipIdx);
          switchToClip(newClipIdx);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
  };



  // 활성 클립 변경 시 비디오 동기화 (정지 상태에서 미리보기)
  useEffect(() => {
    if (isPlayingRef.current) return; // 재생 중엔 tick()이 직접 제어
    const clip = clips[activeClipIdx];
    if (!clip) return;

    // 정지 상태: 항상 버퍼A(videoRef)에 표시, activeBuffer를 'a'로 초기화
    activeVideoRef.current = 'a';
    setActiveBuffer('a');

    if (videoRef.current) {
      if (videoRef.current.src !== clip.url) {
        videoRef.current.src = clip.url;
      }
      videoRef.current.currentTime = clip.trimStart || 0;
    }
  }, [activeClipIdx, clips]);

  // 레이어 비디오 재생/정지 동기화
  const layerVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  useEffect(() => {
    layers.forEach(layer => {
      const el = layerVideoRefs.current.get(layer.id);
      if (!el) return;
      if (isPlaying && layer.visible) { el.play().catch(() => {}); }
      else { el.pause(); }
    });
  }, [isPlaying, layers]);

  // Timeline seek on click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bgmDuration || !timelineRef.current || !audioRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * bgmDuration;
    setCurrentTime(ratio * bgmDuration);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = bgmDuration > 0 ? (currentTime / bgmDuration) * 100 : 0;
  const selectedClip = clips.find(c => c.id === selectedClipId) || null;
  const avgBpm = beats.length > 1 && bgmDuration > 0 ? Math.round(beats.length / bgmDuration * 60) : 0;

  // 현재 재생 시간에 맞는 자막 (비디오 기준 시간으로 매핑)
  const activeClip = clips[activeClipIdx];
  const clipElapsedTime = activeClip
    ? currentTime - (activeClip.assignedBeat !== null && beats[activeClip.assignedBeat]
        ? beats[activeClip.assignedBeat].time : 0)
    : 0;
  const currentSubtitle = showSubtitles
    ? subtitles.find(s => clipElapsedTime >= s.start && clipElapsedTime <= s.end) || null
    : null;

  return (
    <div className="page-container">
      <Header
        title="🎵 비트 싱크 영상 편집기"
        subtitle="BGM을 업로드하면 AI가 비트를 감지하고 클립을 자동으로 컷 편집합니다"
      />

      {/* ── 편집 템플릿 선택 모달 ── */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* 모달 헤더 */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              {selectedEditTemplate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => { setSelectedEditTemplate(null); setTemplateSlotFiles([]); setTemplateSlotUrls([]); }}
                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    ← 뒤로
                  </button>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{selectedEditTemplate.emoji} {selectedEditTemplate.name}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{selectedEditTemplate.longDesc}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>🎨 편집 템플릿 선택</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>사진·영상을 끼워넣으면 자동으로 완성되는 비트 싱크 영상</div>
                </div>
              )}
            </div>
            <button onClick={() => { setShowTemplateModal(false); setSelectedEditTemplate(null); setTemplateSlotFiles([]); setTemplateSlotUrls([]); }}
              style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14 }}>
              닫기 ✕
            </button>
          </div>

          {!selectedEditTemplate ? (
            /* ── Step 1: 템플릿 선택 ── */
            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
              {/* 카테고리 필터 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                {['전체', 'SNS', 'K-pop', '여행', '패션', '운동', '감성', '영화', '기념일'].map(cat => (
                  <button key={cat} onClick={() => setTemplateCategory(cat)}
                    style={{ padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: templateCategory === cat ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${templateCategory === cat ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      color: templateCategory === cat ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                      transition: 'all 0.15s',
                    }}>
                    {cat}
                  </button>
                ))}
              </div>
              {/* 템플릿 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                {EDIT_TEMPLATES.filter(t => templateCategory === '전체' || t.category === templateCategory).map(tpl => (
                  <div key={tpl.id}
                    onClick={() => {
                      setSelectedEditTemplate(tpl);
                      setTemplateSlotFiles(Array(tpl.slotCount).fill(null));
                      setTemplateSlotUrls(Array(tpl.slotCount).fill(null));
                    }}
                    style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                     {/* 예시 이미지 프리뷰 */}
                    <div style={{ height: 175, position: 'relative', overflow: 'hidden', background: tpl.previewGradient }}>
                      <img
                        src={tpl.exampleImage}
                        alt={tpl.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {/* 다크 그라데이션 오버레이 */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
                      {/* aspect ratio 배지 */}
                      <div style={{ position: 'absolute', top: 10, right: 10, padding: '3px 8px', background: 'rgba(0,0,0,0.65)', borderRadius: 6, fontSize: 11, color: '#fff', fontWeight: 600 }}>
                        {tpl.aspectRatio}
                      </div>
                      {/* 카테고리 배지 */}
                      <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: 'rgba(0,0,0,0.45)', borderRadius: 6, fontSize: 11, color: '#fff' }}>
                        {tpl.category}
                      </div>
                      {/* 미리보기 버튼 */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl);
                          setPreviewSlotIdx(0);
                          setPreviewPlaying(true);
                          setPreviewElapsed(0);
                          if (previewIntervalRef.current) clearTimeout(previewIntervalRef.current);
                          if (previewElapsedRef.current) clearInterval(previewElapsedRef.current);
                          let currentIdx = 0;
                          const slots = tpl.slots;
                          const scheduleNext = () => {
                            const slot = slots[currentIdx];
                            const delay = Math.max(slot.duration, 0.8) * 1000;
                            previewIntervalRef.current = setTimeout(() => {
                              currentIdx = (currentIdx + 1) % slots.length;
                              setPreviewSlotIdx(currentIdx);
                              scheduleNext();
                            }, delay);
                          };
                          scheduleNext();
                          previewElapsedRef.current = setInterval(() => {
                            setPreviewElapsed(p => p + 1);
                          }, 1000);
                        }}
                        style={{
                          position: 'absolute', bottom: 10, right: 10,
                          padding: '5px 12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
                          fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
                          zIndex: 2,
                        }}>
                        ▶ 미리보기
                      </button>
                    </div>
                    {/* 타임라인 스트립 — 슬롯별 비율 */}
                    <div style={{ display: 'flex', height: 6, gap: 1, background: '#000' }}>
                      {tpl.slots.map((slot, si) => {
                        const pct = (slot.duration / tpl.totalDuration) * 100;
                        const colors = ['#8b5cf6','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#a855f7','#84cc16','#f97316','#e879f9','#22d3ee'];
                        return (
                          <div key={si} style={{ flex: pct, background: colors[si % colors.length], opacity: 0.75, borderRadius: si === 0 ? '0 0 0 4px' : si === tpl.slots.length - 1 ? '0 0 4px 0' : 0 }} title={`${slot.label} · ${slot.duration}s · ${slot.transition}`} />
                        );
                      })}
                    </div>
                    {/* 텍스트 정보 */}
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{tpl.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>{tpl.desc}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, color: '#c4b5fd' }}>📸 {tpl.slotCount}장</span>
                          <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.5)' }}>⏱ {tpl.totalDuration}초</span>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedEditTemplate(tpl);
                            setTemplateSlotFiles(Array(tpl.slotCount).fill(null));
                            setTemplateSlotUrls(Array(tpl.slotCount).fill(null));
                          }}
                          style={{ padding: '5px 14px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                          선택 →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 미리보기 오버레이 ── */}
              {previewTemplate && (() => {

                const tpl = previewTemplate;
                const slot = tpl.slots[previewSlotIdx];
                const SCENE_HUES = [210, 160, 280, 30, 340, 60, 190, 120, 20, 300, 80, 240];
                const sceneHue = SCENE_HUES[previewSlotIdx % SCENE_HUES.length];
                const TRANSITION_ICONS: Record<string, string> = { cut: '✂️', flash: '⚡', fade: '🌫️', 'zoom-in': '🔍', 'slide-left': '←' };
                const isCinematic = tpl.id === 'cinematic-montage';
                const ar = tpl.aspectRatio === '9:16' ? { w: 200, h: 356 } : tpl.aspectRatio === '1:1' ? { w: 280, h: 280 } : { w: 480, h: 270 };
                return (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => { setPreviewTemplate(null); setPreviewPlaying(false); if (previewIntervalRef.current) { clearTimeout(previewIntervalRef.current); previewIntervalRef.current = null; } if (previewElapsedRef.current) { clearInterval(previewElapsedRef.current); previewElapsedRef.current = null; } }}>
                    <style>{`
                      @keyframes tplFadeIn { from { opacity:0 } to { opacity:1 } }
                      @keyframes tplFlash { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
                      @keyframes tplSlideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
                      @keyframes tplZoomIn { from { transform:scale(1.22) } to { transform:scale(1) } }
                    `}</style>
                    <div onClick={e => e.stopPropagation()} style={{ width: 960, maxWidth: '96vw', maxHeight: '92vh', borderRadius: 20, overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a' }}>

                      {/* 헤더 */}
                      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{tpl.emoji} {tpl.name} — 실시간 미리보기</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{tpl.longDesc} · {tpl.aspectRatio} · {tpl.totalDuration}초</div>
                        </div>
                        <button onClick={() => { setPreviewTemplate(null); setPreviewPlaying(false); if (previewIntervalRef.current) { clearTimeout(previewIntervalRef.current); previewIntervalRef.current = null; } if (previewElapsedRef.current) { clearInterval(previewElapsedRef.current); previewElapsedRef.current = null; } }}
                          style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>닫기 ✕</button>
                      </div>

                      <div style={{ padding: '24px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

                        {/* ── 왼쪽: 실제 작동 애니메이션 플레이어 ── */}
                        <div style={{ flexShrink: 0 }}>
                          {/* 플레이어 제목 */}
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6, textAlign: 'center' }}>
                            {previewPlaying ? '▶ 재생 중 — 실제 컷 속도로 전환됩니다' : '⏸ 일시정지'}
                          </div>
                          {/* ── 실제 작동 비디오 플레이어 ── */}
                          <div style={{ width: ar.w, height: ar.h, borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', background: '#000' }}>
                            {/* 씬 이미지 — key 변경 시 마운트 애니메이션 재트리거 */}
                            <img
                              key={`scene-${previewSlotIdx}`}
                              src={tpl.exampleImage}
                              alt=""
                              style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%',
                                objectFit: 'cover',
                                objectPosition: `${20 + (previewSlotIdx * 17) % 60}% ${10 + (previewSlotIdx * 23) % 80}%`,
                                filter: `brightness(${tpl.filter.brightness}%) contrast(${tpl.filter.contrast}%) saturate(${tpl.filter.saturation + previewSlotIdx * 3}%) hue-rotate(${tpl.filter.hue + previewSlotIdx * 12}deg) sepia(${tpl.filter.sepia}%)`,
                                animation: slot?.transition === 'fade' ? 'tplFadeIn 0.5s ease forwards'
                                  : slot?.transition === 'zoom-in' ? 'tplZoomIn 0.4s ease forwards'
                                  : slot?.transition === 'slide-left' ? 'tplSlideIn 0.35s ease forwards'
                                  : 'none',
                                transformOrigin: 'center center',
                              }}
                            />
                            {/* flash 오버레이 */}
                            {slot?.transition === 'flash' && (
                              <div key={`flash-${previewSlotIdx}`} style={{ position: 'absolute', inset: 0, background: '#fff', animation: 'tplFlash 0.35s ease forwards', zIndex: 10, pointerEvents: 'none' }} />
                            )}
                            {/* 비네트 */}
                            {tpl.filter.vignette > 0 && <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${tpl.filter.vignette * 3}px rgba(0,0,0,0.9)`, zIndex: 3 }} />}
                            {/* 레터박스 */}
                            {isCinematic && <><div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '11%', background: '#000', zIndex: 4 }} /><div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '11%', background: '#000', zIndex: 4 }} /></>}
                            {/* 자막 */}
                            <div key={`sub-${previewSlotIdx}`} style={{ position: 'absolute', ...(tpl.subtitleStyle.position === 'top' ? { top: isCinematic ? '15%' : 12 } : tpl.subtitleStyle.position === 'middle' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: isCinematic ? '18%' : 12 }), left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 5, padding: '0 8px', animation: 'tplFadeIn 0.3s ease' }}>
                              <span style={{ fontFamily: tpl.subtitleStyle.font, fontSize: Math.min(tpl.subtitleStyle.size * 0.55, tpl.aspectRatio === '9:16' ? 13 : 16), fontWeight: 700, color: tpl.subtitleStyle.color, background: tpl.subtitleStyle.bg ? 'rgba(0,0,0,0.8)' : 'transparent', padding: tpl.subtitleStyle.bg ? '3px 10px' : '0', borderRadius: 4, textShadow: !tpl.subtitleStyle.bg ? '0 1px 6px rgba(0,0,0,0.95)' : 'none', maxWidth: '90%', textAlign: 'center' }}>{slot?.label}</span>
                            </div>
                            {/* 씬 번호 */}
                            <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', zIndex: 6 }}>씬 {previewSlotIdx + 1}/{tpl.slotCount}</div>
                            <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, fontSize: 10, color: '#fff', zIndex: 6 }}>{TRANSITION_ICONS[slot?.transition ?? 'cut']} {slot?.transition}</div>
                          </div>

                          {/* 컨트롤 바 */}
                          <div style={{ width: ar.w, marginTop: 10 }}>
                            {/* 진행 바 */}
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                              <div style={{ height: '100%', background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', width: `${((previewSlotIdx + 1) / tpl.slotCount) * 100}%`, transition: 'width 0.3s', borderRadius: 2 }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tpl.slots.slice(0, previewSlotIdx).reduce((a, s) => a + s.duration, 0).toFixed(1)}s / {tpl.totalDuration}s</span>
                              <button onClick={() => {
                                if (previewPlaying) {
                                  setPreviewPlaying(false);
                                  if (previewIntervalRef.current) { clearTimeout(previewIntervalRef.current); previewIntervalRef.current = null; }
                                  if (previewElapsedRef.current) { clearInterval(previewElapsedRef.current); previewElapsedRef.current = null; }
                                } else {
                                  setPreviewPlaying(true);
                                  let ci = previewSlotIdx;
                                  const scheduleNext = () => {
                                    const s = tpl.slots[ci];
                                    previewIntervalRef.current = setTimeout(() => {
                                      ci = (ci + 1) % tpl.slotCount;
                                      setPreviewSlotIdx(ci);
                                      scheduleNext();
                                    }, Math.max(s.duration, 0.8) * 1000);
                                  };
                                  scheduleNext();
                                  previewElapsedRef.current = setInterval(() => setPreviewElapsed(p => p + 1), 1000);
                                }
                              }} style={{ padding: '5px 16px', background: previewPlaying ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                {previewPlaying ? '⏸ 일시정지' : '▶ 재생'}
                              </button>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tpl.slotCount}씬</span>
                            </div>
                          </div>
                        </div>

                        {/* ── 오른쪽: 스토리보드 + 정보 ── */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* 스토리보드 필름스트립 */}
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>📽️ 스토리보드 — 클릭해서 씬 이동</div>
                          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
                            {tpl.slots.map((s, si) => {
                              const h = SCENE_HUES[si % SCENE_HUES.length];
                              const isActive = si === previewSlotIdx;
                              return (
                                <div key={si} onClick={() => setPreviewSlotIdx(si)} style={{ flexShrink: 0, width: 56, cursor: 'pointer' }}>
                                  <div style={{
                                    width: 56, height: 38, borderRadius: 6, overflow: 'hidden', position: 'relative',
                                    background: `hsl(${h}, 55%, 28%)`,
                                    filter: `brightness(${tpl.filter.brightness}%) contrast(${tpl.filter.contrast}%) saturate(${tpl.filter.saturation}%)`,
                                    border: `2px solid ${isActive ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                                    transition: 'border-color 0.15s',
                                  }}>
                                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, hsl(${h + 30}, 70%, 40%) 0%, transparent 70%)`, opacity: 0.5 }} />
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{si + 1}</div>
                                    {tpl.filter.vignette > 0 && <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${tpl.filter.vignette}px rgba(0,0,0,0.8)` }} />}
                                  </div>
                                  {/* 씬 아래 전환 화살표 */}
                                  {si < tpl.slotCount - 1 && (
                                    <div style={{ fontSize: 9, textAlign: 'center', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                                      {TRANSITION_ICONS[s.transition] || '✂️'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 현재 씬 상세 */}
                          <div style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, marginBottom: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>씬 {previewSlotIdx + 1} — {slot?.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>💡 {slot?.hint}</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', borderRadius: 5, color: 'rgba(255,255,255,0.4)' }}>⏱ {slot?.duration}초</span>
                              <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', borderRadius: 5, color: 'rgba(255,255,255,0.4)' }}>{TRANSITION_ICONS[slot?.transition ?? 'cut']} {slot?.transition} 전환</span>
                              {slot?.zoom && <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', borderRadius: 5, color: 'rgba(255,255,255,0.4)' }}>🔍 ×{slot.zoom} 줌</span>}
                            </div>
                          </div>

                          {/* 색보정 요약 */}
                          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>🎨 색보정 / 필터</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {[
                                { l: '밝기', v: tpl.filter.brightness, b: 100 },
                                { l: '대비', v: tpl.filter.contrast, b: 100 },
                                { l: '채도', v: tpl.filter.saturation, b: 100 },
                                { l: '세피아', v: tpl.filter.sepia, b: 0 },
                                { l: '비네트', v: tpl.filter.vignette, b: 0 },
                              ].map(f => (
                                <span key={f.l} style={{ fontSize: 10, padding: '3px 8px', background: f.v !== f.b ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${f.v !== f.b ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, color: f.v !== f.b ? '#c4b5fd' : 'rgba(255,255,255,0.3)' }}>
                                  {f.l} {f.v}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 자막 스타일 요약 */}
                          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>💬 자막 스타일</div>
                            <div style={{ display: 'inline-block', padding: '5px 12px', background: tpl.subtitleStyle.bg ? 'rgba(0,0,0,0.7)' : 'transparent', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontFamily: tpl.subtitleStyle.font, fontSize: 14, color: tpl.subtitleStyle.color, fontWeight: 700, textShadow: !tpl.subtitleStyle.bg ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}>
                                자막 예시 텍스트
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>위치: {tpl.subtitleStyle.position} · {tpl.subtitleStyle.size}px</div>
                          </div>

                          {/* 시작 버튼 */}
                          <button onClick={() => {
                            setPreviewTemplate(null);
                            setPreviewPlaying(false);
                            if (previewIntervalRef.current) { clearTimeout(previewIntervalRef.current); previewIntervalRef.current = null; }
                            if (previewElapsedRef.current) { clearInterval(previewElapsedRef.current); previewElapsedRef.current = null; }
                            setSelectedEditTemplate(tpl);
                            setTemplateSlotFiles(Array(tpl.slotCount).fill(null));
                            setTemplateSlotUrls(Array(tpl.slotCount).fill(null));
                          }} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 24px rgba(139,92,246,0.35)' }}>
                            ✨ 이 템플릿으로 시작하기 →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            /* ── Step 2: 슬롯 채우기 ── */
            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
              {/* 진행률 표시 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                    {templateSlotFiles.filter(Boolean).length} / {selectedEditTemplate.slotCount} 장 업로드됨
                  </span>
                  <span style={{ fontSize: 13, color: templateSlotFiles.filter(Boolean).length === selectedEditTemplate.slotCount ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                    {templateSlotFiles.filter(Boolean).length === selectedEditTemplate.slotCount ? '✅ 모두 완료' : '사진·영상을 각 슬롯에 업로드하세요'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                  <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', width: `${(templateSlotFiles.filter(Boolean).length / selectedEditTemplate.slotCount) * 100}%`, transition: 'width 0.3s' }} />
                </div>
              </div>

              {/* 슬롯 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {selectedEditTemplate.slots.map((slot, i) => {
                  const hasFile = !!templateSlotFiles[i];
                  const previewUrl = templateSlotUrls[i];
                  const isImage = hasFile && templateSlotFiles[i]!.type.startsWith('image/');
                  return (
                    <label key={i} style={{
                      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                      border: `2px dashed ${hasFile ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.15)'}`,
                      background: hasFile ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    }}>
                      <input type="file" accept="video/*,image/*" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setTemplateSlotFiles(prev => { const n = [...prev]; n[i] = file; return n; });
                        setTemplateSlotUrls(prev => { const n = [...prev]; n[i] = url; return n; });
                      }} />
                      {hasFile && previewUrl ? (
                        <>
                          {isImage ? (
                            <img src={previewUrl} alt={slot.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <video src={previewUrl} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          {/* 오버레이 정보 */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px 10px' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{i + 1}. {slot.label}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{slot.duration}s · {slot.transition}</div>
                          </div>
                          {/* 교체 버튼 */}
                          <div style={{ position: 'absolute', top: 6, right: 6, padding: '3px 8px', background: 'rgba(0,0,0,0.65)', borderRadius: 6, fontSize: 10, color: '#fff' }}>교체</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2, textAlign: 'center', padding: '0 8px' }}>{i + 1}. {slot.label}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '0 8px' }}>{slot.hint}</div>
                          <div style={{ marginTop: 8, fontSize: 10, padding: '4px 10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, color: '#c4b5fd' }}>{slot.duration}s</div>
                        </>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* 편집 적용 버튼 */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => applyEditTemplate(selectedEditTemplate!, templateSlotFiles, templateSlotUrls)}
                  disabled={templateSlotFiles.filter(Boolean).length === 0}
                  style={{
                    padding: '14px 40px', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: templateSlotFiles.filter(Boolean).length === 0 ? 'not-allowed' : 'pointer',
                    background: templateSlotFiles.filter(Boolean).length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                    border: 'none', color: templateSlotFiles.filter(Boolean).length === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                    boxShadow: templateSlotFiles.filter(Boolean).length > 0 ? '0 4px 24px rgba(139,92,246,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                  ✨ 템플릿 적용하기 ({templateSlotFiles.filter(Boolean).length}/{selectedEditTemplate!.slotCount})
                </button>
                <button
                  onClick={() => {
                    // 일부만 채워도 적용 가능
                    if (templateSlotFiles.some(Boolean)) applyEditTemplate(selectedEditTemplate!, templateSlotFiles, templateSlotUrls);
                  }}
                  disabled={!templateSlotFiles.some(Boolean)}
                  style={{ padding: '14px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: !templateSlotFiles.some(Boolean) ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}>
                  일부만 채워서 시작
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="page-content" style={{ display: 'flex', gap: 24, paddingBottom: 32, alignItems: 'flex-start' }}>
        {/* Left Panel */}
        <div style={{ width: '42%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 편집 템플릿 진입 배너 ── */}
          <div
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 100%)',
              border: '1px solid rgba(139,92,246,0.35)',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.35)'; }}
          >
            <div style={{ fontSize: 36 }}>🎨</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 3 }}>편집 템플릿으로 시작하기</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>K-pop · 여행 · 패션 · 영화 등 8가지 프리셋 · 사진만 끼우면 완성</div>
            </div>
            <div style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
              템플릿 보기 →
            </div>
          </div>

          {/* BGM 업로드 */}
          <div className="card" style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'linear-gradient(145deg,rgba(30,20,50,0.8),rgba(15,10,30,0.9))' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', borderRadius: 8, display: 'flex' }}>
                <Music size={14} color="#fff" />
              </div>
              STEP 1 — BGM 업로드
            </h2>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '28px 20px', borderRadius: 12, cursor: 'pointer',
              border: '2px dashed rgba(139,92,246,0.35)',
              background: bgmFile ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s'
            }}>
              <input type="file" accept="audio/*" onChange={handleBgmUpload} style={{ display: 'none' }} />
              <Upload size={24} color={bgmFile ? '#a78bfa' : 'rgba(255,255,255,0.3)'} />
              {bgmFile ? (
                <>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{bgmFile.name}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatTime(bgmDuration)} / 클릭하여 변경</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>MP3, WAV, AAC 업로드</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>클릭하거나 파일을 드래그하세요</span>
                </>
              )}
            </label>

            {bgmFile && (
              <button
                onClick={detectBeats}
                disabled={detecting}
                style={{
                  marginTop: 14, width: '100%', padding: '14px 0',
                  background: detecting ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: detecting ? 'not-allowed' : 'pointer',
                  boxShadow: detecting ? 'none' : '0 6px 20px rgba(139,92,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                }}
              >
                <Zap size={16} />
                {detecting ? '비트 감지 중...' : `🥁 비트 자동 감지 시작`}
              </button>
            )}

            {beats.length > 0 && (
              <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(139,92,246,0.1)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.25)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>
                  🎯 {beats.length}개의 비트 감지 완료!
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  평균 BPM: ~{Math.round(60 / (bgmDuration / beats.length))} · 자동 컷 포인트 설정됨
                </div>
              </div>
            )}
          </div>

          {/* 클립/이미지 업로드 */}
          <div className="card" style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'linear-gradient(145deg,rgba(20,30,50,0.8),rgba(10,15,30,0.9))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <div style={{ padding: 6, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius: 8, display: 'flex' }}>
                  <Video size={14} color="#fff" />
                </div>
                STEP 2 — 영상 / 이미지 업로드
              </h2>
              {clips.length > 0 && (
                <label style={{ padding: '6px 12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#93c5fd', cursor: 'pointer' }}>
                  + 추가
                  <input type="file" accept="video/*,image/*" multiple onChange={handleClipsUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {clips.length === 0 ? (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 20px', borderRadius: 12, cursor: 'pointer', border: '2px dashed rgba(59,130,246,0.35)', background: 'rgba(255,255,255,0.02)' }}>
                <input type="file" accept="video/*,image/*" multiple onChange={handleClipsUpload} style={{ display: 'none' }} />
                <Upload size={24} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>MP4, MOV, JPG, PNG 업로드</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>영상과 사진 모두 비트에 맞춰 컷 됩니다</span>
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {clips.map((clip, i) => {
                  const isActive = activeClipIdx === i && isPlaying;
                  const isSelected = selectedClipId === clip.id;
                  const COLORS = ['#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444'];
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={clip.id}>
                      <div
                        onClick={() => {
                          setSelectedClipId(isSelected ? null : clip.id);
                          // 비트싱크 재생 중이 아닐 때 클릭한 클립을 즉시 프리뷰
                          if (!isPlaying) setActiveClipIdx(i);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isSelected ? `${color}18` : isActive ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${isSelected ? color+'55' : isActive ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: color+'33', border: `1px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{i + 1}</div>
                          {/* 이미지/비디오 타입 배지 */}
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{clip.type === 'image' ? '🖼️' : '🎬'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clip.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                              {clip.type === 'image' ? `📷 이미지 · 표시 ${clip.duration.toFixed(1)}s` : (clip.duration > 0 ? `${clip.duration.toFixed(1)}s` : '로딩중')}
                              {clip.trimStart > 0 && ` · 시작: ${clip.trimStart.toFixed(1)}s`}
                              {clip.trimEnd > 0 && ` · 끝: ${(clip.duration - clip.trimEnd).toFixed(1)}s`}
                              {clip.volume !== 1 && ` · 볼륨: ${Math.round(clip.volume * 100)}%`}
                              {clip.assignedBeat !== null && beats[clip.assignedBeat] ? ` · 컷@${formatTime(beats[clip.assignedBeat].time)}` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button onClick={e => { e.stopPropagation(); moveClip(clip.id, -1); }} style={{ padding: '3px 6px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>↑</button>
                            <button onClick={e => { e.stopPropagation(); moveClip(clip.id, 1); }} style={{ padding: '3px 6px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>↓</button>
                            <button onClick={e => { e.stopPropagation(); removeClip(clip.id); }} style={{ padding: '3px 6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5, color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          </div>
                        </div>

                      {/* 선택된 클립 편집 패널 */}
                      {isSelected && (
                        <div style={{ margin: '4px 0 4px 10px', padding: '14px 16px', background: `${color}0d`, border: `1px solid ${color}30`, borderRadius: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 12, letterSpacing: '0.05em' }}>✂️ 컷 편집</div>

                          {/* ── 시각적 컷 타임라인 ── */}
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                              <span>In: {clip.trimStart.toFixed(2)}s</span>
                              <span>구간: {(clip.duration - clip.trimStart - clip.trimEnd).toFixed(2)}s</span>
                              <span>Out: {(clip.duration - clip.trimEnd).toFixed(2)}s</span>
                            </div>
                            {/* 타임라인 바 */}
                            <div
                              style={{ position: 'relative', height: 40, background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', cursor: 'crosshair', userSelect: 'none' }}
                              onPointerMove={e => {
                                if (e.buttons !== 1) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                                const t = pct * clip.duration;
                                if (t < clip.duration / 2) {
                                  updateClip(clip.id, { trimStart: Math.min(t, clip.duration - clip.trimEnd - 0.5) });
                                } else {
                                  updateClip(clip.id, { trimEnd: Math.min(clip.duration - t, clip.duration - clip.trimStart - 0.5) });
                                }
                              }}
                            >
                              {/* 전체 배경 */}
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.05)' }} />
                              {/* 잘린 왼쪽 (트림) */}
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(clip.trimStart / clip.duration) * 100}%`, background: 'rgba(239,68,68,0.35)', borderRight: '2px solid #ef4444' }} />
                              {/* 사용 구간 (초록) */}
                              <div style={{
                                position: 'absolute', top: 4, bottom: 4,
                                left: `${(clip.trimStart / clip.duration) * 100}%`,
                                right: `${(clip.trimEnd / clip.duration) * 100}%`,
                                background: `${color}55`, borderRadius: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, opacity: 0.8 }}>사용 구간</span>
                              </div>
                              {/* 잘린 오른쪽 */}
                              <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(clip.trimEnd / clip.duration) * 100}%`, background: 'rgba(239,68,68,0.35)', borderLeft: '2px solid #ef4444' }} />
                              {/* In 핸들 */}
                              <div
                                style={{ position: 'absolute', top: 0, bottom: 0, left: `${(clip.trimStart / clip.duration) * 100}%`, width: 12, background: '#ef4444', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)', zIndex: 2 }}
                                onPointerDown={e => {
                                  e.stopPropagation();
                                  e.currentTarget.setPointerCapture(e.pointerId);
                                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                                  const onMove = (ev: PointerEvent) => {
                                    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                    const t = pct * clip.duration;
                                    updateClip(clip.id, { trimStart: Math.min(t, clip.duration - clip.trimEnd - 0.5) });
                                  };
                                  e.currentTarget.addEventListener('pointermove', onMove as any);
                                  e.currentTarget.addEventListener('pointerup', () => e.currentTarget.removeEventListener('pointermove', onMove as any), { once: true });
                                }}
                              ><span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>◀</span></div>
                              {/* Out 핸들 */}
                              <div
                                style={{ position: 'absolute', top: 0, bottom: 0, right: `${(clip.trimEnd / clip.duration) * 100}%`, width: 12, background: '#ef4444', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(50%)', zIndex: 2 }}
                                onPointerDown={e => {
                                  e.stopPropagation();
                                  e.currentTarget.setPointerCapture(e.pointerId);
                                  const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                                  const onMove = (ev: PointerEvent) => {
                                    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                                    const t = clip.duration - pct * clip.duration;
                                    updateClip(clip.id, { trimEnd: Math.min(t, clip.duration - clip.trimStart - 0.5) });
                                  };
                                  e.currentTarget.addEventListener('pointermove', onMove as any);
                                  e.currentTarget.addEventListener('pointerup', () => e.currentTarget.removeEventListener('pointermove', onMove as any), { once: true });
                                }}
                              ><span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>▶</span></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>0s</span>
                              <button onClick={() => updateClip(clip.id, { trimStart: 0, trimEnd: 0 })}
                                style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                                컷 초기화
                              </button>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{clip.duration.toFixed(1)}s</span>
                            </div>
                          </div>

                          {/* 볼륨 + 이름 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
                            <div>
                              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 4 }}>볼륨 {Math.round(clip.volume * 100)}%</label>
                              <input type="range" min={0} max={1} step={0.05} value={clip.volume}
                                onChange={e => updateClip(clip.id, { volume: +e.target.value })}
                                style={{ width: '100%', accentColor: color }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 4 }}>클립 이름</label>
                              <input value={clip.name} onChange={e => updateClip(clip.id, { name: e.target.value })}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}40`, borderRadius: 7, padding: '5px 8px', color: '#fff', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 🎨 유명 템플릿 패널 ── */}
          <div className="card" style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'linear-gradient(145deg,rgba(30,25,10,0.9),rgba(15,12,5,0.95))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showTemplates ? 16 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎨</span>
                유명 템플릿
                {activeTemplateId && (
                  <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 10, color: '#fde68a' }}>
                    {BEAT_TEMPLATES.find(t => t.id === activeTemplateId)?.label}
                  </span>
                )}
              </div>
              <button onClick={() => setShowTemplates(v => !v)}
                style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 7, color: '#fde68a', cursor: 'pointer' }}>
                {showTemplates ? '접기 ▲' : '펼치기 ▼'}
              </button>
            </div>
            {showTemplates && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {BEAT_TEMPLATES.map(tpl => {
                  const isActive = activeTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setActiveTemplateId(tpl.id);
                        // 색보정 일괄 적용
                        setFilterBrightness(tpl.brightness);
                        setFilterContrast(tpl.contrast);
                        setFilterSaturation(tpl.saturation);
                        setFilterHue(tpl.hue);
                        setFilterSepia(tpl.sepia);
                        setFilterVignette(tpl.vignette);
                        setFilterBlur(tpl.blur);
                        // 자막 스타일 적용 (실제 state 이름에 맞게)
                        setSubtitleFontFamily(tpl.subtitleFont);
                        setSubtitleFontSize(tpl.subtitleSize);
                        setSubtitleColor(tpl.subtitleColor);
                        setSubtitleBg(tpl.subtitleBg);
                        // 'center' → 'middle' 매핑
                        setSubtitlePosition(tpl.subtitlePos === 'center' ? 'middle' : tpl.subtitlePos as 'top' | 'bottom' | 'middle');
                      }}
                      style={{
                        textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: isActive ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        transition: 'all 0.18s',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{tpl.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#fde68a' : '#fff', marginBottom: 2 }}>{tpl.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{tpl.desc}</div>
                    </button>
                  );
                })}
                {/* 원본 초기화 */}
                <button
                  onClick={() => {
                    setActiveTemplateId(null);
                    setFilterBrightness(100); setFilterContrast(100); setFilterSaturation(100);
                    setFilterHue(0); setFilterSepia(0); setFilterVignette(0); setFilterBlur(0);
                  }}
                  style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '8px', borderRadius: 8, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                  🔄 원본으로 초기화
                </button>
              </div>
            )}
          </div>

          {/* BGM 볼륨 + 비트 감도 + 구간 설정 */}
          <div className="card" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>⚙️ 오디오 설정</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* ── BGM 볼륨 ── */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>🎵 BGM 볼륨</span><span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(bgmVolume * 100)}%</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={bgmVolume} onChange={e => setBgmVolume(+e.target.value)} style={{ width: '100%', accentColor: '#8b5cf6' }} />
              </div>

              {/* ── BGM 구간 설정 (시작~종료) ── */}
              {bgmDuration > 0 && (
                <div style={{ padding: '14px 16px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✂️ BGM 사용 구간</span>
                    <button
                      onClick={() => { setBgmStartTime(0); setBgmEndTime(bgmDuration); }}
                      style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                    >전체 초기화</button>
                  </div>

                  {/* 시간 표시 행 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                    <span>In: <b style={{ color: '#c4b5fd' }}>{formatTime(bgmStartTime)}</b></span>
                    <span>구간: <b style={{ color: '#fff' }}>{formatTime((bgmEndTime || bgmDuration) - bgmStartTime)}</b></span>
                    <span>Out: <b style={{ color: '#c4b5fd' }}>{formatTime(bgmEndTime || bgmDuration)}</b></span>
                  </div>

                  {/* 시각적 타임라인 바 */}
                  <div
                    style={{ position: 'relative', height: 44, background: 'rgba(0,0,0,0.5)', borderRadius: 8, overflow: 'hidden', userSelect: 'none', cursor: 'crosshair' }}
                    onPointerMove={e => {
                      if (e.buttons !== 1) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      const t = pct * bgmDuration;
                      const mid = ((bgmStartTime + (bgmEndTime || bgmDuration)) / 2);
                      if (t < mid) setBgmStartTime(Math.min(t, (bgmEndTime || bgmDuration) - 1));
                      else setBgmEndTime(Math.max(t, bgmStartTime + 1));
                    }}
                  >
                    {/* 전체 배경 */}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)' }} />
                    {/* 잘린 왼쪽 */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(bgmStartTime / bgmDuration) * 100}%`, background: 'rgba(239,68,68,0.3)', borderRight: '2px solid #ef4444' }} />
                    {/* 사용 구간 */}
                    <div style={{
                      position: 'absolute', top: 5, bottom: 5,
                      left: `${(bgmStartTime / bgmDuration) * 100}%`,
                      right: `${((bgmDuration - (bgmEndTime || bgmDuration)) / bgmDuration) * 100}%`,
                      background: 'rgba(139,92,246,0.45)', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, opacity: 0.85 }}>사용 구간</span>
                    </div>
                    {/* 잘린 오른쪽 */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${((bgmDuration - (bgmEndTime || bgmDuration)) / bgmDuration) * 100}%`, background: 'rgba(239,68,68,0.3)', borderLeft: '2px solid #ef4444' }} />
                    {/* In 핸들 */}
                    <div
                      style={{ position: 'absolute', top: 0, bottom: 0, left: `${(bgmStartTime / bgmDuration) * 100}%`, width: 14, background: '#8b5cf6', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(-50%)', zIndex: 3 }}
                      onPointerDown={e => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                        const onMove = (ev: PointerEvent) => {
                          const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                          setBgmStartTime(Math.min(pct * bgmDuration, (bgmEndTime || bgmDuration) - 1));
                        };
                        e.currentTarget.addEventListener('pointermove', onMove as any);
                        e.currentTarget.addEventListener('pointerup', () => e.currentTarget.removeEventListener('pointermove', onMove as any), { once: true });
                      }}
                    ><span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>◀</span></div>
                    {/* Out 핸들 */}
                    <div
                      style={{ position: 'absolute', top: 0, bottom: 0, right: `${((bgmDuration - (bgmEndTime || bgmDuration)) / bgmDuration) * 100}%`, width: 14, background: '#8b5cf6', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateX(50%)', zIndex: 3 }}
                      onPointerDown={e => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                        const onMove = (ev: PointerEvent) => {
                          const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                          setBgmEndTime(Math.max(pct * bgmDuration, bgmStartTime + 1));
                        };
                        e.currentTarget.addEventListener('pointermove', onMove as any);
                        e.currentTarget.addEventListener('pointerup', () => e.currentTarget.removeEventListener('pointermove', onMove as any), { once: true });
                      }}
                    ><span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>▶</span></div>
                  </div>

                  {/* 시간 직접 입력 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>시작 (초)</label>
                      <input
                        type="number" min={0} max={bgmDuration - 1} step={0.1}
                        value={bgmStartTime.toFixed(1)}
                        onChange={e => setBgmStartTime(Math.min(+e.target.value, (bgmEndTime || bgmDuration) - 1))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 7, padding: '6px 10px', color: '#c4b5fd', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>종료 (초)</label>
                      <input
                        type="number" min={1} max={bgmDuration} step={0.1}
                        value={(bgmEndTime || bgmDuration).toFixed(1)}
                        onChange={e => setBgmEndTime(Math.max(+e.target.value, bgmStartTime + 1))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 7, padding: '6px 10px', color: '#c4b5fd', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  {/* 구간 확정 후 비트 재감지 안내 */}
                  {bgmFile && (
                    <button onClick={detectBeats} disabled={detecting}
                      style={{ marginTop: 10, width: '100%', padding: '8px 0', background: detecting ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 8, color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: detecting ? 'not-allowed' : 'pointer' }}>
                      {detecting ? '비트 감지 중...' : '🎯 이 구간으로 비트 재감지'}
                    </button>
                  )}
                </div>
              )}

              {/* ── 비트 감도 ── */}
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>🥁 비트 감도 (낮을수록 더 많은 비트)</span><span style={{ color: '#fff', fontWeight: 600 }}>{sensitivity.toFixed(1)}</span>
                </label>
                <input type="range" min={1.0} max={3.0} step={0.1} value={sensitivity} onChange={e => setSensitivity(+e.target.value)} style={{ width: '100%', accentColor: '#ec4899' }} />
                {bgmFile && (
                  <button onClick={detectBeats} disabled={detecting} style={{ marginTop: 8, width: '100%', padding: '8px 0', background: detecting ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 8, color: '#f9a8d4', fontSize: 12, fontWeight: 700, cursor: detecting ? 'not-allowed' : 'pointer' }}>
                    {detecting ? '감지 중...' : '🔄 감도 바꿔서 재감지'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 자막 설정 카드 */}
          <div className="card" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'linear-gradient(145deg,rgba(10,30,20,0.85),rgba(5,15,10,0.9))' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ padding: 6, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 8, display: 'flex' }}>
                <span style={{ fontSize: 13 }}>CC</span>
              </div>
              STEP 3 — AI 자막 자동 생성
              {subtitleFallback && <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, color: '#fcd34d', marginLeft: 4 }}>샘플</span>}
            </div>

            {/* 언어 선택 */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>🌐 인식 언어</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUBTITLE_LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => setSubtitleLang(lang.code)}
                    style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: subtitleLang === lang.code ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: subtitleLang === lang.code ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: subtitleLang === lang.code ? '#6ee7b7' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 클립 선택 */}
            {clips.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>🎬 자막 추출할 클립</label>
                <select value={subtitleTargetClipId || clips[0]?.id || ''} onChange={e => setSubtitleTargetClipId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 13, outline: 'none' }}>
                  {clips.map((c, i) => <option key={c.id} value={c.id}>클립 {i + 1}: {c.name}</option>)}
                </select>
              </div>
            )}

            {/* ─── 폰트 상세 설정 ─── */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>🔤 폰트 설정</div>

              {/* 폰트 패밀리 */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>폰트 종류</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {FONT_FAMILIES.map(f => (
                    <button key={f.value} onClick={() => setSubtitleFontFamily(f.value)}
                      style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, fontFamily: f.value, border: subtitleFontFamily === f.value ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: subtitleFontFamily === f.value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: subtitleFontFamily === f.value ? '#6ee7b7' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 폰트 굵기 + 위치 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>굵기</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {FONT_WEIGHTS.map(w => (
                      <button key={w.value} onClick={() => setSubtitleFontWeight(w.value)}
                        style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: w.value as any, border: subtitleFontWeight === w.value ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: subtitleFontWeight === w.value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: subtitleFontWeight === w.value ? '#6ee7b7' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>위치</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['top','middle','bottom'] as const).map(p => (
                      <button key={p} onClick={() => setSubtitlePosition(p)}
                        style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 10, border: subtitlePosition === p ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: subtitlePosition === p ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: subtitlePosition === p ? '#6ee7b7' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                        {p === 'top' ? '상단' : p === 'middle' ? '중간' : '하단'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 색상 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>글자색</label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={subtitleColor} onChange={e => setSubtitleColor(e.target.value)}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 2, background: 'transparent' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{subtitleColor}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span>배경색</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input type="checkbox" checked={subtitleBg} onChange={e => setSubtitleBg(e.target.checked)} style={{ accentColor: '#10b981', width: 12, height: 12 }} />
                      <span style={{ fontSize: 10 }}>사용</span>
                    </label>
                  </label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="color" value={subtitleBgColor} onChange={e => setSubtitleBgColor(e.target.value)} disabled={!subtitleBg}
                      style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: subtitleBg ? 'pointer' : 'not-allowed', padding: 2, background: 'transparent', opacity: subtitleBg ? 1 : 0.3 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>불투명도 {subtitleBgOpacity}%</span>
                  </div>
                  {subtitleBg && <input type="range" min={0} max={100} step={5} value={subtitleBgOpacity} onChange={e => setSubtitleBgOpacity(+e.target.value)} style={{ width: '100%', accentColor: '#10b981', marginTop: 4 }} />}
                </div>
              </div>

              {/* 크기·자간·행간 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>크기 {subtitleFontSize}px</label>
                  <input type="range" min={12} max={60} step={1} value={subtitleFontSize} onChange={e => setSubtitleFontSize(+e.target.value)} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>자간 {subtitleLetterSpacing}px</label>
                  <input type="range" min={-2} max={10} step={0.5} value={subtitleLetterSpacing} onChange={e => setSubtitleLetterSpacing(+e.target.value)} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>행간 {subtitleLineHeight}</label>
                  <input type="range" min={1} max={2.5} step={0.1} value={subtitleLineHeight} onChange={e => setSubtitleLineHeight(+e.target.value)} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
              </div>

              {/* 아웃라인/그림자 프리셋 */}
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 5 }}>아웃라인 / 그림자</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {OUTLINE_PRESETS.map(p => (
                    <button key={p.value} onClick={() => setSubtitleOutline(p.value)}
                      style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, border: subtitleOutline === p.value ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)', background: subtitleOutline === p.value ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: subtitleOutline === p.value ? '#6ee7b7' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              <div style={{ marginTop: 12, padding: '12px 16px', background: '#111', borderRadius: 10, textAlign: 'center', minHeight: 52 }}>
                <span style={{ fontSize: subtitleFontSize * 0.7, fontFamily: subtitleFontFamily, fontWeight: subtitleFontWeight as any, color: subtitleColor, background: subtitleBg ? `${subtitleBgColor}${Math.round(subtitleBgOpacity / 100 * 255).toString(16).padStart(2,'0')}` : 'transparent', padding: subtitleBg ? '4px 12px' : '0', borderRadius: 6, lineHeight: subtitleLineHeight, letterSpacing: subtitleLetterSpacing ? `${subtitleLetterSpacing}px` : undefined, textShadow: subtitleOutline !== 'none' ? subtitleOutline : undefined }}>
                  자막 미리보기 テキスト Preview
                </span>
              </div>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={() => generateSubtitles()}
              disabled={generatingSubtitles || clips.length === 0}
              style={{ width: '100%', padding: '13px 0', background: generatingSubtitles ? 'rgba(16,185,129,0.15)' : clips.length === 0 ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 10, color: clips.length === 0 ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 14, fontWeight: 800, cursor: generatingSubtitles || clips.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: clips.length > 0 && !generatingSubtitles ? '0 4px 16px rgba(16,185,129,0.35)' : 'none', transition: 'all 0.2s' }}
            >
              {generatingSubtitles ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />AI 자막 생성 중...</>
              ) : (
                <>✨ {SUBTITLE_LANGUAGES.find(l => l.code === subtitleLang)?.label} 자막 자동 생성</>
              )}
            </button>

            {/* ✏️ 자막 편집기 */}
            {subtitles.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>✏️ 자막 {subtitles.length}개 — 클릭하여 수정</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        const last = subtitles[subtitles.length - 1];
                        setSubtitles(prev => [...prev, { start: last.end + 0.1, end: last.end + 2, text: '새 자막' }]);
                      }}
                      style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, color: '#6ee7b7', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      + 자막 추가
                    </button>
                    <button
                      onClick={() => { if (confirm('자막을 모두 삭제할까요?')) setSubtitles([]); }}
                      style={{ padding: '4px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
                      전체 삭제
                    </button>
                  </div>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {subtitles.map((s, i) => (
                    <div key={i} style={{ background: currentSubtitle === s ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${currentSubtitle === s ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 9, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {/* 시간 행 */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 700, minWidth: 16 }}>{i + 1}</span>
                        <input
                          type="number" min={0} step={0.1} value={s.start.toFixed(2)}
                          onChange={e => setSubtitles(prev => prev.map((x, j) => j === i ? { ...x, start: +e.target.value } : x))}
                          style={{ width: 64, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '3px 6px', color: '#6ee7b7', fontSize: 11, outline: 'none', fontFamily: 'monospace' }}
                        />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>→</span>
                        <input
                          type="number" min={0} step={0.1} value={s.end.toFixed(2)}
                          onChange={e => setSubtitles(prev => prev.map((x, j) => j === i ? { ...x, end: +e.target.value } : x))}
                          style={{ width: 64, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '3px 6px', color: '#6ee7b7', fontSize: 11, outline: 'none', fontFamily: 'monospace' }}
                        />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 2 }}>초</span>
                        <button
                          onClick={() => setSubtitles(prev => prev.filter((_, j) => j !== i))}
                          style={{ marginLeft: 'auto', padding: '2px 7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                      {/* 텍스트 행 */}
                      <textarea
                        value={s.text}
                        onChange={e => setSubtitles(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                        rows={2}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '6px 10px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.4, fontFamily: subtitleFontFamily, boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🎨 색보정 카드 */}
          <div className="card" style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'linear-gradient(145deg,rgba(30,20,5,0.9),rgba(15,10,0,0.95))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: 6, background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 8, display: 'flex' }}>
                  <span style={{ fontSize: 13 }}>🎨</span>
                </div>
                색보정 / Color Grading
              </div>
              <button
                onClick={() => { setFilterBrightness(100); setFilterContrast(100); setFilterSaturation(100); setFilterHue(0); setFilterSepia(0); setFilterBlur(0); setFilterVignette(0); }}
                style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: 'pointer' }}
              >
                초기화
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '☀️ 밝기',    value: filterBrightness, set: setFilterBrightness, min: 0,   max: 200, step: 1,   unit: '%',  default: 100, color: '#fbbf24' },
                { label: '◑ 대비',     value: filterContrast,   set: setFilterContrast,   min: 0,   max: 300, step: 1,   unit: '%',  default: 100, color: '#a78bfa' },
                { label: '🌈 채도',    value: filterSaturation, set: setFilterSaturation, min: 0,   max: 300, step: 1,   unit: '%',  default: 100, color: '#34d399' },
                { label: '🎡 색조 회전',value: filterHue,        set: setFilterHue,        min: 0,   max: 360, step: 1,   unit: '°',  default: 0,   color: '#60a5fa' },
                { label: '🟫 세피아',  value: filterSepia,      set: setFilterSepia,      min: 0,   max: 100, step: 1,   unit: '%',  default: 0,   color: '#c2855a' },
                { label: '🌫️ 블러',    value: filterBlur,       set: setFilterBlur,       min: 0,   max: 10,  step: 0.1, unit: 'px', default: 0,   color: '#9ca3af' },
                { label: '🔲 비네팅',  value: filterVignette,   set: setFilterVignette,   min: 0,   max: 100, step: 1,   unit: '%',  default: 0,   color: '#374151' },
              ].map(item => (
                <div key={item.label}>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span>{item.label}</span>
                    <span style={{ color: item.value !== item.default ? item.color : 'rgba(255,255,255,0.3)', fontWeight: 600, fontFamily: 'monospace' }}>
                      {item.value}{item.unit}
                      {item.value !== item.default && (
                        <button onClick={() => item.set(item.default)} style={{ marginLeft: 6, padding: '0 5px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4, color: 'rgba(255,255,255,0.35)', fontSize: 10, cursor: 'pointer' }}>↺</button>
                      )}
                    </span>
                  </label>
                  <input
                    type="range" min={item.min} max={item.max} step={item.step} value={item.value}
                    onChange={e => item.set(+e.target.value)}
                    style={{ width: '100%', accentColor: item.color }}
                  />
                </div>
              ))}
            </div>

            {/* 색보정 프리셋 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: '0.05em' }}>빠른 프리셋</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: '🌅 따뜻하게', fn: () => { setFilterBrightness(105); setFilterContrast(105); setFilterSaturation(120); setFilterHue(10); setFilterSepia(20); setFilterVignette(20); setFilterBlur(0); } },
                  { label: '❄️ 차갑게', fn: () => { setFilterBrightness(95); setFilterContrast(110); setFilterSaturation(80); setFilterHue(200); setFilterSepia(0); setFilterVignette(15); setFilterBlur(0); } },
                  { label: '🎞️ 필름', fn: () => { setFilterBrightness(90); setFilterContrast(120); setFilterSaturation(70); setFilterHue(0); setFilterSepia(30); setFilterVignette(40); setFilterBlur(0); } },
                  { label: '⬛ 흑백', fn: () => { setFilterSaturation(0); setFilterContrast(120); setFilterBrightness(100); setFilterHue(0); setFilterSepia(0); setFilterVignette(10); setFilterBlur(0); } },
                  { label: '🌃 시네마틱', fn: () => { setFilterBrightness(85); setFilterContrast(140); setFilterSaturation(90); setFilterHue(0); setFilterSepia(10); setFilterVignette(60); setFilterBlur(0); } },
                  { label: '✨ 드림', fn: () => { setFilterBrightness(115); setFilterContrast(90); setFilterSaturation(130); setFilterHue(320); setFilterSepia(0); setFilterVignette(0); setFilterBlur(0.5); } },
                ].map(p => (
                  <button key={p.label} onClick={p.fn}
                    style={{ padding: '5px 10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, fontSize: 11, color: '#fde68a', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20, alignSelf: 'flex-start' }}>

          {/* 비디오 프리뷰 — 16:9 고정 비율 */}
          <div style={{
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#000', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {clips.length > 0 ? (
              showBeforeAfter ? (
                /* ── Before / After 비교 모드 ── */
                <>
                  {/* AFTER (필터 적용) — 전체 배경 */}
                  <video
                    src={clips[activeClipIdx]?.url || clips[0]?.url}
                    loop playsInline autoPlay muted
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'contain', background: '#000',
                      filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) hue-rotate(${filterHue}deg) sepia(${filterSepia}%) blur(${filterBlur}px)`,
                    }}
                  />
                  {/* BEFORE (원본) — 왼쪽 클립 */}
                  <video
                    src={clips[activeClipIdx]?.url || clips[0]?.url}
                    loop playsInline autoPlay muted
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'contain', background: '#000',
                      clipPath: `inset(0 ${100 - beforeAfterPos}% 0 0)`,
                      filter: 'none',
                    }}
                  />
                  {/* 분할선 */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${beforeAfterPos}%`, width: 3,
                    background: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 0 12px rgba(0,0,0,0.8)',
                    transform: 'translateX(-50%)',
                    cursor: 'ew-resize',
                    zIndex: 10,
                  }} />
                  {/* 드래그 핸들 */}
                  <div
                    onPointerDown={e => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const container = e.currentTarget.parentElement!;
                      const onMove = (ev: PointerEvent) => {
                        const rect = container.getBoundingClientRect();
                        const pct = Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100));
                        setBeforeAfterPos(pct);
                      };
                      const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                    style={{
                      position: 'absolute', top: '50%', left: `${beforeAfterPos}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'ew-resize', zIndex: 11, fontSize: 16, userSelect: 'none',
                    }}
                  >⇔</div>
                  {/* 라벨 */}
                  <div style={{ position: 'absolute', top: 14, left: 16, padding: '4px 10px', background: 'rgba(0,0,0,0.7)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 12 }}>BEFORE</div>
                  <div style={{ position: 'absolute', top: 14, right: 16, padding: '4px 10px', background: 'rgba(139,92,246,0.85)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', zIndex: 12 }}>AFTER</div>
                  {/* 전체 포인터 캡처 영역 */}
                  <div
                    data-preview
                    onPointerMove={e => {
                      if (e.buttons !== 1) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
                      setBeforeAfterPos(pct);
                    }}
                    style={{ position: 'absolute', inset: 0, zIndex: 9, cursor: 'ew-resize' }}
                  />
                </>
              ) : (
                /* ── 일반 미리보기 모드 (더블 버퍼 + 이미지 지원) ── */
                <>
                  {/* 버퍼 A (videoRef) — 영상 전용 */}
                  <video
                    ref={videoRef}
                    loop
                    playsInline
                    controls={!isPlaying && clips[activeClipIdx]?.type !== 'image'}
                    muted={isPlaying}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) hue-rotate(${filterHue}deg) sepia(${filterSepia}%) blur(${filterBlur}px)`,
                      background: '#000',
                      opacity: activeBuffer === 'a' && clips[activeClipIdx]?.type !== 'image' ? 1 : 0,
                      zIndex: activeBuffer === 'a' && clips[activeClipIdx]?.type !== 'image' ? 2 : 1,
                      transition: isPlaying ? 'opacity 0.05s' : 'filter 0.15s',
                    }}
                  />
                  {/* 버퍼 B (videoRef2) */}
                  <video
                    ref={videoRef2}
                    loop
                    playsInline
                    muted
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'contain',
                      filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) hue-rotate(${filterHue}deg) sepia(${filterSepia}%) blur(${filterBlur}px)`,
                      background: '#000',
                      opacity: activeBuffer === 'b' && clips[activeClipIdx]?.type !== 'image' ? 1 : 0,
                      zIndex: activeBuffer === 'b' && clips[activeClipIdx]?.type !== 'image' ? 2 : 1,
                      transition: isPlaying ? 'opacity 0.05s' : 'none',
                    }}
                  />
                  {/* 이미지 오버레이 — 현재 클립이 이미지일 때 최상위로 표시 */}
                  {clips[activeClipIdx]?.type === 'image' && (
                    <img
                      src={clips[activeClipIdx].url}
                      alt={clips[activeClipIdx].name}
                      style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'contain',
                        filter: `brightness(${filterBrightness}%) contrast(${filterContrast}%) saturate(${filterSaturation}%) hue-rotate(${filterHue}deg) sepia(${filterSepia}%) blur(${filterBlur}px)`,
                        background: '#000',
                        zIndex: 3,
                        transition: isPlaying ? 'opacity 0.05s' : 'none',
                      }}
                    />
                  )}
                </>
              )
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                <Video size={48} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>클립을 업로드하면<br/>여기서 미리보기가 됩니다</p>
              </div>
            )}

            {/* Before/After 토글 버튼 */}
            {clips.length > 0 && !isPlaying && (
              <button
                onClick={() => setShowBeforeAfter(v => !v)}
                style={{
                  position: 'absolute', bottom: showBeforeAfter ? 'auto' : 14, top: showBeforeAfter ? 14 : 'auto',
                  right: showBeforeAfter ? '50%' : 14,
                  transform: showBeforeAfter ? 'translateX(50%)' : 'none',
                  padding: '6px 14px',
                  background: showBeforeAfter ? 'rgba(139,92,246,0.9)' : 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${showBeforeAfter ? 'rgba(139,92,246,0.8)' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', zIndex: 20, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: showBeforeAfter ? '0 4px 16px rgba(139,92,246,0.5)' : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {showBeforeAfter ? '✕ 비교 종료' : '⇔ 편집 전/후 비교'}
              </button>
            )}

            {/* 비트 플래시 오버레이 */}
            {isPlaying && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)'
              }} />
            )}

            {/* 현재 클립 표시 */}
            {isPlaying && clips[activeClipIdx] && (
              <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  🎬 클립 {activeClipIdx + 1} / {clips.length}
                </span>
              </div>
            )}

            {/* Beat 인디케이터 */}
            {beats.length > 0 && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(139,92,246,0.8)', backdropFilter: 'blur(8px)',
                padding: '8px 14px', borderRadius: 20
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  🥁 {beats.length} Beats
                </span>
              </div>
            )}

            {/* 자막 뱃지 */}
            {subtitles.length > 0 && (
              <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
                <div style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.85)', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                  CC {subtitles.length}개
                </div>
                <button
                  onClick={() => setShowSubtitles(v => !v)}
                  style={{ padding: '5px 10px', background: showSubtitles ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  {showSubtitles ? '자막 ON' : '자막 OFF'}
                </button>
              </div>
            )}

            {/* 비네팅 오버레이 */}
            {filterVignette > 0 && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse at center, transparent ${100 - filterVignette}%, rgba(0,0,0,${filterVignette / 100}) 100%)`,
              }} />
            )}

            {/* 🎯 자막 오버레이 */}
            {currentSubtitle && (
              <div style={{
                position: 'absolute',
                ...(subtitlePosition === 'bottom' ? { bottom: 48 } : subtitlePosition === 'top' ? { top: 48 } : { top: '50%' }),
                left: '50%',
                transform: subtitlePosition === 'middle' ? 'translate(-50%,-50%)' : 'translateX(-50%)',
                maxWidth: '90%', textAlign: 'center', pointerEvents: 'none',
              }}>
                <span style={{
                  display: 'inline-block',
                  background: subtitleBg
                    ? `${subtitleBgColor}${Math.round(subtitleBgOpacity / 100 * 255).toString(16).padStart(2,'0')}`
                    : 'transparent',
                  color: subtitleColor,
                  fontSize: subtitleFontSize,
                  fontFamily: subtitleFontFamily,
                  fontWeight: subtitleFontWeight,
                  padding: subtitleBg ? '8px 18px' : '0',
                  borderRadius: 8,
                  lineHeight: subtitleLineHeight,
                  letterSpacing: subtitleLetterSpacing ? `${subtitleLetterSpacing}px` : (subtitleLang === 'ja' || subtitleLang === 'zh' ? '0.05em' : '0'),
                  textShadow: subtitleOutline !== 'none' ? subtitleOutline : undefined,
                  animation: 'fadeInSub 0.15s ease',
                }}>
                  {currentSubtitle.text}
                </span>
              </div>
            )}

            {/* 🎬 레이어 비디오 오버레이들 */}
            {layers.filter(l => l.visible).map(layer => (
              <video
                key={layer.id}
                src={layer.url}
                ref={el => { if (el) { layerVideoRefs.current.set(layer.id, el); } else { layerVideoRefs.current.delete(layer.id); } }}
                muted={layer.muted}
                loop={layer.loop}
                playsInline
                style={{
                  position: 'absolute',
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  width: `${layer.width}%`,
                  height: `${layer.height}%`,
                  objectFit: 'cover',
                  opacity: layer.opacity,
                  mixBlendMode: layer.blendMode as any,
                  borderRadius: layer.position !== 'full' ? 8 : 0,
                  boxShadow: selectedLayerId === layer.id ? '0 0 0 2px #8b5cf6, 0 4px 20px rgba(139,92,246,0.5)' : 'none',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onClick={() => setSelectedLayerId(layer.id === selectedLayerId ? null : layer.id)}
              />
            ))}
          </div>

          {/* 컨트롤 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: 20 }}>

            {/* 프로그레스 바 — 클릭하여 탐색 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{formatTime(currentTime)}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{bgmDuration > 0 ? formatTime(bgmDuration) : '--:--'}{avgBpm > 0 ? ` · ${avgBpm} BPM` : ''}</span>
              </div>
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', position: 'relative', cursor: bgmDuration > 0 ? 'pointer' : 'default' }}
              >
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)', borderRadius: 999, transition: 'width 0.1s linear' }} />
                {/* 비트 마커들 */}
                {beats.map((beat, i) => (
                  <div key={i} style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(beat.time / bgmDuration) * 100}%`,
                    width: 2, background: `rgba(255,255,255,${0.3 + beat.strength * 0.5})`,
                    transform: 'translateX(-50%)'
                  }} />
                ))}
              </div>
            </div>

            {/* 버튼들 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={togglePlay}
                disabled={clips.length === 0}
                style={{
                  flex: 1, padding: '14px 0',
                  background: clips.length === 0 ? 'rgba(255,255,255,0.05)' : isPlaying ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#8b5cf6,#3b82f6)',
                  border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: clips.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: clips.length === 0 ? 'none' : isPlaying ? '0 6px 20px rgba(239,68,68,0.35)' : '0 6px 20px rgba(139,92,246,0.35)',
                  transition: 'all 0.2s'
                }}
              >
                {isPlaying ? <><Pause size={18} /> 일시정지</> : <><Play size={18} /> {bgmUrl ? '비트 싱크 재생' : '클립 재생'}</>}
              </button>

              <button
                onClick={() => { setShowExport(true); setExportDone(false); setExportProgress(0); }}
                disabled={clips.length === 0}
                style={{
                  padding: '14px 22px',
                  background: clips.length > 0
                    ? 'linear-gradient(135deg,#10b981,#059669)'
                    : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: clips.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: 14, fontWeight: 700,
                  cursor: clips.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: clips.length > 0 ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Download size={16} />
                내보내기
              </button>
            </div>
          </div>

          {/* 🎬 레이어 합성 카드 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(139,92,246,0.25)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ padding: 5, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', borderRadius: 7, fontSize: 12 }}>🎬</div>
                레이어 합성 {layers.length > 0 && <span style={{ fontSize: 11, padding: '2px 7px', background: 'rgba(139,92,246,0.2)', borderRadius: 10, color: '#c4b5fd' }}>{layers.length}개</span>}
              </div>
              <label style={{ padding: '6px 12px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#c4b5fd', cursor: 'pointer' }}>
                + 레이어 추가
                <input type="file" accept="video/*" multiple onChange={e => e.target.files && addVideoLayer(e.target.files)} style={{ display: 'none' }} />
              </label>
            </div>

            {layers.length === 0 ? (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px', border: '2px dashed rgba(139,92,246,0.25)', borderRadius: 12, cursor: 'pointer', background: 'rgba(139,92,246,0.04)' }}>
                <input type="file" accept="video/*" multiple onChange={e => e.target.files && addVideoLayer(e.target.files)} style={{ display: 'none' }} />
                <span style={{ fontSize: 22 }}>🎥</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>영상 레이어 올리기</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>클립 위에 영상을 겹쳐서 PIP·오버레이 효과</span>
              </label>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {layers.map((layer, idx) => {
                  const isSel = selectedLayerId === layer.id;
                  return (
                    <div key={layer.id}>
                      {/* 레이어 행 */}
                      <div
                        onClick={() => setSelectedLayerId(isSel ? null : layer.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: isSel ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
                      >
                        {/* 눈 */}
                        <button onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                          style={{ padding: '3px 6px', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', opacity: layer.visible ? 1 : 0.3 }}>👁</button>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(139,92,246,0.2)', borderRadius: 5, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {layers.length - idx}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                            {POSITION_PRESETS[layer.position].label} · 불투명도 {Math.round(layer.opacity * 100)}% · {BLEND_MODES.find(b => b.value === layer.blendMode)?.label}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button onClick={e => { e.stopPropagation(); moveLayerOrder(layer.id, -1); }} style={{ padding: '2px 5px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11 }}>↑</button>
                          <button onClick={e => { e.stopPropagation(); moveLayerOrder(layer.id, 1); }} style={{ padding: '2px 5px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11 }}>↓</button>
                          <button onClick={e => { e.stopPropagation(); removeLayer(layer.id); }} style={{ padding: '2px 5px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 4, color: '#fca5a5', cursor: 'pointer', fontSize: 11 }}>✕</button>
                        </div>
                      </div>

                      {/* 선택된 레이어 편집 패널 */}
                      {isSel && (
                        <div style={{ margin: '4px 0 4px 12px', padding: '14px 16px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10 }}>

                          {/* 위치 프리셋 */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 7 }}>📍 위치 프리셋</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {(Object.entries(POSITION_PRESETS) as [LayerPosition, typeof POSITION_PRESETS[LayerPosition]][]).map(([key, p]) => (
                                <button key={key} onClick={() => applyPositionPreset(layer.id, key)}
                                  style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, border: layer.position === key ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', background: layer.position === key ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)', color: layer.position === key ? '#c4b5fd' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                                  {p.icon} {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 커스텀 위치·크기 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {[
                              { label: `X ${layer.x.toFixed(0)}%`,      val: layer.x,      set: (v:number) => updateLayer(layer.id, { x: v,      position: 'custom' }), min: 0, max: 95 },
                              { label: `Y ${layer.y.toFixed(0)}%`,      val: layer.y,      set: (v:number) => updateLayer(layer.id, { y: v,      position: 'custom' }), min: 0, max: 95 },
                              { label: `너비 ${layer.width.toFixed(0)}%`, val: layer.width,  set: (v:number) => updateLayer(layer.id, { width: v,  position: 'custom' }), min: 5, max: 100 },
                              { label: `높이 ${layer.height.toFixed(0)}%`,val: layer.height, set: (v:number) => updateLayer(layer.id, { height: v, position: 'custom' }), min: 5, max: 100 },
                            ].map(s => (
                              <div key={s.label}>
                                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 3 }}>{s.label}</label>
                                <input type="range" min={s.min} max={s.max} step={1} value={s.val} onChange={e => s.set(+e.target.value)} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                              </div>
                            ))}
                          </div>

                          {/* 불투명도 + 블렌드 모드 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div>
                              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>불투명도 {Math.round(layer.opacity * 100)}%</label>
                              <input type="range" min={0} max={1} step={0.05} value={layer.opacity} onChange={e => updateLayer(layer.id, { opacity: +e.target.value })} style={{ width: '100%', accentColor: '#8b5cf6' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>블렌드 모드</label>
                              <select value={layer.blendMode} onChange={e => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#fff', fontSize: 12, outline: 'none' }}>
                                {BLEND_MODES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                              </select>
                            </div>
                          </div>

                          {/* 옵션 */}
                          <div style={{ display: 'flex', gap: 12 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                              <input type="checkbox" checked={!layer.muted} onChange={e => updateLayer(layer.id, { muted: !e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
                              소리 ON
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                              <input type="checkbox" checked={layer.loop} onChange={e => updateLayer(layer.id, { loop: e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
                              반복 재생
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                              <input type="checkbox" checked={layer.visible} onChange={e => updateLayer(layer.id, { visible: e.target.checked })} style={{ accentColor: '#8b5cf6' }} />
                              표시
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 타임라인 */}
          {beats.length > 0 && clips.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', padding: 16, overflowX: 'auto' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
                🎞️ 비트 타임라인
              </h3>
              <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
                {beats.slice(0, 30).map((beat, i) => {
                  const clipIdx = i % clips.length;
                  const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
                  const color = colors[clipIdx % colors.length];
                  const isActive = isPlaying && activeClipIdx === clipIdx;
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                    }}>
                      <div style={{
                        width: 40, height: Math.max(20, beat.strength * 50),
                        background: isActive ? color : `${color}55`,
                        borderRadius: 4, transition: 'all 0.2s',
                        border: isActive ? `1px solid ${color}` : 'none',
                        boxShadow: isActive ? `0 0 8px ${color}88` : 'none'
                      }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                        {formatTime(beat.time)}
                      </span>
                    </div>
                  );
                })}
                {beats.length > 30 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    +{beats.length - 30}개
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BGM 오디오 엘리먼트 */}
      {bgmUrl && (
        <audio
          ref={audioRef}
          src={bgmUrl}
          onEnded={() => { setIsPlaying(false); setCurrentTime(0); setActiveClipIdx(0); }}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setBgmDuration(audioRef.current?.duration || 0)}
        />
      )}

      {/* 숨겨진 캔버스 (내보내기용) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ─── 내보내기 모달 ─── */}
      {showExport && (
        <div
          onClick={() => !exporting && setShowExport(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, backdropFilter: 'blur(6px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, margin: 24,
              background: '#111', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}
          >
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.1))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>영상 내보내기</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>포맷과 화질을 선택하세요</div>
                </div>
              </div>
              {!exporting && (
                <button onClick={() => setShowExport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}>
                  <X size={20} />
                </button>
              )}
            </div>

            <div style={{ padding: 24 }}>
              {!exportDone ? (
                <>
                  {/* 포맷 선택 */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      📄 출력 포맷
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(Object.keys(FORMAT_CONFIG) as ExportFormat[]).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => !exporting && setExportFormat(fmt)}
                          style={{
                            flex: 1, padding: '12px 0', borderRadius: 12, fontWeight: 700, fontSize: 14,
                            border: exportFormat === fmt ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                            background: exportFormat === fmt ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                            color: exportFormat === fmt ? '#6ee7b7' : 'rgba(255,255,255,0.45)',
                            cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                          }}
                        >
                          {FORMAT_CONFIG[fmt].label}
                          {fmt === 'mp4' && <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: 'rgba(255,255,255,0.3)' }}>범용</div>}
                          {fmt === 'webm' && <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: 'rgba(255,255,255,0.3)' }}>웹 최적화</div>}
                          {fmt === 'mov' && <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: 'rgba(255,255,255,0.3)' }}>Apple</div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 화질 선택 */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      🎞️ 출력 화질
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(Object.keys(QUALITY_CONFIG) as ExportQuality[]).map(q => {
                        const cfg = QUALITY_CONFIG[q];
                        const isSelected = exportQuality === q;
                        return (
                          <button
                            key={q}
                            onClick={() => !exporting && setExportQuality(q)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 14,
                              padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                              border: isSelected ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                              background: isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                              cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', width: '100%',
                            }}
                          >
                            <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#6ee7b7' : '#fff' }}>{cfg.label}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{cfg.desc}</div>
                            </div>
                            {isSelected && <Check size={16} color="#10b981" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 내보내기 요약 */}
                  <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
                      📦 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>클립:</strong> {clips.length}개 &nbsp;·&nbsp;
                      🥁 <strong style={{ color: 'rgba(255,255,255,0.7)' }}>비트:</strong> {beats.length}개 &nbsp;·&nbsp;
                      ⏱ <strong style={{ color: 'rgba(255,255,255,0.7)' }}>길이:</strong> {Math.floor(bgmDuration / 60)}:{String(Math.floor(bgmDuration % 60)).padStart(2,'0')}
                    </div>
                  </div>

                  {/* 실행 버튼 */}
                  {!exporting ? (
                    <button
                      onClick={async () => {
                        if (!bgmUrl || clips.length === 0) return;
                        setExporting(true);
                        setExportProgress(0);

                        try {
                          const cfg = QUALITY_CONFIG[exportQuality];
                          const fmtCfg = FORMAT_CONFIG[exportFormat];

                          // 캔버스 설정
                          const canvas = canvasRef.current!;
                          const [cw, ch] = exportQuality === 'ultra' ? [3840, 2160] : exportQuality === 'high' ? [1920, 1080] : [1280, 720];
                          canvas.width = cw; canvas.height = ch;
                          const ctx2d = canvas.getContext('2d')!;

                          // ✅ 별도 오디오 엘리먼트 생성 (createMediaElementSource 중복 방지)
                          const exportAudio = new Audio(bgmUrl);
                          exportAudio.crossOrigin = 'anonymous';
                          const audioCtxOut = new AudioContext();
                          const audioDest = audioCtxOut.createMediaStreamDestination();
                          const srcNode = audioCtxOut.createMediaElementSource(exportAudio);
                          srcNode.connect(audioDest);
                          srcNode.connect(audioCtxOut.destination);

                          const canvasStream = canvas.captureStream(30);
                          const combined = new MediaStream([...canvasStream.getTracks(), ...audioDest.stream.getTracks()]);

                          const supportedMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
                            ? 'video/webm;codecs=vp9,opus' : 'video/webm';

                          const recorder = new MediaRecorder(combined, { mimeType: supportedMime, videoBitsPerSecond: cfg.videoBps });
                          const chunks: BlobPart[] = [];
                          recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

                          // 비트 기반 클립 렌더 루프
                          let frameIdx = 0;
                          const fps = 30;
                          const totalFrames = Math.ceil(bgmDuration * fps);
                          const offscreen: Record<string, HTMLVideoElement> = {};
                          clips.forEach(clip => {
                            const v = document.createElement('video');
                            v.src = clip.url; v.muted = true; v.loop = true;
                            v.currentTime = clip.trimStart || 0;
                            offscreen[clip.id] = v;
                          });

                          exportAudio.currentTime = 0;
                          await exportAudio.play();

                          recorder.start(100);

                          const renderFrame = () => {
                            const t = frameIdx / fps;
                            let beatIdx = 0;
                            for (let i = beats.length - 1; i >= 0; i--) {
                              if (t >= beats[i].time) { beatIdx = i; break; }
                            }
                            const clipIdx = beatIdx % clips.length;
                            const vid = offscreen[clips[clipIdx].id];
                            if (vid.paused) vid.play().catch(() => {});

                            ctx2d.fillStyle = '#000';
                            ctx2d.fillRect(0, 0, cw, ch);
                            if (vid.readyState >= 2) {
                              const ar = vid.videoWidth / vid.videoHeight;
                              let dw = cw, dh = ch;
                              if (ar > cw / ch) { dh = cw / ar; } else { dw = ch * ar; }
                              ctx2d.drawImage(vid, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
                            }
                            frameIdx++;
                            setExportProgress(Math.min(99, Math.round((frameIdx / totalFrames) * 100)));
                            if (frameIdx < totalFrames) {
                              setTimeout(renderFrame, 1000 / fps);
                            } else {
                              exportAudio.pause();
                              recorder.stop();
                            }
                          };

                          renderFrame();

                          recorder.onstop = () => {
                            setExportProgress(100);
                            const blob = new Blob(chunks, { type: supportedMime });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `beat-sync-${exportQuality}.${fmtCfg.ext}`;
                            a.click();
                            URL.revokeObjectURL(url);
                            Object.values(offscreen).forEach(v => { v.pause(); v.src = ''; });
                            exportAudio.pause(); exportAudio.src = '';
                            audioCtxOut.close();
                            setExporting(false);
                            setExportDone(true);
                          };
                        } catch (err) {
                          console.error(err);
                          alert('내보내기 중 오류가 발생했습니다.');
                          setExporting(false);
                        }
                      }}
                      style={{
                        width: '100%', padding: '16px 0',
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none', borderRadius: 12, color: '#fff',
                        fontSize: 15, fontWeight: 800, cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <Download size={18} />
                      {FORMAT_CONFIG[exportFormat].label} · {QUALITY_CONFIG[exportQuality].label}로 내보내기
                    </button>
                  ) : (
                    /* 내보내기 진행 중 */
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#6ee7b7' }}>렌더링 중...</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{exportProgress}%</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${exportProgress}%`,
                          background: 'linear-gradient(90deg,#10b981,#3b82f6)',
                          borderRadius: 999, transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10, textAlign: 'center' }}>
                        창을 닫지 마세요 — 고화질 렌더링 중입니다
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* 완료 */
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#6ee7b7', marginBottom: 6 }}>내보내기 완료!</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
                    {FORMAT_CONFIG[exportFormat].label} · {QUALITY_CONFIG[exportQuality].label} 파일이 다운로드됐습니다
                  </div>
                  <button
                    onClick={() => setShowExport(false)}
                    style={{
                      padding: '12px 32px', background: 'linear-gradient(135deg,#10b981,#059669)',
                      border: 'none', borderRadius: 10, color: '#fff',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
