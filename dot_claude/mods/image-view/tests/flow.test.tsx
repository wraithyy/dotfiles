import { expect, mock, test } from 'claude-code/testing'

// A 2x2 top-down 24-bit BMP, all one colour: what `sips -s format bmp` writes.
const bmp = () => {
  const b = new Uint8Array(54 + 16)
  b.set([0x42, 0x4d], 0)
  b.set([54, 0, 0, 0], 10)
  b.set([2, 0, 0, 0], 18)
  b.set([0xfe, 0xff, 0xff, 0xff], 22)
  b.set([24, 0], 28)
  b.fill(0x80, 54)
  return b
}
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))

const bandProps = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

test('pasted image: thumbnail above the prompt, then a hover card on the sent message', async ($, on) => {
  mock.clock(on)
  let draft = 'see [Image #1]'
  on('prompt.read', () => ({ value: { text: draft, cursor: draft.length } }))
  on('prompt.fill', () => ({ isFilled: true }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('session.cwd', () => ({ value: '/Users/me/proj' }))
  on('session.id', () => ({ value: 'sess' }))
  on('env.get', ($, e) => ({ value: ({ HOME: '/Users/me', TMPDIR: '/tmp/', HERDR_ENV: '1' } as Record<string, string>)[e.name] }))
  on('fs.exists', ($, e) => ({ value: e.path.endsWith('/images') }))
  on('fs.list', () => ({ value: [{ name: '1.jpg', kind: 'file', size: 1, mtimeMs: 1, isLink: false }] }))
  on('fs.read', () => ({ value: { base64: toBase64(bmp()) } }))
  on('process.run', ($, e) => ({
    value: {
      exitCode: 0,
      stdout: e.argv[0] === 'id' ? '501\n' : e.argv.includes('-g') ? 'pixelWidth: 2000\npixelHeight: 1334\n' : '',
      stderr: '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('ui.render', { component: 'UserMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.text}</Text>
  })

  await $.prompt.fill({ text: draft, mode: 'replace', origin: { kind: 'engine' } })

  const band = await $.ui.mount({ plugin: 'image-view', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
  expect(await band.find({ type: 'Raster', key: 'image-1' })).toBeDefined()
  await band.unmount()

  draft = ''
  await $.prompt.submit({ text: 'see [Image #1]', origin: { kind: 'composer' }, wait: false })
  const empty = await $.ui.mount({ plugin: 'image-view', surface: 'terminal', component: 'AbovePrompt', props: bandProps })
  expect(await empty.find({ type: 'Raster', key: 'image-1' })).toBeUndefined()
  await empty.unmount()

  const message = await $.ui.mount({
    plugin: 'image-view',
    surface: 'terminal',
    component: 'UserMessage',
    props: { text: 'see [Image #1]', origin: { kind: 'composer' }, isExpanded: false } as never,
  })
  expect(await message.find({ type: 'Text', text: '▣ #1' })).toBeDefined()
  expect(await message.find({ type: 'Raster', key: 'hover-raster-1' })).toBeDefined()
  await message.unmount()
})
