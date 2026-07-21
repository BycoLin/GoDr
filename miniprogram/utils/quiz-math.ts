import type {
  ArcadeMode,
  ChoiceOption,
  MathChoiceQuestion,
  MathItem,
  MathQuizType,
  MathSequenceQuestion,
  MathVisualQuestion,
  Question,
  QuizType,
} from './types';
import {
  buildTypeSchedule,
  pickItemsForSession,
  registerQuestion,
  shuffle as sessionShuffle,
} from './quiz-session';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

function uniqueOptions(answer: number, max: number, count = 4): ChoiceOption[] {
  const set = new Set<number>([answer]);
  let guard = 0;
  while (set.size < count && guard < 40) {
    guard += 1;
    const delta = randInt(1, Math.max(3, Math.floor(max / 5) + 2));
    const cand = answer + (Math.random() < 0.5 ? -delta : delta);
    if (cand >= 0 && cand <= max + 5 && cand !== answer) set.add(cand);
  }
  while (set.size < count) {
    set.add(randInt(0, max + 5));
  }
  return shuffle(
    Array.from(set)
      .slice(0, count)
      .map((n) => ({
        id: n === answer ? 'ans' : `d${n}`,
        text: String(n),
      })),
  ).map((opt, i) => (opt.id === 'ans' ? opt : { ...opt, id: `d${i}` }));
}

function pickAdd(max: number): { a: number; b: number; ans: number } {
  const a = randInt(0, max);
  const b = randInt(0, max - a);
  return { a, b, ans: a + b };
}

function pickSub(max: number): { a: number; b: number; ans: number } {
  const a = randInt(0, max);
  const b = randInt(0, a);
  return { a, b, ans: a - b };
}

function pickBreakTen(): { a: number; b: number; diff: number; ones: number; tenPart: number } {
  let a = randInt(11, 18);
  let b = randInt(2, 9);
  let guard = 0;
  let ones = a % 10;
  while ((ones >= b || a <= b) && guard < 40) {
    a = randInt(11, 18);
    b = randInt(2, 9);
    ones = a % 10;
    guard += 1;
  }
  return { a, b, diff: a - b, ones, tenPart: 10 - b };
}

function pickMakeTen(): { a: number; b: number; sum: number; toTen: number; rest: number } {
  let a = randInt(5, 9);
  let b = randInt(2, 9);
  let guard = 0;
  while ((a + b <= 10 || a + b > 20) && guard < 40) {
    a = randInt(5, 9);
    b = randInt(2, 9);
    guard += 1;
  }
  const sum = a + b;
  return { a, b, sum, toTen: 10 - a, rest: sum - 10 };
}

export function makeMathMakeTen(item: MathItem): MathChoiceQuestion | null {
  const { a, b, sum, toTen, rest } = pickMakeTen();
  const step = randInt(0, 2);
  if (step === 0) {
    return {
      id: uid('mmt'),
      type: 'mathMakeTen',
      itemId: item.id,
      prompt: `${a} + ${b}，凑十：${a} 再加 □ = 10`,
      options: uniqueOptions(toTen, 10),
      answerId: 'ans',
    };
  }
  if (step === 1) {
    return {
      id: uid('mmt'),
      type: 'mathMakeTen',
      itemId: item.id,
      prompt: `${a} + ${b}，10 外面还要加 □`,
      options: uniqueOptions(rest, 10),
      answerId: 'ans',
    };
  }
  return {
    id: uid('mmt'),
    type: 'mathMakeTen',
    itemId: item.id,
    prompt: `${a} + ${b} = □`,
    options: uniqueOptions(sum, 20),
    answerId: 'ans',
  };
}

export function makeMathBreakTen(item: MathItem): MathChoiceQuestion | null {
  const { a, b, diff, ones, tenPart } = pickBreakTen();
  const step = randInt(0, 2);
  if (step === 0) {
    return {
      id: uid('mbt'),
      type: 'mathBreakTen',
      itemId: item.id,
      prompt: `${a} − ${b}，破十：${a} 分成 10 和 □`,
      options: uniqueOptions(ones, 10),
      answerId: 'ans',
    };
  }
  if (step === 1) {
    return {
      id: uid('mbt'),
      type: 'mathBreakTen',
      itemId: item.id,
      prompt: `${a} − ${b}，先算 10 − ${b} = □`,
      options: uniqueOptions(tenPart, 10),
      answerId: 'ans',
    };
  }
  return {
    id: uid('mbt'),
    type: 'mathBreakTen',
    itemId: item.id,
    prompt: `${a} − ${b} = □`,
    options: uniqueOptions(diff, 20),
    answerId: 'ans',
  };
}

