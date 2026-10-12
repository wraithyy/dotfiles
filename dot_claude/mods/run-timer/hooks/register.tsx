import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { FinishedCommand, RunningCommand } from '../types'

const running = atom({ plugin: 'run-timer', key: 'running' } as const, [])
const last = atom({ plugin: 'run-timer', key: 'last' } as const, null)

// Below this a command is not worth a row: no flicker for ls, git status.
const SHOW_AFTER_MS = 2000

export const labelOf = (command: string, description?: string) => {
  const text = (description ?? command).replace(/\s+/g, ' ').trim()
  return text.length > 48 ? `${text.slice(0, 47)}…` : text
}

export const exitCodeOf = (isError: boolean, text: string | undefined) => {
  // The harness leads the result text with it; matching anywhere would pick
  // up "exit code 1" printed by the command's own output.
  const code = text?.match(/^Exit code:?\s*(-?\d+)/i)?.[1]
  if (code !== undefined) return Number(code)
  return isError ? null : 0
}

export const clockOf = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// The hud mod draws `running` and `last`; this mod only keeps them current.
export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (e.run_in_background) return next(e)

    const entry: RunningCommand = { id: e.tool_use_id, label: labelOf(e.command, e.description), startedAt: await $.clock.now() }
    let tick: { cancel: () => void } | undefined

    try {
      await update($, running, list => [...list, entry])
      tick = $.clock.every(1000, () => $.ui.invalidate('ui.render'))
      const ran = await next(e)
      const ms = (await $.clock.now()) - entry.startedAt
      if (ms >= SHOW_AFTER_MS && ran.deny === undefined) {
        const isOk = ran.isError !== true
        await update($, last, () => ({ label: entry.label, isOk, exitCode: exitCodeOf(!isOk, ran.text), ms }))
      }
      return ran
    } finally {
      tick?.cancel()
      await update($, running, list => list.filter(one => one.id !== entry.id))
    }
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, last, () => null)
    return next(e)
  })

}
