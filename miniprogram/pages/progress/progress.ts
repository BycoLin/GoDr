import { getPackItems, getPackManifest } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';
import {
  getActiveGrade,
  getActivePackId,
  getActiveSubject,
} from '../../utils/active-subject';

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
    subject: '',
    worldName: '',
    grade: 1,
    toneClass: 'tone-cn',
    unitLabel: '首',
    clearedCount: 0,
    todoCount: 0,
    totalCount: 0,
    percent: 0,
    starSum: 0,
    cheerText: '',
    filter: 'all' as 'all' | 'done' | 'todo',
    items: [] as ProgressRow[],
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const packId = getActivePackId();
    const filter = this.data.filter;
    if (!packId) return;
    const manifest = getPackManifest(packId);
    const progress = loadPackProgress(packId);
    const active = getActiveSubject();
    const grade = getActiveGrade(packId);

    const rows: ProgressRow[] = getPackItems(packId)
      .filter((item) => Number(item.grade) === grade)
      .map((item) => {
        const p = progress.items[item.id];
        return {
          id: item.id,
          title: item.title,
          grade: Number(item.grade),
          stars: p?.stars || 0,
          cleared: Boolean(p?.cleared),
        };
      });

    const clearedCount = rows.filter((r) => r.cleared).length;
    const totalCount = rows.length;
    const todoCount = Math.max(0, totalCount - clearedCount);
    const percent = totalCount ? Math.round((clearedCount / totalCount) * 100) : 0;
    const starSum = rows.reduce((sum, r) => sum + r.stars, 0);
    const unitLabel = manifest?.subject === '语文' ? '首' : '关';
    const toneClass =
      active.kind === 'math' ? 'tone-math' : active.kind === 'english' ? 'tone-en' : 'tone-cn';

    let cheerText = '还没开始？去地图闯第一关吧！';
    if (percent >= 100) cheerText = '全部通关啦，星星收齐！';
    else if (percent >= 60) cheerText = '进度不错，再闯几关更熟！';
    else if (percent > 0) cheerText = '已经在路上了，继续加油！';

    const items =
      filter === 'done'
        ? rows.filter((i) => i.cleared)
        : filter === 'todo'
          ? rows.filter((i) => !i.cleared)
          : rows;

    this.setData({
      packId,
      packTitle: manifest?.title || active.worldName,
      subject: active.subject,
      worldName: active.worldName,
      grade,
      toneClass,
      unitLabel,
      clearedCount,
      todoCount,
      totalCount,
      percent,
      starSum,
      cheerText,
      items,
    });
  },

  onSelectFilter(e: WechatMiniprogram.TouchEvent) {
    const filter = e.currentTarget.dataset.filter as 'all' | 'done' | 'todo';
    this.setData({ filter });
    this.refresh();
  },

  onTapGradeMap() {
    const { packId, grade } = this.data;
    if (!packId || !grade) return;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },

  onContinue() {
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${grade}`,
    });
  },

  onClearAll() {
    wx.showModal({
      title: '清空进度？',
      content: '将清除本学科的本地闯关记录与星星',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync(`progress:${this.data.packId}`);
        this.refresh();
        wx.showToast({ title: '已清空', icon: 'success' });
      },
    });
  },
});
