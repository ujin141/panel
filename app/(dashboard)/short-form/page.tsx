'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { logActivity } from '@/lib/activityTracker';
import { Sparkles, Video, Type, Heart, MessageCircle, Send, MoreHorizontal, Music, Upload, Settings, Lock, Unlock, ChevronDown, ChevronUp, Zap, TrendingUp } from 'lucide-react';

interface ScriptItem { id: string; type: 'hook'|'agitate'|'solution'|'cta'; text: string; duration: number; }

const TREND_CATS = [
  { id:'all', e:'🌐', l:'전체' }, { id:'여행/맛집', e:'✈️', l:'여행/맛집' },
  { id:'뷰티/패션', e:'💄', l:'뷰티/패션' }, { id:'재테크/돈', e:'💰', l:'재테크' },
  { id:'운동/다이어트', e:'💪', l:'운동' }, { id:'자기계발', e:'🔥', l:'자기계발' },
  { id:'요리/레시피', e:'🍳', l:'요리' }, { id:'IT/AI', e:'💻', l:'IT/AI' }, { id:'일상/공감', e:'💬', l:'일상' },
];
const TYPE_COLORS: Record<string,string> = { hook:'#fb923c', agitate:'#fde047', solution:'#86efac', cta:'#c084fc' };
const TYPE_BG: Record<string,string> = {
  hook:'linear-gradient(135deg,rgba(249,115,22,0.18),rgba(239,68,68,0.18))',
  agitate:'linear-gradient(135deg,rgba(234,179,8,0.18),rgba(217,119,6,0.18))',
  solution:'linear-gradient(135deg,rgba(34,197,94,0.18),rgba(16,185,129,0.18))',
  cta:'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.18))',
};
const TYPE_BORDER: Record<string,string> = { hook:'rgba(249,115,22,0.35)', agitate:'rgba(234,179,8,0.35)', solution:'rgba(34,197,94,0.35)', cta:'rgba(168,85,247,0.35)' };
const TYPE_LABEL: Record<string,string> = { hook:'🔥 HOOK', agitate:'🔪 AGITATE', solution:'💡 SOLUTION', cta:'🎯 CTA' };

const getSubPos = (type: string, fixed: boolean, pos: 'top'|'center'|'bottom') => {
  if (fixed) {
    if (pos === 'top')    return { top: '18%' };
    if (pos === 'center') return { top: '50%', transform: 'translateY(-50%)' };
    return { bottom: '22%' };
  }
  if (type === 'hook')    return { top: '18%' };
  if (type === 'agitate') return { top: '32%' };
  if (type === 'cta')     return { bottom: '20%' };
  return { top: '42%', transform: 'translateY(-50%)' }; // solution = center
};

