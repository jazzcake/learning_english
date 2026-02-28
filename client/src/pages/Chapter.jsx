import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SentenceCard from '../components/SentenceCard';
import VocabSection from '../components/VocabSection';
import ExamTips from '../components/ExamTips';
import { recordStudy, getChapterProgress, getActiveProfileId } from '../store/progress';

const SCHEDULE_LABELS = ['7일', '14일', '28일', '84일'];

function stageText(p) {
  if (!p || p.study_count === 0) return null;
  if (p.completed) return '완료 ✅';
  if (p.review_round === 0) return '시험 전';
  const label = SCHEDULE_LABELS[p.review_round - 1] || '';
  return `${p.review_round}단계 · 다음복습 ${label}`;
}

function ProgressInfo({ progress }) {
  if (!progress || progress.study_count === 0) return null;

  const tests = Array.isArray(progress.test_history) ? progress.test_history.length : 0;
  const stage = stageText(progress);
  const today = new Date().toISOString().slice(0, 10);
  const overdue = progress.next_review_date && progress.next_review_date <= today && !progress.completed;

  return (
    <div style={piStyles.wrap}>
      <span style={piStyles.item}>📚 학습 {progress.study_count}회</span>
      {tests > 0 && <span style={piStyles.item}>📝 시험 {tests}회</span>}
      {stage && (
        <span style={{ ...piStyles.item, ...piStyles.stage, background: overdue ? '#fff3cd' : '#e8eeff', color: overdue ? '#856404' : 'var(--primary)' }}>
          {overdue ? '⏰ ' : ''}{stage}
        </span>
      )}
    </div>
  );
}

const piStyles = {
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 14px',
    background: '#f8f9ff',
    borderRadius: 12,
    marginBottom: 4,
    marginTop: 4,
  },
  item: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  stage: {
    borderRadius: 8,
    padding: '2px 8px',
    fontWeight: 700,
  },
};

export default function Chapter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [current, setCurrent] = useState(1);
  const [listMode, setListMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasListened, setHasListened] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setLoading(true);
    const profileId = getActiveProfileId();

    fetch(`/api/chapters/${id}`)
      .then(r => r.json())
      .then(async data => {
        setChapter(data);
        setLoading(false);
        await recordStudy(profileId, parseInt(id));
        const p = await getChapterProgress(profileId, parseInt(id));
        setProgress(p);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;
  if (!chapter) return <div style={styles.loading}>챕터를 찾을 수 없습니다.</div>;

  const sentence = chapter.sentences[current - 1];

  function handleNext() {
    setCurrent(v => Math.min(chapter.sentences.length, v + 1));
  }
  function handlePrev() {
    setCurrent(v => Math.max(1, v - 1));
  }

  return (
    <div style={styles.page}>
      {/* 헤더 */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/home')}>← 홈</button>
        <div style={styles.headerTitle}>
          <span style={styles.chNum}>Ch.{chapter.id}</span>
          <span style={styles.chTitle}>{chapter.title}</span>
        </div>
        <button
          style={{ ...styles.modeBtn, background: listMode ? 'var(--primary)' : '#f0f4ff' }}
          onClick={() => setListMode(v => !v)}
        >
          {listMode ? '카드' : '목록'}
        </button>
      </div>

      <div style={styles.content}>
        {/* 카드 모드 */}
        {!listMode && sentence && (
          <SentenceCard
            sentence={sentence}
            current={current}
            total={chapter.sentences.length}
            autoReveal={hasListened}
            onPlay={() => setHasListened(true)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}

        {/* 목록 모드 */}
        {listMode && (
          <div style={styles.listWrap}>
            {chapter.sentences.map((s, i) => (
              <div
                key={s.id}
                style={{ ...styles.listItem, background: i === current - 1 ? '#e8eeff' : '#fff' }}
                onClick={() => { setCurrent(i + 1); setListMode(false); }}
              >
                <span style={styles.listNum}>{s.id}</span>
                <div>
                  <div style={styles.listKorean}>{s.korean}</div>
                  <div style={styles.listEnglish}>{s.english}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 진행도 + 하단 정보 섹션 */}
        <ProgressInfo progress={progress} />
        <ExamTips keyPoints={chapter.key_points} examTips={chapter.exam_tips} />
        <VocabSection vocabulary={chapter.vocabulary} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', fontSize: 18, color: 'var(--text-muted)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 16px 12px',
    background: 'var(--surface)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    color: 'var(--primary)',
    fontSize: 15,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 8,
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chNum: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 },
  chTitle: { fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  modeBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--primary)',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: '20px 16px',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  },
  listWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  listItem: {
    display: 'flex',
    gap: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    alignItems: 'flex-start',
  },
  listNum: { fontSize: 12, color: '#aaa', fontWeight: 700, minWidth: 20, paddingTop: 2 },
  listKorean: { fontSize: 14, fontWeight: 600, color: 'var(--text)' },
  listEnglish: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
};
