import { getItemById, getItemsByGrade, isPoetry } from '../../utils/registry';
import { ARCADE_MODE_LABELS, buildArcadeQuiz, buildQuizForItem, gradeAnswer } from '../../utils/quiz';
import { saveLastSession } from '../../utils/progress';
import type { ArcadeMode, PoetryItem, Question, SessionAnswer } from '../../utils/types';

interface MatchState {
  selectedLeft: string;
  selectedRight: string;
  pairs: Record<string, string>;
  leftDone: Record<string, boolean>;
  rightDone: Record<string, boolean>;
}

Page({
  data: {
    packId: '',
    grade: 1,
    itemId: '',
    arcade: false,
    mode: 'mixed' as ArcadeMode,
    modeLabel: '',
    poemTitle: '',
    poemAuthor: '',
    questions: [] as Question[],
    index: 0,
    total: 0,
    current: null as Question | null,
    answers: [] as SessionAnswer[],
    feedback: '' as '' | 'ok' | 'bad',
    feedbackText: '',
    locked: false,
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

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const arcade = query.arcade === '1' || !itemId;
    const mode = (query.mode || 'mixed') as ArcadeMode;
    const pool = getItemsByGrade(packId, grade).filter(isPoetry) as PoetryItem[];

    if (!pool.length) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    let questions: Question[] = [];
    let poemTitle = '';
    let poemAuthor = '';
    let modeLabel = '';

    if (arcade) {
      questions = buildArcadeQuiz(pool, mode, 8);
      poemTitle = ARCADE_MODE_LABELS[mode] || '趣味闯关';
      poemAuthor = `${grade} 年级`;
      modeLabel = poemTitle;
      wx.setNavigationBarTitle({ title: poemTitle });
    } else {
      const item = getItemById(packId, itemId);
      if (!item || !isPoetry(item)) {
        wx.showToast({ title: '诗词不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 800);
        return;
      }
      questions = buildQuizForItem(item, pool, { count: 5 });
      poemTitle = item.title;
      poemAuthor = item.author;
      modeLabel = '诗词闯关';
      wx.setNavigationBarTitle({ title: `《${item.title}》` });
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
      mode,
      modeLabel,
      poemTitle,
      poemAuthor,
      questions,
      total: questions.length,
      index: 0,
      current: questions[0],
      answers: [],
    });
    this.resetMatchState(questions[0]);
    this.resetOrderState(questions[0]);
  },

  resetMatchState(question: Question | null) {
    if (!question || question.type !== 'matchPair') {
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
      return;
    }
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

  onChooseOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked) return;
    const optionId = e.currentTarget.dataset.id as string;
    const { current, answers, index, questions, total } = this.data;
    if (
      !current ||
      (current.type !== 'fillNext' &&
        current.type !== 'titleAuthor' &&
        current.type !== 'fillBlank')
    ) {
      return;
    }

    const correct = gradeAnswer(current, optionId);
    const nextAnswers = answers.concat([{ questionId: current.id, correct }]);
    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      feedbackText: correct ? '答对啦！' : '再想想～',
      answers: nextAnswers,
    });

    setTimeout(() => {
      this.advance(nextAnswers, index, questions, total);
    }, 700);
  },

  onTapLeft(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked) return;
    const id = e.currentTarget.dataset.id as string;
    if (this.data.match.leftDone[id]) return;
    this.setData({ 'match.selectedLeft': id });
    this.tryPair();
  },

  onTapRight(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked) return;
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
    if (this.data.locked || !this.data.matchReady) return;
    const { current, answers, index, questions, total, match } = this.data;
    if (!current || current.type !== 'matchPair') return;

    const correct = gradeAnswer(current, match.pairs);
    const nextAnswers = answers.concat([{ questionId: current.id, correct }]);
    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      feedbackText: correct ? '配对成功！' : '有的对不上哦',
      answers: nextAnswers,
    });

    setTimeout(() => {
      this.advance(nextAnswers, index, questions, total);
    }, 800);
  },

  onTapOrderOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked) return;
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
    if (this.data.locked) return;
    const { current, answers, index, questions, total, orderPicked } = this.data;
    if (!current || current.type !== 'orderLines') return;
    if (orderPicked.length !== current.answerOrder.length) {
      wx.showToast({ title: '请排完所有诗句', icon: 'none' });
      return;
    }

    const correct = gradeAnswer(current, orderPicked);
    const nextAnswers = answers.concat([{ questionId: current.id, correct }]);
    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      feedbackText: correct ? '顺序正确！' : '顺序不对哦',
      answers: nextAnswers,
    });

    setTimeout(() => {
      this.advance(nextAnswers, index, questions, total);
    }, 800);
  },

  advance(answers: SessionAnswer[], index: number, questions: Question[], total: number) {
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      this.finish(answers);
      return;
    }
    const nextQ = questions[nextIndex];
    this.setData({
      index: nextIndex,
      current: nextQ,
      locked: false,
      feedback: '',
      feedbackText: '',
    });
    this.resetMatchState(nextQ);
    this.resetOrderState(nextQ);
  },

  finish(answers: SessionAnswer[]) {
    const { packId, grade, itemId, poemTitle, questions, arcade, mode } = this.data;
    const correct = answers.filter((a) => a.correct).length;
    const total = questions.length;
    const session = {
      packId,
      grade,
      itemId,
      poemTitle,
      correct,
      total,
      answers,
      arcade,
      mode,
    };
    saveLastSession(session);
    const title = encodeURIComponent(poemTitle);
    wx.redirectTo({
      url: `/pages/result/result?packId=${packId}&grade=${grade}&itemId=${itemId}&correct=${correct}&total=${total}&title=${title}&arcade=${arcade ? 1 : 0}&mode=${mode}`,
    });
  },
});
