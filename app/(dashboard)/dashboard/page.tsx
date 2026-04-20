'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import AlertWidget from '@/components/dashboard/AlertWidget';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Users, MessageCircle, Eye,
  ArrowUpRight, ChevronRight, Zap, RefreshCw,
} from 'lucide-react';

interface MetricRow {
  date: string;
  views: number;
  dms: number;
  waitlist_count: number;
  installs: number;
}

const quickActions = [
  {
    icon: '✍️',
    label: 'AI로 게시글 만들기',
    desc: '클릭 한 번으로 Threads/인스타 글 10개생성',
    href: '/content',
    color: '#3b82f6',
  },
  {
    icon: '💌',
    label: 'DM 스크립트 복사',
    desc: '응답 → 필터링 → 대기자 유도까지 자동 작성',
    href: '/dm-funnel',
    color: '#a855f7',
  },
  {
    icon: '📋',
    label: '대기자 목록 보기',
    desc: '현재 신청자 확인하고 승인/거절 처리',
    href: '/waitlist',
    color: '#22c55e',
  },
  {
    icon: '💡',
    label: '성장 전략 받기',
    desc: '앱 카테고리 입력 → 맞춤 성장 로드맵 생성',
    href: '/strategy',
    color: '#f97316',
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: '#fff', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              {p.name === 'views' ? '조회수' : p.name === 'dms' ? 'DM' : '대기자'}:
            </span>
            <span style={{ fontWeight: 600 }}>{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertCounts, setAlertCounts] = useState({ critical: 0, warning: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, alertsRes] = await Promise.all([
        fetch('/api/metrics?days=7'),
        fetch('/api/alerts'),
      ]);

      if (metricsRes.ok) {
        const { data } = await metricsRes.json();
        setMetrics(data || []);
      }

      if (alertsRes.ok) {
        const { data } = await alertsRes.json();
        const active = (data || []).filter((a: any) => a.status === 'active');
        setAlertCounts({
          critical: active.filter((a: any) => a.severity === 'critical').length,
          warning: active.filter((a: any) => a.severity === 'warning').length,
        });
      }
    } catch {
      // Silently fail — UI shows zeros
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Derived stats from metrics
  const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);
  const totalDMs = metrics.reduce((s, m) => s + (m.dms || 0), 0);
  const latestWaitlist = metrics.length > 0 ? metrics[metrics.length - 1].waitlist_count : 0;
  const todayMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const summaryCards = [
    { label: '대기자 수', value: latestWaitlist, icon: Users, color: '#fff' },
    { label: '오늘 조회수', value: todayMetric?.views ?? 0, icon: TrendingUp, color: '#22c55e' },
    { label: '7일 총 조회수', value: totalViews, icon: Eye, color: '#3b82f6' },
    { label: '7일 총 DM', value: totalDMs, icon: MessageCircle, color: '#a855f7' },
  ];

  // Chart data — formatted dates
  const chartData = metrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
    views: m.views || 0,
    waitlist: m.waitlist_count || 0,
    dms: m.dms || 0,
  }));

  // Funnel: use latest snapshot
  const funnelSteps = [
    { label: '게시글 조회', value: totalViews, icon: '👁️' },
    { label: 'DM 문의', value: totalDMs, icon: '💌' },
    { label: '대기자 등록', value: latestWaitlist, icon: '📋' },
    { label: '앱 설치', value: metrics.reduce((s, m) => s + (m.installs || 0), 0), icon: '📱' },
  ];

  return (
    <div>
      <Header title="대시보드" subtitle="오늘의 성장 현황을 한눈에 확인하세요" />
      <div className="page-container animate-fade-in">

        <AlertWidget criticalCount={alertCounts.critical} warningCount={alertCounts.warning} />

        {/* Refresh */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}>
            <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>

        {/* ① 지표 카드 */}
        <div className="metrics-grid" style={{ marginBottom: 28 }}>
          {summaryCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="metric-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} style={{ color: m.color }} />
                  </div>
                  {loading && (
                    <div style={{ width: 40, height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                  )}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {loading ? '—' : m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* ② 빠른 시작 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} style={{ color: '#f59e0b' }} />
            지금 바로 할 수 있는 것들
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className="quick-action-card">
                <div className="quick-action-emoji">{a.icon}</div>
                <div className="quick-action-label">{a.label}</div>
                <div className="quick-action-desc">{a.desc}</div>
                <div className="quick-action-arrow">
                  바로 가기 <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ③ 차트 & 퍼널 */}
        <div className="chart-row">
          <div className="card chart-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>성장 추이</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>최근 7일</div>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                {[{ color: '#3b82f6', label: '조회수' }, { color: '#22c55e', label: '대기자' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            {!loading && chartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                📊 지표를 입력하면 그래프가 표시돼요
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gV)" />
                  <Area type="monotone" dataKey="waitlist" stroke="#22c55e" strokeWidth={1.5} fill="url(#gW)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 퍼널 */}
          <div className="card funnel-block">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>성장 퍼널</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>조회에서 설치까지의 흐름</div>
            {funnelSteps.map((step, i) => {
              const base = funnelSteps[0].value || 1;
              const pct = Math.min(Math.round((step.value / base) * 100), 100);
              return (
                <div key={step.label} style={{ marginBottom: i < funnelSteps.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{step.icon}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{step.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{loading ? '—' : step.value.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 30, textAlign: 'right' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? 'rgba(255,255,255,0.3)' : i === 1 ? '#3b82f6' : i === 2 ? '#a855f7' : '#22c55e', borderRadius: 999 }} />
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' }}>
                      ↓ 전환율 {funnelSteps[i].value > 0 ? Math.round((funnelSteps[i + 1].value / funnelSteps[i].value) * 100) : 0}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ④ 지표 입력 안내 */}
        {!loading && metrics.length === 0 && (
          <div className="card" style={{ marginTop: 20, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>아직 입력된 성장 지표가 없어요</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.7 }}>
              매일 조회수, DM 수, 대기자 수를 기록하면<br />이 대시보드에서 성장 추이를 확인할 수 있어요.
            </div>
            <Link href="/schedule" className="btn btn-primary btn-sm" style={{ display: 'inline-flex' }}>
              지표 입력하러 가기 →
            </Link>
          </div>
        )}

      </div>

      <style jsx>{`
        .metric-card { padding: 18px 20px; }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .quick-action-card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 200ms ease;
          cursor: pointer;
          text-decoration: none;
        }

        .quick-action-card:hover {
          background: #161616;
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.5);
        }

        .quick-action-emoji {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .quick-action-label {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }

        .quick-action-desc {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          line-height: 1.5;
        }

        .quick-action-arrow {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 8px;
        }

        .quick-action-card:hover .quick-action-arrow {
          color: rgba(255,255,255,0.6);
        }

        .chart-row {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .chart-block { padding: 20px 22px; }
        .funnel-block { padding: 20px 22px; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (max-width: 1000px) {
          .quick-actions-grid { grid-template-columns: repeat(2, 1fr); }
          .chart-row { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .quick-actions-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
