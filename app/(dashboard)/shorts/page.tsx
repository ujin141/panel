'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { ShortsSetup } from './ShortsSetup';
import { ShortsPreview } from './ShortsPreview';
import { ShortsExport } from './ShortsExport';
import type { Scene, BgStyle } from './types';

export default function ShortsPage() {

  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('정보/꿀팁');
  const [platform, setPlatform] = useState<'instagram' | 'youtube' | 'tiktok'>('instagram');
  const [bgStyle, setBgStyle] = useState<BgStyle>('gradient');
  const [brandName, setBrandName] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [musicSuggestion, setMusicSuggestion] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('panelai_brandName');
    if (saved) setBrandName(saved);
  }, []);

  useEffect(() => {
    if (!isPlaying || scenes.length === 0) return;
    const cur = scenes[activeIdx];
    timerRef.current = setTimeout(() => {
      setActiveIdx(p => (p + 1) % scenes.length);
    }, cur.duration * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [activeIdx, isPlaying, scenes]);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('주제를 입력해주세요'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/shorts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, style, platform, bgStyle, brandName: brandName || 'My Brand', duration }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScenes(data.scenes || []);
      setCaption(data.caption || '');
      setHashtags(data.hashtags || []);
      setVideoUrl(data.videoUrl || '');
      setMusicSuggestion(data.musicSuggestion || '');
      setActiveIdx(0);
      setIsPlaying(true);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateScene = (idx: number, field: keyof Scene, val: string | number) => {
    setScenes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  return (
    <div className="page-container">
      <Header
        title="🎬 AI 숏츠 제작"
        subtitle="대본 → 자막 편집 → 영상 렌더링까지 올인원. 릴스·쇼츠·틱톡 전용."
      />
      <div style={{ display: 'flex', gap: 24, padding: '0 0 32px', height: 'calc(100vh - 108px)' }}>
        {/* Left Panel */}
        <div style={{ width: 380, flexShrink: 0, overflowY: 'auto', paddingRight: 4 }}>
          <ShortsSetup
            uploadedVideoUrl={uploadedVideoUrl}
            setUploadedVideoUrl={setUploadedVideoUrl}
            topic={topic} setTopic={setTopic}
            style={style} setStyle={setStyle}
            platform={platform} setPlatform={setPlatform}
            bgStyle={bgStyle} setBgStyle={setBgStyle}
            brandName={brandName} setBrandName={v => { setBrandName(v); localStorage.setItem('panelai_brandName', v); }}
            duration={duration} setDuration={setDuration}
            loading={loading} error={error}
            onGenerate={handleGenerate}
            scenes={scenes}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            updateScene={updateScene}
            caption={caption}
            hashtags={hashtags}
            musicSuggestion={musicSuggestion}
          />
        </div>
        {/* Center: Phone Preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <ShortsPreview
            scenes={scenes}
            activeIdx={activeIdx}
            setActiveIdx={setActiveIdx}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            bgStyle={bgStyle}
            videoUrl={bgStyle === 'upload' ? (uploadedVideoUrl || '') : videoUrl}
            brandName={brandName}
            platform={platform}
          />
        </div>
        {/* Right: Export */}
        {scenes.length > 0 && (
          <div style={{ width: 280, flexShrink: 0, overflowY: 'auto' }}>
            <ShortsExport
              scenes={scenes}
              bgStyle={bgStyle}
              videoUrl={bgStyle === 'upload' ? (uploadedVideoUrl || '') : videoUrl}
              brandName={brandName}
              topic={topic}
              caption={caption}
              hashtags={hashtags}
            />
          </div>
        )}
      </div>
    </div>
  );
}
