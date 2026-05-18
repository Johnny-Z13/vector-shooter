import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const cell = 96
const columns = 8
const rows = 6
const width = cell * columns
const height = cell * rows
const pixels = new Uint8ClampedArray(width * height * 4)
const TAU = Math.PI * 2

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const rgba = (hex, alpha = 255) => {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha]
}

const blend = (x, y, color, alphaScale = 1) => {
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || ix >= width || iy < 0 || iy >= height) return
  const idx = (iy * width + ix) * 4
  const alpha = clamp((color[3] / 255) * alphaScale, 0, 1)
  const inv = 1 - alpha
  pixels[idx] = pixels[idx] * inv + color[0] * alpha
  pixels[idx + 1] = pixels[idx + 1] * inv + color[1] * alpha
  pixels[idx + 2] = pixels[idx + 2] * inv + color[2] * alpha
  pixels[idx + 3] = clamp(pixels[idx + 3] + color[3] * alphaScale, 0, 255)
}

const dot = (x, y, radius, color, alphaScale = 1) => {
  const r = Math.ceil(radius)
  for (let yy = -r; yy <= r; yy += 1) {
    for (let xx = -r; xx <= r; xx += 1) {
      const d = Math.hypot(xx, yy)
      if (d <= radius) blend(x + xx, y + yy, color, alphaScale * (1 - d / (radius + 0.1)))
    }
  }
}

const line = (x1, y1, x2, y2, color, thickness = 1.5, glow = true) => {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.8))
  if (glow) {
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      dot(x, y, thickness + 4.2, color, 0.08)
      dot(x, y, thickness + 1.9, color, 0.16)
    }
  }
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    dot(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thickness, color, 0.94)
  }
}

const arc = (cx, cy, radius, start, end, color, thickness = 1.5) => {
  const steps = Math.max(10, Math.ceil(Math.abs(end - start) * radius))
  let px = cx + Math.cos(start) * radius
  let py = cy + Math.sin(start) * radius
  for (let i = 1; i <= steps; i += 1) {
    const a = start + (end - start) * (i / steps)
    const x = cx + Math.cos(a) * radius
    const y = cy + Math.sin(a) * radius
    line(px, py, x, y, color, thickness)
    px = x
    py = y
  }
}

const poly = (points, color, thickness = 1.5, closed = true) => {
  const limit = closed ? points.length : points.length - 1
  for (let i = 0; i < limit; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    line(a[0], a[1], b[0], b[1], color, thickness)
  }
}

const fillCircle = (cx, cy, radius, color, alpha = 0.25) => {
  const r = Math.ceil(radius)
  for (let yy = -r; yy <= r; yy += 1) {
    for (let xx = -r; xx <= r; xx += 1) {
      const d = Math.hypot(xx, yy)
      if (d <= radius) blend(cx + xx, cy + yy, color, alpha * (1 - d / (radius + 0.1)))
    }
  }
}

const iconCenter = (index) => {
  const col = index % columns
  const row = Math.floor(index / columns)
  return [col * cell + cell / 2, row * cell + cell / 2]
}

const starPoints = (cx, cy, points, outer, inner, rotation = 0) => Array.from({ length: points * 2 }, (_, i) => {
  const a = rotation + (i / (points * 2)) * TAU
  const r = i % 2 ? inner : outer
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
})

const ngon = (cx, cy, sides, radius, rotation = 0, inner = radius) => Array.from({ length: sides }, (_, i) => {
  const a = rotation + (i / sides) * TAU
  const r = i % 2 ? inner : radius
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
})

const base = (index, color) => {
  const [cx, cy] = iconCenter(index)
  fillCircle(cx, cy, 39, color, 0.06)
  arc(cx, cy, 40, 0.28, TAU - 0.28, color, 0.7)
  return [cx, cy]
}

