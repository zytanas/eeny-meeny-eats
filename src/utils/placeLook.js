// How a place looks wherever it's shown (card, detail page): the color of its cuisine block
// and the sticker tilt of the label on it. Both come from the place itself, never its
// position in a list, so a card keeps its look when filters or sorting change and the detail
// page matches the card it was opened from.

// Block colors (CSS tokens). Ink text is AA on all four (checked in the contrast audit).
const BLOCKS = ['accent', 'mint', 'coral', 'primary-soft']

// Degrees. Never 0, so every sticker looks hand-placed; small enough to stay readable.
const TILTS = [-6, -4, -3, 3, 4, 6]

// FNV-1a: a fast, stable string hash (same id -> same number on every render and device)
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// placeLook(place) -> { block: 'mint', blockVar: 'var(--color-mint)', tilt: -4 }
export function placeLook(place) {
  const h = hash(String(place.id ?? place.name ?? ''))
  const block = BLOCKS[h % BLOCKS.length]
  return {
    block,
    blockVar: `var(--color-${block})`,
    // Different bits from the color, so color and tilt don't always pair up
    tilt: TILTS[(h >>> 8) % TILTS.length],
  }
}
