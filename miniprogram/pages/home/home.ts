import { listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PackManifest } from '../../utils/types';

interface PackCard extends PackManifest {
  gradeLabel: string;
  toneClass: string;
  iconText: string;
  worldName: string;
  funDesc: string;
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
              ? `${pack.grades[0]}～${pack.grades[pack.grades.length - 1]} 年级地图`
              : `${pack.grades[0]} 年级地图`,
          toneClass:
            kind === 'math' ? 'pack-math' : kind === 'english' ? 'pack-en' : 'pack-cn',
          iconText: kind === 'math' ? '算' : kind === 'english' ? 'A' : '诗',
          worldName:
            kind === 'math' ? '数学岛' : kind === 'english' ? '英语岛' : '诗词岛',
          funDesc:
            kind === 'math'
              ? '口算关卡，一关关练熟练！'
              : kind === 'english'
                ? '单词关卡，记住就能通关！'
                : '古诗关卡，背一句闯一关！',
        };
      });

      let continueTip = '';
      let continuePackId = '';
      let continueGrade = 0;

      for (const pack of packs) {
        const progress = loadPackProgress(pack.id);
        if (progress.lastItemId && progress.lastGrade) {
          const world =
            pack.subject === '数学'
              ? '数学岛'
              : pack.subject === '英语'
                ? '英语岛'
                : '诗词岛';
          continueTip = `${world} · ${progress.lastGrade} 年级地图`;
          continuePackId = pack.id;
          continueGrade = progress.lastGrade;
          break;
        }
      }

      this.setData({ packs, continueTip, continuePackId, continueGrade });
    } catch (err) {
      console.error('home onShow failed', err);
      wx.showToast({ title: '加载失败，再试一次', icon: 'none' });
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

  onGoTools() {
    wx.navigateTo({ url: '/pages/tools/tools' });
  },

  onGoMono() {
    wx.navigateTo({ url: '/pages/mono/mono' });
  },
});
