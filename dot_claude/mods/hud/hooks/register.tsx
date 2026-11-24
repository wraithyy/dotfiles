import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { levelOf, nextLevel, switchAction } from './modes'
import type { Level, LeveledMode } from './modes'

// The other mods own their state; the HUD only reads it (owner writes only).
const WHERE = { plugin: 'where-am-i', key: 'where' } as const
const WHERE_HIDDEN = { plugin: 'where-am-i', key: 'isHidden' } as const

// ADHD keeps no session flag of its own; null means "as the always-on flag says".
const adhdSession = atom({ plugin: 'hud', key: 'adhd' } as const, null)
// Levels picked but not applied yet: each apply costs a model turn, so rapid
// presses settle on the last pick and apply once.
const pending = atom({ plugin: 'hud', key: 'pending' } as const, {})
const DEBOUNCE_MS = 2000
const timers = new Map<string, { cancel: () => void }>()

type Where = { goal: string; doing: string; waiting: string; next: string }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

// Another plugin's value arrives untyped; check its shape before drawing it.
const readWhere = (value: unknown): Where | null =>
  isRecord(value) && typeof value.goal === 'string'
    ? { goal: value.goal, doing: String(value.doing ?? ''), waiting: String(value.waiting ?? ''), next: String(value.next ?? '') }
    : null

const modePaths = async ($: EngineInterface) => {
  const home = (await $.env.get('HOME')) ?? ''
  const claude = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${home}/.claude`
  const config = (await $.env.get('XDG_CONFIG_HOME')) ?? `${home}/.config`
  const plugin = 'git-yolo'
  return {
    adhdFlag: `${claude}/.i-have-adhd-always`,
    awayFlag: `${claude}/.away`,
    // Built from parts: the git-yolo mod denies any tool call naming its flag.
    yoloFlag: `${claude}/.${plugin}-${await $.session.id()}`,
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
      const modes = await modesNow($)

      const whereHidden = (await $.state.get(WHERE_HIDDEN)).value === true
      // Inside herdr the halo layout draws the band (where-am-i publishes it as a terminal label).
      const inHerdr = Boolean(await $.env.get('HC_TERMINAL_ID'))
      const where = whereHidden || inHerdr ? null : readWhere((await $.state.get(WHERE)).value)

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
          {isOn && <Text color="success">●</Text>}
          <Button key={`toggle-${key}`} hotkey={hotkey} plain dimColor={!isOn} label={name} onPress={() => void onPress()} />
          {detail && <Text dimColor>{detail}</Text>}
        </Box>
      )
      const levelDetail = (level: Level, isPending: boolean) => `${level === 'off' ? '' : level}${isPending ? '…' : ''}`
      const isAway = await $.fs.exists((await modePaths($)).awayFlag)
      // The away mod owns the flag, Amphetamine and the resume; the chip only triggers it.
      const toggleAway = async () => {
        await $.command.run({ command: 'away', args: '' })
      }
      const isYolo = await $.fs.exists((await modePaths($)).yoloFlag)
      const toggleYolo = async () => {
        await $.command.run({ command: 'git-yolo', args: '' })
      }
      const realCaveman = levelOf(await readText($, (await modePaths($)).active('caveman')))
      const realPonytail = levelOf(await readText($, (await modePaths($)).active('ponytail')))

      const modeChips = (
        <Box gap={2}>
          {chip('away', 'w', 'away', isAway, '', toggleAway)}
          {chip('yolo', 'g', 'git-yolo', isYolo, '', toggleYolo)}
          {chip('adhd', 'a', 'adhd', modes.adhd, '', toggleAdhd)}
          {chip('caveman', 'c', 'caveman', modes.caveman !== 'off', levelDetail(modes.caveman, modes.pendingCaveman), cycle('caveman', modes.caveman, realCaveman))}
          {chip('ponytail', 'p', 'ponytail', modes.ponytail !== 'off', levelDetail(modes.ponytail, modes.pendingPonytail), cycle('ponytail', modes.ponytail, realPonytail))}
        </Box>
      )

      // One row: where-am-i on the left (outside herdr), mode chips on the right. Model,
      // running commands and subagents are left to Claude Code's own footer.
      const whereLine = where ? (
        <Text wrap="truncate-end">
          <Text color="claude">◎ </Text>
          <Text bold>{where.goal}</Text>
          {where.doing ? <Text dimColor> · ▶ {where.doing}</Text> : null}
          {where.waiting ? <Text color="warning">{` · ! ${where.waiting}`}</Text> : null}
          {where.next ? <Text dimColor> · → {where.next}</Text> : null}
        </Text>
      ) : null

      return (
        <Box flexDirection="column">
          {below}
          <Box justifyContent="space-between" gap={2}>
            <Box flexGrow={1}>{whereLine}</Box>
            {modeChips}
          </Box>
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
