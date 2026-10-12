import { atom, read, update } from 'claude-code'
import type { AgentInfo, EngineInterface, ModelUsage, Register } from 'claude-code'

import type { TrackedAgent } from '../types'
import { SPRITE_COLUMNS, SPRITE_ROWS, spriteCells } from './sprites'

const PANE = 'agents'
const tracked = atom({ plugin: 'agents', key: 'tracked' } as const, [])

// USD per million tokens, input / output; cache reads bill at 0.1x input,
// cache writes at 1.25x. Mirrors rules/performance.md.
const PRICES = [
  { match: /fable/i, input: 10, output: 50 },
  { match: /opus/i, input: 5, output: 25 },
  { match: /sonnet/i, input: 2, output: 10 },
  { match: /haiku/i, input: 1, output: 5 },
] as const

export const costOf = (model: string, usage: ModelUsage) => {
  const price = PRICES.find(one => one.match.test(model))
  if (!price) return 0
  const input =
    usage.input_tokens + usage.cache_read_input_tokens * 0.1 + usage.cache_creation_input_tokens * 1.25
  return (input * price.input + usage.output_tokens * price.output) / 1_000_000
}

export const shortModel = (model: string) => model.match(/fable|opus|sonnet|haiku/i)?.[0]?.toLowerCase() ?? model

export const clockOf = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const LIVE = new Set<AgentInfo['status']>(['pending', 'running', 'waiting'])

const liveIds = async ($: EngineInterface) =>
  new Set((await $.agent.list()).filter(agent => LIVE.has(agent.status)).map(agent => agent.id))

let tick: { cancel: () => void } | undefined
// Faster redraw while the pane is open, so the sprites move.
let animation: { cancel: () => void } | undefined
const FRAME_MS = 350
// A finished agent leaves the pane this long after its last turn.
export const KEEP_FINISHED_MS = 10 * 60 * 1000

export const isShown = (agent: TrackedAgent, live: ReadonlySet<string>, now: number) =>
  live.has(agent.id) || now - agent.lastAt < KEEP_FINISHED_MS

// Stops the clock once no agent runs, so an idle session does not redraw
// every second. Read-only: a render hook may not write state.
const settle = async ($: EngineInterface) => {
  const live = await liveIds($)
  const now = await $.clock.now()
  if (live.size === 0) {
    tick?.cancel()
    tick = undefined
    animation?.cancel()
    animation = undefined
  }
  return { live, now }
}

// The hud mod draws the live-agent row; this mod keeps `tracked` and the pane.
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'subagents', description: 'Show subagents of this session with time, cost and stop buttons' })
    return next(e)
  })

  on('command.run', { command: 'subagents' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Agents', focus: true, closeOnEscape: true })
    animation ??= $.clock.every(FRAME_MS, () => $.ui.invalidate('ui.render'))
    return { text: 'Agents pane opened.' }
  })

  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)
    if (spawned.deny !== undefined || !spawned.agentId) return spawned

    const agent: TrackedAgent = {
      id: spawned.agentId,
      description: e.description,
      type: e.subagentType,
      model: spawned.model,
      startedAt: await $.clock.now(),
      lastAt: await $.clock.now(),
      usd: 0,
    }
    await update($, tracked, list => [...list, agent].slice(-50))
    tick ??= $.clock.every(1000, () => $.ui.invalidate('ui.render'))
    if ((await $.ui.panes()).some(pane => pane.id === PANE)) {
      animation ??= $.clock.every(FRAME_MS, () => $.ui.invalidate('ui.render'))
    }
    return spawned
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    animation?.cancel()
    animation = undefined
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { agentId, usage } = e
    if (agentId && usage) {
      const usd = costOf(usage.model, usage)
      const now = await $.clock.now()
      await update($, tracked, list =>
        list.map(one => (one.id === agentId ? { ...one, usd: one.usd + usd, lastAt: now } : one)),
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE, surface: 'terminal' }, async ($, e) => {
    const { Box, Button, Raster, Text } = $.ui.resolve(e)
    const { live, now } = await settle($)
    const all = await read($, tracked)
    const list = all.filter(one => isShown(one, live, now)).reverse()
    const total = all.reduce((sum, one) => sum + one.usd, 0)
    const hidden = all.length - list.length
    const summary = `session total $${total.toFixed(2)}${hidden ? ` · ${hidden} older hidden` : ''} · Esc closes`
    if (list.length === 0) {
      return <Text dimColor>{all.length === 0 ? 'No subagents in this session yet.' : summary}</Text>
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>{summary}</Text>
        {list.map(one => {
          const isLive = live.has(one.id)
          return (
            <Box key={one.id} gap={2}>
              <Raster key={`sprite-${one.id}`} columns={SPRITE_COLUMNS} rows={SPRITE_ROWS} cells={spriteCells(one.type, { frame: Math.floor(now / FRAME_MS), isLive })} />
              <Box flexDirection="column">
                <Box gap={1}>
                  <Text color={isLive ? 'claude' : 'inactive'}>{isLive ? '●' : '○'}</Text>
                  <Text bold={isLive}>{one.type}</Text>
                  <Text dimColor>{shortModel(one.model)}</Text>
                </Box>
                <Text>{one.description}</Text>
                <Box gap={1}>
                  <Text dimColor>
                    {clockOf((isLive ? now : one.lastAt) - one.startedAt)} · ${one.usd.toFixed(2)}
                  </Text>
                  {isLive && (
                    <Button
                      key={`stop-${one.id}`}
                      label="stop"
                      plain
                      onPress={() => {
                        void $.tool.call({ tool: 'TaskStop', task_id: one.id })
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
