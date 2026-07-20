import { getItemById, listPacks } from '../../../utils/registry';
import {
  countActiveWrongs,
  listActiveWrongs,
  quizTypeLabel,
} from '../../../utils/wrongbook';

interface WrongRow {
  key: string;
  itemId: string;
  quizType: string;
  quizTypeLabel: string;
  title: string;
  wrongCount: number;
}

Page({
  data: {
    packId: 'poetry-g1-g2',
    rows: [] as WrongRow[],
    wrongCount: 0,
    grade: 1,
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || listPacks()[0]?.id || 'poetry-g1-g2';
    this.setData({ packId });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const { packId } = this.data;
    const entries = listActiveWrongs(packId);
    const rows: WrongRow[] = entries.map((e) => {
      const item = getItemById(packId, e.itemId);
      return {
        key: `${e.itemId}::${e.quizType}`,
        itemId: e.itemId,
        quizType: e.quizType,
        quizTypeLabel: quizTypeLabel(e.quizType),
        title: item && 'title' in item ? item.title : e.itemId,
        wrongCount: e.wrongCount,
      };
    });
    const grade =
      entries.length && getItemById(packId, entries[0].itemId)
        ? (getItemById(packId, entries[0].itemId) as { grade?: number }).grade || 1
        : 1;
    this.setData({
      rows,
      wrongCount: countActiveWrongs(packId),
      grade,
    });
  },

  onChallengeBoss() {
    const { packId, wrongCount, grade } = this.data;
    if (wrongCount <= 0) {
      wx.showToast({ title: '暂无错题', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=boss&boss=1&arcade=1`,
    });
  },
});
