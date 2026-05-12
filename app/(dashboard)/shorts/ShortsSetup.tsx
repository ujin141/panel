'use client';
import { useRef, useState } from 'react';
import { Sparkles, Loader2, Upload, X, Film } from 'lucide-react';
import type { Scene, BgStyle } from './types';

const STYLES = ['정보/꿀팁', '브이로그/일상', '유머/공감', '홍보/리뷰', '동기부여'];
const PLATFORMS = [
  { id: 'instagram', label: '📸 릴스', color: '#E1306C' },
  { id: 'youtube',   label: '▶️ 쇼츠', color: '#FF0000' },
  { id: 'tiktok',    label: '🎵 틱톡', color: '#69C9D0' },
];
const BG_STYLES: { id: BgStyle; label: string; desc: string }[] = [
  { id: 'upload',   label: '📂 내 영상 업로드', desc: '직접 찍은 영상에 자막' },
  { id: 'gradient', label: '🌈 그라디언트',     desc: '선명한 색상 배경'    },
  { id: 'video',    label: '🎥 스톡 영상',      desc: 'Pexels 무료 영상'    },
  { id: 'dark',     label: '⚫ 다크',           desc: '미니멀 블랙'         },
];
const TYPE_LABELS: Record<string, string> = {
  hook: '🔥 HOOK', agitate: '😤 AGITATE', solution: '💡 SOLUTION', result: '📈 RESULT', cta: '👇 CTA',
};
const TYPE_COLORS: Record<string, string> = {
  hook: '#FF6B6B', agitate: '#FFB347', solution: '#69DB7C', result: '#74C0FC', cta: '#DA77F2',
};

interface Props {
  topic: string; setTopic: (v: string) => void;
  style: string; setStyle: (v: string) => void;
  platform: 'instagram' | 'youtube' | 'tiktok'; setPlatform: (v: any) => void;
  bgStyle: BgStyle; setBgStyle: (v: BgStyle) => void;
  brandName: string; setBrandName: (v: string) => void;
  duration: number; setDuration: (v: number) => void;
  loading: boolean; error: string;
  onGenerate: () => void;
  scenes: Scene[]; activeIdx: number; setActiveIdx: (i: number) => void;
  updateScene: (idx: number, field: keyof Scene, val: string | number) => void;
  caption: string; hashtags: string[]; musicSuggestion: string;
  uploadedVideoUrl: string | null;
  setUploadedVideoUrl: (url: string | null) => void;
}

