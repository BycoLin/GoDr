import { getPackItems, getPackManifest, listPacks, isPoetry } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PoetryItem } from '../../utils/types';

interface ProgressRow {
  id: string;
  title: string;
  grade: number;
  stars: number;
  cleared: boolean;
}

interface PackOption {
  id: string;
  title: string;
}

Page({
  data: {
    packId: '',
    packs: [] as PackOption[],
    packTitle: '',
    clearedCount: 0,
    totalCount: 0,
    rows: [] as ProgressRow[],
  },

  onShow() {
    const packs = listPacks().map((p) => ({ id: p.id, title: p.title }));
    const packId =
      this.data.packId && packs.some((p) => p.id === this.data.packId)
        ? this.data.packId
        : packs[0]?.id || '';
    this.setData({ packs, packId });
    this.refresh();
  },

  refresh() {
    const { packId } = this.data;
    if (!packId) return;
    const manifest = getPackManifest(packId);
    const items = getPackItems(packId).filter(isPoetry) as PoetryItem[];
    const progress = loadPackProgress(packId);

    const rows: ProgressRow[] = items.map((item) => {
      const p = progress.items[item.id];
      return {
        id: item.id,
        title: item.title,
        grade: item.grade,
        stars: p?.stars || 0,
        cleared: Boolean(p?.cleared),
      };
    });

    this.setData({
      packTitle: manifest?.title || '',
      clearedCount: rows.filter((r) => r.cleared).length,
      totalCount: rows.length,
      rows,
    });
  },

  onSelectPack(e: WechatMiniprogram.TouchEvent) {
    const packId = e.currentTarget.dataset.id as string;
    this.setData({ packId });
    this.refresh();
  },

  onClearAll() {
    wx.showModal({
      title: '清空进度？',
      content: '将清除本知识包的本地闯关记录',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync(`progress:${this.data.packId}`);
        this.refresh();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
