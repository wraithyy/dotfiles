export type TrackedAgent = {
  id: string
  description: string
  type: string
  model: string
  startedAt: number
  // Last turn end seen; a finished agent's duration ends here.
  lastAt: number
  usd: number
}

declare module 'claude-code' {
  interface PluginState {
    agents: { tracked: TrackedAgent[] }
  }
}
