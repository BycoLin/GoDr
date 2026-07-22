import type { ArcadeMode, PoetryItem } from './types';
import { getItemsByGrade } from './registry';
import { ROUTES, routePage } from './routes';

export type PoetryPoolTheme = 'myth' | 'classical' | 'accumulation' | 'patriot' | 'story';

export function isAccumulationItem(item: PoetryItem): boolean {
  return item.author === '积累';
}

/** 日积月累里成对出现的对联（偶数行、至少两联） */
export function isCoupletAccumulationItem(item: PoetryItem): boolean {
  return isAccumulationItem(item) && item.lines.length >= 4 && item.lines.length % 2 === 0;
}

export function isNarrativeItem(item: PoetryItem): boolean {
  if (item.author === '课文' || item.author === '文言文') return true;
  if (/节选|司马光|守株|囊萤|铁杵|普罗米修斯|盘古|女娲|西门豹|扁鹊|纪昌|恐龙|巨人|海的女儿|梅兰芳|崛起|麻雀|天都|乡下|天窗|琥珀|雨来|杨氏|叶公|刻舟|两小儿|爬山虎|蟋蟀|陀螺|窝囊|延安|双龙|纳米|桃花|千年梦|曹冲|自相矛盾|牛和鹅|观潮|走月亮|繁星|豆荚|蝙蝠|呼风|蝴蝶|伯牙|戴嵩|滥竽|掩耳|亡羊|男子汉|芦花|挑山/.test(item.title)) return true;
  return false;
}

/** 神话传说类（精卫、女娲、盘古等） */
export function isMythStoryItem(item: PoetryItem): boolean {
  if (/精卫|女娲|盘古|普罗米修斯|夸父|愚公|羿射|后羿|燧人/.test(item.title)) return true;
  return item.author === '课文' && /神话/.test(item.title);
}

/** 小古文/文言短篇（王戎、囊萤、铁杵等，不含神话） */
export function isClassicalProseItem(item: PoetryItem): boolean {
  return item.author === '文言文' && !isMythStoryItem(item);
}

export interface PoetryGameCard {
  mode?: ArcadeMode;
  link?: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
  /** 缩小出题范围，与卡片主题一致 */
  poolTheme?: PoetryPoolTheme;
}

export function filterPoetryPoolByTheme(
  pool: PoetryItem[],
  theme?: PoetryPoolTheme,
): PoetryItem[] {
  if (!theme || !pool.length) return pool;
  let filtered: PoetryItem[] = [];
  if (theme === 'classical') {
    filtered = pool.filter((p) => isClassicalProseItem(p));
  } else if (theme === 'myth') {
    filtered = pool.filter((p) => isMythStoryItem(p));
  } else if (theme === 'accumulation' || (theme as string) === 'idiom') {
    filtered = pool.filter((p) => isCoupletAccumulationItem(p));
    if (!filtered.length) {
      filtered = pool.filter((p) => isAccumulationItem(p) && p.lines.length >= 2);
    }
  } else if (theme === 'patriot') {
    filtered = pool.filter((p) =>
      /出塞|凉州词|示儿|夏日绝句|从军行|塞下曲|边塞/.test(p.title),
    );
  } else if (theme === 'story') {
    filtered = pool.filter((p) => isNarrativeItem(p));
  }
  return filtered.length ? filtered : pool;
}

const THEME_POOL_MIN = 6;

