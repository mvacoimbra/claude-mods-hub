import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, Timer } from 'claude-code'

import { action, choice, dot, empty, field, icon, kitOf, meter, picker, row, section, stack, staticTree, status, swatch, text, toggle } from '../kit/kit'
import type { Kit } from '../kit/kit'
import type { IconName } from '../kit/icons'
import { toneOf } from '../kit/tone'
import type { KitSkin, Tone } from '../kit/tone'
import type { ModsActArgs, ModsActResult, ModsCatalogEntry, ModsItem, ModsLang, ModsPanel, ModsPanelArgs } from '../types'
import { componentsTab, DEMO_START, DEMO_WORDS } from './components'
import type { DemoCatalog, DemoState, DemoUi } from './components'
import { HUB_STRINGS } from './i18n'
import type { HubStrings } from './i18n'

const PANE = 'mods'

// The mods that join the pane, by the noun each adds to `$`, in list order: the plugin's
// name, the name a person sees (a mod's own panel title wins once it is loaded), its icon.
type ModInfo = { noun: string; name: string; title: Readonly<Record<ModsLang, string>>; icon: IconName }

export const MODS: readonly ModInfo[] = [
  { noun: 'cachetax', name: 'cache-tax', title: { en: 'Keep warm', pt: 'Manter aquecido' }, icon: 'cache' },
  { noun: 'skins', name: 'skins', title: { en: 'Skins', pt: 'Skins' }, icon: 'skins' },
  { noun: 'filetree', name: 'filetree', title: { en: 'Files', pt: 'Arquivos' }, icon: 'folder' },
  { noun: 'savvy', name: 'savvy-progress', title: { en: 'Agents', pt: 'Agentes' }, icon: 'agents' },
  { noun: 'replay', name: 'replay-theater', title: { en: 'Replay', pt: 'Replay' }, icon: 'replay' },
]

// The mods whose components the Components tab names; blast-radius has a catalog and no view.
export const CATALOGS: readonly ModInfo[] = [...MODS, { noun: 'blast', name: 'blast-radius', title: { en: 'Blast radius', pt: 'Blast radius' }, icon: 'shield' }]

type Loaded = { noun: string; panel: ModsPanel; failed?: string }

const tabAtom = atom({ plugin: 'mods', key: 'tab' } as const, 'overview')
const revisionAtom = atom({ plugin: 'mods', key: 'revision' } as const, 0)
const langAtom = atom({ plugin: 'mods', key: 'lang' } as const, 'en' as ModsLang)
const demoAtom = atom({ plugin: 'mods', key: 'demo' } as const, DEMO_START as DemoState)

// Each mod's noun, spelled out: `$` is only ever called by name. A mod that is not
// installed has no noun on `$`, so the call throws before reaching it.
async function panelOf($: EngineInterface, noun: string, args: ModsPanelArgs): Promise<ModsPanel> {
  switch (noun) {
    case 'cachetax':
      return $.cachetax.panel(args)
    case 'skins':
      return $.skins.panel(args)
    case 'filetree':
      return $.filetree.panel(args)
    case 'savvy':
      return $.savvy.panel(args)
    case 'replay':
      return $.replay.panel(args)
    default:
      throw new Error(`no mod named ${noun}`)
  }
}

async function actOn($: EngineInterface, noun: string, args: ModsActArgs): Promise<ModsActResult> {
  switch (noun) {
    case 'cachetax':
      return $.cachetax.act(args)
    case 'skins':
      return $.skins.act(args)
    case 'filetree':
      return $.filetree.act(args)
    case 'savvy':
      return $.savvy.act(args)
    case 'replay':
      return $.replay.act(args)
    default:
      throw new Error(`no mod named ${noun}`)
  }
}

async function catalogOf($: EngineInterface, noun: string, args: ModsPanelArgs): Promise<ModsCatalogEntry[]> {
  switch (noun) {
    case 'cachetax':
      return $.cachetax.catalog(args)
    case 'skins':
      return $.skins.catalog(args)
    case 'filetree':
      return $.filetree.catalog(args)
    case 'savvy':
      return $.savvy.catalog(args)
    case 'replay':
      return $.replay.catalog(args)
    case 'blast':
      return $.blast.catalog(args)
    default:
      throw new Error(`no mod named ${noun}`)
  }
}

