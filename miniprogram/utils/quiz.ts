import type {
  ArcadeMode,
  ChoiceOption,
  FillBlankQuestion,
  FillNextQuestion,
  MatchPairQuestion,
  OrderLinesQuestion,
  PoetryItem,
  PoetryPictureQuestion,
  PoetryQuizType,
  Question,
  QuizType,
  SimilarCharQuestion,
  TitleAuthorQuestion,
} from './types';
import {
  buildTypeSchedule,
  pickItemsForSession,
  registerQuestion,
  shuffle as sessionShuffle,
} from './quiz-session';
import {
  isAccumulationItem,
  isCoupletAccumulationItem,
  isClassicalProseItem,
  isMythStoryItem,
  isNarrativeItem,
} from './poetry-games';
import {
  buildPoetryEnrichPool,
  levelEnrichCount,
  mergeInterleavedQuestions,
  planPoetryLevelEnrich,
} from './level-enrich';
import { pickSimilarWrong, similarCharDrillsForGrade, similarCharsFor, type SimilarCharDrill } from './similar-chars';
import { hasPoetryPicture, poetryEmojiFor } from './poetry-pictures';

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

/** 猜诗名/篇名：去掉与标题完全相同的行，避免「拔萝卜→拔萝卜」送分题 */
function quizLinesForTitleAuthor(item: PoetryItem): string[] {
  const lines = quizLines(item);
  const title = item.title.trim();
  const withoutTitle = lines.filter((l) => l.trim() !== title);
  if (withoutTitle.length) return withoutTitle;
  const longer = lines.filter((l) => l.trim().length > title.length);
  return longer.length ? longer : lines;
}

function isRealAuthor(author: string): boolean {
  return Boolean(author && author.length >= 2 && !META_AUTHORS.has(author));
}

/** 生成「选下一句」；lineIdx 指定从哪一句起接龙，专项练轮播用 */
export function makeFillNext(
  item: PoetryItem,
  pool: PoetryItem[],
  lineIdx?: number,
): FillNextQuestion | null {
  const lines = quizLines(item);
  if (lines.length < 2) return null;
  const maxIdx = lines.length - 2;
  const idx =
    lineIdx === undefined
      ? Math.floor(Math.random() * (maxIdx + 1))
      : ((lineIdx % (maxIdx + 1)) + maxIdx + 1) % (maxIdx + 1);
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
    sourceTitle: item.title,
    prompt: `「${prompt}」的下一句是？`,
    options,
    answerId: 'ans',
  };
}

/** 专项「下一句」：按篇目×句位轮播，保证多首诗都能轮到 */
function buildDedicatedFillNextQuiz(
  pool: PoetryItem[],
  count: number,
  keys: Set<string>,
): Question[] {
  const slots: Array<{ item: PoetryItem; lineIdx: number }> = [];
  shuffle(pool).forEach((item) => {
    const lines = quizLines(item);
    for (let i = 0; i < lines.length - 1; i += 1) {
      slots.push({ item, lineIdx: i });
    }
  });
  if (!slots.length) return [];

  shuffle(slots);
  const questions: Question[] = [];
  let slotCursor = 0;
  let guard = 0;
  const maxGuard = count * 32;
  let allowRepeat = false;

  while (questions.length < count && guard < maxGuard) {
    guard += 1;
    const slot = slots[slotCursor % slots.length];
    slotCursor += 1;
    const q = makeFillNext(slot.item, pool, slot.lineIdx);
    if (!q) continue;
    if (registerQuestion(keys, q)) {
      questions.push(q);
      continue;
    }
    if (questions.length > 0 && guard > count * 2) allowRepeat = true;
    if (allowRepeat) questions.push(q);
  }
  return questions;
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
  if (isAccumulationItem(item) || gradePool.every(isAccumulationItem)) {
    const coupletPool = gradePool.filter(isCoupletAccumulationItem);
    const source = coupletPool.length ? coupletPool : gradePool.filter(isAccumulationItem);
    if (source.length) return buildMatchPairFromAccumulation(source);
  }
  return buildMatchPairFromPoems(selected);
}

function accumulationLinePairs(item: PoetryItem): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i + 1 < item.lines.length; i += 2) {
    pairs.push([item.lines[i], item.lines[i + 1]]);
  }
  return pairs;
}

