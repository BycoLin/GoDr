import type {
  ArcadeMode,
  ChoiceOption,
  FillBlankQuestion,
  FillNextQuestion,
  MatchPairQuestion,
  OrderLinesQuestion,
  PoetryItem,
  Question,
  QuizType,
  TitleAuthorQuestion,
} from './types';
import {
  buildTypeSchedule,
  pickItemsForSession,
  registerQuestion,
  shuffle as sessionShuffle,
} from './quiz-session';

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

const PLACEHOLDER_LINE = /^第[一二三四五六七八九十\d]+句$/;
const META_AUTHORS = new Set(['积累', '课文', '识字', '童谣', '文言文', '佚名', '北朝民歌']);

function quizLines(item: PoetryItem): string[] {
  return item.lines.filter((l) => l && !PLACEHOLDER_LINE.test(l.trim()) && l.trim().length >= 2);
}

function isRealAuthor(author: string): boolean {
  return Boolean(author && author.length >= 2 && !META_AUTHORS.has(author));
}

/** 生成「选下一句」 */
export function makeFillNext(item: PoetryItem, pool: PoetryItem[]): FillNextQuestion | null {
  const lines = quizLines(item);
  if (lines.length < 2) return null;
  const idx = Math.floor(Math.random() * (lines.length - 1));
  const prompt = lines[idx];
  const answer = lines[idx + 1];

  const distractors = pool
    .filter((p) => p.id !== item.id)
    .flatMap((p) => quizLines(p))
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
  return buildMatchPairFromPoems(selected);
}

/** 错题复习：配对题必须包含指定篇目 */
export function makeMatchPairForItem(
  item: PoetryItem,
  pool: PoetryItem[],
  pairCount = 3,
): MatchPairQuestion | null {
  const gradePool = pool.filter((p) => p.grade === item.grade && p.lines.length >= 2);
  if (!gradePool.some((p) => p.id === item.id)) return null;
  const others = gradePool.filter((p) => p.id !== item.id);
  const selected = [
    item,
    ...pickN(others, Math.min(pairCount - 1, others.length)),
  ];
  return buildMatchPairFromPoems(selected);
}

function buildMatchPairFromPoems(selected: PoetryItem[]): MatchPairQuestion | null {
  if (selected.length < 2) return null;
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
  const lines = quizLines(item);
  if (!lines.length) return null;
  const line = lines[Math.floor(Math.random() * lines.length)];
  const useAuthor = mode === 'author' && isRealAuthor(item.author);
  const quizMode: 'title' | 'author' = useAuthor ? 'author' : 'title';
  const answerText = quizMode === 'title' ? item.title : item.author;
  const answerId = 'ans';

  const distractorTexts = pool
    .filter((p) => p.id !== item.id)
    .map((p) => (quizMode === 'title' ? p.title : p.author))
    .filter((t) => t && t !== answerText && (quizMode === 'title' || isRealAuthor(t)));

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
    mode: quizMode,
    prompt: quizMode === 'title' ? `诗句「${line}」出自哪首诗？` : `诗句「${line}」的作者是？`,
    options,
    answerId,
  };
}

/** 打乱诗句，按顺序点选还原 */
export function makeOrderLines(item: PoetryItem): OrderLinesQuestion | null {
  if (item.lines.length < 2) return null;
  const lines = item.lines.slice(0, Math.min(item.lines.length, 6));
  const options: ChoiceOption[] = lines.map((text, i) => ({ id: `L${i}`, text }));
  const answerOrder = options.map((o) => o.id);
  let shuffled = shuffle(options);
  // 避免偶尔打乱后仍完全正确
  let guard = 0;
  while (shuffled.every((o, i) => o.id === answerOrder[i]) && guard < 8) {
    shuffled = shuffle(options);
    guard += 1;
  }

  return {
    id: uid('order'),
    type: 'orderLines',
    itemId: item.id,
    prompt: `把《${item.title}》的诗句排成正确顺序`,
    options: shuffled,
    answerOrder,
  };
}

/** 缺一字填空 */
export function makeFillBlank(item: PoetryItem, pool: PoetryItem[]): FillBlankQuestion | null {
  const candidates = quizLines(item).filter((line) => line.length >= 2);
  if (!candidates.length) return null;
  const line = candidates[Math.floor(Math.random() * candidates.length)];
  const blankIdx = Math.floor(Math.random() * line.length);
  const answerChar = line[blankIdx];
  const promptLine = `${line.slice(0, blankIdx)}＿${line.slice(blankIdx + 1)}`;

  const charPool = pool
    .flatMap((p) => p.lines.join('').split(''))
    .filter((ch) => ch && ch !== answerChar && !/\s/.test(ch));
  const unique = Array.from(new Set(charPool));
  if (unique.length < 1) return null;

  const options = shuffle([
    { id: 'ans', text: answerChar },
    ...pickN(unique, 3).map((text, i) => ({ id: `d${i}`, text })),
  ]);

  return {
    id: uid('blank'),
    type: 'fillBlank',
    itemId: item.id,
    prompt: `补上缺字：${promptLine}`,
    options,
    answerId: 'ans',
  };
}

