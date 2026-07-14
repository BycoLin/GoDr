import { listPacks, getPackSubjectKind } from '../../utils/registry';
import { countActiveWrongs } from '../../utils/wrongbook';
import { loadDailyRecord, DAILY_LIMIT_SEC } from '../../utils/daily';
import type { ArcadeMode, PackManifest } from '../../utils/types';

interface GameCard {
  mode: ArcadeMode;
  title: string;
  desc: string;
  tag: string;
  toneClass: string;
}

interface FeaturePlay {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tone: string;
  action: 'duel' | 'sprint' | 'exam' | 'flash' | 'boss' | 'daily';
}

const POETRY_GAMES: GameCard[] = [
  { mode: 'mixed', title: '诗词综合练', desc: '好多题型搅在一起，试试看！', tag: '综合', toneClass: 'tone-0' },
  { mode: 'fillNext', title: '下一句练习', desc: '上句出来，快接下一句！', tag: '接龙', toneClass: 'tone-1' },
  { mode: 'matchPair', title: '上下句配对', desc: '左右点一点，配对成功！', tag: '配对', toneClass: 'tone-2' },
  { mode: 'orderLines', title: '诗句排队', desc: '打乱的诗句，排回正确顺序', tag: '排序', toneClass: 'tone-0' },
  { mode: 'fillBlank', title: '缺字填空', desc: '缺的那个字藏哪儿了？', tag: '填空', toneClass: 'tone-1' },
  { mode: 'titleAuthor', title: '猜诗名作者', desc: '看见诗句，猜猜是谁写的', tag: '猜猜', toneClass: 'tone-2' },
];

const MATH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '数学综合练', desc: '速算、比大小、填空一起练', tag: '综合', toneClass: 'tone-0' },
  { mode: 'mathCalc', title: '口算练习', desc: '加减算得又快又准', tag: '速算', toneClass: 'tone-1' },
  { mode: 'mathCompare', title: '比大小练习', desc: '选对 > < = 就能过', tag: '比较', toneClass: 'tone-2' },
  { mode: 'mathMissing', title: '缺数填空', desc: '找出算式里藏起来的数', tag: '填空', toneClass: 'tone-0' },
];

const ENGLISH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '英语综合练', desc: '选义、选词、缺字母一起练', tag: '综合', toneClass: 'tone-0' },
  { mode: 'enWordMean', title: '看词选意思', desc: '看见英文，选出中文意思', tag: '词汇', toneClass: 'tone-1' },
  { mode: 'enMeanWord', title: '看义找单词', desc: '看见中文，找出正确英文', tag: '记忆', toneClass: 'tone-2' },
  { mode: 'enSpell', title: '缺字母填空', desc: '把缺的字母补回来', tag: '拼写', toneClass: 'tone-0' },
  { mode: 'matchPair', title: '中英配对', desc: '英文和中文一对一对上', tag: '配对', toneClass: 'tone-1' },
];

function gamesForPack(packId: string): {
  games: GameCard[];
  campaignTitle: string;
  campaignDesc: string;
  features: FeaturePlay[];
} {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return {
      games: MATH_GAMES,
      campaignTitle: '回数学岛闯关',
      campaignDesc: '一关关练习，星星等你来集！',
      features: [
        { id: 'sprint', title: '限时冲刺', desc: '60 秒口算，练手速', tag: '冲刺', tone: 'f-sprint', action: 'sprint' },
        { id: 'duel', title: '趣味对练', desc: '和练习伙伴比一比', tag: '对练', tone: 'f-duel', action: 'duel' },
        { id: 'exam', title: '十题小测', desc: '一口气答完 10 题', tag: '小测', tone: 'f-exam', action: 'exam' },
      ],
    };
  }
  if (kind === 'english') {
    return {
      games: ENGLISH_GAMES,
      campaignTitle: '回英语岛闯关',
      campaignDesc: '单词一关关练，记得更牢！',
      features: [
        { id: 'flash', title: '单词翻翻看', desc: '翻一翻，记一记', tag: '认读', tone: 'f-flash', action: 'flash' },
        { id: 'duel', title: '趣味对练', desc: '和练习伙伴比一比', tag: '对练', tone: 'f-duel', action: 'duel' },
        { id: 'exam', title: '十题小测', desc: '一口气答完 10 题', tag: '小测', tone: 'f-exam', action: 'exam' },
      ],
    };
  }
  return {
    games: POETRY_GAMES,
    campaignTitle: '回诗词岛闯关',
    campaignDesc: '按诗练习，集齐小星星！',
    features: [
      { id: 'flash', title: '背诵翻翻看', desc: '先读一读，再来练', tag: '认读', tone: 'f-flash', action: 'flash' },
      { id: 'duel', title: '趣味对练', desc: '和练习伙伴比默写', tag: '对练', tone: 'f-duel', action: 'duel' },
      { id: 'exam', title: '十题小测', desc: '一口气答完 10 题', tag: '小测', tone: 'f-exam', action: 'exam' },
    ],
  };
}

Page({
  data: {
    packs: [] as Array<{ id: string; subject: string }>,
    grades: [1, 2] as number[],
    grade: 1,
    packId: 'poetry-g1-g2',
    packSubject: '语文',
    campaignTitle: '诗词循序练习',
    campaignDesc: '按诗逐首练习，完成可记录进度',
    games: POETRY_GAMES,
    features: [] as FeaturePlay[],
    wrongCount: 0,
    wrongTip: '暂无错题，先去练习',
    dailyTip: '今日尚未自测',
    dailyDone: false,
  },

  onShow() {
    const packs = listPacks();
    if (!packs.length) return;
    const current =
      packs.find((p) => p.id === this.data.packId) || packs[0];
    this.applyPack(current);
  },

  applyPack(pack: PackManifest) {
    const grade = pack.grades.includes(this.data.grade)
      ? this.data.grade
      : pack.grades[0];
    const wrongCount = countActiveWrongs(pack.id);
    const daily = loadDailyRecord();
    const { games, campaignTitle, campaignDesc, features } = gamesForPack(pack.id);
    this.setData({
      packs: listPacks().map((p) => ({
        id: p.id,
        subject: p.subject,
      })),
      packId: pack.id,
      packSubject: pack.subject,
      grades: pack.grades,
      grade,
      games,
      features,
      campaignTitle,
      campaignDesc,
      wrongCount,
      wrongTip: wrongCount > 0 ? `${wrongCount} 个薄弱点待巩固` : '暂无错题，先去闯关吧',
      dailyDone: Boolean(daily?.completed),
      dailyTip: daily?.completed
        ? `今日最佳 ${daily.bestCorrect}/${daily.bestTotal} · ${daily.bestPoints} 分`
        : `${DAILY_LIMIT_SEC} 秒限时练习，来试一试？`,
    });
  },

  onSelectPack(e: WechatMiniprogram.TouchEvent) {
    const packId = e.currentTarget.dataset.id as string;
    const pack = listPacks().find((p) => p.id === packId);
    if (!pack) return;
    this.applyPack(pack);
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    this.setData({ grade });
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
    if (action === 'boss') {
      this.onTapBoss();
      return;
    }
    if (action === 'daily') {
      this.onTapDaily();
      return;
    }
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

  onTapCampaign() {
    const { packId } = this.data;
    wx.navigateTo({ url: `/pages/pack/pack?packId=${packId}` });
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
