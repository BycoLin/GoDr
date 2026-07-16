import {
  getItemsByGrade,
  getPackManifest,
  getPackSubjectKind,
  isEnglish,
  isMath,
  isPoetry,
} from './registry';
import { loadPackProgress } from './progress';
import { isFavorite } from './favorites';
import type { KnowledgeItem } from './types';

export interface LevelRow {
  id: string;
  title: string;
  meta: string;
  stars: number;
  cleared: boolean;
  unlocked: boolean;
  favorited: boolean;
}

export interface LevelSnapshot {
  packId: string;
  grade: number;
  packTitle: string;
  subject: string;
  unitLabel: string;
  toneClass: string;
  levels: LevelRow[];
  starSum: number;
  clearedCount: number;
  totalCount: number;
}

function mapKey(packId: string, grade: number): string {
  return `${packId}:${grade}`;
}

const snapshotCache = new Map<string, LevelSnapshot>();

export function buildLevelSnapshot(packId: string, grade: number): LevelSnapshot {
  const manifest = getPackManifest(packId);
  const subject = manifest?.subject || '';
  const unitLabel = subject === '语文' ? '首' : '关';
  const kind = getPackSubjectKind(packId);
  const toneClass =
    kind === 'math' ? 'tone-math' : kind === 'english' ? 'tone-en' : 'tone-cn';

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

  const snapshot: LevelSnapshot = {
    packId,
    grade,
    packTitle: manifest?.title || '',
    subject,
    unitLabel,
    toneClass,
    levels,
    starSum: levels.reduce((s, l) => s + (l.stars || 0), 0),
    clearedCount: levels.filter((l) => l.cleared).length,
    totalCount: levels.length,
  };

  snapshotCache.set(mapKey(packId, grade), snapshot);
  return snapshot;
}

export function peekLevelSnapshot(packId: string, grade: number): LevelSnapshot | null {
  return snapshotCache.get(mapKey(packId, grade)) || null;
}

export function prefetchLevelSnapshot(packId: string, grade: number): void {
  try {
    buildLevelSnapshot(packId, grade);
  } catch (err) {
    console.warn('prefetch level snapshot failed', err);
  }
}
