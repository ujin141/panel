'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import {
  TrendingUp, Sparkles, BarChart2, ArrowUpRight, ArrowDownRight,
  RefreshCw, Target, Zap, Eye, MessageCircle, Instagram
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Suggestion {
  id: string;
  insight: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
}

interface TopPost {
  id: string;
  content: string;
  type: string;
  platform: string;
  views: number;
  dms: number;
  dmRate: number;
}

const priorityConfig: Record<string, { label: string; badge: string }> = {
  high: { label: '높음', badge: 'badge-red' },
  medium: { label: '중간', badge: 'badge-orange' },
  low: { label: '낮음', badge: 'badge-default' },
};

export default function OptimizePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  
  const [overview, setOverview] = useState({ avgDmRate: '0.00', topType: '-', topTypeRate: 0 });
  const [contentTypeData, setContentTypeData] = useState<any[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [targets, setTargets] = useState<any[]>([]);

  const [instaUsername, setInstaUsername] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState('');

  const analyzeStepsText = [
    '스크래핑 엔진에 연결 중...',
    '공개 프로필 정보 수집 중...',
    '최근 게시물 및 성과 지표 추출 중...',
    'OpenAI 성과 분석 모델 구동 중...',
    '전략 도출 및 차트 생성 중...',
    '분석 완료!'
  ];

  const handleAnalyze = async () => {
    if (!instaUsername) return;
    setAnalyzing(true);
    setAnalyzeError('');
    setAnalyzeStep(0);
    
    const stepInterval = setInterval(() => {
      setAnalyzeStep(s => (s < 4 ? s + 1 : 4));
    }, 2500);

    try {
      const res = await fetch('/api/analyze-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: instaUsername.replace('@', '') }),
      });
      const data = await res.json();
      
      clearInterval(stepInterval);
      
      if (!res.ok) throw new Error(data.error);

      setAnalyzeStep(5);
      await fetchOptimizationData();
    } catch (e: any) {
      clearInterval(stepInterval);
      setAnalyzeError(e.message);
    } finally {
      setTimeout(() => {
        setAnalyzing(false);
        setAnalyzeError('');
      }, 3000);
    }
  };

  const handleApplyStrategy = (s: Suggestion) => {
    localStorage.setItem('panelai_active_strategy', JSON.stringify({
      insight: s.insight,
      suggestion: s.suggestion,
      type: s.type
    }));
    if (confirm(`'${s.type}' 전략이 저장되었습니다.\n\n지금 바로 이 전략을 기반으로 새로운 카드뉴스를 생성하시겠습니까?`)) {
      router.push('/card-news');
    }
  };

  const fetchOptimizationData = useCallback(async () => {
    try {
      const res = await fetch('/api/optimize');
      const json = await res.json();
      if (json.data) {
        setOverview(json.data.overview);
        setContentTypeData(json.data.contentTypeData);
        setTimeData(json.data.timeData);
        setTopPosts(json.data.topPosts);
        setSuggestions(json.data.suggestions);
        setTargets(json.data.targets);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOptimizationData();
  }, [fetchOptimizationData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOptimizationData();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>{label}</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>DM 전환율 {payload[0].value}%</div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div>
        <Header title="AI 최적화 루프" subtitle="성과 데이터를 분석하고 개선 전략을 자동 제안합니다" />
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          데이터를 분석하고 AI 전략을 도출하고 있습니다...
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="AI 최적화 루프" subtitle="성과 데이터를 분석하고 개선 전략을 자동 제안합니다" />
      <div className="page-container animate-fade-in">

        {/* Analyze Input */}
        <div className="card" style={{ padding: '24px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Instagram size={18} />
                실제 계정 정밀 분석
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                외부 스크래핑 엔진(Apify)을 통해 인스타그램 아이디의 최근 게시물 성과를 긁어오고 딥 분석합니다.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '400px' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="인스타그램 아이디 입력 (예: nike_korea)" 
                value={instaUsername}
                onChange={e => setInstaUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                disabled={analyzing}
                style={{ flex: 1 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleAnalyze} 
                disabled={analyzing || !instaUsername}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: 'transparent' }}
              >
                {analyzing ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Sparkles size={14} />}
                분석 시작
              </button>
            </div>
          </div>

          {/* Analyzing Overlay */}
          {analyzing && (
            <div style={{ 
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10
            }}>
              {analyzeError ? (
                <>
                  <div style={{ color: 'var(--accent-red)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>분석 실패</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: '80%', textAlign: 'center', lineHeight: 1.5 }}>
                    {analyzeError}
                  </div>
                </>
              ) : (
                <>
                  <div className="spinner" style={{ marginBottom: 16, width: 24, height: 24 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                    {analyzeStepsText[analyzeStep]}
                  </div>
                  <div style={{ width: '200px', height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${((analyzeStep + 1) / 6) * 100}%`, 
                      background: 'var(--accent-green)',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Overview stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '평균 DM 전환율', value: `${overview.avgDmRate}%`, change: '', up: true, icon: Target },
            { label: '최고 성과 게시글', value: overview.topType, sub: `DM전환 ${overview.topTypeRate}%`, icon: Zap },
            { label: '최적 발행 시간', value: (overview as any).bestTime || '오전 9시 (예상)', sub: '최근 트렌드 기반', icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  {s.change && (
                    <span className={`badge ${s.up ? 'badge-green' : 'badge-red'}`}>
                      {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {s.change}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.sub || s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="optimize-layout">
          {/* Charts Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Content Type Performance */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>콘텐츠 유형별 성과</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>DM 전환율 기준</div>
              
              {contentTypeData.length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '20px 0', textAlign: 'center' }}>데이터가 충분하지 않습니다.</div>
              ) : (
                contentTypeData.map(d => (
                  <div key={d.type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{d.type}</span>
                      <span style={{ fontWeight: 600, color: d.color }}>{d.dmRate}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 999 }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min((d.dmRate / 5) * 100, 100)}%`,
                        background: d.color || '#6366f1',
                        borderRadius: 999,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Time Performance Chart */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>시간대별 성과 흐름</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>시뮬레이션 패턴 기준</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={timeData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {timeData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.rate >= 2.7 ? 'rgba(255,255,255,0.9)' : entry.rate >= 2.0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Posts */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>🏆 TOP 성과 게시글</div>
              {topPosts.length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '20px 0', textAlign: 'center' }}>아직 발행된 게시물이 없습니다.</div>
              ) : (
                topPosts.map((post, i) => (
                  <div 
                    key={post.id} 
                    onClick={() => post.url ? window.open(post.url, '_blank') : null}
                    style={{
                      display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14,
                      borderBottom: i < topPosts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: post.url ? 'pointer' : 'default',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => { if(post.url) e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { if(post.url) e.currentTarget.style.opacity = '1'; }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i === 0 ? 'rgba(249,115,22,0.2)' : 'var(--bg-elevated)',
                      border: `1px solid ${i === 0 ? 'rgba(249,115,22,0.4)' : 'var(--border-subtle)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
                      color: i === 0 ? 'var(--accent-orange)' : 'var(--text-tertiary)',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                        {post.content.slice(0, 60)}...
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Eye size={10} /> {post.views.toLocaleString()}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MessageCircle size={10} /> {post.dms}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>
                          전환 {post.dmRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Suggestions Column */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>💡 AI 전략 제안</div>
              <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />}
                새로 분석
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.filter(s => !dismissed.has(s.id)).map(s => (
                <div key={s.id} className="card suggestion-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge ${priorityConfig[s.priority]?.badge || 'badge-default'}`}>
                        {priorityConfig[s.priority]?.label || s.priority}
                      </span>
                      <span className="badge badge-default">{s.type}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => setDismissed(prev => new Set([...prev, s.id]))}
                      style={{ fontSize: 16, lineHeight: 1, padding: 4 }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
                    📊 {s.insight}
                  </div>
                  <div className="suggestion-action">
                    <Zap size={12} />
                    {s.suggestion}
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: 12, width: '100%' }}
                    onClick={() => handleApplyStrategy(s)}
                  >
                    전략에 적용하기
                  </button>
                </div>
              ))}
              
              {suggestions.filter(s => !dismissed.has(s.id)).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                  모든 제안을 확인했습니다.
                </div>
              )}
            </div>

            {/* Target Recommendation */}
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} />
                타겟 추천 (AI 분석)
              </div>
              {targets.map((t, idx) => (
                <div key={idx} style={{
                  marginBottom: 12, paddingBottom: 12,
                  borderBottom: idx < targets.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{t.segment}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: t.score >= 90 ? 'var(--accent-green)' : t.score >= 80 ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    }}>
                      {t.score}점
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>✓ {t.reason}</div>
                </div>
              ))}
              {targets.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', paddingTop: 2 }}>
                  💡 <strong style={{ color: 'var(--text-secondary)' }}>최상위 타겟</strong>에 먼저 집중하세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .optimize-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
          align-items: start;
        }

        .suggestion-card {
          padding: 16px;
        }

        .suggestion-action {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 10px 12px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.5;
        }

        @media (max-width: 1000px) {
          .optimize-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
