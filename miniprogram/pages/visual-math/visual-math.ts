import { randRange } from '../../utils/random';
import { playAnswerSfx } from '../../utils/sfx';

const FRUITS = ['🍓', '🍎', '🍊', '🍇', '🍒', '🍑'];

Page({
  data: {
    total: 8,
    take: 3,
    answer: 5,
    fruit: '🍓',
    icons: [] as Array<{ id: number; gone: boolean }>,
    input: '',
    streak: 0,
    correctCount: 0,
    feedback: '' as '' | 'ok' | 'bad',
  },

  onLoad() {
    this.nextQuestion();
  },

  nextQuestion() {
    const total = randRange(4, 10);
    const take = randRange(1, total - 1);
    const fruit = FRUITS[randRange(0, FRUITS.length - 1)];
    const icons = Array.from({ length: total }, (_, i) => ({
      id: i,
      gone: i < take,
    }));
    this.setData({
      total,
      take,
      answer: total - take,
      fruit,
      icons,
      input: '',
      feedback: '',
    });
  },

  onKey(e: WechatMiniprogram.CustomEvent) {
    const key = e.detail.key as string;
    if (this.data.feedback === 'ok') return;

    if (key === 'clear') {
      this.setData({ input: '', feedback: '' });
      return;
    }
    if (key === 'ok') {
      this.submit();
      return;
    }
    if (this.data.input.length >= 2) return;
    this.setData({
      input: this.data.input + key,
      feedback: '',
    });
  },

  submit() {
    const value = Number(this.data.input);
    if (this.data.input === '' || Number.isNaN(value)) {
      wx.showToast({ title: '先输入答案', icon: 'none' });
      return;
    }
    const ok = value === this.data.answer;
    playAnswerSfx(ok);
    if (ok) {
      const streak = this.data.streak + 1;
      this.setData({
        feedback: 'ok',
        streak,
        correctCount: this.data.correctCount + 1,
      });
      setTimeout(() => this.nextQuestion(), 800);
    } else {
      this.setData({ feedback: 'bad', streak: 0 });
    }
  },
});
