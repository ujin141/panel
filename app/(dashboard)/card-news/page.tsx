'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/layout/Header';
import {
  Copy, ChevronLeft, ChevronRight,
  Type, LayoutGrid, Info,
  RefreshCw, Check, Plus, Trash2, AlignLeft,
  AlertCircle, Download, Film, ArrowUp, ArrowDown,
} from 'lucide-react';
import { logActivity } from '@/lib/activityTracker';
import './card-news.css';

// Types
type CardTheme = 'migo' | 'dark' | 'light' | 'gradient-pink' | 'gradient-purple' | 'gradient-blue' | 'black' | 'gradient-orange' | 'gradient-green';
type CardLayout = 'title-center' | 'title-top' | 'big-number' | 'quote';
type CardCategory = 'travel' | 'beauty' | 'finance' | 'fitness' | 'mindset' | 'food' | 'it' | 'daily';

interface CardSlide {
  id: string;
  title: string;
  body: string;
  tag?: string;
  number?: string;
  videoUrl?: string;
}

// Theme configs
const themeConfig: Record<CardTheme, {
  label: string; labelEn: string; bg: string; coverBg: string; text: string;
  accent: string; preview: string; isDark: boolean; decorColor: string; accentDot?: string;
}> = {
  migo: {
    label: 'Migo 브랜드', labelEn: 'Migo Brand', isDark: true,
    bg: 'linear-gradient(135deg, #3ECFB8, #5BB8F5)',
    coverBg: 'linear-gradient(145deg, #2dd4bf 0%, #38bdf8 55%, #60a5fa 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.92)', preview: '#38c9c0',
    decorColor: 'rgba(255,255,255,0.12)', accentDot: '#FFB800',
  },
  dark: {
    label: '다크', labelEn: 'Dark', isDark: true,
    bg: '#111',
    coverBg: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.7)', preview: '#1a1a2e',
    decorColor: 'rgba(255,255,255,0.05)',
  },
  light: {
    label: '화이트', labelEn: 'White', isDark: false,
    bg: '#fafafa',
    coverBg: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
    text: '#111', accent: '#555', preview: '#e2e8f0',
    decorColor: 'rgba(0,0,0,0.04)',
  },
  'gradient-pink': {
    label: '핑크', labelEn: 'Pink', isDark: true,
    bg: 'linear-gradient(135deg,#f953c6,#b91d73)',
    coverBg: 'linear-gradient(145deg, #ff6bcb 0%, #f953c6 40%, #b91d73 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#f953c6',
    decorColor: 'rgba(255,255,255,0.12)',
  },
  'gradient-purple': {
    label: '퍼플', labelEn: 'Purple', isDark: true,
    bg: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    coverBg: 'linear-gradient(145deg, #9f68ff 0%, #7c3aed 40%, #4f46e5 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#7c3aed',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-blue': {
    label: '블루', labelEn: 'Blue', isDark: true,
    bg: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
    coverBg: 'linear-gradient(145deg, #38bdf8 0%, #0ea5e9 40%, #1d4ed8 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#0ea5e9',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-orange': {
    label: '오렌지', labelEn: 'Orange', isDark: true,
    bg: 'linear-gradient(135deg,#f97316,#dc2626)',
    coverBg: 'linear-gradient(145deg, #fb923c 0%, #f97316 40%, #dc2626 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#f97316',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-green': {
    label: '그린', labelEn: 'Green', isDark: true,
    bg: 'linear-gradient(135deg,#10b981,#059669)',
    coverBg: 'linear-gradient(145deg, #34d399 0%, #10b981 40%, #047857 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#10b981',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  black: {
    label: '블랙', labelEn: 'Black', isDark: true,
    bg: '#000',
    coverBg: 'linear-gradient(145deg, #111 0%, #000 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.6)', preview: '#111',
    decorColor: 'rgba(255,255,255,0.04)',
  },
};

const layoutConfig: Record<CardLayout, { label: string; labelEn: string; desc: string; descEn: string; icon: string }> = {
  'title-center': { label: '중앙 정렬', labelEn: 'Center', desc: '제목이 카드 중앙에 크게 표시', descEn: 'Title centered on card', icon: '⊞' },
  'title-top':    { label: '상단 정렬', labelEn: 'Top', desc: '제목 상단 + 본문 하단 배치', descEn: 'Title top, body bottom', icon: '⊟' },
  'big-number':   { label: '번호형', labelEn: 'Numbered', desc: '큰 숫자로 시선 집중', descEn: 'Big numbers for focus', icon: '①' },
  'quote':        { label: '인용구형', labelEn: 'Quote', desc: '따옴표 스타일의 임팩트 문장', descEn: 'Impactful quote style', icon: '❝' },
};

const categoryConfig: Record<CardCategory, { label: string; labelEn: string; emoji: string; desc: string; descEn: string }> = {
  travel:  { label: '여행/맛집', labelEn: 'Travel/Food', emoji: '✈️', desc: '여행 코스, 숨은 맛집, 핫플 정보', descEn: 'Travel tips, hidden gems, food spots' },
  beauty:  { label: '뷰티/패션', labelEn: 'Beauty/Fashion', emoji: '💄', desc: '메이크업 팁, 코디, 제품 리뷰', descEn: 'Makeup tips, outfits, reviews' },
  finance: { label: '재테크/돈', labelEn: 'Finance/Money', emoji: '💰', desc: '부업, 주식, 절약, 돈 버는 법', descEn: 'Side hustles, investing, saving' },
  fitness: { label: '운동/다이어트', labelEn: 'Fitness/Diet', emoji: '💪', desc: '홈트 루틴, 식단, 체형 관리', descEn: 'Home workouts, meal plans, body care' },
  mindset: { label: '자기계발/동기부여', labelEn: 'Mindset/Motivation', emoji: '🔥', desc: '마인드셋, 뼈때리는 현실 조언', descEn: 'Self-improvement, life advice' },
  food:    { label: '요리/레시피', labelEn: 'Cooking/Recipe', emoji: '🍳', desc: '초간단 자취 요리, 꿀맛 레시피', descEn: 'Easy recipes, quick meals' },
  it:      { label: 'IT/AI/꿀팁', labelEn: 'IT/AI/Tips', emoji: '💻', desc: '숨겨진 꿀기능, AI 활용 노하우', descEn: 'Hidden features, AI hacks' },
  daily:   { label: '일상/공감', labelEn: 'Daily/Relatable', emoji: '💬', desc: '직장인 공감, 썰, 라이프스타일', descEn: 'Office life, stories, lifestyle' },
};

function toBrandHandle(name: string) {
  return name.replace('@', '').toLowerCase().replace(/\s/g, '_');
}

// Cover Card
function CoverCard({ slide, theme, brandName, topic, coverImageUrl, hideText, hideOverlay }: {
  slide: CardSlide; theme: CardTheme; brandName: string; topic: string; coverImageUrl?: string; hideText?: boolean; hideOverlay?: boolean;
}) {
  const t = themeConfig[theme];
  const emoji = topic.includes('뷰티') || topic.includes('스킨') || topic.toLowerCase().includes('beauty') || topic.toLowerCase().includes('skin') ? '✨' :
    topic.includes('재테크') || topic.includes('돈') || topic.includes('투자') || topic.toLowerCase().includes('finance') || topic.toLowerCase().includes('invest') ? '💰' :
    topic.includes('운동') || topic.includes('다이어트') || topic.includes('헬스') || topic.toLowerCase().includes('fitness') || topic.toLowerCase().includes('workout') ? '💪' :
    topic.includes('인스타') || topic.includes('SNS') || topic.includes('마케팅') || topic.toLowerCase().includes('marketing') || topic.toLowerCase().includes('instagram') ? '📱' :
    topic.includes('루틴') || topic.includes('아침') || topic.toLowerCase().includes('routine') || topic.toLowerCase().includes('morning') ? '🌅' :
    topic.includes('요리') || topic.includes('식단') || topic.includes('음식') || topic.toLowerCase().includes('food') || topic.toLowerCase().includes('recipe') || topic.toLowerCase().includes('cook') ? '🍽️' :
    topic.includes('여행') || topic.toLowerCase().includes('travel') ? '✈️' :
    topic.includes('독서') || topic.includes('책') || topic.toLowerCase().includes('book') || topic.toLowerCase().includes('read') ? '📚' : '🎯';

  return (
    <div style={{
      width: '100%', aspectRatio: '9 / 16', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      padding: 0, boxSizing: 'border-box',
      background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : t.coverBg,
    }}>
      {/* 이미지 위 오버레이 */}
      {coverImageUrl && !hideOverlay && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)', zIndex: 1 }} />
      )}

      {/* 장식 원형 (이미지 없을 때) */}
      {!coverImageUrl && (
        <>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 40, right: 20, width: 100, height: 100, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 80, opacity: 0.18, zIndex: 1, userSelect: 'none' }}>
            {emoji}
          </div>
        </>
      )}

      {/* 상단 브랜드 배지 */}
      {!hideText && (
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{
          background: coverImageUrl ? 'rgba(0,0,0,0.35)' : (t.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.8)'),
          backdropFilter: 'blur(8px)',
          border: coverImageUrl ? '1px solid rgba(255,255,255,0.5)' : `1px solid ${t.accentDot || 'rgba(255,255,255,0.3)'}`,
          borderRadius: 999,
          padding: '6px 16px',
          fontSize: 13, fontWeight: 900,
          color: '#fff',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {brandName}
        </div>
      </div>
      )}

      {/* 하단 제목 영역 */}
      {!hideText && (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 24px 48px', zIndex: 3 }}>
        {t.accentDot && !coverImageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accentDot }} />
            <div style={{ width: 30, height: 2, background: t.accentDot, borderRadius: 1 }} />
          </div>
        )}
        <div style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1.35, whiteSpace: 'pre-line',
          letterSpacing: '-0.03em',
          color: coverImageUrl ? '#fff' : (t.isDark ? '#fff' : '#111'),
          textShadow: coverImageUrl ? '0 2px 16px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)' : 'none',
          marginBottom: 12,
          wordBreak: 'keep-all',
        }}>
          {slide.title || 'Card Title'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 2, width: 20, background: coverImageUrl ? 'rgba(255,255,255,0.6)' : (t.accentDot || 'rgba(255,255,255,0.4)'), borderRadius: 1 }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: coverImageUrl ? 'rgba(255,255,255,0.7)' : (t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }}>01 / 05</div>
        </div>
      </div>
      )}
    </div>
  );
}

