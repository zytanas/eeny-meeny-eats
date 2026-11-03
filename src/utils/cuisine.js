// Maps a cuisine label to one of the illustrations in CuisineArt.vue.
// Matching is by keyword, so API labels like "Japanese restaurant" or "Coffee shop" work too.
// Add keywords here to route more cuisines to an existing illustration.
const ART_KEYWORDS = {
  noodles: ['japanese', 'ramen', 'vietnamese', 'pho', 'chinese', 'thai', 'noodle'],
  rice: ['filipino', 'korean', 'indian', 'rice', 'asian'],
  coffee: ['cafe', 'café', 'coffee', 'tea', 'bakery', 'dessert'],
  pizza: ['italian', 'pizza', 'pasta'],
  taco: ['mexican', 'taco', 'latin'],
  burger: ['american', 'burger', 'fast food', 'bbq', 'grill', 'steak', 'chicken'],
}

export function cuisineArt(cuisine = '') {
  const label = cuisine.toLowerCase()
  const kind =
    Object.keys(ART_KEYWORDS).find((key) => ART_KEYWORDS[key].some((word) => label.includes(word))) ??
    'plate'
  return { kind }
}
