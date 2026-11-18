// Which places /api/nearby returns, and with what cuisine label. Runs per request on the cached
// Geoapify results, so editing a chain list or a name rule takes effect immediately.
//
// In order:
//   1. Fast-food chains (fastFoodChains.js) are always left out.
//   2. Other chains (CHAIN_BLOCKLIST) are left out when hideChains is on.
//   3. Places with only a generic label get a cuisine from their name (src/utils/cuisineFromName.js),
//      so "Aling Nena's Tapsilogan" (tagged fast food) becomes Filipino, and "Kuya Orly's
//      Fastfood" becomes a generic Restaurant (a small local eatery).
//   4. Same-name places within DUPLICATE_DISTANCE_M are merged (after 3, so the copy with a real
//      cuisine is the one kept).
//   5. Places still labelled plain "Fast Food" after that are left out.
import { isChain, isFastFoodChain } from './chains.js'
import { dedupe } from './geoapify.js'
import { withInferredCuisine } from '../../src/utils/cuisineFromName.js'

// The label geoapify.js gives catering.fast_food places with no specific cuisine
export const FAST_FOOD_LABEL = 'Fast Food'

export function keepPlaces(places, { hideChains }) {
  const named = places
    .filter((p) => !isFastFoodChain(p))
    .filter((p) => !hideChains || !isChain(p))
    .map(withInferredCuisine)
  return dedupe(named).filter((p) => p.cuisine !== FAST_FOOD_LABEL)
}