const drawRelic = (index, color, variant) => {
  const c = rgba(color)
  const white = rgba('#d7fff7', 210)
  const [cx, cy] = base(index, c)
  if (variant === 0) {
    poly([[cx, cy - 27], [cx + 16, cy - 6], [cx + 8, cy + 26], [cx - 8, cy + 26], [cx - 16, cy - 6]], c, 1.8)
    line(cx - 9, cy - 2, cx + 9, cy - 2, white, 1.1)
  } else if (variant === 1) {
    arc(cx, cy, 24, 0, TAU, c, 1.8)
    line(cx - 24, cy, cx + 24, cy, white, 1.2)
    line(cx, cy - 24, cx, cy + 24, white, 1.2)
    dot(cx, cy, 8, c, 0.65)
  } else if (variant === 2) {
    arc(cx, cy, 25, 0, TAU, c, 2)
    arc(cx, cy, 15, 0, TAU, white, 1.2)
    line(cx - 10, cy, cx + 10, cy, c, 1.4)
  } else if (variant === 3) {
    poly([[cx, cy - 31], [cx + 18, cy + 9], [cx, cy + 28], [cx - 18, cy + 9]], c, 1.9)
    line(cx, cy - 31, cx, cy + 28, white, 1.1)
  } else if (variant === 4) {
    poly([[cx - 23, cy - 18], [cx + 23, cy - 18], [cx + 23, cy + 18], [cx - 23, cy + 18]], c, 1.9)
    line(cx - 16, cy - 5, cx + 16, cy - 5, white, 1.1)
    dot(cx, cy + 8, 4, c, 0.8)
  } else if (variant === 5) {
    arc(cx, cy + 10, 17, Math.PI * 0.08, Math.PI * 1.92, c, 1.8)
    line(cx, cy - 7, cx + 16, cy - 26, white, 1.1)
    line(cx, cy - 7, cx - 14, cy - 23, white, 1.1)
  } else if (variant === 6) {
    line(cx - 24, cy - 20, cx + 24, cy - 20, c, 1.7)
    line(cx - 24, cy + 20, cx + 24, cy + 20, c, 1.7)
    line(cx - 15, cy - 20, cx - 15, cy + 20, white, 1.1)
    line(cx + 15, cy - 20, cx + 15, cy + 20, white, 1.1)
    arc(cx, cy, 12, 0, TAU, c, 1.5)
  } else {
    poly([[cx - 24, cy - 21], [cx + 18, cy - 27], [cx + 24, cy + 22], [cx - 20, cy + 27]], c, 1.7)
    line(cx - 14, cy - 8, cx + 12, cy - 11, white, 1)
    line(cx - 12, cy + 5, cx + 14, cy + 2, white, 1)
  }
}

const drawSpaceEnemy = (index, kind, color) => {
  const c = rgba(color)
  const accent = rgba('#d7fff7', 210)
  const [cx, cy] = base(index, c)
  if (kind === 'chaser') poly(starPoints(cx, cy, 5, 27, 15, -0.2), c, 1.9)
  else if (kind === 'splinter') poly([[cx, cy - 29], [cx + 28, cy], [cx, cy + 29], [cx - 28, cy]], c, 1.9)
  else if (kind === 'lancer') poly([[cx + 34, cy], [cx - 25, cy - 17], [cx - 12, cy], [cx - 25, cy + 17]], c, 2)
  else if (kind === 'mine') poly(starPoints(cx, cy, 8, 29, 15, 0.1), c, 1.8)
  else if (kind === 'brute') poly(ngon(cx, cy, 8, 30, Math.PI / 8, 22), c, 2.4)
  else if (kind === 'shooter') {
    poly([[cx + 30, cy], [cx + 7, cy + 21], [cx - 25, cy + 13], [cx - 25, cy - 13], [cx + 7, cy - 21]], c, 2)
    arc(cx, cy, 10, 0, TAU, accent, 1.1)
  } else if (kind === 'warden') {
    poly(ngon(cx, cy, 9, 25, 0.05, 15), c, 1.9)
    arc(cx, cy, 36, 0, TAU, c, 1.6)
    line(cx - 28, cy, cx + 28, cy, accent, 1)
  } else if (kind === 'razor') {
    poly([[cx + 30, cy], [cx - 21, cy - 14], [cx - 9, cy], [cx - 21, cy + 14]], c, 1.8)
    poly([[cx - 13, cy - 6], [cx - 36, cy - 30], [cx - 25, cy - 4]], c, 1.4)
    poly([[cx - 13, cy + 6], [cx - 36, cy + 30], [cx - 25, cy + 4]], c, 1.4)
  } else if (kind === 'skimmer') {
    poly([[cx + 28, cy - 14], [cx - 5, cy - 31], [cx - 34, cy - 9], [cx - 22, cy + 19], [cx + 22, cy + 18]], c, 1.8)
    arc(cx - 2, cy + 5, 24, 0.15, Math.PI - 0.22, accent, 1)
  } else {
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU
      line(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, cx + Math.cos(a) * (i % 2 ? 34 : 29), cy + Math.sin(a) * (i % 2 ? 34 : 29), c, 1)
    }
    arc(cx, cy, 28, 0, TAU, c, 1.9)
    poly([[cx, cy - 17], [cx + 15, cy], [cx, cy + 17], [cx - 15, cy]], accent, 1.1)
  }
}

