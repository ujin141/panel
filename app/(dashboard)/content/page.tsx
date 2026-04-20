'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Sparkles, Copy, Bookmark, BookmarkCheck, Info } from 'lucide-react';
import './content.css';

type Platform = 'threads' | 'instagram';
type ContentType = 'curiosity' | 'emotion' | 'scarcity';

const platformConfig = {
  threads: { label: 'Threads', emoji: '𝕋', desc: '짧은 텍스트 위주, DM 유도에 최적' },
  instagram: { label: 'Instagram', emoji: '📸', desc: '해시태그 포함, 이미지와 함께 사용' },
};

const typeConfig = {
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
};

export default function ContentPage() {
  const [platform, setPlatform] = useState<Platform>('threads');
  const [type, setType] = useState<ContentType>('curiosity');
  const [target, setTarget] = useState('20~30대 한국 여성');
  const [results, setResults] = useState<string[]>([]);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'results'>('setup');
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const handleGenerate = async () => {
    setLoading(true); setError(null); setIsFallback(false);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, type, target, count: 10 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '서버 오류' }));
        throw new Error(err.error || '생성 실패');
      }
      const data = await res.json();
      setResults(data.results || []);
      if (data.fallback) setIsFallback(true);
      setStep('results');
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
      <Header title="AI 글쓰기" subtitle="설정 3가지만 하면 게시글 10개를 자동으로 만들어드려요" />
      <div className="page-container animate-fade-in">

        {step === 'setup' && (
          <div className="setup-layout">
            {/* Step 1 */}
            <div className="setup-step">
              <div className="step-num">01</div>
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

            {/* Step 2 */}
            <div className="setup-step">
              <div className="step-num">02</div>
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

            {/* Step 3 */}
            <div className="setup-step">
              <div className="step-num">03</div>
              <div className="step-content">
                <div className="step-title">누구에게 말하고 싶으세요?</div>
                <div className="step-desc">타겟이 명확할수록 글이 더 잘 통해요</div>
                <div className="target-presets">
                  {['20~30대 한국 여성', '20대 대학생 여성', '30대 직장 여성', '2030 뷰티 관심 여성'].map(t => (
                    <button key={t} className={'target-preset' + (target === t ? ' active' : '')} onClick={() => setTarget(t)}>{t}</button>
                  ))}
                </div>
                <input className="form-input" style={{ marginTop: 10 }} value={target}
                  onChange={e => setTarget(e.target.value)} placeholder="직접 입력 (예: 20대 자취 여성)" />
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
                  {platformConfig[platform].label} · {typeConfig[type].label} · 타겟: {target}
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
