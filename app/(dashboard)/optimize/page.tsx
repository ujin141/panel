'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  TrendingUp, Sparkles, BarChart2, ArrowUpRight, ArrowDownRight,
  RefreshCw, Target, Zap, Eye, MessageCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const topPosts = [
  {
    id: '1',
    content: '초대 인원 50명 중 47명 마감됨\n아직 3자리 남아서 올리는 거야 ⏳',
    type: '희소성형',
    platform: 'threads',
    views: 3420,
    dms: 94,
    dmRate: 2.75,
    trend: 'up',
  },
  {
    id: '2',
    content: '나 요즘 이 앱 쓰는데 솔직히 좀 신기해서 공유함\n20대 여성들한테만 베타 오픈 중이라...',
    type: '호기심 유도형',
    platform: 'threads',
    views: 2810,
    dms: 67,
    dmRate: 2.38,
    trend: 'up',
  },
  {
    id: '3',
    content: '예전의 나한테 이 앱 알려줄 수 있었으면 했을 것 같아...',
    type: '감정 자극형',
    platform: 'instagram',
    views: 1940,
    dms: 38,
    dmRate: 1.96,
    trend: 'stable',
  },
];

const contentTypeData = [
  { type: '희소성형', dmRate: 2.8, views: 3100, color: '#f97316' },
  { type: '호기심 유도형', dmRate: 2.3, views: 2600, color: '#3b82f6' },
  { type: '감정 자극형', dmRate: 1.9, views: 1900, color: '#a855f7' },
];

const timeData = [
  { time: '7시', rate: 1.2 }, { time: '9시', rate: 2.9 }, { time: '11시', rate: 2.1 },
  { time: '13시', rate: 1.8 }, { time: '15시', rate: 1.5 }, { time: '18시', rate: 2.7 },
  { time: '20시', rate: 2.4 }, { time: '22시', rate: 1.9 },
];

interface Suggestion {
  id: string;
  insight: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  type: string;
}

const mockSuggestions: Suggestion[] = [
  {
    id: '1',
    insight: '희소성형 게시글의 DM 전환율이 다른 유형보다 47% 높습니다',
    suggestion: '이번 주 희소성형 게시글 비중을 60%로 늘리고, 오전 9시와 오후 6시에 집중 발행하세요',
    priority: 'high',
    type: '콘텐츠 전략',
  },
  {
    id: '2',
    insight: '인스타그램 대비 Threads에서 DM 반응이 2.3배 높은 상황입니다',
    suggestion: 'Threads 발행 빈도를 하루 4~5회로 늘리고, 인스타는 주 3회로 줄이세요',
    priority: 'high',
    type: '채널 전략',
  },
  {
    id: '3',
    insight: '오전 9시 게시글의 평균 조회수가 다른 시간대보다 38% 높습니다',
    suggestion: '가장 강력한 게시글을 매일 오전 9시에 예약 발행하는 루틴을 만드세요',
    priority: 'medium',
    type: '타이밍 최적화',
  },
  {
    id: '4',
    insight: '"여행", "사진" 관심사 유저들의 대기자 전환율이 낮습니다',
    suggestion: '뷰티/라이프스타일 관심사 타겟에 더 집중하거나, 여행 타겟용 별도 콘텐츠를 테스트하세요',
    priority: 'low',
    type: '타겟 최적화',
  },
];

const priorityConfig = {
  high: { label: '높음', badge: 'badge-red' },
  medium: { label: '중간', badge: 'badge-orange' },
  low: { label: '낮음', badge: 'badge-default' },
};

export default function OptimizePage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setSuggestions([...mockSuggestions].reverse());
    setLoading(false);
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

  return (
    <div>
      <Header title="AI 최적화 루프" subtitle="성과 데이터를 분석하고 개선 전략을 자동 제안합니다" />
      <div className="page-container animate-fade-in">

        {/* Overview stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '평균 DM 전환율', value: '2.36%', change: '+0.4%', up: true, icon: Target },
            { label: '최고 성과 게시글', value: '희소성형', sub: 'DM전환 2.75%', icon: Zap },
            { label: '최적 발행 시간', value: '오전 9시', sub: '전환율 2.9%', icon: TrendingUp },
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
              {contentTypeData.map(d => (
                <div key={d.type} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.type}</span>
                    <span style={{ fontWeight: 600, color: d.color }}>{d.dmRate}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 999 }}>
                    <div style={{
                      height: '100%',
                      width: `${(d.dmRate / 3) * 100}%`,
                      background: d.color,
                      borderRadius: 999,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Time Performance Chart */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>시간대별 DM 전환율</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>최근 7일 평균</div>
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
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>🏆 TOP 3 게시글</div>
              {topPosts.map((post, i) => (
                <div key={post.id} style={{
                  display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14,
                  borderBottom: i < topPosts.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
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
              ))}
            </div>
          </div>

          {/* Suggestions Column */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>💡 AI 개선 제안</div>
              <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />}
                새로 분석
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestions.filter(s => !dismissed.has(s.id)).map(s => (
                <div key={s.id} className="card suggestion-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`badge ${priorityConfig[s.priority].badge}`}>
                        {priorityConfig[s.priority].label}
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
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }}>
                    전략에 적용하기
                  </button>
                </div>
              ))}
            </div>

            {/* Target Recommendation */}
            <div className="card" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} />
                타겟 추천 시스템
              </div>
              {[
                { segment: '25~30세 여성, 뷰티 관심', score: 96, reason: 'DM 응답률 3.2%로 최고' },
                { segment: '20~25세 여성, 자기계발', score: 84, reason: '대기자 전환율 68%' },
                { segment: '30~35세 직장 여성', score: 71, reason: '높은 앱 설치 의향' },
              ].map(t => (
                <div key={t.segment} style={{
                  marginBottom: 12, paddingBottom: 12,
                  borderBottom: '1px solid var(--border-subtle)',
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
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', paddingTop: 2 }}>
                💡 <strong style={{ color: 'var(--text-secondary)' }}>25~30세 뷰티 관심 여성</strong>에 집중하세요
              </div>
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