function buildMatchPairFromAccumulation(items: PoetryItem[]): MatchPairQuestion | null {
  const pairPool: Array<{ left: string; right: string }> = [];
  items.forEach((poem) => {
    accumulationLinePairs(poem).forEach(([left, right]) => {
      pairPool.push({ left, right });
    });
  });
  if (pairPool.length < 2) return null;

  const wantCount =
    pairPool.length >= 3 ? (Math.random() < 0.45 ? 2 : Math.min(3, pairPool.length)) : 2;
  const picked = pickN(pairPool, Math.min(wantCount, pairPool.length));
  const left: ChoiceOption[] = [];
  const right: ChoiceOption[] = [];
  const answerMap: Record<string, string> = {};

  picked.forEach((pair, i) => {
    const leftId = `L${i}`;
    const rightId = `R${i}`;
    left.push({ id: leftId, text: pair.left });
    right.push({ id: rightId, text: pair.right });
    answerMap[leftId] = rightId;
  });

  return {
    id: uid('match'),
    type: 'matchPair',
    itemIds: items.map((p) => p.id),
    couplet: true,
    left: shuffle(left),
    right: shuffle(right),
    answerMap,
  };
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
  lineIdx?: number,
): TitleAuthorQuestion | null {
  const lines = quizLinesForTitleAuthor(item);
  if (!lines.length) return null;
  const idx =
    lineIdx === undefined
      ? Math.floor(Math.random() * lines.length)
      : ((lineIdx % lines.length) + lines.length) % lines.length;
  const line = lines[idx];
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

  const isClassical = item.author === '文言文';
  const isMyth = isMythStoryItem(item);
  const isProse = isClassicalProseItem(item);
  let prompt = '';
  let typeLabel = '';
  if (quizMode === 'title') {
    if (isMyth) {
      prompt = '这段文字讲的是哪个神话故事？';
      typeLabel = '猜故事';
    } else if (isProse || isClassical) {
      prompt = '这篇小古文叫什么？';
      typeLabel = '猜篇名';
    } else {
      prompt = '这句诗出自哪一首？';
      typeLabel = '选诗名';
    }
  } else {
    prompt = '这句诗的作者是？';
    typeLabel = '选作者';
  }
  return {
    id: uid('ta'),
    type: 'titleAuthor',
    itemId: item.id,
    mode: quizMode,
    prompt,
    typeLabel,
    excerpt: line,
    options,
    answerId,
  };
}

/** 看图猜篇：emoji 场景选诗名/童谣名 */
export function makePoetryPicture(
  item: PoetryItem,
  pool: PoetryItem[],
): PoetryPictureQuestion | null {
  const visualEmoji = poetryEmojiFor(item);
  if (!visualEmoji) return null;
  const distractorTexts = pool
    .filter((p) => p.id !== item.id)
    .map((p) => p.title)
    .filter((t) => t && t !== item.title);
  const unique = Array.from(new Set(distractorTexts));
  if (unique.length < 1) return null;
  const options = shuffle([
    { id: 'ans', text: item.title },
    ...pickN(unique, 3).map((text, i) => ({ id: `d${i}`, text })),
  ]);
  return {
    id: uid('ppic'),
    type: 'poetryPicture',
    itemId: item.id,
    prompt: '看图标猜是哪一首？',
    visualEmoji,
    options,
    answerId: 'ans',
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

  const narrative = isNarrativeItem(item);
  return {
    id: uid('order'),
    type: 'orderLines',
    itemId: item.id,
    narrative,
    prompt: narrative
      ? `把《${item.title}》的内容按正确顺序排列`
      : `把《${item.title}》的诗句排成正确顺序`,
    options: shuffled,
    answerOrder,
  };
}

function isHanChar(ch: string): boolean {
  return /^[\u4e00-\u9fff]$/.test(ch);
}

function blankableIndices(line: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < line.length; i += 1) {
    if (isHanChar(line[i])) indices.push(i);
  }
  return indices;
}

