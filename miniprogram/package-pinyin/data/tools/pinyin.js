/** 声母表 + 常用拼读示例（幼小衔接 / 一年级） */

const INITIALS = [
  { id: 'b', tip: '波', tone: 0 },
  { id: 'p', tip: '坡', tone: 1 },
  { id: 'm', tip: '摸', tone: 2 },
  { id: 'f', tip: '夫', tone: 3 },
  { id: 'd', tip: '大', tone: 4 },
  { id: 't', tip: '特', tone: 0 },
  { id: 'n', tip: '纳', tone: 1 },
  { id: 'l', tip: '拉', tone: 2 },
  { id: 'g', tip: '哥', tone: 3 },
  { id: 'k', tip: '科', tone: 4 },
  { id: 'h', tip: '喝', tone: 0 },
  { id: 'j', tip: '基', tone: 1 },
  { id: 'q', tip: '七', tone: 2 },
  { id: 'x', tip: '希', tone: 3 },
  { id: 'zh', tip: '知', tone: 4 },
  { id: 'ch', tip: '吃', tone: 0 },
  { id: 'sh', tip: '诗', tone: 1 },
  { id: 'r', tip: '日', tone: 2 },
  { id: 'z', tip: '资', tone: 3 },
  { id: 'c', tip: '词', tone: 4 },
  { id: 's', tip: '思', tone: 0 },
  { id: 'y', tip: '衣', tone: 1 },
  { id: 'w', tip: '乌', tone: 2 },
];

