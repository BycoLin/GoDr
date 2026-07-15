import { getItemsByGrade, getPackManifest, getPackSubjectKind } from '../../utils/registry';
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
import { getTodayGoal } from '../../utils/practice-log';

interface FeaturePlay {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
  action: 'duel' | 'sprint' | 'exam' | 'flash' | 'pinyin' | 'puzzle' | 'visual';
}

function featuresForPack(packId: string): FeaturePlay[] {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return [
      { id: 'sprint', title: '限时冲刺', desc: '60 秒练手速', tag: '冲刺', tone: 'q-sprint', action: 'sprint' },
      { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
      { id: 'puzzle', title: '数字排队', desc: '排一排', tag: '数', tone: 'q-duel', action: 'puzzle' },
      { id: 'visual', title: '看图口算', desc: '算一算', tag: '算', tone: 'q-coral', action: 'visual' },
    ];
  }
  if (kind === 'english') {
    return [
      { id: 'flash', title: '翻翻看', desc: '翻一翻记一记', tag: '认读', tone: 'q-flash', action: 'flash' },
      { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
    ];
  }
  return [
    { id: 'flash', title: '翻翻看', desc: '先读一读再练', tag: '认读', tone: 'q-flash', action: 'flash' },
    { id: 'duel', title: '趣味对练', desc: '比一比默写', tag: '对练', tone: 'q-duel', action: 'duel' },
    { id: 'pinyin', title: '拼音练习', desc: '声母韵母', tag: '拼', tone: 'q-teal', action: 'pinyin' },
  ];
}

function sumGradeStars(packId: string, grade: number): number {
  const progress = loadPackProgress(packId);
  const ids = new Set(getItemsByGrade(packId, grade).map((item) => item.id));
  return Object.entries(progress.stars || {}).reduce((s, [id, n]) => {
    return ids.has(id) ? s + (n || 0) : s;
  }, 0);
}

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
    starSum: 0,
    rankTitle: '新芽',
    rankTip: '',
    streakDays: 0,
    reviewTotal: 0,
    reviewTip: '',
    reviewWrongs: 0,
    features: [] as FeaturePlay[],
    goalAnswered: 0,
    goalTarget: 10,
    goalDone: false,
    goalPercent: 0,
    goalBarWidth: '0%',
    goalTip: '',
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
      const gradeItems = getItemsByGrade(packId, grade);
      const totalCount = gradeItems.length;
      const clearedIdSet = new Set(progress.clearedIds || []);
      const clearedCount = gradeItems.filter((item) => clearedIdSet.has(item.id)).length;
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
      const goal = getTodayGoal();

      this.setData({
        packId,
        subject: active.subject,
        worldName: active.worldName,
        toneClass,
        iconText,
        packTitle: manifest?.title || active.worldName,
        grades,
        grade: grades.map(Number).includes(grade) ? grade : grades[0],
        continueTip,
        continueShort,
        clearedCount,
        totalCount,
        percent,
        barWidth: `${percent}%`,
        starSum: sumGradeStars(packId, grade),
        rankTitle: rank.title,
        rankTip: rank.tip,
        streakDays: streak.current,
        reviewTotal: review.total,
        reviewTip: review.tip,
        reviewWrongs: review.wrongs,
        features: featuresForPack(packId),
        goalAnswered: goal.answered,
        goalTarget: goal.target,
        goalDone: goal.done,
        goalPercent: goal.percent,
        goalBarWidth: goal.barWidth,
        goalTip: goal.tip,
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

  onTapFeature(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action as FeaturePlay['action'];
    const { packId, grade } = this.data;
    if (action === 'flash') {
      wx.navigateTo({
        url: `/pages/flashcard/flashcard?packId=${packId}&grade=${grade}`,
      });
      return;
    }
    if (action === 'duel') {
      wx.navigateTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=duel&duel=1&arcade=1`,
      });
      return;
    }
    if (action === 'sprint') {
      wx.navigateTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=sprint&sprint=1&arcade=1`,
      });
      return;
    }
    if (action === 'exam') {
      wx.navigateTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=exam&exam=1&arcade=1`,
      });
      return;
    }
    if (action === 'pinyin') {
      wx.navigateTo({ url: '/pages/pinyin/pinyin' });
      return;
    }
    if (action === 'visual') {
      wx.navigateTo({ url: '/pages/visual-math/visual-math' });
      return;
    }
    if (action === 'puzzle') {
      wx.navigateTo({ url: '/pages/number-line/number-line' });
    }
  },

  onGoMono() {
    wx.navigateTo({ url: '/pages/mono/mono' });
  },
});
