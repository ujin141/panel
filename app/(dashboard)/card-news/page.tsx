'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Copy, ChevronLeft, ChevronRight,
  Type, LayoutGrid, Info,
  RefreshCw, Check, Plus, Trash2, AlignLeft,
  AlertCircle,
} from 'lucide-react';
import './card-news.css';

// Types
type CardTheme = 'migo' | 'dark' | 'light' | 'gradient-pink' | 'gradient-purple' | 'gradient-blue' | 'black' | 'gradient-orange' | 'gradient-green';
type CardLayout = 'title-center' | 'title-top' | 'big-number' | 'quote';
type CardCategory = 'tips' | 'facts' | 'story' | 'promo' | 'howto';

interface CardSlide {
  id: string;
  title: string;
  body: string;
  tag?: string;
  number?: string;
}

// Theme configs
const themeConfig: Record<CardTheme, {
  label: string; bg: string; coverBg: string; text: string;
  accent: string; preview: string; isDark: boolean; decorColor: string; accentDot?: string;
}> = {
  migo: {
    label: 'Migo 브랜드', isDark: true,
    bg: 'linear-gradient(135deg, #3ECFB8, #5BB8F5)',
    coverBg: 'linear-gradient(145deg, #2dd4bf 0%, #38bdf8 55%, #60a5fa 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.92)', preview: '#38c9c0',
    decorColor: 'rgba(255,255,255,0.12)', accentDot: '#FFB800',
  },
  dark: {
    label: '다크', isDark: true,
    bg: '#111',
    coverBg: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.7)', preview: '#1a1a2e',
    decorColor: 'rgba(255,255,255,0.05)',
  },
  light: {
    label: '화이트', isDark: false,
    bg: '#fafafa',
    coverBg: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
    text: '#111', accent: '#555', preview: '#e2e8f0',
    decorColor: 'rgba(0,0,0,0.04)',
  },
  'gradient-pink': {
    label: '핑크', isDark: true,
    bg: 'linear-gradient(135deg,#f953c6,#b91d73)',
    coverBg: 'linear-gradient(145deg, #ff6bcb 0%, #f953c6 40%, #b91d73 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#f953c6',
    decorColor: 'rgba(255,255,255,0.12)',
  },
  'gradient-purple': {
    label: '퍼플', isDark: true,
    bg: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    coverBg: 'linear-gradient(145deg, #9f68ff 0%, #7c3aed 40%, #4f46e5 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#7c3aed',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-blue': {
    label: '블루', isDark: true,
    bg: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
    coverBg: 'linear-gradient(145deg, #38bdf8 0%, #0ea5e9 40%, #1d4ed8 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#0ea5e9',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-orange': {
    label: '오렌지', isDark: true,
    bg: 'linear-gradient(135deg,#f97316,#dc2626)',
    coverBg: 'linear-gradient(145deg, #fb923c 0%, #f97316 40%, #dc2626 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#f97316',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  'gradient-green': {
    label: '그린', isDark: true,
    bg: 'linear-gradient(135deg,#10b981,#059669)',
    coverBg: 'linear-gradient(145deg, #34d399 0%, #10b981 40%, #047857 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.9)', preview: '#10b981',
    decorColor: 'rgba(255,255,255,0.1)',
  },
  black: {
    label: '블랙', isDark: true,
    bg: '#000',
    coverBg: 'linear-gradient(145deg, #111 0%, #000 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.6)', preview: '#111',
    decorColor: 'rgba(255,255,255,0.04)',
  },
};

const layoutConfig: Record<CardLayout, { label: string; desc: string; icon: string }> = {
  'title-center': { label: '중앙 정렬', desc: '제목이 카드 중앙에 크게 표시', icon: '⊞' },
  'title-top':    { label: '상단 정렬', desc: '제목 상단 + 본문 하단 배치',   icon: '⊟' },
  'big-number':   { label: '번호형',   desc: '큰 숫자로 시선 집중',            icon: '①' },
  'quote':        { label: '인용구형', desc: '따옴표 스타일의 임팩트 문장',    icon: '❝' },
};

const categoryConfig: Record<CardCategory, { label: string; emoji: string; desc: string }> = {
  tips:  { label: '꿀팁/노하우', emoji: '💡', desc: '실용적인 팁을 나열하는 카드뉴스' },
  facts: { label: '통계/사실',   emoji: '📊', desc: '숫자와 데이터로 신뢰감을 주는 카드' },
  story: { label: '스토리/경험', emoji: '💬', desc: '공감가는 이야기 형식의 카드뉴스' },
  promo: { label: '홍보/소개',   emoji: '🚀', desc: '서비스나 제품을 소개하는 카드' },
  howto: { label: '방법/순서',   emoji: '📋', desc: '단계별 방법을 설명하는 카드뉴스' },
};

