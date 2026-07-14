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
}

/** 数学关卡：按技能模板动态出题 */
export type MathSkill = 'add' | 'sub' | 'mix' | 'compare' | 'missing';

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
}

export type KnowledgeItem = PoetryItem | MathItem | EnglishItem;

/** 关卡混合 / 游戏厅专项玩法 */
export type PoetryQuizType =
  | 'fillNext'
  | 'matchPair'
  | 'titleAuthor'
  | 'orderLines'
  | 'fillBlank';

export type MathQuizType = 'mathCalc' | 'mathCompare' | 'mathMissing';

export type EnglishQuizType = 'enWordMean' | 'enMeanWord' | 'enSpell';

export type QuizType = PoetryQuizType | MathQuizType | EnglishQuizType;

/** 游戏厅模式（含混合随机 / Boss / 每日 / 对练 / 冲刺 / 模拟卷） */
export type ArcadeMode =
  | QuizType
  | 'mixed'
  | 'boss'
  | 'daily'
  | 'duel'
  | 'sprint'
  | 'exam';

export interface ChoiceOption {
  id: string;
  text: string;
}

export interface FillNextQuestion {
  id: string;
  type: 'fillNext';
  itemId: string;
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
}

export interface TitleAuthorQuestion {
  id: string;
  type: 'titleAuthor';
  itemId: string;
  mode: 'title' | 'author';
  prompt: string;
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

/** 数学选择题（计算 / 比较 / 填空）共用 */
export interface MathChoiceQuestion {
  id: string;
  type: MathQuizType;
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
}

/** 英语选择题（看词选义 / 看义选词 / 缺字母）共用 */
export interface EnglishChoiceQuestion {
  id: string;
  type: EnglishQuizType;
  itemId: string;
  prompt: string;
  options: ChoiceOption[];
  answerId: string;
}

export type Question =
  | FillNextQuestion
  | MatchPairQuestion
  | TitleAuthorQuestion
  | OrderLinesQuestion
  | FillBlankQuestion
  | MathChoiceQuestion
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