// What a call to a noun nobody added throws: reading its method off undefined, or calling a
// method a mod's noun does not have.
const isAbsent = (error: unknown): boolean => error instanceof TypeError && /\b(panel|act|catalog|palette)\b/.test(error.message)

// The skin every mod wears, from skins; Claude Code's own colours without it.
async function skinOf($: EngineInterface): Promise<KitSkin | null> {
  try {
    return await $.skins.palette()
  } catch (error) {
    if (!isAbsent(error)) {
      $.ui.log(`mods: no palette from skins: ${messageOf(error)}`, { to: 'debug' })
    }

    return null
  }
}

// The open Mods section's catalog: null entries when the mod is absent or has none.
async function loadCatalog($: EngineInterface, noun: string, args: ModsPanelArgs, name: string, t?: Tone): Promise<DemoCatalog> {
  try {
    // Another mod's drawing reaches the hub as data: anything that would need a handler
    // (a Button, a field) is drawn as its label, so one careless entry cannot blank the pane.
    const entries = await catalogOf($, noun, args)

    return { noun, name, entries: entries.map(entry => ({ ...entry, tree: staticTree(entry.tree, t) })) }
  } catch (error) {
    return isAbsent(error) ? { noun, name, entries: null } : { noun, name, entries: null, failed: messageOf(error) }
  }
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))

async function loadAll($: EngineInterface, args: ModsPanelArgs): Promise<Loaded[]> {
  const loaded = await Promise.all(
    MODS.map(async ({ noun, name }): Promise<Loaded | null> => {
      try {
        return { noun, panel: await panelOf($, noun, args) }
      } catch (error) {
        return isAbsent(error) ? null : { noun, panel: { title: name, sections: [] }, failed: messageOf(error) }
      }
    }),
  )

  return loaded.filter((mod): mod is Loaded => mod !== null)
}

// The pane's language lives in the user's store, so every session and project shows the
// same one; the atom only carries it between draws of one session.
async function langOf($: EngineInterface): Promise<ModsLang> {
  const stored = await $.store.get('lang')

  return stored === 'pt' ? 'pt' : 'en'
}

// The redraw tick of a view that counts down, and how often it runs.
let ticker: Timer | undefined
let tickMs = 0

function setTicker($: EngineInterface, ms: number): void {
  if (ms === tickMs) {
    return
  }

  ticker?.cancel()
  ticker = undefined
  tickMs = ms

  if (ms > 0) {
    ticker = $.clock.every(ms, () => void update($, revisionAtom, n => n + 1))
  }
}

// Swatches next to each other share one wrapped grid, and so do actions with no help, as one
// row of buttons; every other item is a row of its own.
type Swatch = Extract<ModsItem, { kind: 'swatch' }>
type Action = Extract<ModsItem, { kind: 'action' }>
type Run = { kind: 'one'; item: ModsItem; index: number } | { kind: 'swatches'; items: Swatch[] } | { kind: 'actions'; items: Action[] }

const isBare = (item: ModsItem): item is Action => item.kind === 'action' && item.help === undefined

function runsOf(list: readonly ModsItem[]): Run[] {
  const runs: Run[] = []

  list.forEach((item, index) => {
    const last = runs.at(-1)

    if (item.kind === 'swatch') {
      if (last?.kind === 'swatches') {
        last.items.push(item)
      } else {
        runs.push({ kind: 'swatches', items: [item] })
      }
    } else if (isBare(item)) {
      if (last?.kind === 'actions') {
        last.items.push(item)
      } else {
        runs.push({ kind: 'actions', items: [item] })
      }
    } else {
      runs.push({ kind: 'one', item, index })
    }
  })

  return runs
}

// Only a live state earns colour and a dot: ok, warn or err. Accent and muted read as plain.
const isState = (tone: string | undefined): tone is 'ok' | 'warn' | 'err' => tone === 'ok' || tone === 'warn' || tone === 'err'

