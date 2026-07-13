import type { KnowledgeItem, MathItem, PackManifest, PoetryItem } from './types';

/** 已注册知识包；新增包时在此追加 id，并 require 对应 JS 模块 */
const PACK_IDS = ['poetry-g1-g2', 'math-g1-g2'] as const;

type PackId = (typeof PACK_IDS)[number];

const poetryManifest = require('../data/packs/poetry-g1-g2/manifest.js') as PackManifest;
const poetryItems = require('../data/packs/poetry-g1-g2/items.js') as PoetryItem[];
const mathManifest = require('../data/packs/math-g1-g2/manifest.js') as PackManifest;
const mathItems = require('../data/packs/math-g1-g2/items.js') as MathItem[];

const manifests: Record<PackId, PackManifest> = {
  'poetry-g1-g2': poetryManifest,
  'math-g1-g2': mathManifest,
};

const itemsByPack: Record<PackId, KnowledgeItem[]> = {
  'poetry-g1-g2': poetryItems,
  'math-g1-g2': mathItems,
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
  return getPackItems(packId).filter((item) => item.grade === grade);
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

export function isMathPack(packId: string): boolean {
  return getPackManifest(packId)?.subject === '数学';
}
