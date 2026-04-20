'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const msg = authError.message;
      setError(
        msg.includes('Invalid login credentials')
          ? '이메일 또는 비밀번호가 올바르지 않습니다'
          : msg.includes('Email not confirmed')
          ? '이메일 인증이 필요합니다. 받은 편지함을 확인하세요.'
          : msg.includes('Too many requests')
          ? '잠시 후 다시 시도해주세요.'
          : '로그인 중 오류가 발생했습니다.'
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

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
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>PanelAI</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            성장 운영 시스템에 오신 것을 환영합니다
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
            <label className="form-label" htmlFor="email">이메일</label>
            <input
              id="email" type="email" className="form-input"
              placeholder="hello@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPassword ? 'text' : 'password'}
                className="form-input" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 40 }} required autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <div className="spinner" /> : '로그인'}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          계정이 없으신가요?{' '}
          <Link href="/signup" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>회원가입</Link>
        </p>

        {/* Supabase 이메일 인증 안내 */}
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)',
          borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6,
        }}>
          💡 회원가입 후 <strong style={{ color: 'var(--text-secondary)' }}>이메일 인증</strong>을 완료해야 로그인이 가능합니다.
          받은 편지함에서 인증 링크를 확인해주세요.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-container"><div className="auth-card" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
