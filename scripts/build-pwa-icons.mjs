// Builds the app icons from the favicon artwork (public/favico.svg), centered on the
// cream page background (--color-bg in src/style.css):
//
//   public/icons/pwa-192x192.png           manifest icon ("any")
//   public/icons/pwa-512x512.png           manifest icon ("any")
//   public/icons/pwa-maskable-512x512.png  manifest icon ("maskable"): artwork kept inside the
//                                          safe zone, so Android's circle/squircle crops never cut it
//   public/apple-touch-icon.png            iOS home screen (180 x 180)
//
//   node scripts/build-pwa-icons.mjs
//
// Re-run after changing favico.svg. The manifest that points at these lives in vite.config.js.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const SOURCE = 'public/favico.svg'
const BACKGROUND = '#fff9f4' // --color-bg

// Share of the canvas width the artwork spans. The sticker is wide (313 x 213), so the
// height share is about two thirds of this.
const ANY_WIDTH = 0.84
const APPLE_WIDTH = 0.8 // iOS rounds the corners, so a little more room than "any"
// Maskable icons are only guaranteed to show a centered circle 80% of the icon's size.
// Fit the artwork's diagonal inside 76% of it, leaving a small margin inside the safe zone.
const MASKABLE_DIAGONAL = 0.76

const ICONS = [
  { out: 'public/icons/pwa-192x192.png', size: 192, fit: 'width', share: ANY_WIDTH },
  { out: 'public/icons/pwa-512x512.png', size: 512, fit: 'width', share: ANY_WIDTH },
  { out: 'public/icons/pwa-maskable-512x512.png', size: 512, fit: 'diagonal', share: MASKABLE_DIAGONAL },
  { out: 'public/apple-touch-icon.png', size: 180, fit: 'width', share: APPLE_WIDTH },
]

// The drop shadow filter (exported from Figma) cuts the shadow out wherever the artwork is
// (feComposite operator="out"). Along the anti-aliased outline both are partly transparent, so a
// light hairline shows between the outline and the shadow at icon sizes. Dropping that step
// draws the whole shadow underneath instead: same look, no seam. favico.svg itself is unchanged.
const svg = Buffer.from(
  (await readFile(SOURCE, 'utf8')).replace(/<feComposite in2="hardAlpha" operator="out"\s*\/>/, ''),
)
const { width: svgW, height: svgH } = await sharp(svg).metadata()

for (const { out, size, fit, share } of ICONS) {
  const scale = fit === 'diagonal' ? (size * share) / Math.hypot(svgW, svgH) : (size * share) / svgW
  const width = Math.round(svgW * scale)

  // Rasterize the SVG at twice the final size, then scale down, so edges stay smooth
  const art = await sharp(svg, { density: 72 * scale * 2 })
    .resize({ width })
    .png()
    .toBuffer()

  await sharp({ create: { width: size, height: size, channels: 3, background: BACKGROUND } })
    .composite([{ input: art, gravity: 'center' }])
    .removeAlpha() // fully opaque: iOS shows transparent pixels as black
    .png({ compressionLevel: 9 })
    .toFile(out)

  console.log(`${out}  ${size}x${size}, artwork ${width}px wide`)
}
