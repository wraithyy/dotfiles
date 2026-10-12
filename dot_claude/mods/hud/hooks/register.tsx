import { atom, read, update } from 'claude-code'
import type { AgentInfo, EngineInterface, Register } from 'claude-code'

import { clockOf, isExpensive, levelOf, nextLevel, prettyModel, switchAction } from './modes'
import type { Level, LeveledMode } from './modes'

// The other mods own their state; the HUD only reads it (owner writes only).
const WHERE = { plugin: 'where-am-i', key: 'where' } as const
const WHERE_HIDDEN = { plugin: 'where-am-i', key: 'isHidden' } as const
const RUNNING = { plugin: 'run-timer', key: 'running' } as const
const LAST_RUN = { plugin: 'run-timer', key: 'last' } as const
const AGENTS = { plugin: 'agents', key: 'tracked' } as const

// ADHD keeps no session flag of its own; null means "as the always-on flag says".
const adhdSession = atom({ plugin: 'hud', key: 'adhd' } as const, null)
// Levels picked but not applied yet: each apply costs a model turn, so rapid
// presses settle on the last pick and apply once.
const pending = atom({ plugin: 'hud', key: 'pending' } as const, {})
const DEBOUNCE_MS = 2000
const timers = new Map<string, { cancel: () => void }>()

const SHOW_RUN_AFTER_MS = 2000
const BACK = [
  { hotkey: 'o', model: 'opusplan' },
  { hotkey: 'u', model: 'opus' },
] as const
const LIVE = new Set<AgentInfo['status']>(['pending', 'running', 'waiting'])

type Where = { goal: string; doing: string; waiting: string; next: string }
type Running = { id: string; label: string; startedAt: number }
type LastRun = { label: string; isOk: boolean; exitCode: number | null; ms: number }
type Tracked = { id: string; type: string; model: string; startedAt: number; usd: number }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

// Another plugin's value arrives untyped; check its shape before drawing it.
const readWhere = (value: unknown): Where | null =>
  isRecord(value) && typeof value.goal === 'string'
    ? { goal: value.goal, doing: String(value.doing ?? ''), waiting: String(value.waiting ?? ''), next: String(value.next ?? '') }
    : null
const readList = <T,>(value: unknown, keys: readonly string[]): T[] =>
  Array.isArray(value) ? value.filter((one): one is T => isRecord(one) && keys.every(key => key in one)) : []

let tick: { cancel: () => void } | undefined

