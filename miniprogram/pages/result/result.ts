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
    duel: false,
    sprint: false,
    exam: false,
    userScore: 0,
    rivalScore: 0,
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
    const duel = query.duel === '1' || mode === 'duel';
    const sprint = query.sprint === '1' || mode === 'sprint';
    const exam = query.exam === '1' || mode === 'exam';
    const userScore = Number(query.userScore || 0);
    const rivalScore = Number(query.rivalScore || 0);
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

    let encouragement = '再闯一局会更强！';
    let ratioText = `${correct} / ${total}`;

    if (duel) {
      ratioText = `${userScore} : ${rivalScore}`;
      if (userScore > rivalScore) encouragement = '对练胜利！你更快更准！';
      else if (userScore < rivalScore) encouragement = '差一点点，再对练一局～';
      else encouragement = '平手！再来比一比～';
    } else if (timedOut) {
      encouragement = sprint ? '时间到！手速还能再练～' : '时间到！再来练习！';
    } else if (exam) {
      encouragement =
        stars >= 3
          ? '十题全对！超级棒！'
          : stars >= 2
            ? '完成啦！还能冲三星～'
            : '本轮完成，错题回头再练练！';
    } else if (stars >= 3) {
      encouragement = arcade
        ? '全对！太棒了！'
        : isMath
          ? '三星通关！小小速算王！'
          : isEnglish
            ? '三星通关！单词小高手！'
            : '三星通关！小小诗人！';
    } else if (stars === 2) {
      encouragement = '完成啦！再练一次冲三星～';
    } else if (stars === 1) {
      encouragement = boss
        ? `巩固完成！还剩 ${countActiveWrongs(packId)} 个薄弱点`
        : arcade
          ? '完成啦，换种方式再练练～'
          : '本关过了！下一关等你来！';
    } else {
      encouragement = arcade
        ? '没关系，再练一次就熟了！'
        : '先缓缓，再练一关会更好！';
    }

    this.setData({
      packId,
      grade,
      itemId,
      title,
      correct,
      total,
      stars,
      ratioText,
      encouragement,
      arcade,
      isMath,
      isEnglish,
      mode,
      boss,
      daily,
      duel,
      sprint,
      exam,
      userScore,
      rivalScore,
      points: sessionPoints,
      bestCombo,
      timedOut,
      newBadges,
    });
  },

  onRetry() {
    const { packId, grade, itemId, arcade, mode, boss, daily, duel, sprint, exam } = this.data;
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
    if (duel) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=duel&duel=1&arcade=1`,
      });
      return;
    }
    if (sprint) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=sprint&sprint=1&arcade=1`,
      });
      return;
    }
    if (exam) {
      wx.redirectTo({
        url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=exam&exam=1&arcade=1`,
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
