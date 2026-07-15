import type {
  EnglishItem,
  KnowledgeItem,
  MathItem,
  PackManifest,
  PoetryItem,
} from './types';

/** 已注册知识包；新增包时在此追加 id，并 require 对应 JS 模块 */
const PACK_IDS = ['poetry-g1-g2', 'math-g1-g2', 'english-g1-g2'] as const;

type PackId = (typeof PACK_IDS)[number];

export type PackSubjectKind = 'poetry' | 'math' | 'english';

const poetryManifest = require('../data/packs/poetry-g1-g2/manifest.js') as PackManifest;
const poetryItems = require('../data/packs/poetry-g1-g2/items.js') as PoetryItem[];
const mathManifest = require('../data/packs/math-g1-g2/manifest.js') as PackManifest;
const mathItems = require('../data/packs/math-g1-g2/items.js') as MathItem[];
const englishManifest = require('../data/packs/english-g1-g2/manifest.js') as PackManifest;
const englishItems = require('../data/packs/english-g1-g2/items.js') as EnglishItem[];

const manifests: Record<PackId, PackManifest> = {
  'poetry-g1-g2': poetryManifest,
  'math-g1-g2': mathManifest,
  'english-g1-g2': englishManifest,
};

const itemsByPack: Record<PackId, KnowledgeItem[]> = {
  'poetry-g1-g2': poetryItems,
  'math-g1-g2': mathItems,
  'english-g1-g2': englishItems,
};

export function listPacks(): PackManifest[] {
  return PACK_IDS.map((id) => manifests[id]);
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
