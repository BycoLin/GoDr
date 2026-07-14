const { getInitials } = require('../../data/tools/pinyin');

Page({
  data: {
    initials: [] as Array<{ id: string; tip: string; tone: number; toneClass: string }>,
  },

  onLoad() {
    const tones = ['c0', 'c1', 'c2', 'c3', 'c4'];
    const initials = getInitials().map(
      (item: { id: string; tip: string; tone: number }) => ({
        ...item,
        toneClass: tones[item.tone % tones.length],
      }),
    );
    this.setData({ initials });
  },

  onTapInitial(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({
      url: `/pages/pinyin-learn/pinyin-learn?initial=${id}`,
    });
  },
});
