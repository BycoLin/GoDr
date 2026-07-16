/** 微信分享文案与路径 */

export const SHARE_IMAGE = '/assets/miniprogram-avatar.png';

export interface SharePayload {
  title: string;
  path: string;
  imageUrl: string;
}

export function enableShareMenus(): void {
  wx.showShareMenu({
    withShareTicket: false,
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

export function toShareAppMessage(payload: SharePayload) {
  return {
    title: payload.title,
    path: payload.path,
    imageUrl: payload.imageUrl,
  };
}

export function toShareTimeline(payload: SharePayload) {
  const query = payload.path.includes('?') ? payload.path.split('?')[1] : '';
  return {
    title: payload.title,
    query,
    imageUrl: payload.imageUrl,
  };
}

function formatLevelTitle(title: string, isPoetry: boolean): string {
  if (!title) return '闯关';
  if (title.startsWith('《')) return title;
  if (isPoetry && !/复习|练习|自测|冲刺|对练/.test(title)) return `《${title}》`;
  return title;
}

/** 默认邀请：打开首页 */
export function buildInviteShare(overrides?: Partial<SharePayload>): SharePayload {
  return {
    title: '闯关叭叭 · 语文数学英语趣味练，一起来闯关～',
    path: '/pages/home/home',
    imageUrl: SHARE_IMAGE,
    ...overrides,
  };
}

/** 首页：带当前学科进度 */
export function buildHomeShare(opts: {
  worldName: string;
  starSum: number;
  streakDays: number;
  clearedCount: number;
  totalCount: number;
  packId: string;
  grade: number;
}): SharePayload {
  const bits: string[] = [];
  if (opts.streakDays > 0) bits.push(`连练 ${opts.streakDays} 天`);
  if (opts.starSum > 0) bits.push(`已拿 ${opts.starSum} 星`);
  if (opts.totalCount > 0) {
    bits.push(`通关 ${opts.clearedCount}/${opts.totalCount}`);
  }
  const detail = bits.length ? bits.join(' · ') : '一起来练';
  return {
    title: `我在${opts.worldName}${detail}！闯关叭叭，你也来试试？`,
    path: `/pages/home/home?packId=${opts.packId}&grade=${opts.grade}`,
    imageUrl: SHARE_IMAGE,
  };
}

/** 结算页：晒成绩 */
export function buildResultShare(opts: {
  title: string;
  stars: number;
  ratioText: string;
  duel?: boolean;
  isPoetry?: boolean;
  packId?: string;
  grade?: number;
  itemId?: string;
  arcade?: boolean;
}): SharePayload {
  const label = formatLevelTitle(opts.title, Boolean(opts.isPoetry));
  const starOn = '★'.repeat(Math.min(3, Math.max(0, opts.stars)));
  const starOff = '☆'.repeat(3 - starOn.length);
  const starText = starOn + starOff;

  let shareTitle: string;
  if (opts.duel) {
    shareTitle = `对练 ${opts.ratioText}！来闯关叭叭比一比～`;
  } else if (opts.stars >= 3) {
    shareTitle = `${starText} 全对！我在${label}拿了三星，你也来试试？`;
  } else if (opts.stars >= 1) {
    shareTitle = `${starText} 我在闯关叭叭练了${label}（${opts.ratioText}），一起加油！`;
  } else {
    shareTitle = `我在闯关叭叭挑战${label}，一起来练手～`;
  }

  let path = '/pages/home/home';
  if (!opts.arcade && opts.packId && opts.itemId) {
    path = `/pages/level/level?packId=${opts.packId}&grade=${opts.grade || 1}`;
  } else if (opts.packId) {
    path = `/pages/home/home?packId=${opts.packId}&grade=${opts.grade || 1}`;
  }

  return { title: shareTitle, path, imageUrl: SHARE_IMAGE };
}

/** 我的页：本周小结 */
export function buildWeekShare(opts: {
  rankTitle: string;
  streakDays: number;
  weekPracticeDays: number;
  weekAnswered: number;
}): SharePayload {
  const bits: string[] = [];
  if (opts.streakDays > 0) bits.push(`连练 ${opts.streakDays} 天`);
  if (opts.weekPracticeDays > 0) bits.push(`本周练 ${opts.weekPracticeDays} 天`);
  if (opts.weekAnswered > 0) bits.push(`${opts.weekAnswered} 题`);
  const detail = bits.length ? bits.join(' · ') : '我在坚持练习';
  return {
    title: `${detail}！闯关叭叭 ${opts.rankTitle}，一起来吧～`,
    path: '/pages/home/home',
    imageUrl: SHARE_IMAGE,
  };
}

/** 星星页：学科进度 */
export function buildProgressShare(opts: {
  worldName: string;
  starSum: number;
  clearedCount: number;
  totalCount: number;
  packId: string;
  grade: number;
}): SharePayload {
  const pct =
    opts.totalCount > 0 ? Math.round((opts.clearedCount / opts.totalCount) * 100) : 0;
  return {
    title: `${opts.worldName} 已通关 ${opts.clearedCount}/${opts.totalCount}（${pct}%）· 共 ${opts.starSum} 星，一起来闯关叭叭！`,
    path: `/pages/home/home?packId=${opts.packId}&grade=${opts.grade}`,
    imageUrl: SHARE_IMAGE,
  };
}

/** 加练页：趣味模式邀请 */
export function buildGamesShare(opts: {
  packSubject: string;
  grade: number;
  packId: string;
}): SharePayload {
  return {
    title: `来闯关叭叭和我在 ${opts.packSubject} ${opts.grade} 年级趣味加练！`,
    path: `/pages/games/games`,
    imageUrl: SHARE_IMAGE,
  };
}
