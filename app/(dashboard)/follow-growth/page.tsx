'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';

const IMPACT_COLOR: Record<string, string> = { '높음': '#10b981', '보통': '#f59e0b', '낮음': '#6b7280' };
const EFF_COLOR = (n: number) => n >= 9 ? '#10b981' : n >= 7 ? '#f59e0b' : '#6b7280';

export default function FollowGrowthPage() {
  const [niche, setNiche] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('10000');
  const [freq, setFreq] = useState('매일');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [realtime, setRealtime] = useState(false);
  const [tab, setTab] = useState<'content'|'hack'|'hashtag'|'schedule'|'cta'|'algo'>('content');

  const handleGenerate = async () => {
    if (!niche) return alert('분야(니치)를 입력해주세요');
    setLoading(true); setPlan(null);
    try {
      const res = await fetch('/api/follow-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, currentFollowers: Number(current)||0, targetFollowers: Number(target)||10000, postingFreq: freq, brandName: brand }),
      });
      const data = await res.json();
      setPlan(data.plan);
      setRealtime(data.realtime);
    } catch { alert('오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'content', label: '📱 콘텐츠 공식' },
    { key: 'hack', label: '⚡ 성장 해킹' },
    { key: 'hashtag', label: '#️⃣ 해시태그' },
    { key: 'schedule', label: '📅 주간 스케줄' },
    { key: 'cta', label: '🎯 CTA 템플릿' },
    { key: 'algo', label: '🤖 알고리즘 팁' },
  ] as const;

  return (
    <div className="page-container animate-fade-in">
      <Header title="팔로워 폭발 성장 엔진" subtitle="실시간 트렌드 + AI 분석으로 팔로워 최대치 달성 전략을 자동 생성합니다" />

      {/* 입력 패널 */}
      <div style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(245,158,11,0.08))', border:'1px solid rgba(239,68,68,0.2)', borderRadius:16, padding:24, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#ef4444,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🚀</div>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>팔로워 폭발 전략 생성기</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>구글뉴스·트렌드 실시간 수집 → AI 맞춤 성장 로드맵</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>분야 / 니치 *</label>
            <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="예: 다이어트, 재테크, 뷰티, IT"
              style={{ width:'100%', padding:'12px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>현재 팔로워 수</label>
            <input value={current} onChange={e=>setCurrent(e.target.value)} placeholder="예: 500"
              style={{ width:'100%', padding:'12px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>목표 팔로워 수</label>
            <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="예: 10000"
              style={{ width:'100%', padding:'12px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>포스팅 빈도</label>
            <div style={{ display:'flex', gap:6 }}>
              {['매일','주3회','주5회','주2회'].map(f=>(
                <button key={f} onClick={()=>setFreq(f)} style={{ flex:1, padding:'10px 0', fontSize:12, fontWeight:700, borderRadius:8, border: freq===f ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: freq===f ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', color: freq===f ? '#fca5a5' : 'rgba(255,255,255,0.5)', cursor:'pointer' }}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>브랜드명 (선택)</label>
            <input value={brand} onChange={e=>setBrand(e.target.value)} placeholder="예: @migo_official"
              style={{ width:'100%', padding:'12px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading} style={{ width:'100%', padding:'16px', background: loading ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#ef4444,#f59e0b)', border:'none', borderRadius:12, color:'#fff', fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10, boxShadow: loading ? 'none' : '0 4px 24px rgba(239,68,68,0.4)', transition:'all 0.2s' }}>
          {loading ? <><div className="spinner" />구글뉴스·트렌드 실시간 수집 후 AI 분석 중...</> : <>🚀 팔로워 폭발 전략 즉시 생성하기</>}
        </button>
      </div>

      {/* 결과 */}
      {plan && (
        <div>
          {/* 요약 카드 */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[
              { icon:'📅', label:'예상 달성 기간', value:`${plan.summary?.estimatedDays}일`, color:'#818cf8' },
              { icon:'👥', label:'일일 팔로워 증가', value:plan.summary?.dailyFollowerGain+'명', color:'#10b981' },
              { icon:'🎯', label:'3개월 예상 도달', value:plan.summary?.totalProjection+'명', color:'#f59e0b' },
              { icon:'⚡', label:'수집 데이터', value: realtime ? '실시간' : 'AI분석', color: realtime ? '#10b981' : '#6b7280' },
            ].map(c=>(
              <div key={c.label} style={{ background:'rgba(0,0,0,0.4)', border:`1px solid ${c.color}30`, borderRadius:14, padding:20 }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{c.icon}</div>
                <div style={{ fontSize:20, fontWeight:900, color:c.color, marginBottom:4 }}>{c.value}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* 핵심 인사이트 */}
          {plan.summary?.keyInsight && (
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'14px 18px', marginBottom:24, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:18 }}>💡</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#fcd34d', marginBottom:4, letterSpacing:'0.05em' }}>핵심 인사이트</div>
                <div style={{ fontSize:13, color:'#fff', lineHeight:1.6 }}>{plan.summary.keyInsight}</div>
              </div>
            </div>
          )}

          {/* 탭 네비게이션 */}
          <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
            {tabs.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'9px 16px', fontSize:12, fontWeight:700, borderRadius:20, border: tab===t.key ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', background: tab===t.key ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', color: tab===t.key ? '#fca5a5' : 'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.2s' }}>{t.label}</button>
            ))}
          </div>

          {/* 콘텐츠 공식 탭 */}
          {tab==='content' && plan.contentFormula && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {plan.contentFormula.map((c:any, i:number)=>(
                <div key={i} style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff' }}>{c.type}</div>
                    <div style={{ fontSize:11, fontWeight:700, background:'rgba(16,185,129,0.15)', color:'#6ee7b7', padding:'3px 10px', borderRadius:20, border:'1px solid rgba(16,185,129,0.3)' }}>전환율 {c.followerConvRate}</div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, background:'rgba(129,140,248,0.15)', color:'#a5b4fc', padding:'2px 8px', borderRadius:4, fontWeight:700 }}>비율 {c.ratio}</span>
                    <span style={{ fontSize:11, background:'rgba(245,158,11,0.15)', color:'#fcd34d', padding:'2px 8px', borderRadius:4, fontWeight:700 }}>⏰ {c.bestTime}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#cbd5e1', marginBottom:8, lineHeight:1.5 }}>🎯 {c.hook}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.04)', padding:'8px 12px', borderRadius:8, lineHeight:1.5 }}>
                    <strong style={{ color:'rgba(255,255,255,0.6)' }}>예시 제목:</strong> {c.example}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 성장 해킹 탭 */}
          {tab==='hack' && plan.growthHacks && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {plan.growthHacks.map((h:any, i:number)=>(
                <div key={i} style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background: i<2 ? 'linear-gradient(135deg,#ef4444,#f97316)' : i<4 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff', flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff', flex:1 }}>{h.hack}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${IMPACT_COLOR[h.impact]}20`, color:IMPACT_COLOR[h.impact], border:`1px solid ${IMPACT_COLOR[h.impact]}40` }}>효과 {h.impact}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>난이도 {h.effort}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6, marginBottom:8 }}>{h.desc}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#6ee7b7', background:'rgba(16,185,129,0.1)', padding:'6px 12px', borderRadius:8, display:'inline-block' }}>📈 예상 획득: {h.expectedGain}</div>
                </div>
              ))}
            </div>
          )}

          {/* 해시태그 탭 */}
          {tab==='hashtag' && plan.hashtagStrategy && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'rgba(129,140,248,0.08)', border:'1px solid rgba(129,140,248,0.2)', borderRadius:14, padding:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#a5b4fc', marginBottom:8 }}>📐 최적 구조</div>
                <div style={{ fontSize:13, color:'#fff', lineHeight:1.6 }}>{plan.hashtagStrategy.structure}</div>
              </div>
              {[
                { label:'🔝 대형 태그 (대중 도달)', tags: plan.hashtagStrategy.topTags, color:'#ef4444' },
                { label:'🎯 니치 태그 (타겟 유입)', tags: plan.hashtagStrategy.nicheTags, color:'#10b981' },
                { label:'📈 트렌딩 태그 (즉시 노출)', tags: plan.hashtagStrategy.trendingTags, color:'#f59e0b' },
                { label:'🚫 피해야 할 태그', tags: plan.hashtagStrategy.avoidTags, color:'#6b7280' },
              ].map(group=>(
                <div key={group.label} style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:10 }}>{group.label}</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {group.tags?.map((tag:string, ti:number)=>(
                      <span key={ti} onClick={()=>navigator.clipboard.writeText(tag)} style={{ fontSize:12, color:group.color, background:`${group.color}15`, padding:'4px 10px', borderRadius:20, border:`1px solid ${group.color}30`, fontWeight:600, cursor:'pointer' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:12, padding:14, fontSize:13, color:'#fcd34d', lineHeight:1.6 }}>
                💡 {plan.hashtagStrategy.tip}
              </div>
            </div>
          )}

          {/* 주간 스케줄 탭 */}
          {tab==='schedule' && plan.weeklySchedule && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {plan.weeklySchedule.map((d:any, i:number)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 1fr 1fr', gap:12, alignItems:'center', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 18px' }}>
                  <div style={{ fontSize:13, fontWeight:900, color:'#fff' }}>{d.day}</div>
                  <div style={{ fontSize:11, fontWeight:700, background:'rgba(129,140,248,0.15)', color:'#a5b4fc', padding:'3px 10px', borderRadius:20, textAlign:'center', border:'1px solid rgba(129,140,248,0.3)' }}>{d.contentType}</div>
                  <div style={{ fontSize:12, color:'#cbd5e1', lineHeight:1.4 }}>{d.topic}</div>
                  <div style={{ fontSize:11, color:'#6ee7b7', fontWeight:700 }}>🎯 {d.goal}</div>
                </div>
              ))}
            </div>
          )}

          {/* CTA 템플릿 탭 */}
          {tab==='cta' && plan.ctaTemplates && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {plan.ctaTemplates.map((c:any, i:number)=>(
                <div key={i} style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>{c.type}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontSize:11, color:EFF_COLOR(c.effectiveness), fontWeight:800 }}>효과도 {c.effectiveness}/10</div>
                      <div style={{ width:60, height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${c.effectiveness*10}%`, height:'100%', background:EFF_COLOR(c.effectiveness), borderRadius:2 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:14, color:'#fff', whiteSpace:'pre-line', lineHeight:1.7, background:'rgba(255,255,255,0.04)', padding:'12px 16px', borderRadius:10, borderLeft:'3px solid #ef4444' }}>{c.template}</div>
                  <button onClick={()=>navigator.clipboard.writeText(c.template)} style={{ marginTop:10, fontSize:11, fontWeight:700, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#fca5a5', padding:'6px 14px', borderRadius:8, cursor:'pointer' }}>📋 복사하기</button>
                </div>
              ))}
            </div>
          )}

          {/* 알고리즘 팁 탭 */}
          {tab==='algo' && plan.algorithmTips && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {plan.algorithmTips.map((tip:string, i:number)=>(
                <div key={i} style={{ display:'flex', gap:16, background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:20, alignItems:'flex-start' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background: i===0 ? 'linear-gradient(135deg,#ef4444,#f97316)' : i===1 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : i===2 ? 'linear-gradient(135deg,#10b981,#059669)' : i===3 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:'#fff', flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.7 }}>{tip}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
