import type {
  ArcadeMode,
  ChoiceOption,
  MathChoiceQuestion,
  MathDiagram,
  MathItem,
  MathQuizType,
  MathAngleMeasureQuestion,
  MathBigWriteQuestion,
  MathSequenceQuestion,
  MathVisualQuestion,
  Question,
  QuizType,
} from './types';
import { findThemeGame } from './math-themes';
import {
  levelEnrichCount,
  mergeInterleavedQuestions,
  planMathLevelEnrich,
} from './level-enrich';
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

const PLACE_NAMES = ['个位', '十位', '百位', '千位', '万位', '十万位', '百万位', '千万位', '亿位'];

function placeNameAt(posFromRight: number): string {
  if (posFromRight === 0) return '个位';
  const units = ['', '十', '百', '千'];
  const sections = ['', '万', '亿'];
  const sec = Math.floor(posFromRight / 4);
  const rem = posFromRight % 4;
  if (rem === 0) return `${sections[sec]}位`;
  return `${sections[sec]}${units[rem]}位`;
}

function formatComma(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 按关卡 max 控制位数，避免同一主题里五位数和八位数乱混 */
function randBigNumberForItem(item: MathItem, exclude = new Set<number>()): number {
  const cap = item.max;
  let minDigits: number;
  let maxDigits: number;
  if (cap <= 100_000) {
    minDigits = 5;
    maxDigits = 5;
  } else if (cap <= 1_000_000) {
    minDigits = 6;
    maxDigits = 6;
  } else if (cap <= 10_000_000) {
    minDigits = 7;
    maxDigits = 7;
  } else {
    minDigits = 8;
    maxDigits = 8;
  }
  let guard = 0;
  while (guard < 32) {
    guard += 1;
    const digits = randInt(minDigits, maxDigits);
    let n = randInt(1, 9);
    for (let i = 1; i < digits; i += 1) {
      n = n * 10 + randInt(0, 9);
    }
    n = Math.min(n, cap);
    if (!exclude.has(n)) return n;
  }
  return Math.min(cap, 10000 + randInt(0, Math.min(89999, cap - 10000)));
}

function randomSameLength(n: number): number {
  const len = String(n).length;
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    let m = randInt(1, 9);
    for (let i = 1; i < len; i += 1) {
      m = m * 10 + randInt(0, 9);
    }
    if (m !== n) return m;
  }
  return n + (n % 10 === 9 ? -1 : 1);
}

const ROUND_SCENARIOS = [
  { thing: '某城市人口', unit: '人' },
  { thing: '图书馆藏书', unit: '本' },
  { thing: '体育馆座位', unit: '个' },
  { thing: '某工厂年产值', unit: '元' },
  { thing: '某校学生', unit: '人' },
];

const GEO_SCENARIOS: Array<{
  relation: MathDiagram['relation'];
  scene: string;
  prompt: string;
}> = [
  { relation: 'parallel', scene: 'rail', prompt: '观察下图，铁轨的两条钢轨互相（ ）' },
  { relation: 'parallel', scene: 'book', prompt: '观察下图，书本相对的两条长边互相（ ）' },
  { relation: 'parallel', scene: 'road', prompt: '观察下图，公路的上下两条边线互相（ ）' },
  { relation: 'parallel', scene: 'window', prompt: '观察下图，窗户的上下两条边框互相（ ）' },
  { relation: 'perpendicular', scene: 'cross', prompt: '观察下图，十字路口的两条路互相（ ）' },
  { relation: 'perpendicular', scene: 'desk', prompt: '观察下图，课桌面相邻的两条边互相（ ）' },
  { relation: 'perpendicular', scene: 'flag', prompt: '观察下图，旗杆与水平地面互相（ ）' },
  { relation: 'perpendicular', scene: 'corner', prompt: '观察下图，长方形相邻的两条边互相（ ）' },
  { relation: 'parallel', scene: 'ladder', prompt: '观察下图，梯子左右两侧互相（ ）' },
  { relation: 'parallel', scene: 'tracks', prompt: '观察下图，双轨铁路的两条铁轨互相（ ）' },
  { relation: 'perpendicular', scene: 'wall', prompt: '观察下图，挂钟与墙面互相（ ）' },
  { relation: 'perpendicular', scene: 'board', prompt: '观察下图，黑板的长边与短边互相（ ）' },
  { relation: 'parallel', scene: 'shelf', prompt: '观察下图，书架的上下隔板互相（ ）' },
];

