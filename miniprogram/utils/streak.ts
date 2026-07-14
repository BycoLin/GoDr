import { todayKey } from './daily';

export interface StreakState {
  current: number;
  best: number;
  lastDate: string;
}

const KEY = 'practiceStreak';

function empty(): StreakState {
  return { current: 0, best: 0, lastDate: '' };
}

export function loadStreak(): StreakState {
  try {
    const data = wx.getStorageSync(KEY) as StreakState | '';
    if (!data || typeof data !== 'object') return empty();
    return {
      current: Number(data.current) || 0,
      best: Number(data.best) || 0,
      lastDate: data.lastDate || '',
    };
  } catch {
    return empty();
  }
}

export function saveStreak(state: StreakState): void {
  wx.setStorageSync(KEY, state);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 任意练习结束时打卡；同日多次只记一次 */
export function markPracticeDay(): StreakState {
  const today = todayKey();
  const state = loadStreak();
  if (state.lastDate === today) return state;

  let current = 1;
  if (state.lastDate === yesterdayKey()) {
    current = state.current + 1;
  }
  const next: StreakState = {
    current,
    best: Math.max(state.best, current),
    lastDate: today,
  };
  saveStreak(next);
  return next;
}

export function clearStreak(): void {
  wx.removeStorageSync(KEY);
}
