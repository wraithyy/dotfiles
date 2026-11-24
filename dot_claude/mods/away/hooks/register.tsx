import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// One flag file shared by every session on this machine: /away in any pane
// pauses all of them, and removing it resumes all of them.
const paused = atom({ plugin: 'away', key: 'paused' } as const, false)
const POLL_MS = 5000

export const DENY =
  'Paused: the user is away and the laptop is about to sleep. Do not retry or work around this. ' +
  'End your turn now with one line saying where you stopped; a resume message will follow.'
export const RESUME = 'I am back from /away. Continue exactly where you stopped before the pause.'

type Flag = { since: number; amphetamine: boolean }

export const parseFlag = (text: string | null): Flag | null => {
  if (text === null) return null
  try {
    const value: unknown = JSON.parse(text)
    if (typeof value === 'object' && value !== null && 'amphetamine' in value)
      return { since: 'since' in value && typeof value.since === 'number' ? value.since : 0, amphetamine: value.amphetamine === true }
  } catch {}
  // A hand-made `touch ~/.claude/.away` still counts as away.
  return { since: 0, amphetamine: false }
}

const flagPath = async ($: EngineInterface) => {
  const claude = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${(await $.env.get('HOME')) ?? ''}/.claude`
  return `${claude}/.away`
}

const readFlag = async ($: EngineInterface) => {
  const path = await flagPath($)
  return parseFlag((await $.fs.exists(path)) ? String(await $.fs.read(path)) : null)
}

const amphetamine = ($: EngineInterface, script: string) =>
  $.process.run(['osascript', '-e', `tell application "Amphetamine" to ${script}`])

let poll: { cancel: () => void } | undefined

// Runs only while this session holds denied work, so idle sessions never poll.
const watchForReturn = ($: EngineInterface) => {
  poll ??= $.clock.every(POLL_MS, async () => {
    if (await readFlag($)) return
    poll?.cancel()
    poll = undefined
    await update($, paused, () => false)
    $.ui.invalidate('ui.render')
    await $.prompt.submit({ text: RESUME, asUser: true })
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'away', description: 'Leaving: pause all Claude sessions + Amphetamine off (again to resume)', immediate: true })
    if (await read($, paused)) watchForReturn($)
    return next(e)
  })

  on('command.run', { command: 'away' }, async $ => {
    const path = await flagPath($)
    const flag = await readFlag($)
    if (flag) {
      await $.process.run(['rm', '-f', path])
      if (flag.amphetamine) await amphetamine($, 'start new session')
      $.ui.invalidate('ui.render')
      return { text: 'Back: sessions resume within 5 s.' }
    }
    const active = await amphetamine($, 'session is active')
    const wasOn = active.stdout.trim() === 'true'
    await $.fs.write(path, `${JSON.stringify({ since: await $.clock.now(), amphetamine: wasOn })}\n`)
    if (wasOn) await amphetamine($, 'end session')
    $.ui.invalidate('ui.render')
    return { text: `Away: tool calls in every session are denied${wasOn ? ', Amphetamine off' : ''}. Close the lid once agents stop.` }
  })

  on('tool.call', async ($, e, next) => {
    // An unreadable flag must not wedge every session: treat it as present-at-desk.
    const isAway = await readFlag($).catch(() => null)
    if (!isAway) return next(e)
    await update($, paused, () => true)
    watchForReturn($)
    return { deny: DENY }
  })
}
