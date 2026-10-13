import type { ElementTable, RenderElement, RenderSurface } from 'claude-code'

import type { ModsCatalogEntry, ModsLang } from '../types'
import type { DemoClientProps } from './demo-client'

// The elements every pane surface draws, and the ones only some do.
export type DemoUi = Pick<ElementTable<'desktop'>, 'Box' | 'Text' | 'Button' | 'Input' | 'Select' | 'Link' | 'Code' | 'Markdown'> & {
  Svg?: ElementTable<'desktop'>['Svg']
  Client?: ElementTable<'desktop'>['Client']
  Raster?: ElementTable<'terminal'>['Raster']
  Image?: ElementTable<'terminal'>['Image']
}

export type DemoState = {
  group: string
  element: string
  mod: string
  clicks: number
  typed: string
  submitted: string
  picked: string
  links: number
}

export const DEMO_START: DemoState = { group: 'elements', element: 'box', mod: '', clicks: 0, typed: '', submitted: '', picked: 'b', links: 0 }

export type DemoActions = {
  group: (id: string) => void
  element: (id: string) => void
  mod: (noun: string) => void
  click: () => void
  type: (value: string) => void
  submit: (value: string) => void
  pick: (value: string) => void
  link: () => void
  toast: () => void
  notify: () => void
  ask: () => void
  status: () => void
  copy: () => void
}

// A mod's catalog as the hub loaded it for the open Mods section.
export type DemoCatalog = { noun: string; name: string; entries: readonly ModsCatalogEntry[] | null; failed?: string }

const GROUPS = ['elements', 'colors', 'sites', 'outside', 'mods'] as const
const ELEMENTS = ['box', 'text', 'button', 'input', 'select', 'link', 'code', 'markdown', 'svg', 'raster', 'image', 'client'] as const

// The colours a tree may name by meaning; each follows the person's theme.
const THEME_KEYS = [
  'text', 'inverseText', 'inactive', 'subtle', 'suggestion', 'remember', 'success', 'error', 'warning', 'merged', 'claude',
  'permission', 'planMode', 'autoAccept', 'promptBorder', 'bashBorder', 'ide', 'diffAdded', 'diffRemoved', 'diffAddedDimmed',
  'diffRemovedDimmed', 'diffAddedWord', 'diffRemovedWord',
] as const

const SITES = [
  'Pane', 'AbovePrompt', 'UserMessage', 'AssistantMessage', 'ToolUse', 'ToolResult', 'ToolGroup', 'ToolProgress', 'CommandOutput',
  'Spinner', 'TurnDuration', 'InfoNotice', 'SessionMode', 'PromptHint', 'AskUserQuestion',
] as const

type Site = (typeof SITES)[number]

const BORDERS = ['single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'arrow'] as const
const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] as const
const ALIGN = ['flex-start', 'center', 'flex-end', 'stretch'] as const
const WRAPS = ['wrap', 'end', 'middle', 'truncate', 'truncate-start', 'truncate-middle', 'truncate-end'] as const

type Words = {
  intro: string
  groups: Record<(typeof GROUPS)[number], string>
  notHere: (surface: string, surfaces: string) => string
  helps: Record<(typeof ELEMENTS)[number], string>
  hoverMe: string
  card: string
  wrapSample: string
  pressed: (n: number) => string
  typed: (v: string) => string
  submitted: (v: string) => string
  picked: (v: string) => string
  linkPresses: (n: number) => string
  autoFocusNote: string
  actionNote: string
  pngNote: string
  clientHint: string
  colorsHelp: string
  sitesHelp: string
  sites: Record<Site, string>
  outside: { help: string; rows: readonly [string, string][]; try: string; toast: string; notify: string; ask: string; askQuestion: string; status: string; copy: string }
  mods: { help: string; none: string; noCatalog: (name: string) => string; failed: (e: string) => string; count: (n: number) => string }
}