const LINE_PROMPTS: Record<NonNullable<MathDiagram['lineKind']>, string> = {
  line: '观察下图，可以向两端无限延长、没有端点的是（ ）',
  ray: '观察下图，只有一个端点、可向一端延长的是（ ）',
  segment: '观察下图，有两个端点、可以测量长度的是（ ）',
};

const LINE_SCENARIOS: Array<{
  lineKind: NonNullable<MathDiagram['lineKind']>;
  ans: string;
  prompt: string;
  scene: string;
}> = [
  { lineKind: 'line', ans: '直线', prompt: LINE_PROMPTS.line, scene: 'plain' },
  { lineKind: 'ray', ans: '射线', prompt: LINE_PROMPTS.ray, scene: 'plain' },
  { lineKind: 'segment', ans: '线段', prompt: LINE_PROMPTS.segment, scene: 'plain' },
  { lineKind: 'segment', ans: '线段', prompt: '用直尺量长度时，画出来的是（ ）', scene: 'ruler' },
  { lineKind: 'ray', ans: '射线', prompt: '手电筒射出的光可以看作（ ）', scene: 'light' },
  { lineKind: 'line', ans: '直线', prompt: '两端都无限延伸的是（ ）', scene: 'extend' },
  { lineKind: 'segment', ans: '线段', prompt: '有固定长度、两个端点的是（ ）', scene: 'fixed' },
  { lineKind: 'ray', ans: '射线', prompt: '从一点出发向一个方向延伸的是（ ）', scene: 'start' },
  { lineKind: 'line', ans: '直线', prompt: '笔直向两边无限延伸的是（ ）', scene: 'infinite' },
  { lineKind: 'segment', ans: '线段', prompt: '跳绳拉直后，中间部分可以看作（ ）', scene: 'rope' },
  { lineKind: 'ray', ans: '射线', prompt: '激光笔射出的光束可以看作（ ）', scene: 'laser' },
  { lineKind: 'segment', ans: '线段', prompt: '一根拉紧的绳子可以看作（ ）', scene: 'string' },
];

const ANGLE_CLASSIFY_SAMPLES = [25, 35, 45, 60, 75, 90, 100, 110, 120, 135, 150, 180];
const ANGLE_MEASURE_SAMPLES = [30, 40, 45, 55, 60, 70, 75, 85, 90, 100, 105, 115, 120, 130, 135, 150];

function readChineseSection(num: number): string {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const u = ['', '十', '百', '千'];
  if (num === 0) return '零';
  const str = String(num).padStart(4, '0');
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    const digit = Number(str[i]);
    if (digit === 0) {
      if (out && i < 3 && Number(str[i + 1]) !== 0) out += '零';
    } else {
      out += d[digit] + u[3 - i];
    }
  }
  if (out.startsWith('一十')) out = out.slice(1);
  return out;
}

function readChineseNumber(n: number): string {
  if (n === 0) return '零';
  const yi = Math.floor(n / 100000000);
  const wan = Math.floor((n % 100000000) / 10000);
  const rest = n % 10000;
  let out = '';
  if (yi) out += `${readChineseSection(yi)}亿`;
  if (wan) {
    if (yi && wan < 1000) out += '零';
    out += `${readChineseSection(wan)}万`;
  }
  if (rest) {
    if ((yi || wan) && rest < 1000) out += '零';
    out += readChineseSection(rest);
  }
  return out;
}

