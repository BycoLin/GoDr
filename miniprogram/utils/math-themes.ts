import type { MathQuizType } from './types';

export interface MathThemeGame {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  mode: MathQuizType;
  tone: string;
  /** 选题池：item.max 下限（含） */
  minCap?: number;
  /** 选题池：item.max 上限（含） */
  maxCap?: number;
}

export interface MathThemeUnit {
  id: string;
  grade: number;
  title: string;
  games: MathThemeGame[];
}

const GRADE_3_THEMES: MathThemeUnit[] = [
  {
    id: 'g3-u1-number',
    grade: 3,
    title: '第一单元 · 万以内数',
    games: [
      {
        id: 'g3-seq',
        title: '数字巡逻车',
        subtitle: '按规律填数',
        tag: '数列',
        mode: 'mathSequence',
        tone: 'm-teal',
      },
      {
        id: 'g3-cmp',
        title: '数字赛车场',
        subtitle: '比大小',
        tag: '比较',
        mode: 'mathCompare',
        tone: 'm-sun',
      },
      {
        id: 'g3-miss',
        title: '缺数寻宝',
        subtitle: '算式填空',
        tag: '填空',
        mode: 'mathMissing',
        tone: 'm-coral',
      },
    ],
  },
];

const GRADE_4_THEMES: MathThemeUnit[] = [
  {
    id: 'g4-u1-big',
    grade: 4,
    title: '第一单元 · 大数的认识',
    games: [
      {
        id: 'g4-place',
        title: '数字巡逻车',
        subtitle: '数位与计数单位',
        tag: '数位',
        mode: 'mathPlaceValue',
        tone: 'm-teal',
        minCap: 10000,
        maxCap: 999999,
      },
      {
        id: 'g4-read',
        title: '大数收货员',
        subtitle: '大数的读法',
        tag: '读法',
        mode: 'mathBigRead',
        tone: 'm-sky',
        minCap: 10000,
        maxCap: 999999,
      },
      {
        id: 'g4-write',
        title: '数字拼图工坊',
        subtitle: '大数的写法',
        tag: '写法',
        mode: 'mathBigWrite',
        tone: 'm-grass',
        minCap: 100000,
        maxCap: 9999999,
      },
      {
        id: 'g4-cmp',
        title: '数字赛车场',
        subtitle: '大数比较大小',
        tag: '比较',
        mode: 'mathBigCompare',
        tone: 'm-sun',
        minCap: 100000,
        maxCap: 99999999,
      },
      {
        id: 'g4-round',
        title: '魔法改写屋',
        subtitle: '改写与近似数',
        tag: '近似',
        mode: 'mathRound',
        tone: 'm-orange',
        minCap: 1000000,
        maxCap: 99999999,
      },
    ],
  },
  {
    id: 'g4-u2-line',
    grade: 4,
    title: '第二单元 · 线与角',
    games: [
      {
        id: 'g4-line',
        title: '线条分类站',
        subtitle: '直线射线线段',
        tag: '线条',
        mode: 'mathLineType',
        tone: 'm-sky',
      },
      {
        id: 'g4-geo',
        title: '建造桥梁',
        subtitle: '平行与垂直',
        tag: '平行',
        mode: 'mathGeoRelation',
        tone: 'm-grass',
      },
      {
        id: 'g4-angle',
        title: '角度射击场',
        subtitle: '角的分类',
        tag: '分类',
        mode: 'mathAngleClassify',
        tone: 'm-coral',
      },
      {
        id: 'g4-measure',
        title: '量角器小工匠',
        subtitle: '角的度量',
        tag: '度量',
        mode: 'mathAngleMeasure',
        tone: 'm-orange',
      },
    ],
  },
];

const ALL_THEMES = [...GRADE_3_THEMES, ...GRADE_4_THEMES];

export function listMathThemeUnits(grade: number): MathThemeUnit[] {
  return ALL_THEMES.filter((u) => u.grade === grade);
}

export function findThemeGame(mode: MathQuizType): MathThemeGame | undefined {
  for (const unit of ALL_THEMES) {
    const game = unit.games.find((g) => g.mode === mode);
    if (game) return game;
  }
  return undefined;
}