const en: Words = {
  intro: 'Everything a mod can draw or do, live on this surface and named, so you can point at any of it when asking for a change.',
  groups: { elements: 'Elements', colors: 'Colors', sites: 'Sites', outside: 'Outside a drawing', mods: 'Your mods' },
  notHere: (surface, surfaces) => `Not drawn on the ${surface} surface. Only on: ${surfaces}.`,
  helps: {
    box: 'The flex container every layout is made of',
    text: 'A run of text and its styles',
    button: 'A control whose press runs code in the mod',
    input: 'A text field',
    select: 'One of several options',
    link: 'A hyperlink',
    code: 'Source code with highlighting, or a diff',
    markdown: 'Markdown drawn the way Claude Code draws a reply',
    svg: 'A vector image from an SVG string',
    raster: 'A box of cells, each a glyph with its own colours',
    image: 'A picture over a box of cells',
    client: "A region drawn by the mod's own surface module",
  },
  hoverMe: 'point at this',
  card: 'a card shown on hover',
  wrapSample: 'The quick brown fox jumps over the lazy dog, then keeps running well past the end of the box it was given.',
  pressed: n => `pressed ${n} time${n === 1 ? '' : 's'}`,
  typed: v => `onInput: "${v}"`,
  submitted: v => `onSubmit: "${v}"`,
  picked: v => `onSelect: ${v}`,
  linkPresses: n => `onLinkPress: ${n}`,
  autoFocusNote: 'autoFocus: true puts the keyboard on this control when the site takes the keys (not drawn here, so it does not steal focus).',
  actionNote: 'action: "app:<binding>" presses the button with the person’s own chord for an engine keybinding.',
  pngNote: 'source: { png } takes a whole PNG file in base64; { rgba, width, height } takes raw pixels (shown).',
  clientHint: 'point at this line',
  colorsHelp: 'Theme keys follow the person’s theme; any hex (#rrggbb) works too, in color, backgroundColor, borderColor.',
  sitesHelp: 'A ui.render hook matches one of these components and draws its own tree, or passes. Pane is the one a mod opens itself.',
  sites: {
    Pane: 'a pane like this one: docked beside the transcript, or above the prompt',
    AbovePrompt: 'the band above the prompt',
    UserMessage: 'your messages, task notifications, messages from other agents',
    AssistantMessage: 'each block of Claude’s reply',
    ToolUse: 'a tool call’s row',
    ToolResult: 'a tool call’s answer',
    ToolGroup: 'a run of folded tool calls',
    ToolProgress: 'a running tool’s progress row',
    CommandOutput: 'a slash command’s output',
    Spinner: 'the spinner row while Claude works',
    TurnDuration: 'the line that closes a turn (terminal)',
    InfoNotice: 'the dim lines under the logo (terminal)',
    SessionMode: 'the mode labels in the prompt footer',
    PromptHint: 'the hint line under the prompt',
    AskUserQuestion: 'the dialog the AskUserQuestion tool opens',
  },
  outside: {
    help: 'What a mod does without drawing a tree, from any hook.',
    rows: [
      ['$.ui.toast(text)', 'a passing notice'],
      ['$.ui.notify(text, { title })', 'a system notification'],
      ['$.ui.ask(question, options)', 'a question dialog; resolves to the answer'],
      ['$.ui.status(text)', 'an entry in the status line; undefined clears it'],
      ['$.ui.copy({ text })', 'puts text on the clipboard'],
      ['$.ui.open / close / panes / focus / scroll', 'open, close, list, focus and scroll panes'],
      ['$.ui.selection()', 'the text the person selected'],
      ['$.ui.blit(...)', 'repaint a Raster in place, without a render pass'],
      ['$.ui.notice(toolUseId, text)', 'context on a permission prompt'],
      ['$.ui.log(text)', 'a dim line in the transcript, or the debug log'],
      ['$.ui.invalidate(event)', 'ask for a redraw'],
      ['$.audio.play / speak', 'play a sound file of the mod, or speak text'],
    ],
    try: 'Try them',
    toast: 'toast',
    notify: 'notify',
    ask: 'ask',
    askQuestion: 'Which part should change?',
    status: 'status',
    copy: 'copy',
  },
  mods: {
    help: 'Every component your mods draw, by name and id: say "the <id> of <mod>" to ask for a change. Buttons show as their label here.',
    none: 'No installed mod has a catalog.',
    noCatalog: name => `${name} is not installed, or has no catalog.`,
    failed: e => `This catalog could not be drawn: ${e}`,
    count: n => `${n} component${n === 1 ? '' : 's'}`,
  },
}

