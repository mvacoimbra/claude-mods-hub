// What a mod's noun hands the hub (PROTOCOL.md): one tab, drawn by the hub.

export type ModsLang = 'en' | 'pt'

export type ModsSurface = 'terminal' | 'desktop' | 'vscode' | 'mobile'

export type ModsPanelArgs = { lang: ModsLang; surface: ModsSurface; columns: number }

export type ModsTone = 'ok' | 'warn' | 'err' | 'muted' | 'accent'

export type ModsItem =
  | { kind: 'toggle'; id: string; label: string; help?: string; value: boolean }
  | { kind: 'choice'; id: string; label: string; help?: string; value: string; options: { value: string; label: string }[] }
  | { kind: 'action'; id: string; label: string; help?: string; primary?: boolean }
  | { kind: 'input'; id: string; label: string; help?: string; placeholder?: string; submitLabel?: string }
  | { kind: 'info'; label: string; value: string; tone?: ModsTone }
  | { kind: 'text'; text: string; tone?: ModsTone }
  | { kind: 'swatch'; id: string; label: string; color: string; selected: boolean }
  | { kind: 'tree'; tree: unknown }

export type ModsSection = { id: string; title: string; items: ModsItem[] }

export type ModsPanel = {
  title: string
  summary?: string
  tone?: ModsTone
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
      // The open tab: 'overview', 'settings' or a mod's noun.
      tab: string
      // Each mod's open section, by noun.
      sections: Record<string, string>
      // Bumped after a press or a refresh tick, so the pane draws again from fresh panels.
      revision: number
      lang: ModsLang
      // The Components tab's open section and what its demos were last given.
      demo: { group: string; element: string; mod: string; clicks: number; typed: string; submitted: string; picked: string; links: number }
    }
  }
}
