import {
  getItemsByGrade,
  getPackManifest,
  isEnglish,
  isMath,
  isPoetry,
} from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import { isFavorite, toggleFavorite } from '../../utils/favorites';
import type { KnowledgeItem } from '../../utils/types';

interface LevelRow {
  id: string;
  title: string;
  meta: string;
  stars: number;
  cleared: boolean;
  unlocked: boolean;
  favorited: boolean;
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
    starSum: 0,
    focusId: '',
    focusUnlocked: false,
    focusCleared: false,
    goalText: '选一关，开始冒险吧',
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

  pickFocus(levels: LevelRow[], preferId?: string): LevelRow | null {
    if (!levels.length) return null;
    if (preferId) {
      const found = levels.find((l) => l.id === preferId && l.unlocked);
      if (found) return found;
    }
    const next = levels.find((l) => l.unlocked && !l.cleared);
    if (next) return next;
    const lastCleared = [...levels].reverse().find((l) => l.cleared);
    return lastCleared || levels[0];
  },

  applyFocus(focus: LevelRow | null) {
    if (!focus) {
      this.setData({
        focusId: '',
        focusUnlocked: false,
        focusCleared: false,
        goalText: '暂无关卡',
      });
      return;
    }
    const goal = focus.cleared
      ? `再闯「${focus.title}」，冲更高星`
      : `本关目标：掌握「${focus.title}」`;
    this.setData({
      focusId: focus.id,
      focusUnlocked: focus.unlocked,
      focusCleared: focus.cleared,
      goalText: goal,
    });
  },

  refreshLevels() {
    const { packId, grade, subject, focusId } = this.data;
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
        favorited: isFavorite(packId, item.id),
      };
    });

    const starSum = levels.reduce((s, l) => s + (l.stars || 0), 0);
    const focus = this.pickFocus(levels, focusId);

    this.setData({
      levels,
      clearedCount: levels.filter((l) => l.cleared).length,
      totalCount: levels.length,
      starSum,
    });
    this.applyFocus(focus);
  },

  onTapLevel(e: WechatMiniprogram.TouchEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const unlocked = Number(e.currentTarget.dataset.unlocked) === 1;
    if (!unlocked) {
      wx.showToast({ title: '先闯过上一关哦', icon: 'none' });
      return;
    }
    const focus = this.data.levels.find((l) => l.id === id) || null;
    this.applyFocus(focus);
  },

  onToggleFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const { packId, grade, subject, levels } = this.data;
    const row = levels.find((l) => l.id === id);
    if (!row) return;

    const on = toggleFavorite({
      packId,
      itemId: id,
      grade,
      title: row.title,
      subject: subject || '',
    });

    const next = levels.map((l) =>
      l.id === id ? { ...l, favorited: on } : l,
    );
    this.setData({ levels: next });
    wx.showToast({
      title: on ? '已收藏，可在「我的」再练' : '已取消收藏',
      icon: 'none',
    });
  },

  onLongPressLevel(e: WechatMiniprogram.TouchEvent) {
    this.onToggleFavorite(e);
  },

  onStartFocus() {
    const { packId, grade, focusId, focusUnlocked } = this.data;
    if (!focusId || !focusUnlocked) {
      wx.showToast({ title: '先选一关吧', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&itemId=${focusId}`,
    });
  },
});
