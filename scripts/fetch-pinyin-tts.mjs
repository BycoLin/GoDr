/**
 * 可选：拉取拼音汉字朗读 mp3 到本地（默认已改用在线 TTS，一般无需运行）。
 * 用法：node scripts/fetch-pinyin-tts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'miniprogram', 'package-pinyin', 'assets', 'tts');
const pinyinPath = path.join(root, 'miniprogram', 'package-pinyin', 'data', 'tools', 'pinyin.js');

function charKey(char) {
  return [...char].map((c) => c.codePointAt(0).toString(16)).join('_');
}

function loadChars() {
  const require = createRequire(import.meta.url);
  const mod = require(pinyinPath);
  const chars = new Set();

  mod.getInitials().forEach((item) => {
    if (item.tip) chars.add(item.tip);
    (mod.getSyllables(item.id) || []).forEach((s) => {
      if (s.char) chars.add(s.char);
    });
  });

  mod.getFinals().forEach((item) => {
    if (item.tip) chars.add(item.tip);
    (mod.getFinalSyllables(item.id) || []).forEach((s) => {
      if (s.char) chars.add(s.char);
    });
  });

  (mod.getAllSyllables() || []).forEach((s) => {
    if (s.char) chars.add(s.char);
  });

  return [...chars];
}

async function fetchOne(char) {
  const urls = [
    `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&le=zh`,
    `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&type=1`,
  ];
  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200) throw new Error(`too small: ${buf.length}`);
      return buf;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error(`fetch failed for ${char}`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const chars = loadChars();
  console.log(`共 ${chars.length} 个汉字，下载到 ${outDir}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const char of chars) {
    const file = path.join(outDir, `${charKey(char)}.mp3`);
    if (fs.existsSync(file) && fs.statSync(file).size > 200) {
      skip += 1;
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
  console.log(`完成：新增 ${ok}，已有 ${skip}，失败 ${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
