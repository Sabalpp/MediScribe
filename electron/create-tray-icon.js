/**
 * Generates tray icon PNGs for macOS/Windows/Linux.
 * Run once: node electron/create-tray-icon.js
 *
 * Creates:
 *   electron/assets/tray-iconTemplate.png   (macOS menu bar, 22x22 monochrome)
 *   electron/assets/tray-iconTemplate@2x.png (macOS Retina, 44x44)
 *   electron/assets/tray-icon.png           (Windows/Linux, 32x32)
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
  const png = concatBuffers([signature, ihdr, idat, iend])
  return Buffer.from(png)
}

function createIHDR(w, h) {
  const data = new Uint8Array(13)
  const view = new DataView(data.buffer)
  view.setUint32(0, w)
  view.setUint32(4, h)
  data[8] = 8   // bit depth
  data[9] = 6   // RGBA
  data[10] = 0  // compression
  data[11] = 0  // filter
  data[12] = 0  // interlace
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
    raw[y * rowLen] = 0 // no filter
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
    header[1] = slice.length & 0xff
    header[2] = (slice.length >> 8) & 0xff
    header[3] = ~slice.length & 0xff
    header[4] = (~slice.length >> 8) & 0xff
    blocks.push(header, slice)
  }

  const adler = adler32(raw)
  const adlerBytes = new Uint8Array(4)
  new DataView(adlerBytes.buffer).setUint32(0, adler)

  return concatBuffers([new Uint8Array([0x78, 0x01]), ...blocks, adlerBytes])
}

function adler32(data) {
  let a = 1, b = 0
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521
    b = (b + a) % 65521
  }
  return (b << 16) | a
}

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c
}

function crc32(data) {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function concatBuffers(buffers) {
  const total = buffers.reduce((s, b) => s + b.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const b of buffers) { out.set(b, off); off += b.length }
  return out
}

function drawMediScribeIcon(pixels, w, h) {
  const cx = w / 2, cy = h / 2, r = w * 0.38

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const i = (y * w + x) * 4

      // Circle outline
      if (Math.abs(dist - r) < 1.2) {
        const alpha = Math.max(0, 1 - Math.abs(dist - r) / 1.2)
        pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0
        pixels[i + 3] = Math.round(alpha * 255)
      }

      // Cross (medical) inside circle
      const crossW = w * 0.08
      const crossH = w * 0.28
      const inVertical = Math.abs(dx) <= crossW && Math.abs(dy) <= crossH
      const inHorizontal = Math.abs(dy) <= crossW && Math.abs(dx) <= crossH
      if ((inVertical || inHorizontal) && dist < r - 1) {
        pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 220
      }
    }
  }
}

function drawBadgeIcon(pixels, w, h) {
  drawMediScribeIcon(pixels, w, h)
  const bx = w * 0.75, by = h * 0.2, br = w * 0.14
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - bx, dy = y - by
      if (Math.sqrt(dx * dx + dy * dy) <= br) {
        const i = (y * w + x) * 4
        pixels[i] = 220; pixels[i + 1] = 50; pixels[i + 2] = 50; pixels[i + 3] = 255
      }
    }
  }
}

// macOS template icons (monochrome, Template suffix triggers auto light/dark)
writeFileSync(join(ASSETS, 'tray-iconTemplate.png'), createPNG(22, 22, drawMediScribeIcon))
writeFileSync(join(ASSETS, 'tray-iconTemplate@2x.png'), createPNG(44, 44, drawMediScribeIcon))

// Windows/Linux tray icon
writeFileSync(join(ASSETS, 'tray-icon.png'), createPNG(32, 32, drawMediScribeIcon))

// Badge variant (red dot for notifications)
writeFileSync(join(ASSETS, 'tray-icon-badge.png'), createPNG(32, 32, drawBadgeIcon))
writeFileSync(join(ASSETS, 'tray-icon-badgeTemplate.png'), createPNG(22, 22, drawBadgeIcon))
writeFileSync(join(ASSETS, 'tray-icon-badgeTemplate@2x.png'), createPNG(44, 44, drawBadgeIcon))

console.log('Tray icons created in electron/assets/')
