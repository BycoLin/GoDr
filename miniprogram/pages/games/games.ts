import { getPackSubjectKind, listPacks } from '../../utils/registry';
import { countActiveWrongs } from '../../utils/wrongbook';
import { loadDailyRecord, DAILY_LIMIT_SEC } from '../../utils/daily';
import {
  getActiveGrade,
  getActivePackId,
} from '../../utils/active-subject';
import type { ArcadeMode, PackManifest } from '../../utils/types';
import { loadPathState, pathDoneCount, type PathKind } from '../../utils/skill-path';
import { formatGradeLabel } from '../../utils/grade-label';
import {
  buildGamesShare,
  toShareAppMessage,
  toShareTimeline,
} from '../../utils/share';
import { listMathThemeUnits, type MathThemeUnit } from '../../utils/math-themes';
import { listPoetryGames, poetryPathEnabled, poetryPathTitle } from '../../utils/poetry-games';
import { ROUTES, routePage } from '../../utils/routes';

interface GameCard {
  mode?: ArcadeMode;
  link?: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
}

const MATH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '速算比较填空一起', tag: '综合', tone: 'm-teal' },
  { mode: 'mathVisual', title: '看图口算', desc: '数图列式算结果', tag: '图形', tone: 'm-grass' },
  { mode: 'mathSequence', title: '数字排队', desc: '按顺序填空缺', tag: '数列', tone: 'm-teal' },
  { mode: 'mathMakeTen', title: '凑十法', desc: '先凑成 10 再相加', tag: '凑十', tone: 'm-grass' },
  { mode: 'mathBreakTen', title: '破十法', desc: '先减 10 再合并', tag: '破十', tone: 'm-orange' },
  { mode: 'mathFlatTen', title: '平十法', desc: '先减到 10 再算', tag: '平十', tone: 'm-teal' },
  { mode: 'mathBorrowTen', title: '借十法', desc: '个位不够向十位借', tag: '借十', tone: 'm-sky' },
  { mode: 'mathCalc', title: '口算练习', desc: '加减又快又准', tag: '速算', tone: 'm-sky' },
  { mode: 'mathCompare', title: '比大小', desc: '选对 > < =', tag: '比较', tone: 'm-sun' },
  { mode: 'mathMissing', title: '缺数填空', desc: '找出藏起来的数', tag: '填空', tone: 'm-coral' },
];

const ENGLISH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '看图、音标、拼写一起', tag: '综合', tone: 'm-teal' },
  { mode: 'enPictureMean', title: '看图选义', desc: 'emoji 图选中文', tag: '看图', tone: 'm-grass' },
  { mode: 'enPictureWord', title: '看图选词', desc: 'emoji 图选英文', tag: '看图', tone: 'm-sky' },
  { mode: 'enPhoneticWord', title: '音标选词', desc: '看音标找单词', tag: '音标', tone: 'm-coral' },
  { mode: 'enWordMean', title: '看词选意思', desc: '英文对中文', tag: '词汇', tone: 'm-sky' },
  { mode: 'enMeanWord', title: '看义找单词', desc: '中文找英文', tag: '记忆', tone: 'm-sun' },
  { mode: 'enSpell', title: '缺字母填空', desc: '把字母补回来', tag: '拼写', tone: 'm-orange' },
  { mode: 'matchPair', title: '中英配对', desc: '一对一对上', tag: '配对', tone: 'm-coral' },
];

function gamesForPack(packId: string, grade: number): GameCard[] {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') return MATH_GAMES;
  if (kind === 'english') return ENGLISH_GAMES;
  return listPoetryGames(grade);
}

