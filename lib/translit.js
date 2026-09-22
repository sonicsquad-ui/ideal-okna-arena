/**
 * Russian to Latin transliteration for SEO URL slugs
 * Champion-Tennis.ru (Чемпион-Теннис)
 */

const ruMap = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

function transliterate(str) {
  if (!str) return '';
  const lower = String(str).toLowerCase().trim();
  let result = '';
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (ruMap[char] !== undefined) {
      result += ruMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (/[\s\-_]/.test(char)) {
      result += '-';
    }
  }
  return result
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

module.exports = { transliterate };
