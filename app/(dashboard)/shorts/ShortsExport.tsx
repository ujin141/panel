'use client';
import { useState, useRef, useCallback } from 'react';
import { Download, Loader2, Video, FileImage, Copy, Check } from 'lucide-react';
import type { Scene, BgStyle } from './types';

const TYPE_COLORS: Record<string, string> = {
  hook: '#FFD700', agitate: '#FF6B6B', solution: '#69DB7C', result: '#74C0FC', cta: '#DA77F2',
};
const GRADIENTS: Record<string, string> = {
  hook:     'linear-gradient(160deg,#1a0533 0%,#4a0e8f 50%,#7c3aed 100%)',
  agitate:  'linear-gradient(160deg,#1a0a00 0%,#7c2d12 50%,#dc2626 100%)',
  solution: 'linear-gradient(160deg,#002a1a 0%,#065f46 50%,#059669 100%)',
  result:   'linear-gradient(160deg,#001333 0%,#1e3a8a 50%,#2563eb 100%)',
  cta:      'linear-gradient(160deg,#1a003a 0%,#6b21a8 50%,#a855f7 100%)',
};
const FONT_SIZES: Record<string, number> = { xl: 90, lg: 72, md: 56 };

interface Props {
  scenes: Scene[];
  bgStyle: BgStyle;
  videoUrl: string;
  brandName: string;
  topic: string;
  caption: string;
  hashtags: string[];
}

