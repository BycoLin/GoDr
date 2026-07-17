import { speakChinese, stopSpeak } from '../../utils/tts';
import { playAnswerSfx } from '../../utils/sfx';

const {
  getInitials,
  getFinals,
  getAllSyllables,
  resolveFinalId,
} = require('../../data/tools/pinyin');

interface DrillOption {
  id: string;
  label: string;
}

interface DrillQuestion {
  char: string;
  pinyin: string;
  answerId: string;
  prompt: string;
  options: DrillOption[];
}

const QUESTION_COUNT = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildInitialQuestion(): DrillQuestion | null {
  const pool = getAllSyllables().filter((s: { initial: string }) => s.initial);
  if (!pool.length) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  const initials = getInitials();
  const answer = initials.find((i: { id: string }) => i.id === item.initial);
  if (!answer) return null;
  const distractors = shuffle(
    initials.filter((i: { id: string }) => i.id !== answer.id),
  ).slice(0, 3);
  const options = shuffle([answer, ...distractors]).map((opt: { id: string }) => ({
    id: opt.id,
    label: opt.id,
  }));
  return {
    char: item.char,
    pinyin: item.pinyin,
    answerId: answer.id,
    prompt: `「${item.char}」的声母是？`,
    options,
  };
}

function buildFinalQuestion(): DrillQuestion | null {
  const pool = getAllSyllables();
  if (!pool.length) return null;
  const item = pool[Math.floor(Math.random() * pool.length)];
  const answerId = resolveFinalId(item.final);
  const finals = getFinals();
  const answer = finals.find((f: { id: string }) => f.id === answerId);
  if (!answer) return null;
  const distractors = shuffle(
    finals.filter((f: { id: string }) => f.id !== answer.id),
  ).slice(0, 3);
  const options = shuffle([answer, ...distractors]).map(
    (opt: { id: string; label: string }) => ({
      id: opt.id,
      label: opt.label,
    }),
  );
  return {
    char: item.char,
    pinyin: item.pinyin,
    answerId: answer.id,
    prompt: `「${item.char}」（${item.pinyin}）的韵母是？`,
    options,
  };
}

Page({
  data: {
    kind: 'initial' as 'initial' | 'final',
    index: 0,
    total: QUESTION_COUNT,
    correct: 0,
    question: null as DrillQuestion | null,
    options: [] as DrillOption[],
    feedback: '' as '' | 'ok' | 'bad',
    done: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const kind = query.kind === 'final' ? 'final' : 'initial';
    wx.setNavigationBarTitle({
      title: kind === 'final' ? '韵母认读练' : '声母认读练',
    });
    const questions: DrillQuestion[] = [];
    let guard = 0;
    while (questions.length < QUESTION_COUNT && guard < QUESTION_COUNT * 8) {
      guard += 1;
      const q = kind === 'final' ? buildFinalQuestion() : buildInitialQuestion();
      if (q) questions.push(q);
    }
    this.questions = questions;
    this.setData({ kind, total: questions.length });
    this.showQuestion(0);
  },

  questions: [] as DrillQuestion[],

  showQuestion(index: number) {
    const question = this.questions[index];
    if (!question) {
      this.setData({ done: true, question: null, options: [] });
      return;
    }
    this.setData({
      index,
      question,
      options: question.options,
      feedback: '',
      done: false,
    });
  },

  onSpeak() {
    const { question } = this.data;
    if (!question) return;
    speakChinese(question.char, `${question.pinyin} · ${question.char}`);
  },

  onUnload() {
    stopSpeak();
  },

  onChoose(e: WechatMiniprogram.TouchEvent) {
    if (this.data.feedback === 'ok' || this.data.done) return;
    const id = String(e.currentTarget.dataset.id || '');
    const { question, index, total, correct } = this.data;
    if (!question) return;
    const ok = id === question.answerId;
    playAnswerSfx(ok);
    this.setData({ feedback: ok ? 'ok' : 'bad' });
    if (!ok) return;

    const nextCorrect = correct + 1;
    setTimeout(() => {
      if (index + 1 >= total) {
        this.setData({ done: true, correct: nextCorrect, question: null, options: [] });
        wx.showToast({
          title: `完成 ${nextCorrect}/${total}`,
          icon: 'success',
        });
        return;
      }
      this.setData({ correct: nextCorrect });
      this.showQuestion(index + 1);
    }, 500);
  },

  onAgain() {
    const { kind } = this.data;
    wx.redirectTo({
      url: `/pages/pinyin-drill/pinyin-drill?kind=${kind}`,
    });
  },

  onBackHub() {
    wx.navigateBack();
  },
});