/** 平十法：先减个位凑成 10，再用 10 减剩余 */
function pickFlatTen(): {
  a: number;
  b: number;
  diff: number;
  ones: number;
  restFromB: number;
  fromTen: number;
} {
  let a = randInt(11, 18);
  let b = randInt(6, 9);
  let guard = 0;
  let ones = a % 10;
  while ((ones === 0 || b <= ones || a <= b) && guard < 40) {
    a = randInt(11, 18);
    b = randInt(6, 9);
    ones = a % 10;
    guard += 1;
  }
  const restFromB = b - ones;
  const fromTen = 10 - restFromB;
  return { a, b, diff: a - b, ones, restFromB, fromTen };
}

export function makeMathFlatTen(item: MathItem): MathChoiceQuestion | null {
  const { a, b, diff, ones, restFromB, fromTen } = pickFlatTen();
  const step = randInt(0, 2);
  if (step === 0) {
    return {
      id: uid('mft'),
      type: 'mathFlatTen',
      itemId: item.id,
      prompt: `${a} − ${b}，平十：先减 □ 凑成 10`,
      options: uniqueOptions(ones, 10),
      answerId: 'ans',
    };
  }
  if (step === 1) {
    return {
      id: uid('mft'),
      type: 'mathFlatTen',
      itemId: item.id,
      prompt: `${a} − ${b}，${b} 减了 ${ones} 还剩 □`,
      options: uniqueOptions(restFromB, 10),
      answerId: 'ans',
    };
  }
  if (Math.random() < 0.5) {
    return {
      id: uid('mft'),
      type: 'mathFlatTen',
      itemId: item.id,
      prompt: `${a} − ${b} = □`,
      options: uniqueOptions(diff, 20),
      answerId: 'ans',
    };
  }
  return {
    id: uid('mft'),
    type: 'mathFlatTen',
    itemId: item.id,
    prompt: `${a} − ${b}，10 − ${restFromB} = □`,
    options: uniqueOptions(fromTen, 20),
    answerId: 'ans',
  };
}

/** 借十法：个位不够减，向十位借 10 再合并 */
export function makeMathBorrowTen(item: MathItem): MathChoiceQuestion | null {
  const { a, b, diff, ones, tenPart } = pickBreakTen();
  const step = randInt(0, 2);
  if (step === 0) {
    return {
      id: uid('mbw'),
      type: 'mathBorrowTen',
      itemId: item.id,
      prompt: `${a} − ${b}，借十：先看个位 ${a} 的个位是 □`,
      options: uniqueOptions(ones, 10),
      answerId: 'ans',
    };
  }
  if (step === 1) {
    return {
      id: uid('mbw'),
      type: 'mathBorrowTen',
      itemId: item.id,
      prompt: `${a} − ${b}，借十：10 − ${b} = □`,
      options: uniqueOptions(tenPart, 10),
      answerId: 'ans',
    };
  }
  return {
    id: uid('mbw'),
    type: 'mathBorrowTen',
    itemId: item.id,
    prompt: `${a} − ${b}，${tenPart} + ${ones} = □`,
    options: uniqueOptions(diff, 20),
    answerId: 'ans',
  };
}

const VISUAL_ICONS = ['🍓', '🍎', '🍊', '🍇', '🍒', '🍑', '⭐', '🐤'];

function pctOnLine(value: number, min: number, max: number): number {
  if (max <= min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

function buildLineTicks(min: number, max: number): Array<{ value: number; pct: number }> {
  const span = max - min;
  const step = span <= 10 ? 1 : span <= 20 ? 2 : 5;
  const ticks: Array<{ value: number; pct: number }> = [];
  for (let v = min; v <= max; v += step) {
    ticks.push({ value: v, pct: pctOnLine(v, min, max) });
  }
  if (ticks[ticks.length - 1]?.value !== max) {
    ticks.push({ value: max, pct: 100 });
  }
  return ticks;
}

function makeVisualMakeTen(item: MathItem): MathVisualQuestion | null {
  const { a, b, sum, toTen, rest } = pickMakeTen();
  const tenFrame = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    filled: i < a + toTen,
    highlight: i >= a && i < a + toTen,
  }));
  return {
    id: uid('mvis'),
    type: 'mathVisual',
    itemId: item.id,
    op: 'makeTen',
    prompt: '凑十法：先凑满十格，再算一共多少？',
    a,
    b,
    answer: sum,
    icon: '●',
    tenFrame,
    outsideDots: Array.from({ length: rest }, (_, i) => ({ id: i })),
  };
}

