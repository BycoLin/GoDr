import { pickSeededIndex } from './daily';
import type { Question } from './types';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/** 同局去重键：item + 题型 + 题干 */
export function questionSessionKey(q: Question): string {
  if (q.type === 'matchPair') {
    const ids = [...q.itemIds].sort().join(',');
    const left = q.left
      .map((o) => o.text)
      .sort()
      .join('|');
    return `match:${ids}:${left}`;
  }
  const itemId = 'itemId' in q ? q.itemId : '';
  const prompt = 'prompt' in q ? String(q.prompt || '') : '';
  return `${itemId}:${q.type}:${prompt}`;
}

export function keysFromQuestions(questions: Question[]): Set<string> {
  return new Set(questions.map(questionSessionKey));
}

export function registerQuestion(usedKeys: Set<string>, q: Question): boolean {
  const key = questionSessionKey(q);
  if (usedKeys.has(key)) return false;
  usedKeys.add(key);
  return true;
}

/** 无放回优先：池子够则尽量不重复 item，不够再开新一轮洗牌 */
export function pickItemsForSession<T extends { id: string }>(
  pool: T[],
  count: number,
): T[] {
  if (!pool.length || count <= 0) return [];
  const out: T[] = [];
  let round = shuffle(pool);
  let cursor = 0;
  while (out.length < count) {
    if (cursor >= round.length) {
      round = shuffle(pool);
      cursor = 0;
    }
    out.push(round[cursor]);
    cursor += 1;
  }
  return out;
}

/** 每日自测：日种子打乱后无放回取 item */
export function pickSeededItemsForSession<T extends { id: string }>(
  pool: T[],
  count: number,
  seed: string,
): T[] {
  if (!pool.length || count <= 0) return [];
  const sorted = pool.slice().sort((a, b) => a.id.localeCompare(b.id));
  const order = sorted.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = pickSeededIndex(seed, i, i + 1);
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  const shuffled = order.map((i) => sorted[i]);
  const out: T[] = [];
  let cursor = 0;
  let round = shuffled;
  while (out.length < count) {
    if (cursor >= round.length) {
      cursor = 0;
      round = shuffle(sorted);
    }
    out.push(round[cursor]);
    cursor += 1;
  }
  return out;
}

/** 打乱题型顺序后循环，避免每局题型固定轮转 */
export function buildTypeSchedule<T>(types: T[], count: number): T[] {
  if (!types.length || count <= 0) return [];
  const out: T[] = [];
  let round = shuffle(types);
  let i = 0;
  while (out.length < count) {
    if (i >= round.length) {
      round = shuffle(types);
      i = 0;
    }
    out.push(round[i]);
    i += 1;
  }
  return out;
}
