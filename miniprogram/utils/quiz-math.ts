import type {
  ArcadeMode,
  ChoiceOption,
  MathChoiceQuestion,
  MathItem,
  MathQuizType,
  Question,
} from './types';

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

function skillToModes(skill: MathItem['skill']): MathQuizType[] {
  if (skill === 'compare') return ['mathCompare', 'mathCalc'];
  if (skill === 'missing') return ['mathMissing', 'mathCalc'];
  if (skill === 'add' || skill === 'sub' || skill === 'mix') {
    return ['mathCalc', 'mathMissing', 'mathCompare'];
  }
  return ['mathCalc', 'mathCompare', 'mathMissing'];
}

function makeByMathType(type: MathQuizType, item: MathItem): Question | null {
  if (type === 'mathCalc') return makeMathCalc(item);
  if (type === 'mathCompare') return makeMathCompare(item);
  if (type === 'mathMissing') return makeMathMissing(item);
  return null;
}

function preferredType(item: MathItem, index: number): MathQuizType {
  const modes = skillToModes(item.skill);
  if (index >= 3) return modes[index % modes.length];
  // 前半程主练本关技能
  if (item.skill === 'compare') return 'mathCompare';
  if (item.skill === 'missing') return 'mathMissing';
  return 'mathCalc';
}

export function buildMathQuizForItem(item: MathItem, count = 5): Question[] {
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < count && guard < count * 12) {
    guard += 1;
    const q = makeByMathType(preferredType(item, questions.length), item);
    if (q) questions.push(q);
  }
  return questions;
}

export function buildMathArcadeQuiz(
  pool: MathItem[],
  mode: ArcadeMode,
  count = 8,
): Question[] {
  if (!pool.length) return [];
  const questions: Question[] = [];
  let guard = 0;
  while (questions.length < count && guard < count * 12) {
    guard += 1;
    const item = pool[Math.floor(Math.random() * pool.length)];
    let type: MathQuizType;
    if (mode === 'mathCalc' || mode === 'mathCompare' || mode === 'mathMissing') {
      type = mode;
    } else if (mode === 'mixed' || mode === 'boss' || mode === 'daily') {
      const all: MathQuizType[] = ['mathCalc', 'mathCompare', 'mathMissing'];
      type = all[questions.length % all.length];
    } else {
      type = preferredType(item, questions.length);
    }
    const q = makeByMathType(type, item);
    if (q) questions.push(q);
  }
  return questions;
}

export function buildMathBossQuiz(
  wrongPool: Array<{ itemId: string; quizType: string }>,
  pool: MathItem[],
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
    const type: MathQuizType =
      hint.quizType === 'mathCalc' ||
      hint.quizType === 'mathCompare' ||
      hint.quizType === 'mathMissing'
        ? hint.quizType
        : preferredType(item, questions.length);
    const q = makeByMathType(type, item);
    if (q) questions.push(q);
  }
  return questions;
}

export function nextMathAdaptiveQuestion(
  pool: MathItem[],
  baseMode: ArcadeMode,
  ctx: { combo: number; lastCorrect: boolean; lastType?: string },
  wrongHints?: Array<{ itemId: string; quizType: string }>,
): Question | null {
  if (!pool.length) return null;
  let type: MathQuizType = 'mathCalc';
  if (!ctx.lastCorrect && (ctx.lastType === 'mathCalc' || ctx.lastType === 'mathCompare' || ctx.lastType === 'mathMissing')) {
    type = ctx.lastType;
  } else if (ctx.combo >= 3) {
    type = shuffle(['mathMissing', 'mathCompare', 'mathCalc'] as MathQuizType[])[0];
  } else if (baseMode === 'mathCalc' || baseMode === 'mathCompare' || baseMode === 'mathMissing') {
    type = baseMode;
  } else {
    type = shuffle(['mathCalc', 'mathCompare', 'mathMissing'] as MathQuizType[])[0];
  }

  let item = pool[Math.floor(Math.random() * pool.length)];
  if (wrongHints?.length && (!ctx.lastCorrect || baseMode === 'boss')) {
    const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
    const found = pool.find((p) => p.id === hint.itemId);
    if (found) item = found;
  }
  return makeByMathType(type, item);
}

export const MATH_ARCADE_MODE_LABELS: Partial<Record<ArcadeMode, string>> = {
  mixed: '数学综合练',
  mathCalc: '口算练习',
  mathCompare: '比大小',
  mathMissing: '算式填空',
  boss: '错题复习',
  daily: '每日自测',
};
