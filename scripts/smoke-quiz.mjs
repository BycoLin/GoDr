/**
 * 出题引擎冒烟（不依赖微信运行时）
 * node scripts/smoke-quiz.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const items = require('../miniprogram/data/packs/poetry-g1-g2/items.js');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeFillNext(item, pool) {
  const idx = 0;
  const answer = item.lines[idx + 1];
  const distractors = pool
    .filter((p) => p.id !== item.id)
    .flatMap((p) => p.lines)
    .filter((line) => line !== answer);
  const options = shuffle([
    { id: 'ans', text: answer },
    ...shuffle(distractors).slice(0, 3).map((text, i) => ({ id: `d${i}`, text })),
  ]);
  return { answerId: 'ans', options };
}

const g1 = items.filter((i) => i.grade === 1);
const sample = g1[0];
const q = makeFillNext(sample, g1);
const hit = q.options.find((o) => o.id === q.answerId);
if (!hit || hit.text !== sample.lines[1]) {
  console.error('fillNext smoke failed', q);
  process.exit(1);
}
console.log('smoke-quiz ok:', sample.title, '→', hit.text);
console.log('pack size:', items.length);
