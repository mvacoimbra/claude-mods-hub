import type { ModsLang } from '../types'

// Every word the hub draws itself; a mod's view brings its own words in the language asked.
export type HubStrings = {
  title: string
  settings: string
  components: string
  componentsHelp: string
  settingsHelp: string
  toast: string
  status: (time: string) => string
  open: string
  allMods: string
  installed: string
  oneMod: string
  manyMods: (count: number) => string
  more: string
  on: string
  off: string
  turnOn: string
  turnOff: string
  apply: string
  choose: string
  general: string
  language: string
  languageHelp: string
  scopeTitle: string
  scopeUser: string
  scopeUserHelp: string
  scopeSession: string
  scopeSessionHelp: string
  sessionOnly: string
  keysTitle: string
  noMods: string
  noModsHint: string
  nothingToSet: string
  couldNotDraw: string
  failed: (error: string) => string
  missing: (names: string) => string
  footer: string
  command: string
}

const en: HubStrings = {
  title: 'Mods',
  settings: 'Settings',
  components: 'Components',
  componentsHelp: 'Every element a mod can draw, and each mod’s named parts',
  settingsHelp: 'Language, and where settings are kept',
  toast: 'This is a toast: $.ui.toast(text)',
  status: time => `mods: $.ui.status set at ${time}`,
  open: 'Open',
  allMods: 'All mods',
  installed: 'Installed',
  oneMod: '1 mod',
  manyMods: count => `${count} mods`,
  more: 'More',
  on: 'On',
  off: 'Off',
  turnOn: 'Turn on',
  turnOff: 'Turn off',
  apply: 'Apply',
  choose: 'Choose…',
  general: 'General',
  language: 'Language',
  languageHelp: 'For this pane and every mod view that speaks it',
  scopeTitle: 'Where settings live',
  scopeUser: 'Your settings',
  scopeUserHelp: 'Saved for your user: the same in every session and project, and picked up by open sessions within seconds',
  scopeSession: 'This session',
  scopeSessionHelp: 'A few things only make sense for the session they run in, such as keeping its prompt cache warm. They are marked “this session only”.',
  sessionOnly: 'this session only',
  keysTitle: 'Keys',
  noMods: 'No mod that joins this pane is installed.',
  noModsHint: 'Install one from the claude-mods marketplace and it shows up here.',
  nothingToSet: 'Nothing to set here.',
  couldNotDraw: 'could not draw',
  failed: error => `This mod could not draw its view: ${error}`,
  missing: names => `Not installed: ${names}`,
  footer: 'Esc closes · Tab and the arrows move · 1–9 open a mod · 0 goes back',
  command: 'Open the mods pane: every installed mod in one place',
}

const pt: HubStrings = {
  title: 'Mods',
  settings: 'Ajustes',
  components: 'Componentes',
  componentsHelp: 'Cada elemento que um mod desenha, e as peças nomeadas de cada mod',
  settingsHelp: 'Idioma, e onde os ajustes ficam guardados',
  toast: 'Isto é um toast: $.ui.toast(texto)',
  status: time => `mods: $.ui.status definido às ${time}`,
  open: 'Abrir',
  allMods: 'Todos os mods',
  installed: 'Instalados',
  oneMod: '1 mod',
  manyMods: count => `${count} mods`,
  more: 'Mais',
  on: 'Ligado',
  off: 'Desligado',
  turnOn: 'Ligar',
  turnOff: 'Desligar',
  apply: 'Aplicar',
  choose: 'Escolher…',
  general: 'Geral',
  language: 'Idioma',
  languageHelp: 'Deste painel e de cada mod que o fala',
  scopeTitle: 'Onde os ajustes ficam',
  scopeUser: 'Seus ajustes',
  scopeUserHelp: 'Guardados para o seu usuário: iguais em toda sessão e projeto, e as sessões abertas pegam a mudança em segundos',
  scopeSession: 'Esta sessão',
  scopeSessionHelp: 'Algumas coisas só fazem sentido na sessão em que rodam, como manter o cache dela aquecido. Elas vêm marcadas “só nesta sessão”.',
  sessionOnly: 'só nesta sessão',
  keysTitle: 'Teclas',
  noMods: 'Nenhum mod que entra neste painel está instalado.',
  noModsHint: 'Instale um pelo marketplace claude-mods e ele aparece aqui.',
  nothingToSet: 'Nada para ajustar aqui.',
  couldNotDraw: 'não desenhou',
  failed: error => `Este mod não conseguiu desenhar a tela: ${error}`,
  missing: names => `Não instalados: ${names}`,
  footer: 'Esc fecha · Tab e as setas navegam · 1–9 abrem um mod · 0 volta',
  command: 'Abre o painel de mods: todos os mods instalados num lugar só',
}

export const HUB_STRINGS: Readonly<Record<ModsLang, HubStrings>> = { en, pt }
