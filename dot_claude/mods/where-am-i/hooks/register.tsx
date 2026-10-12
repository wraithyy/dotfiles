import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Where } from '../types'

const where = atom({ plugin: 'where-am-i', key: 'where' } as const, null)
const isHidden = atom({ plugin: 'where-am-i', key: 'isHidden' } as const, false)

const MODEL = 'haiku'
const MAX_FIELD = 70
const KEEP_PROMPTS = 6
const MAX_ANSWER = 4000

const SYSTEM = [
  'You keep a status line for a coding session so the user never loses track.',
  'Reply with one JSON object only, no prose: {"goal": "", "doing": "", "waiting": "", "next": ""}.',
  'goal: the overall aim the user is pursuing. doing: what the assistant is doing or just finished.',
  'waiting: what the assistant needs from the user right now (a decision, an answer, a manual step), or "" if nothing.',
  'next: the single next concrete step.',
  `Each value at most ${MAX_FIELD - 10} characters, plain text, in the language the user writes in.`,
].join('\n')

const clip = (text: string) => (text.length > MAX_FIELD ? `${text.slice(0, MAX_FIELD - 1)}…` : text)

export const parseWhere = (reply: string): Where | null => {
  const json = reply.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return null
  try {
    const raw: unknown = JSON.parse(json)
    if (!raw || typeof raw !== 'object') return null
    const field = (key: string) => {
      const value = (raw as Record<string, unknown>)[key] // JSON.parse yields a plain object here
      return typeof value === 'string' ? clip(value.trim()) : ''
    }
    const parsed = { goal: field('goal'), doing: field('doing'), waiting: field('waiting'), next: field('next') }
    return parsed.goal || parsed.doing || parsed.next ? parsed : null
  } catch {
    return null
  }
}

export const promptFor = (prompts: readonly string[], answer: string) =>
  [
    'Recent user messages, oldest first:',
    ...prompts.map(text => `- ${text.replace(/\s+/g, ' ').slice(0, 500)}`),
    '',
    "Assistant's last reply:",
    answer.slice(-MAX_ANSWER),
  ].join('\n')

// Module state: lost on reload, refilled by the next prompts.
const recent: string[] = []
let running: Promise<void> = Promise.resolve()
export const settled = () => running

const summarize = async ($: EngineInterface, answer: string) => {
  const reply = await $.model.complete({ model: MODEL, system: SYSTEM, prompt: promptFor(recent, answer), maxTokens: 300, timeoutMs: 30_000 })
  if (!reply.isAnswered) return
  const parsed = parseWhere(reply.text)
  if (parsed) await update($, where, () => parsed)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'where', description: 'Show or hide the where-am-i band (goal, doing, waiting, next)' })
    const stored = await $.store.get('isHidden')
    if (stored === true) await update($, isHidden, () => true)
    return next(e)
  })

  on('command.run', { command: 'where' }, async $ => {
    const hidden = !(await read($, isHidden))
    await update($, isHidden, () => hidden)
    await $.store.set('isHidden', hidden)
    return { text: hidden ? 'where-am-i band hidden.' : 'where-am-i band shown.' }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.text.trim() && !e.text.trim().startsWith('/')) {
      recent.push(e.text)
      recent.splice(0, Math.max(0, recent.length - KEEP_PROMPTS))
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    // Subagent turns and aborted turns say nothing about where the user is.
    if (!e.agentId && !e.isAborted && e.answer.trim() && recent.length > 0) {
      running = summarize($, e.answer).catch(() => undefined)
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const now = await read($, where)
    if (e.props.hasSurvey || !now || (await read($, isHidden))) return below

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {below}
        <Box gap={1}>
          <Text color="claude">◎</Text>
          <Text bold>{now.goal}</Text>
          {now.doing && <Text dimColor>· ▶ {now.doing}</Text>}
        </Box>
        <Box gap={1}>
          {now.waiting ? (
            <Text color="warning">⏳ {now.waiting}</Text>
          ) : (
            <Text dimColor>⏳ nothing waiting on you</Text>
          )}
          {now.next && <Text dimColor>· → {now.next}</Text>}
        </Box>
      </Box>
    )
  })
}
