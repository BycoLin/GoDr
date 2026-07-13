import { recordPlayResult } from '../../utils/progress';
import { starsFromScore } from '../../utils/quiz';
import { applySessionReward } from '../../utils/wallet';
import { unlockBadges } from '../../utils/badges';
import { recordDailyResult } from '../../utils/daily';
import { countActiveWrongs } from '../../utils/wrongbook';
import { getPackSubjectKind } from '../../utils/registry';

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
    isMath: false,
    isEnglish: false,
    mode: 'mixed',
    boss: false,
    daily: false,
    points: 0,
    bestCombo: 0,
    timedOut: false,
    newBadges: [] as Array<{ id: string; title: string }>,
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
    const boss = query.boss === '1' || mode === 'boss';
    const daily = query.daily === '1' || mode === 'daily';
    const sessionPoints = Number(query.points || 0);
    const bestCombo = Number(query.bestCombo || 0);
    const timedOut = query.timedOut === '1';
    const stars = starsFromScore(correct, total);
    const cleared = stars >= 1 || correct >= Math.ceil(Math.max(total, 1) * 0.6);
    const kind = getPackSubjectKind(packId);
    const isMath = kind === 'math';
    const isEnglish = kind === 'english';

    if (!arcade && itemId) {
      recordPlayResult(packId, itemId, grade, correct, total, stars);
    }

    if (daily) {
      recordDailyResult(correct, total, sessionPoints);
    }

    const wallet = applySessionReward({
      correct,
      total,
      stars,
      bestCombo,
      sessionPoints,
      isBoss: boss,
      isDaily: daily,
      cleared,
    });

    const newBadges = unlockBadges({
      wallet,
      stars,
      bestCombo,
      isBoss: boss,
      isDaily: daily,
      cleared,
    }).map((b) => ({ id: b.id, title: b.title }));

    let encouragement = '继续加油！';
    if (timedOut) encouragement = '时间到！再练练手速吧～';
    else if (stars >= 3) {
      encouragement = arcade
        ? '全对！太厉害了！'
        : isMath
          ? '全对！小小速算王！'
          : isEnglish
            ? '全对！小小单词王！'
            : '太棒了！全部答对，小小诗人！';
    } else if (stars === 2) encouragement = '很不错，再练一遍会更熟～';
    else if (stars === 1) {
      encouragement = boss
        ? `错题复习完成！还剩 ${countActiveWrongs(packId)} 个薄弱点`
        : arcade
          ? '完成啦，可以换一种练习再试试。'
          : isMath
            ? '完成啦，口算又进步了。'
            : isEnglish
              ? '完成啦，单词记得更牢了。'
              : '完成啦，多读几遍记得更牢。';
    } else {
      encouragement = arcade
        ? '再练一局，熟能生巧！'
        : isMath
          ? '再算几题，会越来越快。'
          : isEnglish
            ? '再读几遍单词，然后继续练习吧。'
            : '先读一读原诗，然后继续练习吧。';
    }

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
      isMath,
      isEnglish,
      mode,
      boss,
      daily,
      points: sessionPoints,
      bestCombo,
      timedOut,
      newBadges,
    });
  },

  onRetry() {
    const { packId, grade, itemId, arcade, mode, boss, daily } = this.data;
    if (boss) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=boss&boss=1&arcade=1`,
      });
      return;
    }
    if (daily) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=daily&daily=1&timed=1&limitSec=90&arcade=1`,
      });
      return;
    }
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
    const { packId, grade, arcade, boss } = this.data;
    if (boss) {
      wx.redirectTo({ url: `/pages/wrongbook/wrongbook?packId=${packId}` });
      return;
    }
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
