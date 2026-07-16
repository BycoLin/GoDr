import { recordPlayResult } from '../../utils/progress';
import { starsFromScore } from '../../utils/quiz';
import { applySessionReward } from '../../utils/wallet';
import { unlockBadges } from '../../utils/badges';
import { recordDailyResult } from '../../utils/daily';
import { countActiveWrongs } from '../../utils/wrongbook';
import { getPackSubjectKind } from '../../utils/registry';
import { markPracticeDay } from '../../utils/streak';
import { recordPracticeSession } from '../../utils/practice-log';
import { goPathHub, markPathStep, buildStepUrl, isPathKind } from '../../utils/skill-path';
import { parseGradeQuery } from '../../utils/grade-label';
import { getActiveGrade } from '../../utils/active-subject';
import {
  buildResultShare,
  toShareAppMessage,
  toShareTimeline,
} from '../../utils/share';

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
    isPoetry: false,
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
    progressNote: '',
    goalNote: '',
    fromPath: '',
    pathStep: '',
    pathDone: false,
    pathNext: false,
    pathNextText: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = parseGradeQuery(query.grade, getActiveGrade(packId));
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
    const fromPath = isPathKind(query.fromPath) ? query.fromPath : '';
    const pathStep = query.pathStep || '';
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

    let newlyCleared = 0;
    if (!arcade && itemId) {
      const play = recordPlayResult(packId, itemId, grade, correct, total, stars);
      newlyCleared = play.newlyCleared ? 1 : 0;
    }

    if (daily) {
      recordDailyResult(correct, total, sessionPoints);
    }

    markPracticeDay();
    const { goalJustDone } = recordPracticeSession(total, newlyCleared);

    let pathDone = false;
    let pathNext = false;
    let pathNextText = '';
    if (fromPath === 'math' && pathStep === 'test') {
      markPathStep('math', 'test');
      pathDone = true;
    }
    if (fromPath === 'english' && pathStep === 'practice') {
      markPathStep('english', 'practice');
      pathNext = true;
      pathNextText = '去测一测';
    }
    if (fromPath === 'english' && pathStep === 'test') {
      markPathStep('english', 'test');
      pathDone = true;
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

    const progressNote = arcade
      ? '本局是自由加练，未计入小岛关卡进度'
      : itemId
        ? '本局已计入关卡进度，可涨星解锁'
        : '';

    const goalNote = goalJustDone ? '今日目标达成！练满 10 题啦' : '';

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
      progressNote,
      goalNote,
      arcade,
      isMath,
      isEnglish,
      isPoetry: !isMath && !isEnglish,
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
      fromPath,
      pathStep,
      pathDone,
      pathNext,
      pathNextText,
    });

    if (goalJustDone) {
      wx.showToast({ title: '今日目标达成', icon: 'success' });
    }
  },

  buildSharePayload() {
    const { title, stars, ratioText, duel, isPoetry, packId, grade, itemId, arcade } = this.data;
    return buildResultShare({
      title,
      stars,
      ratioText,
      duel,
      isPoetry,
      packId,
      grade,
      itemId,
      arcade,
    });
  },

  onShareAppMessage() {
    return toShareAppMessage(this.buildSharePayload());
  },

  onShareTimeline() {
    return toShareTimeline(this.buildSharePayload());
  },

  onPathHub() {
    if (isPathKind(this.data.fromPath)) {
      goPathHub(this.data.fromPath);
    }
  },

  onPathNext() {
    const { fromPath, pathStep, packId, grade } = this.data;
    if (fromPath === 'english' && pathStep === 'practice') {
      wx.redirectTo({
        url: buildStepUrl('english', 'test', { packId, grade }),
      });
    }
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
