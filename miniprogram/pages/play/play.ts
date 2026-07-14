import {
  getItemById,
  getItemsByGrade,
  getPackItems,
  getPackSubjectKind,
  isEnglish,
  isMath,
  isPoetry,
} from '../../utils/registry';
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
import {
  buildEnglishArcadeQuiz,
  buildEnglishBossQuiz,
  buildEnglishQuizForItem,
  ENGLISH_ARCADE_MODE_LABELS,
  nextEnglishAdaptiveQuestion,
} from '../../utils/quiz-english';
import { saveLastSession } from '../../utils/progress';
import { pickBossPool, recordFix, recordWrong } from '../../utils/wrongbook';
import { pointsForCorrect } from '../../utils/wallet';
import {
  DAILY_LIMIT_SEC,
  DAILY_QUESTION_COUNT,
  pickSeededIndex,
  todayKey,
} from '../../utils/daily';
import { playAnswerSfx } from '../../utils/sfx';
import type {
  ArcadeMode,
  EnglishItem,
  KnowledgeItem,
  MathItem,
  PoetryItem,
  Question,
  QuizType,
  SessionAnswer,
} from '../../utils/types';
import type { PackSubjectKind } from '../../utils/registry';


interface MatchState {
  selectedLeft: string;
  selectedRight: string;
  pairs: Record<string, string>;
  leftDone: Record<string, boolean>;
  rightDone: Record<string, boolean>;
}

const ROLLING_TARGET = 8;
const SPRINT_LIMIT_SEC = 60;
const SPRINT_TARGET = 20;
const EXAM_COUNT = 10;
const DUEL_TARGET = 8;
const DUEL_LIMIT_SEC = 90;
const DUEL_RIVAL_MS = 3800;

/** 特殊玩法落到实际出题模式 */
function subjectQuizMode(
  kind: PackSubjectKind,
  mode: ArcadeMode,
  sprint: boolean,
): ArcadeMode {
  if (
    mode === 'duel' ||
    mode === 'sprint' ||
    mode === 'exam' ||
    mode === 'daily' ||
    mode === 'boss'
  ) {
    if (sprint && kind === 'math') return 'mathCalc';
    return 'mixed';
  }
  return mode;
}

