import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Thumb } from '../types'
import { IMAGE_COLUMNS, bmpPixels, drawsPictures, fromBase64, herdrDrawsKitty, imageRowsOf, rasterOf, tagsOf, thumbSize } from './thumb'

const thumbs = atom({ plugin: 'image-view', key: 'thumbs' } as const, [])
const gallery = atom({ plugin: 'image-view', key: 'gallery' } as const, [])
// Each thumb carries a ~0.5 MB PNG; keep only the latest few for hover cards.
const GALLERY_SIZE = 8

// Claude Code keeps pastes at <tmp>/claude-<uid>/<project slug>/<session>/images/<N>.<ext>.
// That layout is an internal of Claude Code; when it moves, thumbnails just stop.
const imageDir = async ($: EngineInterface) => {
  const base = (await $.env.get('CLAUDE_CODE_TMPDIR')) ?? `/private/tmp/claude-${(await $.process.run(['id', '-u'])).stdout.trim()}`
  const slug = (await $.session.cwd()).replace(/[/.]/g, '-')
  return `${base}/${slug}/${await $.session.id()}/images`
}

const findImage = async ($: EngineInterface, dir: string, tag: number) => {
  if (!(await $.fs.exists(dir))) return null
  const hit = (await $.fs.list(dir)).find(entry => entry.kind === 'file' && entry.name.startsWith(`${tag}.`))
  return hit ? `${dir}/${hit.name}` : null
}

