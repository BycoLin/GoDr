import { listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import { loadWallet, clearWallet } from '../../utils/wallet';
import { listBadgesWithState, clearBadges } from '../../utils/badges';
import { clearAllWrongBooks, countActiveWrongs } from '../../utils/wrongbook';
import { clearDailyRecords, loadDailyRecord } from '../../utils/daily';
import { isSfxMuted, setSfxMuted, playOkSfx } from '../../utils/sfx';

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
    previewText: '',
    badgeSummary: '已点亮 0 / 0',
    badgePercent: 0,
    badgesExpanded: false,
    version: '1.0.0',
    packId: 'poetry-g1-g2',
    sfxMuted: false,
    sfxLabel: '叭叭音效：开',
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
    const sfxMuted = isSfxMuted();
    const badges = listBadgesWithState();
    const unlocked = badges.filter((b) => b.unlocked);
    this.setData({
      packCount: packs.length,
      packId: packs[0]?.id || 'poetry-g1-g2',
      clearedTotal,
      wrongCount,
      wrongbookLabel: wrongCount > 0 ? `错题本（${wrongCount}）` : '错题本',
      points: wallet.points,
      bestCombo: wallet.bestCombo,
      badges,
      previewText: unlocked.length
        ? `已点亮：${unlocked
            .slice(0, 3)
            .map((b) => b.title)
            .join('、')}${unlocked.length > 3 ? '…' : ''}`
        : '',
      badgeSummary: `已点亮 ${unlocked.length} / ${badges.length}`,
      badgePercent: badges.length
        ? Math.round((unlocked.length / badges.length) * 100)
        : 0,
      dailyTip: daily?.completed
        ? `今日已自测 · 最佳 ${daily.bestCorrect}/${daily.bestTotal}`
        : '今日限时尚未自测',
      sfxMuted,
      sfxLabel: sfxMuted ? '叭叭音效：关' : '叭叭音效：开',
    });
  },

  onToggleBadges() {
    this.setData({ badgesExpanded: !this.data.badgesExpanded });
  },
  onToggleSfx() {
    const next = !this.data.sfxMuted;
    setSfxMuted(next);
    this.setData({
      sfxMuted: next,
      sfxLabel: next ? '叭叭音效：关' : '叭叭音效：开',
    });
    if (!next) playOkSfx();
    wx.showToast({
      title: next ? '音效已关闭' : '音效已打开',
      icon: 'none',
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
