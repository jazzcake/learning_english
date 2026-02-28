import { useState } from 'react';

async function speakWord(text, setPlaying) {
  setPlaying(true);
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, slow: false }),
    });
    const data = await res.json();
    if (data.audioContent) {
      const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
      audio.addEventListener('ended', () => setPlaying(false));
      audio.play();
    } else {
      setPlaying(false);
    }
  } catch {
    setPlaying(false);
  }
}

function VocabRow({ v, index }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ ...styles.row, background: index % 2 === 0 ? '#f8f9ff' : '#fff' }}>
      <span style={styles.num}>{index + 1}</span>
      <button
        style={{ ...styles.englishBtn, color: playing ? '#ff6b6b' : 'var(--primary)' }}
        onClick={() => !playing && speakWord(v.english, setPlaying)}
        title="클릭하여 발음 듣기"
      >
        <span style={styles.speakerIcon}>{playing ? '🔊' : '🔈'}</span>
        {v.english}
      </button>
      <span style={styles.korean}>{v.korean}</span>
      {v.note && <span style={styles.note}>{v.note}</span>}
    </div>
  );
}

export default function VocabSection({ vocabulary }) {
  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>📖 필수 어휘 <span style={styles.hint}>영문 클릭 → 발음</span></h3>
      <div style={styles.table}>
        {vocabulary.map((v, i) => (
          <VocabRow key={i} v={v} index={i} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginTop: 16,
  },
  title: { margin: '0 0 14px', fontSize: 16, fontWeight: 700 },
  hint: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 },
  table: { borderRadius: 10, overflow: 'hidden', border: '1px solid #eee' },
  row: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 1fr auto',
    gap: 8,
    padding: '8px 12px',
    alignItems: 'center',
    fontSize: 14,
  },
  num: { color: '#aaa', fontSize: 12, fontWeight: 600 },
  englishBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 700,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
    padding: 0,
    textAlign: 'left',
  },
  speakerIcon: { fontSize: 14 },
  korean: { color: 'var(--text)' },
  note: { fontSize: 11, color: 'var(--text-muted)', background: '#f0f4ff', borderRadius: 6, padding: '2px 6px' },
};
