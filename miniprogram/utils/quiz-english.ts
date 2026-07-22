import type {
  ArcadeMode,
  ChoiceOption,
  EnglishChoiceQuestion,
  EnglishItem,
  EnglishQuizType,
  MatchPairQuestion,
  Question,
  QuizType,
} from './types';
import {
  buildTypeSchedule,
  pickItemsForSession,
  registerQuestion,
  shuffle as sessionShuffle,
} from './quiz-session';
import { emojiForEnglishItem } from './english-pictures';
import {
  levelEnrichCount,
  mergeInterleavedQuestions,
  planEnglishLevelEnrich,
} from './level-enrich';

const EN_QUIZ_TYPES: EnglishQuizType[] = [
  'enPictureMean',
  'enPictureWord',
  'enPhoneticWord',
  'enWordMean',
  'enMeanWord',
  'enSpell',
];

function isEnQuizType(t: string): t is EnglishQuizType {
  return EN_QUIZ_TYPES.includes(t as EnglishQuizType);
}
const EN_MIXED_TYPES: Array<EnglishQuizType | 'matchPair'> = [
  ...EN_QUIZ_TYPES,
  'matchPair',
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function pickDistractors(pool: EnglishItem[], excludeId: string, count: number): EnglishItem[] {
  return shuffle(pool.filter((p) => p.id !== excludeId)).slice(0, count);
}

function toOptions(
  answerText: string,
  distractorTexts: string[],
): { options: ChoiceOption[]; answerId: string } {
  const answerId = 'ans';
  const options = shuffle([
    { id: answerId, text: answerText },
    ...distractorTexts.map((text, i) => ({ id: `d${i}`, text })),
  ]);
  return { options, answerId };
}

export function makeEnWordMean(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.meaning);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.meaning, distractors);
  return {
    id: uid('enwm'),
    type: 'enWordMean',
    itemId: item.id,
    prompt: `“${item.word}” 是什么意思？`,
    options,
    answerId,
  };
}

export function makeEnMeanWord(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.word);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.word, distractors);
  return {
    id: uid('enmw'),
    type: 'enMeanWord',
    itemId: item.id,
    prompt: `“${item.meaning}” 用英语怎么说？`,
    options,
    answerId,
  };
}

const LETTER_POOL = 'abcdefghijklmnopqrstuvwxyz';

export function makeEnSpell(item: EnglishItem): EnglishChoiceQuestion | null {
  const word = item.word.toLowerCase();
  if (word.length < 3) return null;
  const idx = Math.floor(Math.random() * word.length);
  const answer = word[idx];
  const blanked = `${word.slice(0, idx)}□${word.slice(idx + 1)}`;
  const set = new Set<string>([answer]);
  let guard = 0;
  while (set.size < 4 && guard < 30) {
    guard += 1;
    const ch = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
    if (ch !== answer) set.add(ch);
  }
  const { options, answerId } = toOptions(
    answer,
    Array.from(set).filter((c) => c !== answer),
  );
  return {
    id: uid('ensp'),
    type: 'enSpell',
    itemId: item.id,
    prompt: `补全单词：${blanked}\n（${item.meaning}）`,
    options,
    answerId,
  };
}

export function makeEnMatch(pool: EnglishItem[]): MatchPairQuestion | null {
  if (pool.length < 3) return null;
  const picked = shuffle(pool).slice(0, Math.min(4, pool.length));
  return buildEnMatchFromItems(picked);
}

/** 错题复习：配对题必须包含指定单词 */
export function makeEnMatchForItem(item: EnglishItem, pool: EnglishItem[]): MatchPairQuestion | null {
  const others = pool.filter((p) => p.id !== item.id);
  if (others.length < 2) return makeEnMatch(pool);
  const picked = [item, ...shuffle(others).slice(0, Math.min(3, others.length))];
  return buildEnMatchFromItems(picked);
}

function buildEnMatchFromItems(picked: EnglishItem[]): MatchPairQuestion | null {
  if (picked.length < 2) return null;
  const left = shuffle(picked.map((p) => ({ id: `L_${p.id}`, text: p.word })));
  const right = shuffle(picked.map((p) => ({ id: `R_${p.id}`, text: p.meaning })));
  const answerMap: Record<string, string> = {};
  picked.forEach((p) => {
    answerMap[`L_${p.id}`] = `R_${p.id}`;
  });
  return {
    id: uid('enmp'),
    type: 'matchPair',
    itemIds: picked.map((p) => p.id),
    left,
    right,
    answerMap,
  };
}

export function makeEnPictureMean(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const emoji = emojiForEnglishItem(item);
  if (!emoji) return null;
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.meaning);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.meaning, distractors);
  return {
    id: uid('enpm'),
    type: 'enPictureMean',
    itemId: item.id,
    prompt: '看图选意思',
    visualEmoji: emoji,
    options,
    answerId,
  };
}

