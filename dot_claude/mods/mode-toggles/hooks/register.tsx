import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// ADHD keeps no session flag of its own; null means "as the always-on flag says".
const adhdSession = atom({ plugin: 'mode-toggles', key: 'adhd' } as const, null)
// Levels picked but not applied yet: each apply costs a model turn, so rapid
// presses settle on the last pick and apply once.
const pending = atom({ plugin: 'mode-toggles', key: 'pending' } as const, {})
const DEBOUNCE_MS = 2000
const timers = new Map<string, { cancel: () => void }>()

const LEVELS = ['off', 'lite', 'full', 'ultra'] as const
type Level = (typeof LEVELS)[number]

export const nextLevel = (level: Level): Level => LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length] ?? 'off'

export const levelOf = (text: string | null): Level => {
  const value = text?.trim().toLowerCase()
  return LEVELS.find(level => level === value) ?? (value ? 'full' : 'off')
}

// Off is the phrase each plugin's own UserPromptSubmit tracker understands;
// a level runs the plugin's skill, which loads that level's rules into context.
// A plugin may not submit a prompt that starts with "/", hence the split.
export const switchAction = (plugin: 'caveman' | 'ponytail', level: Level) =>
  level === 'off'
    ? { kind: 'prompt' as const, text: `stop ${plugin}` }
    : { kind: 'command' as const, command: `${plugin}:${plugin}`, args: level }

const paths = async ($: EngineInterface) => {
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

const state = async ($: EngineInterface) => {
  const p = await paths($)
  const flag = await $.fs.exists(p.adhdFlag)
  const session = await read($, adhdSession)
  return {
    adhd: session === null ? flag : session === 'on',
    caveman: levelOf(await readText($, p.active('caveman'))),
    ponytail: levelOf(await readText($, p.active('ponytail'))),
  }
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (/^\s*(stop adhd mode|normal mode)[.!\s]*$/i.test(e.text)) await update($, adhdSession, () => 'off')
    const result = await next(e)
    $.ui.invalidate('ui.render')
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below

    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await state($)
    const picked = await read($, pending)
    const shown = (plugin: 'caveman' | 'ponytail') => levelOf(picked[plugin] ?? now[plugin])
    const isPending = (plugin: 'caveman' | 'ponytail') => picked[plugin] !== undefined

    const toggleAdhd = async () => {
      const p = await paths($)
      if (now.adhd) {
        await $.process.run(['rm', '-f', p.adhdFlag])
        await update($, adhdSession, () => 'off')
        await $.prompt.submit({ text: 'stop adhd mode', asUser: true })
      } else {
        await $.fs.write(p.adhdFlag, '')
        await update($, adhdSession, () => 'on')
        $.ui.toast('ADHD mode: on from the next session (it cannot start mid-session)')
      }
    }

    const apply = async (plugin: 'caveman' | 'ponytail', target: Level) => {
      await update($, pending, all => ({ ...all, [plugin]: undefined }))
      if (target === (plugin === 'caveman' ? now.caveman : now.ponytail)) return
      const p = await paths($)
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

    const cycle = async (plugin: 'caveman' | 'ponytail', level: Level) => {
      const target = nextLevel(level)
      await update($, pending, all => ({ ...all, [plugin]: target }))
      timers.get(plugin)?.cancel()
      timers.set(plugin, $.clock.after(DEBOUNCE_MS, () => void apply(plugin, target)))
    }

    const chip = (key: string, hotkey: string, label: string, isOn: boolean, detail: string | null, onPress: () => Promise<void>) => (
      <Box key={key} gap={0}>
        <Button key={`toggle-${key}`} hotkey={hotkey} plain dimColor={!isOn} label={`${hotkey}`} onPress={() => void onPress()} />
        <Text color={isOn ? 'success' : 'inactive'}>{isOn ? ' ●' : ' ○'}</Text>
        <Text dimColor={!isOn}> {label}</Text>
        {detail && <Text dimColor> {detail}</Text>}
      </Box>
    )

    return (
      <Box flexDirection="column">
        {below}
        <Box gap={2} justifyContent="flex-end">
          {chip('adhd', 'a', 'adhd', now.adhd, null, toggleAdhd)}
          {(['caveman', 'ponytail'] as const).map(plugin => {
            const level = shown(plugin)
            const detail = `${level === 'off' ? '' : level}${isPending(plugin) ? '…' : ''}`
            return chip(plugin, plugin[0] ?? '', plugin, level !== 'off', detail || null, () => cycle(plugin, level))
          })}
        </Box>
      </Box>
    )
  })
}
