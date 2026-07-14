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
  },

  onLoad(query: Record<string, string | undefined>) {
    const initial = query.initial || 'b';
    const items = getSyllables(initial) as SyllableItem[];
    if (!items.length) {
      wx.showToast({ title: '暂无该声母内容', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    wx.setNavigationBarTitle({ title: `拼音 ${initial}` });
    this.setData({
      initial,
      items,
      total: items.length,
      index: 0,
      current: items[0],
      fillOptions: this.buildFillOptions(items, items[0]),
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
    wx.showToast({
      title: `${current.pinyin} · ${current.char}`,
      icon: 'none',
      duration: 1500,
    });
  },

  onFill(e: WechatMiniprogram.TouchEvent) {
    if (this.data.fillFeedback === 'ok') return;
    const pinyin = e.currentTarget.dataset.pinyin as string;
    const ok = pinyin === this.data.current?.pinyin;
    playAnswerSfx(ok);
    this.setData({ fillFeedback: ok ? 'ok' : 'bad' });
    if (ok) {
      setTimeout(() => {
        if (this.data.index < this.data.total - 1) {
          this.onNext();
        } else {
          wx.showToast({ title: '本组练完啦', icon: 'success' });
        }
      }, 600);
    }
  },
});
