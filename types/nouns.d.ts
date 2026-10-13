// The nouns the mods that join the pane add to `$` (PROTOCOL.md), for the editor and tsc only:
// the hub declares none of its own, so this file is not its contract.
import type { ModsActArgs, ModsActResult, ModsCatalogEntry, ModsPanel, ModsPanelArgs } from './index'

type ModApi = {
  panel: (args: ModsPanelArgs) => Promise<ModsPanel>
  act: (args: ModsActArgs) => Promise<ModsActResult>
  catalog: (args: ModsPanelArgs) => Promise<ModsCatalogEntry[]>
}

declare module 'claude-code' {
  interface EngineInterface {
    cachetax: ModApi
    skins: ModApi
    filetree: ModApi
    savvy: ModApi
    replay: ModApi
    // blast-radius has no tab, only a catalog.
    blast: { catalog: (args: ModsPanelArgs) => Promise<ModsCatalogEntry[]> }
  }
}
