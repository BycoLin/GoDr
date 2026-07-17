import {
  markPathStep,
  setPathInitial,
  type PathKind,
  type PathStepId,
} from '../../utils/skill-path';

const { getInitials, getFinals } = require('../../data/tools/pinyin');

type PinyinTab = 'initial' | 'final';

Page({
  data: {
    tab: 'initial' as PinyinTab,
    initials: [] as Array<{ id: string; tip: string; tone: number; toneClass: string }>,
    finalGroups: [] as Array<{
      group: string;
      items: Array<{ id: string; label: string; tip: string; toneClass: string }>;
    }>,
    fromPath: false,
    pathKind: '' as '' | PathKind,
    pathStep: '' as '' | PathStepId,
  },

  onLoad(query: Record<string, string | undefined>) {
    const tab: PinyinTab = query.tab === 'final' ? 'final' : 'initial';
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

    const groupMap = new Map<string, Array<{ id: string; label: string; tip: string; toneClass: string }>>();
    getFinals().forEach((item: { id: string; label: string; tip: string; tone: number; group: string }) => {
      const row = {
        id: item.id,
        label: item.label,
        tip: item.tip,
        toneClass: tones[item.tone % tones.length],
      };
      const list = groupMap.get(item.group) || [];
      list.push(row);
      groupMap.set(item.group, list);
    });
    const finalGroups = Array.from(groupMap.entries()).map(([group, items]) => ({
      group,
      items,
    }));

    this.setData({
      tab,
      initials,
      finalGroups,
      fromPath,
      pathKind,
      pathStep,
    });
    this.updateTitle(tab, fromPath);
  },

  updateTitle(tab: PinyinTab, fromPath: boolean) {
    if (fromPath) {
      wx.setNavigationBarTitle({
        title: tab === 'final' ? '学一学 · 选韵母' : '学一学 · 选声母',
      });
      return;
    }
    wx.setNavigationBarTitle({
      title: tab === 'final' ? '韵母练习' : '声母练习',
    });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as PinyinTab;
    if (!tab || tab === this.data.tab) return;
    this.setData({ tab });
    this.updateTitle(tab, this.data.fromPath);
  },

  onTapInitial(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const { fromPath, pathKind, pathStep } = this.data;
    if (fromPath && pathKind === 'pinyin') {
      setPathInitial('pinyin', id);
      markPathStep('pinyin', 'learn');
      wx.redirectTo({
        url: `/pages/pinyin-learn/pinyin-learn?kind=initial&initial=${id}&mode=card&fromPath=pinyin&pathStep=${pathStep || 'learn'}&justLearned=1`,
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/pinyin-learn/pinyin-learn?kind=initial&initial=${id}`,
    });
  },

  onTapFinal(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({
      url: `/pages/pinyin-learn/pinyin-learn?kind=final&final=${encodeURIComponent(id)}&mode=card`,
    });
  },

  onTapDrill(e: WechatMiniprogram.TouchEvent) {
    const kind = e.currentTarget.dataset.kind as 'initial' | 'final';
    wx.navigateTo({
      url: `/pages/pinyin-drill/pinyin-drill?kind=${kind}`,
    });
  },
});