function choiceOptions(answerText: string, distractors: string[]): ChoiceOption[] {
  const set = new Set<string>([answerText]);
  distractors.forEach((t) => {
    if (t !== answerText) set.add(t);
  });
  const isNumeric = /^[\d,]+$/.test(answerText.trim());
  if (isNumeric) {
    const base = Number(answerText.replace(/,/g, ''));
    let guard = 0;
    while (set.size < 4 && guard < 20) {
      guard += 1;
      const delta = guard * 10_000 * (guard % 2 === 0 ? 1 : -1);
      const candidate = formatComma(Math.max(0, base + delta));
      if (candidate !== answerText) set.add(candidate);
    }
  }
  return shuffle(Array.from(set).slice(0, 4)).map((text, i) => ({
    id: text === answerText ? 'ans' : `d${i}`,
    text,
  }));
}

function angleTypeName(deg: number): string {
  if (deg === 90) return '直角';
  if (deg === 180) return '平角';
  if (deg === 360) return '周角';
  if (deg > 0 && deg < 90) return '锐角';
  if (deg > 90 && deg < 180) return '钝角';
  return '锐角';
}

export function makeMathBigCompare(item: MathItem): MathChoiceQuestion {
  let left = randBigNumberForItem(item);
  let right = randBigNumberForItem(item);
  if (left === right) right = Math.min(item.max, right + randInt(1, 9));
  const correct = left > right ? '>' : left < right ? '<' : '=';
  const options = shuffle(['>', '<', '=']).map((text, i) => ({
    id: text === correct ? 'ans' : `d${i}`,
    text,
  }));
  return {
    id: uid('mbcmp'),
    type: 'mathBigCompare',
    itemId: item.id,
    prompt: '比一比，左边和右边哪个数字更大？',
    compareLeft: formatComma(left),
    compareRight: formatComma(right),
    options,
    answerId: 'ans',
  };
}

function buildPlaceValueDisplay(n: number, highlightFromLeft: number) {
  const formatted = formatComma(n);
  let rawIdx = 0;
  const chars: Array<{ text: string; hi: boolean }> = [];
  for (const ch of formatted) {
    if (ch === ',') {
      chars.push({ text: ',', hi: false });
    } else {
      chars.push({ text: ch, hi: rawIdx === highlightFromLeft });
      rawIdx += 1;
    }
  }
  return chars;
}

function pickPlaceValueDigit(digits: string[]): number {
  const nonZero = digits
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d !== '0');
  if (nonZero.length) {
    return nonZero[randInt(0, nonZero.length - 1)].i;
  }
  return randInt(0, digits.length - 1);
}

export function makeMathPlaceValue(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const num = randBigNumberForItem(item, hint?.excludeNums);
  const digits = String(num).split('');
  const pos = pickPlaceValueDigit(digits);
  const digit = digits[pos];
  const place = placeNameAt(digits.length - 1 - pos);
  const wrongPlaces = shuffle(PLACE_NAMES.filter((p) => p !== place)).slice(0, 3);
  const placeValueChars = buildPlaceValueDisplay(num, pos);
  return {
    id: uid('mplace'),
    type: 'mathPlaceValue',
    itemId: item.id,
    prompt: digit === '0' ? '观察数字，标红的 0 在（ ）位' : `观察数字，标红的 ${digit} 在（ ）位`,
    placeValueChars,
    options: choiceOptions(place, wrongPlaces),
    answerId: 'ans',
  };
}

export function makeMathBigRead(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const num = randBigNumberForItem(item, hint?.excludeNums);
  const correct = readChineseNumber(num);
  const wrong = shuffle([
    readChineseNumber(randomSameLength(num)),
    readChineseNumber(randomSameLength(num)),
    readChineseNumber(randomSameLength(num)),
  ]).filter((t) => t !== correct);
  return {
    id: uid('mread'),
    type: 'mathBigRead',
    itemId: item.id,
    prompt: `${formatComma(num)} 读作（ ）`,
    options: choiceOptions(correct, wrong.slice(0, 3)),
    answerId: 'ans',
  };
}

function numberToPuzzlePieces(n: number): Array<{ id: number; text: string }> {
  const s = String(n);
  const chunks: string[] = [];
  for (let i = s.length; i > 0; i -= 4) {
    chunks.push(s.slice(Math.max(0, i - 4), i));
  }
  return shuffle(chunks).map((text, id) => ({ id, text }));
}

