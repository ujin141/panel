'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Bell, AlertTriangle, TrendingDown, CheckCircle2, BellOff, Settings, Zap, RefreshCw } from 'lucide-react';

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'resolved' | 'snoozed';

interface GrowthAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: string;
  threshold: number;
  current_value: number;
  created_at: string;
  action_suggestion?: string;
}

const severityConfig = {
  critical: { label: '긴급', icon: AlertTriangle, color: 'var(--accent-red)', badge: 'badge-red', bg: 'rgba(239,68,68,0.05)' },
  warning:  { label: '주의', icon: TrendingDown, color: 'var(--accent-orange)', badge: 'badge-orange', bg: 'rgba(249,115,22,0.05)' },
  info:     { label: '정보', icon: CheckCircle2, color: 'var(--accent-green)', badge: 'badge-green', bg: 'rgba(34,197,94,0.05)' },
};

const defaultThresholds = [
  { metric: 'DM 전환율 (최소)', key: 'dmRate', value: 2.0, unit: '%' },
  { metric: '일 신규 대기자 (최소)', key: 'dailyWaitlist', value: 10, unit: '명' },
  { metric: '일 조회수 (최소)', key: 'dailyViews', value: 2000, unit: '회' },
  { metric: '설치 전환율 (최소)', key: 'installRate', value: 30, unit: '%' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<GrowthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [showSettings, setShowSettings] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [simulating, setSimulating] = useState(false);

  const runSimulator = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulator/run', { method: 'POST' });
      if (!res.ok) throw new Error('시뮬레이션 실패');
      fetchAlerts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSimulating(false);
    }
  };

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '불러오기 실패' }));
        throw new Error(err.error || '불러오기 실패');
      }
      const { data } = await res.json();
      setAlerts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const updateAlertStatus = async (id: string, status: AlertStatus) => {
    // Optimistic update
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('업데이트 실패');
    } catch {
      fetchAlerts(); // Revert on error
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  const filtered = alerts.filter(a =>
    filterSeverity === 'all' ? true :
    filterSeverity === 'active' ? a.status === 'active' :
    a.severity === filterSeverity
  );

  return (
    <div>
      <Header title="성장 알림" subtitle="전환율 변화와 이상 징후를 실시간으로 감지합니다" />
      <div className="page-container animate-fade-in">

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>⚠️ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchAlerts}><RefreshCw size={12} /> 다시 시도</button>
          </div>
        )}

        {/* Alert Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div className="card" style={{ padding: '18px 20px', borderColor: criticalCount > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={16} style={{ color: criticalCount > 0 ? 'var(--accent-red)' : 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>긴급</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: criticalCount > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
              {loading ? '—' : criticalCount}
            </div>
          </div>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrendingDown size={16} style={{ color: warningCount > 0 ? 'var(--accent-orange)' : 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>주의</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: warningCount > 0 ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
              {loading ? '—' : warningCount}
            </div>
          </div>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Bell size={16} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>전체 알림</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{loading ? '—' : alerts.length}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="filter-tabs">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '활성' },
              { key: 'critical', label: '긴급' },
              { key: 'warning', label: '주의' },
              { key: 'info', label: '정보' },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filterSeverity === f.key ? 'active' : ''}`}
                onClick={() => setFilterSeverity(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={runSimulator}
              disabled={simulating}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: 'transparent' }}
            >
              {simulating ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Zap size={12} />}
              데이터 시뮬레이션 실행
            </button>
            <button className="btn btn-ghost btn-sm" onClick={fetchAlerts} disabled={loading}>
              <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
            <button
              className={`btn btn-secondary btn-sm ${showSettings ? 'btn-primary' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings size={12} />
              임계값 설정
            </button>
          </div>
        </div>

        {/* Threshold Settings */}
        {showSettings && (
          <div className="card settings-panel animate-fade-in" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>⚙️ 알림 임계값 설정</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {thresholds.map((t, i) => (
                <div key={t.key} className="form-group">
                  <label className="form-label">{t.metric}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      className="form-input"
                      value={t.value}
                      onChange={e => setThresholds(prev => prev.map((th, j) => j === i ? { ...th, value: Number(e.target.value) } : th))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>{t.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>설정 저장</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13 }}>알림 불러오는 중...</p>
          </div>
        )}

        {/* Alert List */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(alert => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              const isResolved = alert.status === 'resolved';
              const isSnoozed = alert.status === 'snoozed';

              return (
                <div
                  key={alert.id}
                  className="card alert-card"
                  style={{
                    borderLeft: `3px solid ${isResolved ? 'var(--border-subtle)' : config.color}`,
                    background: isResolved ? 'var(--bg-card)' : config.bg,
                    opacity: isResolved || isSnoozed ? 0.6 : 1,
                  }}
                >
                  <div className="alert-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} style={{ color: config.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{alert.title}</span>
                      <span className={`badge ${config.badge}`}>{config.label}</span>
                      {isSnoozed && <span className="badge badge-default"><BellOff size={10} /> 스누즈</span>}
                      {isResolved && <span className="badge badge-green">✓ 해결됨</span>}
                    </div>
                    {!isResolved && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!isSnoozed && (
                          <button className="btn btn-ghost btn-sm" onClick={() => updateAlertStatus(alert.id, 'snoozed')} title="1시간 스누즈">
                            <BellOff size={12} />
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => updateAlertStatus(alert.id, 'resolved')}>
                          <CheckCircle2 size={12} /> 해결
                        </button>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '10px 0', lineHeight: 1.6 }}>
                    {alert.description}
                  </p>

                  {/* Metric Progress */}
                  {alert.metric && (
                    <div className="alert-metric">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>{alert.metric}</span>
                        <span>
                          <span style={{ fontWeight: 700, color: alert.current_value < alert.threshold ? config.color : 'var(--accent-green)' }}>
                            {alert.current_value}
                          </span>
                          <span style={{ color: 'var(--text-tertiary)' }}> / 목표 {alert.threshold}</span>
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 999 }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((alert.current_value / alert.threshold) * 100, 100)}%`,
                          background: alert.current_value < alert.threshold ? config.color : 'var(--accent-green)',
                          borderRadius: 999,
                        }} />
                      </div>
                    </div>
                  )}

                  {alert.action_suggestion && !isResolved && (
                    <div className="alert-action">
                      <Zap size={12} />
                      <span>{alert.action_suggestion}</span>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
                    {new Date(alert.created_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                <Bell size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                <p>{alerts.length === 0 ? '아직 등록된 알림이 없습니다' : '해당하는 알림이 없습니다'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          padding: 4px;
          border: 1px solid var(--border-subtle);
        }

        .filter-tab {
          padding: 5px 10px;
          border-radius: calc(var(--radius-md) - 2px);
          font-size: 12px;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .filter-tab.active {
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 500;
          border: 1px solid var(--border-subtle);
        }

        .alert-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .alert-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .alert-metric {
          margin: 8px 0;
          padding: 10px 12px;
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .alert-action {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-top: 8px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
