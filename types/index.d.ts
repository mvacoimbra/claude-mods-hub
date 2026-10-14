// What a mod's noun hands the hub (PROTOCOL.md): one tab, drawn by the hub.

export type ModsLang = 'en' | 'pt'

export type ModsSurface = 'terminal' | 'desktop' | 'vscode' | 'mobile'

export type ModsPanelArgs = { lang: ModsLang; surface: ModsSurface; columns: number }

export type ModsTone = 'ok' | 'warn' | 'err' | 'muted' | 'accent'

// Where a setting lives: the user's (every session and project, the default) or this session's
// alone. The hub marks the session's.
export type ModsScope = 'user' | 'session'

export type ModsItem =
  | { kind: 'toggle'; id: string; label: string; help?: string; value: boolean; scope?: ModsScope }
  | { kind: 'choice'; id: string; label: string; help?: string; value: string; options: { value: string; label: string }[]; scope?: ModsScope }
  // `label` is the button's; `title`, when given, names the row, with `help` under it.
  | { kind: 'action'; id: string; label: string; title?: string; help?: string; primary?: boolean; scope?: ModsScope }
  | { kind: 'input'; id: string; label: string; help?: string; placeholder?: string; submitLabel?: string; scope?: ModsScope }
  | { kind: 'info'; label: string; value: string; tone?: ModsTone }
  | { kind: 'text'; text: string; tone?: ModsTone }
  | { kind: 'swatch'; id: string; label: string; color: string; selected: boolean }
  | { kind: 'tree'; tree: unknown }

export type ModsSection = { id: string; title: string; items: ModsItem[] }

export type ModsPanel = {
  title: string
  summary?: string
  tone?: ModsTone
  // A progress the summary reports, drawn as a ring beside it.
  percent?: number
  sections: ModsSection[]
  refreshMs?: number
}

export type ModsActArgs = { id: string; value?: string }

export type ModsActResult = { message?: string }

// One named component a mod draws, for the Components tab (PROTOCOL.md, the catalog).
export type ModsCatalogEntry = { id: string; name: string; help?: string; tree: unknown }

declare module 'claude-code' {
  interface PluginState {
    mods: {
      // The open view: 'overview', 'components', 'settings' or a mod's noun.
      tab: string
      // Bumped after a press or a refresh tick, so the pane draws again from fresh panels.
      revision: number
      lang: ModsLang
      // The Components tab's open section and what its demos were last given.
      demo: { group: string; element: string; mod: string; clicks: number; typed: string; submitted: string; picked: string; links: number }
    }
  }
}
