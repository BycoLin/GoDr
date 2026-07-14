import { getPackItems, getPackManifest } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import {
  getActiveGrade,
  getActivePackId,
  getActiveSubject,
  setActiveGrade,
  setActivePackId,
} from '../../utils/active-subject';
import { getRankInfo } from '../../utils/rank';
import { loadStreak } from '../../utils/streak';
import { getReviewSummary } from '../../utils/review';

Page({
  data: {
    packId: 'poetry-g1-g2',
    subject: '语文',
    worldName: '诗词岛',
    toneClass: 'tone-cn',
    iconText: '诗',
    packTitle: '',
    grades: [1, 2] as number[],
    grade: 1,
    continueTip: '',
    continueShort: '',
    clearedCount: 0,
    totalCount: 0,
    percent: 0,
    barWidth: '0%',
    rankTitle: '新芽',
    rankTip: '',
    streakDays: 0,
    reviewTotal: 0,
    reviewTip: '',
    reviewWrongs: 0,
  },

  refreshing: false,

  onShow() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      this.refresh();
    } finally {
      this.refreshing = false;
    }
  },

  refresh() {
    try {
      const packId = getActivePackId();
      const active = getActiveSubject();
      const manifest = getPackManifest(packId);
      const grade = getActiveGrade(packId);
      const grades = manifest?.grades?.length ? [...manifest.grades] : [1];
      const kind = active.kind;
      const toneClass =
        kind === 'math' ? 'tone-math' : kind === 'english' ? 'tone-en' : 'tone-cn';
      const iconText = kind === 'math' ? '算' : kind === 'english' ? 'A' : '诗';

      const progress = loadPackProgress(packId);
      const totalCount = getPackItems(packId).length;
      const clearedCount = (progress.clearedIds || []).length;
      const percent = totalCount ? Math.round((clearedCount / totalCount) * 100) : 0;

      let continueTip = '';
      let continueShort = '';
      if (progress.lastItemId && progress.lastGrade) {
        continueTip = `${active.worldName} · ${progress.lastGrade} 年级地图`;
        continueShort = `${progress.lastGrade}年级`;
      }

      const rank = getRankInfo();
      const streak = loadStreak();
      const review = getReviewSummary(packId);

      this.setData({
        packId,
        subject: active.subject,
        worldName: active.worldName,
        toneClass,
        iconText,
        packTitle: manifest?.title || active.worldName,
        grades,
        grade: grades.indexOf(grade) >= 0 ? grade : grades[0],
        continueTip,
        continueShort,
        clearedCount,
        totalCount,
        percent,
        barWidth: `${percent}%`,
        rankTitle: rank.title,
        rankTip: rank.tip,
        streakDays: streak.current,
        reviewTotal: review.total,
        reviewTip: review.tip,
        reviewWrongs: review.wrongs,
      });
    } catch (err) {
      console.error('home refresh failed', err);
      wx.showToast({ title: '加载失败，再试一次', icon: 'none' });
    }
  },

  onSelectSubject(e: WechatMiniprogram.TouchEvent) {
    const packId = String(e.currentTarget.dataset.packId || '');
    if (!packId || packId === this.data.packId) return;
    setActivePackId(packId);
    this.refresh();
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    setActiveGrade(this.data.packId, grade);
    this.setData({ grade });
  },

  onEnterMap() {
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },

  onContinue() {
    const { packId, continueTip } = this.data;
    if (!continueTip) return;
    const progress = loadPackProgress(packId);
    const grade = progress.lastGrade || this.data.grade;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },

  onTapReview() {
    const { packId, grade, reviewWrongs, reviewTotal } = this.data;
    if (reviewTotal <= 0) {
      wx.showToast({ title: '暂无待复习', icon: 'none' });
      return;
    }
    if (reviewWrongs > 0) {
      wx.navigateTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=boss&boss=1&arcade=1`,
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=mixed&arcade=1`,
    });
  },

  onGoGames() {
    wx.switchTab({ url: '/pages/games/games' });
  },

  onGoTools() {
    wx.navigateTo({ url: '/pages/tools/tools' });
  },

  onGoMono() {
    wx.navigateTo({ url: '/pages/mono/mono' });
  },
});
