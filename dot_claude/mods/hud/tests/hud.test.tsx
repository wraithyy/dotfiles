import { describe, expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { clockOf, isExpensive, levelOf, nextLevel, prettyModel, switchAction } from '../hooks/modes'

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

  test('model names and clock', () => {
    expect(prettyModel('claude-fable-5-1')).toBe('Fable 5.1')
    expect(prettyModel('claude-opus-5-5')).toBe('opus')
    expect(isExpensive('Fable 5.1')).toBe(true)
    expect(isExpensive('claude-sonnet-5-5')).toBe(false)
    expect(clockOf(84_000)).toBe('1:24')
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

type World = { model: string; state: Record<string, unknown>; files: Record<string, string>; live: string[] }

// Stands in for the engine and the other mods: their state, the flag files,
// the session model and the agent list.
const world = (on: On, w: World) => {
  const sent: string[] = []
  on('state.get', ($, e, next) => {
    const key = `${e.plugin}.${e.key}`
    return key in w.state ? { value: { value: w.state[key], version: 1 } } : next(e)
  })
  on('session.model', () => ({ value: w.model }))
  on('agent.list', () => ({
    value: w.live.map(id => ({ id, description: '', type: 'explorer', status: 'running' as const })),
  }))
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? '/h' : undefined }))
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

test('one band: where-am-i, mode chips, model, and an activity row only while something runs', async ($, on) => {
  const clock = mock.clock(on)
  await clock.set(100_000)
  const w: World = {
    model: 'claude-opus-5-5',
    state: {
      'where-am-i.where': { goal: 'Organize the band', doing: 'writing hud', waiting: 'pick a layout', next: 'test it' },
    },
    files: { '/h/.claude/.i-have-adhd-always': '', '/h/.claude/.caveman-active': 'lite' },
    live: [],
  }
  world(on, w)

  const quiet = await $.ui.mount(BAND)
  expect(await quiet.find({ type: 'Text', text: 'Organize the band' })).toBeDefined()
  expect(await quiet.find({ type: 'Text', text: '⏳ pick a layout' })).toBeDefined()
  expect(await quiet.find({ key: 'toggle-adhd' })).toBeDefined()
  expect(await quiet.find({ type: 'Text', text: 'lite' })).toBeDefined()
  expect(await quiet.find({ type: 'Text', text: 'opus' })).toBeDefined()
  expect(await quiet.find({ key: 'back-opusplan' })).toBeUndefined()
  expect(await quiet.find({ type: 'Text', text: '/subagents' })).toBeUndefined()
  await quiet.unmount()

  w.model = 'claude-fable-5-1'
  w.live = ['a1']
  w.state['agents.tracked'] = [{ id: 'a1', type: 'security-reviewer', model: 'claude-sonnet-5-5', startedAt: 78_000, usd: 0 }]
  const busy = await $.ui.mount(BAND)
  expect(await busy.find({ key: 'back-opusplan' })).toBeDefined()
  expect(await busy.find({ type: 'Text', text: '/subagents' })).toBeDefined()
  await busy.unmount()
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
