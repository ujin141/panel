'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Sparkles, Copy, Bookmark, BookmarkCheck, Info } from 'lucide-react';
import { logActivity } from '@/lib/activityTracker';
import './content.css';

type Platform = 'threads' | 'instagram';
type ContentType = 'curiosity' | 'emotion' | 'scarcity' | 'informational';
type Category = 'beauty' | 'finance' | 'diet' | 'travel' | 'food' | 'fashion' | 'parenting' | 'sns' | 'self' | 'other';

const platformConfig: Record<Platform, { label: string; emoji: string; desc: string }> = {
  threads:   { label: 'Threads',   emoji: '𝕋', desc: '짧은 텍스트 위주, DM 유도에 최적' },
  instagram: { label: 'Instagram', emoji: '📸', desc: '해시태그 포함, 이미지와 함께 사용' },
};

const typeConfig: Record<ContentType, { label: string; emoji: string; desc: string; example: string }> = {
  curiosity: {
    label: '호기심 유도형', emoji: '🤔',
    desc: '"이게 뭔지 궁금해서 DM 보낼 수밖에 없는" 글',
    example: '"나만 알기엔 너무 아까운 앱인데..."',
  },
  emotion: {
    label: '감정 자극형', emoji: '💕',
    desc: '공감과 스토리로 신뢰를 쌓는 글',
    example: '"예전의 나에게 이걸 알려줬다면..."',
  },
  scarcity: {
    label: '희소성/선별형', emoji: '⏰',
    desc: '지금 안 하면 기회 없다는 긴박감을 주는 글',
    example: '"초대 자리 3개 남았어요"',
  },
  informational: {
    label: '정보성 글', emoji: '📚',
    desc: '유용한 정보·팁을 제공해 저장·공유를 유도하는 글',
    example: '"일본 여행 전 반드시 알아야 할 5가지"',
  },
};

const categoryConfig: Record<Category, { label: string; emoji: string }> = {
  beauty:    { label: '뷰티/스킨케어', emoji: '✨' },
  finance:   { label: '재테크/부업',   emoji: '💰' },
  diet:      { label: '다이어트/운동', emoji: '💪' },
  travel:    { label: '여행/해외',     emoji: '✈️' },
  food:      { label: '음식/요리',     emoji: '🍽️' },
  fashion:   { label: '패션/스타일',   emoji: '👗' },
  parenting: { label: '육아/살림',     emoji: '👶' },
  sns:       { label: 'SNS/마케팅',   emoji: '📱' },
  self:      { label: '자기계발',      emoji: '📚' },
  other:     { label: '기타/직접입력', emoji: '✏️' },
};

