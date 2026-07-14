import { getPackItems } from './registry';
import { loadPackProgress } from './progress';
import { countActiveWrongs } from './wrongbook';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 通关后超过 3 天未再练，计入待复习 */
const SPACED_AFTER_DAYS = 3;

export interface ReviewSummary {
  wrongs: number;
  spaced: number;
  total: number;
  tip: string;
}

/** 已通关且超过间隔未再练的条目数 */
export function countSpacedDue(packId: string, now = Date.now()): number {
  const progress = loadPackProgress(packId);
  const items = getPackItems(packId);
  const cleared = new Set(progress.clearedIds || []);
  let count = 0;
  items.forEach((item) => {
    if (!cleared.has(item.id)) return;
    const last = progress.items[item.id]?.lastPlayedAt || 0;
    if (!last) return;
    const days = Math.floor((now - last) / DAY_MS);
    if (days >= SPACED_AFTER_DAYS) count += 1;
  });
  return count;
}

export function getReviewSummary(packId: string): ReviewSummary {
  const wrongs = countActiveWrongs(packId);
  const spaced = countSpacedDue(packId);
  const total = wrongs + spaced;
  let tip = '暂无待复习，去闯关涨星吧';
  if (wrongs > 0 && spaced > 0) tip = `${wrongs} 个错题 · ${spaced} 个该复习`;
  else if (wrongs > 0) tip = `${wrongs} 个错题待巩固`;
  else if (spaced > 0) tip = `${spaced} 个知识点该复习啦`;
  return { wrongs, spaced, total, tip };
}
