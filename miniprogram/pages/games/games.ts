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

const POETRY_GAMES: GameCard[] = [
  { mode: 'mixed', title: '随机挑战', desc: '下一句、配对、排序、填空混合出击', tag: '综合', toneClass: 'tone-0' },
  { mode: 'fillNext', title: '下一句闪电', desc: '给出上句，快速选出正确下一句', tag: '反应', toneClass: 'tone-1' },
  { mode: 'matchPair', title: '配对达人', desc: '把上下句一对一对上', tag: '配对', toneClass: 'tone-2' },
  { mode: 'orderLines', title: '诗句排序', desc: '打乱的诗句，按正确顺序点回来', tag: '记忆', toneClass: 'tone-0' },
  { mode: 'fillBlank', title: '缺字填空', desc: '补上诗句里缺掉的那一个字', tag: '细心', toneClass: 'tone-1' },
  { mode: 'titleAuthor', title: '诗名作者', desc: '看诗句，选出诗名或作者', tag: '认知', toneClass: 'tone-2' },
];

const MATH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '数学混合', desc: '速算、比大小、填空一起练', tag: '综合', toneClass: 'tone-0' },
  { mode: 'mathCalc', title: '速算闯关', desc: '加减口算，连击更带劲', tag: '速算', toneClass: 'tone-1' },
  { mode: 'mathCompare', title: '比大小', desc: '选对 > < = 符号', tag: '比较', toneClass: 'tone-2' },
  { mode: 'mathMissing', title: '填空达人', desc: '找出算式里缺的数', tag: '填空', toneClass: 'tone-0' },
];

const ENGLISH_GAMES: GameCard[] = [
  { mode: 'mixed', title: '英语混合', desc: '选义、选词、缺字母、配对一起练', tag: '综合', toneClass: 'tone-0' },
  { mode: 'enWordMean', title: '看词选义', desc: '看见英文，选出中文意思', tag: '词汇', toneClass: 'tone-1' },
  { mode: 'enMeanWord', title: '看义选词', desc: '看见中文，选出正确英文', tag: '记忆', toneClass: 'tone-2' },
  { mode: 'enSpell', title: '缺字母闯关', desc: '补全单词里缺的字母', tag: '拼写', toneClass: 'tone-0' },
  { mode: 'matchPair', title: '中英配对', desc: '把英文和中文一对一对上', tag: '配对', toneClass: 'tone-1' },
];

function gamesForPack(packId: string): {
  games: GameCard[];
  campaignTitle: string;
  campaignDesc: string;
} {
  const kind = getPackSubjectKind(packId);
  if (kind === 'math') {
    return {
      games: MATH_GAMES,
      campaignTitle: '数学闯关',
      campaignDesc: '按关卡练口算，通关攒星星',
    };
  }
  if (kind === 'english') {
    return {
      games: ENGLISH_GAMES,
      campaignTitle: '英语闯关',
      campaignDesc: '按单词逐个解锁，通关攒星星',
    };
  }
  return {
    games: POETRY_GAMES,
    campaignTitle: '诗词闯关',
    campaignDesc: '按诗逐首解锁，通关攒星星',
  };
}

Page({
  data: {
    packs: [] as Array<{ id: string; subject: string }>,
    grades: [1, 2] as number[],
    grade: 1,
    packId: 'poetry-g1-g2',
    packSubject: '语文',
    campaignTitle: '诗词闯关',
    campaignDesc: '按诗逐首解锁，通关攒星星',
    games: POETRY_GAMES,
    wrongCount: 0,
    wrongTip: '暂无错题，继续闯关',
    dailyTip: '今日尚未挑战',
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
    const { games, campaignTitle, campaignDesc } = gamesForPack(pack.id);
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
      campaignTitle,
      campaignDesc,
      wrongCount,
      wrongTip: wrongCount > 0 ? `${wrongCount} 个薄弱点待攻克` : '暂无错题，继续闯关',
      dailyDone: Boolean(daily?.completed),
      dailyTip: daily?.completed
        ? `今日最佳 ${daily.bestCorrect}/${daily.bestTotal} · ${daily.bestPoints} 分`
        : `${DAILY_LIMIT_SEC} 秒限时 · 每日一挑战`,
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

  onTapCampaign() {
    const { packId } = this.data;
    wx.navigateTo({ url: `/pages/pack/pack?packId=${packId}` });
  },

  onTapBoss() {
    const { packId, grade, wrongCount } = this.data;
    if (wrongCount <= 0) {
      wx.showToast({ title: '暂无错题，先去闯关吧', icon: 'none' });
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
