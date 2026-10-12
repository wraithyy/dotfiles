import { describe, expect, mock, test } from 'claude-code/testing'

import { levelOf, nextLevel, switchAction } from '../hooks/register'

const props = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 4,
  bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

describe('levels', () => {
  test('cycle and parse', () => {
    expect(nextLevel('off')).toBe('lite')
    expect(nextLevel('ultra')).toBe('off')
    expect(levelOf('full\n')).toBe('full')
    expect(levelOf(null)).toBe('off')
    expect(levelOf('wenyan')).toBe('full')
  })

  test('prompts the plugins understand', () => {
    expect(switchAction('caveman', 'lite')).toEqual({ kind: 'command', command: 'caveman:caveman', args: 'lite' })
    expect(switchAction('ponytail', 'off')).toEqual({ kind: 'prompt', text: 'stop ponytail' })
  })
})

test('badge shows state; rapid presses apply only the last pick, once', async ($, on) => {
  const clock = mock.clock(on)
  const files: Record<string, string> = {
    '/h/.claude/.i-have-adhd-always': '',
    '/h/.claude/.caveman-active': 'full',
    '/h/.config/caveman/config.json': '{ "hideStatus": true }',
  }
  const sent: string[] = []
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? '/h' : undefined }))
  on('fs.exists', ($, e) => ({ value: e.path in files }))
  on('fs.read', ($, e) => ({ value: files[e.path] ?? '' }))
  on('fs.write', ($, e) => {
    files[e.path] = e.text
    return { value: undefined }
  })
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  on('command.run', ($, e) => {
    sent.push(`/${e.command} ${e.args}`)
    return { text: 'ok' }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  const ui = await $.ui.mount({ plugin: 'mode-toggles', surface: 'terminal', component: 'AbovePrompt', props })
  expect(await ui.find({ type: 'Text', text: ' adhd' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' full' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' ○' })).toBeDefined()

  await ui.press({ key: 'toggle-caveman' })
  expect(sent).toEqual([])
  expect(await ui.find({ type: 'Text', text: ' ultra…' })).toBeDefined()
  await ui.press({ key: 'toggle-caveman' })
  await ui.press({ key: 'toggle-caveman' })
  expect(await ui.find({ type: 'Text', text: ' lite…' })).toBeDefined()
  expect(sent).toEqual([])

  await clock.advance(1999)
  expect(sent).toEqual([])
  await clock.advance(1)
  expect(sent).toEqual(['/caveman:caveman lite'])
  expect(files['/h/.claude/.caveman-active']).toBe('lite')
  expect(JSON.parse(files['/h/.config/caveman/config.json'] ?? '{}')).toEqual({ hideStatus: true, defaultMode: 'lite' })
  await ui.unmount()
})
