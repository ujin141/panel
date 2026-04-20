'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Lightbulb, Sparkles, ChevronRight, Target, FileText, Funnel } from 'lucide-react';

const APP_CATEGORIES = [
  '뷰티/스킨케어', '패션/스타일', '건강/피트니스', '라이프스타일',
  '자기계발', '여행', '음식/맛집', '소셜/커뮤니티', '생산성', '기타',
];

const TARGET_PRESETS = [
  '20대 한국 여성', '20~30대 한국 여성', '2030 직장인 여성', '대학생 여성',
];

interface Strategy {
  phases: {
    title: string;
    duration: string;
    actions: string[];
  }[];
  contentDirection: string[];
  funnelDesign: string[];
}

const mockStrategy: Strategy = {
  phases: [
    {
      title: 'Phase 1: 씨앗 단계 (0→100명)',
      duration: '1~2주',
      actions: [
        'Threads에 하루 3~5개 "호기심 유도형" 게시글 포스팅',
        '댓글/DM 반응 유저에게 즉시 1:1 DM 발송',
        '대기자 랜딩 페이지 운영 (구글폼 또는 전용 페이지)',
        '여성 뷰티/라이프스타일 계정과 상호 팔로우 확장',
        '게시글 성과 데이터 매일 기록',
      ],
    },
    {
      title: 'Phase 2: 싹 단계 (100→500명)',
      duration: '2~4주',
      actions: [
        '가장 높은 DM 전환률 게시글 유형 집중 확대',
        '"기존 대기자 후기" 격을 콘텐츠로 재활용',
        '인스타 릴스 1~2개/주 (비포어/애프터 포맷)',
        '대기자 중 고가치 유저 선별, 먼저 초대',
        '초대받은 유저 → 2차 공유 유도 (친구 초대 이벤트)',
      ],
    },
    {
      title: 'Phase 3: 파도 단계 (500→1,000명)',
      duration: '4~8주',
      actions: [
        '인게이지먼트 높은 Threads 계정 협업',
        '유저 UGC(후기, 스크린샷) 적극 리포스팅',
        '대기자 커뮤니티 채널 개설 (카카오채널 또는 텔레그램)',
        '"한정 초대" 캠페인으로 희소성 극대화',
        '위클리 성장 리포트 공개로 신뢰도 구축',
      ],
    },
  ],
  contentDirection: [
    '📸 "뒷이야기" 포맷: 앱을 어떻게 쓰는지 일상 공유',
    '🔮 "3가지 비밀" 포맷: 타겟 고민 공감 + 해결책 암시',
    '💌 "당신만 알려주는" 포맷: 선별된 느낌의 초대',
    '📊 숫자 포맷: "47명이 이미 대기 중" 사회적 증거',
    '🎭 감정 포맷: 비포어/애프터 변화 스토리',
  ],
  funnelDesign: [
    '조회수 → DM: 호기심 자극 + 명확한 CTA ("DM으로 신청")',
    'DM → 필터링: 2~3개 질문으로 진짜 관심도 확인',
    '필터링 → 대기자: 긍정적 응답자에게 랜딩 링크 즉시 발송',
    '대기자 → 설치: 앱 준비 시 최우선 그룹 초대 + 개인화 메시지',
    '설치 → 공유: 앱 내 "친구 초대" 기능 + 콘텐츠 제공',
  ],
};

export default function StrategyPage() {
  const [category, setCategory] = useState('');
  const [target, setTarget] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [result, setResult] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!category) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setResult(mockStrategy);
    setLoading(false);
  };

  const finalTarget = target === 'custom' ? customTarget : target;

  return (
    <div>
      <Header title="성장 전략 생성기" subtitle="앱 카테고리와 타겟을 입력하면 맞춤 전략을 만들어드립니다" />
      <div className="page-container animate-fade-in">

        {/* Input Form */}
        <div className="card strategy-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">앱 카테고리 *</label>
              <select
                className="form-input form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">카테고리 선택</option>
                {APP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">타겟 유저</label>
              <select
                className="form-input form-select"
                value={target}
                onChange={e => setTarget(e.target.value)}
              >
                <option value="">타겟 선택</option>
                {TARGET_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="custom">직접 입력</option>
              </select>
            </div>
          </div>

          {target === 'custom' && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">타겟 직접 입력</label>
              <input
                className="form-input"
                placeholder="예: 30대 직장 여성, 육아 중 엄마..."
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ marginTop: 20, minWidth: 200 }}
            onClick={handleGenerate}
            disabled={!category || loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 14, height: 14 }} />전략 생성 중...</>
            ) : (
              <><Sparkles size={14} />성장 전략 생성</>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="strategy-result animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div className="result-badge">
                <Target size={14} />
                {category} · {finalTarget || '일반 타겟'}
              </div>
            </div>

            {/* Phases */}
            <div style={{ marginBottom: 32 }}>
              <div className="section-title">
                <span className="section-num">01</span>
                단계별 성장 전략
              </div>
              <div className="phases-list">
                {result.phases.map((phase, i) => (
                  <div key={i} className="phase-card card">
                    <div className="phase-header">
                      <div className="phase-badge">{i + 1}</div>
                      <div>
                        <div className="phase-title">{phase.title}</div>
                        <div className="phase-duration">⏱ 예상 기간: {phase.duration}</div>
                      </div>
                    </div>
                    <ul className="phase-actions">
                      {phase.actions.map((action, j) => (
                        <li key={j}>
                          <ChevronRight size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 2 }} />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Direction */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div className="section-title">
                  <span className="section-num">02</span>
                  콘텐츠 방향
                </div>
                <div className="card">
                  <ul className="direction-list">
                    {result.contentDirection.map((item, i) => (
                      <li key={i} className="direction-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="section-title">
                  <span className="section-num">03</span>
                  퍼널 설계
                </div>
                <div className="card">
                  <ul className="direction-list">
                    {result.funnelDesign.map((item, i) => (
                      <li key={i} className="direction-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .strategy-form {
          margin-bottom: 32px;
        }

        .result-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          font-size: 13px;
          color: var(--text-secondary);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .section-num {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          font-variant-numeric: tabular-nums;
        }

        .phases-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .phase-card {
          padding: 18px 20px;
        }

        .phase-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }

        .phase-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-white);
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .phase-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .phase-duration {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .phase-actions {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .phase-actions li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .direction-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .direction-item {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .direction-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        @media (max-width: 768px) {
          .strategy-form > div {
            grid-template-columns: 1fr;
          }

          .strategy-result > div:last-child {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