const makeThumb = async ($: EngineInterface, source: string, tag: number): Promise<Thumb | null> => {
  const dims = (await $.process.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', source])).stdout
  const width = Number(dims.match(/pixelWidth:\s*(\d+)/)?.[1])
  const height = Number(dims.match(/pixelHeight:\s*(\d+)/)?.[1])
  if (!width || !height) return null

  const size = thumbSize(width, height)
  const tmp = ((await $.env.get('TMPDIR')) ?? '/tmp').replace(/\/$/, '')
  const out = `${tmp}/claude-image-view-${await $.session.id()}-${tag}.bmp`
  const converted = await $.process.run(['sips', '-s', 'format', 'bmp', '-z', String(size.h), String(size.w), source, '--out', out])
  if (converted.exitCode !== 0) return null

  const bytes = await $.fs.read(out, { as: 'bytes' })
  const png = `${tmp}/claude-image-view-${await $.session.id()}-${tag}.png`
  await $.process.run(['sips', '-s', 'format', 'png', '-Z', '640', source, '--out', png])
  const pngBytes = await $.fs.read(png, { as: 'bytes' })
  await $.process.run(['rm', '-f', out, png])
  return {
    tag,
    ...rasterOf(bmpPixels(fromBase64(bytes.base64))),
    png: pngBytes.base64,
    imageColumns: IMAGE_COLUMNS,
    imageRows: imageRowsOf(width, height),
  }
}

// The image file lands in the cache a moment after its tag reaches the draft,
// so a tag without a file is retried for a few seconds.
// herdr reads its config once at server start, so one read per load is enough.
let herdrKitty: Promise<boolean> | undefined
const readHerdrKitty = async ($: EngineInterface) => {
  const home = (await $.env.get('HOME')) ?? ''
  const config = `${(await $.env.get('XDG_CONFIG_HOME')) ?? `${home}/.config`}/herdr/config.toml`
  return (await $.fs.exists(config)) ? herdrDrawsKitty(String(await $.fs.read(config))) : false
}

const picturesOn = async ($: EngineInterface) =>
  drawsPictures({
    force: await $.env.get('CLAUDE_CODE_FORCE_TERMINAL_IMAGES'),
    program: await $.env.get('TERM_PROGRAM'),
    kitty: await $.env.get('KITTY_WINDOW_ID'),
    tmux: await $.env.get('TMUX'),
    herdr: await $.env.get('HERDR_ENV'),
    herdrKitty: await (herdrKitty ??= readHerdrKitty($)),
  })

const RETRY_MS = 300
const RETRIES = 10

const refresh = async ($: EngineInterface, attempt = 0): Promise<void> => {
  const tags = tagsOf((await $.prompt.read()).text)
  const known = await read($, thumbs)
  const kept = known.filter(one => tags.includes(one.tag))
  const missing = tags.filter(tag => !kept.some(one => one.tag === tag))
  if (missing.length === 0 && kept.length === known.length) return

  const dir = await imageDir($)
  const made: Thumb[] = []
  for (const tag of missing) {
    const source = await findImage($, dir, tag)
    const thumb = source ? await makeThumb($, source, tag).catch(() => null) : null
    if (thumb) made.push(thumb)
  }
  await update($, thumbs, () => [...kept, ...made].sort((a, b) => a.tag - b.tag))
  if (made.length > 0) {
    await update($, gallery, all =>
      [...all.filter(one => !made.some(fresh => fresh.tag === one.tag)), ...made].slice(-GALLERY_SIZE),
    )
  }
  if (made.length < missing.length && attempt < RETRIES) {
    $.clock.after(RETRY_MS, () => void refresh($, attempt + 1))
  }
}

export const register: Register = on => {
  on('prompt.edit', async ($, e, next) => {
    const box = await next(e)
    await refresh($)
    return box
  })

  // A draft put back whole (history, another plugin) can carry image tags too.
  on('prompt.fill', async ($, e, next) => {
    const filled = await next(e)
    if (filled.isFilled) await refresh($)
    return filled
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, thumbs, () => [])
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt', surface: 'terminal' }, async ($, e, next) => {
    const below = await next(e)
    const shown = await read($, thumbs)
    if (e.props.hasSurvey || shown.length === 0) return below

    const { Box, Image, Raster, Text } = $.ui.resolve(e)
    const pictures = await picturesOn($)
    return (
      <Box flexDirection="column">
        {below}
        <Box gap={2}>
          {shown.map(one => (
            <Box key={`thumb-${one.tag}`} flexDirection="column">
              {pictures ? (
                <Image key={`image-${one.tag}`} source={{ png: one.png }} columns={one.imageColumns} rows={one.imageRows} alt={`[Image #${one.tag}]`} />
              ) : (
                <Raster key={`image-${one.tag}`} columns={one.columns} rows={one.rows} cells={one.cells} />
              )}
              <Text dimColor>#{one.tag}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })

  // Sent messages: a small `▣ #N` mark per pasted image; hovering it reveals
  // the picture in a card painted over the rows above, without reflow.
  on('ui.render', { component: 'UserMessage', surface: 'terminal' }, async ($, e, next) => {
    const row = await next(e)
    const tags = tagsOf(e.props.text)
    if (tags.length === 0) return row
    const known = (await read($, gallery)).filter(one => tags.includes(one.tag))
    if (known.length === 0) return row

    const { Box, Image, Raster, Text } = $.ui.resolve(e)
    const pictures = await picturesOn($)
    return (
      <Box flexDirection="column">
        {row}
        <Box gap={2} paddingX={2}>
          {known.map(one => {
            const rows = pictures ? one.imageRows : one.rows
            return (
              <Box key={`image-hover-${one.tag}`}>
                <Text color="suggestion" hover={{ bold: true }}>▣ #{one.tag}</Text>
                <Box
                  position="absolute"
                  top={-(rows + 2)}
                  left={0}
                  display="none"
                  hover={{ display: 'flex' }}
                  borderStyle="round"
                  borderColor="suggestion"
                >
                  {pictures ? (
                    <Image source={{ png: one.png }} columns={one.imageColumns} rows={one.imageRows} alt={`[Image #${one.tag}]`} />
                  ) : (
                    <Raster key={`hover-raster-${one.tag}`} columns={one.columns} rows={one.rows} cells={one.cells} />
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}
