import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { levelOf, nextLevel, switchAction } from '../hooks/modes'

describe('helpers', () => {
  test('levels cycle and parse', () => {
    expect(nextLevel('off')).toBe('lite')
    expect(nextLevel('ultra')).toBe('off')
    expect(levelOf('full\n')).toBe('full')
    expect(levelOf(null)).toBe('off')
    expect(levelOf('wenyan')).toBe('full')
  })

  test('actions the plugins understand', () => {
    expect(switchAction('caveman', 'lite')).toEqual({ kind: 'command', command: 'caveman:caveman', args: 'lite' })
    expect(switchAction('ponytail', 'off')).toEqual({ kind: 'prompt', text: 'stop ponytail' })
  })

})

const props = {
  hasSurvey: false,
  isWorking: true,
  maxRows: 8,
  bodyColumns: 140,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const
const BAND = { plugin: 'hud', surface: 'terminal', component: 'AbovePrompt', props } as const

type World = { model: string; state: Record<string, unknown>; files: Record<string, string>; live: string[]; env?: Record<string, string> }

// Stands in for the engine and the other mods: their state, the flag files,
// the session model and the agent list.
const world = (on: On, w: World) => {
  const sent: string[] = []
  on('state.get', ($, e, next) => {
    const key = `${e.plugin}.${e.key}`
    return key in w.state ? { value: { value: w.state[key], version: 1 } } : next(e)
  })
  on('session.model', () => ({ value: w.model }))
  on('session.id', () => ({ value: 's1' }))
  on('agent.list', () => ({
    value: w.live.map(id => ({ id, description: '', type: 'explorer', status: 'running' as const })),
  }))
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? '/h' : w.env?.[e.name] }))
  on('fs.exists', ($, e) => ({ value: e.path in w.files }))
  on('fs.read', ($, e) => ({ value: w.files[e.path] ?? '' }))
  on('fs.write', ($, e) => {
    w.files[e.path] = e.text
    return { value: undefined }
  })
  on('command.run', ($, e) => {
    sent.push(`/${e.command} ${e.args}`)
    return { text: 'ok' }
  })
  on('prompt.submit', ($, e) => {
    sent.push(e.text)
    return { text: e.text }
  })
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  return sent
}

test('one compact row: where-am-i on the left, mode chips on the right, nothing else', async ($, on) => {
  const w: World = {
    model: 'claude-opus-5-5',
    state: {
      'where-am-i.where': { goal: 'Organize the band', doing: 'writing hud', waiting: 'pick a layout', next: 'test it' },
      'run-timer.running': [{ id: 'r1', label: 'pnpm test', startedAt: 0 }],
      'agents.tracked': [{ id: 'a1', type: 'security-reviewer', model: 'claude-sonnet-5-5', startedAt: 0, usd: 0 }],
    },
    files: { '/h/.claude/.i-have-adhd-always': '', '/h/.claude/.caveman-active': 'lite' },
    live: ['a1'],
  }
  world(on, w)

  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: 'Organize the band' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: ' · ! pick a layout' })).toBeDefined()
  expect(await ui.find({ key: 'toggle-adhd' })).toBeDefined()
  expect(await ui.find({ key: 'toggle-yolo' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'lite' })).toBeDefined()
  // Only modes that are on get the green dot, so on/off reads at a glance.
  expect(await ui.find({ type: 'Text', text: '●' })).toBeDefined()
  // Model, run timer and subagents are Claude Code's own to show.
  expect(await ui.find({ type: 'Text', text: 'opus' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'pnpm test' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'security-reviewer' })).toBeUndefined()
  await ui.unmount()
})

test('inside herdr the where-am-i text is left to the halo layout', async ($, on) => {
  const w: World = {
    model: 'claude-opus-5-5',
    state: { 'where-am-i.where': { goal: 'Organize the band', doing: '', waiting: '', next: '' } },
    files: {},
    live: [],
    env: { HC_TERMINAL_ID: 't1' },
  }
  world(on, w)
  const ui = await $.ui.mount(BAND)
  expect(await ui.find({ type: 'Text', text: 'Organize the band' })).toBeUndefined()
  expect(await ui.find({ key: 'toggle-caveman' })).toBeDefined()
  await ui.unmount()
})

test('rapid caveman presses apply only the last pick, once', async ($, on) => {
  const clock = mock.clock(on)
  const w: World = {
    model: 'claude-opus-5-5',
    state: {},
    files: { '/h/.claude/.caveman-active': 'full', '/h/.config/caveman/config.json': '{ "hideStatus": true }' },
    live: [],
  }
  const sent = world(on, w)

  const ui = await $.ui.mount(BAND)
  await ui.press({ key: 'toggle-caveman' })
  await ui.press({ key: 'toggle-caveman' })
  await ui.press({ key: 'toggle-caveman' })
  expect(sent).toEqual([])
  await clock.advance(2000)
  expect(sent).toEqual(['/caveman:caveman lite'])
  expect(w.files['/h/.claude/.caveman-active']).toBe('lite')
  expect(JSON.parse(w.files['/h/.config/caveman/config.json'] ?? '{}')).toEqual({ hideStatus: true, defaultMode: 'lite' })
  await ui.unmount()
})
