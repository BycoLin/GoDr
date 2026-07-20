import { randRange } from '../../utils/random';
import { playAnswerSfx } from '../../../utils/sfx';
import { buildStepUrl, markPathStep, type PathKind, type PathStepId } from '../../../utils/skill-path';
import { ROUTES } from '../../../utils/routes';

interface Level {
  id: string;
  title: string;
  step: number;
  blanks: number;
  maxStart: number;
}

const LEVELS: Level[] = [
  { id: 'bronze', title: '青铜', step: 1, blanks: 2, maxStart: 8 },
  { id: 'silver', title: '白银', step: 1, blanks: 2, maxStart: 20 },
  { id: 'gold', title: '铂金', step: 2, blanks: 2, maxStart: 20 },
  { id: 'diamond', title: '钻石', step: 3, blanks: 2, maxStart: 30 },
  { id: 'king', title: '王者', step: 5, blanks: 2, maxStart: 50 },
];

Page({
  data: {
    levels: LEVELS,
    levelId: 'bronze',
    slots: [] as Array<{ value: number | null; show: boolean; filled: string }>,
    blankIndexes: [] as number[],
    blankCursor: 0,
    focusIndex: -1,
    input: '',
    feedback: '' as '' | 'ok' | 'bad',
    streak: 0,
    fromPath: false,
    pathKind: '' as '' | PathKind,
    pathStep: '' as '' | PathStepId,
  },

  onLoad(query: Record<string, string | undefined>) {
    const fromPath = query.fromPath === 'math' || query.fromPath === 'pinyin';
    this.setData({
      fromPath,
      pathKind: (fromPath ? query.fromPath : '') as '' | PathKind,
      pathStep: (query.pathStep || '') as '' | PathStepId,
    });
    if (fromPath) wx.setNavigationBarTitle({ title: '练一练 · 数字排队' });
    this.nextQuestion();
  },

  currentLevel(): Level {
    return LEVELS.find((l) => l.id === this.data.levelId) || LEVELS[0];
  },

  onSelectLevel(e: WechatMiniprogram.TouchEvent) {
    const levelId = e.currentTarget.dataset.id as string;
    this.setData({ levelId, streak: 0 });
    this.nextQuestion();
  },

  nextQuestion() {
    const level = this.currentLevel();
    const len = 4;
    const start = randRange(1, level.maxStart);
    const values = Array.from({ length: len }, (_, i) => start + i * level.step);

    // 后两格常为空白（参考图），也随机混一点
    let blankIndexes = [2, 3];
    if (level.id === 'king') blankIndexes = [1, 3];
    if (level.id === 'diamond') blankIndexes = [1, 2];

    const slots = values.map((value, i) => {
      const isBlank = blankIndexes.includes(i);
      return {
        value,
        show: !isBlank,
        filled: '',
      };
    });

    this.setData({
      slots,
      blankIndexes,
      blankCursor: 0,
      focusIndex: blankIndexes[0],
      input: '',
      feedback: '',
    });
  },

  onKey(e: WechatMiniprogram.CustomEvent) {
    const key = e.detail.key as string;
    if (this.data.feedback === 'ok') return;

    if (key === 'clear') {
      const slots = this.data.slots.map((s) =>
        s.show ? s : { ...s, filled: '' },
      );
      this.setData({
        slots,
        blankCursor: 0,
        focusIndex: this.data.blankIndexes[0],
        input: '',
        feedback: '',
      });
      return;
    }

    if (key === 'ok') {
      this.submit();
      return;
    }

    const { blankIndexes, blankCursor, slots } = this.data;
    if (blankCursor >= blankIndexes.length) return;
    const idx = blankIndexes[blankCursor];
    const nextSlots = slots.slice();
    const prev = nextSlots[idx].filled;
    if (prev.length >= 2) return;
    const filled = prev + key;
    nextSlots[idx] = { ...nextSlots[idx], filled };

    let nextCursor = blankCursor;
    if (filled.length >= 2) {
      nextCursor = Math.min(blankCursor + 1, blankIndexes.length - 1);
    }

    this.setData({
      slots: nextSlots,
      blankCursor: nextCursor,
      focusIndex: blankIndexes[nextCursor],
      input: filled,
      feedback: '',
    });
  },

  onTapBlank(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const pos = this.data.blankIndexes.indexOf(index);
    if (pos < 0) return;
    this.setData({ blankCursor: pos, focusIndex: index, feedback: '' });
  },

  submit() {
    const { slots, blankIndexes } = this.data;
    if (blankIndexes.some((idx) => !slots[idx].filled)) {
      wx.showToast({ title: '先填完整', icon: 'none' });
      return;
    }
    const ok = blankIndexes.every((idx) => {
      const filled = Number(slots[idx].filled);
      return filled === slots[idx].value;
    });
    if (ok) {
      playAnswerSfx(true);
      this.setData({ feedback: 'ok', streak: this.data.streak + 1 });
      setTimeout(() => this.nextQuestion(), 800);
    } else {
      playAnswerSfx(false);
      this.setData({ feedback: 'bad', streak: 0 });
    }
  },

  onGoVisual() {
    wx.navigateTo({ url: ROUTES.visualMath });
  },

  onPathNext() {
    if (this.data.pathKind !== 'math') return;
    markPathStep('math', 'practice');
    wx.redirectTo({ url: buildStepUrl('math', 'test') });
  },
});
