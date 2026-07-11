import { listPacks } from '../../utils/registry';
import { countActiveWrongs } from '../../utils/wrongbook';
import { loadDailyRecord, DAILY_LIMIT_SEC } from '../../utils/daily';
import type { ArcadeMode } from '../../utils/types';

interface GameCard {
  mode: ArcadeMode;
  title: string;
  desc: string;
  tag: string;
}

const GAMES: GameCard[] = [
  {
    mode: 'mixed',
    title: '随机挑战',
    desc: '下一句、配对、排序、填空混合出击',
    tag: '综合',
  },
  {
    mode: 'fillNext',
    title: '下一句闪电',
    desc: '给出上句，快速选出正确下一句',
    tag: '反应',
  },
  {
    mode: 'matchPair',
    title: '配对达人',
    desc: '把上下句一对一对上',
    tag: '配对',
  },
  {
    mode: 'orderLines',
    title: '诗句排序',
    desc: '打乱的诗句，按正确顺序点回来',
    tag: '记忆',
  },
  {
    mode: 'fillBlank',
    title: '缺字填空',
    desc: '补上诗句里缺掉的那一个字',
    tag: '细心',
  },
  {
    mode: 'titleAuthor',
    title: '诗名作者',
    desc: '看诗句，选出诗名或作者',
    tag: '认知',
  },
];

Page({
  data: {
    grades: [1, 2] as number[],
    grade: 1,
    packId: 'poetry-g1-g2',
    games: GAMES,
    wrongCount: 0,
    wrongTip: '暂无错题，继续闯关',
    dailyTip: '今日尚未挑战',
    dailyDone: false,
  },

  onShow() {
    const packs = listPacks();
    const pack = packs[0];
    if (!pack) return;
    const grade = this.data.grade;
    const nextGrade = pack.grades.includes(grade) ? grade : pack.grades[0];
    const wrongCount = countActiveWrongs(pack.id);
    const daily = loadDailyRecord();
    this.setData({
      packId: pack.id,
      grades: pack.grades,
      grade: nextGrade,
      wrongCount,
      wrongTip: wrongCount > 0 ? `${wrongCount} 个薄弱点待攻克` : '暂无错题，继续闯关',
      dailyDone: Boolean(daily?.completed),
      dailyTip: daily?.completed
        ? `今日最佳 ${daily.bestCorrect}/${daily.bestTotal} · ${daily.bestPoints} 分`
        : `${DAILY_LIMIT_SEC} 秒限时 · 每日一挑战`,
    });
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
