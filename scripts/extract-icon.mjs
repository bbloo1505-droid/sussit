import sharp from 'sharp'

// Known-good crop from brand board (verified as full app icon)
await sharp('src/assets/brand-board.png')
  .extract({ left: 1080, top: 90, width: 300, height: 300 })
  .png()
  .toFile('src/assets/tmp-raw-icon.png')

const { data, info } = await sharp('src/assets/tmp-raw-icon.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

// Find non-cream bounds (icon is near-black squircle on cream board)
let minX = info.width
let minY = info.height
let maxX = 0
let maxY = 0
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // cream-ish board pixels are light; keep dark + lime + white marks
    const isCream = r > 200 && g > 200 && b > 190
    if (!isCream) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
}

const pad = 2
const left = Math.max(0, minX - pad)
const top = Math.max(0, minY - pad)
const width = Math.min(info.width - left, maxX - minX + 1 + pad * 2)
const height = Math.min(info.height - top, maxY - minY + 1 + pad * 2)

console.log({ left, top, width, height })

await sharp('src/assets/tmp-raw-icon.png')
  .extract({ left, top, width, height })
  .resize(256, 256, { fit: 'fill' })
  .png()
  .toFile('src/assets/suss-icon.png')

await sharp('src/assets/suss-icon.png').resize(64, 64).png().toFile('public/suss-icon.png')

console.log('extracted suss-icon.png')
