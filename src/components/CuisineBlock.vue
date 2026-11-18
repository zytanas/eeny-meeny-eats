<script setup>
// The colored block on place cards and the detail page: the cuisine label set big in the
// display font, tilted like a sticker. Color and tilt come from placeLook(), so a place looks
// the same everywhere. It fills its parent; the parent sets the size and outline.
//
// Decorative (aria-hidden): the cuisine tag next to it already says the same thing.
//
// Fitting: the label never clips. Its font size is the largest that fits both the width
// (from the measured Anton glyph widths below) and the height (from the number of lines),
// using container query units, so it fits any block size without measuring in the browser.
// Multi-word labels have two layouts, picked by the block's shape: one line on wide blocks,
// two stacked lines on squarish ones.
import { computed } from 'vue'
import { placeLook } from '@/utils/placeLook'

const props = defineProps({
  place: { type: Object, required: true },
})

const copy = {
  // Shown instead of the cuisine for these labels (keys are cuisine labels as the API or
  // cuisineFromName() gives them). Plain "Restaurant" says nothing, so it gets a friendly word.
  // The cuisine tag on the card keeps the original label.
  labels: {
    Restaurant: 'Kainan',
    'Bubble Tea': 'Milk tea',
    Regional: 'Lokal',
    International: 'World eats',
    Noodle: 'Noodles',
  },
}

// Anton advance widths in em, uppercase (measured from the bundled font). Anything not
// listed counts as a wide letter, so an unexpected character can only make the text smaller.
const GLYPH_EM = {
  ' ': 0.234, A: 0.485, B: 0.479, C: 0.474, D: 0.493, E: 0.412, F: 0.399, G: 0.485, H: 0.499,
  I: 0.227, J: 0.466, K: 0.472, L: 0.397, M: 0.746, N: 0.498, O: 0.486, P: 0.472, Q: 0.494,
  R: 0.477, S: 0.461, T: 0.396, U: 0.474, V: 0.469, W: 0.712, X: 0.484, Y: 0.446, Z: 0.41,
  0: 0.494, 1: 0.331, 2: 0.494, 3: 0.494, 4: 0.494, 5: 0.494, 6: 0.494, 7: 0.494, 8: 0.494,
  9: 0.494, '&': 0.52, "'": 0.214, '-': 0.311, '.': 0.229, ',': 0.236,
}
const UNKNOWN_EM = 0.75
const LINE_HEIGHT = 0.95 // keep in sync with .line in the styles
// Wide blocks (cards from tablet up, the detail page) are about this many times wider than tall
const WIDE_ASPECT = 2.4

const emWidth = (text) => [...text].reduce((sum, ch) => sum + (GLYPH_EM[ch] ?? UNKNOWN_EM), 0)

// Every way to break the words onto two lines, most balanced first
function twoLineSplits(words) {
  return words
    .slice(1)
    .map((_, i) => [words.slice(0, i + 1).join(' '), words.slice(i + 1).join(' ')])
    .sort((a, b) => Math.max(...a.map(emWidth)) - Math.max(...b.map(emWidth)))
}

// Relative font size a layout gets in a block of the given aspect ratio (bigger is better)
const fit = (lines, aspect) => Math.min(aspect / Math.max(...lines.map(emWidth)), 1 / lines.length)

// -> { lines: ['FISH AND', 'CHIPS'], style: { '--em': 2.86, '--rows': 2 } }
function layout(lines) {
  return {
    lines,
    style: { '--em': Math.max(...lines.map(emWidth)).toFixed(3), '--rows': (lines.length * LINE_HEIGHT).toFixed(2) },
  }
}

const label = computed(() => {
  const cuisine = props.place.cuisine?.trim() || 'Restaurant'
  return (copy.labels[cuisine] ?? cuisine).toUpperCase()
})

const layouts = computed(() => {
  const words = label.value.split(/\s+/)
  if (words.length === 1) {
    const single = layout(words)
    return { wide: single, stacked: single }
  }
  const oneLine = [words.join(' ')]
  const [twoLines] = twoLineSplits(words)
  return {
    wide: layout(fit(oneLine, WIDE_ASPECT) >= fit(twoLines, WIDE_ASPECT) ? oneLine : twoLines),
    stacked: layout(twoLines),
  }
})

const look = computed(() => placeLook(props.place))
</script>

<template>
  <div class="cuisine-block" :style="{ '--block': look.blockVar, '--tilt': `${look.tilt}deg` }" aria-hidden="true">
    <div class="label-area">
      <span v-for="(variant, name) in layouts" :key="name" class="label" :class="`label--${name}`" :style="variant.style">
        <span v-for="line in variant.lines" :key="line" class="line">{{ line }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.cuisine-block {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden; /* a tilted label never pokes past the block's outline */
  background-color: var(--block, var(--color-accent));
  background-image: radial-gradient(color-mix(in srgb, var(--color-ink) 12%, transparent) 1.5px, transparent 1.7px);
  background-size: 14px 14px;
}

/* The space the label fits into. Parents can keep it clear of things laid over the block
   (the badges on vertical cards) with --label-inset. */
.label-area {
  position: absolute;
  inset: var(--label-inset, 10%);
  display: grid;
  place-items: center;
  container: label-area / size;
}

.label {
  display: grid;
  justify-items: center;
  grid-area: 1 / 1;
  /* Largest size that fits both ways: 84% of the width for the longest line (a little room
     for the tilt), and the full height for the lines. --label-max caps short words ("CAFE")
     so they don't swamp a big block. */
  font-size: min(calc(84cqw / var(--em)), calc(100cqh / var(--rows)), var(--label-max, 5.5rem));
  font-family: var(--font-display);
  font-weight: 400;
  color: var(--color-ink);
  /* Sticker cut-out: a hard cream offset behind the ink letters */
  text-shadow: 0.045em 0.045em 0 var(--color-surface);
  white-space: nowrap;
  transform: rotate(var(--tilt, -4deg));
  transition: transform var(--dur-pop) var(--ease-pop);
}

.line {
  display: block;
  line-height: 0.95; /* LINE_HEIGHT in the script */
}

/* Squarish blocks (phone rows, the desktop list) stack multi-word labels */
.label--wide {
  display: none;
}

@container label-area (aspect-ratio > 1.5) {
  .label--wide {
    display: grid;
  }

  .label--stacked {
    display: none;
  }
}
</style>
