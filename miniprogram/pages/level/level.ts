import {
  getItemsByGrade,
  getPackManifest,
  isEnglish,
  isMath,
  isPoetry,
} from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import type { KnowledgeItem } from '../../utils/types';

interface LevelRow {
  id: string;
  title: string;
  meta: string;
  stars: number;
  cleared: boolean;
  unlocked: boolean;
}

Page({
  data: {
    packId: '',
    grade: 1,
    packTitle: '',
    subject: '',
    unitLabel: '关',
    levels: [] as LevelRow[],
    clearedCount: 0,
    totalCount: 0,
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);
    const manifest = getPackManifest(packId);
    const subject = manifest?.subject || '';
    const unitLabel = subject === '语文' ? '首' : '关';
    this.setData({
      packId,
      grade,
      packTitle: manifest?.title || '',
      subject,
      unitLabel,
    });
    wx.setNavigationBarTitle({
      title: `${grade} 年级 · ${subject || '关卡'}`,
    });
  },

  onShow() {
    this.refreshLevels();
  },

  refreshLevels() {
    const { packId, grade, subject } = this.data;
    const items = getItemsByGrade(packId, grade).filter((item) => {
      if (subject === '数学') return isMath(item);
      if (subject === '英语') return isEnglish(item);
      return isPoetry(item);
    }) as KnowledgeItem[];
    const progress = loadPackProgress(packId);

    const levels: LevelRow[] = items.map((item, index) => {
      const itemProg = progress.items[item.id];
      const prevCleared =
        index === 0 || Boolean(progress.items[items[index - 1].id]?.cleared);
      let meta = '';
      if (isMath(item)) {
        meta = item.subtitle || item.tags?.join(' · ') || '数学练习';
      } else if (isEnglish(item)) {
        meta = item.meaning + (item.phonetic ? ` · ${item.phonetic}` : '');
      } else if (isPoetry(item)) {
        meta = `${item.dynasty || ''} · ${item.author}`.replace(/^\s·\s/, '');
      }
      return {
        id: item.id,
        title: item.title,
        meta,
        stars: itemProg?.stars || 0,
        cleared: Boolean(itemProg?.cleared),
        unlocked: prevCleared,
      };
    });

    this.setData({
      levels,
      clearedCount: levels.filter((l) => l.cleared).length,
      totalCount: levels.length,
    });
  },

  onTapLevel(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const unlocked = Number(e.currentTarget.dataset.unlocked) === 1;
    if (!unlocked) {
      wx.showToast({ title: '请先完成上一关', icon: 'none' });
      return;
    }
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&itemId=${id}`,
    });
  },
});
