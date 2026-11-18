// Guesses a cuisine from a place's name when OpenStreetMap only gives a generic one.
// Runs on the server (netlify/functions/nearby.js imports it), so /api/nearby already returns
// the final labels and can drop places that are still plain "Fast Food". Plain JS with no
// Vite-only features, so the function's bundler can use it as is.
//
// Many places have no cuisine tag, so the API labels them by place type ("Restaurant",
// "Fast Food", "Cafe", "Food Court"). Their names often say more: "Big Brother Biryani" is
// Indian, "Aling Nena's Lugawan" is Filipino.
//
// Matching is whole-word, case- and accent-insensitive (see utils/keywords.js). Checked in tiers;
// the first tier with a match decides:
//   1. Brands (utils/brands.js). These win over any map tag, even a specific one.
//   2. Food words. A real cuisine tag ("Korean", "Steak House") is never overridden from here on.
//      When a name has several, the one that comes FIRST in the name wins:
//      "Blake's Wings & Steaks" -> Wings.
//   3. Weak words: generic eatery words and drinks. Only used when no food word matched, so
//      "Tea Garden Seafood" is Seafood and "After Tree Dessert Cafe" is Dessert.
//   4. Places tagged fast food with "fastfood" in their own name ("Kuya Orly's Fastfood") are
//      small turo-turo shops, not fast food: they become a generic "Restaurant" (KAINAN block)
//      instead of being dropped as plain "Fast Food".
// Labels reuse the API's own labels where one exists, so inferred and tagged places share
// one Cuisine filter chip.
import { keywordFinder, normalizeText } from './keywords.js'
import { BRAND_RULES, BRAND_WHOLE_NAMES } from './brands.js'

// Labels the API uses when a place has no specific cuisine (netlify/lib/geoapify.js PLACE_KINDS,
// plus "Cafe" for catering.cafe.coffee_shop)
const GENERIC_LABELS = new Set(['Restaurant', 'Fast Food', 'Cafe', 'Food Court'])
const FAST_FOOD = 'Fast Food'
const GENERIC_EATERY = 'Restaurant'

const FOOD_RULES = [
  [['samgyup', 'samgyupsal', 'sangyupsal', 'samgyeopsal', 'kbbq', 'korean bbq', 'korean barbecue', 'korean', 'bibimbap', 'bibimbob', 'tteokbokki', 'cupbop'], 'Korean'],
  [['japanese', 'ramen', 'sushi', 'izakaya', 'katsu', 'tonkatsu', 'takoyaki', 'takuyaki', 'shabu shabu'], 'Japanese'],
  [['chinese', 'dimsum', 'dim sum', 'siomai', 'dumpling', 'dumplings', 'lauriat', 'noodle house', 'tea house'], 'Chinese'],
  [['vietnamese', 'pho', 'banh mi'], 'Vietnamese'],
  [['thai'], 'Thai'],
  [['indian', 'biryani', 'curry', 'desi', 'delhi'], 'Indian'],
  [['shawarma', 'kebab', 'kebabs', 'kabab', 'persian'], 'Middle Eastern'],
  [['mexican', 'taco', 'tacos', 'taqueria', 'burrito', 'burritos'], 'Mexican'],
  [['paella'], 'Spanish'],

  // Filipino dishes, with the "-an"/"-ia" place forms ("lugawan" = a lugaw place)
  [
    [
      'filipino', 'filipiniana', 'pinoy', 'lutong bahay', 'almusal', 'kamayan', 'tapa',
      'inasal', 'inasalan', 'lechon', 'lechonan', 'lechoneria', 'litson', 'liempo', 'bagnet',
      'sisig', 'sisigan', 'kare kare',
      'lomi', 'lomihan', 'mami', 'mamihan', 'lugaw', 'lugawan', 'goto', 'gotohan',
      'pares', 'paresan', 'bulalo', 'bulaluhan', 'bulalohan', 'sinanglaw', 'sinanglawan',
      'pancit', 'pansit', 'sinangag',
      'silog', 'silogan', 'tapsilog', 'tapsilogan', 'tapsihan',
      'empanada', 'empanadas', 'empanadaan',
      'kakanin', 'bibingka', 'puto', 'siopao', 'halo halo', 'taho', 'turon', 'meryenda', 'merienda',
      // Regional: Cebu (ngohiong, pungko-pungko, sutukil), chicken houses (manukan), cook-to-order (paluto)
      'ngohiong', 'pungko pungko', 'sutukil', 'manukan', 'paluto',
    ],
    'Filipino',
  ],

  [['pizza', 'pizzas', 'pizzeria'], 'Pizza'],
  [['italian', 'pasta', 'cucina', 'trattoria'], 'Italian'],
  [['burger', 'burgers'], 'Burger'],
  [['american'], 'American'],
  [['seafood', 'seafoods'], 'Seafood'],
  [['steak', 'steaks', 'steakhouse'], 'Steak House'],
  [['bbq', 'barbecue', 'barbeque', 'grill', 'grille', 'grillhouse', 'ihaw', 'ihawan', 'inihaw', 'ihaw ihaw'], 'Barbecue'],
  [['wings'], 'Wings'],
  [['chicken', 'fried chicken'], 'Chicken'],
  [['ice cream', 'gelato', 'gelateria', 'creamery'], 'Ice Cream'],
  [['dessert', 'desserts', 'cheesecake', 'cupcake', 'cupcakes', 'crepe', 'crepes', 'churros', 'frozen yogurt', 'yogurt', 'waffle', 'waffles'], 'Dessert'],
  [['bakery', 'bakeshop', 'bakehouse', 'pastry', 'pastries', 'patisserie'], 'Bakery'],
  [['donut', 'donuts', 'doughnut', 'doughnuts'], 'Donut'],
]

