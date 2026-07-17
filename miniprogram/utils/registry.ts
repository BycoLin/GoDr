import type {
  EnglishItem,
  KnowledgeItem,
  MathItem,
  PackManifest,
  PoetryItem,
} from './types';

import poetryManifest from '../data/packs/poetry-g1-g2/manifest.js';
import poetryItems from '../data/packs/poetry-g1-g2/items.js';
import mathManifest from '../data/packs/math-g1-g2/manifest.js';
import mathItems from '../data/packs/math-g1-g2/items.js';
import englishManifest from '../data/packs/english-g1-g2/manifest.js';
import englishItems from '../data/packs/english-g1-g2/items.js';

/** 已注册知识包 */
const PACK_IDS = ['poetry-g1-g2', 'math-g1-g2', 'english-g1-g2'] as const;

type PackId = (typeof PACK_IDS)[number];

export type PackSubjectKind = 'poetry' | 'math' | 'english';

const manifests: Record<PackId, PackManifest> = {
  'poetry-g1-g2': poetryManifest as PackManifest,
  'math-g1-g2': mathManifest as PackManifest,
  'english-g1-g2': englishManifest as PackManifest,
};

const itemsByPack: Record<PackId, KnowledgeItem[]> = {
  'poetry-g1-g2': poetryItems as PoetryItem[],
  'math-g1-g2': mathItems as MathItem[],
  'english-g1-g2': englishItems as EnglishItem[],
};

export function listPacks(): PackManifest[] {
  return PACK_IDS.map((id) => manifests[id]).filter(Boolean);
}

export function getPackManifest(packId: string): PackManifest | undefined {
  return manifests[packId as PackId];
}

export function getPackItems(packId: string): KnowledgeItem[] {
  return itemsByPack[packId as PackId] || [];
}

export function getItemsByGrade(packId: string, grade: number): KnowledgeItem[] {
  const g = Number(grade);
  return getPackItems(packId).filter((item) => Number(item.grade) === g);
}

export function getItemById(packId: string, itemId: string): KnowledgeItem | undefined {
  return getPackItems(packId).find((item) => item.id === itemId);
}

export function isPoetry(item: KnowledgeItem): item is PoetryItem {
  return item.type === 'poetry';
}

export function isMath(item: KnowledgeItem): item is MathItem {
  return item.type === 'math';
}

export function isEnglish(item: KnowledgeItem): item is EnglishItem {
  return item.type === 'english';
}

export function getPackSubjectKind(packId: string): PackSubjectKind {
  const subject = getPackManifest(packId)?.subject;
  if (subject === '数学') return 'math';
  if (subject === '英语') return 'english';
  return 'poetry';
}

export function isMathPack(packId: string): boolean {
  return getPackSubjectKind(packId) === 'math';
}

export function isEnglishPack(packId: string): boolean {
  return getPackSubjectKind(packId) === 'english';
}
