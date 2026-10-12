// Pure helpers: tags in the draft, thumbnail size, BMP pixels to Raster cells.
const DEFAULT = 0x01000000
const HALF_TOP = 0x2580

// Larger than a glance: in a multiplexer this is the only picture there is.
export const MAX_COLUMNS = 48
export const MAX_ROWS = 16

export const tagsOf = (draft: string) =>
  [...new Set([...draft.matchAll(/\[Image #(\d+)\]/g)].map(match => Number(match[1])))].sort((a, b) => a - b)

// Width and height in pixels for a thumbnail that keeps the aspect ratio; a
// cell is two pixels tall, so the pixel height is even.
export const thumbSize = (width: number, height: number) => {
  const byWidth = { w: MAX_COLUMNS, h: Math.round((MAX_COLUMNS * height) / width) }
  const fit = byWidth.h <= MAX_ROWS * 2 ? byWidth : { w: Math.max(1, Math.round((MAX_ROWS * 2 * width) / height)), h: MAX_ROWS * 2 }
  return { w: fit.w, h: Math.max(2, fit.h + (fit.h % 2)) }
}

const u16 = (b: Uint8Array, o: number) => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8)
const i32 = (b: Uint8Array, o: number) => (b[o] ?? 0) | ((b[o + 1] ?? 0) << 8) | ((b[o + 2] ?? 0) << 16) | ((b[o + 3] ?? 0) << 24)

// Reads an uncompressed 24- or 32-bit BMP (what `sips -s format bmp` writes)
// into 0xRRGGBB pixels, top row first.
export const bmpPixels = (b: Uint8Array) => {
  if (b[0] !== 0x42 || b[1] !== 0x4d) throw new Error('not a BMP')
  const offset = i32(b, 10)
  const width = i32(b, 18)
  const rawHeight = i32(b, 22)
  const bpp = u16(b, 28)
  if (bpp !== 24 && bpp !== 32) throw new Error(`unsupported BMP depth ${bpp}`)
  const height = Math.abs(rawHeight)
  const stride = Math.ceil((width * bpp) / 32) * 4
  const pixels: number[] = []
  for (let y = 0; y < height; y++) {
    const row = rawHeight > 0 ? height - 1 - y : y
    for (let x = 0; x < width; x++) {
      const at = offset + row * stride + x * (bpp / 8)
      pixels.push(((b[at + 2] ?? 0) << 16) | ((b[at + 1] ?? 0) << 8) | (b[at] ?? 0))
    }
  }
  return { width, height, pixels }
}

const toBase64 = (bytes: Uint8Array) => {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text)
}

export const fromBase64 = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0))

export const rasterOf = ({ width, height, pixels }: { width: number; height: number; pixels: number[] }) => {
  const rows = Math.floor(height / 2)
  const words = new Uint32Array(width * rows * 3)
  for (let row = 0; row < rows; row++) {
    for (let x = 0; x < width; x++) {
      const i = (row * width + x) * 3
      words.set([HALF_TOP, pixels[row * 2 * width + x] ?? DEFAULT, pixels[(row * 2 + 1) * width + x] ?? DEFAULT], i)
    }
  }
  return { columns: width, rows, cells: toBase64(new Uint8Array(words.buffer)) }
}

// Terminal cells are about twice as tall as wide, so a picture `columns` wide
// keeps its aspect at about half as many rows per pixel ratio.
export const IMAGE_COLUMNS = 48
export const imageRowsOf = (width: number, height: number) =>
  Math.max(2, Math.min(24, Math.round((IMAGE_COLUMNS * height) / width / 2)))

// Same signals Claude Code and kitty-aware tools use; CLAUDE_CODE_FORCE_TERMINAL_IMAGES wins.
// Multiplexers pass TERM_PROGRAM through but drop the graphics. herdr's
// `[experimental] kitty_graphics` alone is not enough: Claude Code still draws
// no pictures inside it (seen with herdr 0.8.0), so only the force flag counts.
export const herdrDrawsKitty = (config: string) => /^\s*kitty_graphics\s*=\s*true\b/m.test(config)

export const drawsPictures = (env: {
  force?: string
  program?: string
  kitty?: string
  tmux?: string
  herdr?: string
  herdrKitty?: boolean
}) => {
  if (env.force !== undefined) return env.force !== '0' && env.force !== ''
  if (env.tmux || env.herdr) return false
  return Boolean(env.kitty) || /^(ghostty|kitty|wezterm)$/i.test(env.program ?? '')
}
