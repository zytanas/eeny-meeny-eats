<script setup>
// Bold sticker-style food illustrations, drawn inline so no images are needed.
// `kind` comes from cuisineArt() in utils/cuisine.js.
defineProps({
  kind: { type: String, default: 'plate' },
})
</script>

<template>
  <svg class="cuisine-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <!-- Ramen bowl with chopsticks -->
    <g v-if="kind === 'noodles'">
      <path d="M72 8 L44 60 M88 14 L56 62" class="thick" />
      <path d="M24 62 Q40 42 60 50 Q80 42 96 62 Z" class="f-cream" />
      <path d="M34 58 q6 -8 12 0 t12 0 t12 0 t12 0" class="thin" />
      <circle cx="80" cy="52" r="9" class="f-paper" />
      <circle cx="80" cy="52" r="4" class="f-primary" />
      <path d="M44 98 H76 L72 108 H48 Z" class="f-primary" />
      <path d="M14 62 H106 Q106 98 60 100 Q14 98 14 62 Z" class="f-primary" />
      <path d="M26 76 q8 -7 17 0 t17 0 t17 0 t17 0" class="thin" />
    </g>

    <!-- Rice bowl with a topping -->
    <g v-else-if="kind === 'rice'">
      <path d="M22 62 Q22 28 60 28 Q98 28 98 62 Z" class="f-paper" />
      <path d="M40 44 l4 -3 M56 38 l4 2 M48 54 l4 -2 M66 52 l3 3" class="thin" />
      <circle cx="76" cy="44" r="10" class="f-accent" />
      <circle cx="76" cy="44" r="4" class="f-primary" />
      <path d="M44 98 H76 L72 108 H48 Z" class="f-cream" />
      <path d="M14 62 H106 Q106 98 60 100 Q14 98 14 62 Z" class="f-cream" />
      <path d="M30 74 H90 M38 84 H82" class="thin" />
    </g>

    <!-- Coffee cup with steam -->
    <g v-else-if="kind === 'coffee'">
      <path d="M46 34 q-7 -8 0 -16 t0 -14 M62 36 q-7 -8 0 -16 t0 -14 M78 34 q-7 -8 0 -16 t0 -14" class="thin" />
      <ellipse cx="58" cy="104" rx="44" ry="8" class="f-cream" />
      <path d="M88 58 H96 Q108 58 108 71 Q108 84 95 84 H88" class="thick" />
      <path d="M26 44 H90 V76 Q90 100 58 100 Q26 100 26 76 Z" class="f-cream" />
      <path d="M26 58 H90 V72 H26 Z" class="f-accent" />
    </g>

    <!-- Pizza slice -->
    <g v-else-if="kind === 'pizza'">
      <path d="M24 42 Q60 24 96 42 L60 108 Z" class="f-accent" />
      <path d="M16 30 Q60 8 104 30 L96 44 Q60 24 24 44 Z" class="f-primary" />
      <circle cx="50" cy="56" r="8" class="f-primary" />
      <circle cx="72" cy="60" r="7" class="f-primary" />
      <circle cx="60" cy="82" r="6" class="f-primary" />
    </g>

    <!-- Taco -->
    <g v-else-if="kind === 'taco'">
      <circle cx="34" cy="54" r="10" class="f-primary" />
      <circle cx="60" cy="44" r="11" class="f-paper" />
      <circle cx="86" cy="54" r="10" class="f-primary" />
      <path d="M12 90 A48 48 0 0 1 108 90 Z" class="f-accent" />
      <path d="M26 90 A34 34 0 0 1 94 90" class="thin" />
    </g>

    <!-- Burger -->
    <g v-else-if="kind === 'burger'">
      <path d="M20 82 H100 V88 Q100 100 88 100 H32 Q20 100 20 88 Z" class="f-primary" />
      <rect x="14" y="64" width="92" height="16" rx="8" class="f-ink" />
      <path d="M16 58 H104 L96 70 L86 62 L76 72 L64 62 L52 72 L40 62 L28 70 Z" class="f-accent" />
      <path d="M18 58 Q18 22 60 22 Q102 22 102 58 Z" class="f-primary" />
      <path d="M44 38 l5 -2 M60 32 l5 1 M74 40 l5 -1" class="thin" />
    </g>

    <!-- Fallback: plate with fork and knife -->
    <g v-else>
      <path d="M14 22 V40 Q14 48 20 48 Q26 48 26 40 V22 M20 22 V100" class="thick" />
      <path d="M102 22 Q90 36 92 62 H102 V100" class="thick" />
      <circle cx="60" cy="62" r="32" class="f-cream" />
      <circle cx="60" cy="62" r="20" class="f-paper" />
    </g>
  </svg>
</template>

<style scoped>
.cuisine-art {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  /* Inherited by every shape: thick ink outline, no fill unless a class adds one */
  stroke: var(--color-ink);
  stroke-width: 5;
  stroke-linejoin: round;
  stroke-linecap: round;
  fill: none;
}

.thick { stroke-width: 6; }
.thin { stroke-width: 3.5; }

.f-primary { fill: var(--color-primary); }
.f-accent { fill: var(--color-accent); }
.f-cream { fill: var(--color-bg); }
.f-paper { fill: var(--color-card); }
.f-ink { fill: var(--color-ink); }
</style>
