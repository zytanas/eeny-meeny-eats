// Maps a cuisine label to one of the illustrations in CuisineArt.vue.
// Matching is by whole keyword, so API labels like "Japanese restaurant" or "Coffee shop"
// work, but "tea" doesn't match "Steak House". List plurals separately ("taco", "tacos").
// Add keywords here to route more cuisines to an existing illustration.
const ART_KEYWORDS = {
  noodles: ['japanese', 'ramen', 'vietnamese', 'pho', 'chinese', 'thai', 'noodle', 'noodles'],
  rice: ['filipino', 'korean', 'indian', 'rice', 'asian'],
  coffee: ['cafe', 'café', 'coffee', 'tea', 'bakery', 'dessert', 'ice cream'],
  pizza: ['italian', 'pizza', 'pasta'],
  taco: ['mexican', 'taco', 'tacos', 'latin'],
  burger: ['american', 'burger', 'fast food', 'bbq', 'grill', 'steak', 'chicken'],
}

// Whole-word match that also works for accented letters ("café"), which \b doesn't
const wordPattern = (word) =>
  new RegExp(String.raw`(?<![\p{L}\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\p{L}\p{N}])`, 'u')
const MATCHERS = Object.entries(ART_KEYWORDS).map(([kind, words]) => [kind, words.map(wordPattern)])

export function cuisineArt(cuisine = '') {
  const label = cuisine.toLowerCase()
  const kind = MATCHERS.find(([, patterns]) => patterns.some((pattern) => pattern.test(label)))?.[0] ?? 'plate'
  return { kind }
}