function makeVisualCompare(item: MathItem): MathVisualQuestion | null {
  let left = randInt(0, item.max);
  let right = randInt(0, item.max);
  if (left === right) {
    right = Math.min(item.max, right + randInt(1, Math.max(1, Math.min(3, item.max - right))));
  }
  const compareAnswer = left > right ? '>' : left < right ? '<' : '=';
  const lineMin = 0;
  const lineMax = Math.max(10, item.max, left, right);
  return {
    id: uid('mvis'),
    type: 'mathVisual',
    itemId: item.id,
    op: 'compare',
    prompt: '看数轴：左边的数和右边的数，哪个更大？',
    a: left,
    b: right,
    answer: 0,
    icon: '',
    lineMin,
    lineMax,
    left,
    right,
    leftPct: pctOnLine(left, lineMin, lineMax),
    rightPct: pctOnLine(right, lineMin, lineMax),
    lineTicks: buildLineTicks(lineMin, lineMax),
    compareAnswer,
  };
}

export function makeMathVisual(item: MathItem): MathVisualQuestion | null {
  if (item.skill === 'makeTen') return makeVisualMakeTen(item);
  if (item.skill === 'compare') return makeVisualCompare(item);
  if (item.max > 20) return null;
  const cap = Math.min(item.max, 10);
  const icon = VISUAL_ICONS[randInt(0, VISUAL_ICONS.length - 1)];
  const useAdd =
    item.skill === 'add' ||
    (item.skill === 'mix' && Math.random() < 0.5);

  if (useAdd && item.skill !== 'sub') {
    let a = 0;
    let b = 0;
    let ans = 0;
    let guard = 0;
    while ((a < 1 || b < 1) && guard < 20) {
      const picked = pickAdd(cap);
      a = picked.a;
      b = picked.b;
      ans = picked.ans;
      guard += 1;
    }
    if (a < 1 || b < 1) {
      a = randInt(1, Math.max(1, cap - 1));
      b = randInt(1, cap - a);
      ans = a + b;
    }
    return {
      id: uid('mvis'),
      type: 'mathVisual',
      itemId: item.id,
      op: 'add',
      prompt: '数一数，一共多少个？',
      a,
      b,
      answer: ans,
      icon,
      iconsA: Array.from({ length: a }, (_, i) => ({ id: i })),
      iconsB: Array.from({ length: b }, (_, i) => ({ id: i + 100 })),
    };
  }

  let a = 0;
  let b = 0;
  let ans = 0;
  let subGuard = 0;
  while (subGuard < 20) {
    const picked = pickSub(cap);
    a = picked.a;
    b = picked.b;
    ans = picked.ans;
    if (a >= 1 && b >= 1) break;
    subGuard += 1;
  }
  if (a < 1 || b < 1) {
    a = randInt(2, cap);
    b = randInt(1, a - 1);
    ans = a - b;
  }
  const icons = Array.from({ length: a }, (_, i) => ({
    id: i,
    gone: i < b,
  }));
  return {
    id: uid('mvis'),
    type: 'mathVisual',
    itemId: item.id,
    op: 'sub',
    prompt: '拿走一些，还剩多少？',
    a,
    b,
    answer: ans,
    icon,
    icons,
  };
}

/** 数字排队：按规律填空缺 */
export function makeMathSequence(item: MathItem): MathSequenceQuestion {
  const len = 4;
  let step = 1;
  let maxStart = Math.min(item.max, 20);

  if (item.max <= 10) {
    step = 1;
    maxStart = 8;
  } else if (item.max <= 20) {
    step = Math.random() < 0.75 ? 1 : 2;
    maxStart = 15;
  } else if (item.max <= 50) {
    step = shuffle([1, 2, 3, 5])[0];
    maxStart = Math.min(30, item.max - len * step);
  } else {
    step = shuffle([2, 5, 10])[0];
    maxStart = Math.min(50, item.max - len * step);
  }

  maxStart = Math.max(1, maxStart);
  const start = randInt(1, maxStart);
  const values = Array.from({ length: len }, (_, i) => start + i * step);

  const patterns = [
    [2, 3],
    [1, 3],
    [1, 2],
  ];
  const blankIndexes = patterns[randInt(0, patterns.length - 1)];

  const slots = values.map((value, i) => ({
    index: i,
    show: !blankIndexes.includes(i),
    value,
  }));

  return {
    id: uid('mseq'),
    type: 'mathSequence',
    itemId: item.id,
    prompt: '观察数字顺序，把空缺的位置补完整。',
    step,
    slots,
    blankIndexes,
    answers: blankIndexes.map((i) => values[i]),
  };
}

