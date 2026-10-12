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

// The hud mod draws these values; here the writes themselves are checked.
const captureWrites = (on: On) => {
  const writes: Array<{ key: string; value: unknown }> = []
  on('state.set', ($, e, next) => {
    writes.push({ key: e.key, value: e.value })
    return next(e)
  })
  return writes
}

test('a long command is listed while it runs, then kept as the last failure with its exit code', async ($, on) => {
  const clock = mock.clock(on)
  const writes = captureWrites(on)
  let finish: () => void = () => {}
  on('tool.call', { tool: 'Bash' }, () =>
    new Promise(resolve => {
      finish = () => resolve({ result: { stdout: '', stderr: 'FAIL', interrupted: false }, isError: true, text: 'Exit code 1\nFAIL' })
    }),
  )

  const call = $.tool.call({ tool: 'Bash', command: 'pnpm test', description: 'Run tests' })
  await clock.advance(84_000)
  const listed = writes.find(one => one.key === 'running' && JSON.stringify(one.value).includes('Run tests'))
  expect(listed).toBeDefined()

  finish()
  await call
  const last = writes.filter(one => one.key === 'last').at(-1)?.value
  expect(last).toEqual({ label: 'Run tests', isOk: false, exitCode: 1, ms: 84_000 })
  expect(writes.filter(one => one.key === 'running').at(-1)?.value).toEqual([])
})

test('a quick command leaves no last result', async ($, on) => {
  mock.clock(on)
  const writes = captureWrites(on)
  on('tool.call', { tool: 'Bash' }, () => ({ result: { stdout: 'a', stderr: '', interrupted: false } }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(writes.some(one => one.key === 'last')).toBe(false)
})