export interface BuildQuizOptions {
  count?: number;
  modes?: QuizType[];
  preferTitle?: boolean;
  /** 中段偏难：后半程优先难题型 */
  rampHard?: boolean;
}

export interface AdaptiveContext {
  combo: number;
  lastCorrect: boolean;
  lastType?: QuizType;
  preferModes?: QuizType[];
}

const HARD_MODES: QuizType[] = ['orderLines', 'fillBlank', 'matchPair'];
const EASY_MODES: QuizType[] = ['fillNext', 'titleAuthor'];

function makeByType(
  mode: QuizType,
  item: PoetryItem,
  pool: PoetryItem[],
  preferTitle: boolean,
): Question | null {
  if (mode === 'fillNext') return makeFillNext(item, pool);
  if (mode === 'titleAuthor') {
    const modeTA: 'title' | 'author' =
      preferTitle || item.grade <= 1 ? 'title' : Math.random() < 0.7 ? 'title' : 'author';
    return makeTitleAuthor(item, pool, modeTA);
  }
  if (mode === 'matchPair') {
    return makeMatchPairForItem(item, pool.filter((p) => p.grade === item.grade), 3);
  }
  if (mode === 'orderLines') return makeOrderLines(item);
  if (mode === 'fillBlank') return makeFillBlank(item, pool);
  return null;
}

function resolvePreferModes(ctx: AdaptiveContext, baseMode: ArcadeMode): QuizType[] {
  if (ctx.preferModes?.length) return ctx.preferModes;
  if (!ctx.lastCorrect && ctx.lastType) return [ctx.lastType];
  if (ctx.combo >= 3) return HARD_MODES;
  if (
    baseMode === 'mixed' ||
    baseMode === 'boss' ||
    baseMode === 'daily' ||
    baseMode === 'duel' ||
    baseMode === 'sprint' ||
    baseMode === 'exam'
  ) {
    return [...EASY_MODES, ...HARD_MODES];
  }
  if (baseMode === 'fillNext' || baseMode === 'matchPair' || baseMode === 'titleAuthor' || baseMode === 'orderLines' || baseMode === 'fillBlank') {
    return [baseMode];
  }
  return [...EASY_MODES, ...HARD_MODES];
}

/** 围绕单篇诗词生成一局题目（混合题型，可中段偏难） */
export function buildQuizForItem(
  item: PoetryItem,
  pool: PoetryItem[],
  options: BuildQuizOptions = {},
): Question[] {
  const count = options.count ?? 8;
  const preferTitle = options.preferTitle !== false;
  const rampHard = options.rampHard !== false;
  const easyFirst: QuizType[] = ['fillNext', 'titleAuthor', 'matchPair', 'orderLines', 'fillBlank'];
  const modePool = options.modes?.length ? options.modes : easyFirst;
  const typeSchedule = buildTypeSchedule(
    rampHard
      ? [...modePool, ...HARD_MODES]
      : modePool,
    count * 2,
  );
  const usedKeys = new Set<string>();
  const questions: Question[] = [];
  let guard = 0;

  while (questions.length < count && guard < count * 20) {
    guard += 1;
    const mode = typeSchedule[guard % typeSchedule.length];
    const q = makeByType(mode, item, pool, preferTitle);
    if (q && registerQuestion(usedKeys, q)) questions.push(q);
  }

  return questions;
}

/** 游戏厅：按专项玩法从年级题库抽题 */
export function buildArcadeQuiz(
  pool: PoetryItem[],
  mode: ArcadeMode,
  count = 8,
  preferModes?: QuizType[],
  usedKeys?: Set<string>,
): Question[] {
  if (!pool.length) return [];
  const preferTitle = pool[0].grade <= 1;
  const keys = usedKeys ?? new Set<string>();
  const mixedTypes: QuizType[] = ['fillNext', 'titleAuthor', 'matchPair', 'orderLines', 'fillBlank'];
  const typeSchedule = preferModes?.length
    ? buildTypeSchedule(preferModes, count * 2)
    : mode === 'mixed' ||
        mode === 'boss' ||
        mode === 'daily' ||
        mode === 'duel' ||
        mode === 'sprint' ||
        mode === 'exam' ||
        mode === 'unit'
      ? buildTypeSchedule(mixedTypes, count * 2)
      : buildTypeSchedule([mode], count * 2);
  const itemOrder = pickItemsForSession(pool, count * 2);
  const questions: Question[] = [];
  let guard = 0;
  let itemCursor = 0;

  while (questions.length < count && guard < count * 24) {
    guard += 1;
    const item = itemOrder[itemCursor % itemOrder.length] || pool[guard % pool.length];
    itemCursor += 1;
    const quizType = typeSchedule[guard % typeSchedule.length];
    const q = makeByType(quizType, item, pool, preferTitle);
    if (q && registerQuestion(keys, q)) questions.push(q);
  }

  return questions;
}

