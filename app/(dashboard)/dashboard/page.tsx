'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Video, LayoutGrid, Sparkles, CalendarClock,
  ChevronRight, Zap, RefreshCw, Activity, ArrowRight
} from 'lucide-react';
import { getActivityLogs, getTodayActivity, DailyActivity } from '@/lib/activityTracker';

const quickActions = [
  {
    icon: '🎥',
    label: '숏폼 영상 만들기',
    desc: '주제 입력만으로 릴스/쇼츠 대본과 영상 완성',
    href: '/short-form',
    color: '#ef4444',
  },
  {
    icon: '🖼️',
    label: '카드뉴스 제작',
    desc: '다중 이미지 인스타 카드뉴스 10초 컷',
    href: '/card-news',
    color: '#8b5cf6',
  },
  {
    icon: '✍️',
    label: 'AI 텍스트/대본 생성',
    desc: '도파민을 자극하는 폭발적 텍스트 쓰기',
    href: '/content',
    color: '#3b82f6',
  },
  {
    icon: '⏰',
    label: '예약 발행',
    desc: '만든 콘텐츠를 달력에 정리하고 업로드 예약',
    href: '/schedule',
    color: '#10b981',
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 13,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: '#fff', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', width: 60 }}>
              {p.name === 'short_form' ? '숏폼' : p.name === 'card_news' ? '카드뉴스' : '일반 글'}:
            </span>
            <span style={{ fontWeight: 700 }}>{p.value}건</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [logs, setLogs] = useState<DailyActivity[]>([]);
  const [today, setToday] = useState<DailyActivity>({ date: '', short_form: 0, card_news: 0, script_gen: 0, dm_funnel: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs(getActivityLogs());
      setToday(getTodayActivity());
      setLoading(false);
    }, 500); // UI 피드백을 위한 살짝의 지연
  };

  useEffect(() => { loadData(); }, []);

  // 이번 주 생성량 합계
  const weekLogs = logs.slice(-7);
  const weeklyShortForm = weekLogs.reduce((acc, cur) => acc + (cur.short_form || 0), 0);
  const weeklyCardNews = weekLogs.reduce((acc, cur) => acc + (cur.card_news || 0), 0);
  const totalGenerations = weeklyShortForm + weeklyCardNews + weekLogs.reduce((acc, cur) => acc + (cur.script_gen || 0), 0);

  const summaryCards = [
    { label: '오늘 구워낸 숏폼', value: today.short_form, icon: Video, color: '#ef4444' },
    { label: '오늘 만든 카드뉴스', value: today.card_news, icon: LayoutGrid, color: '#8b5cf6' },
    { label: '이번 주 총 생성량', value: totalGenerations, icon: Sparkles, color: '#3b82f6' },
    { label: '활성 활동 일수', value: logs.length, icon: Activity, color: '#10b981' },
  ];

  // 차트 데이터 (최근 7일 강제 채우기)
  const chartData = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(d);
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date === dateStr);
    
    chartData.push({
      date: targetDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
      short_form: existingLog?.short_form || 0,
      card_news: existingLog?.card_news || 0,
      script_gen: existingLog?.script_gen || 0,
    });
  }

  return (
    <div>
      <Header title="내부 워크스페이스" subtitle="PanelAI에서 제작한 콘텐츠 현황을 실시간으로 추적합니다." />
      <div className="page-container animate-fade-in">

        {/* Refresh */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={loadData} disabled={loading}>
            <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            {loading ? '불러오는 중...' : '데이터 동기화'}
          </button>
        </div>

        {/* ① 지표 카드 */}
        <div className="metrics-grid" style={{ marginBottom: 28 }}>
          {summaryCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="metric-card card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} style={{ color: m.color }} />
                  </div>
                  {loading && (
                    <div style={{ width: 40, height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                  )}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: '#fff' }}>
                  {loading ? '—' : m.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: 500 }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* ② 빠른 시작 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={16} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            지금 바로 폭풍 성장 시작하기
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href} className="quick-action-card">
                <div className="quick-action-emoji">{a.icon}</div>
                <div className="quick-action-label">{a.label}</div>
                <div className="quick-action-desc">{a.desc}</div>
                <div className="quick-action-arrow">
                  제작하러 가기 <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ③ 차트 & 요약 */}
        <div className="chart-row">
          <div className="card chart-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>콘텐츠 생산량 추이</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>최근 7일간 AI로 만들어낸 결과물</div>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                {[{ color: '#ef4444', label: '숏폼' }, { color: '#8b5cf6', label: '카드뉴스' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="short_form" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={32} />
                <Bar dataKey="card_news" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 시스템 알림 / 배지 영역 */}
          <div className="card funnel-block" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>성장 오퍼레이션 상태</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>현재 PanelAI 시스템 헬스체크</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 2 }}>시스템 정상 가동 중</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>AI 생성 엔진 응답속도 최상</div>
                </div>
              </div>

              {totalGenerations === 0 && !loading && (
                <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'center', marginTop: 'auto' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔥</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>첫 번째 떡상을 시작하세요!</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                    아직 생성된 콘텐츠가 없습니다. 좌측 버튼을 눌러 바로 만들어보세요.
                  </div>
                </div>
              )}
              
              {totalGenerations > 0 && !loading && (
                <div style={{ padding: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)', textAlign: 'center', marginTop: 'auto' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#c4b5fd' }}>미친 생산성, 아주 좋습니다!</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                    이번 주에만 총 {totalGenerations}개의 콘텐츠를 구워냈어요.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .metric-card { padding: 22px 24px; transition: transform 0.2s; }
        .metric-card:hover { transform: translateY(-2px); }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .quick-action-card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 20px;
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
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }

        .quick-action-emoji {
          font-size: 26px;
          margin-bottom: 8px;
        }

        .quick-action-label {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
        }

        .quick-action-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          line-height: 1.5;
        }

        .quick-action-arrow {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 12px;
          font-weight: 600;
        }

        .quick-action-card:hover .quick-action-arrow {
          color: #3b82f6;
        }

        .chart-row {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
        }

        .chart-block { padding: 24px; }
        .funnel-block { padding: 24px; }

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

