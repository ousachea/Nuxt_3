#!/usr/bin/env node
// Generates PWA icons for Gold Tracker (no external deps — uses Node built-ins only)
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

// ── CRC32 ────────────────────────────────────────────────────────────────────
const crcTable = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
        let c = i
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
        t[i] = c
    }
    return t
})()

function crc32(buf) {
    let crc = 0xFFFFFFFF
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii')
    const lenBuf = Buffer.allocUnsafe(4)
    lenBuf.writeUInt32BE(data.length, 0)
    const crcBuf = Buffer.allocUnsafe(4)
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function createPNG(size, getPixel) {
    const ihdr = Buffer.allocUnsafe(13)
    ihdr.writeUInt32BE(size, 0)
    ihdr.writeUInt32BE(size, 4)
    ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

    const raw = Buffer.allocUnsafe(size * (1 + size * 3))
    for (let y = 0; y < size; y++) {
        const row = y * (1 + size * 3)
        raw[row] = 0
        for (let x = 0; x < size; x++) {
            const [r, g, b] = getPixel(x, y, size)
            const p = row + 1 + x * 3
            raw[p] = r; raw[p + 1] = g; raw[p + 2] = b
        }
    }

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', deflateSync(raw, { level: 9 })),
        pngChunk('IEND', Buffer.alloc(0)),
    ])
}

// ── Gold ◈ diamond icon ───────────────────────────────────────────────────────
function goldDiamond(x, y, size) {
    const cx = size / 2, cy = size / 2
    const r = size * 0.38
    const nx = (x - cx) / r, ny = (y - cy) / r
    const d = Math.abs(nx) + Math.abs(ny)

    // Background
    if (d > 1.05) return [12, 12, 18]

    // Outer diamond soft edge
    if (d > 0.92) {
        const a = (1.05 - d) / 0.13
        return [Math.round(12 + 233 * a), Math.round(12 + 188 * a), Math.round(18 + 48 * a)]
    }

    // Inner hollow (small diamond hole)
    if (d < 0.39) return [12, 12, 18]

    if (d < 0.51) {
        const a = (d - 0.39) / 0.12
        return [Math.round(12 + 233 * a), Math.round(12 + 188 * a), Math.round(18 + 48 * a)]
    }

    // Gold petals with subtle gradient
    const light = 1 + (-nx - ny) * 0.1
    return [
        Math.min(255, Math.round(245 * light)),
        Math.min(255, Math.round(200 * light)),
        Math.min(255, Math.round(66 * light * 0.85)),
    ]
}

// ── Generate ─────────────────────────────────────────────────────────────────
mkdirSync('./public/icons', { recursive: true })

const targets = [
    { size: 192, name: 'icon-192' },
    { size: 512, name: 'icon-512' },
    { size: 180, name: 'apple-touch-icon' },
]

for (const { size, name } of targets) {
    const buf = createPNG(size, goldDiamond)
    writeFileSync(`./public/icons/${name}.png`, buf)
    console.log(`✓ public/icons/${name}.png  (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)`)
}

console.log('\nAll PWA icons ready.')
