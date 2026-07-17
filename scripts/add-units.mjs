import fs from 'fs';

function addUnits(path, assignments) {
  let s = fs.readFileSync(path, 'utf8');
  for (const [id, unit] of Object.entries(assignments)) {
    const marker = `id: '${id}'`;
    const idx = s.indexOf(marker);
    if (idx < 0) {
      console.warn('missing', id, path);
      continue;
    }
    const end = s.indexOf('\n  },', idx);
    const block = s.slice(idx, end);
    if (block.includes('unit:')) continue;
    s = `${s.slice(0, end)}\n    unit: ${unit},${s.slice(end)}`;
  }
  fs.writeFileSync(path, s);
}

addUnits('miniprogram/data/packs/poetry-g1-g2/items.js', {
  poetry_g0_shang_xue: 1,
  poetry_g0_xiao_bai_tu: 1,
  poetry_g0_shu_zi_ge: 1,
  poetry_g0_xiao_shou: 1,
  poetry_g1_yong_e: 1,
  poetry_g1_jiang_nan: 1,
  poetry_g1_hua: 1,
  poetry_g1_min_nong: 2,
  poetry_g1_gu_lang_yue_xing: 2,
  poetry_g1_feng: 2,
  poetry_g2_mei_hua: 1,
  poetry_g2_xiao_er_chui_diao: 1,
  poetry_g2_deng_guan_que_lou: 1,
  poetry_g2_wang_lu_shan_pu_bu: 2,
  poetry_g2_jiang_xue: 2,
  poetry_g2_ye_su_shan_si: 2,
  poetry_g2_chi_le_ge: 2,
});

addUnits('miniprogram/data/packs/math-g1-g2/items.js', {
  math_g0_add5: 1,
  math_g0_sub5: 1,
  math_g0_compare5: 1,
  math_g0_missing5: 1,
  math_g1_add10: 1,
  math_g1_sub10: 1,
  math_g1_mix10: 1,
  math_g1_make10: 2,
  math_g1_break10: 2,
  math_g1_flat10: 2,
  math_g1_borrow10: 2,
  math_g1_compare20: 3,
  math_g1_missing10: 3,
  math_g2_add20: 1,
  math_g2_sub20: 1,
  math_g2_mix20: 1,
  math_g2_compare100: 2,
  math_g2_missing20: 2,
});

addUnits('miniprogram/data/packs/english-g1-g2/items.js', {
  en_g0_red: 1,
  en_g0_one: 1,
  en_g0_two: 1,
  en_g0_dog: 1,
  en_g0_mom: 1,
  en_g1_apple: 1,
  en_g1_banana: 1,
  en_g1_cat: 2,
  en_g1_dog: 2,
  en_g1_red: 3,
  en_g1_blue: 3,
  en_g1_book: 4,
  en_g1_pen: 4,
  en_g2_family: 1,
  en_g2_friend: 1,
  en_g2_happy: 2,
  en_g2_water: 2,
  en_g2_milk: 2,
  en_g2_teacher: 3,
  en_g2_morning: 3,
  en_g2_school: 3,
});

console.log('units added');