const pt: Words = {
  intro: 'Tudo que um mod pode desenhar ou fazer, ao vivo nesta superfície e com nome, para você apontar qualquer coisa ao pedir uma mudança.',
  groups: { elements: 'Elementos', colors: 'Cores', sites: 'Lugares', outside: 'Fora do desenho', mods: 'Seus mods' },
  notHere: (surface, surfaces) => `Não é desenhado na superfície ${surface}. Só em: ${surfaces}.`,
  helps: {
    box: 'O contêiner flex de que todo layout é feito',
    text: 'Um trecho de texto e seus estilos',
    button: 'Um controle cujo clique roda código no mod',
    input: 'Um campo de texto',
    select: 'Uma entre várias opções',
    link: 'Um hyperlink',
    code: 'Código com realce, ou um diff',
    markdown: 'Markdown desenhado como o Claude Code desenha uma resposta',
    svg: 'Uma imagem vetorial a partir de uma string SVG',
    raster: 'Uma caixa de células, cada uma com um caractere e as próprias cores',
    image: 'Uma imagem sobre uma caixa de células',
    client: 'Uma região desenhada pelo módulo de superfície do próprio mod',
  },
  hoverMe: 'aponte aqui',
  card: 'um card que aparece no hover',
  wrapSample: 'A raposa marrom pula sobre o cachorro preguiçoso e continua correndo bem além do fim da caixa que recebeu.',
  pressed: n => `apertado ${n} vez${n === 1 ? '' : 'es'}`,
  typed: v => `onInput: "${v}"`,
  submitted: v => `onSubmit: "${v}"`,
  picked: v => `onSelect: ${v}`,
  linkPresses: n => `onLinkPress: ${n}`,
  autoFocusNote: 'autoFocus: true põe o teclado neste controle quando o lugar recebe as teclas (não desenhado aqui, para não roubar o foco).',
  actionNote: 'action: "app:<atalho>" aperta o botão com o atalho da própria pessoa para uma ação do Claude Code.',
  pngNote: 'source: { png } recebe um arquivo PNG inteiro em base64; { rgba, width, height } recebe pixels crus (mostrado).',
  clientHint: 'aponte para esta linha',
  colorsHelp: 'As chaves do tema seguem o tema da pessoa; qualquer hex (#rrggbb) também funciona, em color, backgroundColor, borderColor.',
  sitesHelp: 'Um hook ui.render escolhe um destes componentes e desenha a própria árvore, ou passa adiante. Pane é o único que o mod abre sozinho.',
  sites: {
    Pane: 'um painel como este: ao lado da conversa, ou acima do prompt',
    AbovePrompt: 'a faixa acima do prompt',
    UserMessage: 'suas mensagens, avisos de tarefas, mensagens de outros agentes',
    AssistantMessage: 'cada bloco da resposta do Claude',
    ToolUse: 'a linha de uma chamada de ferramenta',
    ToolResult: 'a resposta de uma chamada de ferramenta',
    ToolGroup: 'um grupo de chamadas dobradas',
    ToolProgress: 'a linha de progresso de uma ferramenta rodando',
    CommandOutput: 'a saída de um comando de barra',
    Spinner: 'a linha do spinner enquanto o Claude trabalha',
    TurnDuration: 'a linha que fecha um turno (terminal)',
    InfoNotice: 'as linhas discretas sob o logo (terminal)',
    SessionMode: 'os rótulos de modo no rodapé do prompt',
    PromptHint: 'a linha de dica sob o prompt',
    AskUserQuestion: 'o diálogo que a ferramenta AskUserQuestion abre',
  },
  outside: {
    help: 'O que um mod faz sem desenhar uma árvore, de qualquer hook.',
    rows: [
      ['$.ui.toast(texto)', 'um aviso passageiro'],
      ['$.ui.notify(texto, { title })', 'uma notificação do sistema'],
      ['$.ui.ask(pergunta, opções)', 'um diálogo de pergunta; devolve a resposta'],
      ['$.ui.status(texto)', 'um item na linha de status; undefined limpa'],
      ['$.ui.copy({ text })', 'põe texto na área de transferência'],
      ['$.ui.open / close / panes / focus / scroll', 'abrir, fechar, listar, focar e rolar painéis'],
      ['$.ui.selection()', 'o texto que a pessoa selecionou'],
      ['$.ui.blit(...)', 'repintar um Raster no lugar, sem redesenhar'],
      ['$.ui.notice(toolUseId, texto)', 'contexto num pedido de permissão'],
      ['$.ui.log(texto)', 'uma linha discreta na conversa, ou no log de debug'],
      ['$.ui.invalidate(evento)', 'pedir um redesenho'],
      ['$.audio.play / speak', 'tocar um arquivo de som do mod, ou falar um texto'],
    ],
    try: 'Experimente',
    toast: 'toast',
    notify: 'notificar',
    ask: 'perguntar',
    askQuestion: 'Qual parte deve mudar?',
    status: 'status',
    copy: 'copiar',
  },
  mods: {
    help: 'Cada componente que os seus mods desenham, com nome e id: diga "o <id> do <mod>" para pedir uma mudança. Botões aparecem aqui como o rótulo.',
    none: 'Nenhum mod instalado tem catálogo.',
    noCatalog: name => `${name} não está instalado, ou não tem catálogo.`,
    failed: e => `Este catálogo não pôde ser desenhado: ${e}`,
    count: n => `${n} componente${n === 1 ? '' : 's'}`,
  },
}

