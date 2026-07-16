import {
  buildLevelSnapshot,
  peekLevelSnapshot,
  type LevelRow,
} from '../../utils/level-map';
import { preloadPlayPage } from '../../utils/page-prefetch';
import { toggleFavorite } from '../../utils/favorites';

const ENTER_BUBBLE = '打开地图，一关一关闯';

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
    goalText: ENTER_BUBBLE,
    toneClass: 'tone-cn',
  },

  _seenShow: false,
  _pendingFocus: null as LevelRow | null,

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || 'poetry-g1-g2';
    const grade = Number(query.grade || 1);

    const cached = peekLevelSnapshot(packId, grade);
    const snapshot = cached || buildLevelSnapshot(packId, grade);
    const focus = this.pickFocus(snapshot.levels);
    this._pendingFocus = focus;

    wx.setNavigationBarTitle({
      title: `${grade} 年级 · ${snapshot.subject || '关卡'}`,
    });

    this.setData({
      packId: snapshot.packId,
      grade: snapshot.grade,
      packTitle: snapshot.packTitle,
      subject: snapshot.subject,
      unitLabel: snapshot.unitLabel,
      toneClass: snapshot.toneClass,
      levels: snapshot.levels,
      starSum: snapshot.starSum,
      clearedCount: snapshot.clearedCount,
      totalCount: snapshot.totalCount,
      goalText: ENTER_BUBBLE,
      ...this.focusPatch(focus, true),
    });

    wx.nextTick(() => preloadPlayPage());
  },

  onReady() {
    const focus = this._pendingFocus;
    if (!focus) return;
    this.setData(this.focusPatch(focus, false));
  },

  onShow() {
    if (!this._seenShow) {
      this._seenShow = true;
      return;
    }
    wx.nextTick(() => this.refreshLevels());
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

  focusPatch(focus: LevelRow | null, keepEnterBubble = false) {
    if (!focus) {
      return {
        focusId: '',
        focusUnlocked: false,
        focusCleared: false,
        goalText: keepEnterBubble ? ENTER_BUBBLE : '暂无关卡',
      };
    }
    return {
      focusId: focus.id,
      focusUnlocked: focus.unlocked,
      focusCleared: focus.cleared,
      goalText: keepEnterBubble
        ? ENTER_BUBBLE
        : focus.cleared
          ? `再闯「${focus.title}」，冲更高星`
          : `本关目标：掌握「${focus.title}」`,
    };
  },

  applyFocus(focus: LevelRow | null) {
    this.setData(this.focusPatch(focus, false));
  },

  refreshLevels() {
    const { packId, grade, focusId } = this.data;
    if (!packId) return;
    const snapshot = buildLevelSnapshot(packId, grade);
    const focus = this.pickFocus(snapshot.levels, focusId);
    this.setData({
      subject: snapshot.subject,
      unitLabel: snapshot.unitLabel,
      toneClass: snapshot.toneClass,
      levels: snapshot.levels,
      clearedCount: snapshot.clearedCount,
      totalCount: snapshot.totalCount,
      starSum: snapshot.starSum,
      ...this.focusPatch(focus, false),
    });
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
    buildLevelSnapshot(packId, grade);
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
