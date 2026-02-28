const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/learning.db');
const db = new Database(DB_PATH);

// WAL 모드: 성능 향상
db.pragma('journal_mode = WAL');

// 스키마 생성
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    character  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (date('now'))
  );

  CREATE TABLE IF NOT EXISTS chapter_progress (
    profile_id      TEXT NOT NULL,
    chapter_id      INTEGER NOT NULL,
    study_count     INTEGER NOT NULL DEFAULT 0,
    last_studied    TEXT,
    review_round    INTEGER NOT NULL DEFAULT 0,
    next_review_date TEXT,
    completed       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (profile_id, chapter_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS test_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL,
    chapter_id INTEGER NOT NULL,
    date       TEXT NOT NULL,
    score      INTEGER NOT NULL,
    round      INTEGER NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );
`);

// 간격 반복 스케줄 (일)
const REVIEW_SCHEDULE = [7, 14, 28, 84];

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Profiles ──────────────────────────────────────────────
const Profiles = {
  getAll: db.prepare('SELECT * FROM profiles ORDER BY created_at'),
  getById: db.prepare('SELECT * FROM profiles WHERE id = ?'),
  create: db.prepare('INSERT INTO profiles (id, name, character) VALUES (?, ?, ?)'),
  delete: db.prepare('DELETE FROM profiles WHERE id = ?'),
};

// ── Progress ──────────────────────────────────────────────
const Progress = {
  get: db.prepare(`
    SELECT cp.*, json_group_array(
      json_object('date', th.date, 'score', th.score, 'round', th.round)
    ) as test_history
    FROM chapter_progress cp
    LEFT JOIN test_history th ON th.profile_id = cp.profile_id AND th.chapter_id = cp.chapter_id
    WHERE cp.profile_id = ? AND cp.chapter_id = ?
    GROUP BY cp.profile_id, cp.chapter_id
  `),

  getAll: db.prepare(`
    SELECT cp.*, json_group_array(
      json_object('date', th.date, 'score', th.score, 'round', th.round)
    ) as test_history
    FROM chapter_progress cp
    LEFT JOIN test_history th ON th.profile_id = cp.profile_id AND th.chapter_id = cp.chapter_id
    WHERE cp.profile_id = ?
    GROUP BY cp.profile_id, cp.chapter_id
  `),

  upsert: db.prepare(`
    INSERT INTO chapter_progress (profile_id, chapter_id, study_count, last_studied)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(profile_id, chapter_id) DO UPDATE SET
      study_count  = study_count + 1,
      last_studied = excluded.last_studied
  `),

  updateReview: db.prepare(`
    UPDATE chapter_progress
    SET review_round = ?, next_review_date = ?, completed = ?
    WHERE profile_id = ? AND chapter_id = ?
  `),

  insertTest: db.prepare(`
    INSERT INTO test_history (profile_id, chapter_id, date, score, round)
    VALUES (?, ?, ?, ?, ?)
  `),
};

// ── Public API ────────────────────────────────────────────
module.exports = {
  getAllProfiles() {
    return Profiles.getAll.all();
  },

  createProfile(id, name, character) {
    Profiles.create.run(id, name, character);
    return Profiles.getById.get(id);
  },

  deleteProfile(id) {
    Profiles.delete.run(id);
  },

  recordStudy(profileId, chapterId) {
    Progress.upsert.run(profileId, chapterId, today());
  },

  recordTest(profileId, chapterId, score) {
    const row = Progress.get.get(profileId, chapterId);
    const round = (row?.review_round ?? 0) + 1;
    const completed = round > REVIEW_SCHEDULE.length ? 1 : 0;
    const nextDate = completed ? null : addDays(REVIEW_SCHEDULE[round - 1]);

    Progress.insertTest.run(profileId, chapterId, today(), score, round);
    Progress.updateReview.run(round, nextDate, completed, profileId, chapterId);
  },

  getProgress(profileId, chapterId) {
    const row = Progress.get.get(profileId, chapterId);
    if (!row) return null;
    return { ...row, test_history: JSON.parse(row.test_history).filter(t => t.date) };
  },

  getAllProgress(profileId) {
    const rows = Progress.getAll.all(profileId);
    return rows.map(r => ({ ...r, test_history: JSON.parse(r.test_history).filter(t => t.date) }));
  },

  getChapterStatus(profileId, chapterId) {
    const row = Progress.get.get(profileId, chapterId);
    if (!row || row.study_count === 0) return 'locked';
    if (row.completed) return 'completed';
    if (row.next_review_date && row.next_review_date <= today()) return 'review';
    return 'inprogress';
  },
};
