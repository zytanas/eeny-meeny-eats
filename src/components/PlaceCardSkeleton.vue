<script setup>
// Placeholder shaped like PlaceCard (art area, name, distance line, button) while places load.
// Purely visual: the parent hides it from screen readers and announces the loading state itself.
</script>

<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="art bone"></div>
    <div class="body">
      <span class="bone bar bar--title"></span>
      <span class="bone bar bar--meta"></span>
      <span class="bone bar bar--btn"></span>
    </div>
  </div>
</template>

<style scoped>
/* Same frame as .place-card */
.skeleton-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-surface);
  border: var(--outline);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

/* Matches PlaceCard's .art height and outline */
.art {
  height: clamp(112px, 90px + 6vw, 144px);
  border-bottom: var(--outline);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.95rem var(--gutter) var(--gutter);
}

.bar {
  display: block;
  border-radius: var(--radius-pill);
}

.bar--title {
  width: 70%;
  height: clamp(1.3rem, 1.15rem + 0.6vw, 1.55rem);
}

.bar--meta {
  width: 40%;
  height: 0.9rem;
  margin-bottom: 0.4rem;
}

.bar--btn {
  height: 50px;
}

/* A soft highlight sweeps across each block */
.bone {
  --bone: color-mix(in srgb, var(--color-ink) 8%, var(--color-surface));
  background-color: var(--bone);
  background-image: linear-gradient(
    100deg,
    transparent 30%,
    color-mix(in srgb, var(--color-surface) 70%, transparent) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: shimmer 1.4s ease-in-out infinite;
}

/* Mango tint, like the real card's art area */
.art.bone {
  --bone: color-mix(in srgb, var(--color-accent) 35%, var(--color-surface));
}

@keyframes shimmer {
  from { background-position: 150% 0; }
  to { background-position: -50% 0; }
}

/* Static blocks, no sweep */
@media (prefers-reduced-motion: reduce) {
  .bone {
    animation: none;
    background-image: none;
  }
}
</style>
