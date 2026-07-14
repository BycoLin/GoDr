import { listPacks } from './registry';
import { loadPackProgress } from './progress';

export interface RankInfo {
  level: number;
  title: string;
  tip: string;
  totalStars: number;
  nextAt: number;
  /** 0-100 距下一段位 */
  percent: number;
}

/** 学段名偏学习向，避免游戏王者感 */
const RANKS: Array<{ minStars: number; title: string; tip: string }> = [
  { minStars: 0, title: '新芽', tip: '开始练习就能升级' },
  { minStars: 10, title: '勤学', tip: '坚持练，星星会发光' },
  { minStars: 30, title: '小达人', tip: '已经很棒啦' },
  { minStars: 60, title: '学霸', tip: '继续冲刺下一程' },
  { minStars: 100, title: '状元', tip: '超级厉害！' },
];

export function sumAllStars(): number {
  return listPacks().reduce((sum, pack) => {
    const progress = loadPackProgress(pack.id);
    const fromMap = Object.values(progress.stars || {}).reduce((s, n) => s + (n || 0), 0);
    if (fromMap > 0) return sum + fromMap;
    // 兼容旧数据：cleared 按 1 星估
    return sum + (progress.clearedIds?.length || 0);
  }, 0);
}

export function getRankInfo(totalStars = sumAllStars()): RankInfo {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (totalStars >= RANKS[i].minStars) idx = i;
  }
  const cur = RANKS[idx];
  const next = RANKS[idx + 1];
  const nextAt = next ? next.minStars : cur.minStars;
  const span = next ? next.minStars - cur.minStars : 1;
  const gained = totalStars - cur.minStars;
  const percent = next ? Math.min(100, Math.round((gained / span) * 100)) : 100;
  return {
    level: idx + 1,
    title: cur.title,
    tip: next ? `再集 ${Math.max(0, nextAt - totalStars)} 星升「${next.title}」` : cur.tip,
    totalStars,
    nextAt,
    percent,
  };
}
