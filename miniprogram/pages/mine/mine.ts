import { listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import { loadWallet, clearWallet } from '../../utils/wallet';
import { listBadgesWithState, clearBadges } from '../../utils/badges';
import { clearAllWrongBooks, countActiveWrongs } from '../../utils/wrongbook';
import { clearDailyRecords, loadDailyRecord } from '../../utils/daily';

Page({
  data: {
    clearedTotal: 0,
    packCount: 0,
    points: 0,
    bestCombo: 0,
    wrongCount: 0,
    wrongbookLabel: '错题本',
    dailyTip: '',
    badges: [] as Array<{ id: string; title: string; desc: string; unlocked: boolean }>,
    version: '1.0.0',
    packId: 'poetry-g1-g2',
  },

  onShow() {
    const packs = listPacks();
    let clearedTotal = 0;
    let wrongCount = 0;
    packs.forEach((pack) => {
      clearedTotal += loadPackProgress(pack.id).clearedIds.length;
      wrongCount += countActiveWrongs(pack.id);
    });
    const wallet = loadWallet();
    const daily = loadDailyRecord();
    this.setData({
      packCount: packs.length,
      packId: packs[0]?.id || 'poetry-g1-g2',
      clearedTotal,
      wrongCount,
      wrongbookLabel: wrongCount > 0 ? `错题本（${wrongCount}）` : '错题本',
      points: wallet.points,
      bestCombo: wallet.bestCombo,
      badges: listBadgesWithState(),
      dailyTip: daily?.completed
        ? `今日已自测 · 最佳 ${daily.bestCorrect}/${daily.bestTotal}`
        : '今日限时尚未自测',
    });
  },

  onGoGames() {
    wx.switchTab({ url: '/pages/games/games' });
  },

  onGoProgress() {
    wx.switchTab({ url: '/pages/progress/progress' });
  },

  onGoWrongbook() {
    wx.navigateTo({ url: `/pages/wrongbook/wrongbook?packId=${this.data.packId}` });
  },

  onClearAll() {
    wx.showModal({
      title: '清空全部进度？',
      content: '将清除练习进度、错题本、积分、成就与每日自测记录，不可恢复',
      success: (res) => {
        if (!res.confirm) return;
        const ids = listPacks().map((p) => p.id);
        ids.forEach((id) => {
          wx.removeStorageSync(`progress:${id}`);
        });
        clearAllWrongBooks(ids);
        clearWallet();
        clearBadges();
        clearDailyRecords();
        wx.removeStorageSync('lastPlaySession');
        this.onShow();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
