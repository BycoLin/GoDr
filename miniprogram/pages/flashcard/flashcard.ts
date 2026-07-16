import {
  getItemsByGrade,
  getPackSubjectKind,
  isEnglish,
  isPoetry,
} from '../../utils/registry';
import type { EnglishItem, PoetryItem } from '../../utils/types';
import {
  buildStepUrl,
  markPathStep,
  type PathStepId,
} from '../../utils/skill-path';
import { parseGradeQuery } from '../../utils/grade-label';
import { getActiveGrade } from '../../utils/active-subject';

interface FlashCard {
  id: string;
  front: string;
  sub: string;
  back: string;
  backLines: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Page({
  data: {
    packId: '',
    grade: 1,
    kind: 'poetry' as 'poetry' | 'english' | 'math',
    cards: [] as FlashCard[],
    index: 0,
    total: 0,
    current: null as FlashCard | null,
    flipped: false,
    known: 0,
    fuzzy: 0,
    done: false,
    fromPath: false,
    pathStep: '' as '' | PathStepId,
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'english-g1-g2';
    const grade = parseGradeQuery(query.grade, getActiveGrade(packId));
    const fromPath = query.fromPath === 'english';
    const pathStep = (query.pathStep || '') as '' | PathStepId;
    const kind = getPackSubjectKind(packId);
    const pool = getItemsByGrade(packId, grade);

    let cards: FlashCard[] = [];
    if (kind === 'english') {
      cards = (pool.filter(isEnglish) as EnglishItem[]).map((item) => ({
        id: item.id,
        front: item.word,
        sub: item.phonetic || item.category || '单词认读',
        back: item.meaning,
        backLines: [],
      }));
    } else if (kind === 'poetry') {
      cards = (pool.filter(isPoetry) as PoetryItem[]).map((item) => ({
        id: item.id,
        front: item.title,
        sub: `${item.author}${item.dynasty ? ` · ${item.dynasty}` : ''}`,
        back: '',
        backLines: item.lines,
      }));
    } else {
      wx.showToast({ title: '数学请用口算冲刺', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    cards = shuffle(cards).slice(0, Math.min(12, cards.length));
    if (!cards.length) {
      wx.showToast({ title: '暂无卡片', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    wx.setNavigationBarTitle({
      title: fromPath ? '学一学 · 单词闪卡' : kind === 'english' ? '单词闪卡' : '诗词背诵卡',
    });

    this.setData({
      packId,
      grade,
      kind,
      fromPath,
      pathStep,
      cards,
      total: cards.length,
      index: 0,
      current: cards[0],
      flipped: false,
      known: 0,
      fuzzy: 0,
      done: false,
    });
  },

  onFlip() {
    if (this.data.done) return;
    this.setData({ flipped: !this.data.flipped });
  },

  mark(known: boolean) {
    if (this.data.done) return;
    const nextKnown = this.data.known + (known ? 1 : 0);
    const nextFuzzy = this.data.fuzzy + (known ? 0 : 1);
    const nextIndex = this.data.index + 1;
    if (nextIndex >= this.data.total) {
      this.setData({
        known: nextKnown,
        fuzzy: nextFuzzy,
        done: true,
        flipped: false,
      });
      return;
    }
    this.setData({
      known: nextKnown,
      fuzzy: nextFuzzy,
      index: nextIndex,
      current: this.data.cards[nextIndex],
      flipped: false,
    });
  },

  onKnow() {
    this.mark(true);
  },

  onFuzzy() {
    this.mark(false);
  },

  onQuiz() {
    const { packId, grade, kind, fromPath } = this.data;
    if (fromPath) {
      this.onPathNext();
      return;
    }
    const mode = kind === 'english' ? 'enWordMean' : 'fillNext';
    wx.redirectTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=${mode}&arcade=1`,
    });
  },

  onPathNext() {
    const { packId, grade, fromPath } = this.data;
    if (!fromPath) return;
    markPathStep('english', 'learn');
    wx.redirectTo({
      url: buildStepUrl('english', 'practice', { packId, grade }),
    });
  },

  onRestart() {
    const cards = shuffle(this.data.cards);
    this.setData({
      cards,
      index: 0,
      current: cards[0],
      flipped: false,
      known: 0,
      fuzzy: 0,
      done: false,
    });
  },

  onBack() {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/games/games' }) });
  },
});