/** 三四年级文言/神话篇目少，补入低年级同类篇目 */
export function expandPoetryThemePool(
  packId: string,
  grade: number,
  pool: PoetryItem[],
  theme: PoetryPoolTheme,
): PoetryItem[] {
  let filtered = filterPoetryPoolByTheme(pool, theme);
  if (filtered.length >= THEME_POOL_MIN || grade < 3) {
    return filtered.length ? filtered : pool;
  }
  if (theme !== 'classical' && theme !== 'myth') {
    return filtered.length ? filtered : pool;
  }

  const ids = new Set(filtered.map((p) => p.id));
  for (let g = grade - 1; g >= 3 && filtered.length < THEME_POOL_MIN; g -= 1) {
    const extra = filterPoetryPoolByTheme(
      getItemsByGrade(packId, g).filter((p) => p.type === 'poetry') as PoetryItem[],
      theme,
    );
    extra.forEach((p) => {
      if (!ids.has(p.id)) {
        ids.add(p.id);
        filtered.push(p);
      }
    });
  }
  return filtered.length ? filtered : pool;
}
const PRE_POETRY_GAMES: PoetryGameCard[] = [
  { link: routePage(ROUTES.pinyin, 'tab=initial'), title: '声母表', desc: '23 个声母认读拼读', tag: '声母', tone: 'm-sky' },
  { link: routePage(ROUTES.pinyin, 'tab=final'), title: '韵母表', desc: '单韵母到鼻韵母', tag: '韵母', tone: 'm-grass' },
  { link: routePage(ROUTES.pinyinDrill, 'kind=initial'), title: '声母认读', desc: '看字选声母', tag: '认读', tone: 'm-coral' },
  { link: routePage(ROUTES.pinyinDrill, 'kind=final'), title: '韵母认读', desc: '看字选韵母', tag: '认读', tone: 'm-sun' },
  { mode: 'mixed', title: '综合练', desc: '多种题型搅一搅', tag: '综合', tone: 'm-teal' },
  { mode: 'poetryPicture', title: '看图猜童谣', desc: '图标猜儿歌古诗', tag: '看图', tone: 'm-grass' },
];

/** 一年级：识字童谣 + 拼音打底，句子短、题型简单 */
const G1_POETRY_GAMES: PoetryGameCard[] = [
  { link: routePage(ROUTES.pinyinDrill, 'kind=initial'), title: '声母认读', desc: 'b p m f 等 23 个声母', tag: '声母', tone: 'm-sky' },
  { link: routePage(ROUTES.pinyinDrill, 'kind=final'), title: '韵母认读', desc: 'a o e 到 ang eng ing', tag: '韵母', tone: 'm-grass' },
  { mode: 'fillNext', title: '下一句接龙', desc: '咏鹅 · 对韵歌 · 江南', tag: '接龙', tone: 'm-coral' },
  { mode: 'poetryPicture', title: '看图猜篇', desc: '图标猜儿歌', tag: '看图', tone: 'm-grass' },
  { mode: 'matchPair', title: '上下句配对', desc: '金木水火土 · 画 · 四季', tag: '配对', tone: 'm-sky' },
  { mode: 'fillBlank', title: '缺字填空', desc: '识字歌谣缺一字', tag: '填空', tone: 'm-orange' },
  { mode: 'titleAuthor', title: '猜诗名', desc: '咏鹅 · 古朗月行 · 风', tag: '猜猜', tone: 'm-grass' },
  { mode: 'mixed', title: '综合练', desc: '一年级课文综合', tag: '综合', tone: 'm-teal' },
];

/** 二年级：五言七言古诗增多，开始练排序 */
const G2_POETRY_GAMES: PoetryGameCard[] = [
  { link: routePage(ROUTES.pinyinDrill, 'kind=final'), title: '韵母巩固', desc: '拼读复习 · 易混韵母', tag: '韵母', tone: 'm-grass' },
  { mode: 'fillNext', title: '下一句接龙', desc: '梅花 · 小儿垂钓 · 登鹳雀楼', tag: '接龙', tone: 'm-coral' },
  { mode: 'matchPair', title: '上下句配对', desc: '场景歌 · 树之歌 · 拍手歌', tag: '配对', tone: 'm-sky' },
  { mode: 'orderLines', title: '诗句排队', desc: '望庐山瀑布 · 江雪 · 夜宿山寺', tag: '排序', tone: 'm-sun' },
  { mode: 'fillBlank', title: '缺字填空', desc: '七言绝句补一字', tag: '填空', tone: 'm-orange' },
  { mode: 'titleAuthor', title: '猜诗名作者', desc: '望天门山 · 赠汪伦 · 村居', tag: '猜猜', tone: 'm-grass' },
  { mode: 'mixed', title: '综合练', desc: '二年级诗词综合', tag: '综合', tone: 'm-teal' },
];