export function ShortsSetup(props: Props) {
  const {
    topic, setTopic, style, setStyle, platform, setPlatform, bgStyle, setBgStyle,
    brandName, setBrandName, duration, setDuration, loading, error, onGenerate,
    scenes, activeIdx, setActiveIdx, updateScene, caption, hashtags, musicSuggestion,
    uploadedVideoUrl, setUploadedVideoUrl,
  } = props;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandSaved, setBrandSaved] = useState(false);

  const handleBrandSave = () => {
    if (!brandName.trim()) return;
    localStorage.setItem('panelai_brandName', brandName.trim());
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2000);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('영상 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) { // 500MB 제한
      alert('500MB 이하의 파일만 업로드 가능합니다.');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
  };

  const clearUpload = () => {
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    setUploadedVideoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const card: React.CSSProperties = {
    background: 'rgba(18,18,18,0.9)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 20, marginBottom: 16,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700 }}>숏츠 기획</span>
        </div>

        {/* Platform */}
        <span style={labelStyle}>플랫폼</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              style={{ flex: 1, padding: '9px 6px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: platform === p.id ? `${p.color}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${platform === p.id ? p.color : 'rgba(255,255,255,0.08)'}`,
                color: platform === p.id ? '#fff' : 'rgba(255,255,255,0.45)' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Topic */}
        <span style={labelStyle}>주제</span>
        <textarea value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="예: 직장인이 퇴근 후 30분으로 부업 월 100 버는 법"
          rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.6, marginBottom: 16 }}
          onFocus={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />

        {/* Style */}
        <span style={labelStyle}>영상 스타일</span>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
          {STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: style === s ? 'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(236,72,153,0.2))' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${style === s ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: style === s ? '#fff' : 'rgba(255,255,255,0.45)' }}>
              {s}
            </button>
          ))}
        </div>

        {/* BG Style */}
        <span style={labelStyle}>배경 스타일</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: bgStyle === 'upload' ? 12 : 16 }}>
          {BG_STYLES.map(b => (
            <button key={b.id} onClick={() => setBgStyle(b.id)}
              style={{ padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: bgStyle === b.id
                  ? b.id === 'upload' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)'
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${bgStyle === b.id
                  ? b.id === 'upload' ? 'rgba(59,130,246,0.45)' : 'rgba(168,85,247,0.4)'
                  : 'rgba(255,255,255,0.06)'}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: bgStyle === b.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>{b.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.desc}</span>
            </button>
          ))}
        </div>

        {/* Upload Zone — only visible when 'upload' is selected */}
        {bgStyle === 'upload' && (
          <div style={{ marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
            {uploadedVideoUrl ? (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.4)', position: 'relative' }}>
                <video src={uploadedVideoUrl} muted playsInline
                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', padding: '6px 14px', borderRadius: 20 }}>
                    <Film size={13} color="#86efac" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#86efac' }}>영상 업로드 완료</span>
                  </div>
                </div>
                <button onClick={clearUpload}
                  style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} color="#fff" />
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                  교체
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '24px 0', borderRadius: 12, border: '2px dashed rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.7)'; e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = 'rgba(59,130,246,0.05)'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={20} color="#60a5fa" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>영상 파일 선택</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>MP4, MOV, WebM · 최대 500MB</div>
                </div>
              </button>
            )}
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
                💡 AI가 자막만 생성하고, 배경은 업로드한 내 영상이 사용됩니다.<br />세로형(9:16) 영상을 권장합니다.
              </p>
            </div>
          </div>
        )}

        {/* Brand + Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={labelStyle}>브랜드명</span>
              {brandSaved && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#86efac', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 7px', borderRadius: 12 }}>
                  ✓ 저장됨
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={brandName} onChange={e => setBrandName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleBrandSave(); }}
                placeholder="PanelAI"
                style={{ ...inputStyle, flex: 1, boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
              <button
                onClick={handleBrandSave}
                title="브랜드명 저장"
                style={{
                  padding: '0 12px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: brandSaved ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.2)',
                  color: brandSaved ? '#86efac' : '#c084fc',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                  border: `1px solid ${brandSaved ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.3)'}`,
                }}
              >
                {brandSaved ? '✓' : '저장'}
              </button>
            </div>
          </div>
          <div>
            <span style={labelStyle}>길이 ({duration}초)</span>
            <input type="range" min={15} max={60} step={5} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ width: '100%', marginTop: 8, accentColor: '#a855f7' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
              <span>15초</span><span>60초</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button onClick={onGenerate} disabled={loading}
          style={{ width: '100%', padding: '14px 0', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#a855f7,#ec4899)',
            color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 8px 24px rgba(168,85,247,0.3)', transition: 'all 0.2s' }}>
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> AI 자막 생성 중...</>
            : <><Sparkles size={18} /> {bgStyle === 'upload' ? '자막 자동 생성하기' : '숏츠 대본 생성하기'}</>}
        </button>
      </div>

      {/* Scene Editor */}
      {scenes.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>✂️ 자막 편집</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>
              클릭하여 수정
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scenes.map((sc, i) => (
              <div key={sc.id} onClick={() => setActiveIdx(i)}
                style={{ padding: 14, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: activeIdx === i ? `${TYPE_COLORS[sc.type]}11` : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${activeIdx === i ? TYPE_COLORS[sc.type] + '66' : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[sc.type], background: TYPE_COLORS[sc.type] + '18', padding: '3px 9px', borderRadius: 6 }}>
                    {TYPE_LABELS[sc.type]} · {sc.duration}초
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sc.emoji}</span>
                </div>
                {activeIdx === i ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <input value={sc.text} onChange={e => updateScene(i, 'text', e.target.value)}
                      style={{ ...inputStyle, fontSize: 13, padding: '8px 10px' }}
                      onFocus={e => e.currentTarget.style.borderColor = TYPE_COLORS[sc.type]}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    <input value={sc.subtext} onChange={e => updateScene(i, 'subtext', e.target.value)}
                      placeholder="부가 설명 (선택)"
                      style={{ ...inputStyle, fontSize: 12, padding: '7px 10px' }}
                      onFocus={e => e.currentTarget.style.borderColor = TYPE_COLORS[sc.type]}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>⏱ {sc.duration}초</span>
                      <input type="range" min={1} max={20} value={sc.duration}
                        onChange={e => updateScene(i, 'duration', Number(e.target.value))}
                        style={{ flex: 1, accentColor: TYPE_COLORS[sc.type] }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{sc.text}</div>
                )}
              </div>
            ))}
          </div>
          {musicSuggestion && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(105,219,124,0.07)', border: '1px solid rgba(105,219,124,0.2)', borderRadius: 10 }}>
              <span style={{ fontSize: 11, color: '#69DB7C', fontWeight: 600 }}>🎵 추천 BGM 무드: </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{musicSuggestion}</span>
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      {caption && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>📝 캡션 & 해시태그</span>
            <button onClick={() => navigator.clipboard.writeText(caption + '\n\n' + hashtags.join(' '))}
              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer' }}>
              전체 복사
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-wrap', lineHeight: 1.7, marginBottom: 12 }}>{caption}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {hashtags.map(t => (
              <span key={t} style={{ fontSize: 12, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '3px 9px', borderRadius: 20 }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
