/**
 * 将梅语文课内必背同步到 poetry-g1-g2/items.js
 * 用法：npm run sync:meiyuwen
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { MEIYUWEN_POETRY } from './data/meiyuwen-g1-g2.mjs';
import { MEIYUWEN_G3_POETRY } from './data/meiyuwen-g3.mjs';
import { MEIYUWEN_G3_XIA_POETRY } from './data/meiyuwen-g3-xia.mjs';
import { MEIYUWEN_G4_POETRY } from './data/meiyuwen-g4.mjs';
import { MEIYUWEN_G4_XIA_POETRY } from './data/meiyuwen-g4-xia.mjs';

const ALL_MEIYUWEN = [
  ...MEIYUWEN_POETRY,
  ...MEIYUWEN_G3_POETRY,
  ...MEIYUWEN_G3_XIA_POETRY,
  ...MEIYUWEN_G4_POETRY,
  ...MEIYUWEN_G4_XIA_POETRY,
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const itemsPath = path.join(root, 'miniprogram', 'data', 'packs', 'poetry-g1-g2', 'items.js');

function inferSemester(item) {
  if (item.semester === 2) return 2;
  if (item.tags?.includes('下册')) return 2;
  return 1;
}

/** 扩充脚本生成的占位假诗词（无真实内容） */
function isPlaceholderPoetry(item) {
  if (!item?.id) return true;
  if (/^poetry_g\d+_auto_/.test(item.id)) return true;
  if (/^古诗练习\d+$/.test(item.title || '')) return true;
  const lines = item.lines || [];
  if (
    lines.length >= 4 &&
    lines.every((l) => /^第[一二三四五六七八九十\d]+句$/.test(String(l).trim()))
  ) {
    return true;
  }
  return false;
}

function formatItem(item) {
  const linesStr = item.lines.map((l) => `'${l.replace(/'/g, "\\'")}'`).join(', ');
  const tagsStr = item.tags.map((t) => `'${t}'`).join(', ');
  const semester = inferSemester(item);
  const semesterLine = semester === 2 ? '\n    semester: 2,' : '';
  return `  {
    id: '${item.id}',
    type: 'poetry',
    grade: ${item.grade},${semesterLine}
    title: '${item.title.replace(/'/g, "\\'")}',
    author: '${item.author.replace(/'/g, "\\'")}',
    dynasty: '${item.dynasty || ''}',
    lines: [${linesStr}],
    tags: [${tagsStr}],
    unit: ${item.unit},
  }`;
}

async function main() {
  const mod = await import(pathToFileURL(itemsPath).href);
  const existing = mod.default;
  const byId = new Map();
  for (const i of existing) {
    if (i?.id) byId.set(i.id, i);
  }
  let added = 0;
  let updated = 0;
  let purged = 0;

  for (const item of ALL_MEIYUWEN) {
    const prev = byId.get(item.id);
    const semester = inferSemester(item);
    if (!prev) {
      byId.set(item.id, { ...item, type: 'poetry', semester });
      added += 1;
      continue;
    }
    const changed =
      prev.unit !== item.unit ||
      inferSemester(prev) !== semester ||
      prev.title !== item.title ||
      JSON.stringify(prev.lines) !== JSON.stringify(item.lines) ||
      JSON.stringify(prev.tags) !== JSON.stringify(item.tags);
    if (changed) {
      byId.set(item.id, { ...prev, ...item, type: 'poetry', semester });
      updated += 1;
    }
  }

  for (const [id, item] of [...byId.entries()]) {
    if (isPlaceholderPoetry(item)) {
      byId.delete(id);
      purged += 1;
    }
  }

  const meiyuwenIds = new Set(ALL_MEIYUWEN.map((i) => i.id));
  const meiyuwenFirst = ALL_MEIYUWEN.map((i) => byId.get(i.id)).filter(Boolean);
  const rest = [...byId.values()]
    .filter((i) => !meiyuwenIds.has(i.id))
    .sort(
      (a, b) =>
        a.grade - b.grade ||
        inferSemester(a) - inferSemester(b) ||
        (a.unit || 99) - (b.unit || 99) ||
        a.id.localeCompare(b.id),
    );

  const merged = [...meiyuwenFirst, ...rest];
  const body = merged.map(formatItem).join(',\n');
  const out = `/** @type {import('../../../utils/types').PoetryItem[]} */
module.exports = [
${body},
];
`;
  fs.writeFileSync(itemsPath, out, 'utf8');

  const g3 = merged.filter((i) => i.grade === 3);
  const g3Upper = g3.filter((i) => inferSemester(i) === 1);
  const g3Lower = g3.filter((i) => inferSemester(i) === 2);
  const g4 = merged.filter((i) => i.grade === 4);
  const g4Upper = g4.filter((i) => inferSemester(i) === 1);
  const g4Lower = g4.filter((i) => inferSemester(i) === 2);
  console.log(`梅语文同步完成：新增 ${added}，更新 ${updated}，移除占位 ${purged} 条`);
  console.log(`  三年级上册 ${g3Upper.length} 条，下册 ${g3Lower.length} 条，合计 ${g3.length} 条`);
  console.log(`  四年级上册 ${g4Upper.length} 条，下册 ${g4Lower.length} 条，合计 ${g4.length} 条`);
  console.log(`题库合计 ${merged.length} 条（课内必背优先排序）`);
}

await main();
