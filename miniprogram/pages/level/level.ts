import { getItemsByGrade, getPackManifest, isPoetry } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { PoetryItem } from '../../utils/types';

interface LevelRow {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  stars: number;
  cleared: boolean;
  unlocked: boolean;
}

Page({
  data: {
    packId: '',
    grade: 1,
    packTitle: '',
    levels: [] as LevelRow[],
    clearedCount: 0,
    totalCount: 0,
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    this.setData({ packId, grade });
    const manifest = getPackManifest(packId);
    wx.setNavigationBarTitle({
      title: `${grade} 年级 · 关卡`,
    });
    this.setData({ packTitle: manifest?.title || '' });
  },

  onShow() {
    this.refreshLevels();
  },

  refreshLevels() {
    const { packId, grade } = this.data;
    const items = getItemsByGrade(packId, grade).filter(isPoetry) as PoetryItem[];
    const progress = loadPackProgress(packId);

    const levels: LevelRow[] = items.map((item, index) => {
      const itemProg = progress.items[item.id];
      const prevCleared =
        index === 0 || Boolean(progress.items[items[index - 1].id]?.cleared);
      return {
        id: item.id,
        title: item.title,
        author: item.author,
        dynasty: item.dynasty || '',
        stars: itemProg?.stars || 0,
        cleared: Boolean(itemProg?.cleared),
        unlocked: prevCleared,
      };
    });

    const clearedCount = levels.filter((l) => l.cleared).length;
    this.setData({
      levels,
      clearedCount,
      totalCount: levels.length,
    });
  },

  onTapLevel(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const unlocked = Number(e.currentTarget.dataset.unlocked) === 1;
    if (!unlocked) {
      wx.showToast({ title: '先通关上一首哦', icon: 'none' });
      return;
    }
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&itemId=${id}`,
    });
  },
});