/** 缺一字填空 */
export function makeFillBlank(item: PoetryItem, pool: PoetryItem[]): FillBlankQuestion | null {
  const candidates = quizLines(item).filter((line) => blankableIndices(line).length >= 2);
  if (!candidates.length) return null;
  const line = candidates[Math.floor(Math.random() * candidates.length)];
  const indices = blankableIndices(line);
  const blankIdx = indices[Math.floor(Math.random() * indices.length)];
  const answerChar = line[blankIdx];
  const promptLine = `${line.slice(0, blankIdx)}＿${line.slice(blankIdx + 1)}`;

  const charPool = pool
    .flatMap((p) => quizLines(p).join('').split(''))
    .filter((ch) => isHanChar(ch) && ch !== answerChar);
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

interface SimilarCharSlot {
  drill: SimilarCharDrill;
  line: string;
  idx: number;
  correct: string;
}

function makeSimilarCharFromDrill(
  drill: SimilarCharDrill,
  fixed?: { line: string; idx: number; correct: string },
): SimilarCharQuestion | null {
  const line = fixed?.line ?? drill.line;
  const idx = fixed?.idx ?? drill.idx;
  const correct = fixed?.correct ?? drill.correct;
  if (line[idx] !== correct) return null;

  const wrong = pickSimilarWrong(correct);
  if (!wrong) return null;

  const displayLine = `${line.slice(0, idx)}${wrong}${line.slice(idx + 1)}`;
  const distractors = new Set<string>([wrong]);
  similarCharsFor(correct).forEach((ch) => distractors.add(ch));
  distractors.delete(correct);
  const picked = pickN(Array.from(distractors), Math.min(3, distractors.size));
  const options = shuffle([
    { id: 'ans', text: correct },
    ...picked.map((text, i) => ({ id: `d${i}`, text })),
  ]);

  return {
    id: uid('sim'),
    type: 'similarChar',
    itemId: drill.id,
    prompt: '找出形近错字，选出正确的字',
    displayLine,
    wrongIdx: idx,
    displayChars: displayLine.split(''),
    options,
    answerId: 'ans',
  };
}

/** 形近字找茬：专练句中混入形近错字，选出正确字 */
export function makeSimilarChar(item: PoetryItem, _pool: PoetryItem[]): SimilarCharQuestion | null {
  const drills = similarCharDrillsForGrade(item.grade);
  if (!drills.length) return null;
  const drill = drills[Math.floor(Math.random() * drills.length)];
  return makeSimilarCharFromDrill(drill);
}

function buildDedicatedSimilarCharQuiz(
  pool: PoetryItem[],
  count: number,
  keys: Set<string>,
): Question[] {
  const grade = pool[0]?.grade ?? 4;
  const drills = similarCharDrillsForGrade(grade);
  if (!drills.length) return [];

  const slots: SimilarCharSlot[] = drills.map((drill) => ({
    drill,
    line: drill.line,
    idx: drill.idx,
    correct: drill.correct,
  }));
  shuffle(slots);
  const questions: Question[] = [];
  let slotCursor = 0;
  let guard = 0;
  const maxGuard = count * 32;
  let allowRepeat = false;

  while (questions.length < count && guard < maxGuard) {
    guard += 1;
    const slot = slots[slotCursor % slots.length];
    slotCursor += 1;
    const q = makeSimilarCharFromDrill(slot.drill, slot);
    if (!q) continue;
    if (registerQuestion(keys, q)) {
      questions.push(q);
      continue;
    }
    if (questions.length > 0 && guard > count * 2) allowRepeat = true;
    if (allowRepeat) questions.push(q);
  }
  return questions;
}

function buildDedicatedTitleAuthorQuiz(
  pool: PoetryItem[],
  count: number,
  keys: Set<string>,
): Question[] {
  const slots: Array<{ item: PoetryItem; lineIdx: number }> = [];
  shuffle(pool).forEach((item) => {
    quizLinesForTitleAuthor(item).forEach((_, lineIdx) => {
      slots.push({ item, lineIdx });
    });
  });
  if (!slots.length) return [];

  shuffle(slots);
  const questions: Question[] = [];
  let slotCursor = 0;
  let guard = 0;
  const maxGuard = count * 32;
  let allowRepeat = false;

  while (questions.length < count && guard < maxGuard) {
    guard += 1;
    const slot = slots[slotCursor % slots.length];
    slotCursor += 1;
    const q = makeTitleAuthor(slot.item, pool, 'title', slot.lineIdx);
    if (!q) continue;
    if (registerQuestion(keys, q)) {
      questions.push(q);
      continue;
    }
    if (questions.length > 0 && guard > count * 2) allowRepeat = true;
    if (allowRepeat) questions.push(q);
  }
  return questions;
}

export interface BuildQuizOptions {
  count?: number;
  modes?: QuizType[];
  preferTitle?: boolean;
  /** 中段偏难：后半程优先难题型 */
  rampHard?: boolean;
  /** 穿插同年级专项/主题/加练题，丰富闯关 */
  enrich?: boolean;
  packId?: string;
}

export interface AdaptiveContext {
  combo: number;
  lastCorrect: boolean;
  lastType?: QuizType;
  preferModes?: QuizType[];
}

const HARD_MODES: QuizType[] = ['orderLines', 'fillBlank', 'matchPair'];
const EASY_MODES: QuizType[] = ['fillNext', 'titleAuthor'];

const POETRY_DEDICATED_MODES: PoetryQuizType[] = [
  'fillNext',
  'matchPair',
  'titleAuthor',
  'orderLines',
  'fillBlank',
  'similarChar',
  'poetryPicture',
];

/** 语文专项练：固定单一题型，不因连击切换题型 */
export function isDedicatedPoetryMode(mode: ArcadeMode): mode is PoetryQuizType {
  return POETRY_DEDICATED_MODES.includes(mode as PoetryQuizType);
}

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
  if (mode === 'similarChar') return makeSimilarChar(item, pool);
  if (mode === 'poetryPicture') {
    return makePoetryPicture(item, pool) || makeTitleAuthor(item, pool, 'title');
  }
  return null;
}

