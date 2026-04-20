'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Sparkles, Download, Copy, ChevronLeft, ChevronRight,
  Type, Palette, LayoutGrid, Info,
  RefreshCw, Check, Plus, Trash2, AlignLeft,
  AlertCircle, Loader2,
} from 'lucide-react';
import './card-news.css';

// ─── Types ──────────────────────────────────────────────────────────────────
type CardTheme    = 'migo' | 'dark' | 'light' | 'gradient-pink' | 'gradient-purple' | 'gradient-blue' | 'black' | 'gradient-orange' | 'gradient-green';
type CardLayout   = 'title-center' | 'title-top' | 'big-number' | 'quote';
type CardCategory = 'tips' | 'facts' | 'story' | 'promo' | 'howto';

interface CardSlide {
  id: string;
  title: string;
  body: string;
  tag?: string;
  number?: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const themeConfig: Record<CardTheme, {
  label: string;
  bg: string;
  coverBg: string;    // 커버 전용 배경 (더 화려하게)
  text: string;
  accent: string;
  preview: string;
  isDark: boolean;
  decorColor: string;
  accentDot?: string; // 브랜드 포인트 컬러 (선택)
}> = {
  'migo': {
    label: 'Migo 브랜드', isDark: true,
    bg: 'linear-gradient(135deg, #3ECFB8, #5BB8F5)',
    coverBg: 'linear-gradient(145deg, #2dd4bf 0%, #38bdf8 55%, #60a5fa 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.92)', preview: '#38c9c0',
    decorColor: 'rgba(255,255,255,0.12)',
    accentDot: '#FFB800',
  },
  'dark': {
    label: '다크', isDark: true,
    bg: '#111',
    coverBg: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    text: '#fff', accent: 'rgba(255,255,255,0.7)', preview: '#1a1a2e',
    decorColor: 'rgba(255,255,255,0.05)',
  },
  'light': {
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
  'black': {
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

// ─── 커버 카드: CSS 전용 (이미지 불필요) ──────────────────────────────────────
function CoverCard({
  slide, theme, brandName, topic,
}: {
  slide: CardSlide; theme: CardTheme; brandName: string; topic: string;
}) {
  const t = themeConfig[theme];
  const emoji = topic.includes('뷰티') || topic.includes('스킨케어') ? '✨' :
    topic.includes('재테크') || topic.includes('돈') ? '💰' :
    topic.includes('운동') || topic.includes('다이어트') ? '💪' :
    topic.includes('인스타') || topic.includes('SNS') ? '📱' :
    topic.includes('루틴') ? '🌅' : '🎯';

  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 28, boxSizing: 'border-box',
      background: t.coverBg,
    }}>
      {/* 배경 장식 원 */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 40, right: 20, width: 100, height: 100, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: t.decorColor, zIndex: 0 }} />
      {/* 그리드 패턴 */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(${t.decorColor} 1px, transparent 1px), linear-gradient(90deg, ${t.decorColor} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Migo 브랜드: 노란 포인트 도트 */}
      {t.accentDot && (
        <div style={{
          position: 'absolute', top: 28, right: 28,
          width: 14, height: 14, borderRadius: '50%',
          background: t.accentDot,
          boxShadow: `0 0 16px ${t.accentDot}88`,
          zIndex: 3,
        }} />
      )}

      {/* 중앙 이모지 장식 */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 80, opacity: 0.18, zIndex: 1,
        userSelect: 'none',
      }}>
        {emoji}
      </div>

      {/* 텍스트 */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Migo 브랜드: 로고 컬러 브랜드명 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          {t.accentDot && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accentDot, flexShrink: 0 }} />
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: t.isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {brandName}
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: t.isDark ? '#fff' : '#111', lineHeight: 1.2, whiteSpace: 'pre-line', letterSpacing: '-0.03em', marginBottom: 10 }}>
          {slide.title || '카드뉴스 제목'}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ height: 2, width: 24, background: t.accentDot || (t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'), borderRadius: 1 }} />
          <div style={{ fontSize: 11, color: t.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontWeight: 600 }}>
            01 / 05
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 내부 슬라이드 카드 ────────────────────────────────────────────────────────
function InnerCard({
  slide, theme, layout, index, total,
}: {
  slide: CardSlide; theme: CardTheme; layout: CardLayout; index: number; total: number;
}) {
  const t = themeConfig[theme];
  const isLast = index === total - 1;

  return (
    <div style={{
      width: '100%', aspectRatio: '1 / 1', borderRadius: 16,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      justifyContent: layout === 'title-center' ? 'center' : 'space-between',
      alignItems: layout === 'title-center' ? 'center' : 'flex-start',
      padding: 28, boxSizing: 'border-box',
      textAlign: layout === 'title-center' ? 'center' : 'left',
      background: t.bg,
    }}>
      {/* 장식 */}
      {(theme === 'gradient-pink' || theme === 'gradient-purple' || theme === 'gradient-blue' || theme === 'gradient-orange' || theme === 'gradient-green') && (
        <>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', zIndex: 0 }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        {/* 태그 */}
        {slide.tag && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: t.accent, marginBottom: 12, textTransform: 'uppercase', opacity: 0.7 }}>
            {slide.tag}
          </div>
        )}
        {/* 큰 숫자 */}
        {layout === 'big-number' && slide.number && (
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 0.9, color: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginBottom: 4, letterSpacing: '-0.05em' }}>
            {slide.number}
          </div>
        )}
        {/* 인용구 */}
        {layout === 'quote' && (
          <div style={{ fontSize: 64, lineHeight: 0.7, color: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', marginBottom: 12, fontFamily: 'Georgia,serif' }}>
            "
          </div>
        )}
        {/* 제목 */}
        <div style={{ fontSize: 22, fontWeight: 800, color: t.text, lineHeight: 1.25, marginBottom: slide.body ? 12 : 0, whiteSpace: 'pre-line', letterSpacing: '-0.02em' }}>
          {slide.title || '슬라이드 제목'}
        </div>
        {/* 본문 */}
        {slide.body && (
          <div style={{ fontSize: 12, lineHeight: 1.75, color: t.accent, whiteSpace: 'pre-line' }}>
            {slide.body}
          </div>
        )}
      </div>

      {/* 마지막 슬라이드 워터마크 */}
      {isLast && (
        <div style={{ position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 700, color: t.accent, letterSpacing: '0.05em', opacity: 0.5 }}>
          @{Brandenburg.toBrandHandle(brandName)}
        </div>
      )}
    </div>
  );
}

