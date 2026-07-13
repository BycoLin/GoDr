import type { QuizType } from './types';

export interface WrongEntry {
  itemId: string;
  quizType: QuizType;
  wrongCount: number;
  lastWrongAt: number;
  cleared: boolean;
}

export interface WrongBook {
  entries: WrongEntry[];
}

const KEY_PREFIX = 'wrongbook:';

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  fillNext: '下一句',
  matchPair: '配对',
  titleAuthor: '诗名作者',
  orderLines: '排序',
  fillBlank: '填空',
  mathCalc: '速算',
  mathCompare: '比大小',
  mathMissing: '数学填空',
  enWordMean: '看词选义',
  enMeanWord: '看义选词',
  enSpell: '缺字母',
};

export function quizTypeLabel(type: QuizType): string {
  return QUIZ_TYPE_LABELS[type] || type;
}

function emptyBook(): WrongBook {
  return { entries: [] };
}

function key(packId: string): string {
  return `${KEY_PREFIX}${packId}`;
}

export function loadWrongBook(packId: string): WrongBook {
  try {
    const data = wx.getStorageSync(key(packId)) as WrongBook | '';
    if (!data || typeof data !== 'object' || !Array.isArray(data.entries)) return emptyBook();
    return { entries: data.entries };
  } catch {
    return emptyBook();
  }
}

export function saveWrongBook(packId: string, book: WrongBook): void {
  wx.setStorageSync(key(packId), book);
}

function entryKey(itemId: string, quizType: QuizType): string {
  return `${itemId}::${quizType}`;
}

/** 答错写入错题本 */
export function recordWrong(packId: string, itemId: string, quizType: QuizType): WrongBook {
  if (!itemId) return loadWrongBook(packId);
  const book = loadWrongBook(packId);
  const k = entryKey(itemId, quizType);
  const idx = book.entries.findIndex((e) => entryKey(e.itemId, e.quizType) === k);
  if (idx >= 0) {
    const prev = book.entries[idx];
    book.entries[idx] = {
      ...prev,
      wrongCount: prev.wrongCount + 1,
      lastWrongAt: Date.now(),
      cleared: false,
    };
  } else {
    book.entries.push({
      itemId,
      quizType,
      wrongCount: 1,
      lastWrongAt: Date.now(),
      cleared: false,
    });
  }
  saveWrongBook(packId, book);
  return book;
}

/** Boss 局或复习答对后削弱/攻克 */
export function recordFix(packId: string, itemId: string, quizType: QuizType): WrongBook {
  const book = loadWrongBook(packId);
  const k = entryKey(itemId, quizType);
  const idx = book.entries.findIndex((e) => entryKey(e.itemId, e.quizType) === k);
  if (idx < 0) return book;
  const prev = book.entries[idx];
  const nextCount = Math.max(0, prev.wrongCount - 1);
  book.entries[idx] = {
    ...prev,
    wrongCount: nextCount,
    cleared: nextCount === 0,
  };
  saveWrongBook(packId, book);
  return book;
}

export function listActiveWrongs(packId: string): WrongEntry[] {
  return loadWrongBook(packId)
    .entries.filter((e) => !e.cleared && e.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount || b.lastWrongAt - a.lastWrongAt);
}

export function countActiveWrongs(packId: string): number {
  return listActiveWrongs(packId).length;
}

/** Boss 优先挑错次高的条目 */
export function pickBossPool(packId: string, limit = 8): WrongEntry[] {
  return listActiveWrongs(packId).slice(0, limit);
}

export function clearWrongBook(packId: string): void {
  wx.removeStorageSync(key(packId));
}

export function clearAllWrongBooks(packIds: string[]): void {
  packIds.forEach((id) => clearWrongBook(id));
}
