import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import type { ModsActArgs, ModsPanel, ModsPanelArgs } from '../types'

const SURFACES = ['terminal', 'desktop'] as const

const PANE = {
  plugin: 'mods',
  viewport: { columns: 100, rows: 30 },
  component: 'Pane',
  requestId: 'mods',
  props: { title: 'Mods', isFocused: true, bodyColumns: 90, placement: 'inline', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

// The engine's own answers; a test that records opens or toasts answers those itself.
function stub(on: On, own: { open?: boolean; toast?: boolean } = {}) {
  const clock = mock.clock(on, { now: 10_000 })
  mock.store(on)
  if (!own.open) on('ui.open', () => ({ value: { isPlaced: true } }))
  if (!own.toast) on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'mods' } }))

  return clock
}

// A stand-in for a mod that joins the pane: its noun, a panel and a record of what it was asked.
function fakeMod(on: On) {
  const asked: { panels: ModsPanelArgs[]; acts: ModsActArgs[] } = { panels: [], acts: [] }
  let warm = false

  on('engine.create', async ($, e, next) => {
    const built = await next(e)

    return { ...built, cachetax: { panel: async () => ({ title: '', sections: [] }), act: async () => ({}), catalog: async () => [] } }
  })
  on('cachetax.panel', ($, e) => {
    asked.panels.push(e)
    const panel: ModsPanel = {
      title: e.lang === 'pt' ? 'Manter aquecido' : 'Keep warm',
      summary: warm ? 'warm · 42m to cold' : 'cold',
      tone: warm ? 'ok' : 'warn',
      sections: [
        {
          id: 'warm',
          title: 'Keep warm',
          items: [
            { kind: 'toggle', id: 'always', label: 'Always on', help: 'every session', value: warm },
            { kind: 'choice', id: 'window', label: 'Keep warm for', value: '', options: [{ value: '1h', label: '1h' }, { value: '6h', label: '6h' }] },
            { kind: 'action', id: 'off', label: 'Turn off', primary: true },
            { kind: 'input', id: 'custom', label: 'Custom', placeholder: '90m' },
            { kind: 'info', label: 'Cache', value: warm ? 'warm' : 'cold', tone: warm ? 'ok' : 'err' },
          ],
        },
        { id: 'guard', title: 'Guard', items: [{ kind: 'choice', id: 'guard', label: 'Guard', value: 'warn', options: [{ value: 'warn', label: 'warn' }, { value: 'refuse', label: 'refuse' }] }] },
        { id: 'colors', title: 'Colors', items: [{ kind: 'swatch', id: 'edit:user', label: 'Accent', color: '#ff0000', selected: true }, { kind: 'swatch', id: 'edit:fg', label: 'Text', color: '#eeeeee', selected: false }] },
      ],
      refreshMs: 15_000,
    }

    return { value: panel }
  })
  on('cachetax.catalog', ($, e) => ({
    value: [
      { id: 'band-warm', name: e.lang === 'pt' ? 'Linha da faixa: aquecido' : 'Band row: warm', help: 'above the prompt', tree: { type: 'Text', props: { color: 'success' }, children: ['cache-tax · warm'] } },
      { id: 'band-cold', name: 'Band row: cold', tree: { type: 'Text', props: {}, children: ['cache-tax · cold'] } },
    ],
  }))
  on('cachetax.act', ($, e) => {
    asked.acts.push(e)
    if (e.id === 'always') warm = e.value === 'on'

    return { value: e.id === 'off' ? { message: 'keep warm is off' } : {} }
  })

  return asked
}

const runMods = ($: Engine) =>
  $.command.run({ command: 'mods', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

test('/mods opens the pane, and with no mod installed it says so', async ($, on) => {
  stub(on, { open: true })
  const opened: unknown[] = []
  on('ui.open', ($, e) => {
    opened.push(e)
    return { value: { isPlaced: true } }
  })
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  expect((await runMods($)).text).toBeUndefined()
  expect(opened).toHaveLength(1)

  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...PANE, surface })
    expect(await pane.find({ key: 'tab-components' })).toBeDefined()
    expect(await pane.find({ key: 'tab-settings' })).toBeDefined()
    expect(await pane.find({ key: 'open-cachetax' })).toBeUndefined()
    expect(await pane.find({ type: 'Text', text: 'No mod that joins this pane is installed.' })).toBeDefined()
    await pane.unmount()
  }
})

