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
  mathVisual: '看图口算',
  mathSequence: '数字排队',
  mathCompare: '比大小',
  mathMissing: '数学填空',
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

/** 答对后移出错题本（同一条目 + 题型答对即攻克） */
export function recordFix(packId: string, itemId: string, quizType: QuizType): WrongBook {
  const book = loadWrongBook(packId);
  const k = entryKey(itemId, quizType);
  const idx = book.entries.findIndex((e) => entryKey(e.itemId, e.quizType) === k);
  if (idx < 0) return book;
  const prev = book.entries[idx];
  if (prev.cleared && prev.wrongCount <= 0) return book;
  book.entries[idx] = {
    ...prev,
    wrongCount: 0,
    cleared: true,
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
