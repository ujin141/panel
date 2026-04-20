'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { BookOpen, Plus, X, TrendingUp, Users, Eye, MessageCircle } from 'lucide-react';
import type { GrowthLog } from '@/types';

const mockLogs: GrowthLog[] = [
  {
    id: '1',
    user_id: 'u1',
    day_number: 1,
    title: '첫 Threads 게시글 발행',
    description: '호기심 유도형 게시글 3개 발행. 조회수 1,200회 달성. DM 45건 수신. 예상보다 빠른 반응에 놀람.',
    metrics: { views: 1200, dms: 45, waitlist: 20, installs: 0 },
    created_at: '2026-04-12T09:00:00Z',
  },
  {
    id: '2',
    user_id: 'u1',
    day_number: 3,
    title: '대기자 100명 돌파! 🎉',
    description: '"희소성 유도형" 콘텐츠가 바이럴. 오후 3시에 포스팅된 게시글 하나가 조회수 3,000 달성. DM 80건으로 역대 최고.',
    metrics: { views: 5800, dms: 130, waitlist: 104, installs: 0 },
    created_at: '2026-04-14T15:30:00Z',
  },
  {
    id: '3',
    user_id: 'u1',
    day_number: 7,
    title: '첫 베타 유저 50명 초대',
    description: '대기자 中 고가치 유저 50명 선별 초대. 설치율 92%. 첫 인앱 피드백 수집 시작. "이런 앱 기다렸다"는 반응 다수.',
    metrics: { views: 12000, dms: 280, waitlist: 380, installs: 46 },
    created_at: '2026-04-18T10:00:00Z',
  },
];

const metricIcons = { views: Eye, dms: MessageCircle, waitlist: Users, installs: TrendingUp };
const metricLabels = { views: '조회수', dms: 'DM', waitlist: '대기자', installs: '설치' };

export default function CaseStudyPage() {
  const [logs, setLogs] = useState<GrowthLog[]>(mockLogs);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    views: '',
    dms: '',
    waitlist: '',
    installs: '',
  });

  const addLog = () => {
    if (!form.title) return;
    const newLog: GrowthLog = {
      id: Date.now().toString(),
      user_id: 'u1',
      day_number: Math.max(...logs.map(l => l.day_number), 0) + 1,
      title: form.title,
      description: form.description,
      metrics: {
        views: Number(form.views) || 0,
        dms: Number(form.dms) || 0,
        waitlist: Number(form.waitlist) || 0,
        installs: Number(form.installs) || 0,
      },
      created_at: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    setForm({ title: '', description: '', views: '', dms: '', waitlist: '', installs: '' });
    setShowForm(false);
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const sortedLogs = [...logs].sort((a, b) => b.day_number - a.day_number);

  return (
    <div>
      <Header title="케이스 스터디" subtitle="성장 여정을 타임라인으로 기록하세요" />
      <div className="page-container animate-fade-in">

        {/* Header Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="badge badge-default">총 {logs.length}개 로그</span>
              <span className="badge badge-green">Day {Math.max(...logs.map(l => l.day_number), 0)}</span>
            </div>
          </div>
          <button
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <><X size={14} />취소</> : <><Plus size={14} />로그 추가</>}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="card add-form animate-fade-in" style={{ marginBottom: 32 }}>
            <div className="chart-title" style={{ marginBottom: 20 }}>새 성장 로그</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">제목 *</label>
                <input
                  className="form-input"
                  placeholder="예: 대기자 200명 달성! 🎉"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">상세 내용</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="오늘 무슨 일이 있었나요? 어떤 전략이 효과적이었나요?"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ minHeight: 100 }}
                />
              </div>
              <div className="metrics-form-grid">
                {(['views', 'dms', 'waitlist', 'installs'] as const).map(key => (
                  <div key={key} className="form-group">
                    <label className="form-label">{metricLabels[key]}</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>취소</button>
                <button className="btn btn-primary" onClick={addLog} style={{ flex: 2 }}>로그 저장하기</button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="timeline">
          {sortedLogs.map((log, i) => (
            <div key={log.id} className="timeline-item">
              <div className="timeline-connector">
                <div className="timeline-dot" />
                {i < sortedLogs.length - 1 && <div className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <div className="timeline-card card">
                  <div className="timeline-card-header">
                    <div>
                      <div className="timeline-day-badge">Day {log.day_number}</div>
                      <div className="timeline-title">{log.title}</div>
                      <div className="timeline-date">
                        {new Date(log.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => deleteLog(log.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {log.description && (
                    <p className="timeline-description">{log.description}</p>
                  )}

                  <div className="timeline-metrics">
                    {(Object.entries(log.metrics) as [string, number][]).map(([key, val]) => {
                      const Icon = metricIcons[key as keyof typeof metricIcons];
                      return (
                        <div key={key} className="timeline-metric">
                          <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
                          <span className="timeline-metric-label">{metricLabels[key as keyof typeof metricLabels]}</span>
                          <span className="timeline-metric-value">{val.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {logs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)' }}>
            <BookOpen size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>아직 기록된 로그가 없습니다</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>첫 성장 로그를 추가해보세요!</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          padding-top: 20px;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent-white);
          border: 2px solid var(--bg-primary);
          box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
          flex-shrink: 0;
          z-index: 1;
        }

        .timeline-line {
          width: 1px;
          flex: 1;
          min-height: 20px;
          background: var(--border-subtle);
          margin-top: 4px;
          margin-bottom: 4px;
        }

        .timeline-content {
          flex: 1;
          padding-bottom: 20px;
        }

        .timeline-card {
          padding: 20px;
        }

        .timeline-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .timeline-day-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .timeline-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .timeline-date {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .timeline-description {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .timeline-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }

        .timeline-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .timeline-metric-label {
          font-size: 10px;
          color: var(--text-tertiary);
          text-align: center;
        }

        .timeline-metric-value {
          font-size: 16px;
          font-weight: 700;
        }

        .metrics-form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (max-width: 600px) {
          .timeline-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .metrics-form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
