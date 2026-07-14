/** 声母表 + 常用拼读示例（幼小衔接 / 一年级） */

const INITIALS = [
  { id: 'b', tip: '波', tone: 0 },
  { id: 'p', tip: '坡', tone: 1 },
  { id: 'm', tip: '摸', tone: 2 },
  { id: 'f', tip: '佛', tone: 3 },
  { id: 'd', tip: '得', tone: 4 },
  { id: 't', tip: '特', tone: 0 },
  { id: 'n', tip: '讷', tone: 1 },
  { id: 'l', tip: '勒', tone: 2 },
  { id: 'g', tip: '哥', tone: 3 },
  { id: 'k', tip: '科', tone: 4 },
  { id: 'h', tip: '喝', tone: 0 },
  { id: 'j', tip: '基', tone: 1 },
  { id: 'q', tip: '欺', tone: 2 },
  { id: 'x', tip: '希', tone: 3 },
  { id: 'zh', tip: '知', tone: 4 },
  { id: 'ch', tip: '吃', tone: 0 },
  { id: 'sh', tip: '诗', tone: 1 },
  { id: 'r', tip: '日', tone: 2 },
  { id: 'z', tip: '资', tone: 3 },
  { id: 'c', tip: '雌', tone: 4 },
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
    { pinyin: 'bù', final: 'ù', char: '不' },
  ],
  p: [
    { pinyin: 'pā', final: 'ā', char: '趴' },
    { pinyin: 'pó', final: 'ó', char: '婆' },
    { pinyin: 'pǐ', final: 'ǐ', char: '匹' },
    { pinyin: 'pù', final: 'ù', char: '瀑' },
  ],
  m: [
    { pinyin: 'mā', final: 'ā', char: '妈' },
    { pinyin: 'mó', final: 'ó', char: '模' },
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
    { pinyin: 'dù', final: 'ù', char: '杜' },
  ],
  t: [
    { pinyin: 'tā', final: 'ā', char: '他' },
    { pinyin: 'té', final: 'é', char: '特' },
    { pinyin: 'tǐ', final: 'ǐ', char: '体' },
    { pinyin: 'tù', final: 'ù', char: '兔' },
  ],
  n: [
    { pinyin: 'nà', final: 'à', char: '那' },
    { pinyin: 'né', final: 'é', char: '呢' },
    { pinyin: 'nǐ', final: 'ǐ', char: '你' },
    { pinyin: 'nǔ', final: 'ǔ', char: '努' },
  ],
  l: [
    { pinyin: 'lā', final: 'ā', char: '拉' },
    { pinyin: 'lé', final: 'é', char: '乐' },
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
    { pinyin: 'kā', final: 'ā', char: '咖' },
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
    { pinyin: 'jí', final: 'í', char: '急' },
    { pinyin: 'jǐ', final: 'ǐ', char: '挤' },
    { pinyin: 'jì', final: 'ì', char: '记' },
  ],
  q: [
    { pinyin: 'qī', final: 'ī', char: '七' },
    { pinyin: 'qí', final: 'í', char: '奇' },
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
    { pinyin: 'cī', final: 'ī', char: '疵' },
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

function getInitials() {
  return INITIALS;
}

function getSyllables(initialId) {
  return (SYLLABLES[initialId] || []).map((item) => ({
    ...item,
    initial: initialId,
    formula: `${initialId} + ${item.final} = ${item.pinyin}`,
  }));
}

module.exports = {
  getInitials,
  getSyllables,
};
