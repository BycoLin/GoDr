/**
 * 拉取拼音汉字本地朗读音频（有道），打进小程序包，无需认证/合法域名。
 * 用法：node scripts/fetch-pinyin-tts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'miniprogram', 'assets', 'tts');
const pinyinPath = path.join(root, 'miniprogram', 'data', 'tools', 'pinyin.js');

function charKey(char) {
  return [...char].map((c) => c.codePointAt(0).toString(16)).join('_');
}

async function loadSyllables() {
  // pinyin.js 是 CommonJS，用动态 import 转 file URL 可能不行；直接读 eval 太脏。
  // 改用 createRequire
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const mod = require(pinyinPath);
  const initials = mod.getInitials();
  const chars = new Set();
  initials.forEach((item) => {
    (mod.getSyllables(item.id) || []).forEach((s) => {
      if (s.char) chars.add(s.char);
    });
  });
  return [...chars];
}

async function fetchOne(char) {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&le=zh`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${char}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error(`too small for ${char}: ${buf.length}`);
  return buf;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const chars = await loadSyllables();
  console.log(`共 ${chars.length} 个汉字，下载到 ${outDir}`);

  let ok = 0;
  let fail = 0;
  for (const char of chars) {
    const file = path.join(outDir, `${charKey(char)}.mp3`);
    if (fs.existsSync(file) && fs.statSync(file).size > 200) {
      console.log(`skip ${char}`);
      ok += 1;
      continue;
    }
    try {
      const buf = await fetchOne(char);
      fs.writeFileSync(file, buf);
      console.log(`ok   ${char}  ${buf.length}B`);
      ok += 1;
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      console.warn(`fail ${char}`, err.message || err);
      fail += 1;
    }
  }
  console.log(`完成：成功 ${ok}，失败 ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
