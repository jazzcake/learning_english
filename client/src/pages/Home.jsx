import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveProfileId, getAllProgress } from '../store/progress';

const CHARACTER_COLORS = {
  mario:   '#e74c3c',
  link:    '#27ae60',
  pikachu: '#f1c40f',
  kirby:   '#ff9ff3',
  yoshi:   '#55efc4',
  samus:   '#e17055',
};

const CHARACTER_EMOJIS = {
  mario: '🍄', link: '🗡️', pikachu: '⚡', kirby: '🌸', yoshi: '🦕', samus: '🚀',
};

const STATUS_CONFIG = {
  completed:  { badge: '✅', color: '#06d6a0', label: '완료' },
  review:     { badge: '⏰', color: '#ffd166', label: '복습 필요' },
  inprogress: { badge: '📖', color: '#4f7cff', label: '진행 중' },
  locked:     { badge: '🔒', color: '#ccc',    label: '미시작' },
};

const STATUS_ORDER = { review: 0, inprogress: 1, locked: 2, completed: 3 };

const SCHEDULE_LABELS = ['7일', '14일', '28일', '84일'];

function stageText(p) {
  if (!p || p.study_count === 0) return null;
  if (p.completed) return '완료 ✅';
  if (p.review_round === 0) return '시험 전';
  const label = SCHEDULE_LABELS[p.review_round - 1] || '';
  return `${p.review_round}단계 · ${label}`;
}

// 챕터에 배정할 캐릭터 (순환)
const CHAPTER_CHARACTERS = ['mario', 'link', 'pikachu', 'kirby', 'yoshi', 'samus'];

function statusFromProgress(progressRow) {
  if (!progressRow || progressRow.study_count === 0) return 'locked';
  if (progressRow.completed) return 'completed';
  const today = new Date().toISOString().slice(0, 10);
  if (progressRow.next_review_date && progressRow.next_review_date <= today) return 'review';
  return 'inprogress';
}

export default function Home() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [profile, setProfile] = useState(null);
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    const profileId = getActiveProfileId();

    fetch('/api/chapters')
      .then(r => r.json())
      .then(setChapters)
      .catch(console.error);

    if (profileId) {
      fetch(`/api/profiles/${profileId}`)
        .then(r => r.json())
        .then(setProfile)
        .catch(console.error);

      getAllProgress(profileId)
        .then(rows => {
          const map = {};
          rows.forEach(row => { map[row.chapter_id] = row; });
          setProgressMap(map);
        })
        .catch(console.error);
    }
  }, []);

  const color = CHARACTER_COLORS[profile?.character] || '#4f7cff';
  const emoji = CHARACTER_EMOJIS[profile?.character] || '📚';

  return (
    <div style={styles.page}>
      {/* 헤더 */}
      <div style={{ ...styles.header, background: color }}>
        <div style={styles.profileRow}>
          <div style={styles.profileAvatar}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
          </div>
          <div>
            <div style={styles.profileName}>{profile?.name}</div>
            <div style={styles.profileSub}>안녕! 오늘도 같이 공부하자 💪</div>
          </div>
        </div>
        <button style={styles.testBtn} onClick={() => navigate('/test')}>📝 시험</button>
      </div>

      {/* 챕터 그리드 — 복습 필요 챕터 우선 */}
      <div style={styles.grid}>
        {[...chapters]
          .sort((a, b) => {
            const sa = statusFromProgress(progressMap[a.id]);
            const sb = statusFromProgress(progressMap[b.id]);
            const orderDiff = (STATUS_ORDER[sa] ?? 2) - (STATUS_ORDER[sb] ?? 2);
            return orderDiff !== 0 ? orderDiff : a.id - b.id;
          })
          .map((ch, i) => {
            const status = statusFromProgress(progressMap[ch.id]);
            const cfg = STATUS_CONFIG[status];
            const charId = CHAPTER_CHARACTERS[(ch.id - 1) % CHAPTER_CHARACTERS.length];
            const charColor = CHARACTER_COLORS[charId];
            const charEmoji = CHARACTER_EMOJIS[charId];
            const isLocked = status === 'locked' && ch.id > 1;
            const p = progressMap[ch.id];
            const stage = stageText(p);

          return (
            <div
              key={ch.id}
              style={{
                ...styles.card,
                opacity: isLocked ? 0.55 : 1,
                cursor: isLocked ? 'default' : 'pointer',
              }}
              onClick={() => !isLocked && navigate(`/chapter/${ch.id}`)}
            >
              {/* 캐릭터 영역 */}
              <div style={{ ...styles.cardTop, background: charColor }}>
                <span style={styles.charEmoji}>{charEmoji}</span>
                <div style={{ ...styles.statusBadge, background: 'rgba(255,255,255,0.9)' }}>
                  {cfg.badge}
                </div>
              </div>
              {/* 챕터 정보 */}
              <div style={styles.cardBody}>
                <div style={styles.chapterNum}>Chapter {ch.id}</div>
                <div style={styles.chapterTitle}>{ch.title}</div>
                <div style={styles.chapterMeta}>
                  {ch.type === 'grammar' ? '문법' : '단어'} · {ch.sentenceCount}문장
                </div>
                {p && p.study_count > 0 && (
                  <div style={styles.chapterProgress}>
                    학습 {p.study_count}회
                    {stage && <span style={styles.chapterStage}>{stage}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 뒤로 */}
      <button style={styles.backBtn} onClick={() => navigate('/')}>← 프로필 선택</button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingBottom: 32,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 24px',
    borderRadius: '0 0 24px 24px',
    marginBottom: 24,
  },
  profileRow: { display: 'flex', alignItems: 'center', gap: 12 },
  profileAvatar: {
    width: 48, height: 48,
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 20, fontWeight: 800, color: '#fff' },
  profileSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  testBtn: {
    background: 'rgba(255,255,255,0.25)',
    color: '#fff',
    borderRadius: 12,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 14,
    padding: '0 16px',
    maxWidth: 480,
    margin: '0 auto',
  },
  card: {
    background: 'var(--surface)',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardTop: {
    height: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  charEmoji: { fontSize: 44 },
  statusBadge: {
    position: 'absolute',
    top: 8, right: 8,
    borderRadius: 20,
    padding: '2px 8px',
    fontSize: 13,
  },
  cardBody: { padding: '10px 12px 14px' },
  chapterNum: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 },
  chapterTitle: { fontSize: 13, fontWeight: 700, marginTop: 2, lineHeight: 1.3 },
  chapterMeta: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4 },
  chapterProgress: { fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  chapterStage: { background: '#e8eeff', color: 'var(--primary)', borderRadius: 6, padding: '1px 5px', fontWeight: 700, fontSize: 10 },
  backBtn: {
    display: 'block',
    margin: '24px auto 0',
    background: 'none',
    color: 'var(--text-muted)',
    fontSize: 14,
    padding: '8px 16px',
  },
};