const WEAK_RULES = [
  // Says "a place to eat", not what it serves
  [['eatery', 'canteen', 'kanteen', 'cafeteria', 'kainan', 'carinderia', 'karinderya', 'karenderya', 'carenderia', 'turo turo'], 'Filipino'],
  // Drinks. "Green tea" and matcha shops are cafes; in Philippine place names any other plain
  // "tea" is nearly always a milk tea shop ("Tea Hive")
  [['green tea', 'matcha', 'coffee', 'cafe'], 'Cafe'],
  [['milk tea', 'milktea', 'boba', 'tea'], 'Bubble Tea'],
]

const FAST_FOOD_IN_NAME = [[['fastfood', 'fast food'], GENERIC_EATERY]]

const findBrandInName = keywordFinder(BRAND_RULES)
const WHOLE_NAME_BRANDS = new Map(Object.entries(BRAND_WHOLE_NAMES).map(([brand, value]) => [normalizeText(brand).trim(), value]))
function findBrand(name) {
  const whole = normalizeText(name).trim()
  if (WHOLE_NAME_BRANDS.has(whole)) return { value: WHOLE_NAME_BRANDS.get(whole), keyword: whole }
  return findBrandInName(name)
}
const findFood = keywordFinder(FOOD_RULES)
const findWeak = keywordFinder(WEAK_RULES)
const findFastFoodInName = keywordFinder(FAST_FOOD_IN_NAME)

// -> { cuisine, inferred, keyword }
//   cuisine:  the label to show and filter by
//   inferred: true when it came from the name rather than the map data
//   keyword:  the name word it came from ("biryani"), so foodArt() can pick a closer picture
//             than the label alone ("inasal" -> barbecue, where "Filipino" -> sisig)
export function cuisineFromName(name = '', cuisine = '') {
  const unchanged = { cuisine, inferred: false, keyword: null }
  const hit =
    findBrand(name) ??
    (GENERIC_LABELS.has(cuisine) ? findFood(name) ?? findWeak(name) : null) ??
    (cuisine === FAST_FOOD ? findFastFoodInName(name) : null)
  if (!hit || hit.value === cuisine) return unchanged
  return { cuisine: hit.value, inferred: true, keyword: hit.keyword }
}

// Place from Geoapify (netlify/lib/geoapify.js) -> the same place with the inferred cuisine filled in.
// Keeps the original label as `taggedCuisine` and the flag as `cuisineInferred`.
export function withInferredCuisine(place) {
  const { cuisine, inferred, keyword } = cuisineFromName(place.name, place.cuisine)
  return {
    ...place,
    cuisine,
    taggedCuisine: place.cuisine,
    cuisineInferred: inferred,
    cuisineKeyword: keyword,
  }
}
