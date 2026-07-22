/** 小学常见形近字组：key 为正确字，值为可混淆的形近字 */
export const SIMILAR_CHAR_GROUPS: Record<string, string[]> = {
  己: ['已', '巳'],
  已: ['己', '巳'],
  巳: ['己', '已'],
  未: ['末', '木'],
  末: ['未', '木'],
  木: ['未', '本'],
  土: ['士', '干'],
  士: ['土', '干'],
  干: ['千', '于'],
  千: ['干', '于'],
  人: ['入', '八'],
  入: ['人', '八'],
  日: ['目', '曰'],
  目: ['日', '自'],
  王: ['玉', '主'],
  玉: ['王', '五'],
  往: ['住', '柱'],
  住: ['往', '柱'],
  秦: ['泰', '奏'],
  泰: ['秦', '春'],
  题: ['提', '堤'],
  提: ['题', '堤'],
  堤: ['题', '提'],
  折: ['拆', '哲'],
  拆: ['折', '析'],
  须: ['需', '顺'],
  需: ['须', '雨'],
  暖: ['缓', '援'],
  缓: ['暖', '援'],
  晴: ['睛', '清'],
  睛: ['晴', '精'],
  清: ['晴', '情'],
  情: ['清', '晴'],
  返: ['反', '板'],
  景: ['影', '京'],
  影: ['景', '京'],
  怀: ['杯', '坏'],
  杯: ['怀', '坏'],
  江: ['红', '工'],
  红: ['江', '经'],
  孤: ['瓜', '狐'],
  瓜: ['孤', '爪'],
  驱: ['区', '欧'],
  赛: ['塞', '宗'],
  塞: ['赛', '寒'],
  将: ['奖', '浆'],
  奖: ['将', '浆'],
  醉: ['最', '罪'],
  催: ['摧', '焦'],
  陶: ['淘', '萄'],
  淘: ['陶', '萄'],
  唯: ['惟', '维'],
  惟: ['唯', '维'],
  低: ['底', '抵'],
  底: ['低', '抵'],
  复: ['夏', '覆'],
  逢: ['缝', '峰'],
  峰: ['锋', '逢'],
  径: ['经', '劲'],
  经: ['径', '红'],
  侧: ['测', '则'],
  瑟: ['塞', '色'],
};

export function similarCharsFor(ch: string): string[] {
  return SIMILAR_CHAR_GROUPS[ch] || [];
}

export function pickSimilarWrong(correct: string, avoid?: Set<string>): string | null {
  const pool = similarCharsFor(correct).filter((ch) => ch !== correct && !avoid?.has(ch));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 形近字专练句（不绑诗名，纯字词辨析） */
export interface SimilarCharDrill {
  id: string;
  grade: number;
  line: string;
  /** 需辨析的正确字在 line 中的下标 */
  idx: number;
  correct: string;
}

export const SIMILAR_CHAR_DRILLS: SimilarCharDrill[] = [
  { id: 'sim_g4_01', grade: 4, line: '不要人夸颜色好', idx: 2, correct: '人' },
  { id: 'sim_g4_02', grade: 4, line: '返景入深林', idx: 1, correct: '景' },
  { id: 'sim_g4_03', grade: 4, line: '葡萄美酒夜光杯', idx: 6, correct: '杯' },
  { id: 'sim_g4_04', grade: 4, line: '秦时明月汉时关', idx: 0, correct: '秦' },
  { id: 'sim_g4_05', grade: 4, line: '半江瑟瑟半江红', idx: 6, correct: '红' },
  { id: 'sim_g4_06', grade: 4, line: '已经做完作业', idx: 0, correct: '已' },
  { id: 'sim_g4_07', grade: 4, line: '未来的希望', idx: 0, correct: '未' },
  { id: 'sim_g4_08', grade: 4, line: '提笔画一幅画', idx: 0, correct: '提' },
  { id: 'sim_g4_09', grade: 4, line: '河堤上散步', idx: 1, correct: '堤' },
  { id: 'sim_g4_10', grade: 4, line: '晴天去郊游', idx: 0, correct: '晴' },
  { id: 'sim_g4_11', grade: 4, line: '心情很愉快', idx: 0, correct: '情' },
  { id: 'sim_g4_12', grade: 4, line: '将士守边疆', idx: 0, correct: '将' },
  { id: 'sim_g4_13', grade: 4, line: '暖洋洋的春日', idx: 0, correct: '暖' },
  { id: 'sim_g4_14', grade: 4, line: '折纸飞机', idx: 0, correct: '折' },
  { id: 'sim_g4_15', grade: 4, line: '须要努力学', idx: 0, correct: '须' },
  { id: 'sim_g4_16', grade: 4, line: '土堆成小山', idx: 0, correct: '土' },
];

export function similarCharDrillsForGrade(grade: number): SimilarCharDrill[] {
  const g = Number(grade);
  const exact = SIMILAR_CHAR_DRILLS.filter((d) => d.grade === g);
  return exact.length ? exact : SIMILAR_CHAR_DRILLS.filter((d) => d.grade === 4);
}
