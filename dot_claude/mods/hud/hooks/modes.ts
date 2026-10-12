export const LEVELS = ['off', 'lite', 'full', 'ultra'] as const
export type Level = (typeof LEVELS)[number]
export type LeveledMode = 'caveman' | 'ponytail'

export const nextLevel = (level: Level): Level => LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length] ?? 'off'

export const levelOf = (text: string | null | undefined): Level => {
  const value = text?.trim().toLowerCase()
  return LEVELS.find(level => level === value) ?? (value ? 'full' : 'off')
}

// Off is the phrase each plugin's own UserPromptSubmit tracker understands;
// a level runs the plugin's skill, which loads that level's rules into context.
// A plugin may not submit a prompt that starts with "/", hence the split.
export const switchAction = (plugin: LeveledMode, level: Level) =>
  level === 'off'
    ? { kind: 'prompt' as const, text: `stop ${plugin}` }
    : { kind: 'command' as const, command: `${plugin}:${plugin}`, args: level }

// "claude-fable-5-1" and "Fable 5.1" both read as "Fable 5.1"; others shorten
// to their family name.
export const prettyModel = (model: string) => {
  const fable = model.match(/fable[\s-]*(\d+)(?:[.-](\d+))?/i)
  if (fable) return `Fable ${fable[1]}${fable[2] ? `.${fable[2]}` : ''}`
  return model.match(/opusplan|opus|sonnet|haiku/i)?.[0]?.toLowerCase() ?? model
}

export const isExpensive = (model: string) => /fable/i.test(model)

export const clockOf = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