// Choices short enough to sit at a row's end; the rest wrap under the label.
const fitsAtEnd = (options: readonly { label: string }[], columns: number): boolean =>
  options.length <= 3 && options.reduce((sum, option) => sum + option.label.length + 5, 0) <= Math.max(16, columns - 34)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const lang = await langOf($)
    await update($, langAtom, () => lang)
    await $.command.register({ name: 'mods', description: HUB_STRINGS[lang].command, immediate: true })

    return next(e)
  })

  on('command.run', { command: 'mods' }, async $ => {
    const lang = await langOf($)
    await $.ui.open({ id: PANE, title: HUB_STRINGS[lang].title, focus: true, closeOnEscape: true })

    return {}
  })

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE) {
      setTicker($, 0)
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)

    if (e.surface === 'mobile' || !('Input' in ui)) {
      return <ui.Text>Open /mods in the terminal or the desktop app.</ui.Text>
    }

    await read($, revisionAtom)
    const lang = await langOf($)
    const w: HubStrings = HUB_STRINGS[lang]
    const columns = e.props.bodyColumns
    const k: Kit = kitOf(ui, toneOf(await skinOf($)), e.surface, columns)
    const { Box } = ui
    const mods = await loadAll($, { lang, surface: e.surface, columns: Math.max(20, columns - 4) })
    const stored = await read($, tabAtom)
    const tab = stored === 'overview' || stored === 'settings' || stored === 'components' || mods.some(mod => mod.noun === stored) ? stored : 'overview'
    const current = mods.find(mod => mod.noun === tab)

    // A countdown in view draws again on its own; the overview shows every summary.
    const refresh = tab === 'overview' ? Math.min(...mods.map(mod => mod.panel.refreshMs ?? Infinity)) : (current?.panel.refreshMs ?? Infinity)
    setTicker($, Number.isFinite(refresh) ? Math.max(1000, refresh) : 0)

    const go = (next: string) => void update($, tabAtom, () => next)

    const press = (noun: string, id: string, value?: string) =>
      void (async () => {
        try {
          const result = await actOn($, noun, value === undefined ? { id } : { id, value })

          if (result?.message) {
            $.ui.toast(result.message)
          }
        } catch (error) {
          $.ui.toast(messageOf(error))
        }

        await update($, revisionAtom, n => n + 1)
      })()

    const toggleWords = { on: w.on, off: w.off, turnOn: w.turnOn, turnOff: w.turnOff }

    // Help, with the session-only mark where an item is not the user's setting.
    const helpOf = (entry: { help?: string; scope?: string }) =>
      entry.scope === 'session' ? [entry.help, w.sessionOnly].filter(Boolean).join(' · ') : entry.help

    const item = (noun: string, entry: ModsItem, index: number): RenderElement | null => {
      const key = `item-${noun}-${'id' in entry ? entry.id : index}`

      switch (entry.kind) {
        case 'toggle':
          return row(k, { key, label: entry.label, help: helpOf(entry), end: toggle(k, key, entry.value, next => press(noun, entry.id, next ? 'on' : 'off'), toggleWords) })
        case 'choice': {
          const picked = picker(k, key, entry.value, entry.options, value => press(noun, entry.id, value))

          return fitsAtEnd(entry.options, columns)
            ? row(k, { key, label: entry.label, help: helpOf(entry), end: picked })
            : row(k, { key, label: entry.label, help: helpOf(entry), below: picked })
        }
        case 'action':
          return row(k, {
            key,
            label: entry.title ?? helpOf(entry) ?? entry.label,
            help: entry.title === undefined ? undefined : helpOf(entry),
            end: action(k, key, entry.label, () => press(noun, entry.id), { primary: entry.primary === true }),
          })
        case 'input':
          return field(k, key, entry.label, entry.placeholder ?? '', value => press(noun, entry.id, value), {
            submitLabel: entry.submitLabel ?? w.apply,
            ...(helpOf(entry) ? { help: helpOf(entry)! } : {}),
          })
        case 'info':
          return row(k, { key, label: entry.label, muted: true, end: text(k, entry.value, entry.tone), endWraps: true })
        case 'text':
          return (
            <Box key={key} paddingX={1}>
              {text(k, entry.text, entry.tone ?? 'muted')}
            </Box>
          )
        case 'tree':
          return (
            <Box key={key} flexDirection="column" paddingX={1}>
              {staticTree(entry.tree, k.t) as RenderElement}
            </Box>
          )
        case 'swatch':
          return null
      }
    }

    const items = (noun: string, list: readonly ModsItem[]) =>
      runsOf(list).map(run => {
        switch (run.kind) {
          case 'one':
            return item(noun, run.item, run.index)
          case 'swatches':
            return (
              <Box key={`swatches-${noun}-${run.items[0]!.id}`} flexDirection="row" flexWrap="wrap" columnGap={2} paddingX={1}>
                {run.items.map(entry => swatch(k, `item-${noun}-${entry.id}`, entry.label, entry.color, entry.selected, () => press(noun, entry.id)))}
              </Box>
            )
          case 'actions':
            return (
              <Box key={`actions-${noun}-${run.items[0]!.id}`} flexDirection="row" flexWrap="wrap" columnGap={1} paddingX={1}>
                {run.items.map(entry => action(k, `item-${noun}-${entry.id}`, entry.label, () => press(noun, entry.id), { primary: entry.primary === true }))}
              </Box>
            )
        }
      })

    // The way back from a mod, Components or Settings, and the view's own title.
    const header = (title: string, iconName: IconName, state?: RenderElement | null) => (
      <Box key="header" flexDirection="column">
        <Box flexDirection="row" columnGap={1} alignItems="center">
          {icon(k, 'chevronLeft', 'muted', 14)}
          {action(k, 'tab-overview', w.allMods, () => go('overview'), { hotkey: '0' })}
        </Box>
        <Box flexDirection="row" columnGap={1} alignItems="center" paddingX={1} paddingTop={1}>
          {icon(k, iconName, undefined, 18)}
          {text(k, title, undefined, { bold: true })}
          <Box flexGrow={1} />
          {state ?? null}
        </Box>
      </Box>
    )

    // A progress the mod reports, as the pack's ring.
    const ringOf = (mod: Loaded) => (mod.panel.percent === undefined ? null : meter(k, `ring-${mod.noun}`, '', mod.panel.percent, undefined, 'accent'))

    const stateOf = (mod: Loaded) =>
      mod.failed ? (
        status(k, w.couldNotDraw, 'err')
      ) : !mod.panel.summary ? (
        ringOf(mod)
      ) : (
        <Box flexDirection="row" columnGap={1} alignItems="center" flexShrink={1}>
          {ringOf(mod)}
          {isState(mod.panel.tone) ? status(k, mod.panel.summary, mod.panel.tone) : text(k, mod.panel.summary, 'muted')}
        </Box>
      )

    const iconOf = (noun: string): IconName => CATALOGS.find(mod => mod.noun === noun)?.icon ?? 'mods'

    const missing = MODS.filter(mod => !mods.some(present => present.noun === mod.noun)).map(mod => mod.title[lang])

    // One name per mod everywhere: its own panel title, or the table's when it has no view.
    const titleOf = (noun: string): string => mods.find(mod => mod.noun === noun)?.panel.title || CATALOGS.find(mod => mod.noun === noun)?.title[lang] || noun

    const overview = stack(k, 'overview', [
      mods.length === 0
        ? empty(k, 'no-mods', w.noMods, w.noModsHint)
        : section(
            k,
            'list-mods',
            w.installed,
            mods.map((mod, i) =>
              row(k, {
                key: `mod-${mod.noun}`,
                label: mod.panel.title,
                icon: iconOf(mod.noun),
                help: mod.failed ? w.failed(mod.failed) : mod.panel.summary,
                ...(mod.failed ? { helpTone: 'err' as const } : isState(mod.panel.tone) ? { helpTone: mod.panel.tone } : {}),
                end: [
                  ...(mod.failed ? [] : [ringOf(mod)]),
                  ...(!mod.failed && isState(mod.panel.tone) ? [dot(k, mod.panel.tone)] : []),
                  action(k, `open-${mod.noun}`, w.open, () => go(mod.noun), i < 9 ? { hotkey: String(i + 1) } : {}),
                ],
              }),
            ),
            mods.length === 1 ? w.oneMod : w.manyMods(mods.length),
          ),
      section(k, 'list-more', w.more, [
        row(k, { key: 'components', label: w.components, help: w.componentsHelp, icon: 'components', end: action(k, 'tab-components', w.open, () => go('components')) }),
        row(k, { key: 'settings', label: w.settings, help: w.settingsHelp, icon: 'settings', end: action(k, 'tab-settings', w.open, () => go('settings')) }),
      ]),
      missing.length > 0 ? <Box key="missing" paddingX={1}>{text(k, w.missing(missing.join(', ')), 'faint')}</Box> : null,
    ])

    const setLang = (value: string) =>
      void (async () => {
        const next: ModsLang = value === 'pt' ? 'pt' : 'en'
        await $.store.set('lang', next)
        await update($, langAtom, () => next)
        await update($, revisionAtom, n => n + 1)
      })()

    const settings = stack(k, 'settings', [
      header(w.settings, 'settings'),
      section(k, 'settings-language', w.general, [
        row(k, {
          key: 'mods-lang',
          label: w.language,
          help: w.languageHelp,
          end: choice(k, 'item-mods-lang', lang, [{ value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }], setLang),
        }),
      ]),
      section(k, 'settings-scope', w.scopeTitle, [
        row(k, { key: 'scope-user', label: w.scopeUser, help: w.scopeUserHelp, icon: 'settings' }),
        row(k, { key: 'scope-session', label: w.scopeSession, help: w.scopeSessionHelp, icon: 'clock' }),
      ]),
      section(k, 'settings-keys', w.keysTitle, [row(k, { key: 'keys', label: w.footer, muted: true })]),
    ])

    const modView = (mod: Loaded) => {
      const { panel } = mod

      return stack(k, `view-${mod.noun}`, [
        header(panel.title, iconOf(mod.noun), stateOf(mod)),
        mod.failed ? <Box key="failed" paddingX={1}>{text(k, w.failed(mod.failed), 'err')}</Box> : null,
        ...panel.sections.map(entry =>
          section(k, `section-${mod.noun}-${entry.id}`, entry.title, items(mod.noun, entry.items), undefined, entry.items.every(one => one.kind === 'info')),
        ),
        panel.sections.length === 0 && !mod.failed ? empty(k, 'nothing', w.nothingToSet) : null,
      ])
    }

    // The Components tab draws a mod's catalog only while its Mods section is open.
    const demo = await read($, demoAtom)
    const catalogMods = CATALOGS.filter(mod => mod.noun === 'blast' || mods.some(present => present.noun === mod.noun)).map(mod => ({ noun: mod.noun, name: titleOf(mod.noun), slug: mod.name }))
    const openCatalog = demo.mod !== '' && catalogMods.some(mod => mod.noun === demo.mod) ? demo.mod : catalogMods[0]?.noun
    const catalog =
      tab === 'components' && demo.group === 'mods' && openCatalog !== undefined
        ? await loadCatalog($, openCatalog, { lang, surface: e.surface, columns: Math.max(20, columns - 4) }, titleOf(openCatalog), k.t)
        : null

    const components = () =>
      stack(k, 'components', [
        header(w.components, 'components'),
        componentsTab(
          ui as unknown as DemoUi,
          k,
          e.surface,
          columns,
          lang,
          demo,
          {
            group: id => void update($, demoAtom, d => ({ ...d, group: id })),
            element: id => void update($, demoAtom, d => ({ ...d, element: id })),
            mod: noun => void update($, demoAtom, d => ({ ...d, mod: noun })),
            click: () => void update($, demoAtom, d => ({ ...d, clicks: d.clicks + 1 })),
            type: value => void update($, demoAtom, d => ({ ...d, typed: value })),
            submit: value => void update($, demoAtom, d => ({ ...d, submitted: value, typed: '' })),
            pick: value => void update($, demoAtom, d => ({ ...d, picked: value })),
            link: () => void update($, demoAtom, d => ({ ...d, links: d.links + 1 })),
            toast: () => $.ui.toast(w.toast),
            notify: () => void $.ui.notify(w.toast, { title: 'mods' }).catch(error => $.ui.toast(messageOf(error))),
            ask: () =>
              void $.ui
                .ask(DEMO_WORDS[lang].outside.askQuestion, ['Box', 'Text', 'Button'])
                .then(answer => $.ui.toast(`$.ui.ask → ${answer}`))
                .catch(error => $.ui.toast(messageOf(error))),
            status: () =>
              void (async () => {
                const time = new Date(await $.clock.now()).toTimeString().slice(0, 8)
                $.ui.status(w.status(time))
                $.clock.after(8000, () => $.ui.status(undefined))
              })(),
            copy: () => void $.ui.copy({ text: 'copied by /mods' }).then(result => $.ui.toast(result.isCopied ? '$.ui.copy → ok' : '$.ui.copy → not here')),
          },
          catalogMods,
          catalog,
        ),
      ])

    const view = tab === 'settings' ? settings : tab === 'components' ? components() : current === undefined ? overview : modView(current)

    return view
  })
}