export const DEMO_WORDS: Readonly<Record<ModsLang, Words>> = { en, pt }

const SVG_DEMO = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64">
<rect x="1" y="1" width="238" height="62" rx="10" fill="none" stroke="#8c8c8c"/>
<circle cx="32" cy="32" r="16" fill="none" stroke="#d97757" stroke-width="6" stroke-dasharray="70 101" transform="rotate(-90 32 32)"/>
<text x="62" y="28" font-family="sans-serif" font-size="13" fill="#d97757">42% context</text>
<rect x="62" y="38" width="160" height="8" rx="4" fill="#8c8c8c" opacity="0.3"/><rect x="62" y="38" width="67" height="8" rx="4" fill="#d97757"/>
</svg>`

const SVG_HOVER = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48" viewBox="0 0 240 48">
<style>rect{fill:#7aa2f7;transition:fill .2s}rect:hover{fill:#d97757}</style>
<rect x="4" y="8" width="70" height="32" rx="6"><title>hover: CSS :hover and a tooltip</title></rect>
<rect x="84" y="8" width="70" height="32" rx="6"><title>second</title></rect>
<rect x="164" y="8" width="70" height="32" rx="6"><title>third</title></rect>
</svg>`

const toBase64 = (bytes: Uint8Array): string => (bytes as unknown as { toBase64: () => string }).toBase64()

// A two-row gradient of half blocks: each cell's foreground paints its top half, its background the bottom.
function rasterCells(columns: number): string {
  const words: number[] = []
  const shade = (t: number, phase: number) => Math.round(127 + 127 * Math.sin(t * Math.PI * 2 + phase))

  for (let row = 0; row < 2; row++) {
    for (let x = 0; x < columns; x++) {
      const t = (x + row * columns * 0.5) / columns
      const top = (shade(t, 0) << 16) | (shade(t, 2) << 8) | shade(t, 4)
      const bottom = (shade(t + 0.25, 0) << 16) | (shade(t + 0.25, 2) << 8) | shade(t + 0.25, 4)
      words.push(0x2580, top, bottom)
    }
  }

  return toBase64(new Uint8Array(Uint32Array.from(words).buffer))
}

// A small RGBA gradient, `width` by `height` pixels.
function imagePixels(width: number, height: number): string {
  const bytes = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      bytes[i] = Math.round((255 * x) / (width - 1))
      bytes[i + 1] = Math.round((255 * y) / (height - 1))
      bytes[i + 2] = 200
      bytes[i + 3] = 255
    }
  }

  return toBase64(bytes)
}

