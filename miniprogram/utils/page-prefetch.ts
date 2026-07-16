import { prefetchLevelSnapshot } from './level-map';

let lastLevelPreloadKey = '';

function safePreloadPage(url: string): void {
  const preload = (wx as WechatMiniprogram.Wx & {
    preloadPage?: (opt: { url: string }) => Promise<unknown>;
  }).preloadPage;
  if (typeof preload !== 'function') return;
  preload({ url }).catch(() => {
    // 低版本或模拟器不支持时忽略
  });
}

/** 预下载并预热关卡地图（首页 idle 时调用） */
export function preloadLevelPage(packId: string, grade: number): void {
  if (!packId || !grade) return;
  const key = `${packId}:${grade}`;
  if (lastLevelPreloadKey === key) return;
  lastLevelPreloadKey = key;

  prefetchLevelSnapshot(packId, grade);
  safePreloadPage(`/pages/level/level?packId=${packId}&grade=${grade}`);
}

/** 预下载答题页代码（进地图后再预热） */
export function preloadPlayPage(): void {
  safePreloadPage('/pages/play/play?packId=poetry-g1-g2&grade=1&itemId=_');
}

/** 预下载其它 tab 页，减轻首次切 tab 卡顿 */
export function preloadTabBarPages(): void {
  safePreloadPage('/pages/games/games');
  safePreloadPage('/pages/progress/progress');
  safePreloadPage('/pages/mine/mine');
}

export function scheduleLevelPrefetch(packId: string, grade: number): void {
  wx.nextTick(() => {
    preloadLevelPage(packId, grade);
  });
}
