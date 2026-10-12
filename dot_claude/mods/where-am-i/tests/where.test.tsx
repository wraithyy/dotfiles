import { describe, expect, test } from 'claude-code/testing'

import { parseWhere, promptFor, settled } from '../hooks/register'

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

const props = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 6,
  bodyColumns: 120,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

test('after a main-loop turn the band shows the summary; subagent turns are ignored', async ($, on) => {
  const asked: string[] = []
  on('model.complete', ($, e) => {
    asked.push(typeof e.prompt === 'string' ? e.prompt : '')
    return { value: { isAnswered: true, text: '{"goal":"Build where-am-i","doing":"writing tests","waiting":"pick a model","next":"run tests"}', usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }
  })
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  await $.prompt.submit({ text: 'udělej where am i', origin: { kind: 'composer' }, wait: false })
  await $.turn.complete({ answer: 'Subagent says hi', durationMs: 1, isAborted: false, turnId: 's', agentId: 'sub' } as never)
  await settled()
  expect(asked).toEqual([])

  await $.turn.complete({ answer: 'Writing the mod now.', durationMs: 1, isAborted: false, turnId: 't' } as never)
  await settled()
  expect(asked.length).toBe(1)
  expect(asked[0]).toContain('udělej where am i')

  const ui = await $.ui.mount({ plugin: 'where-am-i', surface: 'terminal', component: 'AbovePrompt', props })
  expect(await ui.find({ type: 'Text', text: 'Build where-am-i' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '⏳ pick a model' })).toBeDefined()
  await ui.unmount()
})
