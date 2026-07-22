import { loadLastSession } from './progress';
import { ARCADE_MODE_LABELS } from './quiz';
import type { Question, QuizType, SessionAnswer } from './types';

const QUESTION_TYPES: QuizType[] = [
  'fillNext',
  'matchPair',
  'titleAuthor',
  'orderLines',
  'fillBlank',
  'similarChar',
  'mathCalc',
  'mathVisual',
  'mathSequence',
  'mathCompare',
  'mathMissing',
  'mathBigCompare',
  'mathPlaceValue',
  'mathBigRead',
  'mathBigWrite',
  'mathRound',
  'mathLineType',
  'mathGeoRelation',
  'mathAngleClassify',
  'mathAngleMeasure',
  'mathMakeTen',
  'mathBreakTen',
  'mathFlatTen',
  'mathBorrowTen',
  'enWordMean',
  'enMeanWord',
  'enSpell',
];

export interface StoredPlaySession {
  packId: string;
  grade: number;
  itemId?: string;
  arcade?: boolean;
  mode?: string;
  answers?: SessionAnswer[];
  wrongTypes?: QuizType[];
  unitNo?: number;
  unitTest?: boolean;
}

export function isQuizType(value: string): value is QuizType {
  return QUESTION_TYPES.includes(value as QuizType);
}

export function parseTypesQuery(raw?: string): QuizType[] {
  if (!raw) return [];
  const seen = new Set<QuizType>();
  const out: QuizType[] = [];
  raw.split(',').forEach((part) => {
    const t = part.trim();
    if (isQuizType(t) && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  });
  return out;
}

export function encodeTypesQuery(types: QuizType[]): string {
  return encodeURIComponent(types.join(','));
}

export function extractWrongTypes(
  questions: Question[],
  answers: SessionAnswer[],
): QuizType[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const seen = new Set<QuizType>();
  const out: QuizType[] = [];
  answers.forEach((a) => {
    if (a.correct) return;
    const type = byId.get(a.questionId)?.type;
    if (type && isQuizType(type) && !seen.has(type)) {
      seen.add(type);
      out.push(type);
    }
  });
  return out;
}

export function quizTypeLabel(type: QuizType): string {
  return ARCADE_MODE_LABELS[type] || type;
}

export function formatTypesLabel(types: QuizType[]): string {
  return types.map(quizTypeLabel).join('、');
}

export function loadSessionWrongTypes(
  packId: string,
  grade: number,
): QuizType[] {
  const session = loadLastSession<StoredPlaySession>();
  if (!session || session.packId !== packId || session.grade !== grade) {
    return [];
  }
  if (session.wrongTypes?.length) return session.wrongTypes;
  return [];
}

export function buildRematchPlayUrl(opts: {
  packId: string;
  grade: number;
  wrongTypes: QuizType[];
  itemId?: string;
  arcade?: boolean;
  unitNo?: number;
  unitSemester?: 1 | 2;
  unitTest?: boolean;
}): string {
  const { packId, grade, wrongTypes, itemId, arcade, unitNo, unitSemester, unitTest } = opts;
  const types = encodeTypesQuery(wrongTypes);
  let url =
    `/pages/play/play?packId=${packId}&grade=${grade}&rematch=1&types=${types}`;
  if (unitTest && unitNo && unitNo > 0) {
    const sem = unitSemester === 2 ? 2 : 1;
    url += `&mode=unit&unit=${unitNo}&semester=${sem}&arcade=1`;
  } else if (itemId && !arcade) {
    url += `&itemId=${itemId}`;
  } else {
    url += '&mode=mixed&arcade=1';
  }
  return url;
}
