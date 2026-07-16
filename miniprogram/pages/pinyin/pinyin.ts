import {
  markPathStep,
  setPathInitial,
  type PathKind,
  type PathStepId,
} from '../../utils/skill-path';

const { getInitials } = require('../../data/tools/pinyin');

Page({
  data: {
    initials: [] as Array<{ id: string; tip: string; tone: number; toneClass: string }>,
    fromPath: false,
    pathKind: '' as '' | PathKind,
    pathStep: '' as '' | PathStepId,
  },

  onLoad(query: Record<string, string | undefined>) {
    const fromPath = query.fromPath === 'pinyin' || query.fromPath === 'math';
    const pathKind = (fromPath ? query.fromPath : '') as '' | PathKind;
    const pathStep = (query.pathStep || '') as '' | PathStepId;
    const tones = ['c0', 'c1', 'c2', 'c3', 'c4'];
    const initials = getInitials().map(
      (item: { id: string; tip: string; tone: number }) => ({
        ...item,
        toneClass: tones[item.tone % tones.length],
      }),
    );
    this.setData({
      initials,
      fromPath,
      pathKind,
      pathStep,
    });
    if (fromPath) {
      wx.setNavigationBarTitle({ title: '学一学 · 选声母' });
    }
  },

  onTapInitial(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const { fromPath, pathKind, pathStep } = this.data;
    if (fromPath && pathKind === 'pinyin') {
      setPathInitial('pinyin', id);
      markPathStep('pinyin', 'learn');
      wx.redirectTo({
        url: `/pages/pinyin-learn/pinyin-learn?initial=${id}&mode=card&fromPath=pinyin&pathStep=${pathStep || 'learn'}&justLearned=1`,
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/pinyin-learn/pinyin-learn?initial=${id}`,
    });
  },
});
