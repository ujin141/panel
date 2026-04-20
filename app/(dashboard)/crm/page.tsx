'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import {
  UserSquare2, Plus, Search, RefreshCw,
  Star, Phone, StickyNote, Send,
  CheckCircle2, Edit3
} from 'lucide-react';

type InteractionType = 'dm' | 'note' | 'call' | 'approval';

interface Interaction {
  id: string;
  type: InteractionType;
  content: string;
  created_at: string;
}

interface WaitlistEntry {
  id: string;
  name: string;
  instagram_id: string;
  gender: string;
  interests: string[];
  status: 'pending' | 'approved' | 'rejected';
  tags: string[];
  notes: string;
  created_at: string;
}

interface CRMUser extends WaitlistEntry {
  interactions: Interaction[];
}

const interactionConfig: Record<InteractionType, { icon: any; label: string; color: string; badge: string }> = {
  dm:       { icon: Send,         label: 'DM 발송', color: 'var(--accent-blue)',   badge: 'badge-blue' },
  note:     { icon: StickyNote,   label: '메모',    color: 'var(--accent-orange)', badge: 'badge-orange' },
  call:     { icon: Phone,        label: '통화',    color: 'var(--accent-green)',  badge: 'badge-green' },
  approval: { icon: CheckCircle2, label: '승인',    color: 'var(--accent-purple)', badge: 'badge-purple' },
};

