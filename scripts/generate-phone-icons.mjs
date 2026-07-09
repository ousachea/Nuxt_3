#!/usr/bin/env node
// Generates PWA icons for khSIM / Cambodia Carrier Checker (no external deps — Node built-ins only)
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

// ── khSIM signal-bars icon ──────────────────────────────────────────────────
// Mirrors the ascending signal-strength bars used in the page's own checker UI.
const BG = [31, 42, 68] // #1F2A44 — the page's --accent
const BAR = [255, 255, 255]
const BAR_FRACTIONS = [0.34, 0.56, 0.78, 1.0]

function khsimIcon(x, y, size) {
    const barWidth = size * 0.09
    const gap = size * 0.06
    const totalWidth = 4 * barWidth + 3 * gap
    const startX = (size - totalWidth) / 2
    const baseline = size * 0.72
    const maxHeight = size * 0.46

    for (let i = 0; i < 4; i++) {
        const left = startX + i * (barWidth + gap)
        const right = left + barWidth
        const top = baseline - maxHeight * BAR_FRACTIONS[i]
        if (x >= left && x < right && y >= top && y < baseline) {
            return BAR
        }
    }

    return BG
}

// ── Generate ─────────────────────────────────────────────────────────────────
mkdirSync('./public/icons', { recursive: true })

const targets = [
    { size: 192, name: 'phone-icon-192' },
    { size: 512, name: 'phone-icon-512' },
    { size: 180, name: 'phone-apple-touch-icon' },
]

for (const { size, name } of targets) {
    const buf = createPNG(size, khsimIcon)
    writeFileSync(`./public/icons/${name}.png`, buf)
    console.log(`✓ public/icons/${name}.png  (${size}×${size}, ${(buf.length / 1024).toFixed(1)} KB)`)
}

console.log('\nkhSIM PWA icons ready.')