export function makeEnPictureWord(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const emoji = emojiForEnglishItem(item);
  if (!emoji) return null;
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.word);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.word, distractors);
  return {
    id: uid('enpw'),
    type: 'enPictureWord',
    itemId: item.id,
    prompt: '看图选单词',
    visualEmoji: emoji,
    options,
    answerId,
  };
}

export function makeEnPhoneticWord(
  item: EnglishItem,
  pool: EnglishItem[],
): EnglishChoiceQuestion | null {
  const phonetic = item.phonetic?.trim();
  if (!phonetic || phonetic.length < 3) return null;
  const distractors = pickDistractors(pool, item.id, 3).map((d) => d.word);
  if (distractors.length < 2) return null;
  const { options, answerId } = toOptions(item.word, distractors);
  return {
    id: uid('enph'),
    type: 'enPhoneticWord',
    itemId: item.id,
    prompt: `听音标选单词：${phonetic}`,
    options,
    answerId,
  };
}

function makeByType(
  type: EnglishQuizType | 'matchPair',
  item: EnglishItem,
  pool: EnglishItem[],
): Question | null {
  if (type === 'enWordMean') return makeEnWordMean(item, pool);
  if (type === 'enMeanWord') return makeEnMeanWord(item, pool);
  if (type === 'enSpell') return makeEnSpell(item);
  if (type === 'enPictureMean') {
    return makeEnPictureMean(item, pool) || makeEnWordMean(item, pool);
  }
  if (type === 'enPictureWord') {
    return makeEnPictureWord(item, pool) || makeEnMeanWord(item, pool);
  }
  if (type === 'enPhoneticWord') {
    return makeEnPhoneticWord(item, pool) || makeEnWordMean(item, pool);
  }
  if (type === 'matchPair') return makeEnMatchForItem(item, pool);
  return null;
}

function preferredType(index: number): EnglishQuizType | 'matchPair' {
  return EN_MIXED_TYPES[index % EN_MIXED_TYPES.length];
}

function isEnArcadeMode(mode: ArcadeMode): mode is EnglishQuizType | 'matchPair' {
  return mode === 'matchPair' || isEnQuizType(mode);
}

export interface BuildEnglishQuizOptions {
  enrich?: boolean;
}