// The Components tab of /mods: every element with every prop, the colours, the sites, what a mod
// does outside a drawing, and the named components of each installed mod.
export function componentsTab(
  ui: DemoUi,
  surface: RenderSurface,
  columns: number,
  lang: ModsLang,
  state: DemoState,
  actions: DemoActions,
  mods: readonly { noun: string; name: string }[],
  catalog: DemoCatalog | null,
): RenderElement {
  const { Box, Text, Button, Input, Select, Link, Code, Markdown } = ui
  const w = DEMO_WORDS[lang]
  const group = GROUPS.find(id => id === state.group) ?? 'elements'
  const element = ELEMENTS.find(id => id === state.element) ?? 'box'
  const inner = Math.max(24, columns - 6)
  const chip = (label: string) => (
    <Box key={`chip-${label}`} borderStyle="round" borderColor="subtle" paddingX={1}>
      <Text>{label}</Text>
    </Box>
  )

  // One prop in one value, named the way to ask for it: `Box · justifyContent: center`.
  const demo = (name: string, sample: RenderElement) => (
    <Box key={`demo-${name}`} flexDirection="column">
      <Text color="claude">{name}</Text>
      <Box paddingLeft={2} flexDirection="column">
        {sample}
      </Box>
    </Box>
  )
  const note = (text: string) => (
    <Text key={`note-${text.slice(0, 24)}`} color="subtle">
      {text}
    </Text>
  )
  const picker = (prefix: string, ids: readonly string[], open: string, labels: (id: string) => string, press: (id: string) => void) => (
    <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
      {ids.map(id => (
        <Button key={`${prefix}-${id}`} plain dimColor={id !== open} label={`${id === open ? '●' : '○'} ${labels(id)}`} onPress={() => press(id)} />
      ))}
    </Box>
  )

  const elementBody = (): RenderElement[] => {
    switch (element) {
      case 'box':
        return [
          ...(['row', 'column', 'row-reverse', 'column-reverse'] as const).map(direction =>
            demo(`Box · flexDirection: ${direction}`, <Box flexDirection={direction} columnGap={1}>{['1', '2', '3'].map(chip)}</Box>),
          ),
          ...JUSTIFY.map(justify =>
            demo(`Box · justifyContent: ${justify}`, <Box flexDirection="row" justifyContent={justify} width={Math.min(inner, 48)} borderStyle="single" borderColor="subtle">{['a', 'b', 'c'].map(chip)}</Box>),
          ),
          ...ALIGN.map(align =>
            demo(`Box · alignItems: ${align}`, (
              <Box flexDirection="row" alignItems={align} columnGap={1} height={5} borderStyle="single" borderColor="subtle">
                {chip('short')}
                <Box borderStyle="round" borderColor="subtle" paddingX={1} paddingY={1}>
                  <Text>tall</Text>
                </Box>
              </Box>
            )),
          ),
          demo('Box · alignSelf: center', <Box flexDirection="row" height={5} borderStyle="single" borderColor="subtle"><Box alignSelf="center">{chip('self')}</Box>{chip('rest')}</Box>),
          demo('Box · flexWrap: wrap', <Box flexDirection="row" flexWrap="wrap" columnGap={1} width={Math.min(inner, 30)}>{['one', 'two', 'three', 'four', 'five', 'six'].map(chip)}</Box>),
          demo('Box · flexWrap: nowrap', <Box flexDirection="row" flexWrap="nowrap" columnGap={1} width={Math.min(inner, 30)} overflow="hidden">{['one', 'two', 'three', 'four', 'five', 'six'].map(chip)}</Box>),
          demo('Box · flexGrow: 1 (middle)', <Box flexDirection="row" width={Math.min(inner, 48)}>{chip('fixed')}<Box flexGrow={1} borderStyle="round" borderColor="claude"><Text>grows</Text></Box>{chip('fixed')}</Box>),
          demo('Box · flexShrink: 0 / 1', <Box flexDirection="row" width={Math.min(inner, 30)}><Box flexShrink={0}><Text>flexShrink 0 keeps its width</Text></Box><Box flexShrink={1}><Text wrap="truncate-end">flexShrink 1 gives way</Text></Box></Box>),
          demo('Box · gap / columnGap / rowGap', <Box flexDirection="row" flexWrap="wrap" columnGap={4} rowGap={1} width={Math.min(inner, 40)}>{['a', 'b', 'c', 'd', 'e', 'f'].map(chip)}</Box>),
          demo('Box · padding / paddingX / paddingY', <Box borderStyle="single" borderColor="subtle" paddingX={4} paddingY={1}><Text>paddingX 4, paddingY 1</Text></Box>),
          demo('Box · margin / marginX / marginY / marginTop / marginLeft', <Box borderStyle="single" borderColor="subtle"><Box marginLeft={6} marginY={1}><Text>marginLeft 6, marginY 1</Text></Box></Box>),
          demo('Box · width / height (number)', <Box width={20} height={3} borderStyle="single" borderColor="subtle"><Text>20 × 3</Text></Box>),
          demo('Box · width: "50%"', <Box width="50%" borderStyle="single" borderColor="subtle"><Text>50%</Text></Box>),
          demo('Box · minWidth / minHeight', <Box minWidth={24} minHeight={3} borderStyle="single" borderColor="subtle"><Text>min 24 × 3</Text></Box>),
          ...BORDERS.map(style => demo(`Box · borderStyle: ${style}`, <Box borderStyle={style} paddingX={1}><Text>{style}</Text></Box>)),
          demo('Box · borderColor', <Box borderStyle="round" borderColor="#d97757" paddingX={1}><Text>borderColor="#d97757"</Text></Box>),
          demo('Box · borderDimColor', <Box borderStyle="round" borderDimColor paddingX={1}><Text>borderDimColor</Text></Box>),
          demo('Box · backgroundColor', <Box backgroundColor="#2f3b52" paddingX={2}><Text color="#e6edf3">backgroundColor="#2f3b52"</Text></Box>),
          demo('Box · overflow: hidden', <Box width={16} overflow="hidden" borderStyle="single" borderColor="subtle"><Text wrap="truncate">{w.wrapSample}</Text></Box>),
          demo('Box · key + hover: { backgroundColor }', <Box key="hover-bg" paddingX={1} hover={{ backgroundColor: '#3b3d41' }}><Text hover={{ color: 'claude', bold: true }}>{`▸ ${w.hoverMe}`}</Text></Box>),
          demo('Box · key + hover: { borderColor }', <Box key="hover-border" borderStyle="round" borderColor="subtle" paddingX={1} hover={{ borderColor: 'claude' }}><Text>{w.hoverMe}</Text></Box>),
          demo('Box · hover: { scope } (a group lit together)', (
            <Box flexDirection="row" columnGap={2}>
              <Box paddingX={1} hover={{ scope: 'demo-scope', backgroundColor: '#3b3d41' }}><Text>{w.hoverMe}</Text></Box>
              <Box paddingX={1} hover={{ scope: 'demo-scope', backgroundColor: '#3b3d41' }}><Text>…and this lights too</Text></Box>
            </Box>
          )),
          demo('Box · position: absolute + top/left + display: none + hover: { display: flex }', (
            <Box key="reveal" flexDirection="column">
              <Text>{`▸ ${w.hoverMe}`}</Text>
              <Box position="absolute" top={-1} left={16} display="none" hover={{ display: 'flex' }} backgroundColor="#6b7280" paddingX={1}>
                <Text color="#ffffff">{w.card}</Text>
              </Box>
            </Box>
          )),
        ]
      case 'text':
        return [
          ...(['bold', 'italic', 'underline', 'strikethrough', 'inverse', 'dimColor'] as const).map(style =>
            demo(`Text · ${style}`, <Text {...{ [style]: true }}>{style}</Text>),
          ),
          demo('Text · color (hex)', <Text color="#d97757">color="#d97757"</Text>),
          demo('Text · color (theme key)', <Text color="success">color="success"</Text>),
          demo('Text · backgroundColor', <Text backgroundColor="#d97757" color="#ffffff">backgroundColor="#d97757"</Text>),
          demo('Text · inline Text inside Text', <Text>plain, <Text bold color="claude">bold accent</Text>, plain again</Text>),
          ...WRAPS.map(mode => demo(`Text · wrap: ${mode}`, <Box width={Math.min(inner, 40)}><Text wrap={mode}>{w.wrapSample}</Text></Box>)),
          demo('Text · hover: { color, bold, underline }', <Box key="text-hover"><Text hover={{ color: 'claude', bold: true, underline: true }}>{w.hoverMe}</Text></Box>),
        ]
      case 'button':
        return [
          demo('Button · label (default chrome)', <Button key="demo-default" label="label" onPress={actions.click} />),
          demo('Button · variant: primary', <Button key="demo-primary" label="primary" variant="primary" onPress={actions.click} />),
          demo('Button · variant: secondary', <Button key="demo-secondary" label="secondary" variant="secondary" onPress={actions.click} />),
          demo('Button · plain', <Button key="demo-plain" label="plain" plain onPress={actions.click} />),
          demo('Button · plain + dimColor', <Button key="demo-dim" label="dimColor" plain dimColor onPress={actions.click} />),
          demo('Button · hotkey: "z"', <Button key="demo-hotkey" label="hotkey z" hotkey="z" plain onPress={actions.click} />),
          demo('Button · role: dismiss', <Button key="demo-dismiss" label="dismiss" role="dismiss" onPress={actions.click} />),
          demo('Button · hover: { color } (inside a keyed Box)', <Box key="button-hover"><Button key="demo-hover" label="hover" plain hover={{ color: 'claude' }} onPress={actions.click} /></Box>),
          <Text key="pressed" color="success">{w.pressed(state.clicks)}</Text>,
          note(w.autoFocusNote),
          note(w.actionNote),
        ]
      case 'input':
        return [
          demo('Input · label + placeholder + submitLabel + onInput + onSubmit', (
            <Box flexDirection="column">
              <Input key="demo-input" label="label " placeholder="placeholder" value={state.typed} submitLabel="submitLabel" onInput={actions.type} onSubmit={actions.submit} />
              <Text color="subtle">{w.typed(state.typed)}</Text>
              <Text color="success">{w.submitted(state.submitted)}</Text>
            </Box>
          )),
          demo('Input · value (prefilled)', <Input key="demo-input-value" label="value " value="prefilled text" onSubmit={actions.submit} />),
          note(w.autoFocusNote),
        ]
      case 'select':
        return [
          demo('Select · label + options + value + onSelect', (
            <Box flexDirection="column">
              <Select key="demo-select" label="label" value={state.picked} options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]} onSelect={actions.pick} />
              <Text color="success">{w.picked(state.picked)}</Text>
            </Box>
          )),
          demo('Select · options without labels', <Select key="demo-select-bare" options={[{ value: 'one' }, { value: 'two' }]} value="one" onSelect={actions.pick} />),
          note(w.autoFocusNote),
        ]
      case 'link':
        return [
          demo('Link · href + label', <Link href="https://github.com/mvacoimbra/claude-mods" label="claude-mods on GitHub" />),
          demo('Link · href alone', <Link href="https://github.com/mvacoimbra/claude-mods-hub" />),
        ]
      case 'code':
        return [
          demo('Code · source + language: ts', <Code language="ts" source={"export const limit = (n: number) => n <= 10"} />),
          demo('Code · language: python', <Code language="python" source={'def limit(n: int) -> bool:\n    return n <= 10'} />),
          demo('Code · language: json', <Code language="json" source={'{ "name": "mods", "version": "0.3.0" }'} />),
          demo('Code · language: bash', <Code language="bash" source={'claude plugin install mods@claude-mods'} />),
          demo('Code · path + startLine', <Code language="ts" path="hooks/register.tsx" startLine={42} source={'on(\'session.start\', async ($, e, next) => next(e))'} />),
          demo('Code · format: diff', <Code format="diff" language="ts" source={'@@ -1,2 +1,2 @@\n-const limit = 10\n+const limit = 20\n export { limit }'} />),
          demo('Code · wrap: wrap', <Box width={Math.min(inner, 40)}><Code language="ts" wrap="wrap" source={'const message = "a line long enough that it has to wrap onto the next line"'} /></Box>),
          demo('Code · wrap: truncate-end', <Box width={Math.min(inner, 40)}><Code language="ts" wrap="truncate-end" source={'const message = "a line long enough that it has to wrap onto the next line"'} /></Box>),
        ]
      case 'markdown':
        return [
          demo('Markdown · text', <Markdown text={'### Heading\n\n- **bold**, *italic*, `code`, ~~strike~~\n- [a link](https://github.com/mvacoimbra/claude-mods)\n\n> a quote\n\n| Mod | Tab |\n|---|---|\n| cache-tax | Keep warm |\n\n```ts\nconst x = 1\n```'} />),
          demo('Markdown · dimColor', <Markdown text={'Dimmed **markdown**, for secondary text.'} dimColor />),
          demo('Markdown · pressableLinks + onLinkPress', (
            <Box flexDirection="column">
              <Markdown key="demo-markdown-links" text={'Press [this link](https://example.com/press) in the pane.'} pressableLinks={['https://example.com/press']} onLinkPress={actions.link} />
              <Text color="success">{w.linkPresses(state.links)}</Text>
            </Box>
          )),
        ]
      case 'svg':
        return ui.Svg === undefined
          ? [note(w.notHere(surface, 'desktop, vscode, mobile'))]
          : [
              demo('Svg · source + alt + width + height', <ui.Svg source={SVG_DEMO} alt="a sample ring and bar" width={240} height={64} />),
              demo('Svg · isInteractive (CSS :hover, <title> tooltips, SMIL)', <ui.Svg source={SVG_HOVER} alt="three boxes that light on hover" width={240} height={48} isInteractive />),
            ]
      case 'raster':
        return ui.Raster === undefined
          ? [note(w.notHere(surface, 'terminal'))]
          : [demo('Raster · columns + rows + cells', <ui.Raster key="demo-raster" columns={Math.min(48, inner)} rows={2} cells={rasterCells(Math.min(48, inner))} />)]
      case 'image':
        return ui.Image === undefined
          ? [note(w.notHere(surface, 'terminal'))]
          : [demo('Image · source: { rgba, width, height } + columns + rows + alt', <ui.Image key="demo-image" source={{ rgba: imagePixels(64, 16), width: 64, height: 16 }} columns={16} rows={2} alt="[a gradient]" />), note(w.pngNote)]
      case 'client':
        return ui.Client === undefined
          ? [note(w.notHere(surface, 'terminal, desktop'))]
          : [demo('Client · module + props (pointer events, its own state)', <ui.Client key="demo-client" module="./demo-client.tsx" props={{ hint: w.clientHint } satisfies DemoClientProps} />)]
    }
  }

  const body = (): RenderElement[] => {
    switch (group) {
      case 'elements':
        return [
          picker('element', ELEMENTS, element, id => id[0]!.toUpperCase() + id.slice(1), actions.element),
          note(w.helps[element]),
          ...elementBody(),
        ]
      case 'colors':
        return [
          note(w.colorsHelp),
          <Box key="colors-grid" flexDirection="row" flexWrap="wrap" columnGap={2}>
            {THEME_KEYS.map(key => (
              <Box key={`color-${key}`} flexDirection="row" columnGap={1} width={24}>
                <Text backgroundColor={key}>{'    '}</Text>
                <Text color={key}>{key}</Text>
              </Box>
            ))}
          </Box>,
        ]
      case 'sites':
        return [
          note(w.sitesHelp),
          <Box key="sites-list" flexDirection="column">
            {SITES.map(site => (
              <Box key={`site-${site}`} flexDirection="row" columnGap={2}>
                <Box width={18} flexShrink={0}>
                  <Text color="claude">{site}</Text>
                </Box>
                <Box flexShrink={1}>
                  <Text color="subtle">{w.sites[site]}</Text>
                </Box>
              </Box>
            ))}
          </Box>,
        ]
      case 'outside':
        return [
          note(w.outside.help),
          <Box key="outside-list" flexDirection="column">
            {w.outside.rows.map(([call, what]) => (
              <Box key={`outside-${call}`} flexDirection={columns >= 72 ? 'row' : 'column'} columnGap={2}>
                <Box width={columns >= 72 ? 40 : undefined} flexShrink={0}>
                  <Text color="claude">{call}</Text>
                </Box>
                <Box flexShrink={1}>
                  <Text color="subtle">{what}</Text>
                </Box>
              </Box>
            ))}
          </Box>,
          <Text key="outside-try" bold>
            {w.outside.try}
          </Text>,
          <Box key="outside-actions" flexDirection="row" flexWrap="wrap" columnGap={2}>
            <Button key="demo-toast" label={w.outside.toast} onPress={actions.toast} />
            <Button key="demo-notify" label={w.outside.notify} onPress={actions.notify} />
            <Button key="demo-ask" label={w.outside.ask} onPress={actions.ask} />
            <Button key="demo-status" label={w.outside.status} onPress={actions.status} />
            <Button key="demo-copy" label={w.outside.copy} onPress={actions.copy} />
          </Box>,
        ]
      case 'mods': {
        if (mods.length === 0) {
          return [note(w.mods.none)]
        }

        const open = catalog?.noun ?? mods[0]!.noun

        return [
          note(w.mods.help),
          picker('catalog', mods.map(mod => mod.noun), open, noun => mods.find(mod => mod.noun === noun)?.name ?? noun, actions.mod),
          ...(catalog === null || catalog.entries === null
            ? [note(catalog?.failed === undefined ? w.mods.noCatalog(catalog?.name ?? open) : w.mods.failed(catalog.failed))]
            : [
                note(w.mods.count(catalog.entries.length)),
                ...catalog.entries.map((entry, i) => (
                  <Box key={`catalog-${catalog.noun}-${entry.id}`} flexDirection="column">
                    <Text>
                      <Text bold color="claude">{`${i + 1}. ${entry.name}`}</Text>
                      <Text color="subtle">{`  id: ${entry.id}`}</Text>
                    </Text>
                    {entry.help === undefined ? null : <Text color="subtle">{entry.help}</Text>}
                    <Box paddingLeft={2} flexDirection="column">
                      {entry.tree as RenderElement}
                    </Box>
                  </Box>
                )),
              ]),
        ]
      }
    }
  }

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text color="subtle">{w.intro}</Text>
      {picker('group', GROUPS, group, id => w.groups[id as (typeof GROUPS)[number]], actions.group)}
      {body()}
    </Box>
  )
}
