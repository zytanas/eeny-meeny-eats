// Builds the flat illustrations used across the app:
//   design/foods-src/ -> src/assets/foods/  (food art, see src/utils/foodArt.js)
//   design/tools-src/ -> src/assets/tools/  ("How it works" step icons: pin, map, slot)
//
//   node scripts/build-food-art.mjs           # every set
//   node scripts/build-food-art.mjs tools     # just one set
//
// For each .png / .webp in a set's source folder (transparent, any size) it writes <out>/<name>.webp:
//   1. trims the transparent padding, so every drawing starts from its real outline
//   2. fits it inside the same inner box on a square transparent canvas, with even
//      padding all round, so all the drawings in a set read as the same visual size
//   3. encodes WebP (alpha kept), stepping quality down until the file is under MAX_BYTES
//
// Every output is CANVAS x CANVAS, so components can give each <img> width/height
// of CANVAS and never shift the layout.
import sharp from 'sharp'
import { readdir, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'

const SETS = {
  foods: { src: 'design/foods-src', out: 'src/assets/foods' },
  tools: { src: 'design/tools-src', out: 'src/assets/tools' },
}
const CANVAS = 400 // about 2x the largest size they show on screen
const PADDING = 0.06 // share of the canvas left clear on each side (room for the drop shadow)
const MAX_BYTES = 50 * 1024
const QUALITIES = [88, 82, 76, 70, 64, 58]

const inner = Math.round(CANVAS * (1 - PADDING * 2))

const wanted = process.argv.slice(2)
for (const key of wanted) {
  if (!SETS[key]) {
    console.error(`Unknown set "${key}". Sets: ${Object.keys(SETS).join(', ')}`)
    process.exit(1)
  }
}

for (const key of wanted.length ? wanted : Object.keys(SETS)) {
  const { src: SRC, out: OUT } = SETS[key]
  console.log(`\n[${key}] ${SRC} -> ${OUT}`)
  await mkdir(OUT, { recursive: true })

  // One source per name: a PNG wins over a WebP of the same name
  const all = (await readdir(SRC)).filter((f) => /\.(png|webp)$/i.test(f))
  const byName = new Map()
  for (const f of all) {
    const name = f.replace(/\.(png|webp)$/i, '').toLowerCase()
    if (!byName.has(name) || /\.png$/i.test(f)) byName.set(name, f)
  }
  const files = [...byName.values()].sort()
  if (!files.length) {
    console.error(`No .png or .webp files in ${SRC}`)
    process.exit(1)
  }

  for (const file of files) {
    const name = file.replace(/\.(png|webp)$/i, '').toLowerCase()
    const output = path.join(OUT, `${name}.webp`)

    // 1. Trim to the drawing. threshold keeps faint antialiased edge pixels.
    const trimmed = await sharp(path.join(SRC, file))
      .ensureAlpha()
      .trim({ threshold: 1 })
      .toBuffer({ resolveWithObject: true })

    // 2. Longest side fills the inner box, then centered on the transparent canvas
    const fitted = await sharp(trimmed.data)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    const square = sharp({
      create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: fitted, gravity: 'center' }])
    const flat = await square.png().toBuffer()

    // 3. Highest quality that fits the budget
    let quality
    let bytes
    for (quality of QUALITIES) {
      await sharp(flat).webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(output)
      bytes = (await stat(output)).size
      if (bytes <= MAX_BYTES) break
    }

    const kb = (bytes / 1024).toFixed(1)
    const flag = bytes > MAX_BYTES ? '  OVER BUDGET' : ''
    console.log(
      `${file.padEnd(18)} trimmed ${trimmed.info.width}x${trimmed.info.height} -> ${CANVAS}x${CANVAS}  q${quality}  ${kb} KB${flag}`,
    )
  }
}
