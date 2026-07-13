import { getItemById, getItemsByGrade, getPackItems, isMath, isMathPack, isPoetry } from '../../utils/registry';
import {
  ARCADE_MODE_LABELS,
  buildArcadeQuiz,
  buildBossQuiz,
  buildQuizForItem,
  gradeAnswer,
  nextAdaptiveQuestion,
  questionItemId,
  starsFromScore,
} from '../../utils/quiz';
import {
  buildMathArcadeQuiz,
  buildMathBossQuiz,
  buildMathQuizForItem,
  MATH_ARCADE_MODE_LABELS,
  nextMathAdaptiveQuestion,
} from '../../utils/quiz-math';
import { saveLastSession } from '../../utils/progress';
import { pickBossPool, recordFix, recordWrong } from '../../utils/wrongbook';
import { pointsForCorrect } from '../../utils/wallet';
import {
  DAILY_LIMIT_SEC,
  DAILY_QUESTION_COUNT,
  pickSeededIndex,
  todayKey,
} from '../../utils/daily';
import type {
  ArcadeMode,
  KnowledgeItem,
  MathItem,
  PoetryItem,
  Question,
  QuizType,
  SessionAnswer,
} from '../../utils/types';


interface MatchState {
  selectedLeft: string;
  selectedRight: string;
  pairs: Record<string, string>;
  leftDone: Record<string, boolean>;
  rightDone: Record<string, boolean>;
}

const ROLLING_TARGET = 8;

