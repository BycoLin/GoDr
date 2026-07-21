/**
 * 从 doc/梅语文 资料抽取文本，供校对或同步题库。
 *
 * 用法：
 *   npm run extract:poetry      # 抽取 1-3 年级 DOC 文本
 *   npm run sync:meiyuwen       # 按梅语文闯关表同步课内必背到 items.js
 *
 * 资料目录：doc/梅语文：统编版语文1-6年级…/
 * 正式题库：miniprogram/data/packs/poetry-g1-g2/items.js
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docDir = path.join(
  root,
  'doc',
  '梅语文：统编版语文1-6年级语文上册必背课文梳理+闯关表(1)',
);
const docPath = path.join(docDir, '梅语文：统编版1-3年级语文上册课文背诵梳理+闯关表.doc');
const outPath = path.join(root, 'scripts', 'extract-poetry.raw.txt');

if (!fs.existsSync(docPath)) {
  console.error('找不到 DOC：', docPath);
  process.exit(1);
}

const result = spawnSync('antiword', [docPath], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
if (result.error || result.status !== 0) {
  console.error('antiword 执行失败，请确认已安装 antiword。');
  console.error(result.stderr || result.error);
  process.exit(1);
}

fs.writeFileSync(outPath, result.stdout, 'utf8');
console.log('已写出粗抽文本：', outPath);
console.log('课内必背结构化数据：scripts/data/meiyuwen-g1-g2.mjs');
console.log('同步到题库：npm run sync:meiyuwen');
