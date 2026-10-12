export type Where = { goal: string; doing: string; waiting: string; next: string }

declare module 'claude-code' {
  interface PluginState {
    'where-am-i': { where: Where | null; isHidden: boolean }
  }
}
