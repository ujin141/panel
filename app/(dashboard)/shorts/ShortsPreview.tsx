'use client';
import { Heart, MessageCircle, Send, MoreHorizontal, Music, Play, Pause } from 'lucide-react';
import type { Scene, BgStyle } from './types';

const GRADIENTS: Record<string, string> = {
  hook:     'linear-gradient(160deg,#1a0533 0%,#4a0e8f 50%,#7c3aed 100%)',
  agitate:  'linear-gradient(160deg,#1a0a00 0%,#7c2d12 50%,#dc2626 100%)',
  solution: 'linear-gradient(160deg,#002a1a 0%,#065f46 50%,#059669 100%)',
  result:   'linear-gradient(160deg,#001333 0%,#1e3a8a 50%,#2563eb 100%)',
  cta:      'linear-gradient(160deg,#1a003a 0%,#6b21a8 50%,#a855f7 100%)',
};
const FONT_SIZES: Record<string, number> = { xl: 30, lg: 24, md: 18 };
const TYPE_COLORS: Record<string, string> = {
  hook: '#FFD700', agitate: '#FF6B6B', solution: '#69DB7C', result: '#74C0FC', cta: '#DA77F2',
};

const getBg = (bgStyle: BgStyle, sceneType: string) => {
  if (bgStyle === 'dark') return '#0a0a0a';
  if (bgStyle === 'gradient') return GRADIENTS[sceneType] || GRADIENTS.hook;
  return '#000'; // video / upload — covered by <video> tag
};

interface Props {
  scenes: Scene[];
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  bgStyle: BgStyle;
  videoUrl: string;
  brandName: string;
  platform: 'instagram' | 'youtube' | 'tiktok';
}

export function ShortsPreview({ scenes, activeIdx, setActiveIdx, isPlaying, setIsPlaying, bgStyle, videoUrl, brandName, platform }: Props) {
  const cur = scenes[activeIdx];
  const totalDur = scenes.reduce((a, s) => a + s.duration, 0);
  const elapsed = scenes.slice(0, activeIdx).reduce((a, s) => a + s.duration, 0);
  const progress = totalDur ? (elapsed / totalDur) * 100 : 0;

  if (scenes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
        <p style={{ fontSize: 14 }}>좌측에서 주제를 입력하고<br/>AI 생성 버튼을 눌러주세요</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Phone frame */}
      <div style={{
        width: 280, height: 498,
        borderRadius: 36, border: '7px solid #1a1a1a',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        background: cur ? getBg(bgStyle, cur.type) : '#000',
      }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 90, height: 22, background: '#1a1a1a', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 20 }} />

        {/* Background video — shown for 'video' and 'upload' modes */}
        {(bgStyle === 'video' || bgStyle === 'upload') && videoUrl && (
          <video src={videoUrl} autoPlay loop muted playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: bgStyle === 'upload' ? 0.85 : 0.55 }} />
        )}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.85) 100%)',
        }} />

        {/* Platform badge */}
        <div style={{ position: 'absolute', top: 30, left: 12, zIndex: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            {platform === 'instagram' ? '📸 릴스' : platform === 'youtube' ? '▶️ 쇼츠' : '🎵 틱톡'}
          </div>
        </div>

        {/* Subtitle overlay */}
        {cur && (
          <div style={{
            position: 'absolute', top: '32%', left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '0 18px', zIndex: 5, textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 4, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }}>{cur.emoji}</div>
            <div style={{
              fontSize: FONT_SIZES[cur.fontSize] ?? 24,
              fontWeight: 900, color: cur.color,
              textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)',
              lineHeight: 1.25, wordBreak: 'keep-all',
              background: `linear-gradient(transparent 56%, ${cur.color}44 56%)`,
              padding: '0 4px',
              animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
            }}>
              {cur.text}
            </div>
            {cur.subtext && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 6px rgba(0,0,0,0.9)', marginTop: 2 }}>
                {cur.subtext}
              </div>
            )}
          </div>
        )}

        {/* Right action bar */}
        <div style={{ position: 'absolute', bottom: 90, right: 10, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', zIndex: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
              <img src={`https://ui-avatars.com/api/?name=${brandName || 'B'}&background=a855f7&color=fff&size=36`} style={{ width: '100%', height: '100%' }} alt="" />
            </div>
          </div>
          {[
            { icon: <Heart size={24} fill="#fff" color="#fff" />, label: '28.4K' },
            { icon: <MessageCircle size={24} fill="#fff" color="#fff" style={{ transform: 'scaleX(-1)' }} />, label: '1.2K' },
            { icon: <Send size={24} fill="#fff" color="#fff" />, label: '5.6K' },
            { icon: <MoreHorizontal size={24} color="#fff" />, label: null },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>{item.icon}</div>
              {item.label && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{item.label}</span>}
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div style={{ position: 'absolute', bottom: 16, left: 12, right: 56, zIndex: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>@{brandName || 'mybrand'}</span>
            <span style={{ fontSize: 11, color: '#fff', border: '1px solid rgba(255,255,255,0.7)', padding: '1px 6px', borderRadius: 3 }}>팔로우</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
            <Music size={10} />
            <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{brandName || 'Brand'} 오리지널 오디오</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: 'rgba(255,255,255,0.15)', zIndex: 15 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: TYPE_COLORS[cur?.type || 'hook'], borderRadius: 2, transition: 'width 0.3s ease' }} />
        </div>

        {/* Play/pause tap area */}
        <div onClick={() => setIsPlaying(!isPlaying)}
          style={{ position: 'absolute', inset: 0, zIndex: 6, cursor: 'pointer' }} />
        {!isPlaying && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={22} color="#fff" fill="#fff" />
            </div>
          </div>
        )}
      </div>

      {/* Scene dots */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {scenes.map((s, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            style={{ width: activeIdx === i ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeIdx === i ? TYPE_COLORS[s.type] : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>

      {/* Controls */}
      <button onClick={() => setIsPlaying(!isPlaying)}
        style={{ padding: '8px 20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        {isPlaying ? <><Pause size={14} /> 일시정지</> : <><Play size={14} /> 재생</>}
      </button>

      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.8) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
