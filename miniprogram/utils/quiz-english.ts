import type {
  ArcadeMode,
  ChoiceOption,
  EnglishChoiceQuestion,
  EnglishItem,
  EnglishQuizType,
  MatchPairQuestion,
  Question,
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

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function pickDistractors(pool: EnglishItem[], excludeId: string, count: number): EnglishItem[] {
  return shuffle(pool.filter((p) => p.id !== excludeId)).slice(0, count);
}

function toOptions(
  answerText: string,
  distractorTexts: string[],
): { options: ChoiceOption[]; answerId: string } {
  const answerId = 'ans';
  const options = shuffle([
    { id: answerId, text: answerText },
    ...distractorTexts.map((text, i) => ({ id: `d${i}`, text })),
  ]);
  return { options, answerId };
}

export function makeEnWordMean(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.meaning);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.meaning, distractors);
  return {
    id: uid('enwm'),
    type: 'enWordMean',
    itemId: item.id,
    prompt: `“${item.word}” 是什么意思？`,
    options,
    answerId,
  };
}

export function makeEnMeanWord(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.word);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.word, distractors);
  return {
    id: uid('enmw'),
    type: 'enMeanWord',
    itemId: item.id,
    prompt: `“${item.meaning}” 用英语怎么说？`,
    options,
    answerId,
  };
}

const LETTER_POOL = 'abcdefghijklmnopqrstuvwxyz';

export function makeEnSpell(item: EnglishItem): EnglishChoiceQuestion | null {
  const word = item.word.toLowerCase();
  if (word.length < 3) return null;
  const idx = Math.floor(Math.random() * word.length);
  const answer = word[idx];
  const blanked = `${word.slice(0, idx)}□${word.slice(idx + 1)}`;
  const set = new Set<string>([answer]);
  let guard = 0;
  while (set.size < 4 && guard < 30) {
    guard += 1;
    const ch = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    if (ch !== answer) set.add(ch);
  }
  const { options, answerId } = toOptions(
    answer,
    Array.from(set).filter((c) => c !== answer),
  );
  return {
    id: uid('ensp'),
    type: 'enSpell',
    itemId: item.id,
    prompt: `补全单词：${blanked}\n（${item.meaning}）`,
    options,
    answerId,
  };
}

export function makeEnMatch(pool: EnglishItem[]): MatchPairQuestion | null {
  if (pool.length < 3) return null;
  const picked = shuffle(pool).slice(0, Math.min(4, pool.length));
  const left = shuffle(
    picked.map((p) => ({ id: `L_${p.id}`, text: p.word })),
  );
  const right = shuffle(
    picked.map((p) => ({ id: `R_${p.id}`, text: p.meaning })),
  );
  const answerMap: Record<string, string> = {};
  picked.forEach((p) => {
    answerMap[`L_${p.id}`] = `R_${p.id}`;
  });
  return {
    id: uid('enmp'),
    type: 'matchPair',
    itemIds: picked.map((p) => p.id),
    left,
    right,
    answerMap,
  };
}

function makeByType(
  type: EnglishQuizType | 'matchPair',
  item: EnglishItem,
  pool: EnglishItem[],
): Question | null {
  if (type === 'enWordMean') return makeEnWordMean(item, pool);
  if (type === 'enMeanWord') return makeEnMeanWord(item, pool);
  if (type === 'enSpell') return makeEnSpell(item);
  if (type === 'matchPair') return makeEnMatch(pool);
  return null;
}

function preferredType(index: number): EnglishQuizType | 'matchPair' {
  const modes: Array<EnglishQuizType | 'matchPair'> = [
    'enWordMean',
    'enMeanWord',
    'enSpell',
    'matchPair',
  ];
  return modes[index % modes.length];
}

