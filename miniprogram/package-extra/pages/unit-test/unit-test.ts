import { getPackManifest } from '../../../utils/registry';
import { getActiveGrade, getActivePackId } from '../../../utils/active-subject';
import { formatGradeLabel, parseGradeQuery } from '../../../utils/grade-label';
import {
  getUnitRecord,
  listUnits,
  UNIT_QUESTION_COUNT,
} from '../../../utils/unit-test';

interface UnitView {
  unit: number;
  title: string;
  itemCount: number;
  questionCount: number;
  bestText: string;
  attempts: number;
}

Page({
  data: {
    packId: '',
    grade: 1,
    gradeLabel: '',
    packSubject: '',
    units: [] as UnitView[],
    hint: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const packId = query.packId || getActivePackId();
    const grade = parseGradeQuery(query.grade, getActiveGrade(packId));
    this.setData({ packId, grade });
    wx.setNavigationBarTitle({ title: '单元测验' });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const { packId, grade } = this.data;
    const manifest = getPackManifest(packId);
    const packSubject = manifest?.subject || '语文';
    const units = listUnits(packId, grade).map((u) => {
      const rec = getUnitRecord(packId, grade, u.unit);
      return {
        ...u,
        bestText: rec ? `最佳 ${rec.bestCorrect}/${rec.bestTotal}` : '未测验',
        attempts: rec?.attempts ?? 0,
      };
    });

    this.setData({
      packSubject,
      gradeLabel: formatGradeLabel(grade),
      units,
      hint:
        units.length > 0
          ? `每单元固定 ${UNIT_QUESTION_COUNT} 题，只考该单元知识点`
          : '当前年级暂无单元划分，先去闯关练习吧',
    });
  },

  onTapUnit(e: WechatMiniprogram.TouchEvent) {
    const unit = Number(e.currentTarget.dataset.unit || 1);
    const { packId, grade } = this.data;
    wx.navigateTo({
      url: `/pages/play/play?packId=${packId}&grade=${grade}&mode=unit&unit=${unit}&arcade=1`,
    });
  },
});
