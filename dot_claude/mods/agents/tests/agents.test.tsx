import { describe, expect, mock, test } from 'claude-code/testing'

import { clockOf, costOf, isShown, KEEP_FINISHED_MS, shortModel } from '../hooks/register'

const usage = { input_tokens: 1_000_000, output_tokens: 100_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

describe('helpers', () => {
  test('cost by model tier', () => {
    expect(Math.round(costOf('claude-sonnet-5-5', usage) * 100) / 100).toBe(3)
    expect(Math.round(costOf('claude-fable-5-1', usage) * 100) / 100).toBe(15)
    expect(Math.round(costOf('claude-sonnet-5-5', { ...usage, input_tokens: 0, cache_read_input_tokens: 1_000_000, output_tokens: 0 }) * 100) / 100).toBe(0.2)
    expect(costOf('mystery', usage)).toBe(0)
  })

  test('finished agents drop out of the pane after ten minutes', () => {
    const agent = { id: 'a', description: '', type: 'explorer', model: 'sonnet', startedAt: 0, lastAt: 1_000, usd: 0 }
    expect(isShown(agent, new Set(), 1_000 + KEEP_FINISHED_MS - 1)).toBe(true)
    expect(isShown(agent, new Set(), 1_000 + KEEP_FINISHED_MS)).toBe(false)
    expect(isShown(agent, new Set(['a']), 1_000 + KEEP_FINISHED_MS * 5)).toBe(true)
  })

  test('labels', () => {
    expect(shortModel('claude-haiku-4-5')).toBe('haiku')
    expect(clockOf(65_000)).toBe('1:05')
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

test('a running subagent shows in the band with its type, model and time', async ($, on) => {
  const clock = mock.clock(on)
  let status: 'running' | 'completed' = 'running'
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('agent.spawn', () => ({ model: 'claude-sonnet-5-5', agentId: 'a1' }))
  on('agent.list', () => ({ value: [{ id: 'a1', description: 'scan', type: 'explorer', status }] }))

  await $.agent.spawn({
    tool_use_id: 't1',
    prompt: 'scan repo',
    description: 'scan',
    subagentType: 'explorer',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: false,
    fork: false,
  })
  await clock.advance(42_000)

  const band = { plugin: 'agents', surface: 'terminal', component: 'AbovePrompt', props } as const
  const ui = await $.ui.mount(band)
  expect(await ui.find({ type: 'Text', text: /1 agent/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /explorer sonnet 0:42/ })).toBeDefined()
  await ui.unmount()

  status = 'completed'
  const after = await $.ui.mount(band)
  expect(await after.find({ type: 'Text', text: /agent/ })).toBeUndefined()
  await after.unmount()
})

import { accessoryOf, bodyFor, pixelsOf, spriteCells } from '../hooks/sprites'

describe('sprites', () => {
  test('accessory per agent type', () => {
    expect(accessoryOf('Explore')).toBe('magnifier')
    expect(accessoryOf('explorer')).toBe('magnifier')
    expect(accessoryOf('ui-craft:designer')).toBe('beret')
    expect(accessoryOf('code-reviewer')).toBe('glasses')
    expect(accessoryOf('security-reviewer')).toBe('cap')
    expect(accessoryOf('architect')).toBe('hardhat')
    expect(accessoryOf('general-purpose')).toBeNull()
  })

  test('frames: legs step, arms wave, blink; finished agent sleeps still', () => {
    const still = bodyFor({ frame: 0, isLive: true })
    expect(bodyFor({ frame: 1, isLive: true })[7]).not.toBe(still[7])
    expect(bodyFor({ frame: 2, isLive: true })[5]).not.toBe(still[5])
    expect(bodyFor({ frame: 5, isLive: true }).join('')).not.toContain('k')
    expect(bodyFor({ frame: 1, isLive: false })[3]).not.toContain('k')
    expect(bodyFor({ frame: 1, isLive: false })[4]).toContain('k')
    expect(bodyFor({ frame: 1, isLive: false })[7]).toBe(still[7])
    for (let frame = 0; frame < 12; frame++) {
      for (const row of bodyFor({ frame, isLive: true })) expect(row.length).toBe(14)
    }
  })

  test('no half-block is drawn in the default foreground colour', () => {
    for (const type of ['explorer', 'designer', 'architect', 'general-purpose']) {
      const words = new Uint32Array(Uint8Array.from(atob(spriteCells(type)), c => c.charCodeAt(0)).buffer)
      for (let i = 0; i < words.length; i += 3) {
        if (words[i] !== 0x20) expect(words[i + 1]).not.toBe(0x01000000)
      }
    }
  })

  test('sprite is 14x8 pixels and encodes 14x4 cells', () => {
    expect(pixelsOf('explorer').length).toBe(14 * 8)
    expect(atob(spriteCells('explorer')).length).toBe(14 * 4 * 3 * 4)
  })
})

test('pane draws a sprite per agent and the engine accepts the cells', async ($, on) => {
  mock.clock(on)
  on('agent.spawn', ($, e) => ({ model: 'claude-sonnet-5-5', agentId: e.subagentType }))
  on('agent.list', () => ({ value: [{ id: 'explorer', description: 'scan', type: 'explorer', status: 'running' }] }))
  for (const subagentType of ['explorer', 'code-reviewer']) {
    await $.agent.spawn({
      tool_use_id: subagentType,
      prompt: 'p',
      description: `job ${subagentType}`,
      subagentType,
      provider: { plugin: 'engine', tier: 'core' },
      parentModel: 'claude-opus-5-5',
      background: true,
      fork: false,
    })
  }
  const ui = await $.ui.mount({ plugin: 'agents', surface: 'terminal', component: 'Pane', requestId: 'agents', props: {} as never })
  expect(await ui.find({ type: 'Raster', key: 'sprite-explorer' })).toBeDefined()
  expect(await ui.find({ type: 'Raster', key: 'sprite-code-reviewer' })).toBeDefined()
  expect(await ui.find({ key: 'stop-explorer' })).toBeDefined()
  expect(await ui.find({ key: 'stop-code-reviewer' })).toBeUndefined()
  await ui.unmount()
})
