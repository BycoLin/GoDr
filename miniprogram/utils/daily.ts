export interface DailyRecord {
  date: string;
  bestCorrect: number;
  bestTotal: number;
  bestPoints: number;
  completed: boolean;
  playedAt: number;
}

const KEY_PREFIX = 'daily:';
export const DAILY_QUESTION_COUNT = 10;
export const DAILY_LIMIT_SEC = 90;

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 简单日种子伪随机 [0,1) */
export function seededRandom(seed: string, index: number): number {
  let h = 2166136261;
  const s = `${seed}#${index}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function pickSeededIndex(seed: string, index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.floor(seededRandom(seed, index) * length);
}

function storageKey(date = todayKey()): string {
  return `${KEY_PREFIX}${date}`;
}

export function loadDailyRecord(date = todayKey()): DailyRecord | null {
  try {
    const data = wx.getStorageSync(storageKey(date)) as DailyRecord | '';
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function saveDailyRecord(record: DailyRecord): void {
  wx.setStorageSync(storageKey(record.date), record);
}

export function recordDailyResult(
  correct: number,
  total: number,
  points: number,
): DailyRecord {
  const date = todayKey();
  const prev = loadDailyRecord(date);
  const next: DailyRecord = {
    date,
    bestCorrect: Math.max(prev?.bestCorrect || 0, correct),
    bestTotal: Math.max(prev?.bestTotal || 0, total),
    bestPoints: Math.max(prev?.bestPoints || 0, points),
    completed: true,
    playedAt: Date.now(),
  };
  saveDailyRecord(next);
  return next;
}

export function clearDailyRecords(): void {
  const date = todayKey();
  wx.removeStorageSync(storageKey(date));
  // 清近 7 天，避免残留
  for (let i = 1; i <= 7; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    wx.removeStorageSync(`${KEY_PREFIX}${y}-${m}-${day}`);
  }
}
