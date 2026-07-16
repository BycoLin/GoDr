import {
  buildStepUrl,
  goPathHub,
  markPathStep,
  type PathKind,
  type PathStepId,
} from '../../utils/skill-path';
import { speakChinese, stopSpeak } from '../../utils/tts';

const { getSyllables } = require('../../data/tools/pinyin');
const { playAnswerSfx } = require('../../utils/sfx');

interface SyllableItem {
  pinyin: string;
  final: string;
  char: string;
  initial: string;
  formula: string;
}

Page({
  data: {
    initial: 'b',
    mode: 'card' as 'card' | 'fill' | 'list',
    items: [] as SyllableItem[],
    index: 0,
    total: 0,
    current: null as SyllableItem | null,
    fillOptions: [] as string[],
    fillFeedback: '' as '' | 'ok' | 'bad',
    fromPath: false,
    pathKind: '' as '' | PathKind,
    pathStep: '' as '' | PathStepId,
    quizGoal: 0,
    quizCorrect: 0,
    pathDockText: '',
    justLearned: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const initial = query.initial || 'b';
    const fromPath = query.fromPath === 'pinyin' || query.fromPath === 'math';
    const pathKind = (fromPath ? query.fromPath : '') as '' | PathKind;
    const pathStep = (query.pathStep || '') as '' | PathStepId;
    const quizGoal = Number(query.quizGoal || 0);
    const mode = (query.mode as 'card' | 'fill' | 'list') || (quizGoal > 0 ? 'fill' : 'card');
    const justLearned = query.justLearned === '1';
    const items = getSyllables(initial) as SyllableItem[];
    if (!items.length) {
      wx.showToast({ title: '暂无该声母内容', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    wx.setNavigationBarTitle({
      title: quizGoal > 0 ? `测一测 · ${initial}` : `拼音 ${initial}`,
    });
    let pathDockText = '';
    if (fromPath) {
      if (pathStep === 'learn' || justLearned) pathDockText = '学完了，去练一练';
      else if (pathStep === 'practice') pathDockText = '练完了，去测一测';
      else if (pathStep === 'test') pathDockText = quizGoal > 0 ? `连对 ${quizGoal} 题过关` : '测完回路径';
    }
    this.setData({
      initial,
      items,
      total: items.length,
      index: 0,
      current: items[0],
      mode,
      fillOptions: this.buildFillOptions(items, items[0]),
      fromPath,
      pathKind,
      pathStep,
      quizGoal,
      quizCorrect: 0,
      pathDockText,
      justLearned,
    });
  },

  buildFillOptions(items: SyllableItem[], current: SyllableItem): string[] {
    const pool = items
      .map((i) => i.pinyin)
      .filter((p) => p !== current.pinyin);
    const distractors = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    return [current.pinyin, ...distractors].sort(() => Math.random() - 0.5);
  },

  onMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as 'card' | 'fill' | 'list';
    this.setData({ mode, fillFeedback: '' });
  },

  onPrev() {
    const index = Math.max(0, this.data.index - 1);
    this.goIndex(index);
  },

  onNext() {
    const index = Math.min(this.data.total - 1, this.data.index + 1);
    this.goIndex(index);
  },

  onPickList(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    this.goIndex(index);
    this.setData({ mode: 'card' });
  },

  goIndex(index: number) {
    const current = this.data.items[index];
    this.setData({
      index,
      current,
      fillFeedback: '',
      fillOptions: this.buildFillOptions(this.data.items, current),
    });
  },

  onSpeak() {
    const { current } = this.data;
    if (!current) return;
    // 读汉字读音；提示里带上拼音
    speakChinese(current.char, `${current.pinyin} · ${current.char}`);
  },

  onUnload() {
    stopSpeak();
  },

  onFill(e: WechatMiniprogram.TouchEvent) {
    if (this.data.fillFeedback === 'ok') return;
    const pinyin = e.currentTarget.dataset.pinyin as string;
    const ok = pinyin === this.data.current?.pinyin;
    playAnswerSfx(ok);
    this.setData({ fillFeedback: ok ? 'ok' : 'bad' });
    if (!ok) return;

    const { fromPath, pathStep, quizGoal, quizCorrect, items, total } = this.data;
    const nextCorrect = quizCorrect + 1;
    if (fromPath && pathStep === 'test' && quizGoal > 0) {
      this.setData({ quizCorrect: nextCorrect });
      if (nextCorrect >= quizGoal) {
        markPathStep('pinyin', 'test');
        setTimeout(() => {
          wx.showToast({ title: '测关通过！', icon: 'success' });
          setTimeout(() => goPathHub('pinyin'), 600);
        }, 400);
        return;
      }
      this.setData({
        pathDockText: `再对 ${quizGoal - nextCorrect} 题过关`,
      });
    }

    setTimeout(() => {
      if (this.data.index < total - 1) {
        this.onNext();
      } else {
        // 循环题目，测关继续刷
        if (fromPath && pathStep === 'test' && quizGoal > 0) {
          const shuffled = items.slice().sort(() => Math.random() - 0.5);
          this.setData({ items: shuffled });
          this.goIndex(0);
          return;
        }
        wx.showToast({ title: '本组练完啦', icon: 'success' });
      }
    }, 600);
  },

  onPathNext() {
    const { pathKind, pathStep, justLearned } = this.data;
    if (pathKind !== 'pinyin') return;

    if (pathStep === 'learn' || justLearned) {
      markPathStep('pinyin', 'learn');
      wx.redirectTo({
        url: buildStepUrl('pinyin', 'practice'),
      });
      return;
    }
    if (pathStep === 'practice') {
      markPathStep('pinyin', 'practice');
      wx.redirectTo({
        url: buildStepUrl('pinyin', 'test'),
      });
      return;
    }
    if (pathStep === 'test') {
      markPathStep('pinyin', 'test');
      goPathHub('pinyin');
    }
  },
});
