export interface FavoriteEntry {
  packId: string;
  itemId: string;
  grade: number;
  title: string;
  subject: string;
  savedAt: number;
}

const KEY = 'levelFavorites';

function loadAll(): FavoriteEntry[] {
  try {
    const data = wx.getStorageSync(KEY) as FavoriteEntry[] | '';
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e) => e && typeof e === 'object' && e.packId && e.itemId,
    );
  } catch {
    return [];
  }
}

function saveAll(list: FavoriteEntry[]): void {
  wx.setStorageSync(KEY, list);
}

function entryKey(packId: string, itemId: string): string {
  return `${packId}::${itemId}`;
}

export function listFavorites(): FavoriteEntry[] {
  return loadAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function isFavorite(packId: string, itemId: string): boolean {
  const k = entryKey(packId, itemId);
  return loadAll().some((e) => entryKey(e.packId, e.itemId) === k);
}

export function addFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): FavoriteEntry[] {
  const all = loadAll();
  const k = entryKey(entry.packId, entry.itemId);
  if (all.some((e) => entryKey(e.packId, e.itemId) === k)) return all;
  all.unshift({ ...entry, savedAt: Date.now() });
  saveAll(all);
  return all;
}

export function removeFavorite(packId: string, itemId: string): FavoriteEntry[] {
  const k = entryKey(packId, itemId);
  const next = loadAll().filter((e) => entryKey(e.packId, e.itemId) !== k);
  saveAll(next);
  return next;
}

/** 切换收藏，返回是否已收藏 */
export function toggleFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): boolean {
  if (isFavorite(entry.packId, entry.itemId)) {
    removeFavorite(entry.packId, entry.itemId);
    return false;
  }
  addFavorite(entry);
  return true;
}

export function clearFavorites(): void {
  wx.removeStorageSync(KEY);
}
