// Server-side settings shared by the Netlify Functions. Edit here, not in each function.
// (This folder is outside netlify/functions, so Netlify doesn't deploy these files as endpoints.)

// ISO country code that typed-area searches are limited to. Set to null to search worldwide.
export const COUNTRY_FILTER = 'ph'

// Nearby search: start at the radius the user picked (DEFAULT_RADIUS_KM matches DEFAULT_DISTANCE_KM
// in src/stores/filters.js). If that finds fewer than MIN_RESULTS places, widen to each of
// RADIUS_STEPS_KM in turn and stop at the first that does.
export const DEFAULT_RADIUS_KM = 2
export const RADIUS_STEPS_KM = [5, 10]
export const MIN_RESULTS = 15
// Nearest first, per search. Geoapify bills per 20 results, so this is also the cost of an uncached search.
export const RESULT_LIMIT = 200
export const PLACE_CATEGORIES = [
  'catering.restaurant',
  'catering.cafe',
  'catering.fast_food',
  'catering.food_court',
  'catering.ice_cream',
  'commercial.food_and_drink.bakery',
]

// Big chains are hidden so local spots stand out. Matched against a place's name and brand as whole
// words, ignoring case, accents, punctuation and spacing ("Jollibee Vigan" and "Jolli-bee" match
// "Jollibee"; "ArmyNavy" matches "Army Navy"). Small typos are tolerated in longer words: one typo
// in words of 8+ letters ("Jolibee"), and swapped letters in words of 5-7 ("Angle's"). See
// netlify/lib/chains.js.
// An entry written as { name, wholeName: true } only matches when it's the place's entire name, for
// names that are too common on their own ("Julie's" is the bakeshop, "Julies Fastfood" isn't).
// Set HIDE_CHAINS to false to show chains by default; a request can also ask for them with ?chains=include.
export const HIDE_CHAINS = true
export const CHAIN_BLOCKLIST = [
  // Burgers, chicken and fast food
  'Jollibee',
  "McDonald's",
  'KFC',
  'Chowking',
  'Mang Inasal',
  'Greenwich',
  'Burger King',
  "Wendy's",
  "Shakey's",
  'Pizza Hut',
  "Domino's",
  'Yellow Cab',
  "Angel's Burger",
  { name: "Angel's", wholeName: true }, // bare "Angel's" is the burger stand; "Angel's Food Hub" isn't
  "Angel's Pizza",
  'Army Navy',
  'Minute Burger',
  'Tropical Hut',
  'Shake Shack',
  'TGI Fridays',
  'Texas Roadhouse',
  'Popeyes',
  'Bonchon',
  'Kenny Rogers',
  "Max's Restaurant",
  "Andok's",
  'Chooks to Go',
  'Baliwag Lechon Manok',
  { name: 'Baliwag', wholeName: true }, // also a town name, so only on its own
  'Classic Savory',
  'Buffalo Wild Wings',
  'Potato Corner',
  'Turks',
  'Shawarma Shack',
  'Subway',
  'Sbarro',
  "Italianni's",
  "Gerry's Grill",
  "Gilligan's",
  'Ribshack',
  // Filipino and Asian
  'Tokyo Tokyo',
  'Master Siomai',
  'Siomai House',
  'Yoshinoya',
  'Teriyaki Boy',
  'Tim Ho Wan',
  'Din Tai Fung',
  'Samgyupsalamat',
  'Romantic Baboy',
  'Pancake House',
  'Sinangag Express',
  'Tapa King',
  'Adobo Connection',
  'Seafood Island',
  // Bakeries, donuts and desserts
  'Pan de Manila',
  "Julie's Bakeshop",
  { name: "Julie's", wholeName: true }, // "Julies Fastfood" is a different place
  'Goldilocks',
  'Red Ribbon',
  'Mister Donut',
  'J.Co',
  'Krispy Kreme',
  "Dunkin'",
  'BreadTalk',
  'Tous les Jours',
  'Dairy Queen',
  'Pinkberry',
  // Coffee
  'Starbucks',
  'Coffee Bean & Tea Leaf',
  "Bo's Coffee",
  'ZUS Coffee',
  'Pickup Coffee',
  'Figaro',
  "Seattle's Best",
  'Tim Hortons',
  'Coffee Project',
  'Don Macchiatos',
  // Milk tea
  'Moonleaf',
  'Yi Fang',
  'Zagu',
  'CoCo Fresh Tea',
  { name: 'CoCo', wholeName: true }, // its brand tag; "Coco Mama" is unrelated
  'Infinitea',
  'Zentea',
  'Serenitea',
  'Gong Cha',
  'Chatime',
  'Tiger Sugar',
  'Happy Lemon',
  // Convenience stores
  '7-Eleven',
  'Ministop',
  'FamilyMart',
  'Lawson',
]

// Smaller regional chains, still shown for now. Set HIDE_REGIONAL_CHAINS to true to hide them too.
export const HIDE_REGIONAL_CHAINS = false
export const REGIONAL_CHAIN_BLOCKLIST = [
  'Mr. Liempo',
  "R. Lapid's",
  'Sr. Pedro',
  'Big Mak',
  '24 Chicken',
  'Bacolod Chicken Inasal',
  'Wingyard',
  "Frankie's",
  "Ineng's",
  'Hen Lin',
  'Kowloon House',
  'Mary Grace',
]

// Places with the same name within this many meters of each other count as one
export const DUPLICATE_DISTANCE_M = 50

// How long cached nearby results stay fresh in Supabase `places_cache`
export const CACHE_TTL_HOURS = 24

// Cache cell size: coordinates are rounded to this many decimals (3 ≈ 110 m), so
// everyone within the same cell shares one cached result
export const CACHE_COORD_DECIMALS = 3

// Used for "open now" when the browser doesn't send its timezone
export const DEFAULT_TIMEZONE = 'Asia/Manila'