// Inner Card
function InnerCard({ slide, theme, layout, index, total, brandName, coverImageUrl, hideText, hideOverlay }: {
  slide: CardSlide; theme: CardTheme; layout: CardLayout; index: number; total: number; brandName: string; coverImageUrl?: string; hideText?: boolean; hideOverlay?: boolean;
}) {
  const t = themeConfig[theme];
  const isLast = index === total - 1;
  const isCenter = layout === 'title-center';
  const numColors = ['#6366f1','#ec4899','#10b981','#f59e0b','#06b6d4'];
  const numColor = numColors[(index - 1) % numColors.length];

  // 이미지 오버레이: 테마 색상을 반투명하게 업힙어 독이성 유지
  const imageOverlay = t.isDark
    ? 'rgba(0,0,0,0.62)'
    : 'rgba(255,255,255,0.55)';

  return (
    <div style={{
      width: '100%', aspectRatio: '9 / 16', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      justifyContent: isCenter ? 'center' : 'space-between',
      alignItems: isCenter ? 'center' : 'flex-start',
      padding: '36px 24px', boxSizing: 'border-box',
      textAlign: isCenter ? 'center' : 'left',
      background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : t.bg,
    }}>
      {/* 이미지 오버레이 (can을 매우 블러 처리) */}
      {coverImageUrl && !hideOverlay && (
        <div style={{
          position: 'absolute', inset: 0,
          background: imageOverlay,
          backdropFilter: 'blur(1px)',
          zIndex: 0,
        }} />
      )}

      {/* 그라디언트 배경 장식 (이미지 없을 때) */}
      {!coverImageUrl && (theme === 'gradient-pink' || theme === 'gradient-purple' || theme === 'gradient-blue' || theme === 'gradient-orange' || theme === 'gradient-green') && (
        <>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        </>
      )}

      {/* 상단: 슬라이드 번호 비주얼 + 브랜드 */}
      {!hideText && (
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {!isLast && slide.number && layout !== 'big-number' && (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: numColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}>
            {slide.number}
          </div>
        )}
        {isLast && (
          <div style={{ fontSize: 24 }}>🌟</div>
        )}
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: coverImageUrl ? 'rgba(0,0,0,0.35)' : (t.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.7)'),
          backdropFilter: coverImageUrl ? 'blur(8px)' : 'none',
          border: `1px solid ${coverImageUrl ? 'rgba(255,255,255,0.4)' : (t.accentDot || (t.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'))}`,
          borderRadius: 999,
          padding: '4px 12px',
          color: '#fff',
          marginLeft: 'auto',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          {brandName}
        </div>
      </div>
      )}

      {/* 중간: 제목 + 본문 */}
      {!hideText && (
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 0' }}>
        {layout === 'big-number' && slide.number && (
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.85, color: coverImageUrl ? 'rgba(255,255,255,0.15)' : (t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'), marginBottom: 6, letterSpacing: '-0.05em' }}>{slide.number}</div>
        )}
        {layout === 'quote' && (
          <div style={{ fontSize: 56, lineHeight: 0.7, color: coverImageUrl ? 'rgba(255,255,255,0.2)' : (t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'), marginBottom: 10, fontFamily: 'Georgia,serif' }}>&ldquo;</div>
        )}
        {slide.tag && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: coverImageUrl ? 'rgba(255,255,255,0.6)' : t.accent, marginBottom: 10, textTransform: 'uppercase', opacity: 0.8 }}>{slide.tag}</div>
        )}

        <div style={{ marginBottom: slide.body ? 20 : 0 }}>
          <div style={{
            fontSize: 22, fontWeight: 900, color: coverImageUrl ? '#fff' : t.text,
            lineHeight: 1.3, whiteSpace: 'pre-line',
            letterSpacing: '-0.02em',
            textShadow: coverImageUrl ? '0 2px 14px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.4)' : 'none',
            wordBreak: 'keep-all',
          }}>
            {slide.title || 'Slide Title'}
          </div>
          {!isLast && slide.title && (
            <div style={{
              marginTop: 8,
              height: 3, width: 40, borderRadius: 2,
              background: coverImageUrl
                ? 'rgba(255,255,255,0.7)'
                : numColor,
            }} />
          )}
        </div>

        {slide.body && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {slide.body.split('\n').map((line, li) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const isListItem = /^(\d+\.|[✅✔️📌🔖💡⭐🌟🎯👉✨🔥💎🏆💰📍🎁])/.test(trimmed);
              const isDivider = trimmed === '---' || trimmed === '──';
              if (isDivider) return (
                <div key={li} style={{ height: 1, background: coverImageUrl ? 'rgba(255,255,255,0.2)' : (t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'), margin: '4px 0' }} />
              );
              return (
                <div key={li} style={{
                  display: 'flex', alignItems: 'flex-start', gap: isListItem ? 0 : 8,
                  fontSize: isListItem ? 13 : 12.5,
                  fontWeight: isListItem ? 700 : 500,
                  lineHeight: 1.6,
                  color: coverImageUrl
                    ? (isListItem ? '#fff' : 'rgba(255,255,255,0.95)')
                    : (isListItem ? t.text : (t.isDark ? 'rgba(255,255,255,0.85)' : '#333')),
                  textShadow: coverImageUrl ? '0 1px 8px rgba(0,0,0,0.6)' : 'none',
                  letterSpacing: '-0.01em',
                  wordBreak: 'keep-all',
                }}>
                  {!isListItem && (
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: coverImageUrl ? 'rgba(255,255,255,0.5)' : numColor,
                      flexShrink: 0, marginTop: 7,
                    }} />
                  )}
                  <span>{trimmed}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* 하단: 진행 바 */}
      {!hideText && (
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ height: 2, background: coverImageUrl ? 'rgba(255,255,255,0.15)' : (t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(index / (total - 1)) * 100}%`, background: numColor, borderRadius: 1, transition: 'width 0.3s ease' }} />
        </div>
      </div>
      )}
    </div>
  );
}

// 실시간 트렌드 허브 타입
type TrendCardTopic = { rank:number; keyword:string; hook:string; hotScore:number; estimatedViews:string; saves:string; reason:string; hashtags:string[]; source:string; category:string; urgency:string; };
type TrendAiTopic   = { rank:number; keyword:string; searchVolume:string; competition:string; hotScore:number; reason:string; longtailKeywords:string[]; contentAngle:string; source:string; category:string; };
type TrendHubData   = { cardTopics: TrendCardTopic[]; aiWritingTopics: TrendAiTopic[]; realtime?: boolean; fetchedCount?: number; fetchedAt?: string; };

// Main Page
export default function CardNewsPage() {
  const [step,      setStep]      = useState<'setup' | 'editor'>('setup');
  const [category, setCategory]  = useState<CardCategory>('travel');
  const [language, setLanguage]  = useState<'ko' | 'en'>('ko');
  const [theme,    setTheme]      = useState<CardTheme>('migo');
  const [layout,   setLayout]     = useState<CardLayout>('title-top');
  const [topic,    setTopic]      = useState('');
  const [brandName,setBrandName]  = useState('');
  const [slides,   setSlides]     = useState<CardSlide[]>([]);
  const [currentIdx,setCurrentIdx]= useState(0);
  const [loading,  setLoading]    = useState(false);
  const [loadingMsg,setLoadingMsg]= useState('');
  const [error,    setError]      = useState('');
  const [copiedIdx,setCopiedIdx]  = useState<number | null>(null);
  const [editSlide,setEditSlide]  = useState<CardSlide | null>(null);
  const [isFallback,setIsFallback]= useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [caption,  setCaption]    = useState('');
  const [hashtags, setHashtags]   = useState<string[]>([]);
  const [captionCopied,    setCaptionCopied]    = useState(false);
  const [hashtagsCopied,   setHashtagsCopied]   = useState(false);
  const [downloading,      setDownloading]      = useState(false);
  const [downloadingAll,   setDownloadingAll]   = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const [slideImages,      setSlideImages]      = useState<(string | null)[]>([]);
  const [slideVideos,      setSlideVideos]      = useState<(string | null)[]>([]);
  const [slideHideText,    setSlideHideText]    = useState<boolean[]>([]);
  const [slideHideOverlay, setSlideHideOverlay] = useState<boolean[]>([]);
  const [pamphletUrl,      setPamphletUrl]      = useState<string | null>(null);
  const [trends, setTrends] = useState<Array<{topic:string;reason:string;hashtags:string[];hotScore:number;estimatedViews?:string;viewReason?:string;source?:string}>>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{topic:string;reason:string;category:string;estimatedViews?:string;viralScore?:number;analysis?:string}>>([]);
  const [recommending, setRecommending] = useState(false);

  // 실시간 트렌드 허브
  const [trendHub, setTrendHub] = useState<TrendHubData | null>(null);
  const [trendHubLoading, setTrendHubLoading] = useState(false);
  const [trendHubTab, setTrendHubTab] = useState<'card' | 'ai'>('card');
  const [trendHubCategory, setTrendHubCategory] = useState<string>('all');

  const previewRef = useRef<HTMLDivElement>(null);
  const hiddenRenderRef = useRef<HTMLDivElement>(null);

  // ── i18n 번역 헬퍼 ──────────────────────────────────────────
  const isEn = language === 'en';
  const t = {
    newSlide: isEn ? 'New Slide' : '새 슬라이드',
    newBody: isEn ? 'Enter your content here' : '내용을 입력하세요',
    addCut: isEn ? 'Add Slide' : '컷 추가',
    deleteCut: isEn ? 'Delete Slide' : '컷 삭제',
    confirmDelete: (n: number) => isEn ? `Delete slide ${n}?` : `${n}번 슬라이드를 삭제할까요?`,
    addAfter: isEn ? 'Add slide after current' : '현재 컷 뒤에 새 컷 추가',
    deleteCurrent: isEn ? 'Delete current slide' : '현재 컷 삭제',
    moveUp: isEn ? 'Move up' : '앞으로 이동',
    moveDown: isEn ? 'Move down' : '뒤로 이동',
    thumbUp: isEn ? 'Move up' : '위로 이동',
    thumbDown: isEn ? 'Move down' : '아래로 이동',
    thumbDel: isEn ? 'Delete slide' : '컷 삭제',
    thumbAdd: isEn ? 'Add' : '추가',
    displaySettings: isEn ? '👁 Display Settings' : '👁 표시 설정',
    showText: isEn ? 'Show Text (Captions)' : '자막 (텍스트) 표시',
    showOverlay: isEn ? 'Dark Overlay' : '반투명 오버레이',
    displayHint: isEn ? 'Turn OFF to show only background image/video. Applied to downloads too.' : 'OFF하면 이미지/영상만 깔끔하게 보여요. 다운로드에도 반영됩니다.',
    title: isEn ? 'Title' : '제목',
    titlePlaceholder: isEn ? 'Card title' : '카드 제목',
    body: isEn ? 'Body' : '본문',
    bodyPlaceholder: isEn ? 'Body content' : '본문 내용',
    bgImage: isEn ? '🖼️ Background Image' : '🖼️ 배경 이미지 설정',
    fileUpload: isEn ? 'Upload File' : '파일 업로드',
    imgUrlPlaceholder: isEn ? 'Or paste image URL (https://...)' : '또는 이미지 링크 주소 입력 (https://...)',
    imgHint: isEn ? 'Upload from your device or enter a URL.' : 'PC/폰의 사진을 직접 업로드하거나 URL을 입력하세요.',
    imgHint2: isEn ? 'Leave empty to use theme background or cover image.' : '비워두면 테마 배경이나 앞장 이미지가 적용돼요.',
    bgVideo: isEn ? '🎥 Background Video' : '🎥 배경 영상 추가',
    videoUpload: isEn ? 'Upload Video' : '영상 업로드',
    videoSizeError: isEn ? 'Video must be under 50MB.' : '영상 파일은 50MB 이하만 가능합니다.',
    videoRemove: isEn ? 'Remove' : '제거',
    videoApplied: isEn ? '✅ Video is applied as background. Check the preview.' : '✅ 영상이 배경으로 적용됩니다. 미리보기에서 확인하세요.',
    videoHint: isEn ? 'Upload MP4/WebM to play as slide background.' : 'MP4, WebM 영상을 업로드하면 슬라이드 배경으로 재생돼요.',
    videoReelsHint: isEn ? '💡 Videos are replaced with still images in Reels export.' : '💡 릴스 변환 시에는 정지 이미지로 대체됩니다.',
    savingPng: isEn ? 'Saving...' : '저장 중...',
    downloadPng: isEn ? 'Save this slide as PNG' : '이 슬라이드 PNG 저장',
    processingZip: (n: number) => isEn ? `Processing... (${n} slides)` : `처리 중... (${n}장)`,
    downloadZip: isEn ? 'Download all as ZIP' : '전체 ZIP으로 다운로드',
    pamphlet: isEn ? '📖 Add ending pamphlet' : '📖 영상 마지막 팜플렛 추가',
    pamphletUpload: isEn ? 'Upload' : '업로드',
    pamphletRemove: isEn ? 'Remove' : '제거',
    pamphletHint: isEn ? 'Upload a promo image to add at the end of the video.' : '영상 마지막에 추가할 안내/홍보 이미지를 업로드하세요.',
    renderingVideo: isEn ? 'Rendering video... (~15s)' : '비디오 굽는 중... (약 15초)',
    downloadReels: isEn ? '🎥 Save as Reels video (muted)' : '🎥 릴스 영상으로 저장 (무음)',
    videoFailed: isEn ? 'Video conversion failed.' : '비디오 변환에 실패했습니다.',
    downloadFailed: isEn ? 'Download failed.' : '다운로드에 실패했습니다.',
    zipFailed: isEn ? 'Batch download failed.' : '전체 다운로드에 실패했습니다.',
  };

  const handleRecommend = async (type: 'custom' | 'viral') => {
    setRecommending(true);
    setRecommendations([]);
    try {
      const res = await fetch('/api/card-news/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, category, type, language })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRecommending(false);
    }
  };

  const handleTrendHub = async (overrideCat?: string) => {
    const cat = overrideCat ?? trendHubCategory;
    setTrendHubLoading(true);
    setTrendHub(null);
    try {
      const res = await fetch(`/api/trending-topics?category=${cat === 'all' ? '' : cat}&mode=all&t=${Date.now()}`);
      const data = await res.json();
      setTrendHub(data);
    } catch (e: any) {
      console.error('TrendHub error:', e);
    } finally {
      setTrendHubLoading(false);
    }
  };

  useEffect(() => {
    const savedBrand = localStorage.getItem('panelai_brandName');
    if (savedBrand) setBrandName(savedBrand);
  }, []);

  const handleGenerate = async () => {
    if (!topic) { setError(isEn ? 'Please enter a topic' : '주제를 입력해주세요'); return; }
    setLoading(true); setError(''); setIsFallback(false);
    setLoadingMsg(isEn ? 'AI is composing slides...' : 'AI가 슬라이드 구성 중...');
    setTimeout(() => setLoadingMsg(isEn ? 'Writing card news text... ✍️' : '카드뉴스 텍스트 작성 중... ✍️'), 1200);
    try {
      const res = await fetch('/api/card-news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category, theme, brandName: brandName || 'My Brand', language }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: isEn ? 'Generation failed' : '생성 실패' }));
        throw new Error(err.error || (isEn ? 'Generation failed' : '생성에 실패했습니다'));
      }
      const data = await res.json();
      setSlides(data.slides || []);
      if (data.fallback) setIsFallback(true);
      setCoverImageUrl(data.coverImageUrl || null);
      setImageError(data.imageError || null);
      setSlideImages(data.slideImages || []);
      setSlideVideos(new Array((data.slides || []).length).fill(null));
      setSlideHideText(new Array((data.slides || []).length).fill(false));
      setSlideHideOverlay(new Array((data.slides || []).length).fill(false));
      setCaption(data.caption?.caption || '');
      setHashtags(data.caption?.hashtags || []);
      setCurrentIdx(0);
      setEditSlide(data.slides?.[0] ?? null);
      setStep('editor');
      logActivity('card_news');
    } catch (e: any) {
      setError(e.message || (isEn ? 'An error occurred. Please try again.' : '오류가 발생했습니다. 다시 시도해주세요.'));
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  const handleRegenerate = async () => {
    setLoading(true); setError(''); setIsFallback(false);
    setLoadingMsg(isEn ? 'Generating new slides...' : '새 슬라이드 생성 중...');
    try {
      const res = await fetch('/api/card-news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category, theme, brandName: brandName || 'My Brand', language }),
      });
      if (!res.ok) throw new Error(isEn ? 'Regeneration failed' : '재생성 실패');
      const data = await res.json();
      setSlides(data.slides || []);
      if (data.fallback) setIsFallback(true);
      setCoverImageUrl(data.coverImageUrl || null);
      setCaption(data.caption?.caption || '');
      setHashtags(data.caption?.hashtags || []);
      setCurrentIdx(0);
      setEditSlide(data.slides?.[0] ?? null);
      setSlideVideos(new Array((data.slides || []).length).fill(null));
      setSlideHideText(new Array((data.slides || []).length).fill(false));
      setSlideHideOverlay(new Array((data.slides || []).length).fill(false));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  const updateSlide = (field: keyof CardSlide, value: string) => {
    if (!editSlide) return;
    const updated = { ...editSlide, [field]: value };
    setEditSlide(updated);
    setSlides(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const addSlide = () => {
    const total = slides.length + 1;
    const ns: CardSlide = { id: Date.now().toString(), title: t.newSlide, body: t.newBody, tag: total + ' / ' + total };
    const next = [...slides, ns];
    setSlides(next); setCurrentIdx(next.length - 1); setEditSlide(ns);
    setSlideImages(prev => [...prev, null]);
    setSlideVideos(prev => [...prev, null]);
    setSlideHideText(prev => [...prev, false]);
    setSlideHideOverlay(prev => [...prev, false]);
  };

  const addSlideAt = (afterIdx: number) => {
    const ns: CardSlide = { id: Date.now().toString(), title: t.newSlide, body: t.newBody };
    const next = [...slides];
    next.splice(afterIdx + 1, 0, ns);
    setSlides(next);
    setCurrentIdx(afterIdx + 1);
    setEditSlide(ns);
    const newImages = [...slideImages];
    newImages.splice(afterIdx + 1, 0, null);
    setSlideImages(newImages);
    const newVideos = [...slideVideos];
    newVideos.splice(afterIdx + 1, 0, null);
    setSlideVideos(newVideos);
    const newHT = [...slideHideText];
    newHT.splice(afterIdx + 1, 0, false);
    setSlideHideText(newHT);
    const newHO = [...slideHideOverlay];
    newHO.splice(afterIdx + 1, 0, false);
    setSlideHideOverlay(newHO);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== idx);
    const ni = Math.min(idx, next.length - 1);
    setSlides(next); setCurrentIdx(ni); setEditSlide(next[ni]);
    // slideImages, slideVideos 배열도 맞춰줌
    const newImages = slideImages.filter((_, i) => i !== idx);
    setSlideImages(newImages);
    const newVideos = slideVideos.filter((_, i) => i !== idx);
    setSlideVideos(newVideos);
    setSlideHideText(prev => prev.filter((_, i) => i !== idx));
    setSlideHideOverlay(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSlide = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setSlides(next);
    setCurrentIdx(toIdx);
    setEditSlide(next[toIdx]);
    // 이미지/비디오도 이동
    const imgs = [...slideImages];
    const [movedImg] = imgs.splice(fromIdx, 1);
    imgs.splice(toIdx, 0, movedImg);
    setSlideImages(imgs);
    const vids = [...slideVideos];
    const [movedVid] = vids.splice(fromIdx, 1);
    vids.splice(toIdx, 0, movedVid);
    setSlideVideos(vids);
    const ht = [...slideHideText];
    const [movedHT] = ht.splice(fromIdx, 1);
    ht.splice(toIdx, 0, movedHT);
    setSlideHideText(ht);
    const ho = [...slideHideOverlay];
    const [movedHO] = ho.splice(fromIdx, 1);
    ho.splice(toIdx, 0, movedHO);
    setSlideHideOverlay(ho);
  };

  const goTo = (idx: number) => { setCurrentIdx(idx); setEditSlide(slides[idx]); };

  const handleCopySlide = async (slide: CardSlide, idx: number) => {
    await navigator.clipboard.writeText([slide.title, slide.body].filter(Boolean).join('\n\n'));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };


  // ── 이미지 URL → data URL 변환 (CORS 우회) ────────────────────────────
  const toDataUrl = async (imgUrl: string): Promise<string> => {
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return imgUrl; // 실패시 원본 URL 그대로
    }
  };

  // ── 슬라이드를 1080×1080 고화질 캔버스로 캡처 (미리보기와 동일 비율) ─────────────────────────
  const captureSlide = async (idx: number): Promise<HTMLCanvasElement> => {
    const h2c = (await import('html2canvas')).default as any;
    const { createRoot } = await import('react-dom/client');
    const React = await import('react');

    const rawUrl = idx === 0 ? coverImageUrl : (slideImages[idx] || coverImageUrl);
    let imgDataUrl: string | undefined;
    if (rawUrl) imgDataUrl = await toDataUrl(rawUrl);

    const container = hiddenRenderRef.current!;
    container.innerHTML = '';

    // 1080x1920 출력을 위해 270x480 (9:16) 렌더링 후 scale 4배 적용
    const wrapEl = document.createElement('div');
    wrapEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:270px;height:480px;overflow:hidden;';
    container.appendChild(wrapEl);

    const root = createRoot(wrapEl);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(
          React.Fragment, null,
          idx === 0
            ? React.createElement(CoverCard, {
                slide: slides[idx], theme, brandName: brandName || 'My Brand',
                topic, coverImageUrl: imgDataUrl,
                hideText: slideHideText[idx], hideOverlay: slideHideOverlay[idx],
              })
            : React.createElement(InnerCard, {
                slide: slides[idx], theme, layout,
                index: idx, total: slides.length,
                brandName: brandName || 'My Brand',
                coverImageUrl: imgDataUrl,
                hideText: slideHideText[idx], hideOverlay: slideHideOverlay[idx],
              })
        )
      );
      setTimeout(resolve, 900); // 이미지+폰트 완전 로드 대기
    });

    // 1080x1920 출력을 위한 스케일
    const canvas = await h2c(wrapEl, {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      width: 270,
      height: 480,
      imageTimeout: 15000,
    });

    root.unmount();
    container.innerHTML = '';
    return canvas;
  };

  // ── 현재 슬라이드 PNG 저장 ──────────────────────────────────────────────
  const handleDownloadCurrent = useCallback(async () => {
    if (!hiddenRenderRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await captureSlide(currentIdx);
      const link = document.createElement('a');
      link.download = `card-${currentIdx + 1}-${(topic || 'slide').slice(0, 20)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert(t.downloadFailed);
    } finally {
      setDownloading(false);
    }
  }, [currentIdx, topic, downloading, slides, theme, brandName, layout, coverImageUrl, slideImages]);

  // ── 전체 슬라이드 ZIP 저장 ──────────────────────────────────────────────
  const handleDownloadAll = useCallback(async () => {
    if (!hiddenRenderRef.current || downloadingAll || slides.length === 0) return;
    setDownloadingAll(true);
    try {
      const JSZip = (await import('jszip')).default as any;
      const zip = new JSZip();
      const folder = zip.folder((topic.slice(0, 20) || 'card-news'));

      for (let i = 0; i < slides.length; i++) {
        const canvas = await captureSlide(i);
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
        );
        folder.file(`slide-${String(i + 1).padStart(2, '0')}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${(topic || 'card-news').slice(0, 20)}-slides.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('ZIP download failed:', err);
      alert(t.zipFailed);
    } finally {
      if (hiddenRenderRef.current) hiddenRenderRef.current.innerHTML = '';
      setDownloadingAll(false);
    }
  }, [slides, theme, brandName, topic, layout, coverImageUrl, slideImages, downloadingAll]);

  // ── 카드뉴스를 MP4/WebM 비디오로 저장 (슬라이드쇼) ──────────────────────────────────────────────
  const handleDownloadVideo = useCallback(async () => {
    if (!hiddenRenderRef.current || downloadingVideo || slides.length === 0) return;
    setDownloadingVideo(true);
    try {
      // ── STEP 1: 녹화 전 모든 슬라이드 미리 캡처 ────────────────────────────
      const capturedCanvases: HTMLCanvasElement[] = [];
      for (let i = 0; i < slides.length; i++) {
        const c = await captureSlide(i);
        // 캡처 간 충분한 간격을 두어 createRoot 충돌 방지
        await new Promise(r => setTimeout(r, 200));

        // 캔버스를 정확히 1080x1920으로 정규화 (크기 불일치 방지)
        if (c.width !== 1080 || c.height !== 1920) {
          const norm = document.createElement('canvas');
          norm.width = 1080;
          norm.height = 1920;
          const nCtx = norm.getContext('2d')!;
          nCtx.fillStyle = '#000';
          nCtx.fillRect(0, 0, 1080, 1920);
          nCtx.drawImage(c, 0, 0, 1080, 1920);
          capturedCanvases.push(norm);
        } else {
          capturedCanvases.push(c);
        }
      }

      console.log(`[Video] ${capturedCanvases.length}/${slides.length} slides captured`);

      // ── STEP 2: 녹화 캔버스 & MediaRecorder 설정 ─────────────────────────
      const videoCanvas = document.createElement('canvas');
      videoCanvas.width = 1080;
      videoCanvas.height = 1920; // 릴스/쇼츠 사이즈 (9:16 비율)
      const ctx = videoCanvas.getContext('2d')!;
      if (!ctx) throw new Error('Canvas context error');

      // 지원 포맷 확인 (MP4 우선)
      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      }

      // 모바일(릴스/쇼츠) 재인코딩 시 버벅임 방지를 위해 30fps 및 8Mbps 로 안정화
      const stream = videoCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000, // 8Mbps — 버벅임 없는 최적화 화질
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };

      const recordPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          link.download = `${(topic || 'card-news').slice(0, 20)}-reels.${ext}`;
          link.click();
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      // ── 팜플렛 이미지(선택적) 캔버스에 그리기 ──────────────────────
      if (pamphletUrl) {
        const pamphletImg = document.createElement('img');
        pamphletImg.src = pamphletUrl;
        await pamphletImg.decode();
        
        const pamCanvas = document.createElement('canvas');
        pamCanvas.width = 1080;
        pamCanvas.height = 1920;
        const pCtx = pamCanvas.getContext('2d')!;
        
        pCtx.fillStyle = '#000';
        pCtx.fillRect(0, 0, 1080, 1920);
        
        const scale = Math.min(1080 / pamphletImg.width, 1920 / pamphletImg.height);
        const w = pamphletImg.width * scale;
        const h = pamphletImg.height * scale;
        const x = (1080 - w) / 2;
        const y = (1920 - h) / 2;
        pCtx.drawImage(pamphletImg, x, y, w, h);
        
        capturedCanvases.push(pamCanvas);
      }

      const totalSlides = capturedCanvases.length;
      console.log(`[Video] Recording ${totalSlides} total frames (including pamphlet)`);

      // ── STEP 3: 디졸브 전환 효과 준비 ───────────────────────────
      const drawSingleSlide = (sc: HTMLCanvasElement, alpha: number = 1) => {
        ctx.globalAlpha = alpha;
        ctx.drawImage(sc, 0, 0, 1080, 1920);
      };

      const drawSlide = (sc: HTMLCanvasElement) => {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1080, 1920);
        drawSingleSlide(sc, 1);
      };

      const crossfade = async (sc1: HTMLCanvasElement, sc2: HTMLCanvasElement, durationMs: number) => {
        const fps = 30;
        const frames = Math.floor((durationMs / 1000) * fps);
        const intervalMs = 1000 / fps;
        
        for (let i = 0; i <= frames; i++) {
          const alpha = i / frames;
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, 1080, 1920);
          
          drawSingleSlide(sc1, 1 - alpha);
          drawSingleSlide(sc2, alpha);
          
          if (i % 10 === 0) recorder.requestData();
          await new Promise(r => setTimeout(r, intervalMs));
        }
        ctx.globalAlpha = 1;
      };

      const holdSlide = async (sc: HTMLCanvasElement, durationMs: number) => {
        const fps = 30;
        const frames = Math.floor((durationMs / 1000) * fps);
        const intervalMs = 1000 / fps;
        for (let i = 0; i < frames; i++) {
          drawSlide(sc);
          if (i % 10 === 0) recorder.requestData();
          await new Promise(r => setTimeout(r, intervalMs));
        }
      };

      // ── STEP 4: 녹화 시작 및 재생 ─────────────────────────────
      // 첫 프레임을 확실히 그린 후 녹화 시작
      drawSlide(capturedCanvases[0]);
      recorder.start(100); // 100ms마다 자동으로 데이터 수집
      await new Promise(r => setTimeout(r, 200));

      const SLIDE_MS = 3000;   // 슬라이드당 3초 (기존 2.5초 → 안정성 향상)
      const FADE_MS  = 600; 
      const PAMPHLET_MS = 5000;
      const LAST_SLIDE_EXTRA = 500; // 마지막 슬라이드 추가 대기

      for (let i = 0; i < totalSlides; i++) {
        const isLastSlide = i === totalSlides - 1;
        const isPamphlet = pamphletUrl && isLastSlide;
        const duration = isPamphlet ? PAMPHLET_MS : SLIDE_MS;
        
        console.log(`[Video] Rendering slide ${i + 1}/${totalSlides}`);
        await holdSlide(capturedCanvases[i], duration);

        if (!isLastSlide) {
          await crossfade(capturedCanvases[i], capturedCanvases[i + 1], FADE_MS);
        } else {
          // 마지막 프레임이 확실히 영상에 담기도록
          recorder.requestData();
          await new Promise(r => setTimeout(r, LAST_SLIDE_EXTRA));
          drawSlide(capturedCanvases[i]); // 마지막 프레임 한 번 더 그리기
          recorder.requestData();
          await new Promise(r => setTimeout(r, 500));
        }
      }

      recorder.stop();
      await recordPromise;

    } catch (err) {
      console.error('Video download failed:', err);
      alert(t.videoFailed);
    } finally {
      if (hiddenRenderRef.current) hiddenRenderRef.current.innerHTML = '';
      setDownloadingVideo(false);
    }
  }, [slides, theme, brandName, topic, layout, coverImageUrl, slideImages, downloadingVideo, pamphletUrl, slideHideText, slideHideOverlay]);

  const renderPreview = (idx: number) => {
    if (!slides[idx]) return null;
    // idx=0: coverImageUrl, idx>0: slideImages[idx] (맞춤 이미지) 또는 coverImageUrl 폴백
    const imgForSlide = idx === 0
      ? (coverImageUrl || undefined)
      : (slideImages[idx] || coverImageUrl || undefined);
    const videoForSlide = slideVideos[idx] || undefined;

    const card = idx === 0
      ? <CoverCard slide={slides[idx]} theme={theme} brandName={brandName || 'My Brand'} topic={topic} coverImageUrl={imgForSlide} hideText={slideHideText[idx]} hideOverlay={slideHideOverlay[idx]} />
      : <InnerCard slide={slides[idx]} theme={theme} layout={layout} index={idx} total={slides.length} brandName={brandName || 'My Brand'} coverImageUrl={imgForSlide} hideText={slideHideText[idx]} hideOverlay={slideHideOverlay[idx]} />;

    // 비디오가 있으면 비디오 오버레이 표시
    if (videoForSlide) {
      return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 16', borderRadius: 16, overflow: 'hidden' }}>
          <video
            src={videoForSlide}
            autoPlay
            loop
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            {card}
          </div>
          {/* 비디오 뱃지 */}
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)',
            padding: '4px 10px', borderRadius: 999,
            fontSize: 10, fontWeight: 800, color: '#fff',
            letterSpacing: '0.05em',
          }}>
            <Film size={10} /> VIDEO
          </div>
        </div>
      );
    }

    return card;
  };

  return (
    <div>
      <Header title={isEn ? 'Card News Creator' : '카드뉴스 제작'} subtitle={isEn ? 'Enter a topic and AI will automatically create slide text' : '주제를 입력하면 AI가 슬라이드 텍스트를 자동으로 만들어드려요'} />
      <div className="page-container animate-fade-in">

        {/* SETUP */}
        {step === 'setup' && (
          <div className="cn-setup">

            {/* Step 1: Category */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">1</div>
                <div className="cn-step-title">{isEn ? 'Card News Type' : '카드뉴스 유형'}</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-category-grid">
                  {(Object.keys(categoryConfig) as CardCategory[]).map(c => (
                    <button key={c} className={'cn-category-btn' + (category === c ? ' active' : '')} onClick={() => setCategory(c)}>
                      <span className="cn-category-emoji">{categoryConfig[c].emoji}</span>
                      <span className="cn-category-label">{isEn ? categoryConfig[c].labelEn : categoryConfig[c].label}</span>
                      <span className="cn-category-desc">{isEn ? categoryConfig[c].descEn : categoryConfig[c].desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* === 실시간 트렌드 허브 === */}
            <div className="cn-step" style={{ border: '1px solid rgba(250,204,21,0.25)', background: 'linear-gradient(135deg, rgba(250,204,21,0.04) 0%, rgba(251,146,60,0.04) 100%)' }}>
              <div className="cn-step-header">
                <div className="cn-step-num" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', boxShadow: '0 2px 10px rgba(245,158,11,0.4)' }}>⚡</div>
                <div className="cn-step-title" style={{ color: '#fcd34d' }}>{isEn ? 'Real-time Trend Hub' : '실시간 트렌드 허브'} <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{isEn ? '— Auto-discover trending topics' : '— 지금 트래픽 폭발 주제 자동 탐색'}</span></div>
              </div>
              <div className="cn-step-body">

                {/* 카테고리 필터 */}
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{isEn ? 'Select Category' : '카테고리 선택'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { id: 'all',     emoji: '🌐', label: '전체', labelEn: 'All' },
                      { id: 'travel',  emoji: '✈️', label: '여행/맛집', labelEn: 'Travel/Food' },
                      { id: 'beauty',  emoji: '💄', label: '뷰티/패션', labelEn: 'Beauty/Fashion' },
                      { id: 'finance', emoji: '💰', label: '재테크/돈', labelEn: 'Finance/Money' },
                      { id: 'fitness', emoji: '💪', label: '운동/다이어트', labelEn: 'Fitness/Diet' },
                      { id: 'mindset', emoji: '🔥', label: '자기계발', labelEn: 'Mindset' },
                      { id: 'food',    emoji: '🍳', label: '요리/레시피', labelEn: 'Cooking' },
                      { id: 'it',      emoji: '💻', label: 'IT/AI', labelEn: 'IT/AI' },
                      { id: 'daily',   emoji: '💬', label: '일상/공감', labelEn: 'Daily' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setTrendHubCategory(cat.id);
                          if (trendHub) handleTrendHub(cat.id);
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          background: trendHubCategory === cat.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${trendHubCategory === cat.id ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.08)'}`,
                          color: trendHubCategory === cat.id ? '#fcd34d' : 'rgba(255,255,255,0.45)',
                          boxShadow: trendHubCategory === cat.id ? '0 0 10px rgba(245,158,11,0.15)' : 'none',
                        }}
                      >
                        {cat.emoji} {isEn ? cat.labelEn : cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 허브 실행 버튼 */}
                <button
                  onClick={() => handleTrendHub()}
                  disabled={trendHubLoading}
                  style={{
                    width: '100%', padding: '14px 20px',
                    background: trendHubLoading ? 'rgba(245,158,11,0.15)' : 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                    border: 'none', borderRadius: 12, cursor: trendHubLoading ? 'not-allowed' : 'pointer',
                    color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: trendHubLoading ? 'none' : '0 4px 20px rgba(245,158,11,0.35)',
                    transition: 'all 0.2s', marginBottom: trendHub ? 16 : 0,
                  }}
                  onMouseEnter={e => { if (!trendHubLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {trendHubLoading ? (
                    <><div className="spinner" />{isEn ? 'Collecting Google News & Trends...' : '구글 뉴스·트렌드 실시간 수집 중...'}</>
                  ) : (
                    <>⚡ {trendHubCategory === 'all' ? (isEn ? 'All' : '전체') : [
                      { id: 'travel', label: '여행/맛집', labelEn: 'Travel/Food' }, { id: 'beauty', label: '뷰티/패션', labelEn: 'Beauty/Fashion' },
                      { id: 'finance', label: '재테크/돈', labelEn: 'Finance/Money' }, { id: 'fitness', label: '운동/다이어트', labelEn: 'Fitness/Diet' },
                      { id: 'mindset', label: '자기계발', labelEn: 'Mindset' }, { id: 'food', label: '요리/레시피', labelEn: 'Cooking' },
                      { id: 'it', label: 'IT/AI', labelEn: 'IT/AI' }, { id: 'daily', label: '일상/공감', labelEn: 'Daily' },
                    ].find(c => c.id === trendHubCategory)?.[isEn ? 'labelEn' : 'label'] ?? (isEn ? 'All' : '전체')} {isEn ? 'Explore Trends' : '트렌드 탐색하기'}</>
                  )}
                </button>

                {/* 트렌드 허브 결과 */}
                {trendHub && (
                  <div>
                     {/* 수집 상태 배지 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
                        background: trendHub.realtime ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                        border: `1px solid ${trendHub.realtime ? 'rgba(16,185,129,0.4)' : 'rgba(100,100,100,0.3)'}`,
                        borderRadius: 20, padding: '4px 10px',
                        color: trendHub.realtime ? '#6ee7b7' : '#9ca3af',
                      }}>
                        {trendHub.realtime ? '🟢' : '🔵'}
                        {trendHub.realtime ? (isEn ? `Live: ${trendHub.fetchedCount} items collected` : `실시간 ${trendHub.fetchedCount}건 수집 완료`) : (isEn ? 'AI Analysis Mode' : 'AI 자체 분석 모드')}
                      </div>
                      {/* 카테고리 뱃지 */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700,
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        borderRadius: 20, padding: '4px 10px',
                        color: '#fcd34d',
                      }}>
                        {[
                          { id: 'all', emoji: '🌐', label: '전체', labelEn: 'All' }, { id: 'travel', emoji: '✈️', label: '여행/맛집', labelEn: 'Travel/Food' },
                          { id: 'beauty', emoji: '💄', label: '뷰티/패션', labelEn: 'Beauty/Fashion' }, { id: 'finance', emoji: '💰', label: '재테크/돈', labelEn: 'Finance/Money' },
                          { id: 'fitness', emoji: '💪', label: '운동/다이어트', labelEn: 'Fitness/Diet' }, { id: 'mindset', emoji: '🔥', label: '자기계발', labelEn: 'Mindset' },
                          { id: 'food', emoji: '🍳', label: '요리/레시피', labelEn: 'Cooking' }, { id: 'it', emoji: '💻', label: 'IT/AI', labelEn: 'IT/AI' },
                          { id: 'daily', emoji: '💬', label: '일상/공감', labelEn: 'Daily' },
                        ].find(c => c.id === trendHubCategory)?.emoji ?? '🌐'}{' '}
                        {[
                          { id: 'all', label: '전체', labelEn: 'All' }, { id: 'travel', label: '여행/맛집', labelEn: 'Travel/Food' },
                          { id: 'beauty', label: '뷰티/패션', labelEn: 'Beauty/Fashion' }, { id: 'finance', label: '재테크/돈', labelEn: 'Finance/Money' },
                          { id: 'fitness', label: '운동/다이어트', labelEn: 'Fitness/Diet' }, { id: 'mindset', label: '자기계발', labelEn: 'Mindset' },
                          { id: 'food', label: '요리/레시피', labelEn: 'Cooking' }, { id: 'it', label: 'IT/AI', labelEn: 'IT/AI' },
                          { id: 'daily', label: '일상/공감', labelEn: 'Daily' },
                        ].find(c => c.id === trendHubCategory)?.[isEn ? 'labelEn' : 'label'] ?? (isEn ? 'All' : '전체')} {isEn ? 'Category' : '카테고리'}
                      </div>
                      {trendHub.fetchedAt && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(trendHub.fetchedAt).toLocaleTimeString(isEn ? 'en-US' : 'ko-KR', { hour: '2-digit', minute: '2-digit' })} {isEn ? 'updated' : '기준'}
                        </span>
                      )}
                    </div>

                    {/* 탭 전환 */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <button
                        onClick={() => setTrendHubTab('card')}
                        style={{
                          flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, borderRadius: 8,
                          border: trendHubTab === 'card' ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                          background: trendHubTab === 'card' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                          color: trendHubTab === 'card' ? '#fcd34d' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        📸 {isEn ? 'Card News Topics' : '카드뉴스 주제'} ({trendHub.cardTopics?.length ?? 0})
                      </button>
                      <button
                        onClick={() => setTrendHubTab('ai')}
                        style={{
                          flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 700, borderRadius: 8,
                          border: trendHubTab === 'ai' ? '1.5px solid #818cf8' : '1px solid rgba(255,255,255,0.1)',
                          background: trendHubTab === 'ai' ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.03)',
                          color: trendHubTab === 'ai' ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        ✍️ {isEn ? 'AI Writing Topics' : 'AI 글쓰기 주제'} ({trendHub.aiWritingTopics?.length ?? 0})
                      </button>
                    </div>

                    {/* 카드뉴스 주제 탭 */}
                    {trendHubTab === 'card' && trendHub.cardTopics && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {trendHub.cardTopics.map((item, i) => (
                          <div
                            key={i}
                            onClick={() => setTopic(item.keyword)}
                            style={{
                              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(245,158,11,0.15)',
                              borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                              transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.15)'; e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; }}
                          >
                            {/* 랭크 + 긴박도 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : i === 1 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0,
                              }}>{item.rank}</div>
                              <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                padding: '2px 8px', borderRadius: 20,
                                background: item.urgency === '즉시' ? 'rgba(239,68,68,0.2)' : item.urgency === '이번주' ? 'rgba(245,158,11,0.2)' : 'rgba(100,100,100,0.2)',
                                color: item.urgency === '즉시' ? '#fca5a5' : item.urgency === '이번주' ? '#fcd34d' : '#9ca3af',
                                border: item.urgency === '즉시' ? '1px solid rgba(239,68,68,0.4)' : item.urgency === '이번주' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(100,100,100,0.3)',
                              }}
                              >{item.urgency === '즉시' ? (isEn ? '🔥 Upload Now' : '🔥 즉시 업로드') : item.urgency === '이번주' ? (isEn ? '⚡ This Week' : '⚡ 이번주') : (isEn ? '📅 This Month' : '📅 이번달')}</div>
                              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ fontSize: 10, color: '#fbbf24', fontWeight: 800 }}>HOT {item.hotScore}</div>
                              </div>
                            </div>

                            {/* 키워드 제목 */}
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.4, wordBreak: 'keep-all' }}>
                              {item.keyword}
                            </div>

                            {/* 후킹 문구 */}
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fcd34d', marginBottom: 8, background: 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
                              💬 {isEn ? 'Slide Hook' : '슬라이드 후킹'}: "{item.hook}"
                            </div>

                            {/* 예상 조회수 + 이유 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '3px 8px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(59,130,246,0.3)' }}>
                                👁 {isEn ? 'Est.' : '예상'} {item.estimatedViews}
                              </div>
                              <div style={{ fontSize: 11, background: item.saves === '높음' ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)', color: item.saves === '높음' ? '#6ee7b7' : '#9ca3af', padding: '3px 8px', borderRadius: 4, fontWeight: 700, border: `1px solid ${item.saves === '높음' ? 'rgba(16,185,129,0.3)' : 'rgba(100,100,100,0.3)'}` }}>
                                💾 {isEn ? 'Save Rate' : '저장율'} {item.saves === '높음' ? (isEn ? 'High' : item.saves) : item.saves === '보통' ? (isEn ? 'Medium' : item.saves) : item.saves}
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4 }}>{item.source}</div>
                            </div>

                            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>💡 {item.reason}</div>

                            {/* 해시태그 */}
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {item.hashtags?.map((tag, ti) => (
                                <span key={ti} style={{ fontSize: 10, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(129,140,248,0.2)', fontWeight: 600 }}>{tag}</span>
                              ))}
                            </div>

                            {/* 클릭 힌트 */}
                            <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{isEn ? 'Tap to select topic →' : '탭하면 주제로 선택 →'}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI 글쓰기 주제 탭 */}
                    {trendHubTab === 'ai' && trendHub.aiWritingTopics && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {trendHub.aiWritingTopics.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(129,140,248,0.15)',
                              borderRadius: 12, padding: '14px 16px',
                              transition: 'all 0.2s', position: 'relative',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.background = 'rgba(129,140,248,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)'; e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; }}
                          >
                            {/* 랭크 + 경쟁도 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: i === 0 ? 'linear-gradient(135deg,#818cf8,#6366f1)' : i === 1 ? 'linear-gradient(135deg,#a78bfa,#8b5cf6)' : 'rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0,
                              }}>{item.rank}</div>
                              <div style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                background: item.competition === '낮음' ? 'rgba(16,185,129,0.15)' : item.competition === '보통' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: item.competition === '낮음' ? '#6ee7b7' : item.competition === '보통' ? '#fcd34d' : '#fca5a5',
                                border: `1px solid ${item.competition === '낮음' ? 'rgba(16,185,129,0.3)' : item.competition === '보통' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                              }}>{isEn ? 'Competition' : '경쟁도'} {item.competition === '낮음' ? (isEn ? 'Low' : item.competition) : item.competition === '보통' ? (isEn ? 'Medium' : item.competition) : item.competition === '높음' ? (isEn ? 'High' : item.competition) : item.competition}</div>
                              <div style={{ marginLeft: 'auto', fontSize: 10, color: '#a5b4fc', fontWeight: 800 }}>HOT {item.hotScore}</div>
                            </div>

                            {/* 키워드 */}
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#e0e7ff', marginBottom: 8, lineHeight: 1.4, wordBreak: 'keep-all' }}>
                              {item.keyword}
                            </div>

                            {/* 검색량 + 출처 */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 11, background: 'rgba(129,140,248,0.15)', color: '#a5b4fc', padding: '3px 8px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(129,140,248,0.3)' }}>
                                🔍 {isEn ? 'Monthly Search Vol.' : '월 검색량'} {item.searchVolume}
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4 }}>{item.source}</div>
                            </div>

                            {/* 글쓰기 각도 */}
                            <div style={{ fontSize: 12, color: '#a5b4fc', background: 'rgba(129,140,248,0.08)', padding: '8px 12px', borderRadius: 8, marginBottom: 8, lineHeight: 1.5, border: '1px solid rgba(129,140,248,0.15)' }}>
                              <strong style={{ color: '#c7d2fe' }}>✍️ {isEn ? 'Writing Angle:' : '글쓰기 각도:'}</strong> {item.contentAngle}
                            </div>

                            {/* 이유 */}
                            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>💡 {item.reason}</div>

                            {/* 롱테일 키워드 */}
                            {item.longtailKeywords && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{isEn ? 'Long-tail:' : '롱테일:'}</span>
                                {item.longtailKeywords.map((kw, ki) => (
                                  <span key={ki} style={{ fontSize: 10, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 7px', borderRadius: 20, border: '1px solid rgba(129,140,248,0.2)', fontWeight: 600 }}>{kw}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Topic */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">2</div>
                <div className="cn-step-title">{isEn ? 'Card News Topic' : '카드뉴스 주제'}</div>
              </div>
              <div className="cn-step-body">
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: recommendations.length > 0 ? 16 : 0 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>{isEn ? '💡 AI Card News Planner' : '💡 AI 카드뉴스 기획실'}</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{isEn ? `Get trending topic suggestions for '${categoryConfig[category].labelEn}' category.` : `위에서 선택한 '${categoryConfig[category].label}' 유형에 맞는 떡상 주제를 추천받아 보세요.`}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleRecommend('custom')} disabled={recommending} style={{ flex: 1, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', opacity: recommending ? 0.7 : 1, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.3)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'}>
                        {isEn ? '🎯 Custom Recommendations' : '🎯 맞춤 추천 받기'}
                      </button>
                      <button onClick={() => handleRecommend('viral')} disabled={recommending} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #f97316)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', opacity: recommending ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                        {isEn ? '🔥 Global Viral Trends' : '🔥 글로벌 떡상 트렌드'}
                      </button>
                    </div>
                  </div>
                  
                  {recommendations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {recommendations.map((rec, i) => (
                        <div key={i} onClick={() => { setTopic(rec.topic); const validCat = Object.keys(categoryConfig).find(k => categoryConfig[k as CardCategory].label === rec.category); if (validCat) setCategory(validCat as CardCategory); }} style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{rec.topic}</div>
                            {rec.viralScore && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', padding: '4px 8px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)' }}>
                                <span style={{ fontSize: 12 }}>🔥</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5' }}>{isEn ? `Top ${100 - rec.viralScore}%` : `상위 ${100 - rec.viralScore}%`}</span>
                              </div>
                            )}
                          </div>
                          
                          {rec.estimatedViews && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                              <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{isEn ? 'Est. Views' : '예상 조회수'}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{rec.estimatedViews}</span>
                            </div>
                          )}
                          
                          <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ marginTop: 2 }}>💡</span>
                            <span style={{ lineHeight: 1.5 }}>{rec.reason}</span>
                          </div>
                          
                          {rec.analysis && (
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, lineHeight: 1.5, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                              <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{isEn ? 'Analysis Report:' : '분석 리포트:'}</strong> {rec.analysis}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    id="topic"
                    type="text"
                    className="form-input"
                    placeholder={isEn ? 'e.g. The secret to 10x Instagram followers that 99% don\'t know' : '예: 99%가 모르는 인스타그램 팔로워 떡상 비밀'}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    maxLength={80}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  {isEn ? 'The more specific and provocative, the better. (e.g. "The worst diet foods even doctors won\'t eat")' : '자극적이고 구체적일수록 무조건 떡상합니다. (예: \u201c의사들도 절대 안 먹는 다이어트 최악의 음식\u201d)'}
                </div>
              </div>
            </div>

            {/* Step 3: Brand & Language */}
            <div className="cn-step">
              <div className="cn-step-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="cn-step-num">3</div>
                  <div className="cn-step-title">{isEn ? 'Settings' : '환경 설정'}</div>
                </div>
              </div>
              <div className="cn-step-body">
                <div className="form-control" style={{ marginBottom: 12 }}>
                  <label className="label"><span className="label-text" style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{isEn ? 'Brand Name' : '브랜드명'}</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="예: Migo, @migo_app"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text" style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>언어 (Language)</span></label>
                  <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
                    <button
                      className={`btn btn-sm flex-1 ${language === 'ko' ? 'btn-primary' : 'btn-ghost'}`}
                      style={language === 'ko' ? { background: '#ef4444', color: '#fff', border: 'none' } : { color: '#94a3b8' }}
                      onClick={() => setLanguage('ko')}
                    >
                      한국어
                    </button>
                    <button
                      className={`btn btn-sm flex-1 ${language === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                      style={language === 'en' ? { background: '#ef4444', color: '#fff', border: 'none' } : { color: '#94a3b8' }}
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Theme */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">4</div>
                <div className="cn-step-title">{isEn ? 'Theme' : '테마 선택'}</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-theme-grid">
                  {(Object.keys(themeConfig) as CardTheme[]).map(t => (
                    <button key={t} className={'cn-theme-btn' + (theme === t ? ' active' : '')} onClick={() => setTheme(t)}>
                      <div className="cn-theme-swatch" style={{ background: themeConfig[t].preview }} />
                      <span className="cn-theme-label">{isEn ? themeConfig[t].labelEn : themeConfig[t].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5: Layout */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">5</div>
                <div className="cn-step-title">{isEn ? 'Layout' : '레이아웃'}</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-layout-grid">
                  {(Object.keys(layoutConfig) as CardLayout[]).map(l => (
                    <button key={l} className={'cn-layout-btn' + (layout === l ? ' active' : '')} onClick={() => setLayout(l)}>
                      <span style={{ fontSize: 20 }}>{layoutConfig[l].icon}</span>
                      <div>
                        <div className="cn-layout-label">{isEn ? layoutConfig[l].labelEn : layoutConfig[l].label}</div>
                        <div className="cn-layout-desc">{isEn ? layoutConfig[l].descEn : layoutConfig[l].desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="cn-error"><AlertCircle size={14} /><span>{error}</span></div>
            )}



            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              onClick={handleGenerate}
              disabled={loading || !topic}
            >
              {loading ? (
                <><div className="spinner" />{loadingMsg || (isEn ? 'AI generating...' : 'AI 생성 중...')}</>
              ) : (
                <><LayoutGrid size={15} />{isEn ? 'Auto-Generate Card News' : '카드뉴스 자동 생성하기'}</>
              )}
            </button>
          </div>
        )}

        {/* EDITOR */}
        {step === 'editor' && slides.length > 0 && (
          <div className="cn-editor animate-fade-in">
            <div className="cn-editor-header">
              <button className="btn btn-secondary btn-sm" onClick={() => setStep('setup')}>{isEn ? '← Back to Setup' : '← 다시 설정'}</button>
              <div className="cn-editor-title">
                <LayoutGrid size={14} />
                {isEn ? `${slides.length} Card News Slides` : `${slides.length}장의 카드뉴스`}
                {isFallback && <span className="cn-fallback-badge">{isEn ? 'Sample Slides' : '샘플 슬라이드'}</span>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleRegenerate} disabled={loading}>
                <RefreshCw size={12} />{loading ? (loadingMsg || (isEn ? 'Generating...' : '생성 중...')) : (isEn ? 'Regenerate All' : '전체 재생성')}
              </button>
            </div>

            {isFallback && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16, alignItems: 'flex-start', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{isEn ? 'OpenAI credits exceeded. Sample slides loaded — edit the titles and body text to use them right away!' : 'OpenAI 크레딧 초과로 샘플 슬라이드를 불러왔어요. 제목과 본문을 직접 수정해서 바로 사용하세요!'}</span>
              </div>
            )}

            {imageError && !coverImageUrl && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 16, alignItems: 'flex-start', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>🖼️</span>
                <span>
                  <strong style={{ color: '#f87171' }}>{isEn ? 'Image generation failed' : '이미지 생성 실패'}</strong> — {isEn ? 'An error occurred while generating the image via OpenAI.' : 'OpenAI에서 이미지 생성 중 오류가 발생했어요.'}<br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{isEn ? 'Reason' : '원인'}: {imageError}</span><br />
                  <span style={{ opacity: 0.5 }}>{isEn ? 'Slide text was generated successfully. Use without images or add background images manually.' : '슬라이드 텍스트는 정상 생성됐습니다. 이미지 없이 사용하거나 Canva에서 직접 배경 이미지를 추가하세요.'}</span>
                </span>
              </div>
            )}

            {error && <div className="cn-error" style={{ marginBottom: 16 }}><AlertCircle size={14} /><span>{error}</span></div>}


            <div className="cn-editor-body">
              {/* ── 열 1: 슬라이드 목록 ── */}
              <div className="cn-slide-panel">
                {slides.map((s, i) => (
                  <div
                    key={s.id}
                    className={'cn-thumb' + (currentIdx === i ? ' active' : '')}
                    onClick={() => goTo(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && goTo(i)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      className="cn-thumb-mini"
                      style={{ background: i === 0 ? themeConfig[theme].coverBg : themeConfig[theme].bg, position: 'relative' }}
                    >
                      <span style={{ color: themeConfig[theme].text }}>{s.title}</span>
                      {slideVideos[i] && (
                        <div style={{ position: 'absolute', bottom: 2, right: 2, background: 'rgba(239,68,68,0.9)', borderRadius: 3, padding: '1px 4px', display: 'flex', alignItems: 'center' }}>
                          <Film size={7} color="#fff" />
                        </div>
                      )}
                    </div>
                    <div className="cn-thumb-num">{i + 1}</div>
                    {/* 삭제 버튼 */}
                    <button
                      className="cn-thumb-del"
                      onClick={e => { e.stopPropagation(); deleteSlide(i); }}
                      title={t.thumbDel}
                    >
                      <Trash2 size={9} />
                    </button>
                    {/* 순서 이동 버튼 */}
                    {currentIdx === i && (
                      <div className="cn-thumb-move-btns">
                        <button
                          className="cn-thumb-move"
                          onClick={e => { e.stopPropagation(); moveSlide(i, i - 1); }}
                          disabled={i === 0}
                          title={t.thumbUp}
                        >
                          <ArrowUp size={8} />
                        </button>
                        <button
                          className="cn-thumb-move"
                          onClick={e => { e.stopPropagation(); moveSlide(i, i + 1); }}
                          disabled={i === slides.length - 1}
                          title={t.thumbDown}
                        >
                          <ArrowDown size={8} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button className="cn-thumb-add" onClick={addSlide} title={t.addCut}>
                  <Plus size={14} />
                  <span style={{ fontSize: 9, marginLeft: 4 }}>{t.thumbAdd}</span>
                </button>
              </div>

              {/* ── 열 2: 미리보기 ── */}
              <div className="cn-preview-area">
                <div className="cn-preview-wrap" ref={previewRef}>
                  {renderPreview(currentIdx)}
                </div>

                {/* 네비게이션 */}
                <div className="cn-nav">
                  <button className="cn-nav-btn" onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="cn-nav-count">{currentIdx + 1} / {slides.length}</span>
                  <button className="cn-nav-btn" onClick={() => goTo(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1}>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* 테마 스위처 */}
                <div className="cn-theme-switcher">
                  {(Object.keys(themeConfig) as CardTheme[]).map(t => (
                    <button
                      key={t}
                      className={'cn-theme-mini' + (theme === t ? ' active' : '')}
                      onClick={() => setTheme(t)}
                      title={themeConfig[t].label}
                      style={{ background: themeConfig[t].preview }}
                    />
                  ))}
                </div>
              </div>

              {/* Edit Panel */}
              <div className="cn-edit-panel">
                {/* 컷 관리 버튼 */}
                <div className="cn-slide-actions">
                  <button
                    className="cn-action-btn cn-action-add"
                    onClick={() => addSlideAt(currentIdx)}
                    title={t.addAfter}
                  >
                    <Plus size={13} /> {t.addCut}
                  </button>
                  <button
                    className="cn-action-btn cn-action-delete"
                    onClick={() => { if (slides.length > 1 && confirm(t.confirmDelete(currentIdx + 1))) deleteSlide(currentIdx); }}
                    disabled={slides.length <= 1}
                    title={t.deleteCurrent}
                  >
                    <Trash2 size={13} /> {t.deleteCut}
                  </button>
                  <button
                    className="cn-action-btn cn-action-move"
                    onClick={() => moveSlide(currentIdx, currentIdx - 1)}
                    disabled={currentIdx === 0}
                    title={t.moveUp}
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    className="cn-action-btn cn-action-move"
                    onClick={() => moveSlide(currentIdx, currentIdx + 1)}
                    disabled={currentIdx === slides.length - 1}
                    title={t.moveDown}
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                <div className="cn-panel-divider" />

                {/* 자막 / 오버레이 토글 */}
                <div className="cn-panel-section">
                  <div className="cn-panel-label">{t.displaySettings}</div>
                  <div className="cn-toggle-group">
                    <label className="cn-toggle-row">
                      <span className="cn-toggle-label">{t.showText}</span>
                      <button
                        className={'cn-toggle-switch' + (slideHideText[currentIdx] ? '' : ' active')}
                        onClick={() => {
                          const next = [...slideHideText];
                          next[currentIdx] = !next[currentIdx];
                          setSlideHideText(next);
                        }}
                      >
                        <span className="cn-toggle-knob" />
                      </button>
                    </label>
                    <label className="cn-toggle-row">
                      <span className="cn-toggle-label">{t.showOverlay}</span>
                      <button
                        className={'cn-toggle-switch' + (slideHideOverlay[currentIdx] ? '' : ' active')}
                        onClick={() => {
                          const next = [...slideHideOverlay];
                          next[currentIdx] = !next[currentIdx];
                          setSlideHideOverlay(next);
                        }}
                      >
                        <span className="cn-toggle-knob" />
                      </button>
                    </label>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6, lineHeight: 1.4 }}>
                    {t.displayHint}
                  </div>
                </div>

                <div className="cn-panel-divider" />

                <div className="cn-panel-section">
                  <div className="cn-panel-label"><Type size={12} />{t.title}</div>
                  <textarea className="cn-textarea" rows={3} value={editSlide?.title ?? ''} onChange={e => updateSlide('title', e.target.value)} placeholder={t.titlePlaceholder} />
                </div>

                {currentIdx !== 0 && (
                  <div className="cn-panel-section">
                    <div className="cn-panel-label"><AlignLeft size={12} />{t.body}</div>
                    <textarea className="cn-textarea" rows={5} value={editSlide?.body ?? ''} onChange={e => updateSlide('body', e.target.value)} placeholder={t.bodyPlaceholder} />
                  </div>
                )}

                <div className="cn-panel-section">
                  <div className="cn-panel-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t.bgImage}</span>
                    <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {t.fileUpload}
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const val = event.target?.result as string;
                            if (currentIdx === 0) {
                              setCoverImageUrl(val);
                            } else {
                              const newImages = [...slideImages];
                              newImages[currentIdx] = val;
                              setSlideImages(newImages);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    className="cn-textarea"
                    style={{ minHeight: 'auto', padding: '8px 12px', marginTop: 4 }}
                    placeholder={t.imgUrlPlaceholder}
                    value={currentIdx === 0 ? (coverImageUrl || '') : (slideImages[currentIdx] || '')}
                    onChange={e => {
                      const val = e.target.value || null;
                      if (currentIdx === 0) {
                        setCoverImageUrl(val);
                      } else {
                        const newImages = [...slideImages];
                        newImages[currentIdx] = val;
                        setSlideImages(newImages);
                      }
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>
                    {t.imgHint}<br/>
                    {t.imgHint2}
                  </div>
                </div>

                {/* 🎥 비디오 추가 영역 */}
                <div className="cn-panel-section">
                  <div className="cn-panel-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{t.bgVideo}</span>
                    <label style={{ cursor: 'pointer', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))', padding: '2px 10px', borderRadius: 4, fontSize: 11, color: '#fca5a5', fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Film size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {t.videoUpload}
                      <input
                        type="file"
                        accept="video/mp4, video/webm, video/quicktime"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // 50MB 제한
                          if (file.size > 50 * 1024 * 1024) {
                            alert(t.videoSizeError);
                            return;
                          }
                          const url = URL.createObjectURL(file);
                          const newVideos = [...slideVideos];
                          newVideos[currentIdx] = url;
                          setSlideVideos(newVideos);
                        }}
                      />
                    </label>
                  </div>
                  {slideVideos[currentIdx] ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <video
                          src={slideVideos[currentIdx]!}
                          style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }}
                          autoPlay muted loop playsInline
                        />
                        <div style={{
                          position: 'absolute', top: 6, right: 6,
                          display: 'flex', gap: 4,
                        }}>
                          <button
                            onClick={() => {
                              const newVideos = [...slideVideos];
                              if (newVideos[currentIdx]) URL.revokeObjectURL(newVideos[currentIdx]!);
                              newVideos[currentIdx] = null;
                              setSlideVideos(newVideos);
                            }}
                            style={{
                              background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4,
                              padding: '3px 8px', cursor: 'pointer',
                              fontSize: 10, color: '#f87171', fontWeight: 600,
                            }}
                          >
                            <Trash2 size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />{t.videoRemove}
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                        {t.videoApplied}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
                      {t.videoHint}<br/>
                      <span style={{ color: 'rgba(245,158,11,0.7)' }}>{t.videoReelsHint}</span>
                    </div>
                  )}
                </div>

                <div className="cn-panel-divider" />

                {/* 이미지 다운로드 버튼 */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderColor: 'transparent' }}
                  onClick={handleDownloadCurrent}
                  disabled={downloading}
                >
                  {downloading
                    ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />{t.savingPng}</>
                    : <><Download size={13} />{t.downloadPng}</>}
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: 6 }}
                  onClick={handleDownloadAll}
                  disabled={downloadingAll || downloadingVideo}
                >
                  {downloadingAll
                    ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />{t.processingZip(slides.length)}</>
                    : <><Download size={13} />{t.downloadZip}</>}
                </button>

                {/* 팜플렛 추가 영역 */}
                <div style={{ marginTop: 12, marginBottom: 8, background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{t.pamphlet}</span>
                    <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#fff' }}>
                      {t.pamphletUpload}
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => setPamphletUrl(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  {pamphletUrl ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <img src={pamphletUrl} alt="pamphlet" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />
                      <button onClick={() => setPamphletUrl(null)} style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>{t.pamphletRemove}</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{t.pamphletHint}</div>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 4, background: 'linear-gradient(135deg, #ef4444, #f97316)', borderColor: 'transparent', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }}
                  onClick={handleDownloadVideo}
                  disabled={downloadingAll || downloadingVideo}
                >
                  {downloadingVideo
                    ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />{t.renderingVideo}</>
                    : <><Download size={13} />{t.downloadReels}</>}
                </button>

                <div className="cn-panel-divider" />

                <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => handleCopySlide(slides[currentIdx], currentIdx)}>
                  {copiedIdx === currentIdx ? <><Check size={13} /> {isEn ? 'Text copied!' : '텍스트 복사됨!'}</> : <><Copy size={13} /> {isEn ? 'Copy text' : '텍스트만 복사'}</>}
                </button>

                <div className="cn-tip" style={{ marginTop: 8 }}>
                  <Info size={11} />
                  <span>{isEn ? 'Save PNG → Upload directly to Instagram! ✨' : 'PNG 저장 → 인스타그램에 바로 업로드! ✨'}</span>
                </div>
              </div>
            </div>

            {/* 캡션 + 해시태그 패널 */}
            {(caption || hashtags.length > 0) && (
              <div className="cn-caption-panel">
                <div className="cn-caption-header">
                  <div className="cn-caption-title">{isEn ? '📝 Instagram Post' : '📝 인스타그램 게시글'}</div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{isEn ? 'Caption to use with your card news' : '카드뉴스와 함께 사용할 캡션이에요'}</span>
                </div>

                {caption && (
                  <div className="cn-caption-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="cn-panel-label" style={{ marginBottom: 0 }}><Type size={12} />{isEn ? 'Post Caption' : '게시글 본문'}</div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={async () => {
                          await navigator.clipboard.writeText(caption);
                          setCaptionCopied(true);
                          setTimeout(() => setCaptionCopied(false), 2000);
                        }}
                      >
                        {captionCopied ? <><Check size={11} /> {isEn ? 'Copied!' : '복사됨!'}</> : <><Copy size={11} /> {isEn ? 'Copy' : '복사'}</>}
                      </button>
                    </div>
                    <textarea className="cn-textarea" rows={5} value={caption} onChange={e => setCaption(e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                )}

                {hashtags.length > 0 && (
                  <div className="cn-caption-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="cn-panel-label" style={{ marginBottom: 0 }}># {isEn ? `Hashtags (${hashtags.length})` : `해시태그 ${hashtags.length}개`}</div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={async () => {
                          const formattedTags = hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
                          await navigator.clipboard.writeText(formattedTags);
                          setHashtagsCopied(true);
                          setTimeout(() => setHashtagsCopied(false), 2000);
                        }}
                      >
                        {hashtagsCopied ? <><Check size={11} /> {isEn ? 'Copied!' : '복사됨!'}</> : <><Copy size={11} /> {isEn ? 'Copy all' : '전체 복사'}</>}
                      </button>
                    </div>
                    <div className="cn-hashtag-chips">
                      {hashtags.map((tag, i) => (
                        <span key={i} className="cn-hashtag-chip">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cn-tip" style={{ marginTop: 4 }}>
                  <Info size={11} />
                  <span>{isEn ? 'Copy caption → Paste into new Instagram post and attach card images!' : '캡션 복사 → 인스타그램 새 게시물에 붙여넣기 후 카드뉴스 이미지 첨부!'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 전체 다운로드용 숨겨진 렌더링 영역 */}
      <div
        ref={hiddenRenderRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: 1200,
          height: 1200,
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
  );
}

// brandName이 InnerCard에서 사용되도록 전역에서 접근 불가 — prop으로 전달 필요
// 위 isLast 블록의 brandName은 실제로 외부 스코프에 없으므로 prop 추가 필요
// InnerCard에 brandName prop 추가됨 (아래 타입 선언이 자동 적용됨)