export function makeMathBigWrite(item: MathItem): MathBigWriteQuestion {
  const num = randBigNumberForItem(item);
  return {
    id: uid('mwrite'),
    type: 'mathBigWrite',
    itemId: item.id,
    prompt: '根据读法和拼图块，写出这个数',
    readText: readChineseNumber(num),
    puzzlePieces: numberToPuzzlePieces(num),
    answer: num,
  };
}

export function makeMathRound(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const num = randBigNumberForItem(item, hint?.excludeNums);
  const rounded = Math.round(num / 10000) * 10000;
  const wrong = shuffle([
    Math.floor(num / 10000) * 10000,
    Math.ceil(num / 10000) * 10000,
    rounded + 10000,
    Math.max(10000, rounded - 10000),
  ])
    .filter((v) => v !== rounded)
    .slice(0, 3);
  const ctx = ROUND_SCENARIOS[randInt(0, ROUND_SCENARIOS.length - 1)];
  return {
    id: uid('mround'),
    type: 'mathRound',
    itemId: item.id,
    prompt: `${ctx.thing}约 ${formatComma(num)} ${ctx.unit}，四舍五入到万位，约是多少？`,
    options: choiceOptions(formatComma(rounded), wrong.map((s) => formatComma(s))),
    answerId: 'ans',
  };
}

export function makeMathLineType(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const idx = hint?.lineScenario ?? randInt(0, LINE_SCENARIOS.length - 1);
  const scenario = LINE_SCENARIOS[idx % LINE_SCENARIOS.length];
  const wrong = ['直线', '射线', '线段', '折线'].filter((t) => t !== scenario.ans);
  return {
    id: uid('mline'),
    type: 'mathLineType',
    itemId: item.id,
    prompt: scenario.prompt,
    diagram: { kind: 'line', lineKind: scenario.lineKind, scene: scenario.scene },
    options: choiceOptions(scenario.ans, wrong),
    answerId: 'ans',
  };
}

export function makeMathGeoRelation(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const idx = hint?.geoScenario ?? randInt(0, GEO_SCENARIOS.length - 1);
  const scenario = GEO_SCENARIOS[idx % GEO_SCENARIOS.length];
  const ans = scenario.relation === 'parallel' ? '平行' : '垂直';
  const wrong = ['平行', '垂直', '相交'].filter((t) => t !== ans);
  return {
    id: uid('mgeo'),
    type: 'mathGeoRelation',
    itemId: item.id,
    prompt: scenario.prompt,
    diagram: { kind: 'parallel', relation: scenario.relation, scene: scenario.scene },
    options: choiceOptions(ans, wrong),
    answerId: 'ans',
  };
}

export function makeMathAngleClassify(item: MathItem, hint?: MathGenHint): MathChoiceQuestion {
  const idx = hint?.angleSample ?? randInt(0, ANGLE_CLASSIFY_SAMPLES.length - 1);
  const deg = ANGLE_CLASSIFY_SAMPLES[idx % ANGLE_CLASSIFY_SAMPLES.length];
  const correct = angleTypeName(deg);
  const wrong = ['锐角', '直角', '钝角', '平角'].filter((t) => t !== correct);
  return {
    id: uid('mangc'),
    type: 'mathAngleClassify',
    itemId: item.id,
    prompt: '观察下图，这是什么角？',
    diagram: { kind: 'angle', angleDeg: deg, scene: String(deg) },
    options: choiceOptions(correct, shuffle(wrong).slice(0, 3)),
    answerId: 'ans',
  };
}

