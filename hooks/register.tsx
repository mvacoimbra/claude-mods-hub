import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, Timer } from 'claude-code'

import type { ModsActArgs, ModsActResult, ModsItem, ModsLang, ModsPanel, ModsPanelArgs, ModsTone } from '../types'
import { componentsTab, DEMO_START } from './components'
import type { DemoState, DemoUi } from './components'
import { HUB_STRINGS } from './i18n'
import type { HubStrings } from './i18n'

const PANE = 'mods'

// The mods that join the pane, by the noun each adds to `$`, in tab order.
export const MODS: readonly { noun: string; name: string }[] = [
  { noun: 'cachetax', name: 'cache-tax' },
  { noun: 'skins', name: 'skins' },
  { noun: 'filetree', name: 'filetree' },
  { noun: 'savvy', name: 'savvy-progress' },
  { noun: 'replay', name: 'replay-theater' },
]

type Loaded = { noun: string; panel: ModsPanel; failed?: string }

const tabAtom = atom({ plugin: 'mods', key: 'tab' } as const, 'overview')
const sectionsAtom = atom({ plugin: 'mods', key: 'sections' } as const, {} as Record<string, string>)
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

// What a call to a noun nobody added throws: reading its method off undefined.
const isAbsent = (error: unknown): boolean => error instanceof TypeError && /\b(panel|act)\b/.test(error.message)

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

const TONES: Readonly<Record<ModsTone, string>> = { ok: 'success', warn: 'warning', err: 'error', muted: 'subtle', accent: 'claude' }

const toneOf = (tone: ModsTone | undefined): string => (tone === undefined ? 'text' : TONES[tone])

const mark = (on: boolean): string => (on ? '●' : '○')

// Each option is a name, its control and one line of help: beside the control in a wide pane,
// under it in a narrow one.
const NAME_COLUMNS = 24
const WIDE = 72

