import { getPackManifest, getPackSubjectKind, listPacks } from './registry';
import type { PackSubjectKind } from './registry';

const PACK_KEY = 'activePackId';
const GRADE_KEY = 'activeGrade';
const LEGACY_GRADE_KEY = 'activeGradeByPack';

export interface SubjectOption {
  packId: string;
  subject: string;
  kind: PackSubjectKind;
  worldName: string;
}

function worldNameFor(kind: PackSubjectKind): string {
  if (kind === 'math') return '数学岛';
  if (kind === 'english') return '英语岛';
  return '诗词岛';
}

export function listSubjects(): SubjectOption[] {
  return listPacks().map((pack) => {
    const kind = getPackSubjectKind(pack.id);
    return {
      packId: pack.id,
      subject: pack.subject,
      kind,
      worldName: worldNameFor(kind),
    };
  });
}

export function getActivePackId(): string {
  const packs = listPacks();
  if (!packs.length) return 'poetry-g1-g2';
  try {
    const saved = wx.getStorageSync(PACK_KEY) as string;
    if (saved && packs.some((p) => p.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  const poetry = packs.find((p) => getPackSubjectKind(p.id) === 'poetry');
  return poetry?.id || packs[0].id;
}

export function setActivePackId(packId: string): void {
  const packs = listPacks();
  const id = packs.some((p) => p.id === packId) ? packId : getActivePackId();
  try {
    wx.setStorageSync(PACK_KEY, id);
  } catch {
    /* ignore */
  }
}

function readGlobalGrade(): number | null {
  try {
    const raw = wx.getStorageSync(GRADE_KEY);
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* ignore */
  }
  // 兼容旧版「按学科存年级」
  try {
    const map = wx.getStorageSync(LEGACY_GRADE_KEY);
    if (map && typeof map === 'object') {
      const id = getActivePackId();
      const n = Number((map as Record<string, number>)[id]);
      if (Number.isFinite(n) && n > 0) return n;
      const first = Object.values(map as Record<string, number>)
        .map(Number)
        .find((g) => Number.isFinite(g) && g > 0);
      if (first) return first;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function gradesOfPack(packId: string): number[] {
  const manifest = getPackManifest(packId);
  return (manifest?.grades?.length ? manifest.grades : [1]).map(Number);
}

/** 全局年级：切换学科时保持不变 */
export function getActiveGrade(packId?: string): number {
  const id = packId || getActivePackId();
  const grades = gradesOfPack(id);
  const saved = readGlobalGrade();
  if (saved != null && grades.includes(saved)) return saved;
  if (saved != null) {
    const le = [...grades].filter((g) => g <= saved).sort((a, b) => b - a)[0];
    return le ?? grades[0];
  }
  return grades[0];
}

/** 写入全局年级（packId 仅用于校验该学科是否支持该年级） */
export function setActiveGrade(packId: string, grade: number): void {
  const grades = gradesOfPack(packId);
  const next = grades.includes(Number(grade)) ? Number(grade) : grades[0];
  try {
    wx.setStorageSync(GRADE_KEY, next);
  } catch {
    /* ignore */
  }
}

export function getActiveSubject(): SubjectOption {
  const packId = getActivePackId();
  const found = listSubjects().find((s) => s.packId === packId);
  if (found) return found;
  const kind = getPackSubjectKind(packId);
  const manifest = getPackManifest(packId);
  return {
    packId,
    subject: manifest?.subject || '语文',
    kind,
    worldName: worldNameFor(kind),
  };
}
