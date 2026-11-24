import type { EngineInterface, Register } from 'claude-code'

// The flag lives in a file because ask-git-remote.sh (a shell hook) decides
// the prompt; the mod only owns who may flip it. Keyed by session id, so
// /clear or a new session starts back at "ask".
export const FLAG_PREFIX = '.git-yolo-'

export const DENY =
  'The git-yolo flag is user-only: toggle it with /git-yolo. Do not create, edit or remove it.'

export const touchesFlag = (input: unknown) => JSON.stringify(input ?? '').includes(FLAG_PREFIX)

const flagPath = async ($: EngineInterface) => {
  const claude = (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${(await $.env.get('HOME')) ?? ''}/.claude`
  return `${claude}/${FLAG_PREFIX}${await $.session.id()}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'git-yolo', description: 'Toggle auto-allow of git/gh/glab writes in this session', immediate: true })
    return next(e)
  })

  on('command.run', { command: 'git-yolo' }, async $ => {
    const path = await flagPath($)
    const wasOn = await $.fs.exists(path)
    if (wasOn) await $.process.run(['rm', '-f', path])
    else await $.fs.write(path, `${await $.clock.now()}\n`)
    // The HUD chip reads the flag on render.
    $.ui.invalidate('ui.render')
    if (wasOn) return { text: 'git-yolo off: git/gh/glab writes prompt again.' }
    return { text: 'git-yolo on: git/gh/glab writes auto-allowed in this session.' }
  })

  // ponytail: substring match, an obfuscated path (string concat, globs) slips
  // past; move the flag out of the model's reach (keychain, mod state read by
  // the shell hook over a socket) if that ever matters.
  on('tool.call', async ($, e, next) => (touchesFlag(e) ? { deny: DENY } : next(e)))
}