// The redraw tick of a tab that counts down, and how often it runs.
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

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    const stored = await $.store.get('lang')
    await update($, langAtom, () => (stored === 'pt' ? 'pt' : 'en'))
    await $.command.register({ name: 'mods', description: HUB_STRINGS[stored === 'pt' ? 'pt' : 'en'].command, immediate: true })

    return next(e)
  })

  on('command.run', { command: 'mods' }, async $ => {
    const lang = await read($, langAtom)
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

    const { Box, Text, Button, Input } = ui
    await read($, revisionAtom)
    const lang = await read($, langAtom)
    const t: HubStrings = HUB_STRINGS[lang]
    const sections = await read($, sectionsAtom)
    const columns = e.props.bodyColumns
    const wide = columns >= WIDE
    const mods = await loadAll($, { lang, surface: e.surface, columns: Math.max(20, columns - 2) })
    const stored = await read($, tabAtom)
    const tab = stored === 'overview' || stored === 'settings' || stored === 'components' || mods.some(mod => mod.noun === stored) ? stored : 'overview'
    const current = mods.find(mod => mod.noun === tab)

    // A countdown on the open tab draws again on its own; the overview shows every summary.
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

    const help = (text: string | undefined) =>
      text === undefined ? null : (
        <Box flexShrink={1} paddingLeft={wide ? 0 : 2}>
          <Text color="subtle">{text}</Text>
        </Box>
      )

    const row = (key: string, label: string, text: string | undefined, control: RenderElement) => (
      <Box key={`row-${key}`} flexDirection={wide ? 'row' : 'column'} columnGap={2}>
        <Box flexDirection="row" columnGap={2} flexShrink={0}>
          <Box width={NAME_COLUMNS} flexShrink={0}>
            <Text color="text">{label}</Text>
          </Box>
          {control}
        </Box>
        {help(text)}
      </Box>
    )

    const choiceButtons = (key: string, value: string, options: { value: string; label: string }[], choose: (value: string) => void) => (
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {options.map(option => (
          <Button
            key={`${key}-${option.value}`}
            plain
            dimColor={option.value !== value}
            label={value === '' ? option.label : `${mark(option.value === value)} ${option.label}`}
            onPress={() => choose(option.value)}
          />
        ))}
      </Box>
    )

    const item = (noun: string, entry: ModsItem, index: number) => {
      const key = `item-${noun}-${'id' in entry ? entry.id : index}`

      switch (entry.kind) {
        case 'toggle':
          return row(
            key,
            entry.label,
            entry.help,
            <Button
              key={key}
              plain
              dimColor={!entry.value}
              label={`${mark(entry.value)} ${entry.value ? t.on : t.off}`}
              onPress={() => press(noun, entry.id, entry.value ? 'off' : 'on')}
            />,
          )
        case 'choice':
          return entry.options.length > 4 ? (
            <Box key={`row-${key}`} flexDirection="column">
              <Text color="text">{entry.label}</Text>
              {help(entry.help)}
              {choiceButtons(key, entry.value, entry.options, value => press(noun, entry.id, value))}
            </Box>
          ) : (
            row(key, entry.label, entry.help, choiceButtons(key, entry.value, entry.options, value => press(noun, entry.id, value)))
          )
        case 'action':
          return (
            <Box key={`row-${key}`} flexDirection={wide ? 'row' : 'column'} columnGap={2}>
              <Box flexShrink={0}>
                <Button key={key} label={entry.label} variant={entry.primary ? 'primary' : 'secondary'} onPress={() => press(noun, entry.id)} />
              </Box>
              {help(entry.help)}
            </Box>
          )
        case 'input':
          return (
            <Box key={`row-${key}`} flexDirection="column">
              <Input
                key={key}
                label={`${entry.label} `}
                placeholder={entry.placeholder ?? ''}
                value=""
                submitLabel={entry.submitLabel ?? 'ok'}
                onSubmit={(value: string) => press(noun, entry.id, value.trim())}
              />
              {help(entry.help)}
            </Box>
          )
        case 'info':
          return row(key, entry.label, undefined, <Text color={toneOf(entry.tone)}>{entry.value}</Text>)
        case 'text':
          return (
            <Text key={key} color={toneOf(entry.tone ?? 'muted')}>
              {entry.text}
            </Text>
          )
        case 'tree':
          return (
            <Box key={key} flexDirection="column">
              {entry.tree as RenderElement}
            </Box>
          )
        case 'swatch':
          return null
      }
    }

    // Swatches next to each other share one grid; every other item is a row of its own.
    const items = (noun: string, list: readonly ModsItem[]) => {
      const out: RenderElement[] = []

      for (let i = 0; i < list.length; i++) {
        const entry = list[i]!

        if (entry.kind !== 'swatch') {
          const drawn = item(noun, entry, i)

          if (drawn !== null) {
            out.push(drawn)
          }

          continue
        }

        const run: Extract<ModsItem, { kind: 'swatch' }>[] = []

        while (list[i]?.kind === 'swatch') {
          run.push(list[i] as Extract<ModsItem, { kind: 'swatch' }>)
          i++
        }

        i--
        out.push(
          <Box key={`swatches-${noun}-${run[0]?.id ?? i}`} flexDirection="row" flexWrap="wrap" columnGap={2}>
            {run.map(swatch => (
              <Box key={`swatch-box-${noun}-${swatch.id}`} flexDirection="row" columnGap={1} width={wide ? 30 : 26}>
                <Text color="text">{swatch.selected ? '▸' : ' '}</Text>
                <Text backgroundColor={swatch.color}>{'    '}</Text>
                <Button key={`item-${noun}-${swatch.id}`} plain dimColor={!swatch.selected} label={swatch.label} onPress={() => press(noun, swatch.id)} />
                <Text color="subtle">{swatch.color}</Text>
              </Box>
            ))}
          </Box>,
        )
      }

      return out
    }

    const tabs = (
      <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
        {[{ id: 'overview', title: t.overview }, ...mods.map(mod => ({ id: mod.noun, title: mod.panel.title })), { id: 'components', title: t.components }, { id: 'settings', title: t.settings }].map(
          (entry, i) => (
            <Button
              key={`tab-${entry.id}`}
              label={entry.title}
              variant={entry.id === tab ? 'primary' : 'secondary'}
              onPress={() => go(entry.id)}
              {...(i < 9 ? { hotkey: String(i + 1) } : {})}
            />
          ),
        )}
      </Box>
    )

    const overview = (
      <Box flexDirection="column" rowGap={1}>
        <Text color="subtle">{mods.length === 0 ? t.noMods : t.overviewHelp}</Text>
        {mods.map(mod => (
          <Box key={`overview-${mod.noun}`} flexDirection={wide ? 'row' : 'column'} columnGap={2}>
            <Box flexDirection="row" columnGap={2} flexShrink={0}>
              <Box width={NAME_COLUMNS} flexShrink={0}>
                <Text bold color="text">
                  {mod.panel.title}
                </Text>
              </Box>
              <Button key={`open-${mod.noun}`} plain label={`${t.open} ›`} onPress={() => go(mod.noun)} />
            </Box>
            <Box flexShrink={1} paddingLeft={wide ? 0 : 2}>
              <Text color={toneOf(mod.failed ? 'err' : (mod.panel.tone ?? 'muted'))}>{mod.failed ? t.failed(mod.failed) : (mod.panel.summary ?? '')}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    )

    const missing = MODS.filter(mod => !mods.some(present => present.noun === mod.noun)).map(mod => mod.name)

    const settings = (
      <Box flexDirection="column" rowGap={1}>
        {row(
          'mods-lang',
          t.language,
          t.languageHelp,
          choiceButtons('item-mods-lang', lang, [{ value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }], value =>
            void (async () => {
              const next: ModsLang = value === 'pt' ? 'pt' : 'en'
              await $.store.set('lang', next)
              await update($, langAtom, () => next)
            })(),
          ),
        )}
        {missing.length > 0 ? <Text color="subtle">{t.missing(missing.join(', '))}</Text> : null}
      </Box>
    )

    const modTab = (mod: Loaded) => {
      const { panel } = mod
      const open = panel.sections.find(section => section.id === sections[mod.noun]) ?? panel.sections[0]

      return (
        <Box flexDirection="column" rowGap={1}>
          {mod.failed ? <Text color="error">{t.failed(mod.failed)}</Text> : null}
          {panel.summary ? <Text color={toneOf(panel.tone ?? 'muted')}>{panel.summary}</Text> : null}
          {panel.sections.length > 1 ? (
            <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
              {panel.sections.map(section => (
                <Button
                  key={`section-${mod.noun}-${section.id}`}
                  plain
                  dimColor={section.id !== open?.id}
                  label={`${mark(section.id === open?.id)} ${section.title}`}
                  onPress={() => void update($, sectionsAtom, all => ({ ...all, [mod.noun]: section.id }))}
                />
              ))}
            </Box>
          ) : null}
          {open === undefined ? null : (
            <Box flexDirection="column" rowGap={1}>
              {items(mod.noun, open.items)}
            </Box>
          )}
        </Box>
      )
    }

    return (
      <Box flexDirection="column" rowGap={1}>
        {tabs}
        {tab === 'overview'
          ? overview
          : tab === 'settings'
            ? settings
            : tab === 'components'
              ? componentsTab(ui as unknown as DemoUi, e.surface, columns, lang, await read($, demoAtom), {
                  section: id => void update($, demoAtom, demo => ({ ...demo, section: id })),
                  click: () => void update($, demoAtom, demo => ({ ...demo, clicks: demo.clicks + 1 })),
                  type: value => void update($, demoAtom, demo => ({ ...demo, typed: value })),
                  submit: value => void update($, demoAtom, demo => ({ ...demo, submitted: value, typed: '' })),
                  pick: value => void update($, demoAtom, demo => ({ ...demo, picked: value })),
                  toast: () => $.ui.toast(t.toast),
                  status: () =>
                    void (async () => {
                      const time = new Date(await $.clock.now()).toTimeString().slice(0, 8)
                      $.ui.status(t.status(time))
                      $.clock.after(8000, () => $.ui.status(undefined))
                    })(),
                })
              : current === undefined
                ? overview
                : modTab(current)}
        <Text color="subtle">{t.footer}</Text>
      </Box>
    )
  })
}
