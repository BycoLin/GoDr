import { isFocusTimerEnabled, triggerFocusRemindIfDue } from './utils/focus-timer';

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
  globalData: {
    focusReminded: false,
  },
  onLaunch() {
    startAppFocusWatch();
  },
  onShow() {
    startAppFocusWatch();
  },
});
