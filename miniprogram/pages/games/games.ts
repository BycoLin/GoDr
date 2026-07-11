import { listPacks } from '../../utils/registry';
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
  },

  onShow() {
    const packs = listPacks();
    const pack = packs[0];
    if (!pack) return;
    const grade = this.data.grade;
    const nextGrade = pack.grades.includes(grade) ? grade : pack.grades[0];
    this.setData({
      packId: pack.id,
      grades: pack.grades,
      grade: nextGrade,
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
});
