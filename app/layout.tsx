import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PanelAI — Growth OS for Early-Stage Apps',
  description:
    'PanelAI는 초기 스타트업 앱을 위한 성장 운영 시스템입니다. 콘텐츠 생성, DM 퍼널, 대기자 관리를 한 곳에서.',
  keywords: 'growth hacking, user acquisition, content marketing, DM funnel, waitlist',
  openGraph: {
    title: 'PanelAI — Growth OS',
    description: '0 → 1,000 유저를 만드는 성장 운영 플랫폼',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