const drawSurfaceEnemy = (index, color, variant) => {
  const c = rgba(color)
  const accent = rgba('#fff27a', 210)
  const [cx, cy] = base(index, c)
  if (variant === 0) {
    poly(ngon(cx, cy, 7, 27, -0.2, 14), c, 1.8)
    line(cx - 17, cy + 15, cx - 32, cy + 28, accent, 1)
    line(cx + 17, cy + 15, cx + 32, cy + 28, accent, 1)
    line(cx - 17, cy - 15, cx - 32, cy - 27, accent, 1)
    line(cx + 17, cy - 15, cx + 32, cy - 27, accent, 1)
  } else if (variant === 1) {
    for (const [dx, dy, r] of [[-18, -9, 14], [15, -11, 12], [0, 13, 13]]) {
      poly(ngon(cx + dx, cy + dy, 6, r, 0.2, r * 0.55), c, 1.25)
      dot(cx + dx, cy + dy, 3, accent, 0.75)
    }
  } else if (variant === 2) {
    poly([[cx - 30, cy - 6], [cx - 10, cy - 23], [cx + 28, cy - 15], [cx + 19, cy + 16], [cx - 12, cy + 22]], c, 1.8)
    arc(cx + 3, cy + 1, 18, -1.9, 1.4, accent, 1)
    line(cx - 27, cy + 2, cx - 39, cy + 8, accent, 1)
  } else if (variant === 3) {
    poly([[cx, cy - 30], [cx + 24, cy - 3], [cx + 12, cy + 24], [cx - 12, cy + 24], [cx - 24, cy - 3]], c, 1.9)
    line(cx - 16, cy - 4, cx + 16, cy - 4, accent, 1)
    line(cx, cy - 22, cx, cy + 16, accent, 1)
  } else if (variant === 4) {
    poly([[cx, cy - 31], [cx + 22, cy - 2], [cx + 9, cy + 24], [cx - 11, cy + 23], [cx - 22, cy - 2]], c, 1.8)
    line(cx - 14, cy + 15, cx - 32, cy + 27, accent, 1)
    line(cx + 14, cy + 15, cx + 32, cy + 27, accent, 1)
    dot(cx, cy - 5, 5, accent, 0.65)
  } else if (variant === 5) {
    poly([[cx - 32, cy - 12], [cx - 6, cy - 30], [cx + 30, cy - 12], [cx + 20, cy + 18], [cx - 18, cy + 23]], c, 1.9)
    line(cx - 23, cy - 2, cx + 24, cy - 2, accent, 1)
    line(cx - 9, cy + 17, cx + 9, cy - 25, accent, 1)
  } else if (variant === 6) {
    poly(starPoints(cx, cy, 7, 31, 18, -0.1), c, 1.9)
    arc(cx, cy, 15, 0, TAU, accent, 1.1)
    line(cx - 30, cy + 25, cx + 30, cy + 25, accent, 1)
  } else if (variant === 7) {
    poly([[cx - 29, cy], [cx - 8, cy - 25], [cx + 25, cy - 16], [cx + 26, cy + 16], [cx - 8, cy + 25]], c, 1.9)
    arc(cx + 3, cy, 22, -1.3, 1.3, accent, 1)
    dot(cx + 12, cy, 4, accent, 0.8)
  } else if (variant === 8) {
    poly([[cx - 30, cy - 16], [cx, cy - 28], [cx + 30, cy - 16], [cx + 18, cy + 23], [cx - 18, cy + 23]], c, 1.9)
    line(cx - 31, cy - 16, cx - 42, cy - 27, accent, 1)
    line(cx + 31, cy - 16, cx + 42, cy - 27, accent, 1)
    arc(cx, cy + 2, 16, 0, TAU, accent, 1)
  } else {
    poly(ngon(cx, cy, 9, 28, 0.22, 15), c, 1.8)
    for (let i = 0; i < 3; i += 1) {
      const a = -0.7 + i * 0.7
      line(cx, cy, cx + Math.cos(a) * 33, cy + Math.sin(a) * 24, accent, 1)
    }
  }
}

