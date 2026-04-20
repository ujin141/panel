'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    });

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? '이미 가입된 이메일입니다. 로그인해주세요.'
          : authError.message.includes('Password should be')
          ? '비밀번호는 8자 이상이어야 합니다.'
          : '회원가입 중 오류가 발생했습니다.'
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>이메일을 확인해주세요!</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong>으로<br />
            인증 링크를 보내드렸습니다.<br />
            이메일의 링크를 클릭하면 로그인이 가능합니다.
          </div>
          <Link href="/login" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
            로그인 페이지로 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, background: 'var(--accent-white)',
            borderRadius: 'var(--radius-md)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Zap size={22} color="#000" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>PanelAI 시작하기</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            0 → 1,000 유저 성장 여정을 시작하세요
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)', fontSize: 13, color: '#f87171',
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">이름</label>
            <input id="name" type="text" className="form-input" placeholder="홍길동"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">이메일</label>
            <input id="email" type="email" className="form-input" placeholder="hello@example.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">비밀번호</label>
            <input id="password" type="password" className="form-input" placeholder="8자 이상 입력"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              minLength={8} required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <div className="spinner" /> : '무료로 시작하기'}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-container"><div className="auth-card" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
