import { listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';

Page({
  data: {
    clearedTotal: 0,
    packCount: 0,
    version: '1.0.0',
  },

  onShow() {
    const packs = listPacks();
    let clearedTotal = 0;
    packs.forEach((pack) => {
      clearedTotal += loadPackProgress(pack.id).clearedIds.length;
    });
    this.setData({
      packCount: packs.length,
      clearedTotal,
    });
  },

  onGoGames() {
    wx.switchTab({ url: '/pages/games/games' });
  },

  onGoProgress() {
    wx.switchTab({ url: '/pages/progress/progress' });
  },

  onClearAll() {
    wx.showModal({
      title: '清空全部进度？',
      content: '将清除本地所有知识包的闯关记录，不可恢复',
      success: (res) => {
        if (!res.confirm) return;
        listPacks().forEach((pack) => {
          wx.removeStorageSync(`progress:${pack.id}`);
        });
        wx.removeStorageSync('lastPlaySession');
        this.onShow();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