export default function ContentPage() {
  const [platform,     setPlatform]     = useState<Platform>('threads');
  const [type,         setType]         = useState<ContentType>('curiosity');
  const [category,     setCategory]     = useState<Category>('beauty');
  const [topic,        setTopic]        = useState('');
  const [brandService, setBrandService] = useState('');
  const [target,       setTarget]       = useState('20~30대 한국 여성');
  const [results,      setResults]      = useState<string[]>([]);
  const [saved,        setSaved]        = useState<Set<number>>(new Set());
  const [copied,       setCopied]       = useState<number | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [step,         setStep]         = useState<'setup' | 'results'>('setup');
  const [error,        setError]        = useState<string | null>(null);
  const [isFallback,   setIsFallback]   = useState(false);

  const [trends, setTrends] = useState<Array<{topic:string;reason:string;hashtags:string[];hotScore:number;estimatedViews?:string;viewReason?:string;source?:string}>>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsRealtime, setTrendsRealtime] = useState(false);
  const [trendsFetchedCount, setTrendsFetchedCount] = useState(0);
  const [trendsFetchedAt, setTrendsFetchedAt] = useState('');

  const fetchTrends = async (keyword = '여행') => {
    setTrendsLoading(true);
    try {
      const res = await fetch(`/api/travel-trends?destination=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setTrends(data.trends || []);
      setTrendsRealtime(data.realtime || false);
      setTrendsFetchedCount(data.fetchedCount || 0);
      setTrendsFetchedAt(data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString('ko-KR') : '');
    } catch {}
    finally { setTrendsLoading(false); }
  };

  useEffect(() => { fetchTrends('여행'); }, []);

  const handleGenerate = async () => {
    setLoading(true); setError(null); setIsFallback(false);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform, type, target, count: 10,
          category: categoryConfig[category].label,
          brandService: brandService.trim() || undefined,
          topic: topic.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '서버 오류' }));
        throw new Error(err.error || '생성 실패');
      }
      const data = await res.json();
      setResults(data.results || []);
      if (data.fallback) setIsFallback(true);
      setStep('results');
      logActivity('script_gen', 10); // 10개를 생성하므로
    } catch (e: any) {
      setError(e.message || '콘텐츠 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSave = async (content: string, idx: number) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
    try {
      await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, content, content_type: type }),
      });
    } catch { /* silent */ }
  };

  return (
    <div>
      <Header title="AI 글쓰기" subtitle="카테고리 · 유형 · 타겟을 설정하면 게시글 10개를 자동으로 만들어드려요" />
      <div className="page-container animate-fade-in">

        {step === 'setup' && (
          <div className="setup-layout">

            {/* Step 1: 카테고리 */}
            <div className="setup-step">
              <div className="step-num">01</div>
              <div className="step-content">
                <div className="step-title">어떤 분야 콘텐츠인가요?</div>
                <div className="step-desc">카테고리에 맞는 언어와 분위기로 글을 써드려요</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 8, marginTop: 12,
                }}>
                  {(Object.keys(categoryConfig) as Category[]).map(c => {
                    const cfg = categoryConfig[c];
                    const active = category === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                          background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                          color: active ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
                          fontSize: 13, fontWeight: active ? 700 : 400,
                          cursor: 'pointer', transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 핵심 주제 */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    핵심 주제 / 키워드 <span style={{ opacity: 0.5 }}>(선택 — 구체적인 내용을 원할 때 적어주세요)</span>
                  </div>
                  <input
                    className="form-input"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="예: 여름철 피부관리법, 인스타 팔로워 100명 늘리기"
                  />
                </div>

                {/* 브랜드/서비스명 */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    내 브랜드 / 서비스명 <span style={{ opacity: 0.5 }}>(선택 — 글에 내 브랜드를 자연스럽게 녹일 때)</span>
                  </div>
                  <input
                    className="form-input"
                    value={brandService}
                    onChange={e => setBrandService(e.target.value)}
                    placeholder="예: 미고 스킨케어, 부업클럽, 다이어트코치"
                  />
                </div>
              </div>
            </div>

            {/* 🔥 트렌딩 여행 콘텐츠 (Step 1-2 사이) */}
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 16, padding: '18px 18px 14px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 15 }}>🔥</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>지금 인기 있는 핫 트렌드 (실시간)</span>
                  {trendsRealtime && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#4ade80',
                      background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                      borderRadius: 5, padding: '2px 6px', letterSpacing: 0.5,
                    }}>● LIVE</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="키워드 (예: 일본)"
                    defaultValue="여행"
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'rgba(255,255,255,0.7)',
                      width: 110, outline: 'none',
                    }}
                    id="content-trend-input"
                    onKeyDown={e => {
                      if (e.key === 'Enter') fetchTrends((e.target as HTMLInputElement).value || '여행');
                    }}
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById('content-trend-input') as HTMLInputElement;
                      fetchTrends(el?.value || '여행');
                    }}
                    style={{
                      background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#a5b4fc',
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {trendsLoading ? '로딩...' : '검색'}
                  </button>
                </div>
              </div>

              {/* 수집 정보 표시 */}
              {!trendsLoading && trendsFetchedAt && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, display: 'flex', gap: 8 }}>
                  {trendsRealtime
                    ? <span>🌐 구글 뉴스·트렌드 {trendsFetchedCount}건 수집 → AI 분석 · {trendsFetchedAt} 기준</span>
                    : <span>⚡ AI 자체 분석 기준 (네트워크 불안정) · {trendsFetchedAt}</span>
                  }
                </div>
              )}

              {trendsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  🌐 구글 뉴스·트렌드 실시간 수집 중...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                  {trends.map((t, i) => {
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setTopic(t.topic);
                          setCategory('travel');
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 0,
                          background: topic === t.topic
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${topic === t.topic ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 12, padding: '10px 12px', cursor: 'pointer',
                          textAlign: 'left', transition: 'all 0.15s',
                          boxShadow: topic === t.topic ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>{t.topic}</span>
                              {t.source && (
                                <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                                  color: t.source === 'AI분석' ? '#a5b4fc' : t.source === '구글뉴스' ? '#34d399' : '#fb923c',
                                  background: t.source === 'AI분석' ? 'rgba(99,102,241,0.15)' : t.source === '구글뉴스' ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)',
                                  border: `1px solid ${t.source === 'AI분석' ? 'rgba(99,102,241,0.3)' : t.source === '구글뉴스' ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}`,
                                }}>{t.source}</span>
                              )}
                              {topic === t.topic && (
                                <span style={{ fontSize: 9, color: '#a5b4fc', fontWeight: 700, marginLeft: 2 }}>✓ 선택됨</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {t.estimatedViews && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#fbbf24' }}>
                                  <span style={{ fontSize: 9 }}>👁</span> {t.estimatedViews} 예상
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#6ee7b7' }}>🔥{t.hotScore}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0 7px' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: 3, textTransform: 'uppercase' }}>추천 이유</div>
                            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>{t.reason}</div>
                          </div>
                          {t.viewReason && (
                            <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 8 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(251,191,36,0.45)', letterSpacing: '0.05em', marginBottom: 3, textTransform: 'uppercase' }}>조회수 근거</div>
                              <div style={{ fontSize: 10.5, color: 'rgba(251,191,36,0.7)', lineHeight: 1.5 }}>{t.viewReason}</div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: 플랫폼 */}
            <div className="setup-step">
              <div className="step-num">02</div>
              <div className="step-content">
                <div className="step-title">어디에 올릴 건가요?</div>
                <div className="step-desc">플랫폼에 따라 글 스타일이 달라져요</div>
                <div className="platform-grid">
                  {(Object.keys(platformConfig) as Platform[]).map(p => {
                    const c = platformConfig[p];
                    return (
                      <button key={p} className={'platform-choice' + (platform === p ? ' active' : '')} onClick={() => setPlatform(p)}>
                        <div className="platform-choice-emoji">{c.emoji}</div>
                        <div>
                          <div className="platform-choice-label">{c.label}</div>
                          <div className="platform-choice-desc">{c.desc}</div>
                        </div>
                        <div className={'platform-choice-radio' + (platform === p ? ' checked' : '')} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: 글 유형 */}
            <div className="setup-step">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">어떤 방식으로 사람을 끌어당길까요?</div>
                <div className="step-desc">상황에 따라 다른 전략을 쓰는 게 좋아요</div>
                <div className="type-grid">
                  {(Object.keys(typeConfig) as ContentType[]).map(t => {
                    const c = typeConfig[t];
                    return (
                      <button key={t} className={'type-choice' + (type === t ? ' active' : '')} onClick={() => setType(t)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 22 }}>{c.emoji}</span>
                          <div className={'type-choice-radio' + (type === t ? ' checked' : '')} />
                        </div>
                        <div className="type-choice-label">{c.label}</div>
                        <div className="type-choice-desc">{c.desc}</div>
                        <div className="type-choice-example">{c.example}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 4: 타겟 */}
            <div className="setup-step">
              <div className="step-num">04</div>
              <div className="step-content">
                <div className="step-title">누구에게 말하고 싶으세요?</div>
                <div className="step-desc">타겟이 명확할수록 글이 더 잘 통해요</div>
                <div className="target-presets">
                  {['20~30대 한국 여성', '20대 대학생 여성', '30대 직장 여성', '2030 뷰티 관심 여성'].map(t => (
                    <button key={t} className={'target-preset' + (target === t ? ' active' : '')} onClick={() => setTarget(t)}>{t}</button>
                  ))}
                </div>
                <input
                  className="form-input" style={{ marginTop: 10 }}
                  value={target} onChange={e => setTarget(e.target.value)}
                  placeholder="직접 입력 (예: 20대 자취 여성)"
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, fontSize: 13, color: '#ef4444' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />AI가 10개 글 쓰는 중...</>
              ) : (
                <><Sparkles size={18} />게시글 10개 만들기</>
              )}
            </button>

            <div className="tip-box">
              <Info size={13} />
              <span>💡 <strong>초보자 팁</strong>: 처음엔 <strong>호기심 유도형</strong>이 가장 효과적이에요. 생성 후 마음에 드는 것만 골라서 복사하면 돼요!</span>
            </div>
          </div>
        )}

        {step === 'results' && (
          <div className="results-layout animate-fade-in">
            <div className="results-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>✅ {results.length}개 게시글 완성!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  {categoryConfig[category].label} · {platformConfig[platform].label} · {typeConfig[type].label} · 타겟: {target}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => { setStep('setup'); setResults([]); setSaved(new Set()); }}>
                ← 다시 설정
              </button>
            </div>

            <div className="tip-box" style={{ marginBottom: 20 }}>
              <Info size={13} />
              <span>마음에 드는 글을 "<strong>복사하기</strong>" 버튼으로 복사해서 바로 붙여넣기 하세요.</span>
            </div>

            {isFallback && (
              <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span><strong>OpenAI 크레딧이 초과되어 샘플 게시글을 표시합니다.</strong><br />OpenAI 대시보드에서 결제 한도를 높이면 AI가 맞춤 게시글을 생성해드려요.</span>
              </div>
            )}

            <div className="results-list">
              {results.map((content, i) => (
                <div key={i} className="result-card card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)' }}>#{i + 1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleSave(content, i)} style={{ gap: 4 }}>
                        {saved.has(i) ? <BookmarkCheck size={14} style={{ color: '#22c55e' }} /> : <Bookmark size={14} />}
                        {saved.has(i) ? '저장됨' : '저장'}
                      </button>
                      <button className={'btn btn-sm ' + (copied === i ? 'btn-secondary' : 'btn-primary')} onClick={() => handleCopy(content, i)} style={{ gap: 6 }}>
                        <Copy size={13} />{copied === i ? '복사됨 ✓' : '복사하기'}
                      </button>
                    </div>
                  </div>
                  <pre className="result-text">{content}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