export function makeMathAngleMeasure(item: MathItem, hint?: MathGenHint): MathAngleMeasureQuestion {
  const idx = hint?.angleSample ?? randInt(0, ANGLE_MEASURE_SAMPLES.length - 1);
  const deg = ANGLE_MEASURE_SAMPLES[idx % ANGLE_MEASURE_SAMPLES.length];
  const wrong = [
    deg + 10,
    Math.max(5, deg - 15),
    deg + 20,
  ].filter((d) => d !== deg && d <= 180);
  const texts = shuffle([String(deg), ...wrong.slice(0, 3).map(String)]);
  const options = texts.map((text, i) => ({
    id: text === String(deg) ? 'ans' : `d${i}`,
    text: `${text}°`,
  }));
  const ticks: MathAngleMeasureQuestion['ticks'] = [];
  for (let d = 0; d <= 180; d += 10) {
    ticks.push({
      id: d,
      deg: d,
      label: d % 30 === 0 ? String(d) : '',
      major: d % 30 === 0,
    });
  }
  return {
    id: uid('mangm'),
    type: 'mathAngleMeasure',
    itemId: item.id,
    prompt: '看量角器，读出这个角的度数',
    angleDeg: deg,
    options,
    answerId: 'ans',
    ticks,
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

const THEME_SKILLS_BY_MODE: Partial<Record<MathQuizType, MathItem['skill'][]>> = {
  mathBigCompare: ['bigNumber', 'placeValue'],
  mathPlaceValue: ['placeValue', 'bigNumber'],
  mathBigRead: ['bigNumber'],
  mathBigWrite: ['bigNumber', 'placeValue'],
  mathRound: ['bigNumber'],
  mathLineType: ['line'],
  mathGeoRelation: ['line'],
  mathAngleClassify: ['angle'],
  mathAngleMeasure: ['angle'],
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
  'mathBigCompare',
  'mathPlaceValue',
  'mathBigRead',
  'mathBigWrite',
  'mathRound',
  'mathLineType',
  'mathGeoRelation',
  'mathAngleClassify',
  'mathAngleMeasure',
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
  if (skill === 'bigNumber') {
    const u = item?.unit ?? 1;
    if (u <= 2 || (item?.max ?? 0) <= 100_000) return ['mathPlaceValue', 'mathBigRead'];
    if (u <= 4 || (item?.max ?? 0) <= 1_000_000) return ['mathBigCompare', 'mathBigWrite'];
    return ['mathRound', 'mathBigCompare'];
  }
  if (skill === 'placeValue') return ['mathPlaceValue', 'mathBigRead'];
  if (skill === 'angle') return ['mathAngleClassify', 'mathAngleMeasure'];
  if (skill === 'line') return ['mathLineType', 'mathGeoRelation'];
  if (skill === 'add' || skill === 'sub' || skill === 'mix') {
    if (item && item.max <= 20) {
      return ['mathVisual', 'mathCalc', 'mathMissing', 'mathCompare'];
    }
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

  const themeGame = ALL_MATH_QUIZ_TYPES.includes(mode as MathQuizType)
    ? findThemeGame(mode as MathQuizType)
    : undefined;
  if (themeGame?.maxCap || themeGame?.minCap) {
    const min = themeGame.minCap ?? 0;
    const max = themeGame.maxCap ?? Infinity;
    const capped = pool.filter((p) => p.max >= min && p.max <= max);
    if (capped.length) {
      const themeSkills = THEME_SKILLS_BY_MODE[mode as MathQuizType];
      if (themeSkills) {
        const themed = capped.filter((p) => themeSkills.includes(p.skill));
        return themed.length ? themed : capped;
      }
      return capped;
    }
  }

  const themeSkills = THEME_SKILLS_BY_MODE[mode as MathQuizType];
  if (themeSkills) {
    const themed = pool.filter((p) => themeSkills.includes(p.skill));
    return themed.length ? themed : pool;
  }
  const skill = STRATEGY_SKILL_BY_MODE[mode];
  if (!skill) return pool;
  const filtered = pool.filter((p) => p.skill === skill);
  return filtered.length ? filtered : pool;
}

interface MathGenHint {
  lineScenario?: number;
  geoScenario?: number;
  angleSample?: number;
  excludeNums?: Set<number>;
}

function usedNumbersFromKeys(keys: Set<string>): Set<number> {
  const nums = new Set<number>();
  for (const key of keys) {
    const pv = key.match(/:pv:([\d[\],]+)/);
    if (pv) {
      const raw = pv[1].replace(/\[|\]|,/g, '');
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) nums.add(n);
    }
    const read = key.match(/^mathBigRead:([\d,]+)/);
    if (read) {
      const n = Number(read[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) nums.add(n);
    }
    const round = key.match(/^mathRound:[^:]*约 ([\d,]+)/);
    if (round) {
      const n = Number(round[1].replace(/,/g, ''));
      if (Number.isFinite(n) && n > 0) nums.add(n);
    }
  }
  return nums;
}
function makeByMathType(type: MathQuizType, item: MathItem, hint?: MathGenHint): Question | null {
  if (type === 'mathVisual') return makeMathVisual(item);
  if (type === 'mathSequence') return makeMathSequence(item);
  if (type === 'mathCalc') return makeMathCalc(item);
  if (type === 'mathCompare') return makeMathCompare(item);
  if (type === 'mathMissing') return makeMathMissing(item);
  if (type === 'mathMakeTen') return makeMathMakeTen(item);
  if (type === 'mathBreakTen') return makeMathBreakTen(item);
  if (type === 'mathFlatTen') return makeMathFlatTen(item);
  if (type === 'mathBorrowTen') return makeMathBorrowTen(item);
  if (type === 'mathBigCompare') return makeMathBigCompare(item);
  if (type === 'mathPlaceValue') return makeMathPlaceValue(item, hint);
  if (type === 'mathBigRead') return makeMathBigRead(item, hint);
  if (type === 'mathBigWrite') return makeMathBigWrite(item);
  if (type === 'mathRound') return makeMathRound(item, hint);
  if (type === 'mathLineType') return makeMathLineType(item, hint);
  if (type === 'mathGeoRelation') return makeMathGeoRelation(item, hint);
  if (type === 'mathAngleClassify') return makeMathAngleClassify(item, hint);
  if (type === 'mathAngleMeasure') return makeMathAngleMeasure(item, hint);
  return null;
}

function buildGenHint(type: MathQuizType, guard: number, keys: Set<string>): MathGenHint {
  const hint: MathGenHint = { excludeNums: usedNumbersFromKeys(keys) };
  if (type === 'mathLineType') {
    hint.lineScenario = guard;
  } else if (type === 'mathGeoRelation') {
    hint.geoScenario = guard;
  } else if (type === 'mathAngleClassify' || type === 'mathAngleMeasure') {
    hint.angleSample = guard;
  }
  return hint;
}

/** 是否为专项/主题固定题型（非 mixed 综合练） */
export function isDedicatedMathMode(mode: ArcadeMode): mode is MathQuizType {
  return ALL_MATH_QUIZ_TYPES.includes(mode as MathQuizType);
}

export interface BuildMathQuizOptions {
  enrich?: boolean;
  pool?: MathItem[];
  grade?: number;
}

export function buildMathQuizForItem(
  item: MathItem,
  count = 8,
  preferTypes?: MathQuizType[],
  options?: BuildMathQuizOptions,
): Question[] {
  const types = preferTypes?.filter((t) => ALL_MATH_QUIZ_TYPES.includes(t));
  const skillModes = skillToModes(item.skill, item);
  const coreTypes = types?.length ? types : skillModes.length ? skillModes : ALL_MATH_QUIZ_TYPES;
  const typeSchedule = buildTypeSchedule(coreTypes, count * 3);

  const buildCore = (target: number, usedKeys: Set<string>): Question[] => {
    const questions: Question[] = [];
    let guard = 0;
    while (questions.length < target && guard < target * 20) {
      guard += 1;
      const type = typeSchedule[guard % typeSchedule.length];
      const q = makeByMathType(type, item, buildGenHint(type, questions.length, usedKeys));
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const buildEnrich = (target: number, usedKeys: Set<string>): Question[] => {
    const pool = options?.pool?.length ? options.pool : [item];
    const grade = options?.grade ?? item.grade ?? 1;
    const { types: enrichTypes } = planMathLevelEnrich(item, grade, pool, coreTypes, poolForMode);
    if (!enrichTypes.length) return [];
    const enrichSchedule = buildTypeSchedule(enrichTypes, target * 3);
    const altPool = pool.filter((p) => p.id !== item.id);
    const itemOrder = pickItemsForSession(altPool.length ? altPool : pool, Math.max(target * 2, 6));
    const questions: Question[] = [];
    let guard = 0;
    let itemCursor = 0;
    while (questions.length < target && guard < target * 24) {
      guard += 1;
      const type = enrichSchedule[guard % enrichSchedule.length];
      const enrichItem = itemOrder[itemCursor % itemOrder.length] || item;
      itemCursor += 1;
      const q = makeByMathType(type, enrichItem, buildGenHint(type, questions.length, usedKeys));
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const usedKeys = new Set<string>();
  if (!options?.enrich || !options.pool?.length) {
    return buildCore(count, usedKeys);
  }

  const enrichTarget = levelEnrichCount(count);
  const coreTarget = count - enrichTarget;
  const core = buildCore(coreTarget, usedKeys);
  const enrich = buildEnrich(enrichTarget, usedKeys);
  return mergeInterleavedQuestions(core, enrich, count);
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
  const itemOrder = pickItemsForSession(poolForMode(pool, mode), Math.max(count * 3, 16));
  const questions: Question[] = [];
  let guard = 0;
  let itemCursor = 0;
  const maxGuard = isDedicatedMathMode(mode) ? count * 80 : count * 24;
  while (questions.length < count && guard < maxGuard) {
    guard += 1;
    const pickFrom = poolForMode(pool, mode);
    const picked = itemOrder[itemCursor % itemOrder.length] || pickFrom[guard % pickFrom.length];
    itemCursor += 1;
    const type = typeSchedule[guard % typeSchedule.length];
    const q = makeByMathType(type, picked, buildGenHint(type, questions.length, keys));
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

  const scopedPool = isDedicatedMathMode(baseMode)
    ? poolForMode(pool, baseMode)
    : pool;
  if (!scopedPool.length) return null;

  const mathPrefer = ctx.preferModes?.filter((t): t is MathQuizType =>
    ALL_MATH_QUIZ_TYPES.includes(t as MathQuizType),
  );

  const lockedType = isDedicatedMathMode(baseMode) ? baseMode : null;

  let type: MathQuizType = 'mathCalc';
  if (lockedType) {
    type = lockedType;
  } else if (mathPrefer?.length) {
    type = mathPrefer[Math.floor(Math.random() * mathPrefer.length)];
  } else if (
    !ctx.lastCorrect &&
    ctx.lastType &&
    ALL_MATH_QUIZ_TYPES.includes(ctx.lastType as MathQuizType)
  ) {
    type = ctx.lastType as MathQuizType;
  } else if (ctx.combo >= 3 && !lockedType) {
    type = shuffle(ALL_MATH_QUIZ_TYPES)[0];
  } else if (ALL_MATH_QUIZ_TYPES.includes(baseMode as MathQuizType)) {
    type = baseMode as MathQuizType;
  } else {
    type = shuffle(ALL_MATH_QUIZ_TYPES)[0];
  }

  const keys = usedKeys ?? new Set<string>();
  const itemOrder = sessionShuffle(scopedPool);
  let guard = 0;
  let itemCursor = 0;

  while (guard < 80) {
    guard += 1;
    let item = itemOrder[itemCursor % itemOrder.length];
    itemCursor += 1;
    if (wrongHints?.length && (!ctx.lastCorrect || baseMode === 'boss')) {
      const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
      const found = scopedPool.find((p) => p.id === hint.itemId);
      if (found) {
        item = found;
        if (!lockedType && ALL_MATH_QUIZ_TYPES.includes(hint.quizType as MathQuizType)) {
          type = hint.quizType as MathQuizType;
        }
      } else if (baseMode === 'boss') {
        continue;
      }
    }
    const q = makeByMathType(type, item, buildGenHint(type, keys.size, keys));
    if (q && registerQuestion(keys, q)) return q;
    if (lockedType) continue;
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
  mathBigCompare: '大数比较',
  mathPlaceValue: '数位认识',
  mathBigRead: '大数读法',
  mathBigWrite: '大数写法',
  mathRound: '近似数',
  mathLineType: '线的认识',
  mathGeoRelation: '平行垂直',
  mathAngleClassify: '角的分类',
  mathAngleMeasure: '角的度量',
  boss: '错题复习',
  daily: '每日自测',
  duel: '趣味对练',
  sprint: '口算冲刺',
  exam: '模拟小测',
  unit: '单元测验',
};
