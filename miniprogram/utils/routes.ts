/** 分包页面完整路径（迁分包后跳转必须带 root 前缀） */

export const ROUTES = {
  pinyin: '/package-pinyin/pages/pinyin/pinyin',
  pinyinLearn: '/package-pinyin/pages/pinyin-learn/pinyin-learn',
  pinyinDrill: '/package-pinyin/pages/pinyin-drill/pinyin-drill',
  flashcard: '/package-extra/pages/flashcard/flashcard',
  wrongbook: '/package-extra/pages/wrongbook/wrongbook',
  visualMath: '/package-extra/pages/visual-math/visual-math',
  numberLine: '/package-extra/pages/number-line/number-line',
  mono: '/package-extra/pages/mono/mono',
  skillPath: '/package-extra/pages/skill-path/skill-path',
  unitTest: '/package-extra/pages/unit-test/unit-test',
  tools: '/package-extra/pages/tools/tools',
} as const;

/** 拼接 query，支持 `?a=1` 或 `a=1` */
export function routePage(base: string, query = ''): string {
  if (!query) return base;
  return query.startsWith('?') ? `${base}${query}` : `${base}?${query}`;
}

/** 供微信依赖分析识别 */
export const ROUTE_MODULE = 1;
