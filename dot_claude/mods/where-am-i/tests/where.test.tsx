import { describe, expect, test } from 'claude-code/testing'

import { parseWhere, promptFor, settled } from '../hooks/register'

// The test environment has the web timer; the mod's lib (es2023, no DOM) does not declare it.
declare const setTimeout: (callback: () => void, ms: number) => unknown

describe('helpers', () => {
  test('parses JSON from the reply, clips long fields', () => {
    expect(parseWhere('Sure: {"goal":"ship mods","doing":"tests","waiting":"","next":"commit"}')).toEqual({
      goal: 'ship mods',
      doing: 'tests',
      waiting: '',
      next: 'commit',
    })
    expect(parseWhere(`{"goal":"${'x'.repeat(100)}"}`)?.goal.length).toBe(70)
    expect(parseWhere('no json')).toBeNull()
    expect(parseWhere('{"goal":""}')).toBeNull()
  })

  test('prompt lists recent messages and the answer', () => {
    const text = promptFor(['a  b', 'c'], 'answer')
    expect(text).toContain('- a b')
    expect(text).toContain("Assistant's last reply:\nanswer")
  })
})

test('after a main-loop turn the summary is stored; subagent turns are ignored', async ($, on) => {
  const asked: string[] = []
  on('model.complete', ($, e) => {
    asked.push(typeof e.prompt === 'string' ? e.prompt : '')
    return { value: { isAnswered: true, text: '{"goal":"Build where-am-i","doing":"writing tests","waiting":"pick a model","next":"run tests"}', usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  const stored: unknown[] = []
  on('state.set', ($, e, next) => {
    if (e.key === 'where') stored.push(e.value)
    return next(e)
  })

  await $.prompt.submit({ text: 'udělej where am i', origin: { kind: 'composer' }, wait: false })
  await $.turn.complete({ answer: 'Subagent says hi', durationMs: 1, isAborted: false, turnId: 's', agentId: 'sub' } as never)
  await settled()
  expect(asked).toEqual([])

  await $.turn.complete({ answer: 'Writing the mod now.', durationMs: 1, isAborted: false, turnId: 't' } as never)
  await settled()
  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('udělej where am i')

  // The summary is written after the turn hook returns; the engine's copy of
  // the module runs it, so wait for the write rather than this module's promise.
  for (let i = 0; i < 100 && stored.length === 0; i++) await new Promise(resolve => setTimeout(() => resolve(undefined), 5))
  expect(stored).toEqual([{ goal: 'Build where-am-i', doing: 'writing tests', waiting: 'pick a model', next: 'run tests' }])
})