export default function ShortFormPage() {
  // ─── 기본 입력 ───
  const [topic, setTopic] = useState('');
  const [brandName, setBrandName] = useState('PanelAI');
  const [category, setCategory] = useState('정보/꿀팁');
  const [brandSaved, setBrandSaved] = useState(false);

  // ─── AI 추천 ───
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trendCat, setTrendCat] = useState('all');

  // ─── 생성 결과 ───
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<ScriptItem[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  // ─── 프리뷰 ───
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [editIdx, setEditIdx] = useState<number|null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);

  // ─── 설정 ───
  const [showSettings, setShowSettings] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [textFixed, setTextFixed] = useState(false);
  const [textPos, setTextPos] = useState<'top'|'center'|'bottom'>('center');
  const [textSize, setTextSize] = useState(34);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBold, setTextBold] = useState(true);
  const [textStroke, setTextStroke] = useState(false);
  const [textBg, setTextBg] = useState(false);
  const [cardMode, setCardMode] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('panelai_brandName');
    if (s) setBrandName(s);
  }, []);

  // 자막 타이머
  useEffect(() => {
    if (!isPlaying || !script.length) return;
    const t = setTimeout(() => setActiveIdx(p => (p+1)%script.length), script[activeIdx].duration*1000);
    return () => clearTimeout(t);
  }, [activeIdx, isPlaying, script]);

  const saveBrand = () => {
    if (!brandName.trim()) return;
    localStorage.setItem('panelai_brandName', brandName.trim());
    setBrandSaved(true); setTimeout(()=>setBrandSaved(false), 2000);
  };

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCustomBgUrl(URL.createObjectURL(f)); setVideoUrl(URL.createObjectURL(f));
  }, []);

  const updateText = (i: number, v: string) => setScript(p => p.map((s,idx)=>idx===i?{...s,text:v}:s));
  const updateDuration = (i: number, v: number) => setScript(p => p.map((s,idx)=>idx===i?{...s,duration:v}:s));
  const changeType = (i: number, t: ScriptItem['type']) => setScript(p => p.map((s,idx)=>idx===i?{...s,type:t}:s));
  const deleteScene = (i: number) => { setScript(p=>p.filter((_,idx)=>idx!==i)); if(activeIdx>=i&&activeIdx>0) setActiveIdx(a=>a-1); };
  const moveScene = (i: number, dir: -1|1) => setScript(p => { const a=[...p]; const j=i+dir; if(j<0||j>=a.length) return p; [a[i],a[j]]=[a[j],a[i]]; return a; });
  const insertScene = (afterIdx: number) => {
    const newItem: ScriptItem = { id: Date.now().toString(), type: 'solution', text: '여기에 자막을 입력하세요', duration: 3 };
    setScript(p => { const a=[...p]; a.splice(afterIdx+1,0,newItem); return a; });
    setEditIdx(afterIdx+1);
    setActiveIdx(afterIdx+1);
  };

  const generate = async (ft?: string, fc?: string) => {
    const t = ft||topic, c = fc||category;
    if (!t) return alert('주제를 입력해주세요.');
    setLoading(true);
    try {
      const r = await fetch('/api/short-form/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({topic:t,category:c,brandName}) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setScript(d.script); setVideoUrl(d.videoUrl); setCaption(d.caption); setHashtags(d.hashtags);
      setActiveIdx(0); setIsPlaying(true); setShowSettings(true); logActivity('short_form');
    } catch(e:any) { alert(e.message); } finally { setLoading(false); }
  };

  const recommend = async (type: 'custom'|'viral') => {
    setRecommending(true); setRecommendations([]);
    const cat = trendCat!=='all' ? trendCat : category;
    try {
      const r = await fetch('/api/short-form/recommend', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({brandName, category:cat, type}) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setRecommendations(d.recommendations||[]);
    } catch(e:any) { alert(e.message); } finally { setRecommending(false); }
  };

  const togglePlay = () => { if (videoRef.current) { isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(p=>!p); } };
  const copy = (t:string) => { navigator.clipboard.writeText(t); alert('복사됨!'); };

  // ─── 자막 위치 계산 ───
  const getSubPos = (type: string) => {
    if (textFixed) return { top: {top:'10%',center:'38%',bottom:'70%'}[textPos] };
    return ({hook:{top:'10%'}, agitate:{top:'36%'}, solution:{top:'54%'}, cta:{bottom:'20%'}} as any)[type] || {top:'38%'};
  };

  // CSS 글로벌
  const globalCss = `
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css');
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700;900&display=swap');
    @keyframes subPop { 0%{transform:scale(0.75) translateY(18px);opacity:0} 60%{transform:scale(1.06) translateY(-3px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
    @keyframes slideUp { 0%{transform:translateY(24px);opacity:0} 100%{transform:translateY(0);opacity:1} }
    @keyframes glow { 0%,100%{text-shadow:0 0 20px currentColor,0 2px 0 rgba(0,0,0,0.9)} 50%{text-shadow:0 0 40px currentColor,0 0 60px currentColor,0 2px 0 rgba(0,0,0,0.9)} }
    @keyframes spin { 100%{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes cardIn { 0%{transform:translateY(20px) scale(0.94);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
    @keyframes cardBg { 0%{opacity:0} 100%{opacity:1} }
    .sf-input:focus { border-color:#3b82f6!important; box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important; }
    .sf-card:hover { border-color:rgba(59,130,246,0.4)!important; transform:translateY(-2px); }
    .rec-card:hover { border-color:#3b82f6!important; background:rgba(59,130,246,0.08)!important; }
  `;
  return (<div className="page-container"><style dangerouslySetInnerHTML={{__html:globalCss}}/><Header title="AI 숏폼 영상 제작" subtitle="2026 트렌드 기반 바이럴 대본 + 배경영상 자동 매칭"/><div className="page-content" style={{display:'flex',gap:28,paddingBottom:32,height:'calc(100vh - 100px)'}}><div style={{width:'46%',display:'flex',flexDirection:'column',gap:16,overflowY:'auto',paddingRight:4}}><div style={{background:'linear-gradient(145deg,rgba(25,25,35,0.9),rgba(15,15,25,0.95))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:20}}><h2 style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:14,display:'flex',alignItems:'center',gap:8}}><span style={{padding:'5px 6px',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',borderRadius:8,display:'flex'}}><TrendingUp size={13} color="#fff"/></span>AI 숏폼 기획실</h2><div style={{marginBottom:12}}><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>트렌드 카테고리</span><div style={{display:'flex',flexWrap:'wrap',gap:6}}>{TREND_CATS.map(c=>(<button key={c.id} onClick={()=>setTrendCat(c.id)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',background:trendCat===c.id?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${trendCat===c.id?'#3b82f6':'rgba(255,255,255,0.1)'}`,color:trendCat===c.id?'#93c5fd':'rgba(255,255,255,0.4)'}}>{c.e} {c.l}</button>))}</div></div><div style={{display:'flex',gap:8,marginBottom:recommendations.length?12:0}}><button onClick={()=>recommend('custom')} disabled={recommending} style={{flex:1,padding:'9px',borderRadius:9,border:'1px solid rgba(59,130,246,0.4)',background:'rgba(59,130,246,0.12)',color:'#60a5fa',fontSize:12,fontWeight:600,cursor:'pointer',opacity:recommending?0.6:1}}>🎯 {trendCat!=='all'?trendCat:'카테고리'} 맞춤</button><button onClick={()=>recommend('viral')} disabled={recommending} style={{flex:1,padding:'9px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#ef4444,#f97316)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',opacity:recommending?0.6:1}}>🔥 글로벌 트렌드</button></div>{recommendations.map((rec,i)=>(<div key={i} onClick={()=>{setTopic(rec.topic);setCategory(rec.category||category);generate(rec.topic,rec.category||category);}} style={{padding:12,borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.02)',cursor:'pointer',marginTop:8,transition:'all 0.2s'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:700,color:'#fff'}}>{rec.topic}</span>{rec.viralScore&&<span style={{fontSize:10,fontWeight:700,color:'#fca5a5',background:'rgba(239,68,68,0.15)',padding:'2px 7px',borderRadius:20}}>🔥 {rec.viralScore}점</span>}</div><p style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.5}}>{rec.reason}</p></div>))}</div><div style={{background:'linear-gradient(145deg,rgba(25,25,35,0.9),rgba(15,15,25,0.95))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:20}}><h2 style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:14,display:'flex',alignItems:'center',gap:8}}><span style={{padding:'5px 6px',background:'linear-gradient(135deg,#8b5cf6,#ec4899)',borderRadius:8,display:'flex'}}><Sparkles size={13} color="#fff"/></span>영상 설정</h2><div style={{marginBottom:12}}><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>주제</span><input className="sf-input" value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&generate()} placeholder="예: 직장인 5분 다이어트 현실 식단" style={{width:'100%',padding:'12px 14px',background:'rgba(0,0,0,0.25)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#fff',fontSize:14,outline:'none',boxSizing:'border-box'} as React.CSSProperties}/></div><div style={{marginBottom:12}}><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>영상 스타일</span><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{['정보/꿀팁','브이로그/일상','유머/공감','홍보/리뷰'].map(c=>(<button key={c} onClick={()=>setCategory(c)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',background:category===c?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${category===c?'#3b82f6':'rgba(255,255,255,0.1)'}`,color:category===c?'#93c5fd':'rgba(255,255,255,0.4)'}}>{c}</button>))}</div></div><div style={{marginBottom:14}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600}}>🏷️ 브랜드명</span>{brandSaved&&<span style={{fontSize:11,color:'#86efac',fontWeight:700}}>✓ 저장됨</span>}</div><div style={{display:'flex',gap:8}}><input className="sf-input" value={brandName} onChange={e=>setBrandName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveBrand()} placeholder="PanelAI" style={{flex:1,padding:'12px 14px',background:'rgba(0,0,0,0.25)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#fff',fontSize:14,outline:'none'} as React.CSSProperties}/><button onClick={saveBrand} style={{padding:'0 16px',borderRadius:10,border:'none',background:brandSaved?'rgba(34,197,94,0.2)':'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:brandSaved?'#86efac':'#fff',fontWeight:700,cursor:'pointer'}}>{brandSaved?'✓':'저장'}</button></div></div><button onClick={()=>generate()} disabled={loading} style={{width:'100%',padding:'15px',borderRadius:12,border:'none',background:loading?'rgba(255,255,255,0.08)':'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 8px 24px rgba(59,130,246,0.3)'}}>{loading?'⚡ AI 대본·영상 생성 중...':<><Sparkles size={16}/> 바이럴 숏폼 생성하기</>}</button></div>{script.length>0&&(<div style={{background:'linear-gradient(145deg,rgba(25,25,35,0.9),rgba(15,15,25,0.95))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:20}}><h2 style={{fontSize:15,fontWeight:700,marginBottom:14}}><span style={{background:'linear-gradient(to right,#3b82f6,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>✨ 바이럴 대본</span></h2><div style={{display:'flex',flexDirection:'column',gap:10}}>{script.map((item,i)=>(<div key={item.id} onClick={()=>setActiveIdx(i)} style={{padding:13,borderRadius:12,background:i===activeIdx?TYPE_BG[item.type]:'rgba(255,255,255,0.03)',border:`1px solid ${i===activeIdx?TYPE_BORDER[item.type]:'rgba(255,255,255,0.07)'}`,cursor:'pointer',transition:'all 0.25s',position:'relative',overflow:'hidden'}}>{i===activeIdx&&<div style={{position:'absolute',top:0,left:0,width:3,height:'100%',background:`linear-gradient(to bottom,${TYPE_COLORS[item.type]},transparent)`}}/>}<div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}><span style={{fontSize:11,fontWeight:700,color:TYPE_COLORS[item.type],background:'rgba(0,0,0,0.3)',padding:'2px 8px',borderRadius:5}}>{TYPE_LABEL[item.type]} ({item.duration}초)</span><button onClick={e=>{e.stopPropagation();setEditIdx(editIdx===i?null:i);}} style={{fontSize:11,padding:'2px 7px',borderRadius:5,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.45)',cursor:'pointer'}}>{editIdx===i?'✓ 완료':'✏️'}</button></div>{editIdx===i?(<textarea value={item.text} onChange={e=>updateText(i,e.target.value)} onClick={e=>e.stopPropagation()} rows={3} style={{width:'100%',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(59,130,246,0.4)',borderRadius:7,color:'#fff',fontSize:13,padding:'7px',resize:'vertical',outline:'none',fontFamily:'inherit',boxSizing:'border-box'} as React.CSSProperties}/>):(<p style={{fontSize:14,color:i===activeIdx?'#fff':'rgba(255,255,255,0.6)',lineHeight:1.6,fontWeight:i===activeIdx?600:400}}>{item.text}</p>)}</div>))}</div>{caption&&(<div style={{marginTop:14,padding:13,background:'rgba(0,0,0,0.2)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>인스타 캡션</span><button onClick={()=>copy(caption+'\n\n'+hashtags.join(' '))} style={{fontSize:11,padding:'3px 9px',borderRadius:5,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>복사</button></div><p style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.6,marginBottom:8}}>{caption}</p><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{hashtags.map(h=><span key={h} style={{fontSize:11,color:'#60a5fa',background:'rgba(59,130,246,0.1)',padding:'2px 7px',borderRadius:10}}>{h}</span>)}</div></div>)}</div>)}</div><div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>{videoUrl&&(<div style={{background:'linear-gradient(145deg,rgba(25,25,35,0.9),rgba(15,15,25,0.95))',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:14}}><button onClick={()=>setShowSettings(v=>!v)} style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',color:'#fff',cursor:'pointer',padding:0,marginBottom:showSettings?12:0}}><span style={{display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:700}}><Settings size={13} color="#a78bfa"/> 영상 · 자막 설정</span>{showSettings?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>{showSettings&&(<div style={{display:'flex',flexDirection:'column',gap:10}}><div><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>🎬 배경 영상</span><div style={{display:'flex',gap:7}}><button onClick={()=>bgFileRef.current?.click()} style={{flex:1,padding:'8px',borderRadius:8,border:'1px dashed rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}><Upload size={11}/> 내 영상 업로드</button><input ref={bgFileRef} type="file" accept="video/*" onChange={handleBgUpload} style={{display:'none'}}/>{customBgUrl&&<button onClick={()=>setCustomBgUrl('')} style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#f87171',fontSize:12,cursor:'pointer'}}>원본</button>}</div>{customBgUrl&&<p style={{fontSize:10,color:'#86efac',marginTop:4}}>✓ 커스텀 영상 적용 중</p>}</div><div><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>📌 자막 위치</span><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button onClick={()=>setTextFixed(f=>!f)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,background:textFixed?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${textFixed?'#3b82f6':'rgba(255,255,255,0.1)'}`,color:textFixed?'#93c5fd':'rgba(255,255,255,0.4)'}}>{textFixed?<Lock size={10}/>:<Unlock size={10}/>}{textFixed?'고정됨':'타입별 자동'}</button>{textFixed&&(['top','center','bottom'] as const).map(p=>(<button key={p} onClick={()=>setTextPos(p)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',background:textPos===p?'rgba(59,130,246,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${textPos===p?'#3b82f6':'rgba(255,255,255,0.1)'}`,color:textPos===p?'#93c5fd':'rgba(255,255,255,0.4)'}}>{p==='top'?'▲ 상단':p==='center'?'■ 중앙':'▼ 하단'}</button>))}</div></div><div><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>Aa 크기: {textSize}px</span><input type="range" min={14} max={42} value={textSize} onChange={e=>setTextSize(+e.target.value)} style={{width:'100%',accentColor:'#3b82f6'}}/></div><div><span style={{color:'rgba(255,255,255,0.55)',fontSize:12,fontWeight:600,marginBottom:6,display:'block'}}>🎨 자막 색상</span><div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>{['#ffffff','#FFE600','#86efac','#f87171','#93c5fd','#c084fc','#000000'].map(c=>(<button key={c} onClick={()=>setTextColor(c)} style={{width:24,height:24,borderRadius:'50%',background:c,border:textColor===c?'3px solid #fff':'2px solid rgba(255,255,255,0.2)',cursor:'pointer',flexShrink:0}}/>))}<input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)} style={{width:24,height:24,borderRadius:'50%',border:'none',cursor:'pointer',padding:0}}/></div></div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{[{l:'B 두껍체',v:textBold,s:setTextBold},{l:'□ 아웃라인',v:textStroke,s:setTextStroke},{l:'■ 배경',v:textBg,s:setTextBg}].map(o=>(<button key={o.l} onClick={()=>o.s((v:boolean)=>!v)} style={{padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',background:o.v?'rgba(245,158,11,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${o.v?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.1)'}`,color:o.v?'#fcd34d':'rgba(255,255,255,0.4)'}}>{o.l}</button>))}</div></div>)}</div>)}<div style={{flex:1,display:'flex',justifyContent:'center',alignItems:'center',background:'var(--bg-elevated)',borderRadius:20,border:'1px solid var(--border-subtle)',minHeight:300}}>{videoUrl?(<div style={{width:270,height:555,borderRadius:38,border:'8px solid #1a1a2e',position:'relative',overflow:'hidden',boxShadow:'0 0 0 2px #2d2d4e,0 30px 60px rgba(0,0,0,0.6)',background:'#000'}}><div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:90,height:20,background:'#1a1a2e',borderBottomLeftRadius:12,borderBottomRightRadius:12,zIndex:20}}/>{!cardMode&&<><video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/><div style={{position:'absolute',inset:0,zIndex:1,background:'linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,transparent 22%,transparent 55%,rgba(0,0,0,0.88) 100%)'}}/>\n</>}
{cardMode&&script[activeIdx]&&(()=>{const item=script[activeIdx];
  const cardBgs:Record<string,string>={hook:'linear-gradient(160deg,#0a0010 0%,#1e0a3c 50%,#3b0764 100%)',agitate:'linear-gradient(160deg,#0a0000 0%,#3b0000 50%,#7f1d1d 100%)',solution:'linear-gradient(160deg,#000a05 0%,#052e16 50%,#14532d 100%)',cta:'linear-gradient(160deg,#050010 0%,#1e1b4b 50%,#312e81 100%)'};
  const cardAccent:Record<string,string>={hook:'#a78bfa',agitate:'#fb7185',solution:'#34d399',cta:'#60a5fa'};
  const cardEmoji:Record<string,string>={hook:'🔥',agitate:'💡',solution:'✅',cta:'👇'};
  const bg=cardBgs[item.type]||cardBgs.solution;
  const accent=cardAccent[item.type]||'#fff';
  const emoji=cardEmoji[item.type]||'📌';
  const sceneNum=script.indexOf(item)+1;
  return(<div key={item.id+activeIdx} style={{position:'absolute',inset:0,background:bg,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:'30px 22px',zIndex:3,animation:'cardBg 0.25s ease forwards'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(to right,transparent,${accent},transparent)`}}/>
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,background:`linear-gradient(to right,transparent,${accent}44,transparent)`}}/>
    <div style={{position:'absolute',top:16,left:16,fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.3)',letterSpacing:3,fontFamily:"'Pretendard',sans-serif"}}>0{sceneNum} / 0{script.length}</div>
    <div style={{position:'absolute',top:12,right:14,fontSize:9,fontWeight:700,color:accent,border:`1px solid ${accent}55`,padding:'2px 9px',borderRadius:20,fontFamily:"'Pretendard',sans-serif",letterSpacing:1}}>{TYPE_LABEL[item.type].replace(/^.*? /,'')}</div>
    <div style={{animation:'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',display:'flex',flexDirection:'column',alignItems:'center',gap:14,width:'100%'}}>
      <span style={{fontSize:36,lineHeight:1,filter:`drop-shadow(0 0 16px ${accent})`}}>{emoji}</span>
      <p style={{fontFamily:"'Pretendard','Noto Sans KR',sans-serif",fontSize:item.text.length>20?18:item.text.length>14?21:24,fontWeight:900,color:'#fff',textAlign:'center',lineHeight:1.4,wordBreak:'keep-all',textShadow:`0 0 30px ${accent}88,0 2px 0 rgba(0,0,0,0.8)`,letterSpacing:'-0.02em'}}>{item.text}</p>
      <div style={{width:32,height:1,background:`linear-gradient(to right,transparent,${accent},transparent)`,opacity:0.6}}/>
    </div>
    <div style={{position:'absolute',bottom:14,left:0,right:0,display:'flex',justifyContent:'center'}}>
      <span style={{fontFamily:"'Pretendard',sans-serif",fontSize:9,fontWeight:600,color:'rgba(255,255,255,0.25)',letterSpacing:2}}>@{brandName}</span>
    </div>
  </div>);
})()}
{!cardMode&&script[activeIdx]&&(()=>{
  const item=script[activeIdx];
  const pos=getSubPos(item.type,textFixed,textPos);
  const isHook=item.type==='hook';
  const isCta=item.type==='cta';
  const isSol=item.type==='solution';
  const glowColor=isHook?'rgba(251,191,36,0.9)':isCta?'rgba(192,132,252,0.9)':isSol?'rgba(134,239,172,0.8)':'rgba(255,255,255,0.5)';
  const fc=textColor;
  const shadow=`0 2px 0 rgba(0,0,0,1),0 4px 0 rgba(0,0,0,0.8),0 0 30px ${glowColor},0 0 60px ${glowColor}`;
  return(
    <div key={item.id+activeIdx} style={{position:'absolute',left:0,right:0,...pos,display:'flex',flexDirection:'column',alignItems:'center',padding:'0 12px',zIndex:5,pointerEvents:'none',animation:'subPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'}}>
      {isHook&&<span style={{fontFamily:"'Pretendard','Noto Sans KR',sans-serif",fontSize:11,fontWeight:800,color:'#FFE600',letterSpacing:3,marginBottom:6,textShadow:'0 0 12px rgba(251,191,36,0.8)',textTransform:'uppercase'}}>🔥 지금 바로 확인</span>}
      <span style={{fontFamily:"'Pretendard','Noto Sans KR',sans-serif",fontSize:textSize,fontWeight:900,color:fc,textAlign:'center',lineHeight:1.25,wordBreak:'keep-all',letterSpacing:'-0.03em',textShadow:shadow,display:'block',maxWidth:'95%'}}>{item.text}</span>
      {isCta&&<div style={{marginTop:10,padding:'8px 20px',borderRadius:50,background:'linear-gradient(135deg,#7c3aed,#ec4899)',fontSize:11,fontWeight:800,color:'#fff',letterSpacing:1,boxShadow:'0 4px 20px rgba(124,58,237,0.7)'}}>지금 저장하기 👇</div>}
    </div>
  );
})()}
<div style={{position:'absolute',bottom:85,right:9,display:'flex',flexDirection:'column',gap:16,alignItems:'center',zIndex:4}}><div style={{width:32,height:32,borderRadius:'50%',background:'#fff',overflow:'hidden',border:'2px solid #fff'}}><img src={`https://ui-avatars.com/api/?name=${brandName}&background=3b82f6&color=fff`} style={{width:'100%',height:'100%'}} alt=""/></div>{([{I:Heart,n:'12.4K'},{I:MessageCircle,n:'248'},{I:Send,n:'3.1K'}] as const).map(({I,n},i)=>(<div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}><I size={22} color="#fff" fill="#fff" style={{filter:'drop-shadow(0 1px 3px rgba(0,0,0,0.5))'}}/><span style={{color:'#fff',fontSize:10,fontWeight:600}}>{n}</span></div>))}<MoreHorizontal size={22} color="#fff"/></div>
<div style={{position:'absolute',bottom:12,left:10,right:45,zIndex:4}}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span style={{fontSize:12,fontWeight:700,color:'#fff'}}>@{brandName}</span><span style={{fontSize:10,color:'#fff',border:'1px solid rgba(255,255,255,0.6)',padding:'1px 6px',borderRadius:3}}>팔로우</span></div><p style={{fontSize:11,color:'rgba(255,255,255,0.85)',lineHeight:1.4,display:'-webkit-box' as any,WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{caption.split('\n')[0]}</p><div style={{display:'flex',alignItems:'center',gap:4,marginTop:4,fontSize:10,color:'rgba(255,255,255,0.7)'}}><Music size={10}/> {brandName} 오리지널</div></div>
{script.length>0&&<div style={{position:'absolute',top:26,left:0,right:0,display:'flex',justifyContent:'center',gap:4,zIndex:10}}>{script.map((_,i)=>(<button key={i} onClick={()=>setActiveIdx(i)} style={{width:i===activeIdx?16:4,height:4,borderRadius:2,border:'none',cursor:'pointer',transition:'all 0.2s',background:i===activeIdx?'#fff':'rgba(255,255,255,0.4)',padding:0}}/>))}</div>}
<div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'rgba(255,255,255,0.15)',zIndex:10}}><div style={{height:'100%',background:'#fff',width:`${script.length?((activeIdx+1)/script.length)*100:0}%`,transition:'width 0.3s ease'}}/></div>
<div onClick={togglePlay} style={{position:'absolute',inset:0,zIndex:2,cursor:'pointer'}}/></div>):(<div style={{textAlign:'center',color:'rgba(255,255,255,0.3)'}}><Video size={32} style={{marginBottom:10}}/><p style={{fontSize:13,fontWeight:600}}>스토리보드 미리보기</p><p style={{fontSize:11,marginTop:5,maxWidth:180}}>주제를 입력하면 AI가 대본과 배경 영상을 생성합니다</p></div>)}</div></div></div></div>);
}
