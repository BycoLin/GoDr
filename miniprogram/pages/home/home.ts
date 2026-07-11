import { listPacks, getPackManifest } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PackManifest } from '../../utils/types';

interface PackCard extends PackManifest {
  gradeLabel: string;
}

Page({
  data: {
    packs: [] as PackCard[],
    continueTip: '',
    continuePackId: '',
    continueGrade: 0,
  },

  onShow() {
    const packs: PackCard[] = listPacks().map((pack) => ({
      ...pack,
      gradeLabel:
        pack.grades.length > 1
          ? `${pack.grades[0]}～${pack.grades[pack.grades.length - 1]} 年级`
          : `${pack.grades[0]} 年级`,
    }));
    let continueTip = '';
    let continuePackId = '';
    let continueGrade = 0;

    for (const pack of packs) {
      const progress = loadPackProgress(pack.id);
      if (progress.lastItemId && progress.lastGrade) {
        const manifest = getPackManifest(pack.id);
        continueTip = `继续：${manifest?.title || pack.title} · ${progress.lastGrade} 年级`;
        continuePackId = pack.id;
        continueGrade = progress.lastGrade;
        break;
      }
    }

    this.setData({ packs, continueTip, continuePackId, continueGrade });
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

  onProgress() {
    const pack = this.data.packs[0];
    if (!pack) return;
    wx.navigateTo({ url: `/pages/progress/progress?packId=${pack.id}` });
  },
});
