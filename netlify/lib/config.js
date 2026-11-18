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
// Fast-food chains aren't here: they're in fastFoodChains.js and are always left out, whatever
// these settings say.
export const HIDE_CHAINS = true
export const CHAIN_BLOCKLIST = [
  // Restaurants
  'Tropical Hut',
  'Shake Shack',
  'TGI Fridays',
  'Texas Roadhouse',
  "Max's Restaurant",
  { name: "Max's", wholeName: true }, // bare "Max's" is the brand tag; "Max's Barbershop Cafe" isn't
  'Classic Savory',
  'Buffalo Wild Wings',
  "Italianni's",
  "Gerry's Grill",
  "Gilligan's",
  'Ribshack',
  // Filipino and Asian
  'Kuya J',
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

// "Not the right spot?" (typed-area search) skips matches that are a chain business rather than
// a place to search around, when there are streets, districts or areas to offer instead. A match
// counts as a chain business when it's a business result (not a street or area) whose name is on
// CHAIN_BLOCKLIST, FAST_FOOD_CHAINS (fastFoodChains.js) or this list. See geocode() in geoapify.js.
export const GEOCODE_SKIP_BUSINESSES = [
  // Gas stations
  'Petron',
  'Shell',
  'Caltex',
  'Phoenix',
  'Seaoil',
  'Cleanfuel',
  'Unioil',
  'TotalEnergies',
  'Flying V',
  'Jetti',
  'PTT',
  // Convenience stores not on CHAIN_BLOCKLIST
  'Alfamart',
  "Uncle John's",
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

// Places with the same name within this many meters of each other count as one. OpenStreetMap
// often maps a local spot twice (a building and a point in it); in the Nov 2026 cache those copies
// were 51-139 m apart, while the closest same-name local places that are really separate were
// 333 m apart. (Chain branches can be closer, e.g. two Starbucks 67 m apart in a mall, but chains
// are hidden by default.)
export const DUPLICATE_DISTANCE_M = 150

// How long cached nearby results stay fresh in Supabase `places_cache`
export const CACHE_TTL_HOURS = 24

// Cache cell size: coordinates are rounded to this many decimals (3 ≈ 110 m), so
// everyone within the same cell shares one cached result
export const CACHE_COORD_DECIMALS = 3

// Used for "open now" when the browser doesn't send its timezone
export const DEFAULT_TIMEZONE = 'Asia/Manila'
