// The one place that decides which food illustration goes with a cuisine or category.
// Every component that shows food art gets it from here (foodArt() or FOOD_ART), so
// swapping a picture means changing one line.
//
// Illustrations live in src/assets/foods/ and are built from design/foods-src/ with
// `node scripts/build-food-art.mjs`. Each is a FOOD_ART_SIZE x FOOD_ART_SIZE transparent
// WebP with the drawing centered at the same visual size, so give every <img>
// width/height of FOOD_ART_SIZE.

import barbecue from '@/assets/foods/barbecue.webp'
import bibimbap from '@/assets/foods/bibimbap.webp'
import icedCoffee from '@/assets/foods/iced-coffee.webp'
import pho from '@/assets/foods/pho.webp'
import samgyupsal from '@/assets/foods/samgyupsal.webp'
import sisig from '@/assets/foods/sisig.webp'
import sushi from '@/assets/foods/sushi.webp'
import taco from '@/assets/foods/taco.webp'

export const FOOD_ART_SIZE = 400

// key -> { src, width, height }
export const FOOD_ART = {
  barbecue: { src: barbecue, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  bibimbap: { src: bibimbap, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  icedCoffee: { src: icedCoffee, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  pho: { src: pho, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  samgyupsal: { src: samgyupsal, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  sisig: { src: sisig, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  sushi: { src: sushi, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
  taco: { src: taco, width: FOOD_ART_SIZE, height: FOOD_ART_SIZE },
}

// Cuisine label keywords -> art key. Checked top to bottom against the lowercased
// label, so put specific words ("korean bbq") above general ones ("bbq").
// Labels come from the API, e.g. "Korean", "Coffee Shop" -> "Cafe", "Steak House".
const CUISINE_RULES = [
  [['samgyup', 'korean bbq', 'korean barbecue'], 'samgyupsal'],
  [['korean'], 'bibimbap'],
  [['sushi', 'japanese'], 'sushi'],
  [['vietnamese', 'pho', 'ramen', 'noodle'], 'pho'], // noodle bowls share the pho art

  [['mexican', 'taco', 'burrito', 'tex-mex', 'latin'], 'taco'],
  [['sisig', 'filipino'], 'sisig'],
  [['barbecue', 'bbq', 'grill', 'inasal', 'steak'], 'barbecue'],
  [['cafe', 'café', 'coffee', 'tea', 'milk tea', 'juice'], 'icedCoffee'],
]

// Place category (from the API) -> art key, used when the cuisine label has no match
const CATEGORY_ART = {
  cafe: 'icedCoffee',
}

// Everything else (burgers, pizza, bakeries, plain "restaurant"...) until it has its own
// art: a bowl reads as "a meal"
const DEFAULT_ART = 'pho'

// foodArt('Korean') -> { key: 'bibimbap', src, width, height }
export function foodArt(cuisine = '', category = '') {
  const label = String(cuisine).toLowerCase()
  const rule = CUISINE_RULES.find(([words]) => words.some((word) => label.includes(word)))
  const key = rule?.[1] ?? CATEGORY_ART[category] ?? DEFAULT_ART
  return { key, ...FOOD_ART[key] }
}
