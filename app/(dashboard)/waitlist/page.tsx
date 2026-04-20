'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Plus, Download, CheckCircle, XCircle, Clock, Search, Info, RefreshCw } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';

interface Entry {
  id: string;
  name: string;
  instagram_id: string;
  gender: string;
  interests: string[];
  status: Status;
  created_at: string;
}

const statusConfig = {
  pending:  { label: '검토 중', icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  approved: { label: '승인됨', icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  rejected: { label: '거절됨', icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', instagram_id: '', interests: '' });
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '데이터 불러오기 실패' }));
        throw new Error(err.error || '데이터 불러오기 실패');
      }
      const { data } = await res.json();
      setEntries(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const changeStatus = async (id: string, status: Status) => {
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    try {
      const res = await fetch('/api/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
    } catch {
      // Revert on error
      fetchEntries();
    }
  };

  const addEntry = async () => {
    if (!newEntry.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEntry.name,
          instagram_id: newEntry.instagram_id,
          gender: '여성',
          interests: newEntry.interests.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('추가 실패');
      await fetchEntries();
      setNewEntry({ name: '', instagram_id: '', interests: '' });
      setShowAdd(false);
    } catch (e: any) {
      alert(e.message || '추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const downloadCSV = () => {
    const header = '이름,인스타ID,관심사,상태,등록일';
    const rows = entries.map(e =>
      `${e.name},${e.instagram_id},"${(e.interests || []).join(', ')}",${statusConfig[e.status].label},${e.created_at?.split('T')[0] || ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'waitlist.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = entries.filter(e => {
    const matchFilter = filter === 'all' || e.status === filter;
    const matchSearch = !search || e.name.includes(search) || (e.instagram_id || '').includes(search);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    approved: entries.filter(e => e.status === 'approved').length,
    rejected: entries.filter(e => e.status === 'rejected').length,
  };

  return (
    <div>
      <Header title="대기자 목록" subtitle="DM에서 관심 보인 유저들을 여기서 관리하세요" />
      <div className="page-container animate-fade-in">

        {/* Guide */}
        <div className="tip-box" style={{ marginBottom: 24 }}>
          <Info size={13} />
          <span>
            대기자 등록 링크(<strong>/join</strong>)를 DM에 공유하면 자동으로 여기 추가돼요.
            각 유저를 <strong>승인</strong>하면 앱 초대 알림을 보낼 수 있어요.
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>⚠️ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchEntries}>
              <RefreshCw size={12} /> 다시 시도
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="wl-stats-row" style={{ marginBottom: 24 }}>
          {[
            { key: 'all', label: '전체', count: counts.all },
            { key: 'pending', label: '🟡 검토 중', count: counts.pending },
            { key: 'approved', label: '🟢 승인됨', count: counts.approved },
            { key: 'rejected', label: '🔴 거절됨', count: counts.rejected },
          ].map(s => (
            <button
              key={s.key}
              className={`wl-stat-card ${filter === s.key ? 'active' : ''}`}
              onClick={() => setFilter(s.key as any)}
            >
              <div className="wl-stat-count">{loading ? '—' : s.count}</div>
              <div className="wl-stat-label">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              className="search-input"
              placeholder="이름 또는 인스타 ID 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchEntries} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> 새로고침
          </button>
          <button className="btn btn-secondary btn-sm" onClick={downloadCSV} disabled={entries.length === 0}>
            <Download size={13} /> CSV 다운로드
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={13} /> 직접 추가
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="add-form animate-fade-in">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>✏️ 수동으로 대기자 추가</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">이름 *</label>
                <input className="form-input" placeholder="김지수" value={newEntry.name} onChange={e => setNewEntry(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">인스타 ID</label>
                <input className="form-input" placeholder="@username" value={newEntry.instagram_id} onChange={e => setNewEntry(p => ({ ...p, instagram_id: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">관심사 (쉼표로 구분)</label>
                <input className="form-input" placeholder="뷰티, 패션" value={newEntry.interests} onChange={e => setNewEntry(p => ({ ...p, interests: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={addEntry} disabled={!newEntry.name || saving}>
                {saving ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13 }}>불러오는 중...</p>
          </div>
        )}

        {/* List */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(entry => {
              const sc = statusConfig[entry.status];
              const Icon = sc.icon;
              return (
                <div key={entry.id} className="entry-card">
                  <div className="entry-avatar">{entry.name[0]}</div>
                  <div className="entry-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.name}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{entry.instagram_id}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {(entry.interests || []).map(i => (
                        <span key={i} className="interest-tag">{i}</span>
                      ))}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString('ko-KR') : ''} 등록
                      </span>
                    </div>
                  </div>
                  <div className="entry-status" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                    <Icon size={12} style={{ color: sc.color }} />
                    <span style={{ fontSize: 12, color: sc.color, fontWeight: 500 }}>{sc.label}</span>
                  </div>
                  {entry.status === 'pending' && (
                    <div className="entry-actions">
                      <button className="action-btn approve" onClick={() => changeStatus(entry.id, 'approved')}>
                        ✓ 승인
                      </button>
                      <button className="action-btn reject" onClick={() => changeStatus(entry.id, 'rejected')}>
                        ✕ 거절
                      </button>
                    </div>
                  )}
                  {entry.status === 'approved' && (
                    <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0, fontSize: 11 }}>
                      초대 링크 발송 →
                    </button>
                  )}
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <p>{entries.length === 0 ? '아직 대기자가 없어요. /join 링크를 공유해보세요!' : '해당하는 대기자가 없어요'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .tip-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
        }

        .wl-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .wl-stat-card {
          padding: 16px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 150ms;
        }

        .wl-stat-card:hover {
          border-color: rgba(255,255,255,0.15);
        }

        .wl-stat-card.active {
          border-color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.05);
        }

        .wl-stat-count {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .wl-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 8px 12px;
        }

        .search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: #fff;
          width: 100%;
        }

        .search-input::placeholder { color: rgba(255,255,255,0.3); }

        .add-form {
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .entry-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          transition: all 150ms;
        }

        .entry-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: #141414;
        }

        .entry-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .entry-info { flex: 1; min-width: 0; }

        .interest-tag {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
        }

        .entry-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .entry-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .action-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms;
          border: 1px solid;
        }

        .action-btn.approve {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.3);
          color: #22c55e;
        }

        .action-btn.approve:hover {
          background: rgba(34,197,94,0.2);
        }

        .action-btn.reject {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.2);
          color: #ef4444;
        }

        .action-btn.reject:hover {
          background: rgba(239,68,68,0.15);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 700px) {
          .wl-stats-row { grid-template-columns: repeat(2, 1fr); }
          .entry-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
