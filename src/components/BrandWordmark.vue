<script setup>
// Playful wordmark built from type: each letter gets its own size, lift and tilt.
// Edit the words or the "wobble" pattern below to change the look.
const words = [
  { text: 'Eeny', tone: 'ink' },
  { text: 'Meeny', tone: 'ink' },
  { text: 'Eats!', tone: 'sticker' },
]

// Cycled across the letters of each word: [scale, y offset (em), rotation (deg)]
const wobble = [
  [1.25, 0.04, -6],
  [0.9, -0.06, 4],
  [1.05, 0.03, -2],
  [0.85, -0.04, 6],
  [1.1, 0.05, -4],
]

function letterStyle(i) {
  const [scale, y, rot] = wobble[i % wobble.length]
  return { fontSize: `${scale}em`, transform: `translateY(${y}em) rotate(${rot}deg)` }
}
</script>

<template>
  <span class="wordmark">
    <span class="visually-hidden">Eeny Meeny Eats</span>
    <span class="letters" aria-hidden="true">
      <span v-for="word in words" :key="word.text" class="word" :class="`word--${word.tone}`">
        <span v-for="(ch, i) in word.text" :key="i" class="letter" :style="letterStyle(i)">{{ ch }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.wordmark {
  display: inline-flex;
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 0.95rem + 0.8vw, 1.55rem); /* shrinks on phones */
  line-height: 1;
  text-transform: uppercase;
}

.letters {
  display: inline-flex;
  align-items: center;
  gap: 0.28em;
}

.word {
  display: inline-flex;
  align-items: center;
}

.letter {
  display: inline-block;
  transition: transform var(--dur-fast) var(--ease-pop);
}

.word--ink {
  color: var(--ink);
}

/* "EATS!" sits on an orange sticker */
.word--sticker {
  padding: 0.1em 0.35em 0.14em;
  border: var(--outline);
  border-radius: var(--radius-sm);
  background: var(--orange);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  transform: rotate(-4deg);
}

/* A little jiggle on hover */
@media (hover: hover) {
  .wordmark:hover .letter:nth-child(odd) {
    transform: translateY(-0.08em) rotate(-8deg);
  }
  .wordmark:hover .letter:nth-child(even) {
    transform: translateY(0.06em) rotate(8deg);
  }
}
</style>
