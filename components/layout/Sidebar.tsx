'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Sparkles, MessageCircle, Users,
  Filter, Lightbulb, BookOpen, CalendarClock,
  TrendingUp, Bell, UserSquare2, Zap, LayoutGrid,
} from 'lucide-react';

const navGroups = [
  {
    label: '시작',
    items: [
      { label: '대시보드', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: '콘텐츠',
    items: [
      { label: 'AI 글쓰기', href: '/content', icon: Sparkles },
      { label: '카드뉴스 제작', href: '/card-news', icon: LayoutGrid },
      { label: '예약 발행', href: '/schedule', icon: CalendarClock },
    ],
  },
  {
    label: 'DM & 유저',
    items: [
      { label: 'DM 스크립트', href: '/dm-funnel', icon: MessageCircle },
      { label: '대기자 목록', href: '/waitlist', icon: Users },
      { label: 'CRM', href: '/crm', icon: UserSquare2 },
      { label: '유저 필터', href: '/users', icon: Filter },
    ],
  },
  {
    label: '분석 & 전략',
    items: [
      { label: 'AI 최적화', href: '/optimize', icon: TrendingUp },
      { label: '성장 알림', href: '/alerts', icon: Bell },
      { label: '전략 생성', href: '/strategy', icon: Lightbulb },
      { label: '성장 일지', href: '/case-study', icon: BookOpen },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="logo">
        <div className="logo-icon"><Zap size={15} /></div>
        <span className="logo-text">PanelAI</span>
      </div>

      {/* Nav */}
      <nav className="nav">
        {navGroups.map((group) => (
          <div key={group.label} className="nav-group">
            <p className="nav-group-label">{group.label}</p>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-item', isActive && 'nav-item--active')}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Goal bar */}
      <div className="goal">
        <div className="goal-row">
          <span className="goal-label">목표 달성률</span>
          <span className="goal-value">847 / 1,000명</span>
        </div>
        <div className="goal-bar">
          <div className="goal-fill" style={{ width: '84.7%' }} />
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0; left: 0;
          width: 220px;
          height: 100vh;
          background: #0d0d0d;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 18px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .logo-icon {
          width: 28px; height: 28px;
          background: #fff; color: #000;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* Nav */
        .nav {
          flex: 1;
          padding: 12px 8px 8px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .nav-group-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0 9px;
          margin-bottom: 3px;
        }

        :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
          transition: all 120ms ease;
          text-decoration: none;
        }

        :global(.nav-item:hover) {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.85);
        }

        :global(.nav-item--active) {
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-weight: 500;
        }

        /* Goal */
        .goal {
          padding: 14px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .goal-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
        }

        .goal-label {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }

        .goal-value {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
        }

        .goal-bar {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
          overflow: hidden;
        }

        .goal-fill {
          height: 100%;
          background: #fff;
          border-radius: 999px;
        }

        @media (max-width: 768px) {
          .sidebar { display: none; }
        }
      `}</style>
    </aside>
  );
}
