import {
  getItemsByGrade,
  getPackManifest,
  getPackSubjectKind,
  isEnglish,
  isMath,
  isPoetry,
} from '../../utils/registry';
import { buildArcadeQuiz, gradeAnswer } from '../../utils/quiz';
import { buildMathArcadeQuiz } from '../../utils/quiz-math';
import { buildEnglishArcadeQuiz } from '../../utils/quiz-english';
import { playAnswerSfx, playOkSfx } from '../../utils/sfx';
import { randRange } from '../../utils/random';
import {
  getActiveGrade,
  getActivePackId,
  getActiveSubject,
  setActiveGrade,
} from '../../utils/active-subject';
import { formatGradeLabel } from '../../utils/grade-label';
import type {
  EnglishItem,
  MathItem,
  PoetryItem,
  Question,
} from '../../utils/types';

interface BoardCell {
  id: number;
  label: string;
  kind: 'start' | 'quiz' | 'bonus' | 'goal';
  tone: string;
}

const BOARD: BoardCell[] = [
  { id: 0, label: '起点', kind: 'start', tone: 'c-start' },
  { id: 1, label: '答题', kind: 'quiz', tone: 'c-a' },
  { id: 2, label: '答题', kind: 'quiz', tone: 'c-b' },
  { id: 3, label: '惊喜', kind: 'bonus', tone: 'c-bonus' },
  { id: 4, label: '答题', kind: 'quiz', tone: 'c-c' },
  { id: 5, label: '答题', kind: 'quiz', tone: 'c-a' },
  { id: 6, label: '终点', kind: 'goal', tone: 'c-goal' },
  { id: 7, label: '答题', kind: 'quiz', tone: 'c-b' },
  { id: 8, label: '答题', kind: 'quiz', tone: 'c-c' },
  { id: 9, label: '惊喜', kind: 'bonus', tone: 'c-bonus' },
  { id: 10, label: '答题', kind: 'quiz', tone: 'c-a' },
  { id: 11, label: '答题', kind: 'quiz', tone: 'c-b' },
];

/** 棋盘格子在 4x4 环上的位置（外圈顺时针） */
const CELL_POS = [
  { r: 1, c: 1 },
  { r: 1, c: 2 },
  { r: 1, c: 3 },
  { r: 1, c: 4 },
  { r: 2, c: 4 },
  { r: 3, c: 4 },
  { r: 4, c: 4 },
  { r: 4, c: 3 },
  { r: 4, c: 2 },
  { r: 4, c: 1 },
  { r: 3, c: 1 },
  { r: 2, c: 1 },
];

