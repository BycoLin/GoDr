import { getItemsByGrade, getPackManifest, getPackSubjectKind } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import {
  getActiveGrade,
  getActivePackId,
  setActiveGrade,
  setActivePackId,
} from '../../utils/active-subject';
import { getRankInfo } from '../../utils/rank';
import { loadStreak } from '../../utils/streak';
import { getReviewSummary } from '../../utils/review';
import { getTodayGoal } from '../../utils/practice-log';
import {
  buildHomeShare,
  enableShareMenus,
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
  action: 'review' | 'sprint' | 'exam' | 'unit' | 'flash' | 'pinyin' | 'pinyinFinal' | 'puzzle' | 'visual' | 'path';
}

function featuresForPack(packId: string): FeaturePlay[] {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return [
      { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
      { id: 'path', title: '口算进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-coral', action: 'path' },
      { id: 'sprint', title: '限时冲刺', desc: '60 秒练手速', tag: '冲刺', tone: 'q-sprint', action: 'sprint' },
    ];
  }
  if (kind === 'english') {
    return [
      { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
      { id: 'path', title: '单词进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-teal', action: 'path' },
      { id: 'flash', title: '翻翻看', desc: '翻一翻记一记', tag: '认读', tone: 'q-flash', action: 'flash' },
    ];
  }
  return [
    { id: 'unit', title: '单元测验', desc: '按单元固定 10 题', tag: '单元', tone: 'q-exam', action: 'unit' },
    { id: 'path', title: '拼音进阶', desc: '学 → 练 → 测', tag: '路径', tone: 'q-teal', action: 'path' },
    { id: 'pinyin-i', title: '声母练', desc: '23 个声母认读拼读', tag: '声母', tone: 'q-sky', action: 'pinyin' },
    { id: 'pinyin-f', title: '韵母练', desc: '单韵母到鼻韵母', tag: '韵母', tone: 'q-flash', action: 'pinyinFinal' },
    { id: 'flash', title: '翻翻看', desc: '先读一读再练', tag: '认读', tone: 'q-flash', action: 'flash' },
  ];
}

const DEFAULT_FEATURES: FeaturePlay[] = featuresForPack('poetry-g1-g2');

function buildPanelFeatures(packId: string): FeaturePlay[] {
  const base = featuresForPack(packId);
  const review = getReviewSummary(packId);
  if (review.total <= 0) return base;
  return [
    {
      id: 'review',
      title: '智能复习',
      desc: review.tip,
      tag: '复习',
      tone: 'q-review',
      action: 'review',
    },
    ...base,
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

const DEFAULT_GRADE_OPTIONS = buildGradeOptions([0, 1, 2, 3]);

const SUBJECT_PACKS = ['poetry-g1-g2', 'math-g1-g2', 'english-g1-g2'] as const;

const PANEL_BASE_RPX = 900;
const PANEL_FEATURE_RPX = 148;
const PANEL_MORE_RPX = 290;
const PANEL_CONTINUE_RPX = 56;
const PANEL_GRADE_WRAP_RPX = 44;

function estimatePanelContentRpx(panel: SubjectPanel): number {
  const dockExtra = panel.continueTip ? PANEL_CONTINUE_RPX : 0;
  const gradeExtra = panel.gradeOptions.length > 3 ? PANEL_GRADE_WRAP_RPX : 0;
  return (
    PANEL_BASE_RPX +
    dockExtra +
    gradeExtra +
    panel.features.length * PANEL_FEATURE_RPX +
    PANEL_MORE_RPX +
    32
  );
}

interface SubjectPanel {
  packId: string;
  subject: string;
  worldName: string;
  toneClass: string;
  iconText: string;
  gradeOptions: ReturnType<typeof buildGradeOptions>;
  grade: number;
  gradeKey: string;
  clearedCount: number;
  totalCount: number;
  percent: number;
  barWidth: string;
  starSum: number;
  adventureBubble: string;
  continueTip: string;
  continueShort: string;
  features: FeaturePlay[];
  reviewTotal: number;
  reviewTip: string;
  reviewWrongs: number;
}

function buildSubjectPanel(packId: string): SubjectPanel {
  const manifest = getPackManifest(packId);
  const subject =
    packId === 'math-g1-g2' ? '数学' : packId === 'english-g1-g2' ? '英语' : '语文';
  const kind = getPackSubjectKind(packId);
  const worldName =
    kind === 'math' ? '数学岛' : kind === 'english' ? '英语岛' : '语文岛';
  const toneClass =
    kind === 'math' ? 'tone-math' : kind === 'english' ? 'tone-en' : 'tone-cn';
  const iconText = kind === 'math' ? '算' : kind === 'english' ? 'A' : '文';
  const grades = manifest?.grades?.length ? [...manifest.grades] : [0, 1];
  const grade = getActiveGrade(packId);
  const resolvedGrade = grades.map(Number).includes(grade) ? grade : grades[0];
  const gradeOptions = buildGradeOptions(grades.map(Number));

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
    progress.lastItemId && lastGrade != null && Number.isFinite(Number(lastGrade));
  if (hasLast && Number(lastGrade) === resolvedGrade) {
    continueShort = formatGradeShort(Number(lastGrade));
    continueTip = `${worldName} · ${formatGradeMapLabel(Number(lastGrade))}`;
    adventureBubble = `接着练 · ${continueShort}`;
  } else {
    adventureBubble = `${formatGradeLabel(resolvedGrade)} · 打开地图闯一闯`;
  }

  const review = getReviewSummary(packId);

  return {
    packId,
    subject,
    worldName,
    toneClass,
    iconText,
    gradeOptions,
    grade: resolvedGrade,
    gradeKey: `g${resolvedGrade}`,
    clearedCount,
    totalCount,
    percent,
    barWidth: `${percent}%`,
    starSum: sumGradeStars(packId, resolvedGrade),
    adventureBubble,
    continueTip,
    continueShort,
    features: buildPanelFeatures(packId),
    reviewTotal: review.total,
    reviewTip: review.tip,
    reviewWrongs: review.wrongs,
  };
}

function applyPanelFields(panel: SubjectPanel) {
  return {
    packId: panel.packId,
    subject: panel.subject,
    worldName: panel.worldName,
    toneClass: panel.toneClass,
    iconText: panel.iconText,
    gradeOptions: panel.gradeOptions,
    grade: panel.grade,
    gradeKey: panel.gradeKey,
    clearedCount: panel.clearedCount,
    totalCount: panel.totalCount,
    percent: panel.percent,
    barWidth: panel.barWidth,
    starSum: panel.starSum,
    adventureBubble: panel.adventureBubble,
    continueTip: panel.continueTip,
    continueShort: panel.continueShort,
    features: panel.features,
    reviewTotal: panel.reviewTotal,
    reviewTip: panel.reviewTip,
    reviewWrongs: panel.reviewWrongs,
  };
}

Page({
  data: {
    packId: 'poetry-g1-g2',
    subject: '语文',
    worldName: '语文岛',
    toneClass: 'tone-cn',
    iconText: '文',
    packTitle: '',
    grades: [0, 1, 2, 3],
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
    subjectIndex: 0,
    subjectPanels: [] as SubjectPanel[],
    subjectScrollHeight: 480,
    subjectScrollable: false,
    swiperSync: false,
  },

  initSubjectScrollHeight() {
    try {
      const win = wx.getWindowInfo?.() || wx.getSystemInfoSync();
      const rpx = win.windowWidth / 750;
      const panelIdx = this.data.subjectIndex;
      const panel = this.data.subjectPanels[panelIdx];

      wx.createSelectorQuery()
        .in(this)
        .select('.home-header')
        .boundingClientRect()
        .selectAll('.subject-slide')
        .boundingClientRect()
        .exec((res) => {
          const headerHeight = res[0]?.height || 520 * rpx;
          const viewportMax = Math.floor(win.windowHeight - headerHeight - 4);
          const slides = (res[1] || []) as WechatMiniprogram.BoundingClientRectResult[];
          const measured = slides[panelIdx]?.height;

          let contentPx = 0;
          if (measured && measured > 0) {
            contentPx = Math.ceil(measured);
          } else if (panel) {
            contentPx = Math.ceil(estimatePanelContentRpx(panel) * rpx);
          } else {
            contentPx = viewportMax;
          }

          const scrollable = contentPx > viewportMax;
          const height = scrollable ? viewportMax : Math.max(contentPx, 240);

          this.setData({
            subjectScrollHeight: height,
            subjectScrollable: scrollable,
          });
        });
    } catch {
      this.setData({ subjectScrollHeight: 480, subjectScrollable: false });
    }
  },

  scheduleSubjectScrollHeight() {
    setTimeout(() => this.initSubjectScrollHeight(), 50);
  },

  onReady() {
    const { packId, grade } = this.data;
    if (packId && grade != null) {
      scheduleLevelPrefetch(packId, grade);
    }
    this.scheduleSubjectScrollHeight();
  },

  onShow() {
    try {
      enableShareMenus();
    } catch {
      /* ignore */
    }
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
      const manifest = getPackManifest(packId);
      const subjectPanels = SUBJECT_PACKS.map((id) => buildSubjectPanel(id));
      const subjectIndex = Math.max(0, SUBJECT_PACKS.indexOf(packId as (typeof SUBJECT_PACKS)[number]));
      const panel = subjectPanels[subjectIndex] || subjectPanels[0];

      const rank = getRankInfo();
      const streak = loadStreak();
      const goal = getTodayGoal();

      this.setData({
        subjectPanels,
        subjectIndex,
        packId: panel.packId,
        subject: panel.subject,
        worldName: panel.worldName,
        toneClass: panel.toneClass,
        iconText: panel.iconText,
        packTitle: manifest?.title || panel.worldName,
        grades: manifest?.grades?.length ? [...manifest.grades] : [0, 1],
        gradeOptions: panel.gradeOptions,
        grade: panel.grade,
        gradeKey: panel.gradeKey,
        continueTip: panel.continueTip,
        continueShort: panel.continueShort,
        adventureBubble: panel.adventureBubble,
        clearedCount: panel.clearedCount,
        totalCount: panel.totalCount,
        percent: panel.percent,
        barWidth: panel.barWidth,
        starSum: panel.starSum,
        rankTitle: rank.title,
        rankTip: rank.tip,
        streakDays: streak.current,
        reviewTotal: panel.reviewTotal,
        reviewTip: panel.reviewTip,
        reviewWrongs: panel.reviewWrongs,
        features: panel.features,
        goalAnswered: goal.answered,
        goalTarget: goal.target,
        goalDone: goal.done,
        goalPercent: goal.percent,
        goalBarWidth: goal.barWidth,
        goalTip: goal.tip,
        loadError: '',
      });

      scheduleLevelPrefetch(panel.packId, panel.grade);
      this.scheduleSubjectScrollHeight();
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
    const subjectIndex = Math.max(0, SUBJECT_PACKS.indexOf(packId as (typeof SUBJECT_PACKS)[number]));
    setActivePackId(packId);
    this.setData({ subjectIndex, swiperSync: true });
    const panel = this.data.subjectPanels[subjectIndex];
    if (panel) {
      this.setData(applyPanelFields(panel), () => {
        scheduleLevelPrefetch(panel.packId, panel.grade);
        this.scheduleSubjectScrollHeight();
      });
    } else {
      this.refresh();
    }
  },

  onSubjectSwipe(e: WechatMiniprogram.SwiperChange) {
    if (this.data.swiperSync) {
      this.setData({ swiperSync: false });
      return;
    }
    const subjectIndex = e.detail.current;
    const panel = this.data.subjectPanels[subjectIndex];
    if (!panel || panel.packId === this.data.packId) return;
    setActivePackId(panel.packId);
    this.setData({ subjectIndex, ...applyPanelFields(panel) }, () => {
      scheduleLevelPrefetch(panel.packId, panel.grade);
      this.scheduleSubjectScrollHeight();
    });
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    if (!Number.isFinite(grade)) return;
    setActiveGrade(this.data.packId, grade);
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
    if (action === 'review') {
      this.onTapReview();
      return;
    }
    if (action === 'flash') {
      wx.navigateTo({
        url: routePage(ROUTES.flashcard, `packId=${packId}&grade=${grade}`),
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
