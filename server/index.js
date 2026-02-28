require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GOOGLE_TTS_API_KEY;
const DATA_DIR = path.join(__dirname, '../data');

app.use(cors());
app.use(express.json());

// TTS 캐시 (메모리)
const ttsCache = new Map();

// POST /api/tts
app.post('/api/tts', async (req, res) => {
  const { text, slow = false } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' });

  const cacheKey = `${text}|${slow}`;
  if (ttsCache.has(cacheKey)) {
    return res.json({ audioContent: ttsCache.get(cacheKey) });
  }

  const payload = JSON.stringify({
    input: { text },
    voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: slow ? 0.7 : 0.9,
    },
  });

  const options = {
    hostname: 'texttospeech.googleapis.com',
    path: `/v1/text:synthesize?key=${API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          return res.status(400).json({ error: parsed.error.message });
        }
        ttsCache.set(cacheKey, parsed.audioContent);
        res.json({ audioContent: parsed.audioContent });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse TTS response' });
      }
    });
  });

  request.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  request.write(payload);
  request.end();
});

// GET /api/chapters — 목록
app.get('/api/chapters', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('chapter_') && f.endsWith('.json'))
      .sort();

    const chapters = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      return {
        id: data.id,
        type: data.type,
        title: data.title,
        sentenceCount: data.sentences.length,
      };
    });

    res.json(chapters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Profiles ──────────────────────────────────────────────

// GET /api/profiles
app.get('/api/profiles', (req, res) => {
  res.json(db.getAllProfiles());
});

// POST /api/profiles
app.post('/api/profiles', (req, res) => {
  const { name, character } = req.body;
  if (!name || !character) return res.status(400).json({ error: 'name and character required' });
  const id = crypto.randomUUID();
  res.json(db.createProfile(id, name, character));
});

// DELETE /api/profiles/:id
app.delete('/api/profiles/:id', (req, res) => {
  db.deleteProfile(req.params.id);
  res.json({ ok: true });
});

// ── Progress ──────────────────────────────────────────────

// GET /api/progress/:profileId — 전체 챕터 진행도
app.get('/api/progress/:profileId', (req, res) => {
  res.json(db.getAllProgress(req.params.profileId));
});

// GET /api/progress/:profileId/:chapterId — 챕터 전체 진행 데이터
app.get('/api/progress/:profileId/:chapterId', (req, res) => {
  const { profileId, chapterId } = req.params;
  const progress = db.getProgress(profileId, parseInt(chapterId));
  res.json(progress || null);
});

// GET /api/progress/:profileId/:chapterId/status
app.get('/api/progress/:profileId/:chapterId/status', (req, res) => {
  const { profileId, chapterId } = req.params;
  res.json({ status: db.getChapterStatus(profileId, parseInt(chapterId)) });
});

// POST /api/progress/:profileId/:chapterId/study
app.post('/api/progress/:profileId/:chapterId/study', (req, res) => {
  const { profileId, chapterId } = req.params;
  db.recordStudy(profileId, parseInt(chapterId));
  res.json({ ok: true });
});

// POST /api/progress/:profileId/:chapterId/test
app.post('/api/progress/:profileId/:chapterId/test', (req, res) => {
  const { profileId, chapterId } = req.params;
  const { score } = req.body;
  if (score === undefined) return res.status(400).json({ error: 'score required' });
  db.recordTest(profileId, parseInt(chapterId), score);
  res.json({ ok: true });
});

// GET /api/chapters/:id — 챕터 전체
app.get('/api/chapters/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const filePath = path.join(DATA_DIR, `chapter_${String(id).padStart(2, '0')}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Chapter not found' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 프로덕션: React 빌드 파일 서빙
const CLIENT_DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // React Router 지원 (새로고침해도 index.html 반환)
  app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  if (fs.existsSync(CLIENT_DIST)) {
    console.log(`   앱 주소: http://localhost:${PORT}`);
  }
  if (!API_KEY) console.warn('⚠️  GOOGLE_TTS_API_KEY가 설정되지 않았습니다 (.env 확인)');
});
