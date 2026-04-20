'use client';

import Link from 'next/link';
import { AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react';

interface AlertWidgetProps {
  criticalCount?: number;
  warningCount?: number;
}

export default function AlertWidget({ criticalCount = 1, warningCount = 2 }: AlertWidgetProps) {
  if (criticalCount === 0 && warningCount === 0) return null;

  return (
    <Link href="/alerts" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(239,68,68,0.2)',
      background: 'rgba(239,68,68,0.04)',
      marginBottom: 24,
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 150ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {criticalCount > 0 ? (
          <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
        ) : (
          <TrendingDown size={16} style={{ color: 'var(--accent-orange)' }} />
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {criticalCount > 0 ? `긴급 알림 ${criticalCount}건` : `주의 알림 ${warningCount}건`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {criticalCount > 0 ? 'DM 전환율이 임계값 이하입니다' : '성장 지표를 확인하세요'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {criticalCount > 0 && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)',
            border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600,
          }}>
            {criticalCount}건
          </span>
        )}
        {warningCount > 0 && (
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(249,115,22,0.15)', color: 'var(--accent-orange)',
            border: '1px solid rgba(249,115,22,0.3)', fontWeight: 600,
          }}>
            {warningCount}건
          </span>
        )}
        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
      </div>
    </Link>
  );
}
