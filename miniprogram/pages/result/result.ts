import { recordPlayResult } from '../../utils/progress';
import { starsFromScore } from '../../utils/quiz';

Page({
  data: {
    packId: '',
    grade: 1,
    itemId: '',
    title: '',
    correct: 0,
    total: 0,
    stars: 0,
    ratioText: '',
    encouragement: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const correct = Number(query.correct || 0);
    const total = Number(query.total || 0);
    const title = decodeURIComponent(query.title || '');
    const stars = starsFromScore(correct, total);

    recordPlayResult(packId, itemId, grade, correct, total, stars);

    let encouragement = '继续加油，下一首也很好玩！';
    if (stars >= 3) encouragement = '太棒了！全部答对，小小诗人！';
    else if (stars === 2) encouragement = '很不错，再练一遍会更熟～';
    else if (stars === 1) encouragement = '过关啦，多读几遍记得更牢。';
    else encouragement = '先读一读原诗，再来挑战一次吧。';

    this.setData({
      packId,
      grade,
      itemId,
      title,
      correct,
      total,
      stars,
      ratioText: `${correct} / ${total}`,
      encouragement,
    });
  },

  onRetry() {
    const { packId, grade, itemId } = this.data;
    wx.redirectTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&itemId=${itemId}`,
    });
  },

  onBackLevels() {
    const { packId, grade } = this.data;
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({
          url: `/pages/level/level?packId=${packId}&grade=${grade}`,
        });
      },
    });
  },

  onHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },
});
