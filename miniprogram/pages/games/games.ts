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

interface GameCard {
  mode: ArcadeMode;
  title: string;
  desc: string;
  tag: string;
  tone: string;
}

const POETRY_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '多种题型搅一搅', tag: '综合', tone: 'm-teal' },
  { mode: 'fillNext', title: '下一句', desc: '上句出来接下句', tag: '接龙', tone: 'm-coral' },
  { mode: 'matchPair', title: '上下句配对', desc: '点一点配对成功', tag: '配对', tone: 'm-sky' },
  { mode: 'orderLines', title: '诗句排队', desc: '打乱了排回正确', tag: '排序', tone: 'm-sun' },
  { mode: 'fillBlank', title: '缺字填空', desc: '缺的字藏哪儿了', tag: '填空', tone: 'm-orange' },
  { mode: 'titleAuthor', title: '猜诗名作者', desc: '看见诗句猜是谁', tag: '猜猜', tone: 'm-grass' },
];

const MATH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '速算比较填空一起', tag: '综合', tone: 'm-teal' },
  { mode: 'mathCalc', title: '口算练习', desc: '加减又快又准', tag: '速算', tone: 'm-sky' },
  { mode: 'mathCompare', title: '比大小', desc: '选对 > < =', tag: '比较', tone: 'm-sun' },
  { mode: 'mathMissing', title: '缺数填空', desc: '找出藏起来的数', tag: '填空', tone: 'm-coral' },
];

const ENGLISH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '选义选词拼写一起', tag: '综合', tone: 'm-teal' },
  { mode: 'enWordMean', title: '看词选意思', desc: '英文对中文', tag: '词汇', tone: 'm-sky' },
  { mode: 'enMeanWord', title: '看义找单词', desc: '中文找英文', tag: '记忆', tone: 'm-sun' },
  { mode: 'enSpell', title: '缺字母填空', desc: '把字母补回来', tag: '拼写', tone: 'm-orange' },
  { mode: 'matchPair', title: '中英配对', desc: '一对一对上', tag: '配对', tone: 'm-coral' },
];

function gamesForPack(packId: string): GameCard[] {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') return MATH_GAMES;
  if (kind === 'english') return ENGLISH_GAMES;
  return POETRY_GAMES;
}

Page({
  data: {
    grade: 1,
    gradeLabel: '1 年级',
    packId: 'poetry-g1-g2',
    packSubject: '语文',
    games: POETRY_GAMES,
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
    const games = gamesForPack(pack.id);
    const kind = getPackSubjectKind(pack.id);
    const showPath = kind === 'math' || kind === 'poetry' || kind === 'english';
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
        pathKind === 'math' ? '口算进阶' : pathKind === 'english' ? '单词进阶' : '拼音进阶',
      pathDesc: done > 0 ? `已完成 ${done}/3 · 学 → 练 → 测` : '学 → 练 → 测，循序巩固',
    });
  },

  onTapPath() {
    wx.navigateTo({
      url: `/pages/skill-path/skill-path?kind=${this.data.pathKind}`,
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

  onTapGame(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as ArcadeMode;
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=${mode}&arcade=1`,
    });
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

  onTapWrongbook() {
    const { packId } = this.data;
    wx.navigateTo({ url: `/pages/wrongbook/wrongbook?packId=${packId}` });
  },
});