// 브랜드 핸들 변환 (간단한 유틸)
const Brandenburg = {
  toBrandHandle: (name: string) =>
    name.replace('@', '').toLowerCase().replace(/\s/g, '_'),
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CardNewsPage() {
  const [step,        setStep]        = useState<'setup' | 'editor'>('setup');
  const [category,   setCategory]    = useState<CardCategory>('tips');
  const [theme,      setTheme]        = useState<CardTheme>('migo');
  const [layout,     setLayout]       = useState<CardLayout>('title-top');
  const [topic,      setTopic]        = useState('');
  const [brandName,  setBrandName]    = useState('');
  const [slides,     setSlides]       = useState<CardSlide[]>([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [loading,    setLoading]      = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [error,      setError]        = useState('');
  const [copiedIdx,  setCopiedIdx]    = useState<number | null>(null);
  const [editSlide,  setEditSlide]    = useState<CardSlide | null>(null);
  const [isFallback, setIsFallback]   = useState(false);
  const [caption,    setCaption]      = useState('');
  const [hashtags,   setHashtags]     = useState<string[]>([]);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);

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
    const ns: CardSlide = { id: Date.now().toString(), title: '새 슬라이드', body: '내용을 입력하세요', tag: `${slides.length + 1} / ${slides.length + 1}` };
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
    const text = slides.map((s, i) =>
      `[슬라이드 ${i + 1}]\n제목: ${s.title}${s.body ? `\n본문: ${s.body}` : ''}`
    ).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  // 현재 슬라이드 렌더링 (커버 vs 내부)
  const renderPreview = (idx: number) => {
    if (!slides[idx]) return null;
    if (idx === 0) {
      return (
        <CoverCard
          slide={slides[idx]}
          theme={theme}
          brandName={brandName || 'My Brand'}
          topic={topic}
        />
      );
    }
    return (
      <InnerCard
        slide={slides[idx]}
        theme={theme}
        layout={layout}
        index={idx}
        total={slides.length}
      />
    );
  };

  return (
    <div>
      <Header title="카드뉴스 제작" subtitle="주제를 입력하면 AI가 슬라이드 텍스트를 자동으로 만들어드려요" />
      <div className="page-container animate-fade-in">

        {/* ── SETUP ── */}
        {step === 'setup' && (
          <div className="cn-setup">

            {/* Step 1: Topic */}
            <div className="cn-step">
              <div className="step-num">01</div>
              <div className="step-content">
                <div className="step-title">주제 키워드를 입력하세요</div>
                <div className="step-desc">입력한 주제로 GPT가 5장의 슬라이드 텍스트를 자동 생성해요</div>
                <input
                  className="form-input"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
                  placeholder="예: 20대 스킨케어 루틴, 재테크 꿀팁, 인스타 성장 전략..."
                />
                <div className="topic-presets">
                  {['인스타 성장 꿀팁', '스킨케어 루틴', '재테크 입문', '갓생 루틴', '미라클 모닝', '다이어트 식단'].map(t => (
                    <button key={t} className={`target-preset ${topic === t ? 'active' : ''}`} onClick={() => setTopic(t)}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Category */}
            <div className="cn-step">
              <div className="step-num">02</div>
              <div className="step-content">
                <div className="step-title">어떤 카드뉴스인가요?</div>
                <div className="step-desc">주제 유형에 맞는 구성으로 자동 생성돼요</div>
                <div className="cn-category-grid">
                  {(Object.keys(categoryConfig) as CardCategory[]).map(c => {
                    const cfg = categoryConfig[c];
                    return (
                      <button key={c} className={`cn-category-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                        <div className="cn-cat-emoji">{cfg.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div className="cn-cat-label">{cfg.label}</div>
                          <div className="cn-cat-desc">{cfg.desc}</div>
                        </div>
                        <div className={`cn-radio ${category === c ? 'checked' : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Brand */}
            <div className="cn-step">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">브랜드 / 계정명</div>
                <div className="step-desc">마지막 슬라이드에 워터마크로 들어가요</div>
                <input className="form-input" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="@계정명 또는 브랜드명" style={{ maxWidth: 320 }} />
              </div>
            </div>

            {/* Step 4: Theme */}
            <div className="cn-step">
              <div className="step-num">04</div>
              <div className="step-content">
                <div className="step-title">디자인 테마</div>
                <div className="step-desc">커버 배경 색상과 슬라이드 스타일이 달라져요</div>
                <div className="cn-theme-grid">
                  {(Object.keys(themeConfig) as CardTheme[]).map(t => (
                    <button key={t} className={`cn-theme-btn ${theme === t ? 'active' : ''} ${t === 'migo' ? 'migo-featured' : ''}`} onClick={() => setTheme(t)}>
                      <div className="cn-theme-dot" style={{ background: themeConfig[t].preview }} />
                      <span>{themeConfig[t].label}</span>
                      {t === 'migo' && <span className="migo-badge">내 브랜드</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5: Layout */}
            <div className="cn-step">
              <div className="step-num">05</div>
              <div className="step-content">
                <div className="step-title">레이아웃 스타일</div>
                <div className="step-desc">내부 슬라이드의 텍스트 배치 방식이에요</div>
                <div className="cn-layout-grid">
                  {(Object.keys(layoutConfig) as CardLayout[]).map(l => {
                    const cfg = layoutConfig[l];
                    return (
                      <button key={l} className={`cn-layout-btn ${layout === l ? 'active' : ''}`} onClick={() => setLayout(l)}>
                        <div className="cn-layout-icon">{cfg.icon}</div>
                        <div>
                          <div className="cn-layout-label">{cfg.label}</div>
                          <div className="cn-layout-desc">{cfg.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="cn-error">
                <AlertCircle size={14} /><span>{error}</span>
              </div>
            )}

            {/* Notice */}
            <div className="cn-ai-notice">
              <div style={{ fontSize: 26 }}>🎨</div>
              <div>
                <div className="cn-ai-notice-title">CSS 디자인 + AI 텍스트 자동 생성</div>
                <div className="cn-ai-notice-desc">
                  커버 이미지는 <strong>CSS 그래디언트로 즉시 렌더링</strong>되고,
                  슬라이드 텍스트는 <strong>GPT-4o mini</strong>로 생성돼요.
                  완성된 슬라이드를 <strong>Canva에 붙여넣기</strong>해서 활용하세요.
                </div>
              </div>
            </div>

            <button className="cn-generate-btn" onClick={handleGenerate} disabled={loading || !topic}>
              {loading ? (
                <><Loader2 size={18} className="spin" />{loadingMsg || 'AI 생성 중...'}</>
              ) : (
                <><Sparkles size={18} />카드뉴스 5장 만들기</>
              )}
            </button>
          </div>
        )}

        {/* ── EDITOR ── */}
        {step === 'editor' && slides.length > 0 && (
          <div className="cn-editor animate-fade-in">
            <div className="cn-editor-header">
              <button className="btn btn-secondary btn-sm" onClick={() => setStep('setup')}>← 다시 설정</button>
              <div className="cn-editor-title">
                <LayoutGrid size={14} />
                {slides.length}장의 카드뉴스
                {isFallback && (
                  <span className="cn-fallback-badge">샘플 슬라이드</span>
                )}
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

            {error && <div className="cn-error" style={{ marginBottom: 16 }}><AlertCircle size={14} /><span>{error}</span></div>}

            <div className="cn-editor-body">

              {/* Slide List */}
              <div className="cn-slide-list">
                <div className="cn-slide-list-header">
                  <span>슬라이드</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={addSlide}><Plus size={14} /></button>
                </div>
                {slides.map((s, i) => {
                  const t = themeConfig[theme];
                  return (
                    <div key={s.id} className={`cn-slide-thumb ${currentIdx === i ? 'active' : ''}`} onClick={() => goTo(i)}>
                      <div className="cn-slide-thumb-num">{i + 1}</div>
                      {/* 미니 프리뷰: CSS 배경 */}
                      <div className="cn-slide-thumb-preview" style={{
                        background: i === 0 ? t.coverBg : t.bg,
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ fontSize: 6, color: t.text, fontWeight: 700, lineHeight: 1.3, padding: 3, position: 'relative', zIndex: 1 }}>
                          {s.title?.slice(0, 16)}
                        </div>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div className="cn-slide-thumb-title">{s.title?.slice(0, 22) || '제목 없음'}</div>
                        <div className="cn-slide-thumb-body">{i === 0 ? `${themeConfig[theme].label} 커버` : s.body?.slice(0, 28) || ''}</div>
                      </div>
                      {slides.length > 1 && (
                        <button className="cn-delete-btn" onClick={e => { e.stopPropagation(); deleteSlide(i); }}><Trash2 size={11} /></button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="cn-preview-col">
                <div className="cn-preview-nav">
                  <button className="cn-nav-btn" onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}><ChevronLeft size={18} /></button>
                  <span className="cn-nav-label">{currentIdx + 1} / {slides.length}</span>
                  <button className="cn-nav-btn" onClick={() => goTo(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx === slides.length - 1}><ChevronRight size={18} /></button>
                </div>
                <div className="cn-preview-wrapper">
                  {loading ? (
                    <div className="cn-loading-card">
                      <Loader2 size={32} className="spin" />
                      <div className="cn-loading-text">{loadingMsg}</div>
                    </div>
                  ) : renderPreview(currentIdx)}
                </div>
                {/* Theme switcher */}
                <div className="cn-theme-switcher">
                  {(Object.keys(themeConfig) as CardTheme[]).map(t => (
                    <button key={t} className={`cn-theme-mini ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)} title={themeConfig[t].label} style={{ background: themeConfig[t].preview }} />
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

                <div className="cn-panel-section">
                  <div className="cn-panel-label"><Palette size={12} />레이아웃</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {(Object.keys(layoutConfig) as CardLayout[]).map(l => (
                      <button key={l} className={`cn-layout-mini ${layout === l ? 'active' : ''}`} onClick={() => setLayout(l)}>{layoutConfig[l].label}</button>
                    ))}
                  </div>
                </div>

                <div className="cn-panel-divider" />

                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleCopySlide(slides[currentIdx], currentIdx)}>
                  {copiedIdx === currentIdx ? <><Check size={13} /> 복사됨!</> : <><Copy size={13} /> 텍스트 복사하기</>}
                </button>

                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 6 }} onClick={handleExportAll}>
                  <Download size={13} />전체 텍스트 내보내기
                </button>

                <div className="cn-tip">
                  <Info size={11} />
                  <span>텍스트 복사 → Canva에서 배경 위에 붙여넣기하면 바로 완성! ✨</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 캡션 + 해시태그 패널 ── */}
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
                  <textarea
                    className="cn-textarea"
                    rows={5}
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
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

