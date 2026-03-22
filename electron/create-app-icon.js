/**
 * Generates a 512x512 app icon PNG for electron-builder.
 * Run once: node electron/create-app-icon.js
 *
 * electron-builder will auto-convert icon.png → .icns (macOS) and .ico (Windows).
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(__dirname, 'assets')

function createPNG(width, height, drawFn) {
  const pixels = new Uint8Array(width * height * 4)
  drawFn(pixels, width, height)
  const rawData = deflateRaw(pixels, width, height)
  const ihdr = createIHDR(width, height)
  const idat = createChunk('IDAT', rawData)
  const iend = createChunk('IEND', new Uint8Array(0))
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.from(concatBuffers([signature, ihdr, idat, iend]))
}

function createIHDR(w, h) {
  const data = new Uint8Array(13)
  const view = new DataView(data.buffer)
  view.setUint32(0, w); view.setUint32(4, h)
  data[8] = 8; data[9] = 6; data[10] = 0; data[11] = 0; data[12] = 0
  return createChunk('IHDR', data)
}

function createChunk(type, data) {
  const typeBytes = new TextEncoder().encode(type)
  const len = new Uint8Array(4)
  new DataView(len.buffer).setUint32(0, data.length)
  const crcInput = concatBuffers([typeBytes, data])
  const crc = crc32(crcInput)
  const crcBytes = new Uint8Array(4)
  new DataView(crcBytes.buffer).setUint32(0, crc)
  return concatBuffers([len, typeBytes, data, crcBytes])
}

function deflateRaw(pixels, w, h) {
  const rowLen = w * 4 + 1
  const raw = new Uint8Array(h * rowLen)
  for (let y = 0; y < h; y++) {
    raw[y * rowLen] = 0
    raw.set(pixels.subarray(y * w * 4, (y + 1) * w * 4), y * rowLen + 1)
  }
  const blocks = []
  const BLOCK = 65535
  for (let i = 0; i < raw.length; i += BLOCK) {
    const end = Math.min(i + BLOCK, raw.length)
    const last = end === raw.length ? 1 : 0
    const slice = raw.subarray(i, end)
    const header = new Uint8Array(5)
    header[0] = last
    header[1] = slice.length & 0xff; header[2] = (slice.length >> 8) & 0xff
    header[3] = ~slice.length & 0xff; header[4] = (~slice.length >> 8) & 0xff
    blocks.push(header, slice)
  }
  const adler = adler32(raw)
  const adlerBytes = new Uint8Array(4)
  new DataView(adlerBytes.buffer).setUint32(0, adler)
  return concatBuffers([new Uint8Array([0x78, 0x01]), ...blocks, adlerBytes])
}

function adler32(data) {
  let a = 1, b = 0
  for (let i = 0; i < data.length; i++) { a = (a + data[i]) % 65521; b = (b + a) % 65521 }
  return (b << 16) | a
}

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC_TABLE[n] = c
}
function crc32(data) {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function concatBuffers(buffers) {
  const total = buffers.reduce((s, b) => s + b.length, 0)
  const out = new Uint8Array(total); let off = 0
  for (const b of buffers) { out.set(b, off); off += b.length }
  return out
}

function drawAppIcon(pixels, w, h) {
  const cx = w / 2, cy = h / 2

  // Background: rounded rectangle fill with gradient-like blue
  const cornerR = w * 0.18
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (isInsideRoundedRect(x, y, 0, 0, w, h, cornerR)) {
        const t = y / h
        const r = Math.round(0 + t * 10)
        const g = Math.round(71 - t * 20)
        const b2 = Math.round(141 + t * 30)
        pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b2; pixels[i + 3] = 255
      }
    }
  }

  // Medical cross (white)
  const crossW = w * 0.09
  const crossH = w * 0.30
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      const inV = Math.abs(dx) <= crossW && Math.abs(dy) <= crossH
      const inH = Math.abs(dy) <= crossW && Math.abs(dx) <= crossH
      if (inV || inH) {
        const i = (y * w + x) * 4
        pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255; pixels[i + 3] = 240
      }
    }
  }

  // Circle around cross (white outline)
  const r = w * 0.35
  const thickness = w * 0.025
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (Math.abs(dist - r) < thickness) {
        const alpha = Math.max(0, 1 - Math.abs(dist - r) / thickness)
        const i = (y * w + x) * 4
        const a = Math.round(alpha * 200)
        pixels[i] = 255; pixels[i + 1] = 255; pixels[i + 2] = 255
        pixels[i + 3] = Math.max(pixels[i + 3], a)
      }
    }
  }
}

function isInsideRoundedRect(px, py, rx, ry, rw, rh, radius) {
  if (px < rx || px >= rx + rw || py < ry || py >= ry + rh) return false
  const dx = Math.max(rx + radius - px, 0, px - (rx + rw - radius))
  const dy = Math.max(ry + radius - py, 0, py - (ry + rh - radius))
  return dx * dx + dy * dy <= radius * radius
}

writeFileSync(join(ASSETS, 'icon.png'), createPNG(512, 512, drawAppIcon))
console.log('App icon created: electron/assets/icon.png (512x512)')
