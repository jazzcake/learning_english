# 영어 학습 앱

중학교 2-3학년 대상 로컬 웹 기반 영어 학습 앱.

---

## 교육 방식

**한국어(영어 어순) → 영어 떠올리기 → 탭으로 확인 → TTS 반복 청취**

- 한국어 문장을 영어 어순(끊어읽기)으로 제시
- 학생이 영어를 머릿속으로 떠올린 후 탭으로 영어 확인
- 영어 확인 즉시 Google TTS 자동 재생
- 다시 듣기 / 느리게(0.7x) 버튼으로 반복 청취 지원
- 간격 반복(Spaced Repetition) 스케줄로 장기 기억 유도

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| TTS | Google Cloud Text-to-Speech (`en-US-Journey-F`) |
| 데이터 저장 | `data/learning.db` |

---

## 프로젝트 구조

```
learning_english/
├── res/                        # 원본 마크다운 챕터 파일
│   ├── Chapter 01.md
│   └── ...
├── data/                       # 변환된 JSON + SQLite DB
│   ├── chapter_01.json
│   ├── chapter_02.json
│   └── learning.db             # 프로필 및 진행도 데이터
├── scripts/
│   └── md_to_json.js           # 마크다운 → JSON 변환 스크립트
├── server/
│   ├── index.js                # Express 서버
│   ├── db.js                   # SQLite 스키마 및 쿼리
│   ├── package.json
│   └── .env                    # API 키 (git 제외)
├── client/                     # React 앱 (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── ProfileSelect.jsx   # 프로필 선택/생성
│   │   │   ├── Home.jsx            # 챕터 그리드
│   │   │   ├── Chapter.jsx         # 예문 학습
│   │   │   └── TestMenu.jsx        # 시험 메뉴 (준비 중)
│   │   ├── components/
│   │   │   ├── SentenceCard.jsx    # 예문 카드 (핵심 학습 UI)
│   │   │   ├── AudioPlayer.jsx     # TTS 재생 컨트롤
│   │   │   ├── VocabSection.jsx    # 어휘 테이블
│   │   │   └── ExamTips.jsx        # 핵심 요약 / 시험 포인트
│   │   └── store/
│   │       └── progress.js         # API 호출 래퍼
│   └── dist/                   # 빌드 결과물 (배포 시 생성)
├── start.bat                   # 로컬 실행 스크립트
├── make_deploy.bat             # 배포 패키지 생성 스크립트
├── package.json
└── .gitignore
```

---

## 설치 및 실행

### 사전 요건
- [Node.js](https://nodejs.org) 18 이상

### 최초 설치

```bash
cd server && npm install
cd ../client && npm install
```

### API 키 설정

`server/.env` 파일:

```
GOOGLE_TTS_API_KEY=여기에_키_입력
PORT=3001
```

### 개발 모드

터미널 2개:

```bash
# 터미널 1
cd server && node index.js

# 터미널 2
cd client && npm run dev
```

브라우저: `http://localhost:5173`

### 프로덕션 모드

```bash
npm run build          # React 빌드
cd server && node index.js
```

브라우저: `http://localhost:3001`

---

## 챕터 데이터 추가

1. `res/` 폴더에 `Chapter NN.md` 형식으로 파일 추가
2. 변환 실행:
   ```bash
   node scripts/md_to_json.js
   ```

### 마크다운 파일 형식

```markdown
# Chapter NN

### Chapter NN. 챕터 제목

### 0. 핵심 요약 (Key Points)        ← 선택 사항

### 1. 예문 연습 (Sentence Practice)

1. 한국어 / 끊어 / 읽기
    영어 문장 / **핵심 파트 볼드**.

### 2. 필수 어휘 및 표현 (Vocabulary & Expressions)

| 번호 | 표현 (English) | 의미 (Korean) | 비고 |
| --- | --- | --- | --- |
| 1 | word | 뜻 | 메모 |

### 3. 마무리 포인트 (Exam Tips)      ← 선택 사항
```

**챕터 타입:**
- `grammar` — 문법 주제 중심, 예문 30개
- `vocab` — 단어 기준, 예문 50개 (추후 추가 예정)

---

## 데이터베이스

파일 위치: `data/learning.db`

```
profiles          id, name, character, created_at
chapter_progress  profile_id, chapter_id, study_count, last_studied,
                  review_round, next_review_date, completed
test_history      id, profile_id, chapter_id, date, score, round
```

---

## API 엔드포인트

### TTS
| Method | Path | Body / 응답 |
|--------|------|------------|
| POST | `/api/tts` | `{ text, slow }` → `{ audioContent }` (base64 MP3) |

### 챕터
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/chapters` | 챕터 목록 |
| GET | `/api/chapters/:id` | 챕터 전체 데이터 |

### 프로필
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/profiles` | 전체 프로필 목록 |
| POST | `/api/profiles` | `{ name, character }` → 프로필 생성 |
| DELETE | `/api/profiles/:id` | 프로필 삭제 |

### 진행도
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/progress/:profileId` | 전체 챕터 진행도 |
| GET | `/api/progress/:profileId/:chapterId/status` | 챕터 상태 반환 |
| POST | `/api/progress/:profileId/:chapterId/study` | 학습 횟수 기록 |
| POST | `/api/progress/:profileId/:chapterId/test` | `{ score }` → 시험 기록 |

---

## 간격 반복 스케줄

| 회차 | 시험 통과 후 다음 복습까지 |
|------|--------------------------|
| 1차  | 7일 후 |
| 2차  | 14일 후 |
| 3차  | 28일 후 |
| 4차  | 84일 후 |
| 5차  | ✅ 완료 |

챕터 상태 배지:
- ✅ `completed` — 전체 스케줄 이수
- ⏰ `review` — 복습 날짜 도달
- 📖 `inprogress` — 학습 이력 있음
- 🔒 `locked` — 미시작

---

## 배포

### 로컬 배포 (아이 노트북)

```
make_deploy.bat 실행
  → deploy/ 폴더 자동 생성 (빌드 포함)
  → deploy/ 폴더를 노트북에 복사
  → start.bat 더블클릭
  → 브라우저 http://localhost:3001 자동 오픈
```

배포 폴더 구성:
```
deploy/
├── data/           챕터 JSON + learning.db
├── server/         index.js, db.js, package.json, .env
├── client/dist/    빌드된 React 앱
└── start.bat
```

### 클라우드 배포 (Railway)

1. GitHub에 프로젝트 push (`.env`는 `.gitignore`로 제외)
2. [railway.app](https://railway.app) → GitHub 레포 연결
3. 환경변수: `GOOGLE_TTS_API_KEY` 설정
4. 빌드: `npm run build` / 시작: `npm start`

---

## TTS 설정

| 항목 | 값 |
|------|----|
| 음성 | `en-US-Journey-F` |
| 일반 속도 | 0.9x |
| 느린 속도 | 0.7x |
| 포맷 | MP3 |
| 캐싱 | 서버 메모리 (동일 요청 재호출 방지) |
