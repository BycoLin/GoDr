import { getPackSubjectKind, listPacks } from '../../utils/registry';
import { countActiveWrongs } from '../../utils/wrongbook';
import { loadDailyRecord, DAILY_LIMIT_SEC } from '../../utils/daily';
import {
  getActiveGrade,
  getActivePackId,
  setActiveGrade,
} from '../../utils/active-subject';
import type { ArcadeMode, PackManifest } from '../../utils/types';

interface GameCard {
  mode: ArcadeMode;
  title: string;
  desc: string;
  tag: string;
}

interface FeaturePlay {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
  action: 'duel' | 'sprint' | 'exam' | 'flash';
}

const POETRY_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '多种题型搅一搅', tag: '综合' },
  { mode: 'fillNext', title: '下一句', desc: '上句出来接下句', tag: '接龙' },
  { mode: 'matchPair', title: '上下句配对', desc: '点一点配对成功', tag: '配对' },
  { mode: 'orderLines', title: '诗句排队', desc: '打乱了排回正确', tag: '排序' },
  { mode: 'fillBlank', title: '缺字填空', desc: '缺的字藏哪儿了', tag: '填空' },
  { mode: 'titleAuthor', title: '猜诗名作者', desc: '看见诗句猜是谁', tag: '猜猜' },
];

const MATH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '速算比较填空一起', tag: '综合' },
  { mode: 'mathCalc', title: '口算练习', desc: '加减又快又准', tag: '速算' },
  { mode: 'mathCompare', title: '比大小', desc: '选对 > < =', tag: '比较' },
  { mode: 'mathMissing', title: '缺数填空', desc: '找出藏起来的数', tag: '填空' },
];

const ENGLISH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '综合练', desc: '选义选词拼写一起', tag: '综合' },
  { mode: 'enWordMean', title: '看词选意思', desc: '英文对中文', tag: '词汇' },
  { mode: 'enMeanWord', title: '看义找单词', desc: '中文找英文', tag: '记忆' },
  { mode: 'enSpell', title: '缺字母填空', desc: '把字母补回来', tag: '拼写' },
  { mode: 'matchPair', title: '中英配对', desc: '一对一对上', tag: '配对' },
];

function gamesForPack(packId: string): {
  games: GameCard[];
  features: FeaturePlay[];
} {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return {
      games: MATH_GAMES,
      features: [
        { id: 'sprint', title: '限时冲刺', desc: '60 秒练手速', tag: '冲刺', tone: 'q-sprint', action: 'sprint' },
        { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
      ],
    };
  }
  if (kind === 'english') {
    return {
      games: ENGLISH_GAMES,
      features: [
        { id: 'flash', title: '翻翻看', desc: '翻一翻记一记', tag: '认读', tone: 'q-flash', action: 'flash' },
        { id: 'duel', title: '趣味对练', desc: '比一比谁更快', tag: '对练', tone: 'q-duel', action: 'duel' },
      ],
    };
  }
  return {
    games: POETRY_GAMES,
    features: [
      { id: 'flash', title: '翻翻看', desc: '先读一读再练', tag: '认读', tone: 'q-flash', action: 'flash' },
      { id: 'duel', title: '趣味对练', desc: '比一比默写', tag: '对练', tone: 'q-duel', action: 'duel' },
    ],
  };
}

Page({
  data: {
    grades: [1, 2] as number[],
    grade: 1,
    packId: 'poetry-g1-g2',
    packSubject: '语文',
    games: POETRY_GAMES,
    features: [] as FeaturePlay[],
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
    modesExpanded: false,
  },

  onShow() {
    const packs = listPacks();
    if (!packs.length) return;
    const packId = getActivePackId();
    const current = packs.find((p) => p.id === packId) || packs[0];
    this.applyPack(current);
  },

  applyPack(pack: PackManifest) {
    const grade = getActiveGrade(pack.id);
    const wrongCount = countActiveWrongs(pack.id);
    const daily = loadDailyRecord();
    const { games, features } = gamesForPack(pack.id);

    const preferBoss = wrongCount > 0;
    const heroAction = preferBoss ? 'boss' : 'daily';
    const dailyDesc = daily?.completed
      ? `最佳 ${daily.bestCorrect}/${daily.bestTotal}`
      : `${DAILY_LIMIT_SEC} 秒`;

    this.setData({
      packId: pack.id,
      packSubject: pack.subject,
      grades: pack.grades,
      grade,
      games,
      features,
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
    });
  },

  onTapAlt() {
    if (this.data.altAction === 'boss') {
      this.onTapBoss();
      return;
    }
    this.onTapDaily();
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    setActiveGrade(this.data.packId, grade);
    this.setData({ grade });
  },

  onToggleModes() {
    this.setData({ modesExpanded: !this.data.modesExpanded });
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
    }
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

  onTapTools() {
    wx.navigateTo({ url: '/pages/tools/tools' });
  },

  onTapMono() {
    wx.navigateTo({ url: '/pages/mono/mono' });
  },
});
