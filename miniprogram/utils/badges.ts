import { listPacks } from './registry';
import { loadPackProgress } from './progress';
import type { Wallet } from './wallet';

export interface BadgeDef {
  id: string;
  title: string;
  desc: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_win', title: '初次练习', desc: '完成第一局答题' },
  { id: 'three_star', title: '三星达人', desc: '任意一局拿到三星' },
  { id: 'combo_5', title: '连对高手', desc: '单局连续答对达到 5' },
  { id: 'boss_clear', title: '错题清零', desc: '完成一次错题复习' },
  { id: 'daily_clear', title: '每日打卡', desc: '完成一次每日自测' },
  { id: 'master_5', title: '诗词新秀', desc: '完成 5 首诗词练习' },
  { id: 'master_10', title: '诗词小达人', desc: '完成 10 首诗词练习' },
];

const KEY = 'badges';

export function loadBadgeIds(): string[] {
  try {
    const data = wx.getStorageSync(KEY) as string[] | '';
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveBadgeIds(ids: string[]): void {
  wx.setStorageSync(KEY, ids);
}

function totalCleared(): number {
  return listPacks().reduce((sum, pack) => sum + loadPackProgress(pack.id).clearedIds.length, 0);
}

export interface BadgeCheckContext {
  wallet: Wallet;
  stars: number;
  bestCombo: number;
  isBoss?: boolean;
  isDaily?: boolean;
  cleared?: boolean;
}

/** 检测并解锁新成就，返回本次新解锁列表 */
export function unlockBadges(ctx: BadgeCheckContext): BadgeDef[] {
  const owned = new Set(loadBadgeIds());
  const next: string[] = [...owned];
  const newly: BadgeDef[] = [];

  const tryUnlock = (id: string) => {
    if (owned.has(id)) return;
    owned.add(id);
    next.push(id);
    const def = BADGE_DEFS.find((b) => b.id === id);
    if (def) newly.push(def);
  };

  if (ctx.wallet.sessions >= 1) tryUnlock('first_win');
  if (ctx.stars >= 3) tryUnlock('three_star');
  if (ctx.bestCombo >= 5 || ctx.wallet.bestCombo >= 5) tryUnlock('combo_5');
  if (ctx.isBoss && ctx.cleared) tryUnlock('boss_clear');
  if (ctx.isDaily && ctx.cleared) tryUnlock('daily_clear');

  const mastered = totalCleared();
  if (mastered >= 5) tryUnlock('master_5');
  if (mastered >= 10) tryUnlock('master_10');

  if (newly.length) saveBadgeIds(next);
  return newly;
}

export function listBadgesWithState(): Array<BadgeDef & { unlocked: boolean }> {
  const owned = new Set(loadBadgeIds());
  return BADGE_DEFS.map((b) => ({ ...b, unlocked: owned.has(b.id) }));
}

export function clearBadges(): void {
  wx.removeStorageSync(KEY);
}
