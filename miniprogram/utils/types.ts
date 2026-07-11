/** 知识包 / 条目 / 题目类型定义 */

export type KnowledgeType = 'poetry' | 'quote' | string;

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

export type KnowledgeItem = PoetryItem;

export type QuizType = 'fillNext' | 'matchPair' | 'titleAuthor';

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

export type Question = FillNextQuestion | MatchPairQuestion | TitleAuthorQuestion;

export interface SessionAnswer {
  questionId: string;
  correct: boolean;
}

export interface PlaySession {
  packId: string;
  grade: number;
  itemId: string;
  mode: QuizType | 'mixed';
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
