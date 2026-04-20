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
    <aside style={{
      position: 'fixed', top: 0, left: 0,
      width: 220, height: '100vh',
      background: '#0d0d0d',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '18px 16px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, background: '#fff', color: '#000',
          borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={15} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>PanelAI</span>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: '12px 8px 8px',
        display: 'flex', flexDirection: 'column', gap: 18,
        overflowY: 'auto',
      }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '0 9px', marginBottom: 3,
            }}>{group.label}</p>
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
      <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>목표 달성률</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>847 / 1,000명</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '84.7%', background: '#fff', borderRadius: 999 }} />
        </div>
      </div>
    </aside>
  );
}
