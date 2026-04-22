'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { logActivity } from '@/lib/activityTracker';
import { Sparkles, Video, Play, Pause, Type, Heart, MessageCircle, Send, MoreHorizontal, Music } from 'lucide-react';

interface ScriptItem {
  id: string;
  type: 'hook' | 'agitate' | 'solution' | 'cta';
  text: string;
  duration: number;
}

export default function ShortFormPage() {
  const [topic, setTopic] = useState('');
  const [brandName, setBrandName] = useState('PanelAI');
  const [category, setCategory] = useState('정보/꿀팁');
  
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [script, setScript] = useState<ScriptItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [activeSubtitleIdx, setActiveSubtitleIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);

  // 배경음악 볼륨 조절
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = 0.15; // BGM은 작게 (15%)
    }
  }, [videoUrl]);

  // 로컬 스토리지 연동
  useEffect(() => {
    const savedBrand = localStorage.getItem('panelai_brandName');
    if (savedBrand) setBrandName(savedBrand);
  }, []);

  const handleBrandChange = (val: string) => {
    setBrandName(val);
    localStorage.setItem('panelai_brandName', val);
  };

  // 자막 타이머 로직 및 TTS 연동
  useEffect(() => {
    if (!isPlaying || script.length === 0) {
      window.speechSynthesis.cancel();
      return;
    }

    const currentItem = script[activeSubtitleIdx];
    
    // TTS 읽어주기
    if (ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // 이전 음성 취소
      const utterance = new SpeechSynthesisUtterance(currentItem.text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.3; // 숏폼 특유의 빠른 속도
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }

    const timer = setTimeout(() => {
      setActiveSubtitleIdx((prev) => (prev + 1) % script.length);
    }, currentItem.duration * 1000);

    return () => clearTimeout(timer);
  }, [activeSubtitleIdx, isPlaying, script, ttsEnabled]);

  const handleGenerate = async (forceTopic?: string, forceCategory?: string) => {
    const t = forceTopic || topic;
    const c = forceCategory || category;
    if (!t) return alert('주제를 입력해주세요.');
    setLoading(true);
    try {
      const res = await fetch('/api/short-form/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, category: c, brandName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setScript(data.script);
      setVideoUrl(data.videoUrl);
      setCaption(data.caption);
      setHashtags(data.hashtags);
      setActiveSubtitleIdx(0);
      setIsPlaying(true);
      logActivity('short_form');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async (type: 'custom' | 'viral') => {
    setRecommending(true);
    setRecommendations([]);
    try {
      const res = await fetch('/api/short-form/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, category, type })
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다!');
  };

  return (
    <div className="page-container">
      <Header title="AI 숏폼 영상 제작" subtitle="주제만 입력하면 터지는 릴스/쇼츠 대본과 배경 영상을 만들어줍니다." />

      <div className="page-content" style={{ display: 'flex', gap: 32, paddingBottom: 32, height: 'calc(100vh - 100px)' }}>
        {/* Left: Input & Script List */}
        <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', paddingRight: 8 }}>
          
          <div className="card" style={{ 
            background: 'linear-gradient(145deg, rgba(30,30,30,0.6) 0%, rgba(20,20,20,0.8) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
              <div style={{ padding: 6, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: 8, display: 'flex' }}>
                <Type size={16} color="#fff" />
              </div>
              숏폼 기획 엔진
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: recommendations.length > 0 ? 16 : 0 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>💡 AI 숏폼 기획실</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>직접 주제를 입력하거나, 아래의 AI 추천 기능을 활용해보세요.</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRecommend('custom')} disabled={recommending} style={{ flex: 1, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', opacity: recommending ? 0.7 : 1, transition: 'all 0.2s' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,0.3)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,0.2)'}>
                      🎯 현재 카테고리 맞춤 추천
                    </button>
                    <button onClick={() => handleRecommend('viral')} disabled={recommending} style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444, #f97316)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', opacity: recommending ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                      🔥 글로벌 떡상 트렌드
                    </button>
                  </div>
                </div>
                
                {recommendations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recommendations.map((rec, i) => (
                      <div key={i} onClick={() => { setTopic(rec.topic); setCategory(rec.category); handleGenerate(rec.topic, rec.category); }} style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='#3b82f6'} onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{rec.topic}</div>
                          {rec.viralScore && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', padding: '4px 8px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)' }}>
                              <span style={{ fontSize: 12 }}>🔥</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5' }}>상위 {100 - rec.viralScore}%</span>
                            </div>
                          )}
                        </div>
                        
                        {rec.estimatedViews && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>예상 조회수</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{rec.estimatedViews}</span>
                          </div>
                        )}
                        
                        <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ marginTop: 2 }}>💡</span>
                          <span style={{ lineHeight: 1.5 }}>{rec.reason}</span>
                        </div>
                        
                        {rec.analysis && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6, lineHeight: 1.5, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                            <strong style={{ color: 'rgba(255,255,255,0.6)' }}>분석 리포트:</strong> {rec.analysis}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>어떤 내용을 만들고 싶으신가요?</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    placeholder="예: 직장인을 위한 5분 컷 다이어트 현실 식단" 
                    style={{
                      width: '100%', padding: '16px 16px 16px 44px',
                      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#fff', fontSize: 14,
                      transition: 'all 0.2s', outline: 'none'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <Sparkles size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>영상 스타일</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['정보/꿀팁', '브이로그/일상', '유머/공감', '홍보/리뷰'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '10px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        background: category === cat ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${category === cat ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: category === cat ? '#fff' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>브랜드명 (저장됨)</label>
                <input 
                  type="text" 
                  value={brandName} 
                  onChange={(e) => handleBrandChange(e.target.value)} 
                  placeholder="예: PanelAI" 
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', transition: 'all 0.2s'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleGenerate} 
                disabled={loading}
                style={{ 
                  width: '100%', justifyContent: 'center', padding: '16px 0', fontSize: 15, marginTop: 12,
                  background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  boxShadow: loading ? 'none' : '0 8px 24px rgba(59,130,246,0.3)',
                  border: 'none', borderRadius: 12, fontWeight: 700
                }}
              >
                {loading ? '⚡ 초정밀 AI 대본 및 영상 생성 중...' : <><Sparkles size={18} /> 바이럴 숏폼 생성하기</>}
              </button>
            </div>
          </div>

          {script.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'linear-gradient(to bottom, rgba(20,20,20,0.8), rgba(10,10,10,0.9))' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#fff' }}>
                <span style={{ background: 'linear-gradient(to right, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ✨ 바이럴 터지는 3단계 대본
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {script.map((item, idx) => (
                  <div key={item.id} style={{
                    padding: 18,
                    borderRadius: 12,
                    background: idx === activeSubtitleIdx ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${idx === activeSubtitleIdx ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: idx === activeSubtitleIdx ? '0 4px 20px rgba(59,130,246,0.15)' : 'none',
                    transform: idx === activeSubtitleIdx ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }} onClick={() => setActiveSubtitleIdx(idx)}>
                    
                    {idx === activeSubtitleIdx && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ 
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.05em',
                        background: item.type === 'hook' ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.15))' : 
                                    item.type === 'agitate' ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(217,119,6,0.15))' : 
                                    item.type === 'solution' ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))' : 
                                    item.type === 'cta' ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))' : 'rgba(255,255,255,0.08)',
                        color: item.type === 'hook' ? '#fb923c' : item.type === 'agitate' ? '#fde047' : item.type === 'solution' ? '#86efac' : item.type === 'cta' ? '#c084fc' : '#e2e8f0',
                        border: `1px solid ${item.type === 'hook' ? 'rgba(249,115,22,0.3)' : item.type === 'agitate' ? 'rgba(234,179,8,0.3)' : item.type === 'solution' ? 'rgba(34,197,94,0.3)' : item.type === 'cta' ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)'}`
                      }}>
                        {item.type === 'hook' ? '🔥 HOOK' : item.type === 'agitate' ? '🔪 AGITATE' : item.type === 'solution' ? '💡 SOLUTION' : '🎯 CTA'} ({item.duration}초)
                      </span>
                    </div>
                    <div style={{ fontSize: 15, color: idx === activeSubtitleIdx ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontWeight: idx === activeSubtitleIdx ? 600 : 400, letterSpacing: '-0.01em' }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 28, padding: 20, background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>인스타 업로드용 캡션</h3>
                  <button onClick={() => copyToClipboard(caption + '\n\n' + hashtags.join(' '))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseLeave={(e)=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
                    전체 복사
                  </button>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', marginBottom: 16, lineHeight: 1.6 }}>{caption}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {hashtags.map(tag => (
                    <span key={tag} style={{ fontSize: 13, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: 20 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Phone Preview */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: 24, border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}>
          {videoUrl ? (
            <div style={{ 
              width: 320, height: 640, borderRadius: 36, border: '8px solid #222', 
              position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              background: '#000'
            }}>
              {/* 노치 */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 24, background: '#222', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
              
              <video 
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted={false} // 실제 숏폼처럼 소리 켜기 가능하도록 설정
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              />

              {/* 시네마틱 다크 필터 오버레이 */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.85) 100%)'
              }} />

              {/* 자막 오버레이 (틱톡/릴스 팝업 효과 & 헤비 폰트) */}
              <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap');
                @keyframes subtitlePop { 0% { transform: scale(0.8) translateY(10px); opacity: 0; } 50% { transform: scale(1.05) translateY(-5px); } 100% { transform: scale(1) translateY(0); opacity: 1; } }
                @keyframes spinDisc { 100% { transform: rotate(360deg); } }
              `}} />
              <div style={{
                position: 'absolute', top: '35%', left: 0, right: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                padding: '0 20px', textAlign: 'center', zIndex: 3, pointerEvents: 'none'
              }}>
                {script[activeSubtitleIdx] && (
                  <h1 
                    key={script[activeSubtitleIdx].id + activeSubtitleIdx}
                    style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: script[activeSubtitleIdx].type === 'hook' ? 38 : 34,
                      fontWeight: 400, // Black Han Sans는 기본이 매우 두꺼움
                      color: script[activeSubtitleIdx].type === 'hook' ? '#ffeb3b' : '#ffffff', // 훅은 노란색
                      WebkitTextStroke: '2px #000', // 확실한 검은색 외곽선
                      textShadow: '0 4px 15px rgba(0,0,0,0.9), 0 2px 5px rgba(0,0,0,0.8)',
                      lineHeight: 1.25,
                      wordBreak: 'keep-all',
                      background: script[activeSubtitleIdx].type === 'hook' ? 'linear-gradient(transparent 60%, rgba(239,68,68,0.8) 60%)' : 
                                  script[activeSubtitleIdx].type === 'solution' ? 'linear-gradient(transparent 60%, rgba(34,197,94,0.8) 60%)' : 'none',
                      animation: 'subtitlePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                    }}>
                    {script[activeSubtitleIdx].text}
                  </h1>
                )}
              </div>

              {/* 우측 리얼 UI 액션 바 */}
              <div style={{ position: 'absolute', bottom: 100, right: 12, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', zIndex: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '2px solid #fff', overflow: 'hidden' }}>
                    <img src={`https://ui-avatars.com/api/?name=${brandName}&background=3b82f6&color=fff`} style={{ width:'100%', height:'100%' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Heart size={28} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>12.4K</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <MessageCircle size={28} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', transform: 'scaleX(-1)' }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>248</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Send size={28} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>3.1K</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <MoreHorizontal size={28} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                </div>
              </div>

              {/* 하단 페이크 UI */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 60, zIndex: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>@{brandName}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'transparent', border: '1px solid #fff', padding: '2px 8px', borderRadius: 4 }}>팔로우</span>
                </div>
                <div style={{ fontSize: 13, color: '#fff', opacity: 0.95, textShadow: '0 1px 3px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, marginBottom: 12 }}>
                  {caption.split('\n')[0]}... <span style={{ fontWeight: 600 }}>더보기</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  <Music size={12} />
                  <span className="marquee-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', width: 120 }}>{brandName} 오리지널 오디오</span>
                </div>
              </div>

              {/* 회전하는 음원 디스크 */}
              <div style={{
                position: 'absolute', bottom: 16, right: 12, width: 40, height: 40, borderRadius: '50%',
                background: '#222', border: '6px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'spinDisc 4s linear infinite', zIndex: 4, boxShadow: '0 0 10px rgba(0,0,0,0.5)'
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: `url('https://ui-avatars.com/api/?name=${brandName}')`, backgroundSize: 'cover' }} />
              </div>

              {/* 음성 토글 컨트롤러 (우측 상단) */}
              <button onClick={() => setTtsEnabled(!ttsEnabled)} style={{
                position: 'absolute', top: 32, right: 16, zIndex: 10,
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 12px',
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}>
                {ttsEnabled ? '🔊 사운드 ON' : '🔇 사운드 OFF'}
              </button>

              {/* 진행도 프로그레스 바 */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)', zIndex: 10 }}>
                <div style={{
                  height: '100%', background: '#fff',
                  width: `${((activeSubtitleIdx + 1) / script.length) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* 트렌디 BGM (오디오 루프) */}
              {ttsEnabled && (
                <audio ref={bgmRef} src="https://assets.mixkit.co/music/preview/mixkit-chill-bro-89.mp3" autoPlay loop />
              )}

              {/* 재생/일시정지 오버레이 토글 */}
              <div 
                onClick={togglePlay} 
                style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer' }} 
              />

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Video size={32} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>스토리보드 미리보기</h3>
              <p style={{ fontSize: 13, maxWidth: 240, lineHeight: 1.5 }}>좌측에서 주제를 입력하면 AI가 대본과 어울리는 배경 영상을 매칭해드립니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
