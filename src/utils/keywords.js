// Whole-word keyword matching shared by foodArt.js and cuisineFromName.js.
//
// Text and keywords are normalized the same way before matching:
//   - lowercase
//   - accents removed ("Café" -> "cafe", "Phở" -> "pho", "Bánh Mì" -> "banh mi")
//   - hyphens become spaces ("Halo-Halo" -> "halo halo", "Kare-Kare" -> "kare kare")
//   - curly and look-alike apostrophes become ' ("Max’s" -> "max's")
// So a keyword list never needs accented, hyphenated or curly-quoted copies.
//
// A keyword matches whole words only: "tea" doesn't match "Steak House" or "Serenitea",
// "pho" doesn't match "Phoenix". List plurals and suffixed forms separately ("taco", "tacos",
// "lugaw", "lugawan").
//
// A keyword followed by 's doesn't match: in "Pizza's Corner" or "Kainan's Grill" the word is
// a name, not what the place serves. Keywords that end in 's themselves (the brand "max's")
// still match.

export function normalizeText(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // combining accent marks left over by NFD
    .toLowerCase()
    .replace(/[-‐-―]/g, ' ')
    .replace(/[‘’ʼ`´]/g, "'")
}

function wordPattern(word) {
  const escaped = normalizeText(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Not part of a longer word, and not followed by a possessive 's
  return new RegExp(String.raw`(?<![\p{L}\p{N}])${escaped}(?![\p{L}\p{N}])(?!'s(?![\p{L}\p{N}]))`, 'u')
}

// rules: [[keywords, value], ...] -> a function that returns the value of the first rule
// with a keyword in `text`, or null. Rules are checked top to bottom, so put specific
// phrases ("korean bbq") above the general words they contain ("korean").
export function keywordMatcher(rules) {
  const compiled = rules.map(([words, value]) => [words.map(wordPattern), value])
  return (text) => {
    const normalized = normalizeText(text)
    for (const [patterns, value] of compiled) {
      if (patterns.some((pattern) => pattern.test(normalized))) return value
    }
    return null
  }
}

// Finds the keyword that appears FIRST in `text`, whichever rule it's in, and says which:
// -> { value, keyword } or null. "Blake's Wings & Steaks" -> the wings rule, because "wings"
// comes before "steaks". Two keywords starting at the same spot: the longer one wins
// ("korean bbq" over "korean"); then the rule listed first.
export function keywordFinder(rules) {
  const compiled = rules.flatMap(([words, value], order) =>
    words.map((keyword) => ({ keyword, value, order, pattern: wordPattern(keyword), length: normalizeText(keyword).length })),
  )
  return (text) => {
    const normalized = normalizeText(text)
    let best = null
    for (const entry of compiled) {
      const index = entry.pattern.exec(normalized)?.index
      if (index == null) continue
      if (
        !best ||
        index < best.index ||
        (index === best.index && (entry.length > best.length || (entry.length === best.length && entry.order < best.order)))
      ) {
        best = { ...entry, index }
      }
    }
    return best && { value: best.value, keyword: best.keyword }
  }
}
