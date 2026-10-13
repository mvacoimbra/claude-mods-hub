# The mods panel protocol

`/mods` opens one pane with a tab per mod. The hub draws every tab itself, from a description
each mod hands it, so every mod looks the same and a press always lands in the hub: a press
cannot cross from one mod's tree to another's.

A mod joins by adding a noun to `$` with two methods, `panel` and `act`, and listing its noun in
the hub's `MODS` table (`hooks/register.tsx`). A mod that is not installed has no noun, and its
tab is not drawn.

| Mod | Noun |
| --- | --- |
| cache-tax | `$.cachetax` |
| skins | `$.skins` |
| filetree | `$.filetree` |
| savvy-progress | `$.savvy` |
| replay-theater | `$.replay` |

## Adding the noun

In the mod's contract (`types/index.d.ts`, named by `plugin.json`'s `types`), the types led by
the noun's PascalCase name, with no import (`unknown` where a tree goes):

```ts
export type CachetaxLang = 'en' | 'pt'
export type CachetaxPanelArgs = { lang: CachetaxLang; surface: 'terminal' | 'desktop' | 'vscode' | 'mobile'; columns: number }
export type CachetaxTone = 'ok' | 'warn' | 'err' | 'muted' | 'accent'
export type CachetaxItem =
  | { kind: 'toggle'; id: string; label: string; help?: string; value: boolean }
  | { kind: 'choice'; id: string; label: string; help?: string; value: string; options: { value: string; label: string }[] }
  | { kind: 'action'; id: string; label: string; help?: string; primary?: boolean }
  | { kind: 'input'; id: string; label: string; help?: string; placeholder?: string; submitLabel?: string }
  | { kind: 'info'; label: string; value: string; tone?: CachetaxTone }
  | { kind: 'text'; text: string; tone?: CachetaxTone }
  | { kind: 'swatch'; id: string; label: string; color: string; selected: boolean }
  | { kind: 'tree'; tree: unknown }
export type CachetaxSection = { id: string; title: string; items: CachetaxItem[] }
export type CachetaxPanel = {
  // The tab's name.
  title: string
  // One line for the overview and under the tab row.
  summary?: string
  tone?: CachetaxTone
  // Drawn as sub-tabs when there is more than one.
  sections: CachetaxSection[]
  // While this tab shows, the hub draws it again this often (a countdown).
  refreshMs?: number
}
export type CachetaxActArgs = { id: string; value?: string }
export type CachetaxActResult = { message?: string }

declare module 'claude-code' {
  interface EngineInterface {
    cachetax: {
      panel: (args: CachetaxPanelArgs) => Promise<CachetaxPanel>
      act: (args: CachetaxActArgs) => Promise<CachetaxActResult>
    }
  }
}
```

In the hooks module, the noun's stub at `engine.create`, then a hook per method that answers
`{ value }`:

```ts
on('engine.create', async ($, e, next) => {
  const built = await next(e)
  return { ...built, cachetax: { panel: async () => ({ title: '', sections: [] }), act: async () => ({}) } }
})
on('cachetax.panel', async ($, e) => ({ value: await panelOf($, e) }))
on('cachetax.act', async ($, e) => ({ value: await actOn($, e) }))
```

## What the hub does with it

- Items are drawn in order. `toggle` is a name, `● on` / `○ off` and its help; `choice` one
  button per option, the chosen one marked (an empty `value` marks none: a row of one-shot
  choices, such as "keep warm for 1h · 3h · 6h"); `action` a button and its help; `input` a
  field whose submit is the act, with the typed text as `value`; `info` a name and a value in
  its tone; `text` a line; `swatch` a colour chip in a grid with the swatches next to it; `tree`
  is drawn as handed over, so it carries no buttons of its own.
- A press calls `act({ id, value })`: a toggle's `value` is `'on'` or `'off'`, the state it
  goes to; a choice's is the option's `value`; an action's is absent. A `message` the act
  answers shows as a toast. Then the tab is drawn again from a fresh `panel`.
- `lang` is the language the person picked in the hub. A mod that does not speak it answers
  in English.
- Keys are the hub's: `tab-<noun>`, `section-<noun>-<section>`, `item-<noun>-<id>` and
  `item-<noun>-<id>-<option>` for a choice's buttons.

## The catalog (optional)

The hub's Components tab shows, beside the API's own elements, every named component each mod
draws, live, so a person can point at one and ask for a change. A mod joins it with a third
method on its noun:

```ts
export type CachetaxCatalogEntry = {
  // Stable, kebab-case: what a person names when asking for a change.
  id: string
  // The component's name, as a person would say it ("Usage band, nudging to compact").
  name: string
  // One line on what it is and where it shows.
  help?: string
  // The component drawn for `args.surface` at `args.columns`, from the same builders the mod
  // draws it with in place, in a state worth seeing. Static: a press cannot cross to the mod.
  tree: unknown
}

// on EngineInterface, beside panel and act:
catalog: (args: CachetaxPanelArgs) => Promise<CachetaxCatalogEntry[]>
```

Entries come in the order the mod wants them read; several states of one component are
separate entries (`tool-row-running`, `tool-row-failed`). A component that one surface does not
draw is left out on that surface, or drawn as a short `Text` saying where it shows. `name` and
`help` follow `args.lang` (English when the mod does not speak it); `id` never changes.

