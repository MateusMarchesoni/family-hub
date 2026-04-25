/**
 * Generates pwa-192x192.png and pwa-512x512.png in public/
 * Pure Node.js – no extra dependencies needed.
 * Icon: indigo-600 (#4F46E5) background + white house silhouette.
 */
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── CRC32 (required by PNG format) ──────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// ── Icon drawing ─────────────────────────────────────────────────────────────
function createIcon(size) {
  // RGBA pixel buffer – fill with indigo #4F46E5
  const px = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    px[i * 4]     = 0x4F
    px[i * 4 + 1] = 0x46
    px[i * 4 + 2] = 0xE5
    px[i * 4 + 3] = 0xFF
  }

  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255
  }

  function fillRect(x0, y0, w, h, r, g, b) {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        setPixel(x, y, r, g, b)
  }

  const pad  = Math.round(size * 0.18)
  const hW   = size - pad * 2        // house total width
  const cx   = Math.round(size / 2)

  // Walls – bottom portion of house
  const wallH = Math.round(hW * 0.44)
  const wallY = size - pad - wallH
  fillRect(Math.round(cx - hW / 2), wallY, hW, wallH, 255, 255, 255)

  // Door – indigo cutout centred on wall bottom
  const doorW = Math.round(hW * 0.28)
  const doorH = Math.round(wallH * 0.56)
  fillRect(Math.round(cx - doorW / 2), wallY + wallH - doorH, doorW, doorH, 0x4F, 0x46, 0xE5)

  // Roof – triangle, scan-line filled
  const roofH    = Math.round(hW * 0.40)
  const overhang = Math.round(size * 0.05)
  for (let y = wallY - roofH; y < wallY; y++) {
    const t     = (y - (wallY - roofH)) / roofH
    const halfW = Math.round(t * (hW / 2 + overhang))
    fillRect(cx - halfW, y, halfW * 2, 1, 255, 255, 255)
  }

  // Chimney
  const chimneyW = Math.round(hW * 0.10)
  const chimneyH = Math.round(hW * 0.18)
  const chimneyX = Math.round(cx + hW * 0.12)
  fillRect(chimneyX, wallY - roofH - chimneyH + Math.round(roofH * 0.35), chimneyW, chimneyH, 255, 255, 255)

  // ── Encode as PNG ──────────────────────────────────────────────────────────
  // Each PNG row: 1 filter byte (0 = None) + RGBA pixels
  const rows = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 4)] = 0  // filter = None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * (1 + size * 4) + 1 + x * 4
      rows[dst]     = px[src]
      rows[dst + 1] = px[src + 1]
      rows[dst + 2] = px[src + 2]
      rows[dst + 3] = px[src + 3]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // colour type: RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(rows)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write files ───────────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, '..', 'public')
for (const size of [192, 512]) {
  const outPath = path.join(publicDir, `pwa-${size}x${size}.png`)
  fs.writeFileSync(outPath, createIcon(size))
  console.log(`✓ ${outPath}`)
}
