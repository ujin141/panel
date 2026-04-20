'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import {
  CalendarClock, Plus, X, Trash2, Clock, CheckCircle2,
  RefreshCw, Calendar
} from 'lucide-react';

type Platform = 'threads' | 'instagram';
type ScheduleStatus = 'scheduled' | 'published' | 'draft';

interface ScheduledPost {
  id: string;
  platform: Platform;
  content: string;
  scheduled_at: string;
  status: ScheduleStatus;
  content_type: string;
}

const TIME_SLOTS = [
  '07:00', '09:00', '11:00', '13:00', '15:00', '18:00', '20:00', '22:00',
];

const statusConfig = {
  scheduled: { label: '예약됨', badge: 'badge-blue' },
  published:  { label: '발행됨', badge: 'badge-green' },
  draft:      { label: '임시저장', badge: 'badge-default' },
};

const platformIcon: Record<Platform, string> = {
  threads: '𝕋',
  instagram: '📸',
};

const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [newPost, setNewPost] = useState({
    platform: 'threads' as Platform,
    content: '',
    date: '',
    time: '09:00',
    type: '호기심 유도형',
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '불러오기 실패' }));
        throw new Error(err.error || '불러오기 실패');
      }
      const { data } = await res.json();
      setPosts(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const addPost = async () => {
    if (!newPost.content) return;
    setSaving(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPost.platform,
          content: newPost.content,
          content_type: newPost.type,
          scheduled_at: newPost.date ? `${newPost.date}T${newPost.time}:00` : null,
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      await fetchPosts();
      setNewPost({ platform: 'threads', content: '', date: '', time: '09:00', type: '호기심 유도형' });
      setShowForm(false);
    } catch (e: any) {
      alert(e.message || '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    // Optimistic
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchPosts(); // Revert
    }
  };

  const publishNow = async (id: string) => {
    // Optimistic
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'published' } : p));
    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'published', published_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchPosts();
    }
  };

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  // Weekly calendar
  const today = new Date();
  const weekData = weekDays.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + 1 + i);
    return {
      day,
      date: d.getDate(),
      posts: posts.filter(p =>
        p.status === 'scheduled' && p.scheduled_at &&
        new Date(p.scheduled_at).getDate() === d.getDate()
      ).length,
    };
  });

  return (
    <div>
      <Header title="예약 발행" subtitle="콘텐츠를 미리 작성하고 최적 시간에 자동 발행하세요" />
      <div className="page-container animate-fade-in">

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>⚠️ {error}</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchPosts}><RefreshCw size={12} /> 다시 시도</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '예약됨', value: scheduledCount, color: 'var(--accent-blue)' },
            { label: '발행됨', value: publishedCount, color: 'var(--accent-green)' },
            { label: '임시저장', value: draftCount, color: 'var(--text-secondary)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '18px' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="tab-switcher">
            <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
              <Calendar size={13} /> 캘린더
            </button>
            <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
              목록
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchPosts} disabled={loading}>
              <RefreshCw size={12} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={13} /> 게시글 추가
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
              이번 주 스케줄
            </div>
            <div className="week-grid">
              {weekData.map(w => (
                <div key={w.day} className={`week-day ${w.date === today.getDate() ? 'today' : ''}`}>
                  <div className="week-day-label">{w.day}</div>
                  <div className="week-day-date">{w.date}</div>
                  {w.posts > 0 && (
                    <div className="week-day-posts">{w.posts}건</div>
                  )}
                </div>
              ))}
            </div>

            {/* Best time slots */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 500 }}>
                ⏰ AI 추천 최적 발행 시간
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { time: '오전 9시', score: 94, label: '최고' },
                  { time: '오후 6시', score: 87, label: '높음' },
                  { time: '오후 9시', score: 82, label: '높음' },
                  { time: '오후 1시', score: 71, label: '보통' },
                ].map(slot => (
                  <div key={slot.time} className="time-slot-card">
                    <div className="time-slot-time">{slot.time}</div>
                    <div className="time-slot-score" style={{
                      color: slot.score >= 90 ? 'var(--accent-green)' : slot.score >= 80 ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    }}>
                      {slot.score}점
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.25)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13 }}>불러오는 중...</p>
          </div>
        )}

        {/* Post List */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts
              .filter(p => activeTab === 'list' ? true : p.status !== 'draft')
              .map(post => (
                <div key={post.id} className="card post-row">
                  <div className="post-platform-icon">
                    {platformIcon[post.platform]}
                  </div>
                  <div className="post-content">
                    <div className="post-text">{post.content.slice(0, 80)}{post.content.length > 80 ? '...' : ''}</div>
                    <div className="post-meta">
                      <span className={`badge ${statusConfig[post.status].badge}`}>
                        {statusConfig[post.status].label}
                      </span>
                      <span className="badge badge-default">{post.content_type}</span>
                      {post.scheduled_at && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          <Clock size={10} />
                          {new Date(post.scheduled_at).toLocaleString('ko-KR', {
                            month: 'numeric', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="post-actions">
                    {post.status !== 'published' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => publishNow(post.id)}>
                        <CheckCircle2 size={13} /> 지금 발행
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deletePost(post.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

            {!loading && posts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
                <CalendarClock size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>예약된 게시글이 없어요</p>
                <p style={{ fontSize: 12, marginTop: 6 }}>콘텐츠 생성에서 게시글을 저장하거나 직접 추가해보세요</p>
              </div>
            )}
          </div>
        )}

        {/* Add Post Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div className="chart-title">게시글 예약</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">플랫폼</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['threads', 'instagram'] as Platform[]).map(p => (
                      <button
                        key={p}
                        className={`platform-tab ${newPost.platform === p ? 'active' : ''}`}
                        onClick={() => setNewPost(prev => ({ ...prev, platform: p }))}
                        style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', cursor: 'pointer', transition: 'all var(--transition-fast)', background: newPost.platform === p ? 'var(--accent-white)' : 'transparent', color: newPost.platform === p ? '#000' : 'var(--text-secondary)', fontWeight: newPost.platform === p ? 600 : 400, fontSize: 13 }}
                      >
                        {platformIcon[p]} {p === 'threads' ? 'Threads' : 'Instagram'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">내용 *</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="게시글 내용을 입력하거나 콘텐츠 생성 엔진에서 복사하세요"
                    value={newPost.content}
                    onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                    style={{ minHeight: 120 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">날짜</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newPost.date}
                      onChange={e => setNewPost(p => ({ ...p, date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">시간</label>
                    <select
                      className="form-input form-select"
                      value={newPost.time}
                      onChange={e => setNewPost(p => ({ ...p, time: e.target.value }))}
                    >
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>취소</button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={addPost} disabled={!newPost.content || saving}>
                    {saving ? '저장 중...' : newPost.date ? '예약하기' : '임시저장'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tab-switcher {
          display: flex;
          gap: 4px;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          padding: 4px;
          border: 1px solid var(--border-subtle);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 14px;
          border-radius: calc(var(--radius-md) - 2px);
          font-size: 12px;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 500;
          border: 1px solid var(--border-subtle);
        }

        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .week-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 6px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
        }

        .week-day.today {
          border-color: var(--border-strong);
          background: rgba(255,255,255,0.06);
        }

        .week-day-label {
          font-size: 10px;
          color: var(--text-tertiary);
          font-weight: 500;
        }

        .week-day-date {
          font-size: 15px;
          font-weight: 600;
        }

        .week-day-posts {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          background: rgba(59,130,246,0.15);
          color: var(--accent-blue);
          border: 1px solid rgba(59,130,246,0.3);
        }

        .time-slot-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          gap: 2px;
        }

        .time-slot-time {
          font-size: 12px;
          font-weight: 500;
        }

        .time-slot-score {
          font-size: 11px;
          font-weight: 600;
        }

        .post-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
        }

        .post-platform-icon {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .post-content { flex: 1; }

        .post-text {
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 6px;
          white-space: pre-line;
        }

        .post-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          backdrop-filter: blur(4px);
        }

        .modal {
          width: 100%;
          max-width: 480px;
          margin: 24px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
