import { listPacks, getPackManifest } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PackManifest } from '../../utils/types';

interface PackCard extends PackManifest {
  gradeLabel: string;
  toneClass: string;
  iconText: string;
}

Page({
  data: {
    packs: [] as PackCard[],
    continueTip: '',
    continuePackId: '',
    continueGrade: 0,
  },

  onShow() {
    try {
      const packs: PackCard[] = listPacks().map((pack) => {
        const kind =
          pack.subject === '数学' ? 'math' : pack.subject === '英语' ? 'english' : 'cn';
        return {
          ...pack,
          gradeLabel:
            pack.grades.length > 1
              ? `${pack.grades[0]}～${pack.grades[pack.grades.length - 1]} 年级`
              : `${pack.grades[0]} 年级`,
          toneClass:
            kind === 'math' ? 'pack-math' : kind === 'english' ? 'pack-en' : 'pack-cn',
          iconText: kind === 'math' ? '算' : kind === 'english' ? 'A' : '诗',
        };
      });

      let continueTip = '';
      let continuePackId = '';
      let continueGrade = 0;

      for (const pack of packs) {
        const progress = loadPackProgress(pack.id);
        if (progress.lastItemId && progress.lastGrade) {
          const manifest = getPackManifest(pack.id);
          continueTip = `继续练习：${manifest?.title || pack.title} · ${progress.lastGrade} 年级`;
          continuePackId = pack.id;
          continueGrade = progress.lastGrade;
          break;
        }
      }

      this.setData({ packs, continueTip, continuePackId, continueGrade });
    } catch (err) {
      console.error('home onShow failed', err);
      wx.showToast({ title: '首页加载失败', icon: 'none' });
    }
  },

  onTapPack(e: WechatMiniprogram.TouchEvent) {
    const packId = e.currentTarget.dataset.packId as string;
    wx.navigateTo({ url: `/pages/pack/pack?packId=${packId}` });
  },

  onContinue() {
    const { continuePackId, continueGrade } = this.data;
    if (!continuePackId || !continueGrade) return;
    wx.navigateTo({
      url: `/pages/level/level?packId=${continuePackId}&grade=${continueGrade}`,
    });
  },

  onGoGames() {
    wx.switchTab({ url: '/pages/games/games' });
  },
});
