import { useNavigate } from 'react-router-dom';

const TEST_TYPES = [
  { icon: '✏️', title: '빈칸 채우기', desc: '핵심 문법 파트를 빈칸으로 채우세요', color: '#4f7cff' },
  { icon: '🇰🇷→🇺🇸', title: '한→영 영작', desc: '한국어를 보고 영어 문장을 완성하세요', color: '#06d6a0' },
  { icon: '📚', title: '어휘 퀴즈', desc: '단어와 뜻을 매칭하세요', color: '#ffd166' },
  { icon: '🎧', title: '듣고 받아쓰기', desc: '음성을 듣고 영어로 받아쓰세요', color: '#ff6b6b' },
];

export default function TestMenu() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>← 홈</button>
        <h1 style={styles.title}>시험</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.comingSoon}>
          <span style={styles.comingIcon}>🚧</span>
          <p style={styles.comingText}>시험 기능 준비 중이에요!</p>
          <p style={styles.comingSub}>챕터 학습을 먼저 진행해 주세요.</p>
        </div>

        <h2 style={styles.sectionTitle}>앞으로 이런 시험이 생길 거예요</h2>

        <div style={styles.grid}>
          {TEST_TYPES.map((t, i) => (
            <div key={i} style={{ ...styles.card, borderTop: `4px solid ${t.color}`, opacity: 0.6 }}>
              <div style={styles.cardIcon}>{t.icon}</div>
              <div style={styles.cardTitle}>{t.title}</div>
              <div style={styles.cardDesc}>{t.desc}</div>
              <div style={styles.soon}>Coming Soon</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)' },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 16px',
    background: 'var(--surface)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  backBtn: {
    background: 'none', color: 'var(--primary)', fontSize: 15, fontWeight: 600, padding: '4px 8px',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 800 },
  content: { padding: '24px 16px', maxWidth: 480, margin: '0 auto' },
  comingSoon: {
    background: '#fff', borderRadius: 16, padding: '32px 20px',
    textAlign: 'center', marginBottom: 28,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  comingIcon: { fontSize: 48 },
  comingText: { fontSize: 18, fontWeight: 700, margin: '12px 0 4px' },
  comingSub: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  card: {
    background: '#fff', borderRadius: 14, padding: '16px 14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 },
  soon: {
    marginTop: 10, fontSize: 11, fontWeight: 700,
    color: '#aaa', background: '#f0f0f0', borderRadius: 6,
    padding: '2px 8px', display: 'inline-block',
  },
};