function toBrandHandle(name: string) {
  return name.replace('@', '').toLowerCase().replace(/\s/g, '_');
}

// Cover Card
function CoverCard({ slide, theme, brandName, topic, coverImageUrl }: {
  slide: CardSlide; theme: CardTheme; brandName: string; topic: string; coverImageUrl?: string;
}) {
  const t = themeConfig[theme];
  const emoji = topic.includes('뷰티') || topic.includes('스킨') ? '✨' :
    topic.includes('재테크') || topic.includes('돈') || topic.includes('투자') ? '💰' :
    topic.includes('운동') || topic.includes('다이어트') || topic.includes('헬스') ? '💪' :
    topic.includes('인스타') || topic.includes('SNS') || topic.includes('마케팅') ? '📱' :
    topic.includes('루틴') || topic.includes('아침') ? '🌅' :
    topic.includes('요리') || topic.includes('식단') || topic.includes('음식') ? '🍽️' :
    topic.includes('여행') ? '✈️' :
    topic.includes('독서') || topic.includes('책') ? '📚' : '🎯';

  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      padding: 0, boxSizing: 'border-box',
      background: coverImageUrl ? `url(${coverImageUrl}) center/cover no-repeat` : t.coverBg,
    }}>
      {/* 이미지 위 오버레이 */}
      {coverImageUrl && (
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
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <div style={{
          background: coverImageUrl ? 'rgba(255,255,255,0.18)' : (t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
          backdropFilter: 'blur(8px)',
          border: coverImageUrl ? '1px solid rgba(255,255,255,0.35)' : `1px solid ${t.accentDot || 'rgba(255,255,255,0.2)'}`,
          borderRadius: 999,
          padding: '5px 13px',
          fontSize: 12, fontWeight: 800,
          color: coverImageUrl ? '#fff' : (t.isDark ? '#fff' : '#111'),
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {brandName}
        </div>
      </div>

      {/* 하단 제목 영역 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 26px 26px', zIndex: 3 }}>
        {t.accentDot && !coverImageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accentDot }} />
            <div style={{ width: 30, height: 2, background: t.accentDot, borderRadius: 1 }} />
          </div>
        )}
        <div style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'pre-line',
          letterSpacing: '-0.03em',
          color: coverImageUrl ? '#fff' : (t.isDark ? '#fff' : '#111'),
          textShadow: coverImageUrl ? '0 2px 12px rgba(0,0,0,0.5)' : 'none',
          marginBottom: 12,
        }}>
          {slide.title || '카드뉴스 제목'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ height: 2, width: 20, background: coverImageUrl ? 'rgba(255,255,255,0.6)' : (t.accentDot || 'rgba(255,255,255,0.4)'), borderRadius: 1 }} />
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: coverImageUrl ? 'rgba(255,255,255,0.7)' : (t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }}>01 / 05</div>
        </div>
      </div>
    </div>
  );
}

// Inner Card
function InnerCard({ slide, theme, layout, index, total, brandName }: {
  slide: CardSlide; theme: CardTheme; layout: CardLayout; index: number; total: number; brandName: string;
}) {
  const t = themeConfig[theme];
  const isLast = index === total - 1;
  const isCenter = layout === 'title-center';
  const numColors = ['#6366f1','#ec4899','#10b981','#f59e0b','#06b6d4'];
  const numColor = numColors[(index - 1) % numColors.length];

  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      justifyContent: isCenter ? 'center' : 'space-between',
      alignItems: isCenter ? 'center' : 'flex-start',
      padding: 26, boxSizing: 'border-box',
      textAlign: isCenter ? 'center' : 'left',
      background: t.bg,
    }}>
      {/* 그라디언트 배경 장식 */}
      {(theme === 'gradient-pink' || theme === 'gradient-purple' || theme === 'gradient-blue' || theme === 'gradient-orange' || theme === 'gradient-green') && (
        <>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        </>
      )}

      {/* 상단: 슬라이드 번호 비주얼 + 브랜드 */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* 슬라이드 번호 - 컬러풀하게 */}
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
        {/* 브랜드명 - 우상단 고정 */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          border: `1px solid ${t.accentDot || (t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)')}`,
          borderRadius: 999,
          padding: '3px 10px',
          color: t.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
          marginLeft: 'auto',
        }}>
          {brandName}
        </div>
      </div>

      {/* 중간: 제목 + 본문 */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '10px 0' }}>
        {layout === 'big-number' && slide.number && (
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.85, color: t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', marginBottom: 6, letterSpacing: '-0.05em' }}>{slide.number}</div>
        )}
        {layout === 'quote' && (
          <div style={{ fontSize: 56, lineHeight: 0.7, color: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', marginBottom: 10, fontFamily: 'Georgia,serif' }}>&ldquo;</div>
        )}
        {slide.tag && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: t.accent, marginBottom: 10, textTransform: 'uppercase', opacity: 0.6 }}>{slide.tag}</div>
        )}
        <div style={{ fontSize: 21, fontWeight: 800, color: t.text, lineHeight: 1.3, marginBottom: slide.body ? 10 : 0, whiteSpace: 'pre-line', letterSpacing: '-0.02em' }}>
          {slide.title || '슬라이드 제목'}
        </div>
        {slide.body && (
          <div style={{ fontSize: 12, lineHeight: 1.8, color: t.accent, whiteSpace: 'pre-line' }}>{slide.body}</div>
        )}
      </div>

      {/* 하단: 진행 바 */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ height: 2, background: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(index / (total - 1)) * 100}%`, background: numColor, borderRadius: 1, transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function CardNewsPage() {
  const [step,      setStep]      = useState<'setup' | 'editor'>('setup');
  const [category, setCategory]  = useState<CardCategory>('tips');
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

  const handleGenerate = async () => {
    if (!topic) { setError('주제를 입력해주세요'); return; }
    setLoading(true); setError(''); setIsFallback(false);
    setLoadingMsg('AI가 슬라이드 구성 중...');
    setTimeout(() => setLoadingMsg('카드뉴스 텍스트 작성 중... ✍️'), 1200);
    try {
      const res = await fetch('/api/card-news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category, theme, brandName: brandName || 'My Brand' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '생성 실패' }));
        throw new Error(err.error || '생성에 실패했습니다');
      }
      const data = await res.json();
      setSlides(data.slides || []);
      if (data.fallback) setIsFallback(true);
      setCoverImageUrl(data.coverImageUrl || null);
      setImageError(data.imageError || null);
      setCaption(data.caption?.caption || '');
      setHashtags(data.caption?.hashtags || []);
      setCurrentIdx(0);
      setEditSlide(data.slides?.[0] ?? null);
      setStep('editor');
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false); setLoadingMsg('');
    }
  };

  const handleRegenerate = async () => {
    setLoading(true); setError(''); setIsFallback(false);
    setLoadingMsg('새 슬라이드 생성 중...');
    try {
      const res = await fetch('/api/card-news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, category, theme, brandName: brandName || 'My Brand' }),
      });
      if (!res.ok) throw new Error('재생성 실패');
      const data = await res.json();
      setSlides(data.slides || []);
      if (data.fallback) setIsFallback(true);
      setCoverImageUrl(data.coverImageUrl || null);
      setCaption(data.caption?.caption || '');
      setHashtags(data.caption?.hashtags || []);
      setCurrentIdx(0);
      setEditSlide(data.slides?.[0] ?? null);
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
    const ns: CardSlide = { id: Date.now().toString(), title: '새 슬라이드', body: '내용을 입력하세요', tag: total + ' / ' + total };
    const next = [...slides, ns];
    setSlides(next); setCurrentIdx(next.length - 1); setEditSlide(ns);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, i) => i !== idx);
    const ni = Math.min(idx, next.length - 1);
    setSlides(next); setCurrentIdx(ni); setEditSlide(next[ni]);
  };

  const goTo = (idx: number) => { setCurrentIdx(idx); setEditSlide(slides[idx]); };

  const handleCopySlide = async (slide: CardSlide, idx: number) => {
    await navigator.clipboard.writeText([slide.title, slide.body].filter(Boolean).join('\n\n'));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleExportAll = () => {
    const text = slides.map((s, i) => '[슬라이드 ' + (i + 1) + ']\n제목: ' + s.title + (s.body ? '\n본문: ' + s.body : '')).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  const renderPreview = (idx: number) => {
    if (!slides[idx]) return null;
    if (idx === 0) {
      return <CoverCard slide={slides[idx]} theme={theme} brandName={brandName || 'My Brand'} topic={topic} coverImageUrl={coverImageUrl || undefined} />;
    }
    return <InnerCard slide={slides[idx]} theme={theme} layout={layout} index={idx} total={slides.length} brandName={brandName || 'My Brand'} />;
  };

  return (
    <div>
      <Header title="카드뉴스 제작" subtitle="주제를 입력하면 AI가 슬라이드 텍스트를 자동으로 만들어드려요" />
      <div className="page-container animate-fade-in">

        {/* SETUP */}
        {step === 'setup' && (
          <div className="cn-setup">

            {/* Step 1: Topic */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">1</div>
                <div className="cn-step-title">카드뉴스 주제</div>
              </div>
              <div className="cn-step-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    id="topic"
                    type="text"
                    className="form-input"
                    placeholder="예: 인스타그램 팔로워 1000명 모으는 법"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                    maxLength={80}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                  구체적일수록 더 좋은 카드뉴스가 만들어져요 (예: &ldquo;다이어트 5가지 꿀팁&rdquo;)
                </div>
              </div>
            </div>

            {/* Step 2: Brand */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">2</div>
                <div className="cn-step-title">브랜드명 (선택)</div>
              </div>
              <div className="cn-step-body">
                <input
                  id="brandName"
                  type="text"
                  className="form-input"
                  placeholder="예: Migo, @migo_app"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            {/* Step 3: Category */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">3</div>
                <div className="cn-step-title">카드뉴스 유형</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-category-grid">
                  {(Object.keys(categoryConfig) as CardCategory[]).map(c => (
                    <button key={c} className={'cn-category-btn' + (category === c ? ' active' : '')} onClick={() => setCategory(c)}>
                      <span className="cn-category-emoji">{categoryConfig[c].emoji}</span>
                      <span className="cn-category-label">{categoryConfig[c].label}</span>
                      <span className="cn-category-desc">{categoryConfig[c].desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Theme */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">4</div>
                <div className="cn-step-title">테마 선택</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-theme-grid">
                  {(Object.keys(themeConfig) as CardTheme[]).map(t => (
                    <button key={t} className={'cn-theme-btn' + (theme === t ? ' active' : '')} onClick={() => setTheme(t)}>
                      <div className="cn-theme-swatch" style={{ background: themeConfig[t].preview }} />
                      <span className="cn-theme-label">{themeConfig[t].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5: Layout */}
            <div className="cn-step">
              <div className="cn-step-header">
                <div className="cn-step-num">5</div>
                <div className="cn-step-title">레이아웃</div>
              </div>
              <div className="cn-step-body">
                <div className="cn-layout-grid">
                  {(Object.keys(layoutConfig) as CardLayout[]).map(l => (
                    <button key={l} className={'cn-layout-btn' + (layout === l ? ' active' : '')} onClick={() => setLayout(l)}>
                      <span style={{ fontSize: 20 }}>{layoutConfig[l].icon}</span>
                      <div>
                        <div className="cn-layout-label">{layoutConfig[l].label}</div>
                        <div className="cn-layout-desc">{layoutConfig[l].desc}</div>
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
                <><div className="spinner" />{loadingMsg || 'AI 생성 중...'}</>
              ) : (
                <><LayoutGrid size={15} />카드뉴스 자동 생성하기</>
              )}
            </button>
          </div>
        )}

        {/* EDITOR */}
        {step === 'editor' && slides.length > 0 && (
          <div className="cn-editor animate-fade-in">
            <div className="cn-editor-header">
              <button className="btn btn-secondary btn-sm" onClick={() => setStep('setup')}>← 다시 설정</button>
              <div className="cn-editor-title">
                <LayoutGrid size={14} />
                {slides.length}장의 카드뉴스
                {isFallback && <span className="cn-fallback-badge">샘플 슬라이드</span>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleRegenerate} disabled={loading}>
                <RefreshCw size={12} />{loading ? (loadingMsg || '생성 중...') : '전체 재생성'}
              </button>
            </div>

            {isFallback && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16, alignItems: 'flex-start', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>OpenAI 크레딧 초과로 샘플 슬라이드를 불러왔어요. 제목과 본문을 직접 수정해서 바로 사용하세요!</span>
              </div>
            )}

            {imageError && !coverImageUrl && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 16, alignItems: 'flex-start', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>🖼️</span>
                <span>
                  <strong style={{ color: '#f87171' }}>이미지 생성 실패</strong> — OpenAI에서 이미지 생성 중 오류가 발생했어요.<br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>원인: {imageError}</span><br />
                  <span style={{ opacity: 0.5 }}>슬라이드 텍스트는 정상 생성됐습니다. 이미지 없이 사용하거나 Canva에서 직접 배경 이미지를 추가하세요.</span>
                </span>
              </div>
            )}

            {error && <div className="cn-error" style={{ marginBottom: 16 }}><AlertCircle size={14} /><span>{error}</span></div>}


            <div className="cn-editor-body">
              {/* ── 열 1: 슬라이드 목록 ── */}
              <div className="cn-slide-panel">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    className={'cn-thumb' + (currentIdx === i ? ' active' : '')}
                    onClick={() => goTo(i)}
                  >
                    <div
                      className="cn-thumb-mini"
                      style={{ background: i === 0 ? themeConfig[theme].coverBg : themeConfig[theme].bg }}
                    >
                      <span style={{ color: themeConfig[theme].text }}>{s.title}</span>
                    </div>
                    <div className="cn-thumb-num">{i + 1}</div>
                    <button
                      className="cn-thumb-del"
                      onClick={e => { e.stopPropagation(); deleteSlide(i); }}
                    >
                      <Trash2 size={9} />
                    </button>
                  </button>
                ))}
                <button className="cn-thumb-add" onClick={addSlide}>
                  <Plus size={14} />
                </button>
              </div>

              {/* ── 열 2: 미리보기 ── */}
              <div className="cn-preview-area">
                <div className="cn-preview-wrap">
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
                <div className="cn-panel-section">
                  <div className="cn-panel-label"><Type size={12} />제목</div>
                  <textarea className="cn-textarea" rows={3} value={editSlide?.title ?? ''} onChange={e => updateSlide('title', e.target.value)} placeholder="카드 제목" />
                </div>

                {currentIdx !== 0 && (
                  <div className="cn-panel-section">
                    <div className="cn-panel-label"><AlignLeft size={12} />본문</div>
                    <textarea className="cn-textarea" rows={5} value={editSlide?.body ?? ''} onChange={e => updateSlide('body', e.target.value)} placeholder="본문 내용" />
                  </div>
                )}

                <div className="cn-panel-divider" />

                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleCopySlide(slides[currentIdx], currentIdx)}>
                  {copiedIdx === currentIdx ? <><Check size={13} /> 복사됨!</> : <><Copy size={13} /> 텍스트 복사하기</>}
                </button>

                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 6 }} onClick={handleExportAll}>
                  전체 텍스트 내보내기
                </button>

                <div className="cn-tip">
                  <Info size={11} />
                  <span>텍스트 복사 → Canva에서 배경 위에 붙여넣기하면 바로 완성! ✨</span>
                </div>
              </div>
            </div>

            {/* 캡션 + 해시태그 패널 */}
            {(caption || hashtags.length > 0) && (
              <div className="cn-caption-panel">
                <div className="cn-caption-header">
                  <div className="cn-caption-title">📝 인스타그램 게시글</div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>카드뉴스와 함께 사용할 캡션이에요</span>
                </div>

                {caption && (
                  <div className="cn-caption-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="cn-panel-label" style={{ marginBottom: 0 }}><Type size={12} />게시글 본문</div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={async () => {
                          await navigator.clipboard.writeText(caption);
                          setCaptionCopied(true);
                          setTimeout(() => setCaptionCopied(false), 2000);
                        }}
                      >
                        {captionCopied ? <><Check size={11} /> 복사됨!</> : <><Copy size={11} /> 복사</>}
                      </button>
                    </div>
                    <textarea className="cn-textarea" rows={5} value={caption} onChange={e => setCaption(e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                )}

                {hashtags.length > 0 && (
                  <div className="cn-caption-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="cn-panel-label" style={{ marginBottom: 0 }}># 해시태그 {hashtags.length}개</div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={async () => {
                          await navigator.clipboard.writeText(hashtags.join(' '));
                          setHashtagsCopied(true);
                          setTimeout(() => setHashtagsCopied(false), 2000);
                        }}
                      >
                        {hashtagsCopied ? <><Check size={11} /> 복사됨!</> : <><Copy size={11} /> 전체 복사</>}
                      </button>
                    </div>
                    <div className="cn-hashtag-chips">
                      {hashtags.map((tag, i) => (
                        <span key={i} className="cn-hashtag-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cn-tip" style={{ marginTop: 4 }}>
                  <Info size={11} />
                  <span>캡션 복사 → 인스타그램 새 게시물에 붙여넣기 후 카드뉴스 이미지 첨부!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// brandName이 InnerCard에서 사용되도록 전역에서 접근 불가 — prop으로 전달 필요
// 위 isLast 블록의 brandName은 실제로 외부 스코프에 없으므로 prop 추가 필요
// InnerCard에 brandName prop 추가됨 (아래 타입 선언이 자동 적용됨)