/** @type {Record<string, Array<{ pinyin: string; final: string; char: string }>>} */
const SYLLABLES = {
  b: [
    { pinyin: 'bā', final: 'ā', char: '八' },
    { pinyin: 'bó', final: 'ó', char: '伯' },
    { pinyin: 'bǐ', final: 'ǐ', char: '笔' },
    { pinyin: 'bù', final: 'ù', char: '布' },
  ],
  p: [
    { pinyin: 'pā', final: 'ā', char: '啪' },
    { pinyin: 'pó', final: 'ó', char: '婆' },
    { pinyin: 'pǐ', final: 'ǐ', char: '匹' },
    { pinyin: 'pù', final: 'ù', char: '铺' },
  ],
  m: [
    { pinyin: 'mā', final: 'ā', char: '妈' },
    { pinyin: 'mó', final: 'ó', char: '魔' },
    { pinyin: 'mǐ', final: 'ǐ', char: '米' },
    { pinyin: 'mù', final: 'ù', char: '木' },
  ],
  f: [
    { pinyin: 'fā', final: 'ā', char: '发' },
    { pinyin: 'fó', final: 'ó', char: '佛' },
    { pinyin: 'fǔ', final: 'ǔ', char: '斧' },
    { pinyin: 'fù', final: 'ù', char: '父' },
  ],
  d: [
    { pinyin: 'dā', final: 'ā', char: '搭' },
    { pinyin: 'dé', final: 'é', char: '德' },
    { pinyin: 'dǐ', final: 'ǐ', char: '底' },
    { pinyin: 'dù', final: 'ù', char: '肚' },
  ],
  t: [
    { pinyin: 'tā', final: 'ā', char: '他' },
    { pinyin: 'tè', final: 'è', char: '特' },
    { pinyin: 'tǐ', final: 'ǐ', char: '体' },
    { pinyin: 'tù', final: 'ù', char: '兔' },
  ],
  n: [
    { pinyin: 'nà', final: 'à', char: '纳' },
    { pinyin: 'nè', final: 'è', char: '嫩' },
    { pinyin: 'nǐ', final: 'ǐ', char: '你' },
    { pinyin: 'nǔ', final: 'ǔ', char: '努' },
  ],
  l: [
    { pinyin: 'lā', final: 'ā', char: '拉' },
    { pinyin: 'lè', final: 'è', char: '乐' },
    { pinyin: 'lǐ', final: 'ǐ', char: '里' },
    { pinyin: 'lù', final: 'ù', char: '路' },
  ],
  g: [
    { pinyin: 'gā', final: 'ā', char: '嘎' },
    { pinyin: 'gē', final: 'ē', char: '哥' },
    { pinyin: 'gǔ', final: 'ǔ', char: '古' },
    { pinyin: 'gǔn', final: 'ǔn', char: '滚' },
    { pinyin: 'guā', final: 'uā', char: '瓜' },
  ],
  k: [
    { pinyin: 'kā', final: 'ā', char: '卡' },
    { pinyin: 'kē', final: 'ē', char: '科' },
    { pinyin: 'kǔ', final: 'ǔ', char: '苦' },
    { pinyin: 'kù', final: 'ù', char: '裤' },
  ],
  h: [
    { pinyin: 'hā', final: 'ā', char: '哈' },
    { pinyin: 'hē', final: 'ē', char: '喝' },
    { pinyin: 'hú', final: 'ú', char: '湖' },
    { pinyin: 'hù', final: 'ù', char: '户' },
  ],
  j: [
    { pinyin: 'jī', final: 'ī', char: '鸡' },
    { pinyin: 'jí', final: 'í', char: '集' },
    { pinyin: 'jǐ', final: 'ǐ', char: '挤' },
    { pinyin: 'jì', final: 'ì', char: '记' },
  ],
  q: [
    { pinyin: 'qī', final: 'ī', char: '七' },
    { pinyin: 'qí', final: 'í', char: '其' },
    { pinyin: 'qǐ', final: 'ǐ', char: '起' },
    { pinyin: 'qì', final: 'ì', char: '气' },
  ],
  x: [
    { pinyin: 'xī', final: 'ī', char: '西' },
    { pinyin: 'xí', final: 'í', char: '习' },
    { pinyin: 'xǐ', final: 'ǐ', char: '洗' },
    { pinyin: 'xì', final: 'ì', char: '细' },
  ],
  zh: [
    { pinyin: 'zhī', final: 'ī', char: '知' },
    { pinyin: 'zhí', final: 'í', char: '直' },
    { pinyin: 'zhǐ', final: 'ǐ', char: '纸' },
    { pinyin: 'zhù', final: 'ù', char: '住' },
  ],
  ch: [
    { pinyin: 'chī', final: 'ī', char: '吃' },
    { pinyin: 'chí', final: 'í', char: '池' },
    { pinyin: 'chǐ', final: 'ǐ', char: '尺' },
    { pinyin: 'chū', final: 'ū', char: '出' },
  ],
  sh: [
    { pinyin: 'shī', final: 'ī', char: '诗' },
    { pinyin: 'shí', final: 'í', char: '十' },
    { pinyin: 'shǐ', final: 'ǐ', char: '史' },
    { pinyin: 'shù', final: 'ù', char: '树' },
  ],
  r: [
    { pinyin: 'rì', final: 'ì', char: '日' },
    { pinyin: 'ré', final: 'é', char: '热' },
    { pinyin: 'rú', final: 'ú', char: '如' },
    { pinyin: 'rù', final: 'ù', char: '入' },
  ],
  z: [
    { pinyin: 'zī', final: 'ī', char: '资' },
    { pinyin: 'zá', final: 'á', char: '杂' },
    { pinyin: 'zǔ', final: 'ǔ', char: '组' },
    { pinyin: 'zì', final: 'ì', char: '字' },
  ],
  c: [
    { pinyin: 'cī', final: 'ī', char: '呲' },
    { pinyin: 'cá', final: 'á', char: '擦' },
    { pinyin: 'cǔ', final: 'ǔ', char: '粗' },
    { pinyin: 'cì', final: 'ì', char: '次' },
  ],
  s: [
    { pinyin: 'sī', final: 'ī', char: '思' },
    { pinyin: 'sá', final: 'á', char: '撒' },
    { pinyin: 'sǔ', final: 'ǔ', char: '苏' },
    { pinyin: 'sì', final: 'ì', char: '四' },
  ],
  y: [
    { pinyin: 'yī', final: 'ī', char: '衣' },
    { pinyin: 'yá', final: 'á', char: '牙' },
    { pinyin: 'yǔ', final: 'ǔ', char: '雨' },
    { pinyin: 'yuè', final: 'uè', char: '月' },
  ],
  w: [
    { pinyin: 'wū', final: 'ū', char: '乌' },
    { pinyin: 'wá', final: 'á', char: '娃' },
    { pinyin: 'wǒ', final: 'ǒ', char: '我' },
    { pinyin: 'wǔ', final: 'ǔ', char: '五' },
  ],
};

