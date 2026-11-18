// The one place that decides which food illustration goes with a cuisine or category.
// Every component that shows food art gets it from here (foodArt(), placeArt() or FOOD_ART),
// so swapping a picture means changing one line.
//
// Place cards and the detail page don't use these (they show the cuisine as a typographic
// block, components/CuisineBlock.vue). The illustrations are for Home and the Pick screen.
//
// Illustrations live in src/assets/foods/ and are built from design/foods-src/ with
// `node scripts/build-food-art.mjs`. Each is a FOOD_ART_SIZE x FOOD_ART_SIZE transparent
// WebP with the drawing centered at the same visual size, so give every <img>
// width/height of FOOD_ART_SIZE.
//
// Adding a picture: put <file>.png in design/foods-src/, run the build script, list it in
// ART_FILES below, and route keywords to it in matchArt.
import { keywordMatcher } from './keywords'

export const FOOD_ART_SIZE = 400

// Every built file in src/assets/foods/, found at build time: { '../assets/foods/pho.webp': url }
const BUILT = import.meta.glob('../assets/foods/*.webp', { eager: true, import: 'default' })

// art key -> file name in src/assets/foods/ (without .webp)
const ART_FILES = {
  barbecue: 'barbecue',
  bibimbap: 'bibimbap',
  icedCoffee: 'iced-coffee',
  pho: 'pho',
  samgyupsal: 'samgyupsal',
  sisig: 'sisig',
  sushi: 'sushi',
  taco: 'taco',
}

// key -> { src, width, height }, for the pictures that exist
export const FOOD_ART = Object.fromEntries(
  Object.entries(ART_FILES)
    .map(([key, file]) => [key, BUILT[`../assets/foods/${file}.webp`]])
    .filter(([, src]) => src)
    .map(([key, src]) => [key, { src, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE }]),
)

// Cuisine label or name keyword -> art key. Labels come from the API ("Korean", "Steak
// House", "Fast Food") or from cuisineFromName(). Matching is whole-word and ignores case,
// accents and hyphens (utils/keywords.js). Rules are checked top to bottom, so put specific
// phrases ("korean bbq") above general words ("korean").
const matchArt = keywordMatcher([
  [['samgyup', 'samgyupsal', 'sangyupsal', 'samgyeopsal', 'kbbq', 'korean bbq', 'korean barbecue'], 'samgyupsal'],
  [['korean', 'bibimbap', 'tteokbokki'], 'bibimbap'],
  [['sushi', 'japanese', 'izakaya', 'takoyaki'], 'sushi'],
  // Noodle and soup bowls share the pho art
  [
    [
      'vietnamese', 'pho', 'ramen', 'noodle', 'noodles', 'noodle house',
      'lomi', 'lomihan', 'mami', 'mamihan', 'lugaw', 'lugawan', 'goto', 'gotohan',
      'bulalo', 'bulaluhan', 'bulalohan', 'pares', 'paresan',
    ],
    'pho',
  ],
  [['mexican', 'taco', 'tacos', 'taqueria', 'burrito', 'burritos', 'tex mex', 'latin'], 'taco'],
  // Grilled and roasted, including "Steak House" and inasal (grilled chicken)
  [['barbecue', 'bbq', 'barbeque', 'grill', 'grille', 'grillhouse', 'ihaw', 'ihawan', 'inihaw', 'ihaw ihaw', 'inasal', 'inasalan', 'lechon', 'lechonan', 'liempo', 'bagnet', 'steak', 'steaks', 'steakhouse', 'kebab', 'kebabs', 'kabab', 'shawarma', 'middle eastern'], 'barbecue'],
  [['sisig', 'sisigan', 'filipino', 'karenderya', 'silog', 'silogan', 'tapsilog', 'tapsilogan', 'carinderia', 'karinderya', 'carenderia', 'turo turo', 'kare kare', 'eatery', 'canteen', 'kanteen', 'cafeteria', 'kainan', 'lutong bahay', 'almusal', 'kamayan', 'filipiniana'], 'sisig'],
  [['cafe', 'coffee', 'tea', 'milk tea', 'milktea', 'bubble tea', 'boba', 'juice'], 'icedCoffee'],
])

// Place category (from the API) -> art key, used when nothing else matches
const CATEGORY_ART = {
  cafe: 'icedCoffee',
}

// foodArt('Korean') -> { key: 'bibimbap', src, width, height }, or null when none of the
// illustrations fits (pizza, bakery, plain "Restaurant"...): the caller picks a fallback.
// `keyword` is the name word a cuisine was inferred from ("inasal"); it's tried first, so
// "Mang Inasal" gets barbecue rather than the generic Filipino sisig.
export function foodArt(cuisine = '', category = '', keyword = null) {
  const key = (keyword && matchArt(keyword)) ?? matchArt(cuisine) ?? CATEGORY_ART[category] ?? null
  return FOOD_ART[key] ? { key, ...FOOD_ART[key] } : null
}

// Art for a place from the places store (uses the name keyword when the cuisine was inferred)
export function placeArt(place) {
  return foodArt(place.cuisine, place.category, place.cuisineKeyword)
}
