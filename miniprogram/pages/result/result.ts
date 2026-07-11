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
    arcade: false,
    mode: 'mixed',
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const correct = Number(query.correct || 0);
    const total = Number(query.total || 0);
    const title = decodeURIComponent(query.title || '');
    const arcade = query.arcade === '1';
    const mode = query.mode || 'mixed';
    const stars = starsFromScore(correct, total);

    if (!arcade && itemId) {
      recordPlayResult(packId, itemId, grade, correct, total, stars);
    }

    let encouragement = '继续加油，下一首也很好玩！';
    if (stars >= 3) encouragement = arcade ? '全对！游戏厅高手！' : '太棒了！全部答对，小小诗人！';
    else if (stars === 2) encouragement = '很不错，再练一遍会更熟～';
    else if (stars === 1) encouragement = arcade ? '过关啦，换个玩法再试试。' : '过关啦，多读几遍记得更牢。';
    else encouragement = arcade ? '再来一局，熟能生巧！' : '先读一读原诗，再来挑战一次吧。';

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
      arcade,
      mode,
    });
  },

  onRetry() {
    const { packId, grade, itemId, arcade, mode } = this.data;
    if (arcade) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=${mode}&arcade=1`,
      });
      return;
    }
    wx.redirectTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&itemId=${itemId}`,
    });
  },

  onBackLevels() {
    const { packId, grade, arcade } = this.data;
    if (arcade) {
      wx.switchTab({ url: '/pages/games/games' });
      return;
    }
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
    wx.switchTab({ url: '/pages/home/home' });
  },
});
