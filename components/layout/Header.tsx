'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      <div className="header-right">
        <Link href="/join" className="header-cta" target="_blank">
          🔗 대기자 등록 링크
        </Link>
        <div className="header-avatar">나</div>
      </div>

      <style jsx>{`
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: var(--header-height);
          padding: 0 32px;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .header-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .header-cta {
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          transition: all 150ms;
          white-space: nowrap;
        }

        .header-cta:hover {
          border-color: rgba(255,255,255,0.25);
          color: #fff;
          background: rgba(255,255,255,0.07);
        }

        .header-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .header { padding: 0 16px; }
          .header-cta { display: none; }
        }
      `}</style>
    </header>
  );
}
