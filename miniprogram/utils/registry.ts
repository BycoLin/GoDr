import type { KnowledgeItem, PackManifest, PoetryItem } from './types';

/** 已注册知识包；新增包时在此追加 id，并 require 对应 JSON */
const PACK_IDS = ['poetry-g1-g2'] as const;

type PackId = (typeof PACK_IDS)[number];

// 小程序运行时用 require 加载 JSON，兼容性更好
const poetryManifest = require('../data/packs/poetry-g1-g2/manifest.json') as PackManifest;
const poetryItems = require('../data/packs/poetry-g1-g2/items.json') as PoetryItem[];

const manifests: Record<PackId, PackManifest> = {
  'poetry-g1-g2': poetryManifest,
};

const itemsByPack: Record<PackId, KnowledgeItem[]> = {
  'poetry-g1-g2': poetryItems,
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