Page({
  data: {
    packId: 'poetry-g1-g2',
    subjectLabel: '语文',
    grade: 1,
    grades: [0, 1, 2] as number[],
    gradeOptions: [] as Array<{ value: number; label: string }>,
    cells: [] as Array<BoardCell & { r: number; c: number; active: boolean }>,
    pos: 0,
    stars: 0,
    laps: 0,
    dice: 1,
    diceRolling: false,
    pieceHop: false,
    celebrate: false,
    sad: false,
    busy: false,
    showQuiz: false,
    current: null as Question | null,
    locked: false,
    feedback: '' as '' | 'ok' | 'bad',
    tip: '点「摇一摇前进」，开始棋盘练习吧！',
  },

  moveTimer: 0 as number,

  onLoad() {
    this.refreshBoard(0);
  },

  onShow() {
    const packId = getActivePackId();
    const active = getActiveSubject();
    const manifest = getPackManifest(packId);
    const grade = getActiveGrade(packId);
    const grades = manifest?.grades || [0, 1];
    this.setData({
      packId,
      subjectLabel: active.subject,
      grade,
      grades,
      gradeOptions: grades.map((g) => ({
        value: Number(g),
        label: formatGradeLabel(Number(g)),
        pre: Number(g) === 0,
      })),
      tip: `当前${active.subject}题库，摇一摇前进吧！`,
    });
    this.refreshBoard(this.data.pos);
  },

  onUnload() {
    if (this.moveTimer) clearTimeout(this.moveTimer);
  },

  refreshBoard(pos: number) {
    const cells = BOARD.map((cell, i) => ({
      ...cell,
      ...CELL_POS[i],
      active: i === pos,
    }));
    this.setData({ cells, pos });
  },

  onSelectGrade(e: WechatMiniprogram.TouchEvent) {
    if (this.data.busy || this.data.showQuiz) return;
    const idx = Number(e.currentTarget.dataset.index);
    const opt = this.data.gradeOptions[idx];
    if (!opt || !Number.isFinite(opt.value)) return;
    setActiveGrade(this.data.packId, opt.value);
    this.setData({ grade: opt.value });
  },

  onRoll() {
    if (this.data.busy || this.data.showQuiz || this.data.diceRolling) return;
    this.setData({
      busy: true,
      diceRolling: true,
      celebrate: false,
      sad: false,
      tip: '步数转起来啦～',
    });

    let ticks = 0;
    const spin = setInterval(() => {
      ticks += 1;
      this.setData({ dice: randRange(1, 6) });
      if (ticks >= 8) {
        clearInterval(spin);
        const steps = randRange(1, 6);
        this.setData({ dice: steps, diceRolling: false, tip: `前进 ${steps} 格！` });
        this.walkSteps(steps);
      }
    }, 80);
  },

  walkSteps(steps: number) {
    let left = steps;
    const stepOnce = () => {
      if (left <= 0) {
        this.landOnCell();
        return;
      }
      const next = (this.data.pos + 1) % BOARD.length;
      this.setData({ pieceHop: true });
      this.refreshBoard(next);
      setTimeout(() => this.setData({ pieceHop: false }), 220);
      left -= 1;
      this.moveTimer = setTimeout(stepOnce, 320) as unknown as number;
    };
    stepOnce();
  },

  landOnCell() {
    const cell = BOARD[this.data.pos];
    if (cell.kind === 'bonus') {
      playOkSfx();
      this.setData({
        stars: this.data.stars + 1,
        celebrate: true,
        busy: false,
        tip: '踩到惊喜格！额外得 1 颗练习星！',
      });
      return;
    }
    if (cell.kind === 'goal' || cell.kind === 'start') {
      const laps = cell.kind === 'goal' ? this.data.laps + 1 : this.data.laps;
      playOkSfx();
      this.setData({
        laps,
        stars: this.data.stars + (cell.kind === 'goal' ? 2 : 0),
        celebrate: true,
        busy: false,
        tip:
          cell.kind === 'goal'
            ? `走到终点啦！完成第 ${laps} 圈练习，真棒！`
            : '又回到起点，继续练习～',
      });
      return;
    }
    this.openQuiz();
  },

  openQuiz() {
    const { packId, grade } = this.data;
    const kind = getPackSubjectKind(packId);
    let pool = getItemsByGrade(packId, grade);
    let question: Question | null = null;

    if (kind === 'math') {
      const mathPool = pool.filter(isMath) as MathItem[];
      question = buildMathArcadeQuiz(mathPool, 'mathCalc', 1)[0] || null;
    } else if (kind === 'english') {
      const enPool = pool.filter(isEnglish) as EnglishItem[];
      question = buildEnglishArcadeQuiz(enPool, 'enWordMean', 1)[0] || null;
    } else {
      const poetryPool = pool.filter(isPoetry) as PoetryItem[];
      question = buildArcadeQuiz(poetryPool, 'fillNext', 1)[0] || null;
    }

    if (!question || !('options' in question)) {
      this.setData({ busy: false, tip: '这格暂时没题，再掷一次吧' });
      return;
    }

    this.setData({
      showQuiz: true,
      current: question,
      locked: false,
      feedback: '',
      tip: '答对才能继续前进哦！',
      busy: true,
    });
  },

  onChoose(e: WechatMiniprogram.TouchEvent) {
    if (this.data.locked || !this.data.current) return;
    const optionId = e.currentTarget.dataset.id as string;
    const correct = gradeAnswer(this.data.current, optionId);
    playAnswerSfx(correct);
    this.setData({
      locked: true,
      feedback: correct ? 'ok' : 'bad',
      celebrate: correct,
      sad: !correct,
    });

    setTimeout(() => {
      if (correct) {
        this.setData({
          showQuiz: false,
          current: null,
          stars: this.data.stars + 1,
          busy: false,
          tip: '答对啦！再摇一摇继续练～',
          locked: false,
          feedback: '',
        });
      } else {
        this.setData({
          tip: '差一点！再选一次～',
          locked: false,
          feedback: '',
          sad: false,
        });
      }
    }, correct ? 700 : 650);
  },

  onCloseQuiz() {
    if (this.data.locked) return;
    this.setData({
      showQuiz: false,
      current: null,
      busy: false,
      tip: '先跳过啦，下次再来答！',
    });
  },
});
