import { getPackManifest, getPackSubjectKind, listPacks } from './registry';
import type { PackSubjectKind } from './registry';

const PACK_KEY = 'activePackId';
const GRADE_KEY = 'activeGradeByPack';

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

function readGradeMap(): Record<string, number> {
  try {
    const raw = wx.getStorageSync(GRADE_KEY);
    if (raw && typeof raw === 'object') return raw as Record<string, number>;
  } catch {
    /* ignore */
  }
  return {};
}

function writeGradeMap(map: Record<string, number>): void {
  try {
    wx.setStorageSync(GRADE_KEY, map);
  } catch {
    /* ignore */
  }
}

export function getActiveGrade(packId?: string): number {
  const id = packId || getActivePackId();
  const manifest = getPackManifest(id);
  const grades = manifest?.grades?.length ? manifest.grades : [1];
  const map = readGradeMap();
  const saved = map[id];
  if (typeof saved === 'number' && grades.includes(saved)) return saved;
  return grades[0];
}

export function setActiveGrade(packId: string, grade: number): void {
  const manifest = getPackManifest(packId);
  const grades = manifest?.grades?.length ? manifest.grades : [1];
  const next = grades.includes(grade) ? grade : grades[0];
  const map = readGradeMap();
  map[packId] = next;
  writeGradeMap(map);
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