/** 韵母表（幼小衔接 / 一年级） */
const FINALS = [
  { id: 'a', label: 'a', tip: '啊', tone: 0, group: '单韵母' },
  { id: 'o', label: 'o', tip: '喔', tone: 1, group: '单韵母' },
  { id: 'e', label: 'e', tip: '鹅', tone: 2, group: '单韵母' },
  { id: 'i', label: 'i', tip: '衣', tone: 3, group: '单韵母' },
  { id: 'u', label: 'u', tip: '乌', tone: 4, group: '单韵母' },
  { id: 'ü', label: 'ü', tip: '鱼', tone: 0, group: '单韵母' },
  { id: 'ai', label: 'ai', tip: '爱', tone: 1, group: '复韵母' },
  { id: 'ei', label: 'ei', tip: '欸', tone: 2, group: '复韵母' },
  { id: 'ui', label: 'ui', tip: '威', tone: 3, group: '复韵母' },
  { id: 'ao', label: 'ao', tip: '熬', tone: 4, group: '复韵母' },
  { id: 'ou', label: 'ou', tip: '欧', tone: 0, group: '复韵母' },
  { id: 'iu', label: 'iu', tip: '优', tone: 1, group: '复韵母' },
  { id: 'ie', label: 'ie', tip: '耶', tone: 2, group: '复韵母' },
  { id: 'üe', label: 'üe', tip: '约', tone: 3, group: '复韵母' },
  { id: 'er', label: 'er', tip: '儿', tone: 4, group: '复韵母' },
  { id: 'an', label: 'an', tip: '安', tone: 0, group: '鼻韵母' },
  { id: 'en', label: 'en', tip: '恩', tone: 1, group: '鼻韵母' },
  { id: 'in', label: 'in', tip: '音', tone: 2, group: '鼻韵母' },
  { id: 'un', label: 'un', tip: '温', tone: 3, group: '鼻韵母' },
  { id: 'ün', label: 'ün', tip: '云', tone: 4, group: '鼻韵母' },
  { id: 'ang', label: 'ang', tip: '昂', tone: 0, group: '鼻韵母' },
  { id: 'eng', label: 'eng', tip: '哼', tone: 1, group: '鼻韵母' },
  { id: 'ing', label: 'ing', tip: '英', tone: 2, group: '鼻韵母' },
  { id: 'ong', label: 'ong', tip: '翁', tone: 3, group: '鼻韵母' },
];

/** 补充韵母例字（扫描 SYLLABLES 不够时用） */
const FINAL_EXTRA = {
  ai: [
    { initial: 'b', pinyin: 'bái', final: 'ái', char: '白' },
    { initial: 'm', pinyin: 'mài', final: 'ài', char: '卖' },
    { initial: 'd', pinyin: 'dài', final: 'ài', char: '带' },
  ],
  ei: [
    { initial: 'b', pinyin: 'bèi', final: 'èi', char: '被' },
    { initial: 'f', pinyin: 'fēi', final: 'ēi', char: '飞' },
    { initial: 'm', pinyin: 'měi', final: 'ěi', char: '美' },
  ],
  ui: [
    { initial: 'g', pinyin: 'guī', final: 'uī', char: '归' },
    { initial: 'd', pinyin: 'duì', final: 'uì', char: '对' },
    { initial: 'h', pinyin: 'huí', final: 'uí', char: '回' },
  ],
  ao: [
    { initial: 'm', pinyin: 'māo', final: 'āo', char: '猫' },
    { initial: 'g', pinyin: 'gāo', final: 'āo', char: '高' },
    { initial: 'h', pinyin: 'hǎo', final: 'ǎo', char: '好' },
  ],
  ou: [
    { initial: 'd', pinyin: 'dōu', final: 'ōu', char: '兜' },
    { initial: 'l', pinyin: 'lóu', final: 'óu', char: '楼' },
    { initial: 'sh', pinyin: 'shǒu', final: 'ǒu', char: '手' },
  ],
  iu: [
    { initial: 'n', pinyin: 'niú', final: 'iú', char: '牛' },
    { initial: 'l', pinyin: 'liù', final: 'iù', char: '六' },
    { initial: 'j', pinyin: 'jiǔ', final: 'iǔ', char: '九' },
  ],
  ie: [
    { initial: 'x', pinyin: 'xiě', final: 'iě', char: '写' },
    { initial: 'b', pinyin: 'bié', final: 'ié', char: '别' },
    { initial: 'l', pinyin: 'liè', final: 'iè', char: '列' },
  ],
  üe: [
    { initial: 'x', pinyin: 'xuě', final: 'uě', char: '雪' },
    { initial: 'q', pinyin: 'què', final: 'uè', char: '却' },
    { initial: 'y', pinyin: 'yuè', final: 'uè', char: '月' },
  ],
  er: [
    { initial: '—', pinyin: 'ér', final: 'ér', char: '儿' },
    { initial: '—', pinyin: 'ěr', final: 'ěr', char: '耳' },
    { initial: '—', pinyin: 'èr', final: 'èr', char: '二' },
  ],
  an: [
    { initial: 'b', pinyin: 'bān', final: 'ān', char: '班' },
    { initial: 'm', pinyin: 'màn', final: 'àn', char: '慢' },
    { initial: 't', pinyin: 'tiān', final: 'iān', char: '天' },
  ],
  en: [
    { initial: 'b', pinyin: 'běn', final: 'ěn', char: '本' },
    { initial: 'r', pinyin: 'rén', final: 'én', char: '人' },
    { initial: 's', pinyin: 'sēn', final: 'ēn', char: '森' },
  ],
  in: [
    { initial: 'x', pinyin: 'xīn', final: 'īn', char: '心' },
    { initial: 'j', pinyin: 'jīn', final: 'īn', char: '今' },
    { initial: 'l', pinyin: 'lín', final: 'ín', char: '林' },
  ],
  un: [
    { initial: 'ch', pinyin: 'chūn', final: 'ūn', char: '春' },
    { initial: 't', pinyin: 'tún', final: 'ún', char: '屯' },
    { initial: 'k', pinyin: 'kūn', final: 'ūn', char: '昆' },
  ],
  ün: [
    { initial: 'y', pinyin: 'yún', final: 'ún', char: '云' },
    { initial: 'j', pinyin: 'jūn', final: 'ūn', char: '军' },
    { initial: 'q', pinyin: 'qún', final: 'ún', char: '群' },
  ],
  ang: [
    { initial: 't', pinyin: 'táng', final: 'áng', char: '糖' },
    { initial: 'f', pinyin: 'fáng', final: 'áng', char: '房' },
    { initial: 'ch', pinyin: 'chàng', final: 'àng', char: '唱' },
  ],
  eng: [
    { initial: 'f', pinyin: 'fēng', final: 'ēng', char: '风' },
    { initial: 'd', pinyin: 'dēng', final: 'ēng', char: '灯' },
    { initial: 'sh', pinyin: 'shēng', final: 'ēng', char: '声' },
  ],
  ing: [
    { initial: 'x', pinyin: 'xīng', final: 'īng', char: '星' },
    { initial: 't', pinyin: 'tīng', final: 'īng', char: '听' },
    { initial: 'y', pinyin: 'yīng', final: 'īng', char: '鹰' },
  ],
  ong: [
    { initial: 'g', pinyin: 'gōng', final: 'ōng', char: '工' },
    { initial: 'h', pinyin: 'hóng', final: 'óng', char: '红' },
    { initial: 'zh', pinyin: 'zhōng', final: 'ōng', char: '钟' },
  ],
  ü: [
    { initial: 'y', pinyin: 'yú', final: 'ú', char: '鱼' },
    { initial: 'j', pinyin: 'jù', final: 'ù', char: '句' },
    { initial: 'q', pinyin: 'qǔ', final: 'ǔ', char: '取' },
  ],
};

