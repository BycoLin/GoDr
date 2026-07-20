import { getActiveGrade, getActivePackId } from './active-subject';
import { DAILY_LIMIT_SEC } from './daily';
import { ROUTES, routePage } from './routes';

export type PathKind = 'pinyin' | 'math' | 'english';
export type PathStepId = 'learn' | 'practice' | 'test';

export interface PathStepDef {
  id: PathStepId;
  index: number;
  title: string;
  action: string;
  tip: string;
}

export interface PathState {
  kind: PathKind;
  /** 拼音路径记住当前声母 */
  initial: string;
  done: Partial<Record<PathStepId, boolean>>;
  updatedAt: number;
}

const KEY_PREFIX = 'skillPath:';

const PINYIN_STEPS: PathStepDef[] = [
  { id: 'learn', index: 1, title: '学一学', action: '认读拼读', tip: '选声母，看卡片跟读' },
  { id: 'practice', index: 2, title: '练一练', action: '看字选音', tip: '看汉字选出正确拼音' },
  { id: 'test', index: 3, title: '测一测', action: '连对过关', tip: '连续答对几题就算过关' },
];

const MATH_STEPS: PathStepDef[] = [
  { id: 'learn', index: 1, title: '学一学', action: '看图口算', tip: '用图理解加减' },
  { id: 'practice', index: 2, title: '练一练', action: '数字排队', tip: '补全数字顺序' },
  { id: 'test', index: 3, title: '测一测', action: '口算冲刺', tip: '限时测一测手速' },
];

const ENGLISH_STEPS: PathStepDef[] = [
  { id: 'learn', index: 1, title: '学一学', action: '单词闪卡', tip: '翻卡片认读单词' },
  { id: 'practice', index: 2, title: '练一练', action: '看词选义', tip: '看英文选出中文意思' },
  { id: 'test', index: 3, title: '测一测', action: '限时自测', tip: `${DAILY_LIMIT_SEC} 秒测一测记得多少` },
];

export function isPathKind(v: string | undefined): v is PathKind {
  return v === 'pinyin' || v === 'math' || v === 'english';
}

export function parsePathKind(raw?: string): PathKind {
  if (raw === 'math') return 'math';
  if (raw === 'english') return 'english';
  return 'pinyin';
}

function emptyState(kind: PathKind): PathState {
  return {
    kind,
    initial: kind === 'pinyin' ? 'b' : '',
    done: {},
    updatedAt: 0,
  };
}

function key(kind: PathKind): string {
  return `${KEY_PREFIX}${kind}`;
}

export function getPathMeta(kind: PathKind): {
  title: string;
  subject: string;
  steps: PathStepDef[];
} {
  if (kind === 'math') {
    return { title: '口算进阶', subject: '数学', steps: MATH_STEPS };
  }
  if (kind === 'english') {
    return { title: '单词进阶', subject: '英语', steps: ENGLISH_STEPS };
  }
  return { title: '拼音进阶', subject: '语文', steps: PINYIN_STEPS };
}

export function loadPathState(kind: PathKind): PathState {
  try {
    const data = wx.getStorageSync(key(kind)) as PathState | '';
    if (!data || typeof data !== 'object') return emptyState(kind);
    return {
      ...emptyState(kind),
      ...data,
      kind,
      done: data.done && typeof data.done === 'object' ? data.done : {},
      initial: data.initial || (kind === 'pinyin' ? 'b' : ''),
    };
  } catch {
    return emptyState(kind);
  }
}

export function savePathState(state: PathState): void {
  wx.setStorageSync(key(state.kind), {
    ...state,
    updatedAt: Date.now(),
  });
}

export function setPathInitial(kind: PathKind, initial: string): PathState {
  const state = loadPathState(kind);
  state.initial = initial || state.initial;
  savePathState(state);
  return state;
}

export function markPathStep(kind: PathKind, step: PathStepId): PathState {
  const state = loadPathState(kind);
  state.done = { ...state.done, [step]: true };
  savePathState(state);
  return state;
}

export function resetPath(kind: PathKind): PathState {
  const state = emptyState(kind);
  savePathState(state);
  return state;
}

export function pathDoneCount(state: PathState): number {
  return (['learn', 'practice', 'test'] as PathStepId[]).filter((s) => state.done[s]).length;
}

export function nextPathStep(state: PathState): PathStepId {
  if (!state.done.learn) return 'learn';
  if (!state.done.practice) return 'practice';
  if (!state.done.test) return 'test';
  return 'test';
}

export function isPathComplete(state: PathState): boolean {
  return Boolean(state.done.learn && state.done.practice && state.done.test);
}

/** 根据步骤生成具体跳转 URL */
export function buildStepUrl(
  kind: PathKind,
  step: PathStepId,
  opts: { initial?: string; packId?: string; grade?: number } = {},
): string {
  const from = `fromPath=${kind}&pathStep=${step}`;
  if (kind === 'pinyin') {
    const initial = opts.initial || loadPathState('pinyin').initial || 'b';
    if (step === 'learn') {
      return routePage(ROUTES.pinyin, from);
    }
    if (step === 'practice') {
      return routePage(ROUTES.pinyinLearn, `initial=${initial}&mode=fill&${from}`);
    }
    return routePage(ROUTES.pinyinLearn, `initial=${initial}&mode=fill&quizGoal=5&${from}`);
  }

  if (kind === 'math') {
    if (step === 'learn') {
      return routePage(ROUTES.visualMath, from);
    }
    if (step === 'practice') {
      return routePage(ROUTES.numberLine, from);
    }
    const packId = opts.packId || getActivePackId();
    const grade = opts.grade || getActiveGrade(packId);
    return `/pages/play/play?packId=${packId}&grade=${grade}&mode=sprint&sprint=1&arcade=1&${from}`;
  }

  const packId = opts.packId || getActivePackId();
  const grade = opts.grade || getActiveGrade(packId);
  if (step === 'learn') {
    return routePage(ROUTES.flashcard, `packId=${packId}&grade=${grade}&${from}`);
  }
  if (step === 'practice') {
    return `/pages/play/play?packId=${packId}&grade=${grade}&mode=enWordMean&arcade=1&${from}`;
  }
  return `/pages/play/play?packId=${packId}&grade=${grade}&mode=daily&daily=1&timed=1&limitSec=${DAILY_LIMIT_SEC}&arcade=1&${from}`;
}

export function goPathHub(kind: PathKind): void {
  const url = routePage(ROUTES.skillPath, `kind=${kind}`);
  wx.redirectTo({
    url,
    fail: () => {
      wx.navigateTo({ url });
    },
  });
}