function resolvePreferModes(ctx: AdaptiveContext, baseMode: ArcadeMode): QuizType[] {
  if (isDedicatedPoetryMode(baseMode)) return [baseMode];
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
  return [...EASY_MODES, ...HARD_MODES];
}

/** 围绕单篇诗词生成一局题目（混合题型，可中段偏难；可穿插专项/主题题） */
export function buildQuizForItem(
  item: PoetryItem,
  pool: PoetryItem[],
  options: BuildQuizOptions = {},
): Question[] {
  const count = options.count ?? 8;
  const preferTitle = options.preferTitle !== false;
  const rampHard = options.rampHard !== false;
  const easyFirst: QuizType[] = [
    'fillNext',
    'titleAuthor',
    'matchPair',
    'orderLines',
    'fillBlank',
  ];
  if (hasPoetryPicture(item)) {
    easyFirst.unshift('poetryPicture');
  }
  const modePool = options.modes?.length ? options.modes : easyFirst;
  const typeSchedule = buildTypeSchedule(
    rampHard
      ? [...modePool, ...HARD_MODES]
      : modePool,
    count * 2,
  );

  const buildCore = (target: number, usedKeys: Set<string>): Question[] => {
    const questions: Question[] = [];
    let guard = 0;
    while (questions.length < target && guard < target * 20) {
      guard += 1;
      const mode = typeSchedule[guard % typeSchedule.length];
      const q = makeByType(mode, item, pool, preferTitle);
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const buildEnrich = (target: number, usedKeys: Set<string>): Question[] => {
    if (target <= 0 || pool.length <= 1) return [];
    const { modes, themes } = planPoetryLevelEnrich(item);
    const enrichPool = buildPoetryEnrichPool(item, pool, themes);
    const enrichSchedule = buildTypeSchedule(modes, target * 3);
    const itemOrder = pickItemsForSession(enrichPool, Math.max(target * 2, 8));
    const questions: Question[] = [];
    let guard = 0;
    let itemCursor = 0;
    while (questions.length < target && guard < target * 24) {
      guard += 1;
      const mode = enrichSchedule[guard % enrichSchedule.length];
      // 看图猜篇必须锚定本篇 + 专属图标，避免 🎵🎶 对应多首童谣
      const enrichItem =
        mode === 'poetryPicture' ? item : itemOrder[itemCursor % itemOrder.length] || enrichPool[0];
      if (mode !== 'poetryPicture') itemCursor += 1;
      const q = makeByType(mode, enrichItem, pool, preferTitle);
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const usedKeys = new Set<string>();
  if (!options.enrich || pool.length <= 1) {
    return buildCore(count, usedKeys);
  }

  const enrichTarget = levelEnrichCount(count);
  const coreTarget = count - enrichTarget;
  const core = buildCore(coreTarget, usedKeys);
  const enrich = buildEnrich(enrichTarget, usedKeys);
  return mergeInterleavedQuestions(core, enrich, count);
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
  const dedicated = isDedicatedPoetryMode(mode);
  if (dedicated && mode === 'fillNext') {
    return buildDedicatedFillNextQuiz(pool, count, keys);
  }
  if (dedicated && mode === 'similarChar') {
    return buildDedicatedSimilarCharQuiz(pool, count, keys);
  }
  if (dedicated && mode === 'titleAuthor') {
    return buildDedicatedTitleAuthorQuiz(pool, count, keys);
  }
  let quizPool = pool;
  if (dedicated && mode === 'poetryPicture') {
    quizPool = pool.filter(hasPoetryPicture);
    if (!quizPool.length) return [];
  }
  const mixedTypes: QuizType[] = [
    'poetryPicture',
    'fillNext',
    'titleAuthor',
    'matchPair',
    'orderLines',
    'fillBlank',
    'similarChar',
  ];
  const typeSchedule = preferModes?.length
    ? buildTypeSchedule(preferModes, count * 2)
    : dedicated
      ? buildTypeSchedule([mode], count * 2)
      : mode === 'mixed' ||
          mode === 'boss' ||
          mode === 'daily' ||
          mode === 'duel' ||
          mode === 'sprint' ||
          mode === 'exam' ||
          mode === 'unit'
        ? buildTypeSchedule(mixedTypes, count * 2)
        : buildTypeSchedule([mode], count * 2);
  const itemOrder = pickItemsForSession(quizPool, Math.max(count * 3, dedicated ? 16 : count * 2));
  const questions: Question[] = [];
  let guard = 0;
  let itemCursor = 0;
  const maxGuard = dedicated ? count * 48 : count * 24;
  let allowRepeat = false;

  while (questions.length < count && guard < maxGuard) {
    guard += 1;
    const item = itemOrder[itemCursor % itemOrder.length] || quizPool[guard % quizPool.length];
    itemCursor += 1;
    const quizType = typeSchedule[guard % typeSchedule.length];
    const q = makeByType(quizType, item, pool, preferTitle);
    if (!q) continue;
    if (registerQuestion(keys, q)) {
      questions.push(q);
      continue;
    }
    if (dedicated && questions.length > 0 && guard > count * 3) {
      allowRepeat = true;
    }
    if (allowRepeat) {
      questions.push(q);
    }
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
  const lockedType = isDedicatedPoetryMode(baseMode) ? baseMode : null;
  const modes = resolvePreferModes(ctx, baseMode);
  const keys = usedKeys ?? new Set<string>();
  const itemOrder = sessionShuffle(pool);
  let guard = 0;
  let itemCursor = 0;
  let allowRepeat = false;

  while (guard < 64) {
    guard += 1;
    const quizType = lockedType ?? modes[Math.floor(Math.random() * modes.length)];
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
    if (!q) continue;
    if (registerQuestion(keys, q)) return q;
    if (lockedType && guard > 16) allowRepeat = true;
    if (allowRepeat) return q;
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
  if (question.type === 'mathBigWrite') {
    return typeof payload === 'string' && Number(payload) === question.answer;
  }
  if (
    question.type === 'fillNext' ||
    question.type === 'titleAuthor' ||
    question.type === 'fillBlank' ||
    question.type === 'similarChar' ||
    question.type === 'mathCalc' ||
    question.type === 'mathCompare' ||
    question.type === 'mathMissing' ||
    question.type === 'mathBigCompare' ||
    question.type === 'mathPlaceValue' ||
    question.type === 'mathBigRead' ||
    question.type === 'mathRound' ||
    question.type === 'mathLineType' ||
    question.type === 'mathGeoRelation' ||
    question.type === 'mathAngleClassify' ||
    question.type === 'mathAngleMeasure' ||
    question.type === 'mathMakeTen' ||
    question.type === 'mathBreakTen' ||
    question.type === 'mathFlatTen' ||
    question.type === 'mathBorrowTen' ||
    question.type === 'enWordMean' ||
    question.type === 'enMeanWord' ||
    question.type === 'enSpell' ||
    question.type === 'enPictureMean' ||
    question.type === 'enPictureWord' ||
    question.type === 'enPhoneticWord' ||
    question.type === 'poetryPicture'
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
  poetryPicture: '看图猜篇',
  orderLines: '诗句排序',
  fillBlank: '缺字填空',
  similarChar: '形近字找茬',
  mathCalc: '口算练习',
  mathVisual: '看图口算',
  mathSequence: '数字排队',
  mathCompare: '比大小',
  mathMissing: '算式填空',
  mathBigCompare: '大数比较',
  mathPlaceValue: '数位认识',
  mathBigRead: '大数读法',
  mathBigWrite: '大数写法',
  mathRound: '近似数',
  mathLineType: '线的认识',
  mathGeoRelation: '平行垂直',
  mathAngleClassify: '角的分类',
  mathAngleMeasure: '角的度量',
  mathMakeTen: '凑十法',
  mathBreakTen: '破十法',
  mathFlatTen: '平十法',
  mathBorrowTen: '借十法',
  enWordMean: '看词选义',
  enMeanWord: '看义选词',
  enSpell: '缺字母练习',
  enPictureMean: '看图选义',
  enPictureWord: '看图选词',
  enPhoneticWord: '音标选词',
  boss: '错题复习',
  daily: '每日自测',
  duel: '趣味对练',
  sprint: '限时冲刺',
  exam: '模拟小测',
  unit: '单元测验',
};
