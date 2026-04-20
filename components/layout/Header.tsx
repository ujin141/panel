'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, height: 'var(--header-height)',
      padding: '0 32px',
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Link href="/join" target="_blank" style={{
          fontSize: 12, fontWeight: 500,
          padding: '6px 14px', borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.6)',
          whiteSpace: 'nowrap',
          textDecoration: 'none',
        }}>
          🔗 대기자 등록 링크
        </Link>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', flexShrink: 0,
        }}>나</div>
      </div>
    </header>
  );
}
