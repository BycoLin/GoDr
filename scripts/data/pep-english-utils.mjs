/**
 * 展平 PEP 词表：{ semester: { unit: [[word, meaning, category], ...] } }
 */
export function flattenPepBook(book, grade) {
  const items = [];
  for (const [semesterStr, units] of Object.entries(book)) {
    const semester = Number(semesterStr);
    for (const [unitStr, words] of Object.entries(units)) {
      const unit = Number(unitStr);
      for (const [word, meaning, category] of words) {
        items.push({ grade, semester, unit, word, meaning, category });
      }
    }
  }
  return items;
}
