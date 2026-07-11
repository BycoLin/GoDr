/**
 * 从 doc 中的 1-3 年级闯关表 DOC 粗抽文本，便于人工校对 JSON。
 * 实际题库以 miniprogram/data/packs/poetry-g1-g2/items.json 为准。
 *
 * 用法：npm run extract:poetry
 * 依赖：系统需安装 antiword（Git Bash / MSYS2 常见自带）
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docPath = path.join(
  root,
  'doc',
  '梅语文：统编版语文1-6年级语文上册必背课文梳理+闯关表(1)',
  '梅语文：统编版1-3年级语文上册课文背诵梳理+闯关表.doc',
);
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
console.log('请对照教材校对后更新 miniprogram/data/packs/poetry-g1-g2/items.json');