export function buildEnglishQuizForItem(
  item: EnglishItem,
  pool: EnglishItem[],
  count = 5,
): Question[] {
  const fullPool = pool.length ? pool : [item];
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < count && guard < count * 12) {
    guard += 1;
    const type = preferredType(questions.length);
    const q =
      type === 'matchPair'
        ? makeEnMatch(fullPool)
        : makeByType(type, item, fullPool);
    if (q) questions.push(q);
  }
  return questions;
}

export function buildEnglishArcadeQuiz(
  pool: EnglishItem[],
  mode: ArcadeMode,
  count = 8,
): Question[] {
  if (!pool.length) return [];
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < count && guard < count * 12) {
    guard += 1;
    const item = pool[Math.floor(Math.random() * pool.length)];
    let type: EnglishQuizType | 'matchPair';
    if (
      mode === 'enWordMean' ||
      mode === 'enMeanWord' ||
      mode === 'enSpell' ||
      mode === 'matchPair'
    ) {
      type = mode;
    } else if (mode === 'mixed' || mode === 'boss' || mode === 'daily') {
      type = preferredType(questions.length);
    } else {
      type = preferredType(questions.length);
    }
    const q = makeByType(type, item, pool);
    if (q) questions.push(q);
  }
  return questions;
}

export function buildEnglishBossQuiz(
  wrongPool: Array<{ itemId: string; quizType: string }>,
  pool: EnglishItem[],
  count = 8,
): Question[] {
  if (!pool.length || !wrongPool.length) return [];
  const byId = new Map(pool.map((p) => [p.id, p]));
  const questions: Question[] = [];
  let guard = 0;
  let cursor = 0;
  while (questions.length < count && guard < count * 15) {
    guard += 1;
    const hint = wrongPool[cursor % wrongPool.length];
    cursor += 1;
    const item = byId.get(hint.itemId) || pool[Math.floor(Math.random() * pool.length)];
    const type: EnglishQuizType | 'matchPair' =
      hint.quizType === 'enWordMean' ||
      hint.quizType === 'enMeanWord' ||
      hint.quizType === 'enSpell' ||
      hint.quizType === 'matchPair'
        ? hint.quizType
        : preferredType(questions.length);
    const q = makeByType(type, item, pool);
    if (q) questions.push(q);
  }
  return questions;
}

export function nextEnglishAdaptiveQuestion(
  pool: EnglishItem[],
  baseMode: ArcadeMode,
  ctx: { combo: number; lastCorrect: boolean; lastType?: string },
  wrongHints?: Array<{ itemId: string; quizType: string }>,
): Question | null {
  if (!pool.length) return null;
  let type: EnglishQuizType | 'matchPair' = 'enWordMean';
  if (
    !ctx.lastCorrect &&
    (ctx.lastType === 'enWordMean' ||
      ctx.lastType === 'enMeanWord' ||
      ctx.lastType === 'enSpell' ||
      ctx.lastType === 'matchPair')
  ) {
    type = ctx.lastType;
  } else if (ctx.combo >= 3) {
    type = shuffle(['enSpell', 'matchPair', 'enMeanWord'] as Array<EnglishQuizType | 'matchPair'>)[0];
  } else if (
    baseMode === 'enWordMean' ||
    baseMode === 'enMeanWord' ||
    baseMode === 'enSpell' ||
    baseMode === 'matchPair'
  ) {
    type = baseMode;
  } else {
    type = preferredType(Math.floor(Math.random() * 4));
  }

  let item = pool[Math.floor(Math.random() * pool.length)];
  if (wrongHints?.length && (!ctx.lastCorrect || baseMode === 'boss')) {
    const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
    const found = pool.find((p) => p.id === hint.itemId);
    if (found) item = found;
  }
  return makeByType(type, item, pool);
}

export const ENGLISH_ARCADE_MODE_LABELS: Partial<Record<ArcadeMode, string>> = {
  mixed: '英语混合挑战',
  enWordMean: '看词选义',
  enMeanWord: '看义选词',
  enSpell: '缺字母闯关',
  matchPair: '中英配对',
  boss: '错题 Boss',
  daily: '每日限时',
};
