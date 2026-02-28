const fs = require('fs');
const path = require('path');

const RES_DIR = path.join(__dirname, '../res');
const OUT_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

function parseChapter(filePath, chapterId) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  const result = {
    id: chapterId,
    type: 'grammar',
    title: '',
    key_points: null,
    sentences: [],
    vocabulary: [],
    exam_tips: null,
  };

  // 제목 추출: "### Chapter NN. 제목" or "# **제목**"
  for (const line of lines) {
    const chapterTitle = line.match(/###\s+Chapter\s+\d+\.\s+(.+)/);
    if (chapterTitle) {
      result.title = chapterTitle[1].trim();
      break;
    }
    const boldTitle = line.match(/^#\s+\*\*(.+)\*\*/);
    if (boldTitle) {
      result.title = boldTitle[1].trim();
    }
  }

  // 섹션 분리
  let section = null;
  const sentenceLines = [];
  const vocabLines = [];
  const keyPointLines = [];
  const examTipLines = [];

  for (const line of lines) {
    if (/###\s+1\.\s+예문/.test(line)) { section = 'sentences'; continue; }
    if (/###\s+2\.\s+필수/.test(line)) { section = 'vocab'; continue; }
    if (/###\s+0\.\s+핵심/.test(line)) { section = 'keypoints'; continue; }
    if (/###\s+3\.\s+마무리/.test(line)) { section = 'examtips'; continue; }

    if (section === 'sentences') sentenceLines.push(line);
    else if (section === 'vocab') vocabLines.push(line);
    else if (section === 'keypoints') keyPointLines.push(line);
    else if (section === 'examtips') examTipLines.push(line);
  }

  // 예문 파싱
  result.sentences = parseSentences(sentenceLines);

  // 어휘 파싱
  result.vocabulary = parseVocab(vocabLines);

  // Key Points
  const kpText = keyPointLines.join('\n').trim();
  if (kpText) result.key_points = kpText;

  // Exam Tips
  const etText = examTipLines.join('\n').trim();
  if (etText) result.exam_tips = etText;

  return result;
}

function parseSentences(lines) {
  const sentences = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 번호로 시작하는 줄: "1. 한국어 문장"
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      const id = parseInt(numMatch[1]);
      const korean = numMatch[2]
        .replace(/\*\*/g, '')   // bold 제거
        .replace(/\(목적\)|\(원인\)|\(결과\)|\(명사-목적어\)|\(명사-보어\)|\(명사-주어\)|\(형용사\)|\(형용사-전치사 주의\)|\(주어\)|\(목적어\)|\(전치사의 목적어\)|\(관용 표현.*?\)/g, '')
        .trim();

      // 다음 줄에서 영어 문장 찾기
      let english = '';
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j].trim();
        if (next === '') { j++; continue; }
        // 영어 문장 줄 (알파벳으로 시작하거나 특수문자)
        if (/^[A-Za-z"'\(\[!\*]/.test(next)) {
          english = next;
          i = j;
          break;
        }
        break;
      }

      if (english) {
        // highlight 추출: **텍스트**
        const highlightMatch = english.match(/\*\*(.+?)\*\*/g);
        const highlight = highlightMatch
          ? highlightMatch.map(h => h.replace(/\*\*/g, '')).join(', ')
          : '';
        const cleanEnglish = english.replace(/\*\*/g, '').trim();

        sentences.push({ id, korean, english: cleanEnglish, highlight });
      }
    }
    i++;
  }

  return sentences;
}

function parseVocab(lines) {
  const vocab = [];
  for (const line of lines) {
    // 테이블 행: | 번호 | 영어 | 한국어 | (선택: 비고) |
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    if (/^[-:]+$/.test(cells[0])) continue; // 구분선
    if (cells[0] === '**번호**' || cells[0] === '번호') continue; // 헤더

    const num = parseInt(cells[0]);
    if (isNaN(num)) continue;

    const english = cells[1].replace(/\*\*/g, '').trim();
    const korean = cells[2].replace(/\*\*/g, '').trim();
    const note = cells[3] ? cells[3].replace(/\*\*/g, '').trim() : '';

    vocab.push({ english, korean, note });
  }
  return vocab;
}

// 실행
const files = fs.readdirSync(RES_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

let successCount = 0;
for (const file of files) {
  const match = file.match(/Chapter\s+(\d+)\.md/i);
  if (!match) continue;

  const chapterId = parseInt(match[1]);
  const filePath = path.join(RES_DIR, file);

  try {
    const data = parseChapter(filePath, chapterId);
    const outPath = path.join(OUT_DIR, `chapter_${String(chapterId).padStart(2, '0')}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ ${file} → chapter_${String(chapterId).padStart(2, '0')}.json (예문 ${data.sentences.length}개, 어휘 ${data.vocabulary.length}개)`);
    successCount++;
  } catch (e) {
    console.error(`❌ ${file}: ${e.message}`);
  }
}

console.log(`\n완료: ${successCount}/${files.length}개 챕터 변환`);
