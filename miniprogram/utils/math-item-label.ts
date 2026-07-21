import type { MathItem, MathSkill } from './types';

const SKILL_LABELS: Record<MathSkill, string> = {
  add: '加法',
  sub: '减法',
  mix: '加减混合',
  compare: '比大小',
  missing: '填空',
  makeTen: '凑十法',
  breakTen: '破十法',
  flatTen: '平十法',
  borrowTen: '借十法',
  bigNumber: '大数的认识',
  placeValue: '数位与计数',
  angle: '角的认识',
  line: '线的认识',
};

const LEGACY_TAIL_LABELS: Record<string, string> = {
  加法: '加法',
  减法: '减法',
  混合: '加减混合',
  比大小: '比大小',
  填空: '填空',
  凑十法: '凑十法',
  破十法: '破十法',
  平十法: '平十法',
  借十法: '借十法',
  大数: '大数的认识',
  数位: '数位与计数',
  角: '角的认识',
  线: '线的认识',
};

/** 10000 → 1万，100000000 → 1亿 */
export function formatMaxChinese(max: number): string {
  if (!Number.isFinite(max) || max <= 0) return String(max);
  if (max >= 100000000 && max % 100000000 === 0) {
    return `${max / 100000000}亿`;
  }
  if (max >= 10000 && max % 10000 === 0) {
    return `${max / 10000}万`;
  }
  if (max >= 10000) {
    const wan = max / 10000;
    return `${Number.isInteger(wan) ? wan : wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  return String(max);
}

function isThemeSkill(skill: MathSkill): boolean {
  return skill === 'bigNumber' || skill === 'placeValue' || skill === 'angle' || skill === 'line';
}

/** 数学关卡展示标题（地图 / 进度 / 导航栏） */
export function displayMathItemTitle(item: MathItem): string {
  const label = SKILL_LABELS[item.skill] || item.skill;
  const maxLabel = formatMaxChinese(item.max);
  if (item.max >= 10000 || isThemeSkill(item.skill)) {
    return `${label}·${maxLabel}`;
  }
  return `${maxLabel}以内${label}`;
}

/** 兼容旧数据里「1000000以内角」这类标题 */
export function beautifyMathTitle(title: string): string {
  const m = title.match(/^(\d+)以内(.+)$/);
  if (!m) return title;
  const max = Number(m[1]);
  const tail = m[2].replace(/强化$|·\d+$/, '').trim();
  const label = LEGACY_TAIL_LABELS[tail] || tail;
  const maxLabel = formatMaxChinese(max);
  if (max >= 10000 || ['角', '线', '大数', '数位'].includes(tail)) {
    return `${label}·${maxLabel}`;
  }
  return `${maxLabel}以内${label}`;
}

export function resolveMathDisplayTitle(item: MathItem): string {
  return displayMathItemTitle(item);
}