export function buildEnglishQuizForItem(
  item: EnglishItem,
  pool: EnglishItem[],
  count = 8,
  preferTypes?: Array<EnglishQuizType | 'matchPair'>,
  options?: BuildEnglishQuizOptions,
): Question[] {
  const fullPool = pool.length ? pool : [item];
  const types = preferTypes?.filter(
    (t): t is EnglishQuizType | 'matchPair' => t === 'matchPair' || isEnQuizType(t),
  );
  const coreTypes = types?.length ? types : EN_MIXED_TYPES;
  const typeSchedule = buildTypeSchedule(coreTypes, count * 3);

  const buildCore = (target: number, usedKeys: Set<string>): Question[] => {
    const questions: Question[] = [];
    let guard = 0;
    while (questions.length < target && guard < target * 20) {
      guard += 1;
      const type = typeSchedule[guard % typeSchedule.length];
      const q =
        type === 'matchPair'
          ? makeEnMatch(fullPool)
          : makeByType(type, item, fullPool);
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const buildEnrich = (target: number, usedKeys: Set<string>): Question[] => {
    const enrichTypes = planEnglishLevelEnrich(coreTypes);
    if (!enrichTypes.length || fullPool.length <= 1) return [];
    const enrichSchedule = buildTypeSchedule(enrichTypes, target * 3);
    const altPool = fullPool.filter((p) => p.id !== item.id);
    const itemOrder = pickItemsForSession(altPool.length ? altPool : fullPool, Math.max(target * 2, 6));
    const questions: Question[] = [];
    let guard = 0;
    let itemCursor = 0;
    while (questions.length < target && guard < target * 24) {
      guard += 1;
      const type = enrichSchedule[guard % enrichSchedule.length];
      const enrichItem = itemOrder[itemCursor % itemOrder.length] || item;
      itemCursor += 1;
      const q =
        type === 'matchPair'
          ? makeEnMatch(altPool.length >= 3 ? altPool : fullPool)
          : makeByType(type, enrichItem, fullPool);
      if (q && registerQuestion(usedKeys, q)) questions.push(q);
    }
    return questions;
  };

  const usedKeys = new Set<string>();
  if (!options?.enrich || fullPool.length <= 1) {
    return buildCore(count, usedKeys);
  }

  const enrichTarget = levelEnrichCount(count);
  const coreTarget = count - enrichTarget;
  const core = buildCore(coreTarget, usedKeys);
  const enrich = buildEnrich(enrichTarget, usedKeys);
  return mergeInterleavedQuestions(core, enrich, count);
}

export function buildEnglishArcadeQuiz(
  pool: EnglishItem[],
  mode: ArcadeMode,
  count = 8,
  preferModes?: QuizType[],
  usedKeys?: Set<string>,
): Question[] {
  if (!pool.length) return [];
  const enPrefer = preferModes?.filter(
    (t): t is EnglishQuizType | 'matchPair' => t === 'matchPair' || isEnQuizType(t),
  );
  const keys = usedKeys ?? new Set<string>();
  const typeSchedule =
    enPrefer?.length
      ? buildTypeSchedule(enPrefer, count * 2)
      : isEnArcadeMode(mode)
        ? buildTypeSchedule([mode], count * 2)
        : buildTypeSchedule(EN_MIXED_TYPES, count * 2);
  const itemOrder = pickItemsForSession(pool, count * 2);
  const questions: Question[] = [];
  let guard = 0;
  let itemCursor = 0;
  while (questions.length < count && guard < count * 24) {
    guard += 1;
    const item = itemOrder[itemCursor % itemOrder.length] || pool[guard % pool.length];
    itemCursor += 1;
    const type = typeSchedule[guard % typeSchedule.length];
    const q = makeByType(type, item, pool);
    if (q && registerQuestion(keys, q)) questions.push(q);
  }
  return questions;
}

export function buildEnglishBossQuiz(
  wrongPool: Array<{ itemId: string; quizType: string }>,
  pool: EnglishItem[],
): Question[] {
  if (!pool.length || !wrongPool.length) return [];
  const byId = new Map(pool.map((p) => [p.id, p]));
  const questions: Question[] = [];

  for (const hint of wrongPool) {
    const item = byId.get(hint.itemId);
    if (!item) continue;
    const type: EnglishQuizType | 'matchPair' =
      hint.quizType === 'matchPair' || isEnQuizType(hint.quizType)
        ? (hint.quizType as EnglishQuizType | 'matchPair')
        : preferredType(questions.length);
    const q = makeByType(type, item, pool);
    if (q) questions.push(q);
  }
  return questions;
}

export function nextEnglishAdaptiveQuestion(
  pool: EnglishItem[],
  baseMode: ArcadeMode,
  ctx: {
    combo: number;
    lastCorrect: boolean;
    lastType?: string;
    preferModes?: QuizType[];
  },
  wrongHints?: Array<{ itemId: string; quizType: string }>,
  usedKeys?: Set<string>,
): Question | null {
  if (!pool.length) return null;
  if (baseMode === 'boss' && !wrongHints?.length) return null;

  const enPrefer = ctx.preferModes?.filter(
    (t): t is EnglishQuizType | 'matchPair' => t === 'matchPair' || isEnQuizType(t),
  );

  let type: EnglishQuizType | 'matchPair' = 'enPictureMean';
  if (enPrefer?.length) {
    type = enPrefer[Math.floor(Math.random() * enPrefer.length)];
  } else if (!ctx.lastCorrect && isEnArcadeMode(ctx.lastType as ArcadeMode)) {
    type = ctx.lastType as EnglishQuizType | 'matchPair';
  } else if (ctx.combo >= 3) {
    type = shuffle(['enSpell', 'matchPair', 'enPictureWord', 'enPhoneticWord'] as Array<
      EnglishQuizType | 'matchPair'
    >)[0];
  } else if (isEnArcadeMode(baseMode)) {
    type = baseMode;
  } else {
    type = preferredType(Math.floor(Math.random() * EN_MIXED_TYPES.length));
  }

  const keys = usedKeys ?? new Set<string>();
  const itemOrder = sessionShuffle(pool);
  let guard = 0;
  let itemCursor = 0;

  while (guard < 24) {
    guard += 1;
    let item = itemOrder[itemCursor % itemOrder.length];
    itemCursor += 1;
    if (wrongHints?.length && (!ctx.lastCorrect || baseMode === 'boss')) {
      const hint = wrongHints[Math.floor(Math.random() * wrongHints.length)];
      const found = pool.find((p) => p.id === hint.itemId);
      if (found) {
        item = found;
        if (hint.quizType === 'matchPair' || isEnQuizType(hint.quizType)) {
          type = hint.quizType as EnglishQuizType | 'matchPair';
        }
      } else if (baseMode === 'boss') {
        continue;
      }
    }
    const q = makeByType(type, item, pool);
    if (q && registerQuestion(keys, q)) return q;
    type = preferredType(guard);
  }
  return null;
}

export function isDedicatedEnglishMode(mode: ArcadeMode): mode is EnglishQuizType | 'matchPair' {
  return isEnArcadeMode(mode);
}

export const ENGLISH_ARCADE_MODE_LABELS: Partial<Record<ArcadeMode, string>> = {
  mixed: '英语综合练',
  enWordMean: '看词选义',
  enMeanWord: '看义选词',
  enSpell: '缺字母练习',
  enPictureMean: '看图选义',
  enPictureWord: '看图选词',
  enPhoneticWord: '音标选词',
  matchPair: '中英配对',
  boss: '错题复习',
  daily: '每日自测',
  duel: '趣味对练',
  sprint: '限时冲刺',
  exam: '模拟小测',
  unit: '单元测验',
};
