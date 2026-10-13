import type { ModsLang } from '../types'

// Every word the hub draws itself; a mod's tab brings its own words in the language asked.
export type HubStrings = {
  title: string
  overview: string
  settings: string
  components: string
  toast: string
  status: (time: string) => string
  open: string
  on: string
  off: string
  language: string
  languageHelp: string
  overviewHelp: string
  noMods: string
  failed: (error: string) => string
  missing: (names: string) => string
  footer: string
  command: string
}

const en: HubStrings = {
  title: 'Mods',
  overview: 'Overview',
  settings: 'Settings',
  components: 'Components',
  toast: 'This is a toast: $.ui.toast(text)',
  status: time => `mods: $.ui.status set at ${time}`,
  open: 'Open',
  on: 'on',
  off: 'off',
  language: 'Language',
  languageHelp: 'The language of this pane and of every mod tab that speaks it',
  overviewHelp: 'Every installed mod at a glance. Open one to change it.',
  noMods: 'No mod that joins this pane is installed.',
  failed: error => `This mod could not draw its tab: ${error}`,
  missing: names => `Not installed: ${names}`,
  footer: 'Esc closes · Tab and the arrows move · the digits switch tabs',
  command: 'Open the mods pane: every installed mod in one place',
}

const pt: HubStrings = {
  title: 'Mods',
  overview: 'Visão geral',
  settings: 'Ajustes',
  components: 'Componentes',
  toast: 'Isto é um toast: $.ui.toast(texto)',
  status: time => `mods: $.ui.status definido às ${time}`,
  open: 'Abrir',
  on: 'ligado',
  off: 'desligado',
  language: 'Idioma',
  languageHelp: 'O idioma deste painel e de cada aba de mod que o fala',
  overviewHelp: 'Todos os mods instalados de relance. Abra um para mudar.',
  noMods: 'Nenhum mod que entra neste painel está instalado.',
  failed: error => `Este mod não conseguiu desenhar a aba: ${error}`,
  missing: names => `Não instalados: ${names}`,
  footer: 'Esc fecha · Tab e as setas navegam · os números trocam de aba',
  command: 'Abre o painel de mods: todos os mods instalados num lugar só',
}

export const HUB_STRINGS: Readonly<Record<ModsLang, HubStrings>> = { en, pt }
