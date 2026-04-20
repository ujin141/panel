'use client';

import { useState } from 'react';
import { Zap, Check } from 'lucide-react';

const INTEREST_OPTIONS = ['뷰티', '패션', '자기계발', '라이프스타일', '건강/운동', '맛집', '여행', '기타'];

export default function WaitlistLandingPage() {
  const [form, setForm] = useState({
    name: '',
    instagram_id: '',
    gender: '',
    interests: [] as string[],
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock submission
    await new Promise(r => setTimeout(r, 1200));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="landing-container">
        <div className="landing-card success-card">
          <div className="success-icon">
            <Check size={28} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>등록 완료! 🎉</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            대기자 목록에 등록되었어요.<br />
            앱이 준비되면 가장 먼저 알려드릴게요!
          </p>
          <div style={{
            marginTop: 24, padding: '16px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            fontSize: 13, color: 'var(--text-secondary)',
          }}>
            지금 {Math.floor(Math.random() * 50 + 100)}명이 대기 중이에요 ✨
          </div>
        </div>

        <style jsx>{`
          .success-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(34, 197, 94, 0.15);
            border: 2px solid var(--accent-green);
            color: var(--accent-green);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="landing-container">
      {/* Background gradient */}
      <div className="landing-bg" />

      <div className="landing-card">
        {/* Logo/Brand */}
        <div className="landing-brand">
          <div className="landing-logo">
            <Zap size={18} />
          </div>
          <span>PanelAI</span>
        </div>

        <div className="landing-hero">
          <div className="landing-badge">🔒 선별적 베타 오픈 중</div>
          <h1 className="landing-title">
            당신의 일상을 바꿀<br />앱이 곧 출시돼요
          </h1>
          <p className="landing-desc">
            지금 대기자 등록하면 출시 즉시 알림받고<br />
            첫 번째 그룹으로 초대돼요.
          </p>
          <div className="landing-social-proof">
            <div className="avatars">
              {['김', '이', '박', '최'].map(n => (
                <div key={n} className="avatar">{n}</div>
              ))}
            </div>
            <span>이미 <strong>118명</strong>이 대기 중이에요</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="landing-form">
          <div className="form-group">
            <label className="form-label" htmlFor="l-name">이름/닉네임 *</label>
            <input
              id="l-name"
              className="form-input"
              placeholder="김지수"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="l-insta">인스타그램 ID</label>
            <input
              id="l-insta"
              className="form-input"
              placeholder="@username"
              value={form.instagram_id}
              onChange={e => setForm(p => ({ ...p, instagram_id: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">성별</label>
            <div className="gender-options">
              {[
                { value: 'female', label: '여성' },
                { value: 'male', label: '남성' },
                { value: 'prefer_not', label: '비공개' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`gender-btn ${form.gender === opt.value ? 'active' : ''}`}
                  onClick={() => setForm(p => ({ ...p, gender: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">관심사 (중복 선택 가능)</label>
            <div className="interests-grid">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  className={`interest-btn ${form.interests.includes(interest) ? 'active' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {form.interests.includes(interest) && <Check size={11} />}
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={!form.name || loading}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              '🖤 대기자 등록하기'
            )}
          </button>
        </form>

        <p className="landing-privacy">
          개인정보는 안전하게 보호되며 마케팅 목적으로 사용되지 않아요.
        </p>
      </div>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .landing-bg {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(168,85,247,0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.08) 0%, transparent 60%);
          pointer-events: none;
        }

        .landing-card {
          width: 100%;
          max-width: 480px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 36px;
          position: relative;
          z-index: 1;
        }

        .success-card {
          text-align: center;
          padding: 48px 36px;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
          font-size: 15px;
          font-weight: 700;
        }

        .landing-logo {
          width: 28px;
          height: 28px;
          background: var(--accent-white);
          color: var(--bg-primary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-hero {
          margin-bottom: 28px;
        }

        .landing-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(168,85,247,0.1);
          border: 1px solid rgba(168,85,247,0.3);
          border-radius: var(--radius-full);
          font-size: 12px;
          color: var(--accent-purple);
          margin-bottom: 14px;
        }

        .landing-title {
          font-size: 26px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -0.03em;
          margin-bottom: 12px;
        }

        .landing-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .landing-social-proof {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .avatars {
          display: flex;
        }

        .avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 2px solid var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          margin-left: -6px;
        }

        .avatar:first-child { margin-left: 0; }

        .landing-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .gender-options {
          display: flex;
          gap: 8px;
        }

        .gender-btn {
          flex: 1;
          padding: 8px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .gender-btn.active {
          background: var(--accent-white);
          color: var(--bg-primary);
          border-color: var(--accent-white);
          font-weight: 600;
        }

        .interests-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .interest-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .interest-btn:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        .interest-btn.active {
          background: var(--bg-elevated);
          border-color: var(--border-strong);
          color: var(--text-primary);
          font-weight: 500;
        }

        .landing-privacy {
          margin-top: 16px;
          font-size: 11px;
          color: var(--text-tertiary);
          text-align: center;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
