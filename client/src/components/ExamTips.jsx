export default function ExamTips({ keyPoints, examTips }) {
  if (!keyPoints && !examTips) return null;

  return (
    <div style={styles.wrap}>
      {keyPoints && (
        <div style={styles.section}>
          <h3 style={styles.title}>💡 핵심 요약</h3>
          <pre style={styles.content}>{keyPoints}</pre>
        </div>
      )}
      {examTips && (
        <div style={{ ...styles.section, marginTop: keyPoints ? 16 : 0 }}>
          <h3 style={{ ...styles.title, color: '#e74c3c' }}>🎯 시험 포인트</h3>
          <pre style={styles.content}>{examTips}</pre>
        </div>
      )}
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
  section: {},
  title: { margin: '0 0 10px', fontSize: 16, fontWeight: 700 },
  content: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    background: '#f8f9ff',
    borderRadius: 10,
    padding: '12px 14px',
  },
};