const drawAlien = (index, color, variant) => {
  const c = rgba(color)
  const accent = rgba('#8fff7d', 210)
  const [cx, cy] = base(index, c)
  if (variant === 0) {
    arc(cx, cy - 18, 13, 0, TAU, c, 1.7)
    arc(cx, cy + 8, 18, 0, TAU, c, 1.7)
    poly([[cx - 7, cy - 35], [cx, cy - 48], [cx + 8, cy - 35]], accent, 1.1, false)
  } else if (variant === 1) {
    poly([[cx - 23, cy - 18], [cx, cy - 33], [cx + 23, cy - 18], [cx + 17, cy + 22], [cx - 17, cy + 22]], c, 1.8)
    line(cx - 29, cy - 34, cx + 29, cy - 34, accent, 1)
    for (let i = 0; i < 4; i += 1) line(cx - 22 + i * 15, cy - 34, cx - 18 + i * 12, cy - 25, accent, 0.8)
  } else if (variant === 2) {
    arc(cx, cy - 2, 27, 0, TAU, c, 1.9)
    arc(cx, cy - 2, 16, 0, TAU, accent, 1.2)
    dot(cx, cy - 2, 5, c, 0.75)
  } else if (variant === 3) {
    arc(cx, cy + 4, 19, 0, TAU, c, 1.7)
    poly(starPoints(cx, cy - 27, 5, 21, 8, -Math.PI / 2), accent, 1.2)
    line(cx - 25, cy + 25, cx + 25, cy + 25, c, 1.1)
  } else {
    poly([[cx, cy - 35], [cx + 21, cy - 8], [cx + 13, cy + 24], [cx - 13, cy + 24], [cx - 21, cy - 8]], c, 1.8)
    arc(cx, cy - 13, 20, Math.PI * 0.08, Math.PI * 0.92, accent, 1)
    poly([[cx, cy - 23], [cx + 10, cy - 9], [cx, cy + 5], [cx - 10, cy - 9]], accent, 1)
  }
  for (let i = 0; i < 3; i += 1) dot(cx + (i - 1) * 6, cy - 18 + Math.sin(variant + i) * 2, 1.8, accent, 0.65)
}

const drawLore = (index, color, variant) => {
  const c = rgba(color)
  const accent = rgba('#fff27a', 210)
  const [cx, cy] = base(index, c)
  if (variant === 0) {
    for (let i = 0; i < 5; i += 1) arc(cx + (i - 2) * 9, cy + Math.sin(i) * 4, 8, -1.1, 1.9, c, 1.1)
  } else if (variant === 1) {
    poly([[cx, cy - 31], [cx + 31, cy + 25], [cx - 31, cy + 25]], c, 1.9)
    line(cx - 14, cy + 2, cx + 14, cy + 2, accent, 1)
  } else if (variant === 2) {
    line(cx, cy - 30, cx, cy + 24, c, 2)
    line(cx - 18, cy - 10, cx + 18, cy - 10, c, 2)
    arc(cx, cy + 24, 19, Math.PI, TAU, accent, 1)
  } else if (variant === 3) {
    poly([[cx - 28, cy - 19], [cx + 28, cy - 19], [cx + 28, cy + 19], [cx - 28, cy + 19]], c, 1.7)
    line(cx - 25, cy - 22, cx + 25, cy + 22, accent, 1)
    line(cx + 25, cy - 22, cx - 25, cy + 22, accent, 1)
  } else {
    for (let i = 0; i < 4; i += 1) arc(cx, cy, 10 + i * 7, i * 0.45, Math.PI + i * 0.45, c, 1.2)
    dot(cx, cy, 4, accent, 0.8)
  }
}