export default function CRMPage() {
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<CRMUser | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newInteraction, setNewInteraction] = useState<{ type: InteractionType; content: string }>({
    type: 'dm', content: '',
  });
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Fetch waitlist entries for CRM
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '불러오기 실패' }));
        throw new Error(err.error);
      }
      const { data } = await res.json();
      const enriched: CRMUser[] = (data || []).map((u: WaitlistEntry) => ({
        ...u,
        interactions: [],
      }));
      setUsers(enriched);
      if (enriched.length > 0 && !selectedUser) {
        setSelectedUser(enriched[0]);
        setNoteText(enriched[0].notes || '');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Fetch interactions for selected user
  const fetchInteractions = useCallback(async (entryId: string) => {
    setLoadingInteractions(true);
    try {
      const res = await fetch(`/api/crm?entry_id=${entryId}`);
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setInteractions(data || []);
    } catch {
      setInteractions([]);
    } finally {
      setLoadingInteractions(false);
    }
  }, []);

  const selectUser = (user: CRMUser) => {
    setSelectedUser(user);
    setNoteText(user.notes || '');
    setEditingNote(false);
    fetchInteractions(user.id);
  };

  const addInteraction = async () => {
    if (!selectedUser || !newInteraction.content.trim()) return;
    setSavingInteraction(true);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitlist_entry_id: selectedUser.id,
          type: newInteraction.type,
          content: newInteraction.content,
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      const { data } = await res.json();
      setInteractions(prev => [data, ...prev]);
      setNewInteraction({ type: 'dm', content: '' });
    } catch {
      alert('상호작용 저장에 실패했습니다');
    } finally {
      setSavingInteraction(false);
    }
  };

  const saveNote = async () => {
    if (!selectedUser) return;
    setSavingNote(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, notes: noteText }),
      });
      if (!res.ok) throw new Error('저장 실패');
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, notes: noteText } : u));
      setSelectedUser(prev => prev ? { ...prev, notes: noteText } : null);
      setEditingNote(false);
    } catch {
      alert('메모 저장에 실패했습니다');
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = users.filter(u =>
    !search || u.name.includes(search) || (u.instagram_id || '').includes(search)
  );

  return (
    <div>
      <Header title="CRM" subtitle="유저별 상호작용을 기록하고 관계를 관리하세요" />
      <div className="page-container animate-fade-in">

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>⚠️ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchUsers}><RefreshCw size={12} /> 다시 시도</button>
          </div>
        )}

        <div className="crm-layout">

          {/* User List */}
          <div className="crm-sidebar-panel">
            <div className="crm-search-box">
              <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                className="crm-search-input"
                placeholder="유저 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', flexShrink: 0 }} onClick={fetchUsers} disabled={loading}>
                <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              </button>
            </div>

            <div className="crm-user-list">
              {loading && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                  불러오는 중...
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                  {users.length === 0 ? '대기자가 없습니다' : '검색 결과 없음'}
                </div>
              )}
              {filtered.map(user => (
                <button
                  key={user.id}
                  className={`crm-user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => selectUser(user)}
                >
                  <div className="crm-user-avatar">{user.name[0]}</div>
                  <div className="crm-user-info">
                    <div className="crm-user-name">{user.name}</div>
                    <div className="crm-user-meta">
                      <span>{user.instagram_id}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {user.status === 'approved' && <span className="badge badge-green" style={{ fontSize: 10 }}>승인됨</span>}
                      {user.status === 'pending' && <span className="badge badge-default" style={{ fontSize: 10 }}>대기 중</span>}
                    </div>
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: user.status === 'approved' ? 'var(--accent-green)' : user.status === 'rejected' ? 'var(--accent-red)' : 'rgba(255,255,255,0.2)',
                  }} />
                </button>
              ))}
            </div>
          </div>

          {/* CRM Detail */}
          {selectedUser ? (
            <div className="crm-detail">
              {/* Profile Header */}
              <div className="card crm-profile-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div className="crm-profile-avatar">{selectedUser.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selectedUser.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      {selectedUser.instagram_id}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(selectedUser.interests || []).map(i => (
                        <span key={i} className="badge badge-default">{i}</span>
                      ))}
                      {(selectedUser.tags || []).map(t => (
                        <span key={t} className="badge badge-orange">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="crm-stats-row">
                  {[
                    { label: 'DM 기록', value: interactions.filter(i => i.type === 'dm').length },
                    { label: '등록일', value: new Date(selectedUser.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) },
                    { label: '상호작용', value: interactions.length },
                    { label: '상태', value: selectedUser.status === 'approved' ? '승인됨' : selectedUser.status === 'rejected' ? '거절됨' : '대기 중' },
                  ].map(s => (
                    <div key={s.label} className="crm-stat">
                      <div className="crm-stat-value">{s.value}</div>
                      <div className="crm-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StickyNote size={14} />
                    메모
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setEditingNote(true); setNoteText(selectedUser.notes || ''); }}
                    disabled={editingNote}
                  >
                    <Edit3 size={12} /> 편집
                  </button>
                </div>
                {editingNote ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      className="form-input form-textarea"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="유저에 관한 메모를 남기세요..."
                      style={{ minHeight: 80 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingNote(false)}>취소</button>
                      <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={savingNote}>
                        {savingNote ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: selectedUser.notes ? 'var(--text-secondary)' : 'var(--text-tertiary)', lineHeight: 1.6 }}>
                    {selectedUser.notes || '메모가 없습니다. 편집 버튼으로 추가하세요.'}
                  </p>
                )}
              </div>

              {/* Add Interaction */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                  상호작용 추가
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {(Object.keys(interactionConfig) as InteractionType[]).map(type => {
                    const config = interactionConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        className={`interaction-type-btn ${newInteraction.type === type ? 'active' : ''}`}
                        onClick={() => setNewInteraction(p => ({ ...p, type }))}
                        style={{
                          borderColor: newInteraction.type === type ? config.color : undefined,
                          color: newInteraction.type === type ? config.color : undefined,
                          background: newInteraction.type === type ? `${config.color}15` : undefined,
                        }}
                      >
                        <Icon size={12} /> {config.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={`${interactionConfig[newInteraction.type].label} 내용을 입력하세요`}
                    value={newInteraction.content}
                    onChange={e => setNewInteraction(p => ({ ...p, content: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addInteraction()}
                  />
                  <button className="btn btn-primary" onClick={addInteraction} disabled={savingInteraction || !newInteraction.content.trim()}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Interaction Timeline */}
              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  상호작용 기록 ({interactions.length})
                </div>
                {loadingInteractions && (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                    불러오는 중...
                  </div>
                )}
                {!loadingInteractions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {interactions.map((interaction, i) => {
                      const config = interactionConfig[interaction.type];
                      const Icon = config.icon;
                      return (
                        <div key={interaction.id} className="interaction-item">
                          <div className="interaction-connector">
                            <div className="interaction-dot" style={{ background: config.color }}>
                              <Icon size={10} />
                            </div>
                            {i < interactions.length - 1 && <div className="interaction-line" />}
                          </div>
                          <div className="interaction-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <span className={`badge ${config.badge}`} style={{ fontSize: 9 }}>{config.label}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                {new Date(interaction.created_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {interaction.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {interactions.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                        아직 상호작용 기록이 없어요
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--text-tertiary)' }}>
              <div style={{ textAlign: 'center' }}>
                <UserSquare2 size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                <p>{loading ? '불러오는 중...' : '왼쪽에서 유저를 선택하세요'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .crm-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 20px;
          align-items: start;
        }

        .crm-sidebar-panel {
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .crm-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .crm-search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--text-primary);
          width: 100%;
        }

        .crm-search-input::placeholder {
          color: var(--text-tertiary);
        }

        .crm-user-list {
          display: flex;
          flex-direction: column;
        }

        .crm-user-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          border-bottom: 1px solid var(--border-subtle);
          background: transparent;
        }

        .crm-user-item:last-child { border-bottom: none; }

        .crm-user-item:hover {
          background: var(--bg-glass);
        }

        .crm-user-item.active {
          background: rgba(255,255,255,0.06);
          border-right: 2px solid var(--accent-white);
        }

        .crm-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .crm-user-name {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .crm-user-meta {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .crm-user-info { flex: 1; min-width: 0; }

        .crm-detail {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .crm-profile-card {
          padding: 20px;
        }

        .crm-profile-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 2px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .crm-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-subtle);
        }

        .crm-stat { text-align: center; }

        .crm-stat-value {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .crm-stat-label {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .interaction-type-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: var(--radius-md);
          font-size: 11px;
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .interaction-item {
          display: flex;
          gap: 10px;
        }

        .interaction-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .interaction-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          flex-shrink: 0;
        }

        .interaction-line {
          width: 1px;
          flex: 1;
          min-height: 12px;
          background: var(--border-subtle);
          margin: 3px 0;
        }

        .interaction-content {
          flex: 1;
          padding-bottom: 14px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .crm-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
