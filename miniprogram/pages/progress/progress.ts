import { getPackItems, getPackManifest, listPacks } from '../../utils/registry';
import { loadPackProgress } from '../../utils/progress';

interface ProgressRow {
  id: string;
  title: string;
  grade: number;
  stars: number;
  cleared: boolean;
}

interface GradeGroup {
  grade: number;
  title: string;
  cleared: number;
  total: number;
  percent: number;
  starSum: number;
  open: boolean;
  items: ProgressRow[];
}

interface PackOption {
  id: string;
  title: string;
  subject: string;
}

Page({
  data: {
    packId: '',
    packs: [] as PackOption[],
    packTitle: '',
    subject: '',
    unitLabel: '首',
    clearedCount: 0,
    totalCount: 0,
    percent: 0,
    starSum: 0,
    cheerText: '',
    filter: 'all' as 'all' | 'done' | 'todo',
    groups: [] as GradeGroup[],
  },

  onShow() {
    const packs = listPacks().map((p) => ({
      id: p.id,
      title: p.title,
      subject: p.subject,
    }));
    const packId =
      this.data.packId && packs.some((p) => p.id === this.data.packId)
        ? this.data.packId
        : packs[0]?.id || '';
    this.setData({ packs, packId });
    this.refresh();
  },

  refresh() {
    const { packId, filter } = this.data;
    if (!packId) return;
    const manifest = getPackManifest(packId);
    const items = getPackItems(packId);
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

    const clearedCount = rows.filter((r) => r.cleared).length;
    const totalCount = rows.length;
    const percent = totalCount ? Math.round((clearedCount / totalCount) * 100) : 0;
    const starSum = rows.reduce((sum, r) => sum + r.stars, 0);
    const unitLabel = manifest?.subject === '语文' ? '首' : '关';

    let cheerText = '还没开始？选一关开闯吧！';
    if (percent >= 100) cheerText = '全部通关！你是超级小博士！';
    else if (percent >= 60) cheerText = '超棒！再冲一把就更多啦！';
    else if (percent > 0) cheerText = '已经上路啦，继续加油哦！';

    const gradeMap = new Map<number, ProgressRow[]>();
    rows.forEach((row) => {
      const list = gradeMap.get(row.grade) || [];
      list.push(row);
      gradeMap.set(row.grade, list);
    });

    const prevOpen = new Map(
      (this.data.groups || []).map((g) => [g.grade, g.open] as const),
    );

    const groups: GradeGroup[] = Array.from(gradeMap.keys())
      .sort((a, b) => a - b)
      .map((grade) => {
        const all = gradeMap.get(grade) || [];
        const filtered =
          filter === 'done'
            ? all.filter((i) => i.cleared)
            : filter === 'todo'
              ? all.filter((i) => !i.cleared)
              : all;
        const cleared = all.filter((i) => i.cleared).length;
        return {
          grade,
          title: `${grade} 年级`,
          cleared,
          total: all.length,
          percent: all.length ? Math.round((cleared / all.length) * 100) : 0,
          starSum: all.reduce((s, i) => s + i.stars, 0),
          open: prevOpen.get(grade) ?? false,
          items: filtered,
        };
      });

    this.setData({
      packTitle: manifest?.title || '',
      subject: manifest?.subject || '',
      unitLabel,
      clearedCount,
      totalCount,
      percent,
      starSum,
      cheerText,
      groups,
    });
  },

  onSelectPack(e: WechatMiniprogram.TouchEvent) {
    const packId = e.currentTarget.dataset.id as string;
    this.setData({ packId, filter: 'all' });
    this.refresh();
  },

  onSelectFilter(e: WechatMiniprogram.TouchEvent) {
    const filter = e.currentTarget.dataset.filter as 'all' | 'done' | 'todo';
    this.setData({ filter });
    this.refresh();
  },

  onToggleGrade(e: WechatMiniprogram.TouchEvent) {
    const grade = Number(e.currentTarget.dataset.grade);
    const groups = this.data.groups.map((g) =>
      g.grade === grade ? { ...g, open: !g.open } : g,
    );
    this.setData({ groups });
  },

  onContinue() {
    const { packId, groups } = this.data;
    const openGrade = groups.find((g) => g.cleared < g.total) || groups[0];
    if (!openGrade) return;
    wx.navigateTo({
      url: `/pages/level/level?packId=${packId}&grade=${openGrade.grade}`,
    });
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
