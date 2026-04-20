'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Copy, CheckCircle, Info, ChevronRight, Sparkles } from 'lucide-react';

const stages = [
  {
    key: 'first_response',
    step: '1단계',
    label: '첫 번째 DM',
    emoji: '👋',
    when: '게시글 보고 DM을 보내온 유저에게 처음 보내는 메시지',
    tip: '너무 길면 안 읽어요. 짧고 따뜻하게, 다음 대화를 유도하는 질문으로 끝내세요.',
    defaultScript: `안녕하세요! 😊
게시글 보고 DM 주셨군요, 감사해요!

저희 앱은 지금 20~30대 여성분들을 대상으로
소규모 베타 테스트 중이에요.

혹시 어떤 부분이 가장 궁금하셨어요?`,
    bgColor: 'rgba(59,130,246,0.06)',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  {
    key: 'filter',
    step: '2단계',
    label: '관심도 확인',
    emoji: '🎯',
    when: '1단계에서 긍정적인 응답이 온 유저에게 보내는 메시지',
    tip: '진짜 관심 있는 사람만 필터링하는 단계예요. 한 가지 질문으로 진심을 확인하세요.',
    defaultScript: `와 감사해요! 진짜 관심 있으신 분들이랑만
함께하고 싶어서 한 가지만 여쭤볼게요 🙏

지금 주로 어떤 고민이 있으세요?
(저희 앱이 딱 도움 될 수 있는지 확인하려고요)

진지하게 써보실 의향 있으시면
바로 베타 초대 링크 드릴게요!`,
    bgColor: 'rgba(168,85,247,0.06)',
    borderColor: 'rgba(168,85,247,0.2)',
  },
  {
    key: 'waitlist',
    step: '3단계',
    label: '대기자 유도',
    emoji: '🎉',
    when: '관심 있다고 응답한 유저를 대기자 목록으로 보낼 때',
    tip: '이 메시지에 실제 대기자 등록 링크를 삽입하세요. "지금 바로"라는 긴박감이 중요해요.',
    defaultScript: `완전 딱 맞는 분이시네요! 💌

지금 바로 대기자 리스트 등록하시면
앱 출시 즉시 알림받으실 수 있어요.

👇 여기서 등록하세요 (30초면 완료돼요)
[대기자 링크 삽입]

등록하시면 최우선으로 초대드릴게요 🖤`,
    bgColor: 'rgba(34,197,94,0.06)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
];

export default function DMFunnelPage() {
  const [active, setActive] = useState(0);
  const [scripts, setScripts] = useState(stages.map(s => s.defaultScript));
  const [copied, setCopied] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = (idx: number, value: string) => {
    const next = [...scripts];
    next[idx] = value;
    setScripts(next);
    setEditing(null);
  };

  const regenerateScript = async (stageKey: string, idx: number) => {
    setGenerating(idx);
    try {
      const res = await fetch('/api/dm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: stageKey,
          target: '20~30대 한국 여성',
          appDescription: '초기 스타트업 앱 베타 서비스',
        }),
      });
      if (!res.ok) throw new Error('생성 실패');
      const { script } = await res.json();
      const next = [...scripts];
      next[idx] = script;
      setScripts(next);
    } catch {
      alert('AI 스크립트 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div>
      <Header title="DM 스크립트" subtitle="복붙만 하면 되는 단계별 DM 템플릿이에요" />
      <div className="page-container animate-fade-in">

        {/* How it works */}
        <div className="tip-box" style={{ marginBottom: 28 }}>
          <Info size={13} />
          <span>
            <strong>사용 방법</strong>: 인스타/Threads에서 DM이 오면 아래 단계별 스크립트를 복사해서 붙여넣으세요.
            단계 순서대로만 보내면 돼요. AI로 새로 생성하거나 직접 수정도 가능합니다.
          </span>
        </div>

        {/* Funnel flow */}
        <div className="funnel-flow" style={{ marginBottom: 28 }}>
          {stages.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                className={`funnel-step-btn ${active === i ? 'active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                </div>
              </button>
              {i < stages.length - 1 && (
                <ChevronRight size={18} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>

        {/* Active script */}
        {stages.map((stage, i) => {
          if (active !== i) return null;
          return (
            <div key={stage.key} className="script-card" style={{ borderColor: stage.borderColor, background: stage.bgColor }}>
              {/* When to use */}
              <div className="script-when">
                <span style={{ fontSize: 14 }}>{stage.emoji}</span>
                <span>{stage.when}</span>
              </div>

              {/* Script area */}
              <div style={{ marginBottom: 14 }}>
                {editing === i ? (
                  <div>
                    <textarea
                      className="form-input form-textarea"
                      style={{ minHeight: 160, fontFamily: 'inherit', lineHeight: 1.8, fontSize: 14 }}
                      defaultValue={scripts[i]}
                      autoFocus
                      onBlur={e => handleSave(i, e.target.value)}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                      다른 곳 클릭하면 자동 저장됩니다
                    </div>
                  </div>
                ) : (
                  <div className="script-text">{scripts[i]}</div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => regenerateScript(stage.key, i)}
                  disabled={generating === i}
                >
                  <Sparkles size={13} />
                  {generating === i ? 'AI 생성 중...' : 'AI로 새로 생성'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditing(editing === i ? null : i)}
                >
                  ✏️ {editing === i ? '편집 중...' : '내 스타일로 수정'}
                </button>
                <button
                  className={`btn btn-sm ${copied === i ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleCopy(scripts[i], i)}
                  style={{ gap: 6 }}
                >
                  {copied === i ? (
                    <><CheckCircle size={14} /> 복사됨!</>
                  ) : (
                    <><Copy size={14} /> 복사해서 DM 보내기</>
                  )}
                </button>
              </div>

              {/* Tip */}
              <div className="script-tip">
                <span style={{ color: '#f59e0b' }}>💡 팁</span> {stage.tip}
              </div>

              {/* Next step hint */}
              {i < stages.length - 1 && (
                <button
                  className="next-step-hint"
                  onClick={() => setActive(i + 1)}
                >
                  <span>DM 보냈어요 →</span>
                  <span style={{ fontWeight: 600 }}>{stages[i + 1].label} 보기</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          );
        })}

        {/* All scripts summary */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'rgba(255,255,255,0.6)' }}>
            📋 전체 스크립트 한눈에 보기
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {stages.map((s, i) => (
              <div key={s.key} className="summary-card">
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.emoji} {s.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                  {scripts[i].slice(0, 70)}...
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginTop: 10, fontSize: 11 }}
                  onClick={() => handleCopy(scripts[i], i + 100)}
                >
                  {copied === i + 100 ? '✓ 복사됨' : '📋 복사'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .funnel-flow {
          display: flex;
          align-items: center;
          gap: 0;
          overflow-x: auto;
          padding: 4px 0;
        }

        .funnel-step-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          transition: all 150ms;
          white-space: nowrap;
          text-align: left;
        }

        .funnel-step-btn:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
        }

        .funnel-step-btn.active {
          border-color: rgba(255,255,255,0.4);
          background: rgba(255,255,255,0.08);
        }

        .script-card {
          border: 1px solid;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .script-when {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          padding: 10px 14px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
        }

        .script-text {
          font-size: 14px;
          line-height: 1.9;
          color: rgba(255,255,255,0.85);
          white-space: pre-wrap;
          padding: 18px;
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .script-tip {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          padding: 10px 14px;
          background: rgba(245,158,11,0.05);
          border: 1px solid rgba(245,158,11,0.12);
          border-radius: 10px;
          line-height: 1.6;
        }

        .next-step-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 150ms;
          width: 100%;
          justify-content: center;
        }

        .next-step-hint:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
        }

        .summary-card {
          padding: 16px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }

        .tip-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