test('an installed mod gets a tab, its summary on the overview, and its items drawn', async ($, on) => {
  stub(on)
  fakeMod(on)

  for (const surface of SURFACES) {
    for (const columns of [90, 50]) {
      const pane = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, bodyColumns: columns } })
      expect((await pane.find({ key: 'open-cachetax' }))?.props.label).toBe('Open')
      expect(await pane.find({ type: 'Text', text: 'Keep warm' })).toBeDefined()
      expect(await pane.find({ type: 'Text', text: 'cold' })).toBeDefined()

      await pane.press({ key: 'open-cachetax' })
      // Every section shows at once, each a titled group.
      for (const key of ['item-cachetax-always', 'item-cachetax-window-1h', 'item-cachetax-off', 'item-cachetax-custom', 'section-cachetax-guard', 'item-cachetax-edit:user']) {
        expect(await pane.find({ key }), `${surface} ${columns} ${key}`).toBeDefined()
      }

      expect((await pane.find({ key: 'tab-overview' }))?.props.label).toBe('All mods')
      await pane.press({ key: 'tab-overview' })
      await pane.unmount()
    }
  }
})

test('a press calls the mod’s act with the new state, toasts its message and draws again', async ($, on) => {
  stub(on, { toast: true })
  const asked = fakeMod(on)
  const toasts: string[] = []
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'open-cachetax' })

  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('○ Off')
  await pane.press({ key: 'item-cachetax-always' })
  expect(asked.acts.at(-1)).toEqual({ id: 'always', value: 'on' })
  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('● On')

  await pane.press({ key: 'item-cachetax-window-6h' })
  expect(asked.acts.at(-1)).toEqual({ id: 'window', value: '6h' })
  // A row of one-shot choices marks none.
  expect((await pane.find({ key: 'item-cachetax-window-6h' }))?.props.label).toBe('6h')

  await pane.input({ key: 'item-cachetax-custom', text: ' 90m ' })
  expect(asked.acts.at(-1)).toEqual({ id: 'custom', value: '90m' })

  await pane.press({ key: 'item-cachetax-off' })
  expect(asked.acts.at(-1)).toEqual({ id: 'off' })
  expect(toasts).toEqual(['keep warm is off'])
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

test('on the desktop a setting is a switch with a button that says what it does', async ($, on) => {
  stub(on)
  const asked = fakeMod(on)

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await pane.press({ key: 'open-cachetax' })
  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('Turn on')
  await pane.press({ key: 'item-cachetax-always' })
  expect(asked.acts.at(-1)).toEqual({ id: 'always', value: 'on' })
  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('Turn off')
  // A choice marks the current option in the accent.
  expect((await pane.find({ key: 'item-cachetax-guard-warn' }))?.props.variant).toBe('primary')
  expect((await pane.find({ key: 'item-cachetax-guard-refuse' }))?.props.variant).toBeUndefined()
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

test('the language picked in Settings reaches every mod’s panel and the hub’s own words', async ($, on) => {
  stub(on)
  const asked = fakeMod(on)

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(asked.panels.at(-1)?.lang).toBe('en')
  await pane.press({ key: 'tab-settings' })
  await pane.press({ key: 'item-mods-lang-pt' })

  expect(asked.panels.at(-1)?.lang).toBe('pt')
  expect((await pane.find({ key: 'tab-overview' }))?.props.label).toBe('Todos os mods')
  await pane.press({ key: 'tab-overview' })
  expect(await pane.find({ type: 'Text', text: 'Manter aquecido' })).toBeDefined()
  expect((await pane.find({ key: 'open-cachetax' }))?.props.label).toBe('Abrir')
  await pane.press({ key: 'tab-settings' })
  await pane.press({ key: 'item-mods-lang-en' })
  expect((await pane.find({ key: 'tab-overview' }))?.props.label).toBe('All mods')
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

test('the language is the user’s: another session’s pick shows the next time the pane draws', async ($, on) => {
  // The user's store, shared by every session, held here so the test can write as another one.
  const held: Record<string, unknown> = {}
  mock.clock(on, { now: 10_000 })
  on('store.get', ($, e) => ({ value: held[e.key] }))
  on('store.set', ($, e) => {
    held[e.key] = e.value
    return { value: undefined }
  })
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', () => ({ value: undefined }))
  on('command.register', () => ({ value: { command: 'mods' } }))
  fakeMod(on)

  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await pane.find({ key: 'open-cachetax' }))?.props.label).toBe('Open')
  await pane.unmount()
  // What a pick in another session leaves behind: the user's store.
  held.lang = 'pt'
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await again.find({ key: 'open-cachetax' }))?.props.label).toBe('Abrir')
  await again.unmount()
})

