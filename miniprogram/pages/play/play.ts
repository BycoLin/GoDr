import { getItemById, getItemsByGrade, isPoetry } from '../../utils/registry';
import { buildQuizForItem, gradeAnswer } from '../../utils/quiz';
import { saveLastSession } from '../../utils/progress';
import type { PoetryItem, Question, SessionAnswer } from '../../utils/types';

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
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const itemId = query.itemId || '';
    const item = getItemById(packId, itemId);
    if (!item || !isPoetry(item)) {
      wx.showToast({ title: '诗词不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const pool = getItemsByGrade(packId, grade).filter(isPoetry) as PoetryItem[];
    const questions = buildQuizForItem(item, pool, { count: 5 });
    if (!questions.length) {
      wx.showToast({ title: '出题失败', icon: 'none' });
      return;
    }

    this.setData({
      packId,
      grade,
      itemId,
      poemTitle: item.title,
      poemAuthor: item.author,
      questions,
      total: questions.length,
      index: 0,
      current: questions[0],
      answers: [],
    });
    this.resetMatchState(questions[0]);
    wx.setNavigationBarTitle({ title: `《${item.title}》` });
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

  onChooseOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked) return;
    const optionId = e.currentTarget.dataset.id as string;
    const { current, answers, index, questions, total } = this.data;
    if (!current || (current.type !== 'fillNext' && current.type !== 'titleAuthor')) return;

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
  },

  finish(answers: SessionAnswer[]) {
    const { packId, grade, itemId, poemTitle, questions } = this.data;
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
    };
    saveLastSession(session);
    wx.redirectTo({
      url: `/pages/result/result?packId=${packId}&grade=${grade}&itemId=${itemId}&correct=${correct}&total=${total}&title=${encodeURIComponent(poemTitle)}`,
    });
  },
});
