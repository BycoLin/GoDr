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
import {
  buildHomeShare,
  toShareAppMessage,
  toShareTimeline,
} from '../../utils/share';
import { scheduleLevelPrefetch } from '../../utils/page-prefetch';
import {
  formatGradeLabel,
  formatGradeMapLabel,
  formatGradeShort,
  parseGradeQuery,
} from '../../utils/grade-label';
import { ROUTES, routePage } from '../../utils/routes';

interface FeaturePlay {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
  action: 'duel' | 'sprint' | 'exam' | 'unit' | 'flash' | 'pinyin' | 'pinyinFinal' | 'puzzle' | 'visual' | 'path';
}

function featuresForPack(packId: string): FeaturePlay[] {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return [
      { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
      { id: 'path', title: '口算进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-coral', action: 'path' },
      { id: 'sprint', title: '限时冲刺', desc: '60 秒练手速', tag: '冲刺', tone: 'q-sprint', action: 'sprint' },
      { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
    ];
  }
  if (kind === 'english') {
    return [
      { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
      { id: 'path', title: '单词进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-teal', action: 'path' },
      { id: 'flash', title: '翻翻看', desc: '翻一翻记一记', tag: '认读', tone: 'q-flash', action: 'flash' },
      { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
    ];
  }
  return [
    { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
    { id: 'path', title: '拼音进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-teal', action: 'path' },
    { id: 'pinyin-i', title: '声母练', desc: '23 个声母认读拼读', tag: '声母', tone: 'q-sky', action: 'pinyin' },
    { id: 'pinyin-f', title: '韵母练', desc: '单韵母到鼻韵母', tag: '韵母', tone: 'q-flash', action: 'pinyinFinal' },
    { id: 'flash', title: '翻翻看', desc: '先读一读再练', tag: '认读', tone: 'q-flash', action: 'flash' },
    { id: 'duel', title: '趣味对练', desc: '比一比默写', tag: '对练', tone: 'q-duel', action: 'duel' },
  ];
}

function sumGradeStars(packId: string, grade: number): number {
  const progress = loadPackProgress(packId);
  const ids = new Set(getItemsByGrade(packId, grade).map((item) => item.id));
  return Object.entries(progress.stars || {}).reduce((s, [id, n]) => {
    return ids.has(id) ? s + (n || 0) : s;
  }, 0);
}

function buildGradeOptions(grades: number[]) {
  return grades.map((g) => ({
    key: `g${Number(g)}`,
    value: Number(g),
    label: formatGradeLabel(Number(g)),
    pre: Number(g) === 0,
  }));
}

const DEFAULT_FEATURES: FeaturePlay[] = [
  { id: 'path', title: '拼音进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-teal', action: 'path' },
  { id: 'pinyin-i', title: '声母练', desc: '23 个声母认读拼读', tag: '声母', tone: 'q-sky', action: 'pinyin' },
  { id: 'pinyin-f', title: '韵母练', desc: '单韵母到鼻韵母', tag: '韵母', tone: 'q-flash', action: 'pinyinFinal' },
  { id: 'flash', title: '翻翻看', desc: '先读一读再练', tag: '认读', tone: 'q-flash', action: 'flash' },
  { id: 'duel', title: '趣味对练', desc: '比一比默写', tag: '对练', tone: 'q-duel', action: 'duel' },
];

const DEFAULT_GRADE_OPTIONS = buildGradeOptions([0, 1, 2]);

Page({
  data: {
    packId: 'poetry-g1-g2',
    subject: '语文',
    worldName: '语文岛',
    toneClass: 'tone-cn',
    iconText: '文',
    packTitle: '',
    grades: [0, 1, 2],
    gradeOptions: DEFAULT_GRADE_OPTIONS,
    grade: 0,
    gradeKey: 'g0',
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
    features: DEFAULT_FEATURES,
    goalAnswered: 0,
    goalTarget: 10,
    goalDone: false,
    goalPercent: 0,
    goalBarWidth: '0%',
    goalTip: '',
    adventureBubble: '打开地图，一关一关闯',
    loadError: '',
  },

  onReady() {
    const { packId, grade } = this.data;
    if (packId && grade != null) {
      scheduleLevelPrefetch(packId, grade);
    }
  },

  onShow() {
    this.applyShareQuery();
    this.refresh();
  },

  goLevelMap(packId: string, grade: number) {
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },

  applyShareQuery() {
    try {
      const enter = wx.getEnterOptionsSync?.();
      const query = enter?.query || {};
      const packId = String(query.packId || '');
      const grade = parseGradeQuery(query.grade, -1);
      if (packId) setActivePackId(packId);
      if (grade >= 0) setActiveGrade(packId || getActivePackId(), grade);
    } catch {
      // ignore
    }
  },

  buildSharePayload() {
    const { worldName, starSum, streakDays, clearedCount, totalCount, packId, grade } =
      this.data;
    return buildHomeShare({
      worldName,
      starSum,
      streakDays,
      clearedCount,
      totalCount,
      packId,
      grade,
    });
  },

  onShareAppMessage() {
    return toShareAppMessage(this.buildSharePayload());
  },

  onShareTimeline() {
    return toShareTimeline(this.buildSharePayload());
  },

  refresh() {
    try {
      const packId = getActivePackId();
      const active = getActiveSubject();
      const manifest = getPackManifest(packId);
      const grade = getActiveGrade(packId);
      const grades = manifest?.grades?.length ? [...manifest.grades] : [0, 1];
      const resolvedGrade = grades.map(Number).includes(grade) ? grade : grades[0];
      const gradeOptions = buildGradeOptions(grades.map(Number));
      const kind = active.kind;
      const toneClass =
        kind === 'math' ? 'tone-math' : kind === 'english' ? 'tone-en' : 'tone-cn';
      const iconText = kind === 'math' ? '算' : kind === 'english' ? 'A' : '文';

      const progress = loadPackProgress(packId);
      const gradeItems = getItemsByGrade(packId, resolvedGrade);
      const totalCount = gradeItems.length;
      const clearedIdSet = new Set(progress.clearedIds || []);
      const clearedCount = gradeItems.filter((item) => clearedIdSet.has(item.id)).length;
      const percent = totalCount ? Math.round((clearedCount / totalCount) * 100) : 0;

      let continueTip = '';
      let continueShort = '';
      let adventureBubble = '打开地图，一关一关闯';
      const lastGrade = progress.lastGrade;
      const hasLast =
        progress.lastItemId &&
        lastGrade != null &&
        Number.isFinite(Number(lastGrade));
      if (hasLast && Number(lastGrade) === resolvedGrade) {
        continueShort = formatGradeShort(Number(lastGrade));
        continueTip = `${active.worldName} · ${formatGradeMapLabel(Number(lastGrade))}`;
        adventureBubble = `接着练 · ${continueShort}`;
      } else {
        adventureBubble = `${formatGradeLabel(resolvedGrade)} · 打开地图闯一闯`;
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
        gradeOptions,
        grade: resolvedGrade,
        gradeKey: `g${resolvedGrade}`,
        continueTip,
        continueShort,
        adventureBubble,
        clearedCount,
        totalCount,
        percent,
        barWidth: `${percent}%`,
        starSum: sumGradeStars(packId, resolvedGrade),
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
        loadError: '',
      });

      scheduleLevelPrefetch(packId, resolvedGrade);
    } catch (err) {
      console.error('home refresh failed', err);
      this.setData({
        loadError: '加载有点卡住了，点下面按钮再试',
        gradeOptions: this.data.gradeOptions.length
          ? this.data.gradeOptions
          : DEFAULT_GRADE_OPTIONS,
        features: this.data.features.length
          ? this.data.features
          : featuresForPack(this.data.packId || 'poetry-g1-g2'),
      });
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
    const idx = Number(e.currentTarget.dataset.index);
    const opt = this.data.gradeOptions[idx];
    if (!opt || !Number.isFinite(opt.value)) return;
    setActiveGrade(this.data.packId, opt.value);
    this.refresh();
  },

  onEnterMap() {
    const { packId, grade } = this.data;
    this.goLevelMap(packId, grade);
  },

  onContinue() {
    const { packId, continueTip } = this.data;
    if (!continueTip) return;
    const progress = loadPackProgress(packId);
    const grade =
      progress.lastGrade != null && Number.isFinite(Number(progress.lastGrade))
        ? Number(progress.lastGrade)
        : this.data.grade;
    this.goLevelMap(packId, grade);
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
        url: routePage(ROUTES.flashcard, `packId=${packId}&grade=${grade}`),
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
    if (action === 'unit') {
      wx.navigateTo({
        url: routePage(ROUTES.unitTest, `packId=${packId}&grade=${grade}`),
      });
      return;
    }
    if (action === 'path') {
      const subjectKind = getPackSubjectKind(packId);
      const pathKind =
        subjectKind === 'math' ? 'math' : subjectKind === 'english' ? 'english' : 'pinyin';
      wx.navigateTo({ url: routePage(ROUTES.skillPath, `kind=${pathKind}`) });
      return;
    }
    if (action === 'pinyin') {
      wx.navigateTo({ url: routePage(ROUTES.pinyin, 'tab=initial') });
      return;
    }
    if (action === 'pinyinFinal') {
      wx.navigateTo({ url: routePage(ROUTES.pinyin, 'tab=final') });
      return;
    }
    if (action === 'visual') {
      wx.navigateTo({ url: ROUTES.visualMath });
      return;
    }
    if (action === 'puzzle') {
      wx.navigateTo({ url: ROUTES.numberLine });
    }
  },

  onGoMono() {
    wx.navigateTo({ url: ROUTES.mono });
  },
});
