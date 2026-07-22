/** 知识包 / 条目 / 题目类型定义 */

export type KnowledgeType = 'poetry' | 'math' | 'english' | string;

export interface PackManifest {
  id: string;
  title: string;
  subject: string;
  grades: number[];
  version: string;
  description?: string;
  itemCount?: number;
}

export interface PoetryItem {
  id: string;
  type: 'poetry';
  grade: number;
  title: string;
  author: string;
  dynasty?: string;
  lines: string[];
  tags?: string[];
  /** 1=上册（默认），2=下册 */
  semester?: 1 | 2;
  /** 课本单元序号，从 1 起 */
  unit?: number;
}

/** 数学关卡：按技能模板动态出题 */
export type MathSkill =
  | 'add'
  | 'sub'
  | 'mix'
  | 'compare'
  | 'missing'
  | 'makeTen'
  | 'breakTen'
  | 'flatTen'
  | 'borrowTen'
  | 'bigNumber'
  | 'placeValue'
  | 'angle'
  | 'line';

export interface MathItem {
  id: string;
  type: 'math';
  grade: number;
  title: string;
  subtitle?: string;
  skill: MathSkill;
  /** 运算数上限，如 10 / 20 / 100 */
  max: number;
  tags?: string[];
  /** 1=上册（默认），2=下册 */
  semester?: 1 | 2;
  unit?: number;
}

/** 英语单词关卡 */
export interface EnglishItem {
  id: string;
  type: 'english';
  grade: number;
  title: string;
  word: string;
  meaning: string;
  phonetic?: string;
  category?: string;
  tags?: string[];
  /** 1=上册（默认），2=下册 */
  semester?: 1 | 2;
  unit?: number;
}

export type KnowledgeItem = PoetryItem | MathItem | EnglishItem;

/** 关卡混合 / 游戏厅专项玩法 */
export type PoetryQuizType =
  | 'fillNext'
  | 'matchPair'
  | 'titleAuthor'
  | 'orderLines'
  | 'fillBlank'
  | 'similarChar'
  | 'poetryPicture';

export type MathQuizType =
  | 'mathCalc'
  | 'mathCompare'
  | 'mathMissing'
  | 'mathMakeTen'
  | 'mathBreakTen'
  | 'mathFlatTen'
  | 'mathBorrowTen'
  | 'mathVisual'
  | 'mathSequence'
  | 'mathBigCompare'
  | 'mathPlaceValue'
  | 'mathBigRead'
  | 'mathBigWrite'
  | 'mathRound'
  | 'mathLineType'
  | 'mathGeoRelation'
  | 'mathAngleClassify'
  | 'mathAngleMeasure';

export type EnglishQuizType =
  | 'enWordMean'
  | 'enMeanWord'
  | 'enSpell'
  | 'enPictureMean'
  | 'enPictureWord'
  | 'enPhoneticWord';

export type QuizType = PoetryQuizType | MathQuizType | EnglishQuizType;

/** 游戏厅模式（含混合随机 / Boss / 每日 / 对练 / 冲刺 / 模拟卷） */
export type ArcadeMode =
  | QuizType
  | 'mixed'
  | 'boss'
  | 'daily'
  | 'duel'
  | 'sprint'
  | 'exam'
  | 'unit';

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface FillNextQuestion {
  id: string;
  type: 'fillNext';
  itemId: string;
  /**  arcade 专项练时展示出处 */
  sourceTitle?: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
}

export interface MatchPairQuestion {
  id: string;
  type: 'matchPair';
  itemIds: string[];
  left: ChoiceOption[];
  right: ChoiceOption[];
  /** leftId -> rightId */
  answerMap: Record<string, string>;
  /** 日积月累对联配对 */
  couplet?: boolean;
}

export interface TitleAuthorQuestion {
  id: string;
  type: 'titleAuthor';
  itemId: string;
  mode: 'title' | 'author';
  prompt: string;
  /** 题型角标，如猜故事 / 猜篇名 */
  typeLabel?: string;
  /** 展示用的诗句/文段摘录 */
  excerpt: string;
  options: ChoiceOption[];
  answerId: string;
}

/** 打乱诗句，按正确顺序点选 */
export interface OrderLinesQuestion {
  id: string;
  type: 'orderLines';
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  /** 正确顺序的 option id 列表 */
  answerOrder: string[];
  /** 课文/故事排序（非古诗） */
  narrative?: boolean;
}

/** 诗句缺字填空 */
export interface FillBlankQuestion {
  id: string;
  type: 'fillBlank';
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
}

/** 形近字找茬：句中混入形近错字，选出正确字 */
export interface SimilarCharQuestion {
  id: string;
  type: 'similarChar';
  itemId: string;
  sourceTitle?: string;
  /** 题干说明 */
  prompt: string;
  /** 含错字的句子，单独展示 */
  displayLine: string;
  /** 错字在 displayLine 中的下标 */
  wrongIdx: number;
  /** 逐字展示用 */
  displayChars: string[];
  options: ChoiceOption[];
  answerId: string;
}

