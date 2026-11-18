<script setup>
// Placeholder shaped like a list PlaceCard (cuisine block, name, badges, stats line) while
// places load. Same layout switch as the card: compact row on phones and in the desktop
// list column, vertical card on tablets.
// Purely visual: the parent hides it from screen readers and announces the loading state itself.
</script>

<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="art bone"></div>
    <div class="body">
      <span class="bone bar bar--title"></span>
      <span class="badges">
        <span class="bone bar bar--tag"></span>
        <span class="bone bar bar--status"></span>
      </span>
      <span class="bone bar bar--stats"></span>
    </div>
  </div>
</template>

<style scoped>
/* Same frame and sizes as .place-card.is-link */
.skeleton-card {
  --art-size: 104px;
  --art-height: clamp(150px, 128px + 4vw, 176px);

  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--color-surface);
  border: var(--outline);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.art {
  flex: none;
  height: var(--art-height);
  border-bottom: var(--outline);
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
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

/* On vertical cards the real badges sit over the block, so only the title and stats show */
.badges {
  display: none;
  gap: 0.4rem;
}

.bar--tag {
  width: 5.5rem;
  height: 1.4rem;
}

.bar--status {
  width: 3.5rem;
  height: 1.4rem;
}

.bar--stats {
  width: 45%;
  height: 0.95rem;
}

/* Compact rows, like the list cards on phones and in the desktop list column */
@media (max-width: 639.98px), (min-width: 1024px) {
  .skeleton-card {
    flex-direction: row;
    min-height: var(--art-size);
  }

  .art {
    align-self: stretch;
    width: var(--art-size);
    height: auto;
    min-height: var(--art-size);
    border-bottom: 0;
    border-right: var(--outline);
  }

  .body {
    justify-content: center;
    gap: 0.45rem;
    padding: 0.7rem 0.85rem;
  }

  .bar--title {
    height: clamp(1.15rem, 1.05rem + 0.5vw, 1.3rem);
  }

  .badges {
    display: flex;
  }
}

@media (min-width: 1024px) {
  .skeleton-card {
    --art-size: 124px;
  }
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

/* Mango tint, like the real card's block */
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