export interface WrongHint {
  itemId: string;
  quizType: QuizType;
}

/** 错题 Boss：每道错题对应一题，沿用原题型 */
export function buildBossQuiz(
  wrongPool: WrongHint[],
  pool: PoetryItem[],
): Question[] {
  if (!pool.length || !wrongPool.length) return [];
  const preferTitle = pool[0].grade <= 1;
  const byId = new Map(pool.map((p) => [p.id, p]));
  const questions: Question[] = [];

  for (const hint of wrongPool) {
    const item = byId.get(hint.itemId);
    if (!item) continue;
    const q = makeByType(hint.quizType, item, pool, preferTitle);
    if (q) questions.push(q);
  }

  return questions;
}

/** 滚动出题：根据连击/对错生成下一题 */
export function nextAdaptiveQuestion(
  pool: PoetryItem[],
  baseMode: ArcadeMode,
  ctx: AdaptiveContext,
  wrongHints?: WrongHint[],
  usedKeys?: Set<string>,
): Question | null {
  if (!pool.length) return null;
  if (baseMode === 'boss' && !wrongHints?.length) return null;
  const preferTitle = pool[0].grade <= 1;
  const modes = resolvePreferModes(ctx, baseMode);
  const keys = usedKeys ?? new Set<string>();
  const itemOrder = sessionShuffle(pool);
  let guard = 0;
  let itemCursor = 0;

  while (guard < 24) {
    guard += 1;
    const quizType = modes[Math.floor(Math.random() * modes.length)];
    let item = itemOrder[itemCursor % itemOrder.length];
    itemCursor += 1;
    if (wrongHints?.length && (baseMode === 'boss' || !ctx.lastCorrect)) {
      const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
      const found = pool.find((p) => p.id === hint.itemId);
      if (found) {
        const q = makeByType(hint.quizType, found, pool, preferTitle);
        if (q && registerQuestion(keys, q)) return q;
      }
      if (baseMode === 'boss') continue;
    }
    const q = makeByType(quizType, item, pool, preferTitle);
    if (q && registerQuestion(keys, q)) return q;
  }
  return null;
}

/** 判题 */
export function gradeAnswer(
  question: Question,
  payload: string | string[] | Record<string, string>,
): boolean {
  if (question.type === 'mathVisual') {
    if (question.op === 'compare') {
      return typeof payload === 'string' && payload === question.compareAnswer;
    }
    return typeof payload === 'string' && Number(payload) === question.answer;
  }
  if (question.type === 'mathSequence') {
    if (!Array.isArray(payload)) return false;
    if (payload.length !== question.answers.length) return false;
    return question.answers.every((ans, i) => Number(payload[i]) === ans);
  }
  if (
    question.type === 'fillNext' ||
    question.type === 'titleAuthor' ||
    question.type === 'fillBlank' ||
    question.type === 'mathCalc' ||
    question.type === 'mathCompare' ||
    question.type === 'mathMissing' ||
    question.type === 'mathMakeTen' ||
    question.type === 'mathBreakTen' ||
    question.type === 'mathFlatTen' ||
    question.type === 'mathBorrowTen' ||
    question.type === 'enWordMean' ||
    question.type === 'enMeanWord' ||
    question.type === 'enSpell'
  ) {
    return typeof payload === 'string' && payload === question.answerId;
  }
  if (question.type === 'matchPair') {
    if (typeof payload !== 'object' || !payload || Array.isArray(payload)) return false;
    const map = question.answerMap;
    const keys = Object.keys(map);
    return keys.every((k) => payload[k] === map[k]);
  }
  if (question.type === 'orderLines') {
    if (!Array.isArray(payload)) return false;
    const expected = question.answerOrder;
    return (
      payload.length === expected.length && payload.every((id, i) => id === expected[i])
    );
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

export function questionItemId(question: Question): string {
  if (question.type === 'matchPair') return question.itemIds[0] || '';
  return question.itemId;
}

export const ARCADE_MODE_LABELS: Record<ArcadeMode, string> = {
  mixed: '综合自测',
  fillNext: '下一句练习',
  matchPair: '配对练习',
  titleAuthor: '诗名作者',
  orderLines: '诗句排序',
  fillBlank: '缺字填空',
  mathCalc: '口算练习',
  mathVisual: '看图口算',
  mathSequence: '数字排队',
  mathCompare: '比大小',
  mathMissing: '算式填空',
  mathMakeTen: '凑十法',
  mathBreakTen: '破十法',
  mathFlatTen: '平十法',
  mathBorrowTen: '借十法',
  enWordMean: '看词选义',
  enMeanWord: '看义选词',
  enSpell: '缺字母练习',
  boss: '错题复习',
  daily: '每日自测',
  duel: '趣味对练',
  sprint: '限时冲刺',
  exam: '模拟小测',
  unit: '单元测验',
};
