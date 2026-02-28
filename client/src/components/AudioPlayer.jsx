import { useEffect, useRef, useState } from 'react';

export default function AudioPlayer({ text, autoPlay = false, onPlay }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [progress, setProgress] = useState(0);

  // autoPlay가 트리거될 때 자동 재생
  useEffect(() => {
    if (autoPlay && text) {
      playAudio(false);
    }
  }, [autoPlay, text]);

  async function fetchAudio(isSlow) {
    setLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: isSlow }),
      });
      const data = await res.json();
      setLoading(false);
      return data.audioContent || null;
    } catch {
      setLoading(false);
      return null;
    }
  }

  async function playAudio(isSlow) {
    if (loading) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSlow(isSlow);
    setProgress(0);

    const audioContent = await fetchAudio(isSlow);
    if (!audioContent) return;

    const audio = new Audio('data:audio/mp3;base64,' + audioContent);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });
    audio.addEventListener('play', () => { setPlaying(true); onPlay?.(); });
    audio.addEventListener('pause', () => setPlaying(false));

    audio.play();
  }

  function togglePause() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.paused ? audio.play() : audio.pause();
  }

  return (
    <div style={styles.wrap}>
      {/* 진행 바 */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
      </div>

      {/* 버튼 영역 */}
      <div style={styles.buttons}>
        <button
          style={{ ...styles.btn, ...styles.playBtn, background: playing ? '#ff6b6b' : 'var(--primary)' }}
          onClick={() => playing ? togglePause() : playAudio(slow)}
          disabled={loading}
        >
          {loading ? '⏳' : playing ? '⏸' : '▶'}
          <span style={styles.btnLabel}>{loading ? '로딩 중' : playing ? '일시 정지' : '다시 듣기'}</span>
        </button>

        <button
          style={{
            ...styles.btn,
            ...styles.slowBtn,
            background: slow ? '#ffd166' : '#f0f4ff',
            color: slow ? '#7c4f00' : 'var(--text-muted)',
          }}
          onClick={() => playAudio(true)}
          disabled={loading}
        >
          🐢
          <span style={styles.btnLabel}>느리게</span>
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 10 },
  progressBar: {
    height: 4,
    background: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--primary)',
    borderRadius: 4,
    transition: 'width 0.1s linear',
  },
  buttons: { display: 'flex', gap: 10 },
  btn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '12px 8px',
    borderRadius: 12,
    fontSize: 18,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.1s, background 0.2s',
    fontFamily: 'inherit',
  },
  playBtn: { color: '#fff' },
  slowBtn: {},
  btnLabel: { fontSize: 13, fontWeight: 600 },
};
