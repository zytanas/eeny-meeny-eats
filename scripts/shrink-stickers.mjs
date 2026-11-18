import sharp from 'sharp'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

// Change this to wherever your stickers live
const DIR = 'src/assets/stickers'
const WIDTH = 400 // about 2x the size they show on screen

const files = (await readdir(DIR)).filter((f) => /\.(svg|png)$/i.test(f))

for (const file of files) {
  const input = path.join(DIR, file)
  const output = path.join(DIR, file.replace(/\.(svg|png)$/i, '.webp'))

  await sharp(input, { density: 300 })
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(output)

  console.log(`${file} → ${path.basename(output)}`)
}