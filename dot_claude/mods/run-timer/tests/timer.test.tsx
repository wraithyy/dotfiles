import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { clockOf, exitCodeOf, labelOf } from '../hooks/register'

describe('helpers', () => {
  test('clock, label, exit code', () => {
    expect(clockOf(84_000)).toBe('1:24')
    expect(clockOf(5_400)).toBe('0:05')
    expect(labelOf('pnpm   test', 'Run unit tests')).toBe('Run unit tests')
    expect(labelOf('x'.repeat(60)).length).toBe(48)
    expect(exitCodeOf(true, 'Exit code 2\nFAIL src/a.test.ts')).toBe(2)
    expect(exitCodeOf(true, 'boom')).toBeNull()
    expect(exitCodeOf(false, 'ok')).toBe(0)
    expect(exitCodeOf(true, 'FAIL\nchild exit code 1\nExit code 7')).toBeNull()
  })
})

const props = {
  hasSurvey: false,
  isWorking: true,
  maxRows: 4,
  bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const
const BAND = { plugin: 'run-timer', surface: 'terminal', component: 'AbovePrompt', props } as const

const engineBand = (on: On) =>
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

test('a long command shows a live row, then its failure with exit code', async ($, on) => {
  const clock = mock.clock(on)
  engineBand(on)
  let finish: () => void = () => {}
  on('tool.call', { tool: 'Bash' }, () =>
    new Promise(resolve => {
      finish = () => resolve({ result: { stdout: '', stderr: 'FAIL', interrupted: false }, isError: true, text: 'Exit code 1\nFAIL' })
    }),
  )

  const call = $.tool.call({ tool: 'Bash', command: 'pnpm test', description: 'Run tests' })
  await clock.advance(84_000)

  const live = await $.ui.mount(BAND)
  expect(await live.find({ type: 'Text', text: 'Run tests' })).toBeDefined()
  expect(await live.find({ type: 'Text', text: /1:24/ })).toBeDefined()
  await live.unmount()

  finish()
  await call
  const done = await $.ui.mount(BAND)
  expect(await done.find({ type: 'Text', text: '✗' })).toBeDefined()
  expect(await done.find({ type: 'Text', text: /exit 1/ })).toBeDefined()
  await done.unmount()
})

test('a quick command leaves no row', async ($, on) => {
  mock.clock(on)
  engineBand(on)
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: 'a', stderr: '', interrupted: false } }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: /ls/ })).toBeUndefined()
  await ui.unmount()
})