Page({
  data: {
    packId: '',
    grade: 1,
    itemId: '',
    arcade: false,
    rolling: false,
    boss: false,
    daily: false,
    timed: false,
    limitSec: 0,
    remainSec: 0,
    mode: 'mixed' as ArcadeMode,
    modeLabel: '',
    poemTitle: '',
    poemAuthor: '',
    isMathPack: false,
    questions: [] as Question[],
    index: 0,
    total: 0,
    current: null as Question | null,
    answers: [] as SessionAnswer[],
    feedback: '' as '' | 'ok' | 'bad',
    feedbackText: '',
    locked: false,
    combo: 0,
    bestCombo: 0,
    sessionPoints: 0,
    comboPulse: false,
    match: {
      selectedLeft: '',
      selectedRight: '',
      pairs: {},
      leftDone: {},
      rightDone: {},
    } as MatchState,
    matchReady: false,
    orderPicked: [] as string[],
    orderPickedTexts: [] as string[],
    orderAvailable: {} as Record<string, boolean>,
  },

  poolCache: [] as KnowledgeItem[],
  wrongHints: [] as Array<{ itemId: string; quizType: QuizType }>,
  timerId: 0 as number,
  finished: false,
  lastType: undefined as QuizType | undefined,
  lastCorrect: true,
  subjectMath: false,

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const mode = (query.mode || 'mixed') as ArcadeMode;
    const boss = mode === 'boss' || query.boss === '1';
    const daily = mode === 'daily' || query.daily === '1';
    const timed = query.timed === '1' || daily;
    const limitSec = Number(query.limitSec || (daily ? DAILY_LIMIT_SEC : 0));
    const arcade = boss || daily || query.arcade === '1' || !itemId;
    const rolling = arcade;
    const subjectMath = isMathPack(packId);
    this.subjectMath = subjectMath;

    let pool = getItemsByGrade(packId, grade);
    if (daily && !pool.length) {
      pool = getPackItems(packId);
    }
    if (subjectMath) {
      pool = pool.filter(isMath);
    } else {
      pool = pool.filter(isPoetry);
    }

    if (!pool.length) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const wrongHints = pickBossPool(packId, 12).map((e) => ({
      itemId: e.itemId,
      quizType: e.quizType,
    }));
    this.poolCache = pool;
    this.wrongHints = wrongHints;
    this.finished = false;

    let questions: Question[] = [];
    let poemTitle = '';
    let poemAuthor = '';
    let modeLabel = '';
    let targetTotal = 5;
    const mathPool = pool.filter(isMath) as MathItem[];
    const poetryPool = pool.filter(isPoetry) as PoetryItem[];

    if (boss) {
      if (!wrongHints.length) {
        wx.showToast({ title: '暂无错题，去闯关吧', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 900);
        return;
      }
      questions = subjectMath
        ? buildMathBossQuiz(wrongHints, mathPool, 1)
        : buildBossQuiz(wrongHints, poetryPool, 1);
      targetTotal = ROLLING_TARGET;
      poemTitle = '错题 Boss';
      poemAuthor = `${wrongHints.length} 个薄弱点`;
      modeLabel = '错题 Boss';
      wx.setNavigationBarTitle({ title: '错题 Boss' });
    } else if (daily) {
      const seed = todayKey();
      const seededPool = pool.slice().sort((a, b) => a.id.localeCompare(b.id));
      const rotated: KnowledgeItem[] = [];
      for (let i = 0; i < Math.min(DAILY_QUESTION_COUNT, seededPool.length * 2); i += 1) {
        rotated.push(seededPool[pickSeededIndex(seed, i, seededPool.length)]);
      }
      if (subjectMath) {
        questions = buildMathArcadeQuiz(
          (rotated.filter(isMath) as MathItem[]).length
            ? (rotated.filter(isMath) as MathItem[])
            : mathPool,
          'mixed',
          1,
        );
      } else {
        questions = buildArcadeQuiz(
          (rotated.filter(isPoetry) as PoetryItem[]).length
            ? (rotated.filter(isPoetry) as PoetryItem[])
            : poetryPool,
          'mixed',
          1,
        );
      }
      targetTotal = DAILY_QUESTION_COUNT;
      poemTitle = '每日限时';
      poemAuthor = `${limitSec} 秒挑战`;
      modeLabel = '每日限时';
      wx.setNavigationBarTitle({ title: '每日限时' });
    } else if (arcade) {
      questions = subjectMath
        ? buildMathArcadeQuiz(mathPool, mode, 1)
        : buildArcadeQuiz(poetryPool, mode, 1);
      targetTotal = ROLLING_TARGET;
      poemTitle =
        (subjectMath ? MATH_ARCADE_MODE_LABELS[mode] : ARCADE_MODE_LABELS[mode]) ||
        ARCADE_MODE_LABELS[mode] ||
        '趣味闯关';
      poemAuthor = `${grade} 年级`;
      modeLabel = poemTitle;
      wx.setNavigationBarTitle({ title: poemTitle });
    } else {
      const item = getItemById(packId, itemId);
      if (!item) {
        wx.showToast({ title: '关卡不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 800);
        return;
      }
      if (isMath(item)) {
        questions = buildMathQuizForItem(item, 5);
        poemTitle = item.title;
        poemAuthor = item.subtitle || '数学闯关';
        modeLabel = '数学闯关';
        wx.setNavigationBarTitle({ title: item.title });
      } else if (isPoetry(item)) {
        questions = buildQuizForItem(item, poetryPool, { count: 5, rampHard: true });
        poemTitle = item.title;
        poemAuthor = item.author;
        modeLabel = '诗词闯关';
        wx.setNavigationBarTitle({ title: `《${item.title}》` });
      } else {
        wx.showToast({ title: '关卡不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 800);
        return;
      }
      targetTotal = questions.length;
    }

    if (!questions.length) {
      wx.showToast({ title: '出题失败', icon: 'none' });
      return;
    }

    this.setData({
      packId,
      grade,
      itemId: arcade ? '' : itemId,
      arcade,
      rolling,
      boss,
      daily,
      timed,
      limitSec,
      remainSec: limitSec,
      mode: boss ? 'boss' : daily ? 'daily' : mode,
      modeLabel,
      poemTitle,
      poemAuthor,
      isMathPack: subjectMath,
      questions,
      total: targetTotal,
      index: 0,
      current: questions[0],
      answers: [],
      combo: 0,
      bestCombo: 0,
      sessionPoints: 0,
    });
    this.resetMatchState(questions[0]);
    this.resetOrderState(questions[0]);

    if (timed && limitSec > 0) {
      this.startTimer();
    }
  },

  onUnload() {
    this.clearTimer();
  },

  startTimer() {
    this.clearTimer();
    this.timerId = setInterval(() => {
      if (this.finished) {
        this.clearTimer();
        return;
      }
      const remain = this.data.remainSec - 1;
      if (remain <= 0) {
        this.setData({ remainSec: 0 });
        this.clearTimer();
        this.finish(this.data.answers, true);
        return;
      }
      this.setData({ remainSec: remain });
    }, 1000) as unknown as number;
  },

  clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = 0;
    }
  },

  resetMatchState(question: Question | null) {
    this.setData({
      match: {
        selectedLeft: '',
        selectedRight: '',
        pairs: {},
        leftDone: {},
        rightDone: {},
      },
      matchReady: false,
    });
    if (!question || question.type !== 'matchPair') return;
  },

  resetOrderState(question: Question | null) {
    if (!question || question.type !== 'orderLines') {
      this.setData({
        orderPicked: [],
        orderPickedTexts: [],
        orderAvailable: {},
      });
      return;
    }
    const orderAvailable: Record<string, boolean> = {};
    question.options.forEach((o) => {
      orderAvailable[o.id] = true;
    });
    this.setData({
      orderPicked: [],
      orderPickedTexts: [],
      orderAvailable,
    });
  },

  handleGraded(correct: boolean, feedbackOk: string, feedbackBad: string) {
    const { current, answers, index, questions, total, packId, boss, combo, bestCombo, sessionPoints } =
      this.data;
    if (!current) return;

    const itemId = questionItemId(current);
    const quizType = current.type as QuizType;

    if (correct) {
      if (boss && itemId) recordFix(packId, itemId, quizType);
    } else if (itemId) {
      recordWrong(packId, itemId, quizType);
    }

    const nextCombo = correct ? combo + 1 : 0;
    const gained = correct ? pointsForCorrect(nextCombo) : 0;
    const nextAnswers = answers.concat([{ questionId: current.id, correct }]);

    this.lastCorrect = correct;
    this.lastType = quizType;

    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      feedbackText: correct
        ? nextCombo >= 3
          ? `${feedbackOk} 连击 x${nextCombo}`
          : feedbackOk
        : feedbackBad,
      answers: nextAnswers,
      combo: nextCombo,
      bestCombo: Math.max(bestCombo, nextCombo),
      sessionPoints: sessionPoints + gained,
      comboPulse: correct && nextCombo >= 2,
    });

    setTimeout(() => {
      this.setData({ comboPulse: false });
      this.advance(nextAnswers, index, questions, total);
    }, correct ? 700 : 800);
  },

  onChooseOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked || this.finished) return;
    const optionId = e.currentTarget.dataset.id as string;
    const { current } = this.data;
    if (
      !current ||
      (current.type !== 'fillNext' &&
        current.type !== 'titleAuthor' &&
        current.type !== 'fillBlank' &&
        current.type !== 'mathCalc' &&
        current.type !== 'mathCompare' &&
        current.type !== 'mathMissing')
    ) {
      return;
    }
    const correct = gradeAnswer(current, optionId);
    this.handleGraded(correct, '答对啦！超棒！', '差一点点，再试试～');
  },

  onTapLeft(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked || this.finished) return;
    const id = e.currentTarget.dataset.id as string;
    if (this.data.match.leftDone[id]) return;
    this.setData({ 'match.selectedLeft': id });
    this.tryPair();
  },

  onTapRight(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked || this.finished) return;
    const id = e.currentTarget.dataset.id as string;
    if (this.data.match.rightDone[id]) return;
    this.setData({ 'match.selectedRight': id });
    this.tryPair();
  },

  tryPair() {
    const { match, current } = this.data;
    if (!current || current.type !== 'matchPair') return;
    const left = match.selectedLeft;
    const right = match.selectedRight;
    if (!left || !right) return;

    const pairs = { ...match.pairs, [left]: right };
    const leftDone = { ...match.leftDone, [left]: true };
    const rightDone = { ...match.rightDone, [right]: true };
    const matchReady = Object.keys(pairs).length === current.left.length;

    this.setData({
      match: {
        selectedLeft: '',
        selectedRight: '',
        pairs,
        leftDone,
        rightDone,
      },
      matchReady,
    });
  },

  onUndoMatch() {
    if (this.data.locked) return;
    this.resetMatchState(this.data.current);
  },

  onSubmitMatch() {
    if (this.data.locked || !this.data.matchReady || this.finished) return;
    const { current, match } = this.data;
    if (!current || current.type !== 'matchPair') return;
    const correct = gradeAnswer(current, match.pairs);
    this.handleGraded(correct, '配对成功！赞！', '有的还对不上哦');
  },

  onTapOrderOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked || this.finished) return;
    const id = e.currentTarget.dataset.id as string;
    const text = e.currentTarget.dataset.text as string;
    if (!this.data.orderAvailable[id]) return;
    const orderPicked = this.data.orderPicked.concat(id);
    const orderPickedTexts = this.data.orderPickedTexts.concat(text);
    const orderAvailable = { ...this.data.orderAvailable, [id]: false };
    this.setData({ orderPicked, orderPickedTexts, orderAvailable });
  },

  onUndoOrder() {
    if (this.data.locked) return;
    this.resetOrderState(this.data.current);
  },

  onSubmitOrder() {
    if (this.data.locked || this.finished) return;
    const { current, orderPicked } = this.data;
    if (!current || current.type !== 'orderLines') return;
    if (orderPicked.length !== current.answerOrder.length) {
      wx.showToast({ title: '请排完所有诗句', icon: 'none' });
      return;
    }
    const correct = gradeAnswer(current, orderPicked);
    this.handleGraded(correct, '顺序正确！厉害！', '顺序还不对哦');
  },

  advance(answers: SessionAnswer[], index: number, questions: Question[], total: number) {
    if (this.finished) return;
    const nextIndex = index + 1;

    let nextQuestions = questions;
    if (this.data.rolling && nextIndex < total && nextIndex >= questions.length) {
      const q = this.subjectMath
        ? nextMathAdaptiveQuestion(
            this.poolCache.filter(isMath) as MathItem[],
            this.data.mode,
            {
              combo: this.data.combo,
              lastCorrect: this.lastCorrect,
              lastType: this.lastType,
            },
            this.wrongHints,
          )
        : nextAdaptiveQuestion(
            this.poolCache.filter(isPoetry) as PoetryItem[],
            this.data.mode,
            {
              combo: this.data.combo,
              lastCorrect: this.lastCorrect,
              lastType: this.lastType,
            },
            this.wrongHints,
          );
      if (q) {
        nextQuestions = questions.concat([q]);
      } else {
        this.finish(answers);
        return;
      }
    }

    if (nextIndex >= total) {
      this.finish(answers);
      return;
    }

    const nextQ = nextQuestions[nextIndex];
    if (!nextQ) {
      this.finish(answers);
      return;
    }

    this.setData({
      questions: nextQuestions,
      index: nextIndex,
      current: nextQ,
      locked: false,
      feedback: '',
      feedbackText: '',
    });
    this.resetMatchState(nextQ);
    this.resetOrderState(nextQ);
  },

  finish(answers: SessionAnswer[], timedOut = false) {
    if (this.finished) return;
    this.finished = true;
    this.clearTimer();

    const {
      packId,
      grade,
      itemId,
      poemTitle,
      questions,
      arcade,
      mode,
      boss,
      daily,
      sessionPoints,
      bestCombo,
      total,
    } = this.data;
    const correct = answers.filter((a) => a.correct).length;
    const answeredTotal = Math.max(answers.length, questions.length ? Math.min(questions.length, total) : answers.length);
    const stars = starsFromScore(correct, Math.max(answeredTotal, 1));
    const session = {
      packId,
      grade,
      itemId,
      poemTitle,
      correct,
      total: answeredTotal,
      answers,
      arcade,
      mode,
      boss,
      daily,
      sessionPoints,
      bestCombo,
      timedOut,
      stars,
    };
    saveLastSession(session);
    const title = encodeURIComponent(poemTitle);
    wx.redirectTo({
      url: `/pages/result/result?packId=${packId}&grade=${grade}&itemId=${itemId}&correct=${correct}&total=${answeredTotal}&title=${title}&arcade=${arcade ? 1 : 0}&mode=${mode}&boss=${boss ? 1 : 0}&daily=${daily ? 1 : 0}&points=${sessionPoints}&bestCombo=${bestCombo}&timedOut=${timedOut ? 1 : 0}`,
    });
  },
});