Page({
  data: {
    packId: '',
    grade: 1,
    itemId: '',
    arcade: false,
    rolling: false,
    boss: false,
    daily: false,
    duel: false,
    sprint: false,
    exam: false,
    timed: false,
    limitSec: 0,
    remainSec: 0,
    mode: 'mixed' as ArcadeMode,
    modeLabel: '',
    poemTitle: '',
    poemAuthor: '',
    isMathPack: false,
    isEnglishPack: false,
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
    userScore: 0,
    rivalScore: 0,
    duelLead: '' as '' | 'win' | 'lose' | 'tie',
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
  rivalTimerId: 0 as number,
  finished: false,
  lastType: undefined as QuizType | undefined,
  lastCorrect: true,
  subjectKind: 'poetry' as PackSubjectKind,
  quizMode: 'mixed' as ArcadeMode,

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const mode = (query.mode || 'mixed') as ArcadeMode;
    const boss = mode === 'boss' || query.boss === '1';
    const daily = mode === 'daily' || query.daily === '1';
    const duel = mode === 'duel' || query.duel === '1';
    const sprint = mode === 'sprint' || query.sprint === '1';
    const exam = mode === 'exam' || query.exam === '1';
    const timed =
      query.timed === '1' || daily || duel || sprint;
    const limitSec = Number(
      query.limitSec ||
        (daily ? DAILY_LIMIT_SEC : duel ? DUEL_LIMIT_SEC : sprint ? SPRINT_LIMIT_SEC : 0),
    );
    const arcade =
      boss || daily || duel || sprint || exam || query.arcade === '1' || !itemId;
    const rolling = arcade && !exam && !duel;
    const subjectKind = getPackSubjectKind(packId);
    const quizMode = subjectQuizMode(subjectKind, mode, sprint);
    this.subjectKind = subjectKind;
    this.quizMode = quizMode;

    let pool = getItemsByGrade(packId, grade);
    if (daily && !pool.length) {
      pool = getPackItems(packId);
    }
    if (subjectKind === 'math') {
      pool = pool.filter(isMath);
    } else if (subjectKind === 'english') {
      pool = pool.filter(isEnglish);
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
    const englishPool = pool.filter(isEnglish) as EnglishItem[];

    if (boss) {
      if (!wrongHints.length) {
        wx.showToast({ title: '暂无错题，去练习吧', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 900);
        return;
      }
      if (subjectKind === 'math') {
        questions = buildMathBossQuiz(wrongHints, mathPool, 1);
      } else if (subjectKind === 'english') {
        questions = buildEnglishBossQuiz(wrongHints, englishPool, 1);
      } else {
        questions = buildBossQuiz(wrongHints, poetryPool, 1);
      }
      targetTotal = ROLLING_TARGET;
      poemTitle = '错题复习';
      poemAuthor = `${wrongHints.length} 个薄弱点`;
      modeLabel = '错题复习';
      wx.setNavigationBarTitle({ title: '错题复习' });
    } else if (daily) {
      const seed = todayKey();
      const seededPool = pool.slice().sort((a, b) => a.id.localeCompare(b.id));
      const rotated: KnowledgeItem[] = [];
      for (let i = 0; i < Math.min(DAILY_QUESTION_COUNT, seededPool.length * 2); i += 1) {
        rotated.push(seededPool[pickSeededIndex(seed, i, seededPool.length)]);
      }
      if (subjectKind === 'math') {
        questions = buildMathArcadeQuiz(
          (rotated.filter(isMath) as MathItem[]).length
            ? (rotated.filter(isMath) as MathItem[])
            : mathPool,
          'mixed',
          1,
        );
      } else if (subjectKind === 'english') {
        questions = buildEnglishArcadeQuiz(
          (rotated.filter(isEnglish) as EnglishItem[]).length
            ? (rotated.filter(isEnglish) as EnglishItem[])
            : englishPool,
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
      poemTitle = '每日自测';
      poemAuthor = `${limitSec} 秒自测`;
      modeLabel = '每日自测';
      wx.setNavigationBarTitle({ title: '每日自测' });
    } else if (duel) {
      const seedCount = DUEL_TARGET;
      if (subjectKind === 'math') {
        questions = buildMathArcadeQuiz(mathPool, quizMode, seedCount);
      } else if (subjectKind === 'english') {
        questions = buildEnglishArcadeQuiz(englishPool, quizMode, seedCount);
      } else {
        questions = buildArcadeQuiz(poetryPool, quizMode, seedCount);
      }
      targetTotal = DUEL_TARGET;
      poemTitle = '趣味对练';
      poemAuthor = '你 vs 练习伙伴';
      modeLabel = '趣味对练';
      wx.setNavigationBarTitle({ title: '趣味对练' });
    } else if (sprint) {
      if (subjectKind === 'math') {
        questions = buildMathArcadeQuiz(mathPool, quizMode, 1);
        poemTitle = '口算冲刺';
      } else if (subjectKind === 'english') {
        questions = buildEnglishArcadeQuiz(englishPool, quizMode, 1);
        poemTitle = '单词冲刺';
      } else {
        questions = buildArcadeQuiz(poetryPool, quizMode, 1);
        poemTitle = '诗词冲刺';
      }
      targetTotal = SPRINT_TARGET;
      poemAuthor = `${limitSec} 秒比手速`;
      modeLabel = poemTitle;
      wx.setNavigationBarTitle({ title: poemTitle });
    } else if (exam) {
      if (subjectKind === 'math') {
        questions = buildMathArcadeQuiz(mathPool, quizMode, EXAM_COUNT);
        poemTitle = '数学模拟小测';
      } else if (subjectKind === 'english') {
        questions = buildEnglishArcadeQuiz(englishPool, quizMode, EXAM_COUNT);
        poemTitle = '英语模拟小测';
      } else {
        questions = buildArcadeQuiz(poetryPool, quizMode, EXAM_COUNT);
        poemTitle = '诗词模拟小测';
      }
      targetTotal = questions.length || EXAM_COUNT;
      poemAuthor = `${targetTotal} 题一次测`;
      modeLabel = '模拟小测';
      wx.setNavigationBarTitle({ title: '模拟小测' });
    } else if (arcade) {
      if (subjectKind === 'math') {
        questions = buildMathArcadeQuiz(mathPool, quizMode, 1);
        poemTitle = MATH_ARCADE_MODE_LABELS[mode] || ARCADE_MODE_LABELS[mode] || '趣味练习';
      } else if (subjectKind === 'english') {
        questions = buildEnglishArcadeQuiz(englishPool, quizMode, 1);
        poemTitle = ENGLISH_ARCADE_MODE_LABELS[mode] || ARCADE_MODE_LABELS[mode] || '趣味练习';
      } else {
        questions = buildArcadeQuiz(poetryPool, quizMode, 1);
        poemTitle = ARCADE_MODE_LABELS[mode] || '趣味练习';
      }
      targetTotal = ROLLING_TARGET;
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
        poemAuthor = item.subtitle || '数学练习';
        modeLabel = '数学练习';
        wx.setNavigationBarTitle({ title: item.title });
      } else if (isEnglish(item)) {
        questions = buildEnglishQuizForItem(item, englishPool, 5);
        poemTitle = item.word;
        poemAuthor = item.meaning;
        modeLabel = '英语练习';
        wx.setNavigationBarTitle({ title: item.word });
      } else if (isPoetry(item)) {
        questions = buildQuizForItem(item, poetryPool, { count: 5, rampHard: true });
        poemTitle = item.title;
        poemAuthor = item.author;
        modeLabel = '诗词练习';
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

    const resolvedMode: ArcadeMode = boss
      ? 'boss'
      : daily
        ? 'daily'
        : duel
          ? 'duel'
          : sprint
            ? 'sprint'
            : exam
              ? 'exam'
              : mode;

    this.setData({
      packId,
      grade,
      itemId: arcade ? '' : itemId,
      arcade,
      rolling,
      boss,
      daily,
      duel,
      sprint,
      exam,
      timed,
      limitSec,
      remainSec: limitSec,
      mode: resolvedMode,
      modeLabel,
      poemTitle,
      poemAuthor,
      isMathPack: subjectKind === 'math',
      isEnglishPack: subjectKind === 'english',
      questions,
      total: targetTotal,
      index: 0,
      current: questions[0],
      answers: [],
      combo: 0,
      bestCombo: 0,
      sessionPoints: 0,
      userScore: 0,
      rivalScore: 0,
      duelLead: '',
    });
    this.resetMatchState(questions[0]);
    this.resetOrderState(questions[0]);

    if (timed && limitSec > 0) {
      this.startTimer();
    }
    if (duel) {
      this.startRivalTimer();
    }
  },

  onUnload() {
    this.clearTimer();
    this.clearRivalTimer();
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

  startRivalTimer() {
    this.clearRivalTimer();
    this.rivalTimerId = setInterval(() => {
      if (this.finished || !this.data.duel) {
        this.clearRivalTimer();
        return;
      }
      if (Math.random() < 0.65) {
        const rivalScore = this.data.rivalScore + 1;
        const duelLead =
          this.data.userScore > rivalScore
            ? 'win'
            : this.data.userScore < rivalScore
              ? 'lose'
              : 'tie';
        this.setData({ rivalScore, duelLead });
        if (rivalScore >= this.data.total) {
          this.finish(this.data.answers, false);
        }
      }
    }, DUEL_RIVAL_MS) as unknown as number;
  },

  clearRivalTimer() {
    if (this.rivalTimerId) {
      clearInterval(this.rivalTimerId);
      this.rivalTimerId = 0;
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
    const userScore = this.data.duel && correct ? this.data.userScore + 1 : this.data.userScore;
    const duelLead = this.data.duel
      ? userScore > this.data.rivalScore
        ? 'win'
        : userScore < this.data.rivalScore
          ? 'lose'
          : 'tie'
      : '';

    this.lastCorrect = correct;
    this.lastType = quizType;
    playAnswerSfx(correct);

    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      feedbackText: correct
        ? nextCombo >= 3
          ? `${feedbackOk} 连对 x${nextCombo}`
          : feedbackOk
        : feedbackBad,
      answers: nextAnswers,
      combo: nextCombo,
      bestCombo: Math.max(bestCombo, nextCombo),
      sessionPoints: sessionPoints + gained,
      comboPulse: correct && nextCombo >= 2,
      userScore,
      duelLead,
    });

    setTimeout(() => {
      this.setData({ comboPulse: false });
      if (this.data.duel && userScore >= total) {
        this.finish(nextAnswers, false);
        return;
      }
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
        current.type !== 'mathMissing' &&
        current.type !== 'enWordMean' &&
        current.type !== 'enMeanWord' &&
        current.type !== 'enSpell')
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
      const adaptMode = this.quizMode || this.data.mode;
      let q: Question | null = null;
      if (this.subjectKind === 'math') {
        q = nextMathAdaptiveQuestion(
          this.poolCache.filter(isMath) as MathItem[],
          adaptMode,
          {
            combo: this.data.combo,
            lastCorrect: this.lastCorrect,
            lastType: this.lastType,
          },
          this.wrongHints,
        );
      } else if (this.subjectKind === 'english') {
        q = nextEnglishAdaptiveQuestion(
          this.poolCache.filter(isEnglish) as EnglishItem[],
          adaptMode,
          {
            combo: this.data.combo,
            lastCorrect: this.lastCorrect,
            lastType: this.lastType,
          },
          this.wrongHints,
        );
      } else {
        q = nextAdaptiveQuestion(
          this.poolCache.filter(isPoetry) as PoetryItem[],
          adaptMode,
          {
            combo: this.data.combo,
            lastCorrect: this.lastCorrect,
            lastType: this.lastType,
          },
          this.wrongHints,
        );
      }
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
    this.clearRivalTimer();

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
      duel,
      sprint,
      exam,
      sessionPoints,
      bestCombo,
      total,
      userScore,
      rivalScore,
    } = this.data;
    const correct = answers.filter((a) => a.correct).length;
    const answeredTotal = Math.max(
      answers.length,
      questions.length ? Math.min(questions.length, total) : answers.length,
    );
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
      url: `/pages/result/result?packId=${packId}&grade=${grade}&itemId=${itemId}&correct=${correct}&total=${answeredTotal}&title=${title}&arcade=${arcade ? 1 : 0}&mode=${mode}&boss=${boss ? 1 : 0}&daily=${daily ? 1 : 0}&duel=${duel ? 1 : 0}&sprint=${sprint ? 1 : 0}&exam=${exam ? 1 : 0}&userScore=${userScore}&rivalScore=${rivalScore}&points=${sessionPoints}&bestCombo=${bestCombo}&timedOut=${timedOut ? 1 : 0}`,
    });
  },
});
