import { describe, expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { DENY, parseFlag } from '../hooks/register'

describe('flag', () => {
  test('parses what /away writes, and a bare touch', () => {
    expect(parseFlag(null)).toBe(null)
    expect(parseFlag('{"since":5,"amphetamine":true}\n')).toEqual({ since: 5, amphetamine: true })
    expect(parseFlag('')).toEqual({ since: 0, amphetamine: false })
  })
})

const fakeFs = (on: On, files: Record<string, string>) => {
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? '/h' : undefined }))
  on('fs.exists', ($, e) => ({ value: e.path in files }))
  on('fs.read', ($, e) => ({ value: files[e.path] ?? '' }))
}

test('tool calls pass while present and are denied while away', async ($, on) => {
  const files: Record<string, string> = {}
  fakeFs(on, files)
  on('tool.call', () => ({ result: {} }))

  const call = { tool: 'Bash', tool_use_id: 't1', command: 'ls' } as const
  expect((await $.tool.call(call)).deny).toBe(undefined)

  files['/h/.claude/.away'] = '{"since":1,"amphetamine":false}'
  expect((await $.tool.call({ ...call, tool_use_id: 't2' })).deny).toBe(DENY)
})