const modePaths = async ($: EngineInterface) => {
  const home = (await $.env.get('HOME')) ?? ''
  const claude = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${home}/.claude`
  const config = (await $.env.get('XDG_CONFIG_HOME')) ?? `${home}/.config`
  return {
    adhdFlag: `${claude}/.i-have-adhd-always`,
    active: (plugin: string) => `${claude}/.${plugin}-active`,
    defaults: (plugin: string) => `${config}/${plugin}/config.json`,
  }
}

const readText = async ($: EngineInterface, path: string) =>
  (await $.fs.exists(path)) ? String(await $.fs.read(path)) : null

// Keeps any other keys the plugin stores in its config (hideStatus, ...).
const writeDefault = async ($: EngineInterface, path: string, level: Level) => {
  let config: Record<string, unknown> = {}
  try {
    const text = await readText($, path)
    const parsed: unknown = text ? JSON.parse(text) : {}
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) config = { ...parsed }
  } catch {
    config = {}
  }
  await $.fs.write(path, `${JSON.stringify({ ...config, defaultMode: level }, null, 2)}\n`)
}

const modesNow = async ($: EngineInterface) => {
  const p = await modePaths($)
  const session = await read($, adhdSession)
  const picked = await read($, pending)
  return {
    adhd: session === null ? await $.fs.exists(p.adhdFlag) : session === 'on',
    caveman: levelOf(picked.caveman ?? (await readText($, p.active('caveman')))),
    ponytail: levelOf(picked.ponytail ?? (await readText($, p.active('ponytail')))),
    pendingCaveman: picked.caveman !== undefined,
    pendingPonytail: picked.ponytail !== undefined,
  }
}

const applyLevel = async ($: EngineInterface, plugin: LeveledMode, target: Level, current: Level) => {
  await update($, pending, all => ({ ...all, [plugin]: undefined }))
  if (target === current) return
  const p = await modePaths($)
  await writeDefault($, p.defaults(plugin), target)
  // The trackers only see typed prompts, so keep their flag in step here.
  const action = switchAction(plugin, target)
  if (action.kind === 'prompt') {
    await $.process.run(['rm', '-f', p.active(plugin)])
    await $.prompt.submit({ text: action.text, asUser: true })
  } else {
    await $.fs.write(p.active(plugin), target)
    await $.command.run({ command: action.command, args: action.args })
  }
  $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (/^\s*(stop adhd mode|normal mode)[.!\s]*$/i.test(e.text)) await update($, adhdSession, () => 'off')
    const result = await next(e)
    $.ui.invalidate('ui.render')
    return result
  })

  on('command.run', { command: 'model' }, async ($, e, next) => {
    const result = await next(e)
    $.ui.invalidate('ui.render')
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below
    try {
      const { Box, Button, Text } = $.ui.resolve(e)
      const now = await $.clock.now()
      const model = await $.session.model()
      const modes = await modesNow($)

      const whereHidden = (await $.state.get(WHERE_HIDDEN)).value === true
      const where = whereHidden ? null : readWhere((await $.state.get(WHERE)).value)

      const running = readList<Running>((await $.state.get(RUNNING)).value, ['id', 'label', 'startedAt']).filter(
        one => now - one.startedAt >= SHOW_RUN_AFTER_MS,
      )
      const lastValue = (await $.state.get(LAST_RUN)).value
      const last = isRecord(lastValue) && typeof lastValue.label === 'string' ? (lastValue as unknown as LastRun) : null // shape checked on label; the rest is run-timer's own contract
      const liveIds = new Set((await $.agent.list()).filter(agent => LIVE.has(agent.status)).map(agent => agent.id))
      const agents = readList<Tracked>((await $.state.get(AGENTS)).value, ['id', 'type', 'model', 'startedAt', 'usd']).filter(one =>
        liveIds.has(one.id),
      )

      // Redraw every second only while something counts up.
      if (running.length > 0 || agents.length > 0) tick ??= $.clock.every(1000, () => $.ui.invalidate('ui.render'))
      else {
        tick?.cancel()
        tick = undefined
      }

      const cycle = (plugin: LeveledMode, level: Level, current: Level) => async () => {
        const target = nextLevel(level)
        await update($, pending, all => ({ ...all, [plugin]: target }))
        timers.get(plugin)?.cancel()
        timers.set(plugin, $.clock.after(DEBOUNCE_MS, () => void applyLevel($, plugin, target, current)))
      }
      const toggleAdhd = async () => {
        const p = await modePaths($)
        if (modes.adhd) {
          await $.process.run(['rm', '-f', p.adhdFlag])
          await update($, adhdSession, () => 'off')
          await $.prompt.submit({ text: 'stop adhd mode', asUser: true })
        } else {
          await $.fs.write(p.adhdFlag, '')
          await update($, adhdSession, () => 'on')
          $.ui.toast('ADHD mode: on from the next session (it cannot start mid-session)')
        }
      }

      // The engine prints a Button's hotkey before its label ("a: adhd"), so the
      // label carries the name only.
      const chip = (key: string, hotkey: string, name: string, isOn: boolean, detail: string, onPress: () => Promise<void>) => (
        <Box key={key} gap={1}>
          <Text color={isOn ? 'success' : 'inactive'}>{isOn ? '●' : '○'}</Text>
          <Button key={`toggle-${key}`} hotkey={hotkey} plain dimColor={!isOn} label={name} onPress={() => void onPress()} />
          {detail && <Text dimColor>{detail}</Text>}
        </Box>
      )
      const levelDetail = (level: Level, isPending: boolean) => `${level === 'off' ? '' : level}${isPending ? '…' : ''}`
      const realCaveman = levelOf(await readText($, (await modePaths($)).active('caveman')))
      const realPonytail = levelOf(await readText($, (await modePaths($)).active('ponytail')))

      const modeChips = (
        <Box gap={2}>
          {chip('adhd', 'a', 'adhd', modes.adhd, '', toggleAdhd)}
          {chip('caveman', 'c', 'caveman', modes.caveman !== 'off', levelDetail(modes.caveman, modes.pendingCaveman), cycle('caveman', modes.caveman, realCaveman))}
          {chip('ponytail', 'p', 'ponytail', modes.ponytail !== 'off', levelDetail(modes.ponytail, modes.pendingPonytail), cycle('ponytail', modes.ponytail, realPonytail))}
        </Box>
      )

      const modelPart = isExpensive(model) ? (
        <Box gap={1}>
          <Text backgroundColor="warning" color="inverseText" bold>
            {' '}{prettyModel(model)} 2×{' '}
          </Text>
          {BACK.map(({ hotkey, model: target }) => (
            <Button
              key={`back-${target}`}
              hotkey={hotkey}
              plain
              dimColor
              label={target}
              onPress={() => {
                void $.command.run({ command: 'model', args: target })
              }}
            />
          ))}
        </Box>
      ) : (
        <Text dimColor>{prettyModel(model)}</Text>
      )

      const activity = [
        ...running.map(one => (
          <Text key={`run-${one.id}`}>
            <Text color="warning">⚙ </Text>
            {one.label}
            <Text dimColor> {clockOf(now - one.startedAt)}</Text>
          </Text>
        )),
        ...agents.map(one => (
          <Text key={`agent-${one.id}`}>
            <Text color="claude">◆ </Text>
            {one.type}
            <Text dimColor>
              {' '}{prettyModel(one.model)} {clockOf(now - one.startedAt)}
              {one.usd > 0 ? ` $${one.usd.toFixed(2)}` : ''}
            </Text>
          </Text>
        )),
      ]
      const lastRow =
        running.length === 0 && last ? (
          <Text key="last">
            <Text color={last.isOk ? 'success' : 'error'}>{last.isOk ? '✓ ' : '✗ '}</Text>
            <Text dimColor={last.isOk}>{last.label}</Text>
            {!last.isOk && <Text color="error"> exit {last.exitCode ?? '?'}</Text>}
            <Text dimColor> {clockOf(last.ms)}</Text>
          </Text>
        ) : null

      return (
        <Box flexDirection="column">
          {below}
          <Box justifyContent="space-between" gap={2}>
            <Box flexGrow={1}>
              {where ? (
                <Text wrap="truncate-end">
                  <Text color="claude">◎ </Text>
                  <Text bold>{where.goal}</Text>
                  {where.doing ? <Text dimColor> · ▶ {where.doing}</Text> : null}
                </Text>
              ) : (
                <Text dimColor>◎</Text>
              )}
            </Box>
            {modeChips}
          </Box>
          <Box justifyContent="space-between" gap={2}>
            <Box flexGrow={1}>
              {where ? (
                <Text wrap="truncate-end">
                  {where.waiting ? <Text color="warning">⏳ {where.waiting}</Text> : <Text dimColor>⏳ nothing waiting on you</Text>}
                  {where.next ? <Text dimColor> · → {where.next}</Text> : null}
                </Text>
              ) : (
                <Text> </Text>
              )}
            </Box>
            {modelPart}
          </Box>
          {(activity.length > 0 || lastRow) && (
            <Box gap={3}>
              {activity}
              {lastRow}
              {agents.length > 0 && <Text dimColor>/subagents</Text>}
            </Box>
          )}
        </Box>
      )
    } catch (error) {
      // A failed render hook is skipped silently; show why instead.
      const { Box, Text } = $.ui.resolve(e)
      return (
        <Box flexDirection="column">
          {below}
          <Text color="error">hud: {error instanceof Error ? error.message : String(error)}</Text>
        </Box>
      )
    }
  })
}
