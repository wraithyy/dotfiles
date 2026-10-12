export type RunningCommand = { id: string; label: string; startedAt: number }

export type FinishedCommand = { label: string; isOk: boolean; exitCode: number | null; ms: number }

declare module 'claude-code' {
  interface PluginState {
    'run-timer': { running: RunningCommand[]; last: FinishedCommand | null }
  }
}
