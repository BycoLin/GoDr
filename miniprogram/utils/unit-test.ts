import {
  getItemsByGrade,
  getPackSubjectKind,
  isEnglish,
  isMath,
  isPoetry,
} from './registry';
import { buildQuizForItem } from './quiz';
import { buildMathQuizForItem } from './quiz-math';
import { buildEnglishQuizForItem } from './quiz-english';
import type {
  EnglishItem,
  KnowledgeItem,
  MathItem,
  PoetryItem,
  Question,
} from './types';

/** 每套单元测验固定题量 */
export const UNIT_QUESTION_COUNT = 10;

export interface UnitInfo {
  unit: number;
  title: string;
  itemCount: number;
  questionCount: number;
}

export interface UnitTestRecord {
  bestCorrect: number;
  bestTotal: number;
  bestPercent: number;
  attempts: number;
  lastAt: number;
}

const KEY_PREFIX = 'unitTest:';

function storageKey(packId: string): string {
  return `${KEY_PREFIX}${packId}`;
}

function recordKey(grade: number, unit: number): string {
  return `${grade}:${unit}`;
}

export function getItemUnit(item: KnowledgeItem): number {
  const u = (item as { unit?: number }).unit;
  if (u != null && Number.isFinite(Number(u)) && Number(u) > 0) {
    return Number(u);
  }
  return 1;
}

export function unitTitle(unit: number): string {
  return `第 ${unit} 单元`;
}

export function getUnitItems(
  packId: string,
  grade: number,
  unit: number,
): KnowledgeItem[] {
  return getItemsByGrade(packId, grade)
    .filter((item) => getItemUnit(item) === unit)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function listUnits(packId: string, grade: number): UnitInfo[] {
  const items = getItemsByGrade(packId, grade);
  const map = new Map<number, KnowledgeItem[]>();
  items.forEach((item) => {
    const u = getItemUnit(item);
    const list = map.get(u) || [];
    list.push(item);
    map.set(u, list);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([unit, unitItems]) => ({
      unit,
      title: unitTitle(unit),
      itemCount: unitItems.length,
      questionCount: UNIT_QUESTION_COUNT,
    }));
}

function loadAllRecords(packId: string): Record<string, UnitTestRecord> {
  try {
    const data = wx.getStorageSync(storageKey(packId)) as
      | { records?: Record<string, UnitTestRecord> }
      | '';
    return data && typeof data === 'object' && data.records ? data.records : {};
  } catch {
    return {};
  }
}

export function getUnitRecord(
  packId: string,
  grade: number,
  unit: number,
): UnitTestRecord | null {
  const rec = loadAllRecords(packId)[recordKey(grade, unit)];
  return rec || null;
}

export function recordUnitTestResult(
  packId: string,
  grade: number,
  unit: number,
  correct: number,
  total: number,
): UnitTestRecord {
  const records = loadAllRecords(packId);
  const rk = recordKey(grade, unit);
  const prev = records[rk];
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const next: UnitTestRecord = {
    bestCorrect: Math.max(prev?.bestCorrect ?? 0, correct),
    bestTotal: total,
    bestPercent: Math.max(prev?.bestPercent ?? 0, percent),
    attempts: (prev?.attempts ?? 0) + 1,
    lastAt: Date.now(),
  };
  records[rk] = next;
  wx.setStorageSync(storageKey(packId), { records });
  return next;
}

/** 按单元抽固定题量；题目只来自该单元知识点 */
export function buildUnitQuiz(
  packId: string,
  grade: number,
  unit: number,
): Question[] {
  const items = getUnitItems(packId, grade, unit);
  if (!items.length) return [];

  const poetryPool = items.filter(isPoetry) as PoetryItem[];
  const englishPool = items.filter(isEnglish) as EnglishItem[];

  const questions: Question[] = [];
  let guard = 0;
  let cursor = 0;
  while (questions.length < UNIT_QUESTION_COUNT && guard < UNIT_QUESTION_COUNT * 8) {
    guard += 1;
    const item = items[cursor % items.length];
    cursor += 1;
    let batch: Question[] = [];
    if (isMath(item)) {
      batch = buildMathQuizForItem(item as MathItem, 1);
    } else if (isEnglish(item)) {
      batch = buildEnglishQuizForItem(
        item as EnglishItem,
        englishPool.length ? englishPool : [item as EnglishItem],
        1,
      );
    } else if (isPoetry(item)) {
      batch = buildQuizForItem(
        item as PoetryItem,
        poetryPool.length ? poetryPool : [item as PoetryItem],
        { count: 1, rampHard: false },
      );
    }
    if (batch[0]) questions.push(batch[0]);
  }
  return questions.slice(0, UNIT_QUESTION_COUNT);
}

export function unitTestNavTitle(
  packId: string,
  grade: number,
  unit: number,
): string {
  const kind = getPackSubjectKind(packId);
  const gradeLabel =
    grade === 0 ? '幼小衔接' : `${grade} 年级`;
  const subShort =
    kind === 'math' ? '数学' : kind === 'english' ? '英语' : '语文';
  return `${subShort} · ${gradeLabel} · ${unitTitle(unit)}`;
}
