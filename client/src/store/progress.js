// Active profile ID: localStorage only (UI state)
// All data: SQLite via server API

const ACTIVE_KEY = 'english_app_active_profile';

export function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

// ── Profiles ──────────────────────────────────────────────

export async function getProfiles() {
  const res = await fetch('/api/profiles');
  return res.json();
}

export async function createProfile(name, character) {
  const res = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, character }),
  });
  const profile = await res.json();
  setActiveProfileId(profile.id);
  return profile;
}

export async function deleteProfile(id) {
  await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

// ── Progress ──────────────────────────────────────────────

export async function getAllProgress(profileId) {
  const res = await fetch(`/api/progress/${profileId}`);
  return res.json();
}

export async function getChapterProgress(profileId, chapterId) {
  const res = await fetch(`/api/progress/${profileId}/${chapterId}`);
  return res.json();
}

export async function recordStudy(profileId, chapterId) {
  await fetch(`/api/progress/${profileId}/${chapterId}/study`, { method: 'POST' });
}

export async function recordTest(profileId, chapterId, score) {
  await fetch(`/api/progress/${profileId}/${chapterId}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score }),
  });
}

export async function getChapterStatus(profileId, chapterId) {
  const res = await fetch(`/api/progress/${profileId}/${chapterId}/status`);
  const data = await res.json();
  return data.status;
}
