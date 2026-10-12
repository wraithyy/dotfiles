import type { Register } from 'claude-code'

// /model is sticky across sessions (writes user settings), so an expensive
// model left active silently carries over; keep it visible while it is on.
const EXPENSIVE = /fable/i
// Hotkey, label: what /model gets.
const BACK = [
  { hotkey: 'o', model: 'opusplan' },
  { hotkey: 'u', model: 'opus' },
] as const

// "claude-fable-5-1" and "Fable 5.1" both read as "Fable 5.1".
const pretty = (model: string) => {
  const m = model.match(/fable[\s-]*(\d+)(?:[.-](\d+))?/i)
  return m ? `Fable ${m[1]}${m[2] ? `.${m[2]}` : ''}` : model
}

export const register: Register = on => {
  on('command.run', { command: 'model' }, async ($, e, next) => {
    const result = await next(e)
    $.ui.invalidate('ui.render')
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    const model = await $.session.model()

    if (e.props.hasSurvey || !EXPENSIVE.test(model)) {
      return below
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {below}
        <Box gap={1} justifyContent="flex-end">
          <Text backgroundColor="warning" color="inverseText" bold>
            {' '}{pretty(model)} 2×{' '}
          </Text>
          {BACK.map(({ hotkey, model: target }) => (
            <Button
              key={`back-${target}`}
              hotkey={hotkey}
              plain
              dimColor
              label={`${hotkey}:${target}`}
              onPress={() => {
                void $.command.run({ command: 'model', args: target })
              }}
            />
          ))}
        </Box>
      </Box>
    )
  })
}
