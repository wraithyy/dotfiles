export type AdhdState = 'on' | 'off' | null

export type PendingLevels = { caveman?: string; ponytail?: string }

declare module 'claude-code' {
  interface PluginState {
    'mode-toggles': { adhd: AdhdState; pending: PendingLevels }
  }
}