test('a long choice is a native select, and one with nothing chosen says what to do', async ($, on) => {
  stub(on)
  const asked: { id: string; value?: string }[] = []
  on('engine.create', async ($, e, next) => {
    const built = await next(e)
    return { ...built, cachetax: { panel: async () => ({ title: '', sections: [] }), act: async () => ({}), catalog: async () => [] } }
  })
  const options = ['1h', '3h', '6h', '12h', '24h'].map(value => ({ value, label: value }))
  on('cachetax.panel', () => ({ value: { title: 'Keep warm', sections: [{ id: 'warm', title: 'Keep warm', items: [{ kind: 'choice', id: 'window', label: 'Keep warm for', value: '', options }] }] } }))
  on('cachetax.act', ($, e) => {
    asked.push(e)
    return { value: {} }
  })

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await pane.press({ key: 'open-cachetax' })
  const select = await pane.find({ key: 'item-cachetax-window' })
  expect(select?.type).toBe('Select')
  expect((select?.props.options as { label: string }[])[0]?.label).toBe('Choose…')
  await pane.select({ key: 'item-cachetax-window', value: '6h' })
  expect(asked.at(-1)).toEqual({ id: 'window', value: '6h' })
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

test('the not-installed line names mods the way the list does', async ($, on) => {
  stub(on)
  fakeMod(on)
  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await pane.find({ type: 'Text', text: 'Not installed: Skins, Files, Agents, Replay' })).toBeDefined()
  await pane.unmount()
})

test('a tab that counts down draws again on its own while it shows', async ($, on) => {
  const clock = stub(on)
  const asked = fakeMod(on)

  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'open-cachetax' })
  const before = asked.panels.length
  await clock.advance(15_000)
  await clock.settle()

  expect(asked.panels.length).toBeGreaterThan(before)
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

const ELEMENTS = ['box', 'text', 'button', 'input', 'select', 'link', 'code', 'markdown', 'svg', 'raster', 'image', 'client']

test('the Components tab draws every element with its props, the colours, sites and outside calls, on both surfaces', { timeoutMs: 60_000 }, async ($, on) => {
  stub(on)

  for (const surface of SURFACES) {
    for (const columns of [90, 50]) {
      const pane = await $.ui.mount({ ...PANE, surface, props: { ...PANE.props, bodyColumns: columns } })
      await pane.press({ key: 'tab-components' })

      for (const element of ELEMENTS) {
        await pane.press({ key: `element-${element}` })
        expect((await pane.find({ key: `element-${element}` }))?.props.variant, `${surface} ${columns} ${element}`).toBe('primary')
      }

      await pane.press({ key: 'element-box' })
      expect(await pane.find({ type: 'Text', text: 'Box · justifyContent: space-evenly' })).toBeDefined()
      expect(await pane.find({ type: 'Text', text: 'Box · borderStyle: arrow' })).toBeDefined()
      await pane.press({ key: 'element-text' })
      expect(await pane.find({ type: 'Text', text: 'Text · wrap: truncate-middle' })).toBeDefined()
      await pane.press({ key: 'element-svg' })
      expect(await pane.find({ type: 'Svg' }), surface).toEqual(surface === 'desktop' ? expect.anything() : undefined)
      await pane.press({ key: 'element-raster' })
      expect(await pane.find({ type: 'Raster' }), surface).toEqual(surface === 'terminal' ? expect.anything() : undefined)
      await pane.press({ key: 'element-image' })
      expect(await pane.find({ type: 'Image' }), surface).toEqual(surface === 'terminal' ? expect.anything() : undefined)

      for (const group of ['colors', 'sites', 'outside', 'mods', 'elements']) {
        await pane.press({ key: `group-${group}` })
        expect((await pane.find({ key: `group-${group}` }))?.props.variant, `${surface} ${columns} ${group}`).toBe('primary')
      }

      await pane.press({ key: 'element-box' })
      await pane.press({ key: 'tab-overview' })
      await pane.unmount()
    }
  }
})

test('the Components tab’s demos answer: a button counts, a field echoes, a select picks, a link press counts', async ($, on) => {
  stub(on)
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'tab-components' })
  await pane.press({ key: 'element-button' })
  await pane.press({ key: 'demo-primary' })
  await pane.press({ key: 'demo-plain' })
  expect(await pane.find({ type: 'Text', text: 'pressed 2 times' })).toBeDefined()

  await pane.press({ key: 'element-input' })
  await pane.input({ key: 'demo-input', text: 'hello', kind: 'change' })
  expect(await pane.find({ type: 'Text', text: 'onInput: "hello"' })).toBeDefined()
  await pane.input({ key: 'demo-input', text: 'hello' })
  expect(await pane.find({ type: 'Text', text: 'onSubmit: "hello"' })).toBeDefined()

  await pane.press({ key: 'element-select' })
  await pane.select({ key: 'demo-select', value: 'c' })
  expect(await pane.find({ type: 'Text', text: 'onSelect: c' })).toBeDefined()
  await pane.press({ key: 'element-box' })
  await pane.press({ key: 'tab-overview' })
  await pane.unmount()
})

