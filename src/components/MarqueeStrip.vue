<script setup>
import { computed } from 'vue'
import { marqueeItems } from '@/content/marquee'

const props = defineProps({
  items: { type: Array, default: () => marqueeItems },
  // 'ink' | 'primary' | 'accent'
  tone: { type: String, default: 'ink' },
  reverse: { type: Boolean, default: false },
  // Slight tilt for a stuck-on sticker look. A tilted strip bleeds past the edges
  // so its corners don't show, so the parent should clip horizontal overflow.
  tilt: { type: Number, default: 0 },
})

// Repeat the items so one copy is wider than the widest screen; the track holds
// two copies and slides by exactly one copy for a seamless loop.
const REPEAT = 4
const run = computed(() => Array.from({ length: REPEAT }, () => props.items).flat())
</script>

<template>
  <!-- Decorative only, so screen readers skip it -->
  <div
    class="marquee"
    :class="[`marquee--${tone}`, { 'marquee--reverse': reverse }]"
    :style="tilt ? { transform: `rotate(${tilt}deg)`, marginInline: '-8px' } : undefined"
    aria-hidden="true"
  >
    <div class="marquee-track">
      <span v-for="copyIndex in 2" :key="copyIndex" class="marquee-copy">
        <span v-for="(item, i) in run" :key="i" class="marquee-item">
          {{ item }}<span class="marquee-dot">•</span>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  position: relative;
  z-index: 1;
  overflow: hidden;
  padding: 0.55rem 0;
  border-block: var(--outline);
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 0.95rem + 0.8vw, 1.6rem);
  max-width: 100%; /* the track inside is wider than the screen; this box must not be */
  line-height: 1;
  letter-spacing: 0.04em;
  white-space: nowrap;
  user-select: none;
}

.marquee--ink {
  background: var(--color-ink);
  color: var(--color-bg);
}
.marquee--primary {
  background: var(--color-primary);
  color: var(--color-ink);
}
.marquee--accent {
  background: var(--color-accent);
  color: var(--color-ink);
}

.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee var(--marquee-speed) linear infinite;
}

.marquee--reverse .marquee-track {
  animation-direction: reverse;
}

/* Let people stop it by hovering */
.marquee:hover .marquee-track {
  animation-play-state: paused;
}

.marquee-copy {
  display: flex;
}

.marquee-item {
  display: inline-flex;
  align-items: center;
}

.marquee-dot {
  margin: 0 0.6em;
}

.marquee--ink .marquee-dot {
  color: var(--color-primary);
}

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Paused, not sped up to the end (the global rule would otherwise jump it) */
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none !important;
  }
}
</style>
