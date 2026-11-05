// Spots chains by name or brand, using CHAIN_BLOCKLIST (and REGIONAL_CHAIN_BLOCKLIST when
// HIDE_REGIONAL_CHAINS is on) from config.js. Tolerates punctuation, spacing and small typos, so
// "Jolibee", "Kenny Roger's" and "ArmyNavy" are caught, but not lookalikes such as "Angela's Bakery".
import { CHAIN_BLOCKLIST, HIDE_REGIONAL_CHAINS, REGIONAL_CHAIN_BLOCKLIST } from './config.js'

// "Dunkin' Donuts" -> "dunkin donuts", "7-Eleven" -> "7 eleven", "Café" -> "cafe"
export function normalizeName(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const words = (text) => normalizeName(text).split(' ').filter(Boolean)

const TERMS = [...CHAIN_BLOCKLIST, ...(HIDE_REGIONAL_CHAINS ? REGIONAL_CHAIN_BLOCKLIST : [])]
  .map((entry) => {
    const tokens = words(typeof entry === 'string' ? entry : entry.name)
    return { tokens, joined: tokens.join(''), wholeName: Boolean(entry.wholeName) }
  })
  .filter((term) => term.tokens.length)

export function isChain(place) {
  return [place.name, place.brand].some((text) => {
    if (!text) return false
    const nameWords = words(text)
    return TERMS.some((term) => matchesTerm(nameWords, term))
  })
}

function matchesTerm(nameWords, term) {
  const n = term.tokens.length
  if (term.wholeName) {
    return (nameWords.length === n && sameWords(nameWords, term.tokens)) || nameWords.join('') === term.joined
  }
  for (let i = 0; i < nameWords.length; i++) {
    if (i + n <= nameWords.length && sameWords(nameWords.slice(i, i + n), term.tokens)) return true
    // Spacing differences: "ArmyNavy" vs "Army Navy", "Zen Tea" vs "Zentea"
    for (let len = 1; len <= n + 1 && i + len <= nameWords.length; len++) {
      if (nameWords.slice(i, i + len).join('') === term.joined) return true
    }
  }
  return false
}

function sameWords(nameWords, termWords) {
  return termWords.every((word, i) => closeEnough(nameWords[i], word))
}

// Short words must match exactly, so "Bo's" never matches "Boss". Typos rarely touch the first or
// last letter, and requiring both keeps real words out ("Infinite" isn't "Infinitea").
function closeEnough(word, chainWord) {
  if (word === chainWord) return true
  if (word[0] !== chainWord[0] || word.at(-1) !== chainWord.at(-1)) return false
  if (chainWord.length >= 8) return editDistance(word, chainWord) <= 1
  if (chainWord.length >= 5) return isSwap(word, chainWord)
  return false
}

// Two neighboring letters swapped: "angles" vs "angels"
function isSwap(a, b) {
  if (a.length !== b.length) return false
  const diff = [...a].flatMap((ch, i) => (ch === b[i] ? [] : [i]))
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
}

// Edits (insert, delete, change, or swap two neighboring letters) to turn a into b
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}
