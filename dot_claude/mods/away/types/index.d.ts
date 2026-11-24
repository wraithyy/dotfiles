export type Paused = boolean

declare module 'claude-code' {
  interface PluginState {
    away: { paused: Paused }
  }
}
