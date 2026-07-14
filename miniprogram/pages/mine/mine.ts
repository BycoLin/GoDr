import { listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import { loadWallet, clearWallet } from '../../utils/wallet';
import { listBadgesWithState, clearBadges } from '../../utils/badges';
import { clearAllWrongBooks, countActiveWrongs } from '../../utils/wrongbook';
import { clearDailyRecords, loadDailyRecord } from '../../utils/daily';
import { isSfxMuted, setSfxMuted, playOkSfx } from '../../utils/sfx';
import { getActivePackId, getActiveSubject } from '../../utils/active-subject';
import { getRankInfo } from '../../utils/rank';
import { clearStreak, loadStreak } from '../../utils/streak';
import { getReviewSummary } from '../../utils/review';

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
    subjectLabel: '语文',
    sfxMuted: false,
    sfxLabel: '叭叭音效：开',
    rankTitle: '新芽',
    rankTip: '',
    rankPercent: 0,
    streakDays: 0,
    streakBest: 0,
    reviewTip: '',
  },

  onShow() {
    const packs = listPacks();
    const packId = getActivePackId();
    const active = getActiveSubject();
    let clearedTotal = 0;
    packs.forEach((pack) => {
      clearedTotal += loadPackProgress(pack.id).clearedIds.length;
    });
    const wrongCount = countActiveWrongs(packId);
    const wallet = loadWallet();
    const daily = loadDailyRecord();
    const sfxMuted = isSfxMuted();
    const badges = listBadgesWithState();
    const unlocked = badges.filter((b) => b.unlocked);
    const rank = getRankInfo();
    const streak = loadStreak();
    const review = getReviewSummary(packId);
    this.setData({
      packCount: packs.length,
      packId,
      subjectLabel: active.subject,
      clearedTotal,
      wrongCount,
      wrongbookLabel:
        wrongCount > 0 ? `${active.subject}错题本（${wrongCount}）` : `${active.subject}错题本`,
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
      rankTitle: rank.title,
      rankTip: rank.tip,
      rankPercent: rank.percent,
      streakDays: streak.current,
      streakBest: streak.best,
      reviewTip: review.tip,
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
        clearStreak();
        wx.removeStorageSync('lastPlaySession');
        this.onShow();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
