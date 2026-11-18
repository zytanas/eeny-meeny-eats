// Fast-food chains. These never appear, whatever HIDE_CHAINS or ?chains=include says: the app
// steers people toward local places instead. Matched against a place's name and its Geoapify
// brand tag, the same tolerant way as CHAIN_BLOCKLIST in config.js (whole words; case, accents,
// punctuation, spacing and small typos ignored). See netlify/lib/chains.js.
//
// Sit-down chains and cake shops (Max's, Kuya J, Goldilocks, Red Ribbon...) aren't here; they're
// regular chains in CHAIN_BLOCKLIST, hidden only by the chains setting.
//
// An entry written as { name, wholeName: true } only matches when it's the place's entire name,
// for names that are too common on their own.
export const FAST_FOOD_CHAINS = [
  // Burgers, chicken and wings
  'Jollibee',
  "McDonald's",
  'KFC',
  'Burger King',
  "Wendy's",
  'Popeyes',
  'Wingstop',
  'Wing Zone',
  "Angel's Burger",
  { name: "Angel's", wholeName: true }, // bare "Angel's" is the burger stand; "Angel's Food Hub" isn't
  'Minute Burger',
  "Zark's",
  'Bonchon',
  'Kenny Rogers',
  'Chooks to Go',
  'Army Navy',
  "Andok's",
  'Baliwag Lechon Manok',
  { name: 'Baliwag', wholeName: true }, // also a town name, so only on its own
  // Pizza
  'Greenwich',
  "Shakey's",
  'Yellow Cab',
  'Pizza Hut',
  "Domino's",
  "Angel's Pizza",
  'Sbarro',
  // Snacks and sandwiches
  'Potato Corner',
  'Waffle Time',
  'Subway',
  'Turks',
  'Shawarma Shack',
  // Filipino and Asian
  'Chowking',
  'Mang Inasal',
  'Tokyo Tokyo',
]
