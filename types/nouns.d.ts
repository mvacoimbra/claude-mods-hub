// The nouns the mods that join the pane add to `$` (PROTOCOL.md), for the editor and tsc only:
// the hub declares none of its own, so this file is not its contract.
import type { KitSkin } from '../kit/tone'
import type { ModsActArgs, ModsActResult, ModsCatalogEntry, ModsPanel, ModsPanelArgs } from './index'

type ModApi = {
  panel: (args: ModsPanelArgs) => Promise<ModsPanel>
  act: (args: ModsActArgs) => Promise<ModsActResult>
  catalog: (args: ModsPanelArgs) => Promise<ModsCatalogEntry[]>
}

declare module 'claude-code' {
  interface EngineInterface {
    cachetax: ModApi
    // skins also hands out the skin every mod wears.
    skins: ModApi & { palette: () => Promise<KitSkin> }
    filetree: ModApi
    savvy: ModApi
    replay: ModApi
    // blast-radius has no tab, only a catalog.
    blast: { catalog: (args: ModsPanelArgs) => Promise<ModsCatalogEntry[]> }
  }
}
