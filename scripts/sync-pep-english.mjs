/**
 * 将 PEP 一至三年级英语单元词表同步到 english-g1-g2/items.js
 * 用法：npm run sync:pep-english
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { PEP_ENGLISH_G1 } from './data/pep-english-g1.mjs';
import { PEP_ENGLISH_G2 } from './data/pep-english-g2.mjs';
import { PEP_ENGLISH_G3 } from './data/pep-english-g3.mjs';
import { flattenPepBook } from './data/pep-english-utils.mjs';

const PEP_GRADES = [1, 2, 3];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const itemsPath = path.join(root, 'miniprogram', 'data', 'packs', 'english-g1-g2', 'items.js');

function slug(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function pepToItem({ grade, word, meaning, category, semester, unit }) {
  const w = word.toLowerCase();
  const semTag = semester === 2 ? '下册' : '上册';
  return {
    id: `en_g${grade}_pep_s${semester}_u${unit}_${slug(word)}`,
    type: 'english',
    grade,
    semester,
    title: word,
    word,
    meaning,
    phonetic: `/${w}/`,
    category,
    tags: ['PEP', semTag, `Unit ${unit}`],
    unit,
  };
}

function formatItem(item) {
  const tagsStr = item.tags.map((t) => `'${t}'`).join(', ');
  const semesterLine = item.semester === 2 ? '\n    semester: 2,' : '';
  return `  {
    id: '${item.id}',
    type: 'english',
    grade: ${item.grade},${semesterLine}
    title: '${item.title.replace(/'/g, "\\'")}',
    word: '${item.word.replace(/'/g, "\\'")}',
    meaning: '${item.meaning.replace(/'/g, "\\'")}',
    phonetic: '${item.phonetic}',
    category: '${item.category}',
    tags: [${tagsStr}],
    unit: ${item.unit},
  }`;
}

function summarizeGrade(items, grade) {
  const g = items.filter((i) => i.grade === grade);
  const upper = g.filter((i) => (i.semester || 1) === 1);
  const lower = g.filter((i) => (i.semester || 1) === 2);
  return `${grade} 年级 ${g.length} 词（上 ${upper.length}，下 ${lower.length}）`;
}

async function main() {
  const pepItems = [
    ...flattenPepBook(PEP_ENGLISH_G1, 1),
    ...flattenPepBook(PEP_ENGLISH_G2, 2),
    ...flattenPepBook(PEP_ENGLISH_G3, 3),
  ].map(pepToItem);

  const pepIds = new Set(pepItems.map((i) => i.id));
  const pepWordsByGrade = new Map(PEP_GRADES.map((g) => [g, new Set()]));
  for (const item of pepItems) {
    pepWordsByGrade.get(item.grade)?.add(item.word.toLowerCase());
  }

  const mod = await import(pathToFileURL(itemsPath).href);
  const existing = mod.default;

  const kept = existing.filter((i) => {
    if (!PEP_GRADES.includes(i.grade)) return true;
    if (pepIds.has(i.id)) return false;
    if (i.tags?.includes('PEP')) return false;
    const words = pepWordsByGrade.get(i.grade);
    if (words?.has(String(i.word || '').toLowerCase())) return false;
    return !String(i.id || '').startsWith(`en_g${i.grade}_`);
  });

  const byId = new Map();
  for (const i of kept) {
    if (i?.id) byId.set(i.id, i);
  }
  for (const item of pepItems) {
    byId.set(item.id, item);
  }

  const merged = [...byId.values()].sort(
    (a, b) =>
      a.grade - b.grade ||
      (a.semester || 1) - (b.semester || 1) ||
      (a.unit || 99) - (b.unit || 99) ||
      a.id.localeCompare(b.id),
  );

  const body = merged.map(formatItem).join(',\n');
  const out = `/** @type {import('../../../utils/types').EnglishItem[]} */
module.exports = [
${body},
];
`;
  fs.writeFileSync(itemsPath, out, 'utf8');

  console.log('PEP 英语同步完成：');
  for (const g of PEP_GRADES) {
    console.log(`  ${summarizeGrade(merged, g)}`);
  }
  console.log(`题库合计 ${merged.length} 条（幼小衔接 g0 保留原词表）`);
}

await main();
