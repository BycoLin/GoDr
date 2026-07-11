import type {
  ChoiceOption,
  FillNextQuestion,
  MatchPairQuestion,
  PoetryItem,
  Question,
  QuizType,
  TitleAuthorQuestion,
} from './types';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

/** 生成「选下一句」 */
export function makeFillNext(item: PoetryItem, pool: PoetryItem[]): FillNextQuestion | null {
  if (item.lines.length < 2) return null;
  const idx = Math.floor(Math.random() * (item.lines.length - 1));
  const prompt = item.lines[idx];
  const answer = item.lines[idx + 1];

  const distractors = pool
    .filter((p) => p.id !== item.id)
    .flatMap((p) => p.lines)
    .filter((line) => line !== answer && line !== prompt);

  const options: ChoiceOption[] = shuffle([
    { id: 'ans', text: answer },
    ...pickN(distractors, 3).map((text, i) => ({ id: `d${i}`, text })),
  ]);

  return {
    id: uid('fill'),
    type: 'fillNext',
    itemId: item.id,
    prompt: `「${prompt}」的下一句是？`,
    options,
    answerId: 'ans',
  };
}

/** 生成上下句配对（点选配对） */
export function makeMatchPair(pool: PoetryItem[], pairCount = 3): MatchPairQuestion | null {
  const candidates = pool.filter((p) => p.lines.length >= 2);
  if (candidates.length < 2) return null;

  const selected = pickN(candidates, Math.min(pairCount, candidates.length));
  const left: ChoiceOption[] = [];
  const right: ChoiceOption[] = [];
  const answerMap: Record<string, string> = {};

  selected.forEach((poem, i) => {
    const lineIdx = Math.floor(Math.random() * (poem.lines.length - 1));
    const leftId = `L${i}`;
    const rightId = `R${i}`;
    left.push({ id: leftId, text: poem.lines[lineIdx] });
    right.push({ id: rightId, text: poem.lines[lineIdx + 1] });
    answerMap[leftId] = rightId;
  });

  return {
    id: uid('match'),
    type: 'matchPair',
    itemIds: selected.map((p) => p.id),
    left: shuffle(left),
    right: shuffle(right),
    answerMap,
  };
}

/** 看诗句选诗名或作者；低年级默认诗名 */
export function makeTitleAuthor(
  item: PoetryItem,
  pool: PoetryItem[],
  mode: 'title' | 'author' = 'title',
): TitleAuthorQuestion | null {
  const line = item.lines[Math.floor(Math.random() * item.lines.length)];
  const answerText = mode === 'title' ? item.title : item.author;
  const answerId = 'ans';

  const distractorTexts = pool
    .filter((p) => p.id !== item.id)
    .map((p) => (mode === 'title' ? p.title : p.author))
    .filter((t) => t !== answerText);

  const unique = Array.from(new Set(distractorTexts));
  if (unique.length < 1) return null;

  const options = shuffle([
    { id: answerId, text: answerText },
    ...pickN(unique, 3).map((text, i) => ({ id: `d${i}`, text })),
  ]);

  return {
    id: uid('ta'),
    type: 'titleAuthor',
    itemId: item.id,
    mode,
    prompt: mode === 'title' ? `诗句「${line}」出自哪首诗？` : `诗句「${line}」的作者是？`,
    options,
    answerId,
  };
}

export interface BuildQuizOptions {
  count?: number;
  modes?: QuizType[];
  preferTitle?: boolean;
}

/** 围绕单篇诗词生成一局题目（混合题型） */
export function buildQuizForItem(
  item: PoetryItem,
  pool: PoetryItem[],
  options: BuildQuizOptions = {},
): Question[] {
  const count = options.count ?? 5;
  const modes = options.modes ?? ['fillNext', 'titleAuthor', 'matchPair'];
  const preferTitle = options.preferTitle !== false;
  const questions: Question[] = [];
  let guard = 0;

  while (questions.length < count && guard < count * 8) {
    guard += 1;
    const mode = modes[questions.length % modes.length];
    let q: Question | null = null;

    if (mode === 'fillNext') {
      q = makeFillNext(item, pool);
    } else if (mode === 'titleAuthor') {
      const modeTA: 'title' | 'author' =
        preferTitle || item.grade <= 1 ? 'title' : Math.random() < 0.7 ? 'title' : 'author';
      q = makeTitleAuthor(item, pool, modeTA);
    } else if (mode === 'matchPair') {
      // 配对用同年级池，保证干扰句来源一致
      q = makeMatchPair(pool.filter((p) => p.grade === item.grade), 3);
    }

    if (q) questions.push(q);
  }

  return questions;
}

/** 判题 */
export function gradeAnswer(
  question: Question,
  payload: string | Record<string, string>,
): boolean {
  if (question.type === 'fillNext' || question.type === 'titleAuthor') {
    return typeof payload === 'string' && payload === question.answerId;
  }
  if (question.type === 'matchPair') {
    if (typeof payload !== 'object' || !payload) return false;
    const map = question.answerMap;
    const keys = Object.keys(map);
    return keys.every((k) => payload[k] === map[k]);
  }
  return false;
}

export function starsFromScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.8) return 2;
  if (ratio >= 0.6) return 1;
  return 0;
}