function baseFinal(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'v')
    .replace(/Ü/g, 'v');
}

function finalKey(id) {
  return id === 'ü' || id === 'ün' || id === 'üe' ? id.replace(/ü/g, 'v') : id;
}

function mapSyllable(initialId, item) {
  const ini = initialId === '—' ? '' : initialId;
  const formula = ini
    ? `${ini} + ${item.final} = ${item.pinyin}`
    : `${item.final} = ${item.pinyin}`;
  return {
    ...item,
    initial: ini,
    formula,
  };
}

function getInitials() {
  return INITIALS;
}

function getFinals() {
  return FINALS;
}

function getSyllables(initialId) {
  return (SYLLABLES[initialId] || []).map((item) => mapSyllable(initialId, item));
}

function getFinalSyllables(finalId) {
  const key = finalKey(finalId);
  const fromScan = [];
  Object.entries(SYLLABLES).forEach(([initialId, list]) => {
    list.forEach((item) => {
      if (baseFinal(item.final) === key) {
        fromScan.push(mapSyllable(initialId, item));
      }
    });
  });
  const extra = (FINAL_EXTRA[finalId] || FINAL_EXTRA[key] || []).map((item) =>
    mapSyllable(item.initial, item),
  );
  const merged = [...fromScan, ...extra];
  const seen = new Set();
  const unique = merged.filter((item) => {
    const k = `${item.pinyin}:${item.char}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.slice(0, 6);
}

/** 全部拼读例字（认读练习用） */
function getAllSyllables() {
  const out = [];
  Object.entries(SYLLABLES).forEach(([initialId, list]) => {
    list.forEach((item) => {
      out.push(mapSyllable(initialId, item));
    });
  });
  Object.values(FINAL_EXTRA).forEach((list) => {
    list.forEach((item) => {
      out.push(mapSyllable(item.initial, item));
    });
  });
  return out;
}

function getFinalById(finalId) {
  return FINALS.find((f) => f.id === finalId);
}

function resolveFinalId(finalStr) {
  const bf = baseFinal(finalStr);
  const ranked = [...FINALS].sort((a, b) => b.id.length - a.id.length);
  for (const f of ranked) {
    const k = finalKey(f.id);
    if (k === bf) return f.id;
    if (f.id === 'üe' && bf === 'ue') return f.id;
    if (f.id === 'ün' && bf === 'un') return f.id;
  }
  return bf;
}

module.exports = {
  getInitials,
  getFinals,
  getSyllables,
  getFinalSyllables,
  getAllSyllables,
  getFinalById,
  baseFinal,
  resolveFinalId,
};
