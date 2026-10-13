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

    return { ...built, cachetax: { panel: async () => ({ title: '', sections: [] }), act: async () => ({}) } }
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
    expect(await pane.find({ key: 'tab-overview' })).toBeDefined()
    expect(await pane.find({ key: 'tab-settings' })).toBeDefined()
    expect(await pane.find({ key: 'tab-cachetax' })).toBeUndefined()
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
      expect((await pane.find({ key: 'tab-cachetax' }))?.props.label).toBe('Keep warm')
      expect(await pane.find({ type: 'Text', text: 'cold' })).toBeDefined()

      await pane.press({ key: 'open-cachetax' })
      for (const key of ['item-cachetax-always', 'item-cachetax-window-1h', 'item-cachetax-off', 'item-cachetax-custom', 'section-cachetax-guard']) {
        expect(await pane.find({ key }), `${surface} ${columns} ${key}`).toBeDefined()
      }

      await pane.press({ key: 'section-cachetax-colors' })
      expect(await pane.find({ key: 'item-cachetax-edit:user' })).toBeDefined()
      await pane.press({ key: 'section-cachetax-warm' })
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
  await pane.press({ key: 'tab-cachetax' })

  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('○ off')
  await pane.press({ key: 'item-cachetax-always' })
  expect(asked.acts.at(-1)).toEqual({ id: 'always', value: 'on' })
  expect((await pane.find({ key: 'item-cachetax-always' }))?.props.label).toBe('● on')

  await pane.press({ key: 'item-cachetax-window-6h' })
  expect(asked.acts.at(-1)).toEqual({ id: 'window', value: '6h' })
  // A row of one-shot choices marks none.
  expect((await pane.find({ key: 'item-cachetax-window-6h' }))?.props.label).toBe('6h')

  await pane.input({ key: 'item-cachetax-custom', text: ' 90m ' })
  expect(asked.acts.at(-1)).toEqual({ id: 'custom', value: '90m' })

  await pane.press({ key: 'item-cachetax-off' })
  expect(asked.acts.at(-1)).toEqual({ id: 'off' })
  expect(toasts).toEqual(['keep warm is off'])
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
  expect((await pane.find({ key: 'tab-overview' }))?.props.label).toBe('Visão geral')
  expect((await pane.find({ key: 'tab-cachetax' }))?.props.label).toBe('Manter aquecido')
  await pane.press({ key: 'item-mods-lang-en' })
  expect((await pane.find({ key: 'tab-overview' }))?.props.label).toBe('Overview')
  await pane.unmount()
})

test('a tab that counts down draws again on its own while it shows', async ($, on) => {
  const clock = stub(on)
  const asked = fakeMod(on)

  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'tab-cachetax' })
  const before = asked.panels.length
  await clock.advance(15_000)
  await clock.settle()

  expect(asked.panels.length).toBeGreaterThan(before)
  await pane.unmount()
})
