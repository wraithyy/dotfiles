export type Thumb = {
  tag: number
  // Half-block fallback for terminals without kitty graphics.
  columns: number
  rows: number
  cells: string
  // Real pixels where the terminal draws pictures.
  png: string
  imageColumns: number
  imageRows: number
}

declare module 'claude-code' {
  interface PluginState {
    // thumbs: the draft's images; gallery: recent images of the session, for
    // hover cards on sent messages.
    'image-view': { thumbs: Thumb[]; gallery: Thumb[] }
  }
}
