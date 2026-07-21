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
import { pickItemsForSession, registerQuestion } from './quiz-session';
import type {
  EnglishItem,
  KnowledgeItem,
  MathItem,
  PoetryItem,
  Question,
} from './types';

/** 每套单元测验固定题量 */
export const UNIT_QUESTION_COUNT = 10;

export type ItemSemester = 1 | 2;

export interface UnitInfo {
  unit: number;
  semester: ItemSemester;
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

function recordKey(grade: number, unit: number, semester: ItemSemester): string {
  return `${grade}:${semester}:${unit}`;
}

export function getItemSemester(item: KnowledgeItem): ItemSemester {
  const s = (item as { semester?: number }).semester;
  if (s === 2) return 2;
  if (item.tags?.includes('下册')) return 2;
  return 1;
}

export function getItemUnit(item: KnowledgeItem): number {
  const u = (item as { unit?: number }).unit;
  if (u != null && Number.isFinite(Number(u)) && Number(u) > 0) {
    return Number(u);
  }
  return 1;
}

export function unitTitle(unit: number, semester: ItemSemester = 1): string {
  const book = semester === 2 ? '下册' : '上册';
  return `${book}第 ${unit} 单元`;
}

export function getUnitItems(
  packId: string,
  grade: number,
  unit: number,
  semester: ItemSemester = 1,
): KnowledgeItem[] {
  return getItemsByGrade(packId, grade)
    .filter(
      (item) =>
        getItemUnit(item) === unit && getItemSemester(item) === semester,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function listUnits(packId: string, grade: number): UnitInfo[] {
  const items = getItemsByGrade(packId, grade);
  const map = new Map<string, KnowledgeItem[]>();
  items.forEach((item) => {
    const semester = getItemSemester(item);
    const unit = getItemUnit(item);
    const key = `${semester}:${unit}`;
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  });
  return Array.from(map.entries())
    .sort((a, b) => {
      const [sa, ua] = a[0].split(':').map(Number);
      const [sb, ub] = b[0].split(':').map(Number);
      return sa - sb || ua - ub;
    })
    .map(([key, unitItems]) => {
      const [semesterStr, unitStr] = key.split(':');
      const semester = Number(semesterStr) as ItemSemester;
      const unit = Number(unitStr);
      return {
        unit,
        semester,
        title: unitTitle(unit, semester),
        itemCount: unitItems.length,
        questionCount: UNIT_QUESTION_COUNT,
      };
    });
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
  semester: ItemSemester = 1,
): UnitTestRecord | null {
  const rec = loadAllRecords(packId)[recordKey(grade, unit, semester)];
  if (rec) return rec;
  // 兼容旧版仅 grade:unit 的记录（视为上册）
  if (semester === 1) {
    return loadAllRecords(packId)[`${grade}:${unit}`] || null;
  }
  return null;
}

export function recordUnitTestResult(
  packId: string,
  grade: number,
  unit: number,
  correct: number,
  total: number,
  semester: ItemSemester = 1,
): UnitTestRecord {
  const records = loadAllRecords(packId);
  const rk = recordKey(grade, unit, semester);
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
  semester: ItemSemester = 1,
): Question[] {
  const items = getUnitItems(packId, grade, unit, semester);
  if (!items.length) return [];

  const poetryPool = items.filter(isPoetry) as PoetryItem[];
  const englishPool = items.filter(isEnglish) as EnglishItem[];

  const usedKeys = new Set<string>();
  const questions: Question[] = [];
  const order = pickItemsForSession(items, UNIT_QUESTION_COUNT * 3);
  let guard = 0;
  let cursor = 0;

  while (questions.length < UNIT_QUESTION_COUNT && guard < UNIT_QUESTION_COUNT * 24) {
    guard += 1;
    const item = order[cursor % order.length];
    cursor += 1;
    let batch: Question[] = [];
    if (isMath(item)) {
      batch = buildMathQuizForItem(item as MathItem, 3);
    } else if (isEnglish(item)) {
      batch = buildEnglishQuizForItem(
        item as EnglishItem,
        englishPool.length ? englishPool : [item as EnglishItem],
        3,
      );
    } else if (isPoetry(item)) {
      batch = buildQuizForItem(
        item as PoetryItem,
        poetryPool.length ? poetryPool : [item as PoetryItem],
        { count: 3, rampHard: false },
      );
    }
    for (const q of batch) {
      if (registerQuestion(usedKeys, q)) {
        questions.push(q);
        if (questions.length >= UNIT_QUESTION_COUNT) break;
      }
    }
  }
  return questions.slice(0, UNIT_QUESTION_COUNT);
}

export function unitTestNavTitle(
  packId: string,
  grade: number,
  unit: number,
  semester: ItemSemester = 1,
): string {
  const kind = getPackSubjectKind(packId);
  const gradeLabel =
    grade === 0 ? '幼小衔接' : `${grade} 年级`;
  const subShort =
    kind === 'math' ? '数学' : kind === 'english' ? '英语' : '语文';
  return `${subShort} · ${gradeLabel} · ${unitTitle(unit, semester)}`;
}