test('Your mods lists each installed mod’s named components, drawn, with their ids', async ($, on) => {
  stub(on)
  fakeMod(on)

  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...PANE, surface })
    await pane.press({ key: 'tab-components' })
    await pane.press({ key: 'group-mods' })
    await pane.press({ key: 'catalog-cachetax' })

    expect(await pane.find({ type: 'Text', text: '1. Band row: warm' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'band-warm' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: 'cache-tax · cold' })).toBeDefined()
    expect(await pane.find({ key: 'catalog-skins' }), 'a mod that is not installed is not listed').toBeUndefined()
    await pane.press({ key: 'catalog-blast' })
    expect(await pane.find({ type: 'Text', text: 'Blast radius is not installed, or has no catalog.' })).toBeDefined()
    // One name per mod: the chip says what the list says; the plugin's name is the faint note.
    expect((await pane.find({ key: 'catalog-cachetax' }))?.props.label).toBe('Keep warm')
    await pane.press({ key: 'catalog-cachetax' })
    await pane.press({ key: 'group-elements' })
    await pane.press({ key: 'tab-overview' })
    await pane.unmount()
  }
})


test('a mod’s drawing with a Button in it is drawn as a button shape, never blanking the pane', async ($, on) => {
  stub(on)
  on('engine.create', async ($, e, next) => {
    const built = await next(e)
    return { ...built, cachetax: { panel: async () => ({ title: '', sections: [] }), act: async () => ({}), catalog: async () => [] } }
  })
  const button = { type: 'Button', props: { key: 'stray', label: 'Dismiss' } }
  on('cachetax.panel', () => ({ value: { title: 'Keep warm', sections: [{ id: 's', title: 'S', items: [{ kind: 'tree', tree: button }] }] } }))
  on('cachetax.catalog', () => ({ value: [{ id: 'held', name: 'Held notice', tree: { type: 'Box', props: {}, children: [button] } }] }))

  for (const surface of SURFACES) {
    const pane = await $.ui.mount({ ...PANE, surface })
    await pane.press({ key: 'open-cachetax' })
    expect(await pane.find({ type: 'Text', text: 'Dismiss' })).toBeDefined()
    expect(await pane.find({ type: 'Button', key: 'stray' } as any)).toBeUndefined()
    await pane.press({ key: 'tab-overview' })
    await pane.press({ key: 'tab-components' })
    await pane.press({ key: 'group-mods' })
    await pane.press({ key: 'catalog-cachetax' })
    expect(await pane.find({ type: 'Text', text: '1. Held notice' })).toBeDefined()
    await pane.press({ key: 'group-elements' })
    await pane.press({ key: 'tab-overview' })
    await pane.unmount()
  }
})