export function makeMathCalc(item: MathItem): MathChoiceQuestion | null {
  let useAdd = true;
  if (item.skill === 'sub') useAdd = false;
  else if (item.skill === 'add') useAdd = true;
  else useAdd = Math.random() < 0.5;

  if (useAdd) {
    const { a, b, ans } = pickAdd(item.max);
    return {
      id: uid('mcalc'),
      type: 'mathCalc',
      itemId: item.id,
      prompt: `${a} + ${b} = ？`,
      options: uniqueOptions(ans, item.max),
      answerId: 'ans',
    };
  }

  const { a, b, ans } = pickSub(item.max);
  return {
    id: uid('mcalc'),
    type: 'mathCalc',
    itemId: item.id,
    prompt: `${a} − ${b} = ？`,
    options: uniqueOptions(ans, item.max),
    answerId: 'ans',
  };
}

export function makeMathCompare(item: MathItem): MathChoiceQuestion | null {
  let left = randInt(0, item.max);
  let right = randInt(0, item.max);
  if (left === right) {
    right = Math.min(item.max, right + randInt(1, 3));
  }
  const correct = left > right ? '>' : left < right ? '<' : '=';
  const symbols = ['>', '<', '='];
  const options = shuffle(symbols).map((text, i) => ({
    id: text === correct ? 'ans' : `d${i}`,
    text,
  }));

  return {
    id: uid('mcmp'),
    type: 'mathCompare',
    itemId: item.id,
    prompt: `${left}  □  ${right}  选正确符号`,
    options,
    answerId: 'ans',
  };
}

export function makeMathMissing(item: MathItem): MathChoiceQuestion | null {
  const useAdd = item.skill === 'add' || (item.skill !== 'sub' && Math.random() < 0.5);
  if (useAdd) {
    const { a, b, ans } = pickAdd(item.max);
    const blankLeft = Math.random() < 0.5;
    if (blankLeft) {
      return {
        id: uid('mmiss'),
        type: 'mathMissing',
        itemId: item.id,
        prompt: `□ + ${b} = ${ans}`,
        options: uniqueOptions(a, item.max),
        answerId: 'ans',
      };
    }
    return {
      id: uid('mmiss'),
      type: 'mathMissing',
      itemId: item.id,
      prompt: `${a} + □ = ${ans}`,
      options: uniqueOptions(b, item.max),
      answerId: 'ans',
    };
  }
  const { a, b, ans } = pickSub(item.max);
  const mode = randInt(0, 2);
  if (mode === 0) {
    return {
      id: uid('mmiss'),
      type: 'mathMissing',
      itemId: item.id,
      prompt: `□ − ${b} = ${ans}`,
      options: uniqueOptions(a, item.max),
      answerId: 'ans',
    };
  }
  if (mode === 1) {
    return {
      id: uid('mmiss'),
      type: 'mathMissing',
      itemId: item.id,
      prompt: `${a} − □ = ${ans}`,
      options: uniqueOptions(b, item.max),
      answerId: 'ans',
    };
  }
  return {
    id: uid('mmiss'),
    type: 'mathMissing',
    itemId: item.id,
    prompt: `${a} − ${b} = □`,
    options: uniqueOptions(ans, item.max),
    answerId: 'ans',
  };
}

const STRATEGY_SKILL_BY_MODE: Partial<Record<ArcadeMode, MathItem['skill']>> = {
  mathMakeTen: 'makeTen',
  mathBreakTen: 'breakTen',
  mathFlatTen: 'flatTen',
  mathBorrowTen: 'borrowTen',
};

const ALL_MATH_QUIZ_TYPES: MathQuizType[] = [
  'mathVisual',
  'mathSequence',
  'mathCalc',
  'mathCompare',
  'mathMissing',
  'mathMakeTen',
  'mathBreakTen',
  'mathFlatTen',
  'mathBorrowTen',
];