Page({
  data: {
    grade: 1,
    gradeLabel: '1 年级',
    packId: 'poetry-g1-g2',
    packSubject: '语文',
    games: listPoetryGames(1),
    wrongCount: 0,
    heroAction: 'daily' as 'daily' | 'boss',
    heroTone: 'tone-sun',
    heroBadge: 'GO',
    heroArt: '限',
    heroTitle: '每日限时练',
    heroDesc: '来一局限时自测',
    heroGo: '开始挑战',
    altAction: 'boss' as 'daily' | 'boss',
    altTag: '巩固',
    altTitle: '错题再练',
    altDesc: '暂无',
    showPath: false,
    pathKind: 'pinyin' as PathKind,
    pathTitle: '拼音进阶',
    pathDesc: '学 → 练 → 测',
    themeUnits: [] as MathThemeUnit[],
  },

  onShow() {
    try {
      const packs = listPacks();
      if (!packs.length) return;
      const packId = getActivePackId();
      const current = packs.find((p) => p.id === packId) || packs[0];
      if (!current) return;
      this.applyPack(current);
    } catch (err) {
      console.error('games onShow failed', err);
    }
  },

  applyPack(pack: PackManifest) {
    const grade = getActiveGrade(pack.id);
    const wrongCount = countActiveWrongs(pack.id);
    const daily = loadDailyRecord();
    const games = gamesForPack(pack.id, grade);
    const kind = getPackSubjectKind(pack.id);
    const showPath =
      kind === 'math' ||
      kind === 'english' ||
      (kind === 'poetry' && poetryPathEnabled(grade));
    const pathKind: PathKind =
      kind === 'math' ? 'math' : kind === 'english' ? 'english' : 'pinyin';
    const pathState = showPath ? loadPathState(pathKind) : null;
    const done = pathState ? pathDoneCount(pathState) : 0;

    const preferBoss = wrongCount > 0;
    const heroAction = preferBoss ? 'boss' : 'daily';
    const dailyDesc = daily?.completed
      ? `最佳 ${daily.bestCorrect}/${daily.bestTotal}`
      : `${DAILY_LIMIT_SEC} 秒`;

    this.setData({
      packId: pack.id,
      packSubject: pack.subject,
      grade,
      gradeLabel: formatGradeLabel(grade),
      games,
      wrongCount,
      heroAction,
      heroTone: preferBoss ? 'tone-coral' : 'tone-sun',
      heroBadge: preferBoss ? '优先' : '今日',
      heroArt: preferBoss ? '固' : '限',
      heroTitle: preferBoss ? '错题再练' : '每日限时练',
      heroDesc: preferBoss
        ? `有 ${wrongCount} 个薄弱点，巩固一下更牢`
        : daily?.completed
          ? `今日最佳 ${daily.bestCorrect}/${daily.bestTotal}，再冲一局？`
          : `${DAILY_LIMIT_SEC} 秒限时自测，来试一试！`,
      heroGo: preferBoss ? '开始巩固' : '开始挑战',
      altAction: preferBoss ? 'daily' : 'boss',
      altTag: preferBoss ? '限时' : '巩固',
      altTitle: preferBoss ? '每日限时练' : '错题再练',
      altDesc: preferBoss
        ? dailyDesc
        : wrongCount > 0
          ? `${wrongCount} 题`
          : '暂无错题',
      showPath,
      pathKind,
      pathTitle:
        pathKind === 'math'
          ? '口算进阶'
          : pathKind === 'english'
            ? '单词进阶'
            : poetryPathTitle(grade),
      pathDesc: done > 0 ? `已完成 ${done}/3 · 学 → 练 → 测` : '学 → 练 → 测，循序巩固',
      themeUnits: kind === 'math' ? listMathThemeUnits(grade) : [],
    });
  },

  onTapPath() {
    wx.navigateTo({
      url: routePage(ROUTES.skillPath, `kind=${this.data.pathKind}`),
    });
  },

  onTapUnitTest() {
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: routePage(ROUTES.unitTest, `packId=${packId}&grade=${grade}`),
    });
  },

  buildSharePayload() {
    const { packSubject, grade, packId } = this.data;
    return buildGamesShare({ packSubject, grade, packId });
  },

  onShareAppMessage() {
    return toShareAppMessage(this.buildSharePayload());
  },

  onShareTimeline() {
    return toShareTimeline(this.buildSharePayload());
  },

  onTapAlt() {
    if (this.data.altAction === 'boss') {
      this.onTapBoss();
      return;
    }
    this.onTapDaily();
  },

  onTapHero() {
    if (this.data.heroAction === 'boss') {
      this.onTapBoss();
      return;
    }
    this.onTapDaily();
  },

  onTapThemeGame(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as ArcadeMode;
    const { packId, grade } = this.data;
    if (!mode) return;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=${mode}&arcade=1`,
    });
  },

  onTapGame(e: WechatMiniprogram.TouchEvent) {
    const link = String(e.currentTarget.dataset.link || '');
    if (link) {
      wx.navigateTo({ url: link });
      return;
    }
    const mode = e.currentTarget.dataset.mode as ArcadeMode;
    const label = String(e.currentTarget.dataset.label || '');
    const theme = String(e.currentTarget.dataset.theme || '');
    const { packId, grade } = this.data;
    let url = `/pages/play/play?packId=${packId}&grade=${grade}&mode=${mode}&arcade=1`;
    if (label) url += `&label=${encodeURIComponent(label)}`;
    if (theme) url += `&poolTheme=${encodeURIComponent(theme)}`;
    wx.navigateTo({ url });
  },

  onTapBoss() {
    const { packId, grade, wrongCount } = this.data;
    if (wrongCount <= 0) {
      wx.showToast({ title: '暂无错题，先去练习吧', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=boss&boss=1&arcade=1`,
    });
  },

  onTapDaily() {
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=daily&daily=1&timed=1&limitSec=${DAILY_LIMIT_SEC}&arcade=1`,
    });
  },

  onTapDuel() {
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=duel&duel=1&arcade=1`,
    });
  },

  onTapWrongbook() {
    const { packId } = this.data;
    wx.navigateTo({ url: routePage(ROUTES.wrongbook, `packId=${packId}`) });
  },
});
