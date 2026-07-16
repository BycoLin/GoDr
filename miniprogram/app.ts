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
    enableShareMenus();
    startAppFocusWatch();
    preloadTabBarPages();
    wx.nextTick(() => {
      const packId = getActivePackId();
      scheduleLevelPrefetch(packId, getActiveGrade(packId));
    });
  },
});