function visualModesFor(item: MathItem): MathQuizType[] {
  if (item.skill === 'makeTen') return ['mathVisual', 'mathMakeTen'];
  if (item.skill === 'compare') return ['mathVisual', 'mathCompare', 'mathCalc'];
  if (item.max <= 20 && ['add', 'sub', 'mix', 'missing'].includes(item.skill)) {
    return ['mathVisual', 'mathSequence', 'mathCalc', 'mathMissing', 'mathCompare'];
  }
  return [];
}

function skillToModes(skill: MathItem['skill'], item?: MathItem): MathQuizType[] {
  if (item) {
    const visual = visualModesFor(item);
    if (visual.length) return visual;
  }
  if (skill === 'makeTen') return ['mathMakeTen'];
  if (skill === 'breakTen') return ['mathBreakTen'];
  if (skill === 'flatTen') return ['mathFlatTen'];
  if (skill === 'borrowTen') return ['mathBorrowTen'];
  if (skill === 'compare') return ['mathCompare', 'mathCalc'];
  if (skill === 'missing') return ['mathSequence', 'mathMissing', 'mathCalc'];
  if (skill === 'add' || skill === 'sub' || skill === 'mix') {
    return ['mathCalc', 'mathMissing', 'mathCompare'];
  }
  return ['mathCalc', 'mathCompare', 'mathMissing'];
}

function poolForMode(pool: MathItem[], mode: ArcadeMode): MathItem[] {
  if (mode === 'mathVisual') {
    const visual = pool.filter((p) => {
      if (p.skill === 'makeTen' || p.skill === 'compare') return true;
      return p.max <= 20 && ['add', 'sub', 'mix'].includes(p.skill);
    });
    return visual.length ? visual : pool;
  }
  if (mode === 'mathSequence') {
    const seq = pool.filter((p) => p.max <= 50);
    return seq.length ? seq : pool;
  }
  const skill = STRATEGY_SKILL_BY_MODE[mode];
  if (!skill) return pool;
  const filtered = pool.filter((p) => p.skill === skill);
  return filtered.length ? filtered : pool;
}

function makeByMathType(type: MathQuizType, item: MathItem): Question | null {
  if (type === 'mathVisual') return makeMathVisual(item);
  if (type === 'mathSequence') return makeMathSequence(item);
  if (type === 'mathCalc') return makeMathCalc(item);
  if (type === 'mathCompare') return makeMathCompare(item);
  if (type === 'mathMissing') return makeMathMissing(item);
  if (type === 'mathMakeTen') return makeMathMakeTen(item);
  if (type === 'mathBreakTen') return makeMathBreakTen(item);
  if (type === 'mathFlatTen') return makeMathFlatTen(item);
  if (type === 'mathBorrowTen') return makeMathBorrowTen(item);
  return null;
}

export function buildMathQuizForItem(
  item: MathItem,
  count = 8,
  preferTypes?: MathQuizType[],
): Question[] {
  const types = preferTypes?.filter((t) => ALL_MATH_QUIZ_TYPES.includes(t));
  const skillModes = skillToModes(item.skill, item);
  const typeSchedule = buildTypeSchedule(
    types?.length ? types : skillModes.length ? skillModes : ALL_MATH_QUIZ_TYPES,
    count * 3,
  );
  const usedKeys = new Set<string>();
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < count && guard < count * 20) {
    guard += 1;
    const type = typeSchedule[guard % typeSchedule.length];
    const q = makeByMathType(type, item);
    if (q && registerQuestion(usedKeys, q)) questions.push(q);
  }
  return questions;
}