/** 看图猜篇：emoji 场景选诗名/童谣名 */
export interface PoetryPictureQuestion {
  id: string;
  type: 'poetryPicture';
  itemId: string;
  prompt: string;
  visualEmoji: string;
  options: ChoiceOption[];
  answerId: string;
}

/** 数学选择题（计算 / 比较 / 填空）共用 */
export interface MathDiagram {
  kind: 'line' | 'parallel' | 'angle';
  lineKind?: 'segment' | 'ray' | 'line';
  relation?: 'parallel' | 'perpendicular';
  angleDeg?: number;
  /** 情境标识，便于同题型多场景去重 */
  scene?: string;
}

export interface MathChoiceQuestion {
  id: string;
  type: Exclude<
    MathQuizType,
    'mathVisual' | 'mathSequence' | 'mathBigWrite' | 'mathAngleMeasure'
  >;
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
  /** 几何题配图（线条 / 平行垂直 / 角的分类） */
  diagram?: MathDiagram;
  /** 大数比大小：左侧数字 */
  compareLeft?: string;
  /** 大数比大小：右侧数字 */
  compareRight?: string;
  /** 数位认识：带高亮的数字展示 */
  placeValueChars?: Array<{ text: string; hi: boolean }>;
}

/** 看图口算（数图 / 凑十 / 数轴） */
export interface MathVisualQuestion {
  id: string;
  type: 'mathVisual';
  itemId: string;
  op: 'sub' | 'add' | 'makeTen' | 'compare';
  prompt: string;
  a: number;
  b: number;
  answer: number;
  icon: string;
  /** 减法：图标列表，gone 表示被拿走 */
  icons?: Array<{ id: number; gone: boolean }>;
  /** 加法：两组图标 */
  iconsA?: Array<{ id: number }>;
  iconsB?: Array<{ id: number }>;
  /** 凑十法：十格框 */
  tenFrame?: Array<{ id: number; filled: boolean; highlight: boolean }>;
  /** 凑十法：十格框外的圆点 */
  outsideDots?: Array<{ id: number }>;
  /** 比大小：数轴刻度 */
  lineTicks?: Array<{ value: number; pct: number }>;
  lineMin?: number;
  lineMax?: number;
  left?: number;
  right?: number;
  leftPct?: number;
  rightPct?: number;
  compareAnswer?: '>' | '<' | '=';
}

/** 数字排队：按规律填空缺 */
export interface MathSequenceQuestion {
  id: string;
  type: 'mathSequence';
  itemId: string;
  prompt: string;
  step: number;
  slots: Array<{ index: number; show: boolean; value: number | null }>;
  blankIndexes: number[];
  answers: number[];
}

/** 拼图工坊：按读法写大数 */
export interface MathBigWriteQuestion {
  id: string;
  type: 'mathBigWrite';
  itemId: string;
  prompt: string;
  readText: string;
  puzzlePieces: Array<{ id: number; text: string }>;
  answer: number;
}

/** 量角器：图形读度数 */
export interface MathAngleMeasureQuestion {
  id: string;
  type: 'mathAngleMeasure';
  itemId: string;
  prompt: string;
  angleDeg: number;
  options: ChoiceOption[];
  answerId: string;
  ticks: Array<{ id: number; deg: number; label: string; major: boolean }>;
}

/** 英语选择题（看词选义 / 看义选词 / 缺字母 / 看图 / 音标）共用 */
export interface EnglishChoiceQuestion {
  id: string;
  type: EnglishQuizType;
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
  /** 看图题：大 emoji 展示 */
  visualEmoji?: string;
}

export type Question =
  | FillNextQuestion
  | MatchPairQuestion
  | TitleAuthorQuestion
  | OrderLinesQuestion
  | FillBlankQuestion
  | SimilarCharQuestion
  | PoetryPictureQuestion
  | MathChoiceQuestion
  | MathVisualQuestion
  | MathSequenceQuestion
  | MathBigWriteQuestion
  | MathAngleMeasureQuestion
  | EnglishChoiceQuestion;

export interface SessionAnswer {
  questionId: string;
  correct: boolean;
}

export interface PlaySession {
  packId: string;
  grade: number;
  itemId: string;
  mode: ArcadeMode;
  questions: Question[];
  answers: SessionAnswer[];
  startedAt: number;
}

export interface ItemProgress {
  stars: number;
  bestCorrect: number;
  bestTotal: number;
  cleared: boolean;
  lastPlayedAt: number;
}

export interface PackProgress {
  clearedIds: string[];
  stars: Record<string, number>;
  items: Record<string, ItemProgress>;
  lastPlayedAt: number;
  lastGrade?: number;
  lastItemId?: string;
}

/** 供微信依赖分析识别（纯类型文件需保留一条运行时导出） */
export const TYPE_MODULE = 1;