export function ShortsExport({ scenes, bgStyle, videoUrl, brandName, topic, caption, hashtags }: Props) {
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalDur = scenes.reduce((a, s) => a + s.duration, 0);

  // Draw one scene frame onto a 1080x1920 canvas
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, scene: Scene, bgImg?: HTMLImageElement) => {
    const W = 1080, H = 1920;
    ctx.globalAlpha = 1;

    // Background
    if (bgStyle === 'dark') {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);
    } else if ((bgStyle === 'video' || bgStyle === 'upload') && bgImg) {
      const scale = Math.max(W / bgImg.width, H / bgImg.height);
      const bw = bgImg.width * scale, bh = bgImg.height * scale;
      ctx.drawImage(bgImg, (W - bw) / 2, (H - bh) / 2, bw, bh);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W * 0.5, H);
      const g = GRADIENTS[scene.type] || GRADIENTS.hook;
      // parse rough stops from gradient string
      const stops = [
        { stop: 0, color: g.includes('#1a0533') ? '#1a0533' : g.includes('#1a0a00') ? '#1a0a00' : g.includes('#002a1a') ? '#002a1a' : g.includes('#001333') ? '#001333' : '#1a003a' },
        { stop: 0.5, color: g.includes('#4a0e8f') ? '#4a0e8f' : g.includes('#7c2d12') ? '#7c2d12' : g.includes('#065f46') ? '#065f46' : g.includes('#1e3a8a') ? '#1e3a8a' : '#6b21a8' },
        { stop: 1, color: g.includes('#7c3aed') ? '#7c3aed' : g.includes('#dc2626') ? '#dc2626' : g.includes('#059669') ? '#059669' : g.includes('#2563eb') ? '#2563eb' : '#a855f7' },
      ];
      stops.forEach(s => grad.addColorStop(s.stop, s.color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Gradient overlay bottom
    const over = ctx.createLinearGradient(0, H * 0.5, 0, H);
    over.addColorStop(0, 'rgba(0,0,0,0)');
    over.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = over;
    ctx.fillRect(0, 0, W, H);

    // Emoji
    ctx.font = `${FONT_SIZES.xl * 1.5}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(scene.emoji, W / 2, H * 0.38);

    // Main text
    const fs = FONT_SIZES[scene.fontSize] ?? 72;
    ctx.font = `900 ${fs}px 'Arial Black', Arial, sans-serif`;
    ctx.fillStyle = scene.color;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 20;

    const words = scene.text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > W - 120) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);

    const lineH = fs * 1.3;
    const startY = H * 0.48;
    lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineH));

    // Subtext
    if (scene.subtext) {
      ctx.font = `600 ${fs * 0.48}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(scene.subtext, W / 2, startY + lines.length * lineH + 30);
    }

    ctx.shadowBlur = 0;

    // Brand watermark
    ctx.font = '700 36px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`@${brandName || 'mybrand'}`, W - 50, H - 50);
  }, [bgStyle, brandName]);

  const handleRenderVideo = useCallback(async () => {
    if (renderingVideo || scenes.length === 0) return;
    setRenderingVideo(true);
    setProgress(0);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1920;
      const ctx = canvas.getContext('2d')!;

      let bgImg: HTMLImageElement | undefined;
      if ((bgStyle === 'video' || bgStyle === 'upload') && videoUrl) {
        const vid = document.createElement('video');
        vid.src = videoUrl; vid.crossOrigin = 'anonymous';
        vid.currentTime = 1;
        await new Promise(r => { vid.onseeked = r; vid.load(); });
        const tmp = document.createElement('canvas');
        tmp.width = vid.videoWidth || 1080; tmp.height = vid.videoHeight || 1920;
        tmp.getContext('2d')!.drawImage(vid, 0, 0);
        bgImg = new Image(); bgImg.src = tmp.toDataURL();
        await new Promise(r => { bgImg!.onload = r; });
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) mimeType = 'video/webm;codecs=vp8';

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };

      const done = new Promise<void>(resolve => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `${(topic || 'shorts').slice(0, 20)}-shorts.webm`;
          a.click(); URL.revokeObjectURL(url);
          resolve();
        };
      });

      recorder.start();
      drawFrame(ctx, scenes[0], bgImg);
      await new Promise(r => setTimeout(r, 100));

      const FPS = 30;
      const FADE = 0.4; // seconds

      for (let si = 0; si < scenes.length; si++) {
        const sc = scenes[si];
        const holdFrames = Math.max(1, Math.round((sc.duration - FADE) * FPS));
        const fadeFrames = Math.round(FADE * FPS);
        const interval = 1000 / FPS;

        // Hold
        for (let f = 0; f < holdFrames; f++) {
          drawFrame(ctx, sc, bgImg);
          if (f % 10 === 0) recorder.requestData();
          await new Promise(r => setTimeout(r, interval));
        }

        // Fade to next
        if (si < scenes.length - 1) {
          const nextSc = scenes[si + 1];
          const offCanvas = document.createElement('canvas');
          offCanvas.width = 1080; offCanvas.height = 1920;
          const offCtx = offCanvas.getContext('2d')!;
          drawFrame(offCtx, nextSc, bgImg);

          for (let f = 0; f <= fadeFrames; f++) {
            const alpha = f / fadeFrames;
            drawFrame(ctx, sc, bgImg);
            ctx.globalAlpha = alpha;
            ctx.drawImage(offCanvas, 0, 0);
            ctx.globalAlpha = 1;
            recorder.requestData();
            await new Promise(r => setTimeout(r, interval));
          }
        }

        setProgress(Math.round(((si + 1) / scenes.length) * 100));
      }

      recorder.stop();
      await done;
    } catch (e: any) {
      alert('렌더링 오류: ' + e.message);
    } finally {
      setRenderingVideo(false);
      setProgress(0);
    }
  }, [scenes, bgStyle, videoUrl, topic, drawFrame]);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption + '\n\n' + hashtags.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const card: React.CSSProperties = {
    background: 'rgba(18,18,18,0.9)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 18, marginBottom: 14,
  };

  return (
    <div>
      <div style={{ ...card, background: 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(236,72,153,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>📊 영상 정보</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {[
            { label: '총 길이', value: `${totalDur}초` },
            { label: '씬 수', value: `${scenes.length}개` },
            { label: '해상도', value: '1080 × 1920' },
            { label: '비율', value: '9:16 (숏츠 최적)' },
            { label: '형식', value: 'WebM (30fps)' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Video render */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Video size={15} style={{ color: '#a855f7' }} /> 영상 렌더링 & 다운로드
        </div>

        {renderingVideo && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              <span>렌더링 중...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#a855f7,#ec4899)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        <button onClick={handleRenderVideo} disabled={renderingVideo}
          style={{ width: '100%', padding: '13px 0', borderRadius: 11, border: 'none', cursor: renderingVideo ? 'not-allowed' : 'pointer',
            background: renderingVideo ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#a855f7,#ec4899)',
            color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: renderingVideo ? 'none' : '0 6px 20px rgba(168,85,247,0.3)', transition: 'all 0.2s' }}>
          {renderingVideo
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 렌더링 중 {progress}%</>
            : <><Download size={16} /> 숏츠 영상 다운로드</>}
        </button>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          1080×1920 / WebM 포맷<br/>인스타·유튜브·틱톡 바로 업로드 가능
        </p>
      </div>

      {/* Caption copy */}
      {caption && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileImage size={14} style={{ color: '#69DB7C' }} /> 캡션 복사
            </span>
            <button onClick={handleCopyCaption}
              style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: 'none',
                background: copied ? 'rgba(105,219,124,0.2)' : 'rgba(255,255,255,0.08)',
                color: copied ? '#69DB7C' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
              {copied ? <><Check size={11} /> 복사됨</> : <><Copy size={11} /> 전체 복사</>}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
            {caption.slice(0, 180)}{caption.length > 180 ? '...' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {hashtags.slice(0, 6).map(t => (
              <span key={t} style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: 14 }}>{t}</span>
            ))}
            {hashtags.length > 6 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>+{hashtags.length - 6}개</span>}
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ ...card, background: 'rgba(105,219,124,0.05)', border: '1px solid rgba(105,219,124,0.15)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#69DB7C', marginBottom: 10 }}>💡 업로드 팁</div>
        {['업로드 전 음악 직접 삽입 추천 (릴스/쇼츠 앱 내)', '첫 3초가 시청유지율 결정 — HOOK 자막이 핵심', '캡션 첫 줄에 키워드 넣으면 알고리즘 노출↑', '해시태그는 10~15개가 최적 (너무 많으면 스팸 처리)'].map(tip => (
          <div key={tip} style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
            <span style={{ color: '#69DB7C', flexShrink: 0, fontSize: 11 }}>▸</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
