/** 页面预加载：首屏渲染完成后再预下载，避免模拟器卡死 */

import { prefetchLevelSnapshot } from './level-map';
import { isValidGrade } from './active-subject';

let lastLevelPreloadKey = '';
let tabBarPreloaded = false;

/** 关卡页预下载延迟（毫秒） */
const LEVEL_PAGE_DELAY_MS = 2500;
/** 其它 tab 开始预下载的延迟 */
const TAB_BAR_DELAY_MS = 4000;
/** 各 tab 之间的间隔 */
const TAB_BAR_GAP_MS = 600;

function safePreloadPage(url: string): void {
  const preload = (wx as WechatMiniprogram.Wx & {
    preloadPage?: (opt: { url: string }) => Promise<unknown>;
  }).preloadPage;
  if (typeof preload !== 'function') return;
  preload({ url }).catch(() => {
    // 低版本或模拟器不支持时忽略
  });
}

function runDelayed(ms: number, fn: () => void): void {
  setTimeout(() => {
    try {
      fn();
    } catch (err) {
      console.warn('page prefetch failed', err);
    }
  }, ms);
}

/** 预下载并预热关卡地图（首页 idle 时调用） */
export function preloadLevelPage(packId: string, grade: number): void {
  if (!packId || !isValidGrade(grade)) return;
  const key = `${packId}:${grade}`;
  if (lastLevelPreloadKey === key) return;
  lastLevelPreloadKey = key;

  runDelayed(300, () => prefetchLevelSnapshot(packId, grade));
  runDelayed(LEVEL_PAGE_DELAY_MS, () => {
    safePreloadPage(`/pages/level/level?packId=${packId}&grade=${grade}`);
  });
}

/** 预下载答题页代码（进地图后再预热） */
export function preloadPlayPage(): void {
  runDelayed(LEVEL_PAGE_DELAY_MS + 800, () => {
    safePreloadPage('/pages/play/play?packId=poetry-g1-g2&grade=1&itemId=_');
  });
}

/** 预下载其它 tab 页，减轻首次切 tab 卡顿 */
export function preloadTabBarPages(): void {
  if (tabBarPreloaded) return;
  tabBarPreloaded = true;
  const tabs = [
    '/pages/games/games',
    '/pages/progress/progress',
    '/pages/mine/mine',
  ];
  tabs.forEach((url, index) => {
    runDelayed(TAB_BAR_DELAY_MS + index * TAB_BAR_GAP_MS, () => {
      safePreloadPage(url);
    });
  });
}

export function scheduleLevelPrefetch(packId: string, grade: number): void {
  wx.nextTick(() => {
    preloadLevelPage(packId, grade);
  });
}
