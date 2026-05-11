'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Delete } from 'lucide-react';
import { Suspense } from 'react';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

const PIN_LENGTH = 4;

function PinLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleKey = (key: string) => {
    if (loading) return;
    setError('');

    if (key === 'del') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    setPin(p => p + key);
  };

  // PIN 자동 제출
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      submitPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // 키보드 입력 지원
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) handleKey(e.key);
      if (e.key === 'Backspace') handleKey('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, loading]);

  const submitPin = async (value: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });

      if (res.ok) {
        window.location.href = redirectTo;
      } else {
        setShake(true);
        setError('핀 번호가 올바르지 않습니다');
        setPin('');
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 40,
      }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent-white)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
          }}>
            <Zap size={26} color="#000" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            PanelAI
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            PIN 번호를 입력하세요
          </div>
        </div>

        {/* PIN 도트 표시 */}
        <div style={{
          display: 'flex',
          gap: 20,
          animation: shake ? 'pinShake 0.5s ease' : undefined,
        }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} style={{
              width: 18, height: 18,
              borderRadius: '50%',
              border: `2px solid ${pin.length > i ? 'var(--accent-white)' : 'var(--border-primary)'}`,
              background: pin.length > i
                ? (error ? '#ef4444' : 'var(--accent-white)')
                : 'transparent',
              transition: 'all 0.15s ease',
              transform: pin.length === i + 1 ? 'scale(1.2)' : 'scale(1)',
            }} />
          ))}
        </div>

        {/* 에러 메시지 */}
        <div style={{
          height: 20,
          fontSize: 13,
          color: '#f87171',
          textAlign: 'center',
          opacity: error ? 1 : 0,
          transition: 'opacity 0.2s',
          marginTop: -20,
        }}>
          {error || ' '}
        </div>

        {/* 키패드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          {KEYS.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {row.map((key, ki) => {
                if (key === '') return <div key={ki} style={{ width: 88, height: 72 }} />;

                const isDel = key === 'del';
                return (
                  <button
                    key={ki}
                    onClick={() => handleKey(key)}
                    disabled={loading}
                    style={{
                      width: 88, height: 72,
                      borderRadius: 16,
                      border: '1px solid var(--border-primary)',
                      background: isDel
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)',
                      fontSize: isDel ? 14 : 22,
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s ease',
                      opacity: loading ? 0.5 : 1,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                      (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={e => {
                      (e.currentTarget as HTMLElement).style.background = isDel
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isDel
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    }}
                  >
                    {isDel ? <Delete size={20} /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            확인 중...
          </div>
        )}
      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <PinLoginForm />
    </Suspense>
  );
}
