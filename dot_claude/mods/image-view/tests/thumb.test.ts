import { describe, expect, test } from 'claude-code/testing'

import { bmpPixels, drawsPictures, herdrDrawsKitty, imageRowsOf, rasterOf, tagsOf, thumbSize } from '../hooks/thumb'

// A 2x2 bottom-up 24-bit BMP: top row red, green; bottom row blue, white.
const bmp = () => {
  const stride = 8
  const b = new Uint8Array(54 + stride * 2)
  b.set([0x42, 0x4d], 0)
  b.set([54, 0, 0, 0], 10)
  b.set([2, 0, 0, 0], 18)
  b.set([2, 0, 0, 0], 22)
  b.set([24, 0], 28)
  b.set([255, 0, 0, 255, 255, 255], 54) // bottom row: blue, white (BGR)
  b.set([0, 0, 255, 0, 255, 0], 54 + stride) // top row: red, green
  return b
}

describe('image-view helpers', () => {
  test('tags in the draft, deduplicated and sorted', () => {
    expect(tagsOf('look [Image #2] and [Image #1] and [Image #2]')).toEqual([1, 2])
    expect(tagsOf('no images')).toEqual([])
  })

  test('thumbnail keeps aspect within 48x16 cells', () => {
    expect(thumbSize(2000, 1334)).toEqual({ w: 48, h: 32 })
    expect(thumbSize(1000, 3000)).toEqual({ w: 11, h: 32 })
    expect(thumbSize(3000, 300)).toEqual({ w: 48, h: 6 })
  })

  test('reads a bottom-up BMP top row first', () => {
    expect(bmpPixels(bmp())).toEqual({ width: 2, height: 2, pixels: [0xff0000, 0x00ff00, 0x0000ff, 0xffffff] })
  })

  test('two pixel rows become one row of half-block cells', () => {
    const raster = rasterOf(bmpPixels(bmp()))
    expect(raster.columns).toBe(2)
    expect(raster.rows).toBe(1)
    const words = new Uint32Array(Uint8Array.from(atob(raster.cells), c => c.charCodeAt(0)).buffer)
    expect([...words]).toEqual([0x2580, 0xff0000, 0x0000ff, 0x2580, 0x00ff00, 0xffffff])
  })

  test('picture size and when the terminal draws pictures', () => {
    expect(imageRowsOf(2000, 1334)).toBe(16)
    expect(drawsPictures({ program: 'ghostty' })).toBe(true)
    expect(drawsPictures({ program: 'ghostty', tmux: '/tmp/x' })).toBe(false)
    expect(drawsPictures({ program: 'ghostty', herdr: '1' })).toBe(false)
    expect(drawsPictures({ program: 'ghostty', herdr: '1', herdrKitty: true })).toBe(false)
    expect(drawsPictures({ program: 'ghostty', herdr: '1', force: '1' })).toBe(true)
    expect(herdrDrawsKitty('[experimental]\nkitty_graphics = true\n')).toBe(true)
    expect(herdrDrawsKitty('# kitty_graphics = true\n')).toBe(false)
    expect(herdrDrawsKitty('kitty_graphics = false')).toBe(false)
    expect(drawsPictures({ program: 'Apple_Terminal' })).toBe(false)
    expect(drawsPictures({ program: 'Apple_Terminal', force: '1' })).toBe(true)
    expect(drawsPictures({ program: 'ghostty', force: '0' })).toBe(false)
  })
})
