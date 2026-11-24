import { expect, test } from 'claude-code/testing'

import { DENY, touchesFlag } from '../hooks/register'

test('tool calls that name the flag are denied, others pass', async ($, on) => {
  on('tool.call', () => ({ result: {} }))

  const ok = { tool: 'Bash', tool_use_id: 't1', command: 'git status' } as const
  expect((await $.tool.call(ok)).deny).toBe(undefined)

  const sneaky = { tool: 'Bash', tool_use_id: 't2', command: 'touch ~/.claude/.git-yolo-abc' } as const
  expect((await $.tool.call(sneaky)).deny).toBe(DENY)
  expect(touchesFlag({ file_path: '/h/.claude/.git-yolo-x' })).toBe(true)
})
