// Chains whose names don't say what they serve. cuisineFromName() checks these first, and a brand
// match wins over any map tag: this list is checked by hand, while OpenStreetMap tags for the
// same chain vary from branch to branch (Max's is tagged Asian, Regional or Chicken).
//
// Only chains that can reach the results belong here. Fast-food chains are always left out by
// the server (netlify/lib/fastFoodChains.js), so they need no cuisine. Most brands below are in
// CHAIN_BLOCKLIST, so they only show when chains are included (?chains=include or HIDE_CHAINS
// off); Mary Grace isn't, so it always shows.
//
// Matching works like every other keyword list (utils/keywords.js): whole words, any case,
// curly or straight apostrophes, hyphens as spaces ("Kuya-J"). Labels reuse existing cuisine
// labels, so a brand shares its Cuisine filter chip with the other places like it.
export const BRAND_RULES = [
  [['kuya j', 'amber golden pork'], 'Filipino'],
  [["max's"], 'Chicken'],
  [['moonleaf', 'serenitea'], 'Bubble Tea'],
  [['goldilocks', 'red ribbon', 'mary grace'], 'Bakery'],
]

// Brands whose name is too common a word to match inside other names ("Amber Bakeshop" isn't
// the chain): these only match when they're the place's whole name. Keys as written, any case.
export const BRAND_WHOLE_NAMES = {
  Amber: 'Filipino', // Amber Golden Pork Barbecue; OpenStreetMap tags its branches Restaurant or Fast Food
}
