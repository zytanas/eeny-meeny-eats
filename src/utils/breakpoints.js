import { ref, onMounted, onBeforeUnmount } from 'vue'

// The app's breakpoints, defined once. Layout is mobile-first, so each one is a min-width:
//   mobile        < 640px   (the default styles, no media query)
//   tablet        640px – 1023px
//   desktop       1024px and up
//   large desktop 1440px and up
// CSS media queries can't read variables, so stylesheets use these same literal numbers
// (see the header of style.css). Keep the two in sync.
export const BREAKPOINTS = {
  tablet: 640,
  desktop: 1024,
  wide: 1440,
}

export const MEDIA = {
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
}

// Reactive matchMedia: `const isDesktop = useMediaQuery(MEDIA.desktop)`
export function useMediaQuery(query) {
  const mql = window.matchMedia(query)
  const matches = ref(mql.matches)
  const update = (event) => (matches.value = event.matches)

  onMounted(() => {
    matches.value = mql.matches
    mql.addEventListener('change', update)
  })
  onBeforeUnmount(() => mql.removeEventListener('change', update))

  return matches
}
