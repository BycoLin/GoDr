/**
 * 统计各科目/年级/玩法可用题池规模
 * 运行：npm run audit:quiz-pools
 */
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const poetryItems = require(join(root, 'miniprogram/data/packs/poetry-g1-g2/items.js'));
const mathItems = require(join(root, 'miniprogram/data/packs/math-g1-g2/items.js'));
const englishItems = require(join(root, 'miniprogram/data/packs/english-g1-g2/items.js'));

const similarSrc = readFileSync(join(root, 'miniprogram/utils/similar-chars.ts'), 'utf8');
const drillCount = (similarSrc.match(/id: 'sim_/g) || []).length;

const POETRY_TYPES = ['fillNext', 'titleAuthor', 'matchPair', 'orderLines', 'fillBlank', 'similarChar'];
const MATH_TYPES = [
  'mathVisual', 'mathSequence', 'mathCalc', 'mathCompare', 'mathMissing',
  'mathMakeTen', 'mathBreakTen', 'mathFlatTen', 'mathBorrowTen',
  'mathBigCompare', 'mathPlaceValue', 'mathBigRead', 'mathBigWrite', 'mathRound',
  'mathLineType', 'mathGeoRelation', 'mathAngleClassify', 'mathAngleMeasure',
];
const EN_TYPES = ['enWordMean', 'enMeanWord', 'enSpell', 'matchPair'];

function byGrade(items, typeField = 'type') {
  const map = {};
  for (const it of items) {
    const g = it.grade ?? 0;
    if (!map[g]) map[g] = [];
    map[g].push(it);
  }
  return map;
}

function countLines(items) {
  return items.reduce((s, it) => s + (it.lines?.length || 0), 0);
}

function poetryStats(pool) {
  const myth = pool.filter((p) => /精卫|女娲|盘古|普罗米修斯|夸父|愚公|羿射|后羿|燧人/.test(p.title));
  const classical = pool.filter((p) => p.author === '文言文');
  const narrative = pool.filter((p) => p.author === '课文' || p.author === '文言文');
  const accumulation = pool.filter((p) => p.author === '积累');
  const patriot = pool.filter((p) => /出塞|凉州词|示儿|夏日绝句|从军行|塞下曲|边塞/.test(p.title));
  return { myth: myth.length, classical: classical.length, narrative: narrative.length, accumulation: accumulation.length, patriot: patriot.length, lines: countLines(pool) };
}

function mathSkillStats(pool) {
  const skills = {};
  for (const it of pool) {
    skills[it.skill] = (skills[it.skill] || 0) + 1;
  }
  return skills;
}

console.log('=== GoDr 题池规模排查 ===\n');

console.log('【包总量】');
console.log(`  语文 poetry-g1-g2: ${poetryItems.length} 篇`);
console.log(`  数学 math-g1-g2:   ${mathItems.length} 关`);
console.log(`  英语 english-g1-g2: ${englishItems.length} 词\n`);

console.log('【语文 · 按年级】');
const poetryByG = byGrade(poetryItems.filter((p) => p.type === 'poetry'));
for (const g of Object.keys(poetryByG).sort((a, b) => a - b)) {
  const pool = poetryByG[g];
  const st = poetryStats(pool);
  console.log(`  ${g} 年级: ${pool.length} 篇 | 总行 ${st.lines} | 神话 ${st.myth} 文言 ${st.classical} 课文/叙事 ${st.narrative} 积累 ${st.accumulation} 爱国 ${st.patriot}`);
}
console.log(`  形近字专练句: ${drillCount} 条（四年级）\n`);

console.log('【语文 · 玩法题型】');
console.log(`  闯关/综合可用: ${POETRY_TYPES.join(', ')}`);
console.log('  专项卡片（按年级）:');
for (let g = 0; g <= 4; g += 1) {
  const modes = {
    0: ['mixed', '拼音表×4'],
    1: ['fillNext', 'matchPair', 'fillBlank', 'titleAuthor', 'mixed'],
    2: ['fillNext', 'matchPair', 'orderLines', 'fillBlank', 'titleAuthor', 'mixed'],
    3: ['fillBlank×2', 'fillNext', 'matchPair', 'orderLines(story)', 'titleAuthor', 'mixed'],
    4: ['fillBlank', 'similarChar', 'matchPair', 'titleAuthor(myth)', 'orderLines(story)', 'matchPair(accumulation)', 'fillNext(patriot)', 'titleAuthor(classical)', 'mixed'],
  };
  console.log(`    g${g}: ${(modes[g] || []).join(' · ')}`);
}

console.log('\n【数学 · 按年级】');
const mathByG = byGrade(mathItems);
for (const g of Object.keys(mathByG).sort((a, b) => a - b)) {
  const pool = mathByG[g];
  const skills = mathSkillStats(pool);
  const skillStr = Object.entries(skills).map(([k, v]) => `${k}:${v}`).join(' ');
  console.log(`  ${g} 年级: ${pool.length} 关 | ${skillStr}`);
}
console.log(`  程序题型: ${MATH_TYPES.length} 种 (${MATH_TYPES.join(', ')})`);
console.log('  主题闯关 g3: mathSequence · mathCompare · mathMissing');
console.log('  主题闯关 g4: 大数5种 + 线与角4种\n');

console.log('【英语 · 按年级】');
const enByG = byGrade(englishItems);
for (const g of Object.keys(enByG).sort((a, b) => a - b)) {
  console.log(`  ${g} 年级: ${enByG[g].length} 词`);
}
console.log(`  玩法: ${EN_TYPES.join(', ')}\n`);

console.log('【各模式固定题量】');
console.log('  闯关 level:     8 题（含 2–3 题加练穿插）');
console.log('  专项/加练 arcade: 8 题滚动');
console.log('  每日 daily:     10 题 / 90s');
console.log('  单元 unit:      10 题');
console.log('  模拟 exam:      10 题');
console.log('  冲刺 sprint:    20 题 / 60s');
console.log('  对练 duel:      8 题 / 90s');
console.log('  错题 boss:      = 错题数\n');

console.log('【理论题量（程序生成类为「同局去重、可无限」）】');
for (const g of [1, 2, 3, 4]) {
  const p = poetryByG[g] || [];
  const m = mathByG[g] || [];
  const e = enByG[g] || [];
  const pl = countLines(p);
  console.log(`  g${g} 闯关一局: 语文 ~${Math.min(8, pl)} 题槽(本篇+穿插) | 数学程序生成 | 英语 ~${Math.min(8, e.length * 4)} 组合`);
}
