import type { PackProgress } from './types';

const KEY_PREFIX = 'progress:';
const LAST_SESSION_KEY = 'lastPlaySession';

function emptyProgress(): PackProgress {
  return {
    clearedIds: [],
    stars: {},
    items: {},
    lastPlayedAt: 0,
  };
}

export function loadPackProgress(packId: string): PackProgress {
  try {
    const data = wx.getStorageSync(`${KEY_PREFIX}${packId}`) as PackProgress | '';
    if (!data || typeof data !== 'object') return emptyProgress();
    return {
      clearedIds: data.clearedIds || [],
      stars: data.stars || {},
      items: data.items || {},
      lastPlayedAt: data.lastPlayedAt || 0,
      lastGrade: data.lastGrade,
      lastItemId: data.lastItemId,
    };
  } catch {
    return emptyProgress();
  }
}

export function savePackProgress(packId: string, progress: PackProgress): void {
  wx.setStorageSync(`${KEY_PREFIX}${packId}`, progress);
}

export function recordPlayResult(
  packId: string,
  itemId: string,
  grade: number,
  correct: number,
  total: number,
  stars: number,
): PackProgress {
  const progress = loadPackProgress(packId);
  const prev = progress.items[itemId];
  const cleared = stars >= 1 || correct >= Math.ceil(total * 0.6);
  const nextStars = Math.max(prev?.stars || 0, stars);

  progress.items[itemId] = {
    stars: nextStars,
    bestCorrect: Math.max(prev?.bestCorrect || 0, correct),
    bestTotal: Math.max(prev?.bestTotal || 0, total),
    cleared: Boolean(prev?.cleared) || cleared,
    lastPlayedAt: Date.now(),
  };
  progress.stars[itemId] = nextStars;
  if (cleared && !progress.clearedIds.includes(itemId)) {
    progress.clearedIds.push(itemId);
  }
  progress.lastPlayedAt = Date.now();
  progress.lastGrade = grade;
  progress.lastItemId = itemId;
  savePackProgress(packId, progress);
  return progress;
}

export function saveLastSession(session: unknown): void {
  wx.setStorageSync(LAST_SESSION_KEY, session);
}

export function loadLastSession<T>(): T | null {
  try {
    const data = wx.getStorageSync(LAST_SESSION_KEY) as T | '';
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function clearLastSession(): void {
  wx.removeStorageSync(LAST_SESSION_KEY);
}