export function buildMathArcadeQuiz(
  pool: MathItem[],
  mode: ArcadeMode,
  count = 8,
  preferModes?: QuizType[],
  usedKeys?: Set<string>,
): Question[] {
  if (!pool.length) return [];
  const mathPrefer = preferModes?.filter((t): t is MathQuizType =>
    ALL_MATH_QUIZ_TYPES.includes(t as MathQuizType),
  );
  const keys = usedKeys ?? new Set<string>();
  const typeSchedule =
    mathPrefer?.length
      ? buildTypeSchedule(mathPrefer, count * 2)
      : ALL_MATH_QUIZ_TYPES.includes(mode as MathQuizType)
        ? buildTypeSchedule([mode as MathQuizType], count * 2)
        : buildTypeSchedule(ALL_MATH_QUIZ_TYPES, count * 2);
  const itemOrder = pickItemsForSession(poolForMode(pool, mode), count * 2);
  const questions: Question[] = [];
  let guard = 0;
  let itemCursor = 0;
  while (questions.length < count && guard < count * 24) {
    guard += 1;
    const pickFrom = poolForMode(pool, mode);
    const picked = itemOrder[itemCursor % itemOrder.length] || pickFrom[guard % pickFrom.length];
    itemCursor += 1;
    const type = typeSchedule[guard % typeSchedule.length];
    const q = makeByMathType(type, picked);
    if (q && registerQuestion(keys, q)) questions.push(q);
  }
  return questions;
}

export function buildMathBossQuiz(
  wrongPool: Array<{ itemId: string; quizType: string }>,
  pool: MathItem[],
): Question[] {
  if (!pool.length || !wrongPool.length) return [];
  const byId = new Map(pool.map((p) => [p.id, p]));
  const questions: Question[] = [];

  for (const hint of wrongPool) {
    const item = byId.get(hint.itemId);
    if (!item) continue;
    if (!ALL_MATH_QUIZ_TYPES.includes(hint.quizType as MathQuizType)) continue;
    const q = makeByMathType(hint.quizType as MathQuizType, item);
    if (q) questions.push(q);
  }
  return questions;
}

export function nextMathAdaptiveQuestion(
  pool: MathItem[],
  baseMode: ArcadeMode,
  ctx: {
    combo: number;
    lastCorrect: boolean;
    lastType?: string;
    preferModes?: QuizType[];
  },
  wrongHints?: Array<{ itemId: string; quizType: string }>,
  usedKeys?: Set<string>,
): Question | null {
  if (!pool.length) return null;
  if (baseMode === 'boss' && !wrongHints?.length) return null;

  const mathPrefer = ctx.preferModes?.filter((t): t is MathQuizType =>
    ALL_MATH_QUIZ_TYPES.includes(t as MathQuizType),
  );

  let type: MathQuizType = 'mathCalc';
  if (mathPrefer?.length) {
    type = mathPrefer[Math.floor(Math.random() * mathPrefer.length)];
  } else if (
    !ctx.lastCorrect &&
    ctx.lastType &&
    ALL_MATH_QUIZ_TYPES.includes(ctx.lastType as MathQuizType)
  ) {
    type = ctx.lastType as MathQuizType;
  } else if (ctx.combo >= 3) {
    type = shuffle(ALL_MATH_QUIZ_TYPES)[0];
  } else if (ALL_MATH_QUIZ_TYPES.includes(baseMode as MathQuizType)) {
    type = baseMode as MathQuizType;
  } else {
    type = shuffle(ALL_MATH_QUIZ_TYPES)[0];
  }

  const keys = usedKeys ?? new Set<string>();
  const itemOrder = sessionShuffle(pool);
  let guard = 0;
  let itemCursor = 0;

  while (guard < 24) {
    guard += 1;
    let item = itemOrder[itemCursor % itemOrder.length];
    itemCursor += 1;
    if (wrongHints?.length && (!ctx.lastCorrect || baseMode === 'boss')) {
      const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
      const found = pool.find((p) => p.id === hint.itemId);
      if (found) {
        item = found;
        if (ALL_MATH_QUIZ_TYPES.includes(hint.quizType as MathQuizType)) {
          type = hint.quizType as MathQuizType;
        }
      } else if (baseMode === 'boss') {
        continue;
      }
    }
    const q = makeByMathType(type, item);
    if (q && registerQuestion(keys, q)) return q;
    type = shuffle(ALL_MATH_QUIZ_TYPES)[0];
  }
  return null;
}

export const MATH_ARCADE_MODE_LABELS: Partial<Record<ArcadeMode, string>> = {
  mixed: '数学综合练',
  mathVisual: '看图口算',
  mathSequence: '数字排队',
  mathCalc: '口算练习',
  mathCompare: '比大小',
  mathMissing: '算式填空',
  mathMakeTen: '凑十法',
  mathBreakTen: '破十法',
  mathFlatTen: '平十法',
  mathBorrowTen: '借十法',
  boss: '错题复习',
  daily: '每日自测',
  duel: '趣味对练',
  sprint: '口算冲刺',
  exam: '模拟小测',
  unit: '单元测验',
};
