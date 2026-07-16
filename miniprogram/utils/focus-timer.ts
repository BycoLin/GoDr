/** 轻量专注计时：到点温馨提示，不阻断操作 */

const ENABLE_KEY = 'focusTimerEnabled';

/** 建议单次练习时长（分钟）；测试时可临时改为 1，上线改回 20 */
export const FOCUS_LIMIT_MIN = 1;

const LIMIT_MS = FOCUS_LIMIT_MIN * 60 * 1000;
const TOAST_DURATION_MS = 3500;

let globalSession: FocusSession | null = null;
let reminding = false;

export function getFocusLimitMin(): number {
  return FOCUS_LIMIT_MIN;
}

export function isFocusTimerEnabled(): boolean {
  try {
    const v = wx.getStorageSync(ENABLE_KEY);
    if (v === '' || v === undefined || v === null) return true;
    if (v === 0 || v === '0' || v === false) return false;
    return true;
  } catch {
    return true;
  }
}

export function setFocusTimerEnabled(on: boolean): void {
  wx.setStorageSync(ENABLE_KEY, on ? 1 : 0);
}

export interface FocusSession {
  startedAt: number;
  reminded: boolean;
}

export function startFocusSession(): FocusSession {
  return { startedAt: Date.now(), reminded: false };
}

export function getOrStartFocusSession(): FocusSession {
  if (!globalSession) {
    globalSession = startFocusSession();
  }
  return globalSession;
}

export function beginNextFocusPeriod(): void {
  globalSession = startFocusSession();
  reminding = false;
}

export function focusElapsedMs(session: FocusSession | null): number {
  if (!session?.startedAt) return 0;
  return Math.max(0, Date.now() - session.startedAt);
}

export function focusElapsedMin(session: FocusSession | null): number {
  return Math.floor(focusElapsedMs(session) / 60000);
}

export function shouldRemindFocus(session: FocusSession | null): boolean {
  if (!session || !isFocusTimerEnabled()) return false;
  if (session.reminded) return false;
  return focusElapsedMs(session) >= LIMIT_MS;
}

export function markFocusReminded(session: FocusSession): FocusSession {
  return { ...session, reminded: true };
}

export function focusRemindContent(): string {
  return '已经玩一会儿啦，歇歇眼睛、喝点水吧～';
}

function showFocusRemindToast() {
  wx.showToast({
    title: focusRemindContent(),
    icon: 'none',
    duration: TOAST_DURATION_MS,
  });
  beginNextFocusPeriod();
}

/** 到点则 toast 提示；全局共享，跨页面累计 */
export function triggerFocusRemindIfDue(): void {
  if (!isFocusTimerEnabled() || reminding) return;
  const session = getOrStartFocusSession();
  if (!shouldRemindFocus(session)) return;

  reminding = true;
  globalSession = markFocusReminded(session);
  showFocusRemindToast();
}
