import { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

function highlightText(text, highlight) {
  if (!highlight) return <span>{text}</span>;
  const parts = text.split(highlight);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span style={styles.highlight}>{highlight}</span>
      )}
    </span>
  ));
}

function highlightKorean(text) {
  // 대괄호 []나 볼드 강조 파트를 색상 처리
  return text.split(/(\[.+?\])/).map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return <span key={i} style={styles.koreanHighlight}>{part.slice(1, -1)}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function SentenceCard({ sentence, onNext, onPrev, current, total, autoReveal = false, onPlay }) {
  const [revealed, setRevealed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // 문장이 바뀌면 리셋, autoReveal이면 바로 공개+자동재생
  useEffect(() => {
    if (autoReveal) {
      setRevealed(true);
      const timer = setTimeout(() => setAutoPlay(v => !v), 300);
      return () => clearTimeout(timer);
    } else {
      setRevealed(false);
      setAutoPlay(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence?.id]);

  function handleReveal() {
    if (revealed) return;
    setRevealed(true);
    // 살짝 딜레이 후 autoPlay 트리거 (fade-in 애니가 먼저 보이도록)
    setTimeout(() => setAutoPlay(prev => !prev), 300);
  }

  // 한국어 텍스트에서 마지막 괄호 힌트(문법 설명) 제거 후 핵심 부분 강조
  const koreanClean = sentence.korean
    .replace(/\(목적\)|\(원인\)|\(결과\)|\(명사.*?\)|\(형용사.*?\)|\(주어\)|\(목적어\)|\(전치사.*?\)|\(관용.*?\)/g, '')
    .trim();

  // 핵심 한국어 파트를 [] 로 감싸기 (데이터에 highlight가 있을 때)
  const koreanDisplay = koreanClean;

  return (
    <div style={styles.wrap}>
      {/* 진행도 바 */}
      <div style={styles.progressWrap}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(current / total) * 100}%` }} />
        </div>
        <span style={styles.progressLabel}>{current} / {total}</span>
      </div>

      {/* 한국어 문장 */}
      <div style={styles.koreanBox}>
        <div style={styles.koreanText}>
          {koreanDisplay.split('/').map((part, i, arr) => (
            <span key={i}>
              <span>{part.trim()}</span>
              {i < arr.length - 1 && <span style={styles.slash}> / </span>}
            </span>
          ))}
        </div>
      </div>

      {/* 영어 영역 */}
      {!revealed ? (
        <button style={styles.revealBtn} onClick={handleReveal}>
          <span style={styles.revealIcon}>👆</span>
          <span>탭해서 영어 확인</span>
        </button>
      ) : (
        <div className="fade-in" style={styles.englishBox}>
          <div style={styles.englishText}>
            {highlightText(sentence.english, sentence.highlight)}
          </div>
        </div>
      )}

      {/* 오디오 플레이어 */}
      <div style={{ ...styles.audioWrap, opacity: revealed ? 1 : 0.3, pointerEvents: revealed ? 'auto' : 'none' }}>
        <AudioPlayer
          text={sentence.english.replace(/\//g, '').trim()}
          autoPlay={autoPlay}
          onPlay={onPlay}
        />
      </div>

      {/* 네비게이션 */}
      <div style={styles.navRow}>
        <button style={styles.navBtn} onClick={onPrev} disabled={current === 1}>
          ◀ 이전
        </button>
        <button
          style={{ ...styles.navBtn, ...styles.navBtnNext }}
          onClick={onNext}
          disabled={current === total}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '0 0 24px',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    background: '#e0e7ff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  progressLabel: {
    fontSize: 13,
    color: 'var(--text-muted)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  koreanBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 20px',
    boxShadow: '0 2px 12px rgba(79,124,255,0.08)',
    border: '2px solid #e0e7ff',
    minHeight: 80,
    display: 'flex',
    alignItems: 'center',
  },
  koreanText: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.6,
    color: 'var(--text)',
  },
  slash: { color: '#aab4c8', fontWeight: 300 },
  koreanHighlight: {
    color: 'var(--highlight-text)',
    background: 'var(--highlight)',
    borderRadius: 4,
    padding: '0 4px',
    fontWeight: 700,
  },
  revealBtn: {
    background: '#f0f4ff',
    border: '2px dashed #c5cae9',
    borderRadius: 16,
    padding: '24px',
    fontSize: 16,
    color: 'var(--text-muted)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    minHeight: 80,
    transition: 'background 0.2s',
  },
  revealIcon: { fontSize: 28 },
  englishBox: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 20px',
    boxShadow: '0 2px 12px rgba(79,124,255,0.12)',
    border: '2px solid var(--primary)',
    minHeight: 80,
    display: 'flex',
    alignItems: 'center',
  },
  englishText: {
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.6,
    color: 'var(--text)',
  },
  highlight: {
    color: 'var(--primary)',
    fontWeight: 700,
    background: '#e8eeff',
    borderRadius: 4,
    padding: '0 3px',
  },
  audioWrap: { transition: 'opacity 0.3s' },
  navRow: {
    display: 'flex',
    gap: 12,
    marginTop: 4,
  },
  navBtn: {
    flex: 1,
    padding: '14px',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    background: '#f0f4ff',
    color: 'var(--primary)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  navBtnNext: {
    background: 'var(--primary)',
    color: '#fff',
  },
};
