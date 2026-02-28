import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfiles, createProfile, setActiveProfileId, deleteProfile } from '../store/progress';

const CHARACTERS = [
  { id: 'mario',   label: 'Mario',   emoji: '🍄' },
  { id: 'link',    label: 'Link',    emoji: '🗡️' },
  { id: 'pikachu', label: 'Pikachu', emoji: '⚡' },
  { id: 'kirby',   label: 'Kirby',   emoji: '🌸' },
  { id: 'yoshi',   label: 'Yoshi',   emoji: '🦕' },
  { id: 'samus',   label: 'Samus',   emoji: '🚀' },
];

const CHARACTER_COLORS = {
  mario:   '#e74c3c',
  link:    '#27ae60',
  pikachu: '#f1c40f',
  kirby:   '#ff9ff3',
  yoshi:   '#55efc4',
  samus:   '#e17055',
};

export default function ProfileSelect() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState('mario');

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(id) {
    setActiveProfileId(id);
    navigate('/home');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await createProfile(name.trim(), selectedChar);
    navigate('/home');
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('이 프로필을 삭제할까요?')) return;
    await deleteProfile(id);
    const updated = await getProfiles();
    setProfiles(updated);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>영어 학습</h1>
      <p style={styles.subtitle}>누가 공부할 건가요?</p>

      <div style={styles.list}>
        {profiles.map(p => {
          const ch = CHARACTERS.find(c => c.id === p.character) || CHARACTERS[0];
          const color = CHARACTER_COLORS[p.character] || '#4f7cff';
          const totalStudied = Object.values(p.chapters || {}).filter(c => c.studyCount > 0).length;
          const totalCompleted = Object.values(p.chapters || {}).filter(c => c.completed).length;

          return (
            <div key={p.id} style={{ ...styles.card, borderColor: color }} onClick={() => handleSelect(p.id)}>
              <div style={{ ...styles.avatar, background: color }}>
                <span style={styles.avatarEmoji}>{ch.emoji}</span>
              </div>
              <div style={styles.cardInfo}>
                <div style={styles.cardName}>{p.name}</div>
                <div style={styles.cardSub}>
                  {ch.label} · 학습 {totalStudied}챕터 · 완료 {totalCompleted}챕터
                </div>
              </div>
              <button style={styles.deleteBtn} onClick={(e) => handleDelete(e, p.id)}>✕</button>
            </div>
          );
        })}

        {!creating && (
          <div style={{ ...styles.card, ...styles.addCard }} onClick={() => setCreating(true)}>
            <div style={styles.addIcon}>＋</div>
            <div style={styles.addLabel}>새 프로필 만들기</div>
          </div>
        )}
      </div>

      {creating && (
        <div style={styles.overlay} onClick={() => setCreating(false)}>
          <form style={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleCreate}>
            <h2 style={styles.modalTitle}>새 프로필</h2>

            <input
              style={styles.input}
              placeholder="이름을 입력하세요"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={12}
            />

            <p style={styles.charLabel}>캐릭터 선택</p>
            <div style={styles.charGrid}>
              {CHARACTERS.map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  style={{
                    ...styles.charBtn,
                    background: selectedChar === ch.id ? CHARACTER_COLORS[ch.id] : '#f0f4ff',
                    color: selectedChar === ch.id ? '#fff' : '#333',
                    transform: selectedChar === ch.id ? 'scale(1.12)' : 'scale(1)',
                  }}
                  onClick={() => setSelectedChar(ch.id)}
                >
                  <span style={{ fontSize: 28 }}>{ch.emoji}</span>
                  <span style={{ fontSize: 11, marginTop: 4 }}>{ch.label}</span>
                </button>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelBtn} onClick={() => setCreating(false)}>취소</button>
              <button type="submit" style={styles.confirmBtn}>만들기</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 20px 32px',
    background: 'var(--bg)',
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: 'var(--primary)',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-muted)',
    margin: '0 0 32px',
  },
  list: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    padding: '16px 20px',
    border: '2.5px solid transparent',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: 700 },
  cardSub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  deleteBtn: {
    background: 'none',
    color: '#ccc',
    fontSize: 16,
    padding: '4px 8px',
    borderRadius: 8,
    transition: 'color 0.2s',
  },
  addCard: {
    border: '2.5px dashed #c5cae9',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 24,
    background: 'transparent',
    boxShadow: 'none',
  },
  addIcon: { fontSize: 32, color: 'var(--primary)', fontWeight: 300 },
  addLabel: { fontSize: 14, color: 'var(--text-muted)', marginTop: 4 },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px 24px',
    width: '90%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700 },
  input: {
    border: '2px solid #e0e0e0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  charLabel: { margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' },
  charGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  charBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 4px',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s, background 0.15s',
    fontFamily: 'inherit',
  },
  modalActions: { display: 'flex', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: '10px', borderRadius: 10,
    background: '#f0f0f0', color: '#555', fontSize: 15, fontWeight: 600,
  },
  confirmBtn: {
    flex: 1, padding: '10px', borderRadius: 10,
    background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 600,
  },
};
