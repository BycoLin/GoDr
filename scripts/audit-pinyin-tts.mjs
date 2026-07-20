/**
 * 排查拼音数据里所有口诀字/例字在有道 TTS 是否可用。
 * 用法：node scripts/audit-pinyin-tts.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pinyin = require('../miniprogram/package-pinyin/data/tools/pinyin.js');

const MIN_BYTES = 200;
const DELAY_MS = 80;

/** 已知多音字：有道默认读音 ≠ 教学拼音 → 建议替换 */
const POLYPHONE_FIX = {
  奇: { pinyin: 'qí', suggest: '其' },
  乐: { pinyin: 'lè/yuè', suggest: '了(乐→勒已用lé)' },
  发: { pinyin: 'fā/fà', suggest: '法' },
  不: { pinyin: 'bù/bú', suggest: '布' },
  模: { pinyin: 'mó/mú', suggest: '魔' },
  那: { pinyin: 'nà/nǎ/nèi', suggest: '纳' },
  呢: { pinyin: 'ne/ní', suggest: '泥' },
  乐: { pinyin: 'lè', suggest: '泪' },
  勒: { pinyin: 'lè/lēi', suggest: '类' },
  佛: { pinyin: 'fó/fú', suggest: '福' },
  得: { pinyin: 'de/dé/děi', suggest: '德' },
  特: { pinyin: 'tè', note: 'té 非标准，例字「特」可读' },
  咖: { pinyin: 'kā', note: '少见字，可换卡' },
  瀑: { pinyin: 'pù/bào', suggest: '铺' },
  讷: { pinyin: 'nè', suggest: '那(纳)' },
  雌: { pinyin: 'cí', suggest: '词' },
  疵: { pinyin: 'cī', suggest: '词' },
  诶: { pinyin: 'ei', suggest: '诶→欸/黑' },
  亨: { pinyin: 'hēng', suggest: '哼' },
  晕: { pinyin: 'yūn/yùn', suggest: '云' },
  都: { pinyin: 'dōu/dū', suggest: '斗' },
  中: { pinyin: 'zhōng/zhòng', suggest: '钟' },
  行: { pinyin: 'háng/xíng', suggest: '形' },
  长: { pinyin: 'cháng/zhǎng', suggest: '常' },
};

async function fetchSize(char) {
  const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(char)}&le=zh`;
  try {
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: res.ok && buf.length > MIN_BYTES, size: buf.length, status: res.status };
  } catch (err) {
    return { ok: false, size: 0, status: 0, err: String(err) };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function collectAll() {
  const entries = [];

  pinyin.getInitials().forEach((item) => {
    entries.push({ kind: 'initial-tip', key: item.id, pinyin: item.id, char: item.tip });
  });

  pinyin.getFinals().forEach((item) => {
    entries.push({ kind: 'final-tip', key: item.id, pinyin: item.label, char: item.tip });
  });

  pinyin.getAllSyllables().forEach((item) => {
    entries.push({
      kind: 'syllable',
      key: `${item.initial || '∅'}-${item.pinyin}`,
      pinyin: item.pinyin,
      char: item.char,
      initial: item.initial,
    });
  });

  return entries;
}

async function main() {
  const entries = collectAll();
  const uniqueChars = new Map();
  for (const e of entries) {
    if (!uniqueChars.has(e.char)) uniqueChars.set(e.char, []);
    uniqueChars.get(e.char).push(e);
  }

  console.log(`共 ${entries.length} 条引用，${uniqueChars.size} 个不同汉字\n`);

  const bad = [];
  const poly = [];
  const ok = [];

  for (const [char, refs] of uniqueChars) {
    const result = await fetchSize(char);
    const refKeys = refs.map((r) => `${r.kind}:${r.key}`).join(', ');
    if (!result.ok) {
      bad.push({ char, size: result.size, status: result.status, refs: refKeys });
    } else if (POLYPHONE_FIX[char]) {
      poly.push({ char, size: result.size, ...POLYPHONE_FIX[char], refs: refKeys });
    } else {
      ok.push(char);
    }
    await sleep(DELAY_MS);
  }

  console.log('=== 无音频或失败 ===');
  if (!bad.length) console.log('(无)');
  bad.forEach((b) => console.log(`  ${b.char}  ${b.size}B  [${b.refs}]`));

  console.log('\n=== 有多音字风险（建议人工换字）===');
  if (!poly.length) console.log('(无)');
  poly.forEach((p) =>
    console.log(`  ${p.char}  ${p.pinyin}  →建议 ${p.suggest || p.note || '?'}  [${p.refs}]`),
  );

  console.log(`\n通过: ${ok.length}，失败: ${bad.length}，多音字: ${poly.length}`);
}

main().catch(console.error);
