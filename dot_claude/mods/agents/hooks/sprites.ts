// Clawd, 14x8 pixels, drawn with half blocks: one cell = two stacked pixels,
// so a sprite is 14 columns by 4 rows. Accessory layers paint over the body.
const W = 14
const H = 8
const DEFAULT = 0x01000000
const HALF_TOP = 0x2580
const HALF_BOTTOM = 0x2584

const PALETTE: Record<string, number> = {
  o: 0xd97757, // body
  k: 0x1f1f1f, // eyes, ink
  g: 0x9e9e9e, // metal frames
  c: 0x9fd3ef, // glass
  w: 0x6d4c41, // wood
  r: 0xc2185b, // beret
  b: 0x1e4fa3, // cap
  y: 0xf2c230, // hard hat, pencil
  s: 0x2e7d32, // goggles
  p: 0xf8bbd0, // eraser
}

// Tall two-pixel eyes on rows 3-4, as the Clawd mascot has.
const BODY = [
  '..............',
  '..............',
  '..oooooooooo..',
  '..okooooooko..',
  '..okooooooko..',
  'oooooooooooooo',
  '..oooooooooo..',
  '..o.o....o.o..',
]

const ACCESSORIES: Record<string, string[]> = {
  magnifier: [
    '...........gg.',
    '..........gccg',
    '..........gccg',
    '...........gg.',
    '..........w...',
    '.........w....',
    '..............',
    '..............',
  ],
  beret: [
    '.....r........',
    '...rrrrrrr....',
    '..rrrrrrrrrr..',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  glasses: [
    '..............',
    '..............',
    '..............',
    '..gkggggggkg..',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  cap: [
    '......yy......',
    '...bbbbbbbb...',
    '..bbbbbbbbbbb.',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  hardhat: [
    '..............',
    '....yyyyyy....',
    '..yyyyyyyyyy..',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  goggles: [
    '..............',
    '..............',
    '.ssssssssssss.',
    '.sscsssssscss.',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
  pencil: [
    '............p.',
    '...........y..',
    '..........y...',
    '.........k....',
    '..............',
    '..............',
    '..............',
    '..............',
  ],
}

// Agent type -> accessory; matched as a substring so plugin-prefixed types
// (`ui-craft:designer`) and built-ins (`Explore`) both land.
const BY_TYPE: ReadonlyArray<[RegExp, string]> = [
  [/explor/i, 'magnifier'],
  [/design|ui|css|craft/i, 'beret'],
  [/secur/i, 'cap'],
  [/review/i, 'glasses'],
  [/architect|plan/i, 'hardhat'],
  [/tdd|test/i, 'goggles'],
  [/doc|writer|analyst/i, 'pencil'],
]

export const accessoryOf = (type: string) => BY_TYPE.find(([match]) => match.test(type))?.[1] ?? null

// Frame tweaks over BODY: legs step, arms wave, eyes blink. A finished agent
// stands still with half-shut eyes (only the lower eye pixel stays).
const LEGS_STEP = '...o.o..o.o...'
const ARMS_UP_ROW4 = 'o.okooooooko.o'
const ARMS_UP_ROW5 = '..oooooooooo..'
const shut = (row: string) => row.replaceAll('k', 'o')

export type Pose = { frame: number; isLive: boolean }

export const bodyFor = ({ frame, isLive }: Pose): string[] => {
  const body = [...BODY]
  if (!isLive) {
    body[3] = shut(body[3] ?? '')
    return body
  }
  if (frame % 2 === 1) body[7] = LEGS_STEP
  if (frame % 4 === 2) {
    body[4] = ARMS_UP_ROW4
    body[5] = ARMS_UP_ROW5
  }
  if (frame % 12 === 5) {
    body[3] = shut(body[3] ?? '')
    body[4] = shut(body[4] ?? '')
  }
  return body
}

export const pixelsOf = (type: string, pose: Pose = { frame: 0, isLive: true }): number[] => {
  const accessory = accessoryOf(type)
  const body = bodyFor(pose)
  const layers = accessory ? [body, ACCESSORIES[accessory] ?? []] : [body]
  const pixels: number[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let color = DEFAULT
      for (const layer of layers) {
        const ch = layer[y]?.[x] ?? '.'
        const painted = PALETTE[ch]
        if (painted !== undefined) color = painted
      }
      pixels.push(color)
    }
  }
  return pixels
}

const toBase64 = (bytes: Uint8Array) => {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text)
}

export const SPRITE_COLUMNS = W
export const SPRITE_ROWS = H / 2

export const spriteCells = (type: string, pose?: Pose) => {
  const pixels = pixelsOf(type, pose)
  const words = new Uint32Array(W * (H / 2) * 3)
  for (let row = 0; row < H / 2; row++) {
    for (let x = 0; x < W; x++) {
      const top = pixels[row * 2 * W + x] ?? DEFAULT
      const bottom = pixels[(row * 2 + 1) * W + x] ?? DEFAULT
      const i = (row * W + x) * 3
      // Only painted halves may carry a colour: a half-block's foreground is
      // never left at the default, which terminals draw as white text colour.
      if (top === DEFAULT && bottom === DEFAULT) {
        words.set([0x20, DEFAULT, DEFAULT], i)
      } else if (top === DEFAULT) {
        words.set([HALF_BOTTOM, bottom, DEFAULT], i)
      } else {
        words.set([HALF_TOP, top, bottom], i)
      }
    }
  }
  return toBase64(new Uint8Array(words.buffer))
}