/** 三年级：积累与理解，课文节选、日积月累 */
const G3_POETRY_GAMES: PoetryGameCard[] = [
  { mode: 'fillBlank', title: '诗词填空坊', desc: '所见 · 山行 · 赠刘景文', tag: '填空', tone: 'm-teal' },
  { mode: 'fillNext', title: '下一句接龙', desc: '夜书所见 · 望天门山 · 饮湖上', tag: '接龙', tone: 'm-coral' },
  { mode: 'matchPair', title: '古诗配对赛', desc: '早发白帝城 · 采莲曲 · 司马光', tag: '配对', tone: 'm-sky' },
  { mode: 'orderLines', title: '课文排序师', desc: '秋天的雨 · 司马光', tag: '排序', tone: 'm-sun', poolTheme: 'story' },
  { mode: 'fillBlank', title: '词语积累站', desc: '语文园地 · 成语谚语', tag: '积累', tone: 'm-orange' },
  { mode: 'titleAuthor', title: '猜诗名作者', desc: '古诗三首 · 司马光 · 守株待兔', tag: '猜猜', tone: 'm-grass' },
  { mode: 'mixed', title: '综合练', desc: '三年级诗词综合', tag: '综合', tone: 'm-teal' },
];

/** 四年级：神话、成语、文言文 */
const G4_POETRY_GAMES: PoetryGameCard[] = [
  { mode: 'fillBlank', title: '诗词填空坊', desc: '古诗背诵 · 鹿柴 · 浪淘沙', tag: '填空', tone: 'm-teal' },
  { mode: 'similarChar', title: '形近字找茬', desc: '人/入 · 已/己 · 题/提', tag: '找茬', tone: 'm-sky' },
  { mode: 'matchPair', title: '古诗配对赛', desc: '暮江吟 · 题西林壁 · 雪梅', tag: '配对', tone: 'm-coral' },
  { mode: 'titleAuthor', title: '神话人物谱', desc: '盘古 · 女娲 · 普罗米修斯 · 西门豹', tag: '人物', tone: 'm-grass', poolTheme: 'myth' },
  { mode: 'orderLines', title: '文言排序师', desc: '观潮 · 走月亮 · 挑山工 · 记金华', tag: '文言', tone: 'm-sun', poolTheme: 'story' },
  { mode: 'matchPair', title: '日积月累配对', desc: '对联 · 名言 · 谚语', tag: '积累', tone: 'm-orange', poolTheme: 'accumulation' },
  { mode: 'fillNext', title: '爱国诗词擂台', desc: '出塞 · 凉州词 · 夏日绝句 · 塞下曲', tag: '擂台', tone: 'm-coral', poolTheme: 'patriot' },
  { mode: 'titleAuthor', title: '文言文小侦探', desc: '伯牙鼓琴 · 亡羊补牢 · 曹冲称象', tag: '文言', tone: 'm-sky', poolTheme: 'classical' },
  { mode: 'mixed', title: '综合练', desc: '四年级诗词综合', tag: '综合', tone: 'm-teal' },
];

export function listPoetryGames(grade: number): PoetryGameCard[] {
  if (grade <= 0) return PRE_POETRY_GAMES;
  if (grade === 1) return G1_POETRY_GAMES;
  if (grade === 2) return G2_POETRY_GAMES;
  if (grade === 3) return G3_POETRY_GAMES;
  return G4_POETRY_GAMES;
}

export function poetryPathEnabled(grade: number): boolean {
  return grade > 0 && grade <= 2;
}

export function poetryPathTitle(grade: number): string {
  if (grade >= 4) return '诗词进阶';
  if (grade === 3) return '诗词进阶';
  if (grade === 2) return '拼音巩固';
  return '拼音进阶';
}
