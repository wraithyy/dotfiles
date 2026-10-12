export type AdhdState = 'on' | 'off' | null

export type PendingLevels = { caveman?: string; ponytail?: string }

declare module 'claude-code' {
  interface PluginState {
    hud: { adhd: AdhdState; pending: PendingLevels }
  }
}
