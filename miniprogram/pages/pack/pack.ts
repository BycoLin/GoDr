import { getPackManifest } from '../../utils/registry';

Page({
  data: {
    packId: '',
    title: '',
    grades: [] as number[],
    description: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const manifest = getPackManifest(packId);
    if (!manifest) {
      wx.showToast({ title: '知识包不存在', icon: 'none' });
      return;
    }
    this.setData({
      packId,
      title: manifest.title,
      grades: manifest.grades,
      description: manifest.description || '',
    });
    wx.setNavigationBarTitle({ title: manifest.title });
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    const { packId } = this.data;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },
});