const drawPlanet = (index, color, variant) => {
  const c = rgba(color)
  const accent = rgba('#d7fff7', 210)
  const [cx, cy] = base(index, c)
  arc(cx, cy, 27, 0, TAU, c, 1.9)
  arc(cx, cy + 1, 31, Math.PI * 0.08, Math.PI * 0.92, accent, 0.9)
  if (variant === 0) {
    poly([[cx - 13, cy - 8], [cx + 13, cy - 8], [cx + 13, cy + 10], [cx - 13, cy + 10]], accent, 1.2)
    line(cx - 13, cy + 1, cx + 13, cy + 1, accent, 0.9)
  } else if (variant === 1) {
    poly(starPoints(cx, cy, 8, 22, 10, 0.1), c, 1.5)
  } else if (variant === 2) {
    line(cx - 20, cy, cx + 20, cy, accent, 1.4)
    line(cx, cy - 19, cx, cy + 19, accent, 1.4)
  } else if (variant === 3) {
    poly([[cx, cy - 18], [cx + 15, cy], [cx, cy + 18], [cx - 15, cy]], accent, 1.2)
  } else if (variant === 4) {
    arc(cx, cy, 17, -0.7, TAU - 0.7, accent, 1.2)
    line(cx - 18, cy + 15, cx + 18, cy - 15, accent, 0.9)
  } else if (variant === 5) {
    line(cx - 15, cy - 12, cx + 15, cy + 12, accent, 1.2)
    line(cx - 16, cy + 12, cx + 16, cy - 12, accent, 1.2)
  } else {
    for (let i = 0; i < 7; i += 1) dot(cx + Math.cos(i * 1.55) * 16, cy + Math.sin(i * 1.55) * 12, 2.4, accent, 0.7)
  }
}

const drawCache = (index, color, variant) => {
  const c = rgba(color)
  const accent = rgba('#d7fff7', 210)
  const [cx, cy] = base(index, c)
  if (variant === 0) {
    poly([[cx - 26, cy - 16], [cx + 26, cy - 16], [cx + 26, cy + 19], [cx - 26, cy + 19]], c, 1.9)
    line(cx - 26, cy - 5, cx + 26, cy - 5, accent, 1)
    line(cx, cy - 16, cx, cy + 19, accent, 1)
  } else {
    poly([[cx, cy - 30], [cx + 28, cy - 8], [cx + 18, cy + 25], [cx - 18, cy + 25], [cx - 28, cy - 8]], c, 1.8)
    dot(cx, cy, 9, accent, 0.75)
    arc(cx, cy, 20, 0, TAU, c, 1)
  }
}

const relicColors = ['#fff27a', '#57fff3', '#ff9d5c', '#8fff7d', '#d7fff7', '#b990ff', '#70a8ff', '#ff61d8']
relicColors.forEach((color, index) => drawRelic(index, color, index))

const spaceEnemies = [
  ['chaser', '#8fff7d'],
  ['splinter', '#70a8ff'],
  ['lancer', '#fff27a'],
  ['mine', '#ff5d73'],
  ['brute', '#ff9d5c'],
  ['shooter', '#ff61d8'],
  ['warden', '#b990ff'],
  ['razor', '#57fff3'],
  ['skimmer', '#ffe66d'],
  ['bulwark', '#f46cff']
]
spaceEnemies.forEach(([kind, color], offset) => drawSpaceEnemy(8 + offset, kind, color))

const surfaceColors = ['#fff27a', '#ff5d73', '#ff61d8', '#ff5d73', '#57fff3', '#57fff3', '#fff27a', '#8fff7d', '#ff61d8', '#d7fff7']
surfaceColors.forEach((color, offset) => drawSurfaceEnemy(18 + offset, color, offset))

const alienColors = ['#b990ff', '#fff27a', '#57fff3', '#8fff7d', '#b990ff']
alienColors.forEach((color, offset) => drawAlien(28 + offset, color, offset))

const loreColors = ['#d7fff7', '#70a8ff', '#fff27a', '#70a8ff', '#d7fff7']
loreColors.forEach((color, offset) => drawLore(33 + offset, color, offset))

const planetColors = ['#57fff3', '#ff5d73', '#8fff7d', '#fff27a', '#b990ff', '#70a8ff', '#ff61d8']
planetColors.forEach((color, offset) => drawPlanet(38 + offset, color, offset))

drawCache(45, '#fff27a', 0)
drawCache(46, '#70a8ff', 1)

const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c >>> 0
}

const crc32 = (buffers) => {
  let c = 0xffffffff
  for (const buffer of buffers) {
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32([name, data]))
  return Buffer.concat([length, name, data, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(width, 0)
ihdr.writeUInt32BE(height, 4)
ihdr[8] = 8
ihdr[9] = 6
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const raw = Buffer.alloc((width * 4 + 1) * height)
for (let y = 0; y < height; y += 1) {
  const rowStart = y * (width * 4 + 1)
  raw[rowStart] = 0
  for (let x = 0; x < width * 4; x += 1) raw[rowStart + 1 + x] = Math.round(pixels[y * width * 4 + x])
}

writeFileSync(
  'src/assets/collection-icon-atlas.png',
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
)
