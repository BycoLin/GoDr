import type { EnglishQuizType, MathItem, MathQuizType, PoetryItem, QuizType } from './types';
import {
  filterPoetryPoolByTheme,
  isAccumulationItem,
  isClassicalProseItem,
  isCoupletAccumulationItem,
  isMythStoryItem,
  isNarrativeItem,
  listPoetryGames,
  type PoetryPoolTheme,
} from './poetry-games';
import { listMathThemeUnits } from './math-themes';
import { hasPoetryPicture } from './poetry-pictures';
import { similarCharDrillsForGrade } from './similar-chars';

/** 闯关一局穿插加练/专项/主题题的比例（8 题里约 2–3 题） */
export function levelEnrichCount(total: number): number {
  if (total <= 4) return 1;
  return Math.min(3, Math.max(2, Math.round(total * 0.3)));
}

/** 生成 core/enrich 穿插槽位（首题固定为本关 core，便于热身） */
export function buildEnrichSlots(total: number, enrichCount: number): Array<'core' | 'enrich'> {
  const n = Math.min(enrichCount, Math.max(0, total - 2));
  const slots: Array<'core' | 'enrich'> = Array(total).fill('core');
  if (n <= 0) return slots;
  for (let i = 0; i < n; i += 1) {
    const pos = Math.round(((i + 1) / (n + 1)) * (total - 1));
    slots[Math.max(1, pos)] = 'enrich';
  }
  return slots;
}

export function mergeInterleavedQuestions<T>(
  core: T[],
  enrich: T[],
  total: number,
): T[] {
  const enrichCount = Math.min(enrich.length, levelEnrichCount(total));
  const slots = buildEnrichSlots(total, enrichCount);
  const merged: T[] = [];
  let ci = 0;
  let ei = 0;
  for (const slot of slots) {
    if (slot === 'enrich' && ei < enrich.length) {
      merged.push(enrich[ei]);
      ei += 1;
    } else if (ci < core.length) {
      merged.push(core[ci]);
      ci += 1;
    } else if (ei < enrich.length) {
      merged.push(enrich[ei]);
      ei += 1;
    }
  }
  while (merged.length < total && ci < core.length) {
    merged.push(core[ci]);
    ci += 1;
  }
  while (merged.length < total && ei < enrich.length) {
    merged.push(enrich[ei]);
    ei += 1;
  }
  return merged.slice(0, total);
}

export interface PoetryEnrichPlan {
  modes: QuizType[];
  themes: PoetryPoolTheme[];
}

/** 按年级专项卡片 + 本篇特征，规划闯关穿插题型 */
export function planPoetryLevelEnrich(item: PoetryItem): PoetryEnrichPlan {
  const gameModes = listPoetryGames(item.grade)
    .map((g) => g.mode)
    .filter((m): m is QuizType => Boolean(m && m !== 'mixed'));
  const modes = [...new Set(gameModes)] as QuizType[];
  if (!modes.length) {
    modes.push('fillNext', 'titleAuthor', 'matchPair');
  }
  if (item.grade >= 4 && similarCharDrillsForGrade(item.grade).length && !modes.includes('similarChar')) {
    modes.push('similarChar');
  }
  if (hasPoetryPicture(item) && !modes.includes('poetryPicture')) {
    modes.unshift('poetryPicture');
  }

  const themes: PoetryPoolTheme[] = [];
  if (isMythStoryItem(item)) themes.push('myth');
  if (isClassicalProseItem(item)) themes.push('classical');
  if (isNarrativeItem(item)) themes.push('story');
  if (isCoupletAccumulationItem(item) || isAccumulationItem(item)) themes.push('accumulation');
  if (/出塞|凉州词|示儿|夏日绝句|从军行|塞下曲|边塞/.test(item.title)) {
    themes.push('patriot');
  }
  return { modes, themes };
}

export function buildPoetryEnrichPool(
  item: PoetryItem,
  pool: PoetryItem[],
  themes: PoetryPoolTheme[],
): PoetryItem[] {
  const ids = new Set<string>();
  const enrichPool: PoetryItem[] = [];
  const push = (p: PoetryItem) => {
    if (p.id === item.id || ids.has(p.id)) return;
    ids.add(p.id);
    enrichPool.push(p);
  };

  pool.filter((p) => p.id !== item.id).forEach(push);
  themes.forEach((theme) => {
    filterPoetryPoolByTheme(pool, theme).forEach(push);
  });
  return enrichPool.length ? enrichPool : pool;
}

export interface MathEnrichPlan {
  types: MathQuizType[];
  themeModes: MathQuizType[];
}

/** 主题闯关 + 加练题型，与本关 skill 互补 */
export function planMathLevelEnrich(
  item: MathItem,
  grade: number,
  pool: MathItem[],
  coreTypes: MathQuizType[],
  poolForMode: (pool: MathItem[], mode: MathQuizType) => MathItem[],
): MathEnrichPlan {
  const extras: MathQuizType[] = [];
  const themeModes: MathQuizType[] = [];

  if (grade >= 3) {
    for (const unit of listMathThemeUnits(grade)) {
      for (const game of unit.games) {
        const themed = poolForMode(pool, game.mode);
        if (themed.some((p) => p.id === item.id)) {
          themeModes.push(game.mode);
          if (!coreTypes.includes(game.mode)) extras.push(game.mode);
        }
      }
    }
  }

  if (item.max <= 20 && ['add', 'sub', 'mix', 'compare', 'missing'].includes(item.skill)) {
    if (!coreTypes.includes('mathVisual')) extras.unshift('mathVisual');
  }
  if (item.max <= 50 && !coreTypes.includes('mathSequence')) extras.push('mathSequence');
  if (['add', 'sub', 'mix', 'compare', 'missing'].includes(item.skill) && item.max <= 100) {
    if (!coreTypes.includes('mathCompare')) extras.push('mathCompare');
    if (!coreTypes.includes('mathMissing')) extras.push('mathMissing');
  }

  const types = [...new Set(extras)].slice(0, 4);
  return { types, themeModes: [...new Set(themeModes)] };
}

export function planEnglishLevelEnrich(
  coreTypes: Array<EnglishQuizType | 'matchPair'>,
): Array<EnglishQuizType | 'matchPair'> {
  const all: Array<EnglishQuizType | 'matchPair'> = [
    'enPictureMean',
    'enPictureWord',
    'enPhoneticWord',
    'matchPair',
    'enWordMean',
    'enMeanWord',
    'enSpell',
  ];
  return all.filter((t) => !coreTypes.includes(t)).slice(0, 4);
}
