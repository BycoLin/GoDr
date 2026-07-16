import {
  buildStepUrl,
  getPathMeta,
  isPathComplete,
  loadPathState,
  nextPathStep,
  pathDoneCount,
  resetPath,
  type PathKind,
  type PathStepId,
} from '../../utils/skill-path';
import { getActiveGrade, getActivePackId } from '../../utils/active-subject';

interface StepView {
  id: PathStepId;
  index: number;
  title: string;
  action: string;
  tip: string;
  done: boolean;
  current: boolean;
  statusText: string;
}

Page({
  data: {
    kind: 'pinyin' as PathKind,
    title: '拼音进阶',
    subject: '语文',
    initial: '',
    doneCount: 0,
    totalSteps: 3,
    complete: false,
    currentStep: 'learn' as PathStepId,
    steps: [] as StepView[],
    ctaText: '开始学一学',
  },

  onLoad(query: Record<string, string | undefined>) {
    const kind = (query.kind === 'math' ? 'math' : 'pinyin') as PathKind;
    this.setData({ kind });
    wx.setNavigationBarTitle({
      title: kind === 'math' ? '口算进阶' : '拼音进阶',
    });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const { kind } = this.data;
    const meta = getPathMeta(kind);
    const state = loadPathState(kind);
    const currentStep = nextPathStep(state);
    const complete = isPathComplete(state);
    const steps: StepView[] = meta.steps.map((s) => {
      const done = Boolean(state.done[s.id]);
      const current = !complete && s.id === currentStep;
      return {
        ...s,
        done,
        current,
        statusText: done ? '已完成' : current ? '进行中' : '未开始',
      };
    });

    const currentDef = meta.steps.find((s) => s.id === currentStep);
    let ctaText = '开始';
    if (complete) ctaText = '全部完成，再练一轮';
    else if (currentDef) ctaText = `去${currentDef.title}`;

    this.setData({
      title: meta.title,
      subject: meta.subject,
      initial: state.initial,
      doneCount: pathDoneCount(state),
      complete,
      currentStep,
      steps,
      ctaText,
    });
  },

  onTapStep(e: WechatMiniprogram.TouchEvent) {
    const step = e.currentTarget.dataset.step as PathStepId;
    this.startStep(step);
  },

  onTapCta() {
    const { complete, kind, currentStep } = this.data;
    if (complete) {
      resetPath(kind);
      this.refresh();
      this.startStep('learn');
      return;
    }
    this.startStep(currentStep);
  },

  startStep(step: PathStepId) {
    const { kind, initial } = this.data;
    const packId = getActivePackId();
    const grade = getActiveGrade(packId);
    const url = buildStepUrl(kind, step, {
      initial,
      packId,
      grade,
    });
    wx.navigateTo({ url });
  },

  onReset() {
    wx.showModal({
      title: '重新开始这条路径？',
      content: '只会清空本路径进度，不影响闯关星星',
      success: (res) => {
        if (!res.confirm) return;
        resetPath(this.data.kind);
        this.refresh();
        wx.showToast({ title: '已重置', icon: 'none' });
      },
    });
  },
});
