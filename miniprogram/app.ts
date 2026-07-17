import { isFocusTimerEnabled, triggerFocusRemindIfDue } from './utils/focus-timer';
import { enableShareMenus } from './utils/share';
import { getActiveGrade, getActivePackId } from './utils/active-subject';
import { preloadTabBarPages, scheduleLevelPrefetch } from './utils/page-prefetch';

let focusWatchId = 0;

function clearAppFocusWatch() {
  if (focusWatchId) {
    clearInterval(focusWatchId);
    focusWatchId = 0;
  }
}

function startAppFocusWatch() {
  clearAppFocusWatch();
  if (!isFocusTimerEnabled()) return;
  focusWatchId = setInterval(() => {
    triggerFocusRemindIfDue();
  }, 3000) as unknown as number;
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    try {
      enableShareMenus();
    } catch (err) {
      console.warn('enableShareMenus failed', err);
    }

    // 首屏渲染完成后再启动预加载与专注提醒，避免阻塞模拟器
    setTimeout(() => {
      try {
        startAppFocusWatch();
        preloadTabBarPages();
        const packId = getActivePackId();
        scheduleLevelPrefetch(packId, getActiveGrade(packId));
      } catch (err) {
        console.error('app deferred init failed', err);
      }
    }, 1500);
  },
});
