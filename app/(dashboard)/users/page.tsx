'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Filter, Star, Crown, UserCheck, Search, ChevronDown } from 'lucide-react';
import type { WaitlistEntry } from '@/types';

const mockUsers: (WaitlistEntry & { dm_count: number; score: number })[] = [
  {
    id: '1', user_id: 'u1', name: '김지수', instagram_id: '@beautia_jisoo',
    gender: 'female', interests: ['뷰티', '자기계발'], status: 'approved',
    tags: ['우선순위', '고가치 유저'], notes: null,
    created_at: '2026-04-18T03:21:00Z', dm_count: 4, score: 95,
  },
  {
    id: '2', user_id: 'u1', name: '이하은', instagram_id: '@haeun_daily',
    gender: 'female', interests: ['라이프스타일', '패션'], status: 'pending',
    tags: ['여성'], notes: null,
    created_at: '2026-04-18T02:55:00Z', dm_count: 2, score: 72,
  },
  {
    id: '3', user_id: 'u1', name: '박소연', instagram_id: '@so_yeon_98',
    gender: 'female', interests: ['건강', '운동'], status: 'pending',
    tags: [], notes: null,
    created_at: '2026-04-17T22:10:00Z', dm_count: 1, score: 48,
  },
  {
    id: '4', user_id: 'u1', name: '최민서', instagram_id: '@minseo.choi',
    gender: 'female', interests: ['뷰티', '맛집'], status: 'approved',
    tags: ['여성', '고가치 유저'], notes: null,
    created_at: '2026-04-17T18:30:00Z', dm_count: 3, score: 88,
  },
  {
    id: '5', user_id: 'u1', name: '정예린', instagram_id: '@yerin_j',
    gender: 'female', interests: ['여행', '사진'], status: 'pending',
    tags: [], notes: null,
    created_at: '2026-04-17T14:00:00Z', dm_count: 1, score: 35,
  },
];

const TAG_OPTIONS = [
  { key: '여성', label: '여성', icon: UserCheck, color: 'badge-blue' },
  { key: '우선순위', label: '우선순위', icon: Star, color: 'badge-orange' },
  { key: '고가치 유저', label: '고가치 유저', icon: Crown, color: 'badge-purple' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'created_at'>('score');

  const toggleTag = (id: string, tag: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const has = u.tags.includes(tag);
      return { ...u, tags: has ? u.tags.filter(t => t !== tag) : [...u.tags, tag] };
    }));
  };

  const filtered = users
    .filter(u => {
      const matchSearch = !search || u.name.includes(search) || (u.instagram_id || '').includes(search);
      const matchTag = filterTag === 'all' || u.tags.includes(filterTag);
      return matchSearch && matchTag;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div>
      <Header title="유저 필터링" subtitle="고가치 유저를 발견하고 태그로 분류하세요" />
      <div className="page-container animate-fade-in">

        {/* TAG Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {TAG_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const count = users.filter(u => u.tags.includes(opt.key)).length;
            return (
              <div key={opt.key} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{opt.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="search-box">
            <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              className="search-input"
              placeholder="이름 또는 인스타 ID 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="filter-tabs">
              {[{ key: 'all', label: '전체' }, ...TAG_OPTIONS.map(t => ({ key: t.key, label: t.label }))].map(f => (
                <button
                  key={f.key}
                  className={`filter-tab ${filterTag === f.key ? 'active' : ''}`}
                  onClick={() => setFilterTag(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <select
              className="form-input form-select"
              style={{ width: 'auto', fontSize: 12, padding: '5px 32px 5px 10px' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="score">점수순</option>
              <option value="created_at">최신순</option>
            </select>
          </div>
        </div>

        {/* User Cards */}
        <div className="users-grid">
          {filtered.map(user => (
            <div key={user.id} className="user-card card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.name[0]}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-insta">{user.instagram_id}</div>
                </div>
                <div className="user-score">
                  <div className="score-circle" style={{
                    background: user.score >= 80 ? 'rgba(34,197,94,0.15)' : user.score >= 50 ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                    borderColor: user.score >= 80 ? 'var(--accent-green)' : user.score >= 50 ? 'var(--accent-orange)' : 'var(--border-default)',
                    color: user.score >= 80 ? 'var(--accent-green)' : user.score >= 50 ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  }}>
                    {user.score}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {user.interests.map(i => (
                  <span key={i} className="badge badge-default">{i}</span>
                ))}
                <span className="badge badge-default">DM {user.dm_count}회</span>
              </div>

              <div className="user-tags">
                {TAG_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`tag-btn ${user.tags.includes(opt.key) ? 'tag-active' : ''}`}
                    onClick={() => toggleTag(user.id, opt.key)}
                  >
                    <opt.icon size={11} />
                    {opt.key}
                  </button>
                ))}
              </div>

              <div className="user-card-footer">
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {new Date(user.created_at).toLocaleDateString('ko-KR')} 등록
                </span>
                <span className={`badge ${user.status === 'approved' ? 'badge-green' : user.status === 'rejected' ? 'badge-red' : 'badge-default'}`}>
                  {user.status === 'approved' ? '승인됨' : user.status === 'rejected' ? '거절됨' : '대기 중'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .users-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          flex: 1;
          max-width: 320px;
        }

        .search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--text-primary);
          width: 100%;
        }

        .search-input::placeholder {
          color: var(--text-tertiary);
        }

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

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .user-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px;
        }

        .user-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .user-info { flex: 1; }

        .user-name {
          font-size: 14px;
          font-weight: 600;
        }

        .user-insta {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-top: 1px;
        }

        .score-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }

        .user-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tag-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 11px;
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tag-btn:hover {
          border-color: var(--border-default);
          color: var(--text-secondary);
        }

        .tag-btn.tag-active {
          background: rgba(255,255,255,0.08);
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .user-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
