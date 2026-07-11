import { getPackItems, getPackManifest, isPoetry } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PoetryItem } from '../../utils/types';

interface ProgressRow {
  id: string;
  title: string;
  grade: number;
  stars: number;
  cleared: boolean;
}

Page({
  data: {
    packId: '',
    packTitle: '',
    clearedCount: 0,
    totalCount: 0,
    rows: [] as ProgressRow[],
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    this.setData({ packId });
  },

  onShow() {
    const { packId } = this.data;
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

  onClearAll() {
    wx.showModal({
      title: '清空进度？',
      content: '将清除本知识包的本地闯关记录',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync(`progress:${this.data.packId}`);
        this.onShow();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
