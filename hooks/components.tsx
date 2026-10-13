import type { ElementTable, RenderElement, RenderSurface } from 'claude-code'

import type { ModsLang } from '../types'
import type { DemoClientProps } from './demo-client'

// The elements every pane surface draws, and the ones only some do.
export type DemoUi = Pick<ElementTable<'desktop'>, 'Box' | 'Text' | 'Button' | 'Input' | 'Select' | 'Link' | 'Code' | 'Markdown'> & {
  Svg?: ElementTable<'desktop'>['Svg']
  Client?: ElementTable<'desktop'>['Client']
  Raster?: ElementTable<'terminal'>['Raster']
  Image?: ElementTable<'terminal'>['Image']
}

export type DemoState = { section: string; clicks: number; typed: string; submitted: string; picked: string }

export type DemoActions = {
  section: (id: string) => void
  click: () => void
  type: (value: string) => void
  submit: (value: string) => void
  pick: (value: string) => void
  toast: () => void
  status: () => void
}

export const DEMO_START: DemoState = { section: 'layout', clicks: 0, typed: '', submitted: '', picked: 'b' }

// The colours a tree may name by meaning; each follows the person's theme.
const THEME_KEYS = [
  'text', 'inverseText', 'inactive', 'subtle', 'suggestion', 'remember', 'success', 'error', 'warning', 'merged', 'claude',
  'permission', 'planMode', 'autoAccept', 'promptBorder', 'bashBorder', 'ide', 'diffAdded', 'diffRemoved', 'diffAddedDimmed',
  'diffRemovedDimmed', 'diffAddedWord', 'diffRemovedWord',
] as const

// Where a mod can draw, by the `component` a `ui.render` hook matches.
const SITES = [
  'Pane', 'AbovePrompt', 'UserMessage', 'AssistantMessage', 'ToolUse', 'ToolResult', 'ToolGroup', 'ToolProgress', 'CommandOutput',
  'Spinner', 'TurnDuration', 'InfoNotice', 'SessionMode', 'PromptHint', 'AskUserQuestion',
] as const

type Site = (typeof SITES)[number]

type Words = {
  intro: string
  sections: Record<'layout' | 'text' | 'controls' | 'content' | 'graphics' | 'colors' | 'sites', string>
  notHere: (surface: string) => string
  only: (surfaces: string) => string
  box: { name: string; help: string; row: string; column: string; borders: string; background: string; hover: string; hoverHelp: string; reveal: string; card: string }
  text: { name: string; help: string; styles: string; wrap: string; link: { name: string; help: string } }
  button: { name: string; help: string; plain: string; primary: string; secondary: string; dim: string; hotkey: string; pressed: (n: number) => string }
  input: { name: string; help: string; label: string; typed: (v: string) => string; submitted: (v: string) => string; submit: string }
  select: { name: string; help: string; label: string; picked: (v: string) => string }
  code: { name: string; help: string; diff: string }
  markdown: { name: string; help: string }
  svg: { name: string; help: string }
  raster: { name: string; help: string }
  image: { name: string; help: string }
  client: { name: string; help: string; hint: string }
  colors: { help: string }
  sites: { help: string; list: Record<Site, string>; other: string; toast: string; status: string }
}

const en: Words = {
  intro: 'Every element a mod can draw, live on this surface. Each shows its name, what it is for and a working example.',
  sections: { layout: 'Layout', text: 'Text', controls: 'Controls', content: 'Content', graphics: 'Graphics', colors: 'Colors', sites: 'Sites' },
  notHere: surface => `Not drawn on the ${surface} surface.`,
  only: surfaces => `Only on: ${surfaces}.`,
  box: {
    name: 'Box',
    help: 'The flex container: direction, gap, padding, margin, size, border, background, absolute position and hover styles',
    row: 'flexDirection="row" with columnGap',
    column: 'flexDirection="column" with rowGap',
    borders: 'borderStyle: single, double, round, bold, classic',
    background: 'backgroundColor and padding',
    hover: 'A keyed Box restyles itself and its children while the pointer is over it',
    hoverHelp: 'point at this row',
    reveal: 'display="none" with hover={{ display: "flex" }} on an absolute Box: a card over the rows',
    card: 'a card that only shows on hover',
  },
  text: {
    name: 'Text',
    help: 'A run of text: colour (hex or a theme key), backgroundColor, bold, italic, underline, strikethrough, inverse, dimColor, wrap',
    styles: 'Styles',
    wrap: 'wrap="truncate-end" cuts a line that does not fit, so this sentence ends with an ellipsis long before it is finished being written',
    link: { name: 'Link', help: 'A hyperlink: an anchor on the desktop, OSC 8 on terminals that draw it' },
  },
  button: {
    name: 'Button',
    help: 'A press runs onPress in the mod. plain draws no chrome; variant marks the main action; hotkey presses it while the pane holds the keys',
    plain: 'plain',
    primary: 'primary',
    secondary: 'secondary',
    dim: 'dimColor',
    hotkey: 'hotkey z',
    pressed: n => `pressed ${n} time${n === 1 ? '' : 's'}`,
  },
  input: {
    name: 'Input',
    help: 'A text field: onInput on each change, onSubmit on Enter or its submit button',
    label: 'Type here',
    typed: v => `onInput: "${v}"`,
    submitted: v => `onSubmit: "${v}"`,
    submit: 'send',
  },
  select: { name: 'Select', help: 'One of several options; onSelect runs on a pick', label: 'Pick one', picked: v => `picked: ${v}` },
  code: { name: 'Code', help: 'Source with highlighting and line numbers, or a diff with format="diff"', diff: 'format="diff"' },
  markdown: { name: 'Markdown', help: 'Markdown drawn the way Claude Code draws a reply: headings, lists, tables, code, links' },
  svg: { name: 'Svg', help: 'A vector image from an SVG string: charts, icons, cards' },
  raster: { name: 'Raster', help: 'A box of cells, each a glyph with its own foreground and background; repainted in place by $.ui.blit' },
  image: { name: 'Image', help: 'A picture (PNG or RGBA) over a box of cells: the kitty graphics protocol where the terminal has it, its alt text elsewhere' },
  client: { name: 'Client', help: 'A region drawn by a surface module of the mod: it hears the pointer and keys, and draws frames itself', hint: 'point at this line' },
  colors: { help: 'Theme keys: a tree that names one follows the person’s theme. Any hex works too.' },
  sites: {
    help: 'Where a mod draws: a ui.render hook matches one of these components, and draws its own tree or passes.',
    list: {
      Pane: 'a pane like this one: docked beside the transcript, or above the prompt',
      AbovePrompt: 'the band above the prompt (skins’ usage meters live here)',
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
    other: 'Outside a tree: $.ui.toast shows a passing notice, $.ui.status a status line entry, $.ui.open a pane.',
    toast: 'Show a toast',
    status: 'Set the status line',
  },
}

const pt: Words = {
  intro: 'Todos os elementos que um mod pode desenhar, ao vivo nesta superfície. Cada um com o nome, para que serve e um exemplo funcionando.',
  sections: { layout: 'Layout', text: 'Texto', controls: 'Controles', content: 'Conteúdo', graphics: 'Gráficos', colors: 'Cores', sites: 'Lugares' },
  notHere: surface => `Não é desenhado na superfície ${surface}.`,
  only: surfaces => `Só em: ${surfaces}.`,
  box: {
    name: 'Box',
    help: 'O contêiner flex: direção, espaçamento, padding, margem, tamanho, borda, fundo, posição absoluta e estilos de hover',
    row: 'flexDirection="row" com columnGap',
    column: 'flexDirection="column" com rowGap',
    borders: 'borderStyle: single, double, round, bold, classic',
    background: 'backgroundColor e padding',
    hover: 'Um Box com key muda o próprio estilo e o dos filhos enquanto o ponteiro está sobre ele',
    hoverHelp: 'aponte para esta linha',
    reveal: 'display="none" com hover={{ display: "flex" }} num Box absoluto: um card sobre as linhas',
    card: 'um card que só aparece no hover',
  },
  text: {
    name: 'Text',
    help: 'Um trecho de texto: cor (hex ou uma chave do tema), backgroundColor, bold, italic, underline, strikethrough, inverse, dimColor, wrap',
    styles: 'Estilos',
    wrap: 'wrap="truncate-end" corta uma linha que não cabe, então esta frase termina com reticências muito antes de terminar de ser escrita',
    link: { name: 'Link', help: 'Um hyperlink: âncora no desktop, OSC 8 nos terminais que desenham' },
  },
  button: {
    name: 'Button',
    help: 'Um clique roda o onPress no mod. plain desenha sem moldura; variant marca a ação principal; hotkey aperta enquanto o painel tem o teclado',
    plain: 'plain',
    primary: 'primary',
    secondary: 'secondary',
    dim: 'dimColor',
    hotkey: 'hotkey z',
    pressed: n => `apertado ${n} vez${n === 1 ? '' : 'es'}`,
  },
  input: {
    name: 'Input',
    help: 'Um campo de texto: onInput a cada mudança, onSubmit no Enter ou no botão de enviar',
    label: 'Digite aqui',
    typed: v => `onInput: "${v}"`,
    submitted: v => `onSubmit: "${v}"`,
    submit: 'enviar',
  },
  select: { name: 'Select', help: 'Uma entre várias opções; onSelect roda na escolha', label: 'Escolha uma', picked: v => `escolhido: ${v}` },
  code: { name: 'Code', help: 'Código com realce e números de linha, ou um diff com format="diff"', diff: 'format="diff"' },
  markdown: { name: 'Markdown', help: 'Markdown desenhado como o Claude Code desenha uma resposta: títulos, listas, tabelas, código, links' },
  svg: { name: 'Svg', help: 'Uma imagem vetorial a partir de uma string SVG: gráficos, ícones, cards' },
  raster: { name: 'Raster', help: 'Uma caixa de células, cada uma com um caractere, uma cor de frente e uma de fundo; repintada no lugar por $.ui.blit' },
  image: { name: 'Image', help: 'Uma imagem (PNG ou RGBA) sobre uma caixa de células: protocolo gráfico do kitty onde o terminal tem, o texto alt nos outros' },
  client: { name: 'Client', help: 'Uma região desenhada por um módulo de superfície do mod: ouve o ponteiro e as teclas, e desenha os próprios quadros', hint: 'aponte para esta linha' },
  colors: { help: 'Chaves do tema: uma árvore que usa uma delas segue o tema da pessoa. Qualquer hex também funciona.' },
  sites: {
    help: 'Onde um mod desenha: um hook ui.render escolhe um destes componentes e desenha a própria árvore ou passa adiante.',
    list: {
      Pane: 'um painel como este: ao lado da conversa, ou acima do prompt',
      AbovePrompt: 'a faixa acima do prompt (os medidores do skins ficam aqui)',
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
    other: 'Fora de uma árvore: $.ui.toast mostra um aviso passageiro, $.ui.status um item na linha de status, $.ui.open um painel.',
    toast: 'Mostrar um toast',
    status: 'Mudar a linha de status',
  },
}

export const DEMO_WORDS: Readonly<Record<ModsLang, Words>> = { en, pt }

const SVG_DEMO = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64">
<rect x="1" y="1" width="238" height="62" rx="10" fill="none" stroke="#8c8c8c"/>
<circle cx="32" cy="32" r="16" fill="none" stroke="#d97757" stroke-width="6" stroke-dasharray="70 101" transform="rotate(-90 32 32)"/>
<text x="62" y="28" font-family="sans-serif" font-size="13" fill="#d97757">42% context</text>
<rect x="62" y="38" width="160" height="8" rx="4" fill="#8c8c8c" opacity="0.3"/><rect x="62" y="38" width="67" height="8" rx="4" fill="#d97757"/>
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

const SECTION_IDS = ['layout', 'text', 'controls', 'content', 'graphics', 'colors', 'sites'] as const

// The Components tab of /mods: a live catalog of the elements and sites a mod has.
export function componentsTab(ui: DemoUi, surface: RenderSurface, columns: number, lang: ModsLang, state: DemoState, actions: DemoActions): RenderElement {
  const { Box, Text, Button, Input, Select, Link, Code, Markdown } = ui
  const w = DEMO_WORDS[lang]
  const open = SECTION_IDS.find(id => id === state.section) ?? 'layout'

  const entry = (key: string, name: string, help: string, demo: RenderElement | null, note?: string) => (
    <Box key={`entry-${key}`} flexDirection="column">
      <Text>
        <Text bold color="claude">
          {name}
        </Text>
        <Text color="subtle">{`  ${help}`}</Text>
      </Text>
      {note === undefined ? null : <Text color="warning">{note}</Text>}
      {demo === null ? null : (
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          {demo}
        </Box>
      )}
    </Box>
  )

  const unavailable = (key: string, name: string, help: string, surfaces: string) => entry(key, name, help, null, `${w.notHere(surface)} ${w.only(surfaces)}`)

  const body = (() => {
    switch (open) {
      case 'layout':
        return [
          entry(
            'box',
            w.box.name,
            w.box.help,
            <Box flexDirection="column" rowGap={1}>
              <Box flexDirection="column">
                <Text color="subtle">{w.box.row}</Text>
                <Box flexDirection="row" columnGap={2}>
                  {['one', 'two', 'three'].map(label => (
                    <Box key={`row-${label}`} borderStyle="round" borderColor="subtle" paddingX={1}>
                      <Text>{label}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box flexDirection="column">
                <Text color="subtle">{w.box.borders}</Text>
                <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
                  {['single', 'double', 'round', 'bold', 'classic'].map(style => (
                    <Box key={`border-${style}`} borderStyle={style} borderColor="claude" paddingX={1}>
                      <Text>{style}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box flexDirection="column">
                <Text color="subtle">{w.box.background}</Text>
                <Box backgroundColor="#2f3b52" paddingX={2} paddingY={0}>
                  <Text color="#e6edf3">backgroundColor="#2f3b52"</Text>
                </Box>
              </Box>
              <Box flexDirection="column">
                <Text color="subtle">{w.box.hover}</Text>
                <Box key="hover-row" paddingX={1} hover={{ backgroundColor: '#3b3d41' }}>
                  <Text hover={{ color: 'claude', bold: true }}>{`▸ ${w.box.hoverHelp}`}</Text>
                </Box>
              </Box>
              <Box flexDirection="column">
                <Text color="subtle">{w.box.reveal}</Text>
                <Box key="reveal-row" flexDirection="column">
                  <Text>{`▸ ${w.box.hoverHelp}`}</Text>
                  <Box position="absolute" top={-1} left={24} display="none" hover={{ display: 'flex' }} backgroundColor="#6b7280" paddingX={1}>
                    <Text color="#ffffff">{w.box.card}</Text>
                  </Box>
                </Box>
              </Box>
            </Box>,
          ),
        ]
      case 'text':
        return [
          entry(
            'text',
            w.text.name,
            w.text.help,
            <Box flexDirection="column" rowGap={1}>
              <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                <Text bold>bold</Text>
                <Text italic>italic</Text>
                <Text underline>underline</Text>
                <Text strikethrough>strikethrough</Text>
                <Text inverse>inverse</Text>
                <Text dimColor>dimColor</Text>
                <Text color="#d97757">color="#d97757"</Text>
                <Text color="success">color="success"</Text>
                <Text backgroundColor="#d97757" color="#ffffff">
                  backgroundColor
                </Text>
              </Box>
              <Box width={Math.max(20, Math.min(60, columns - 6))}>
                <Text wrap="truncate-end">{w.text.wrap}</Text>
              </Box>
            </Box>,
          ),
          entry('link', w.text.link.name, w.text.link.help, <Link href="https://github.com/mvacoimbra/claude-mods" label="github.com/mvacoimbra/claude-mods" />),
        ]
      case 'controls':
        return [
          entry(
            'button',
            w.button.name,
            w.button.help,
            <Box flexDirection="column" rowGap={1}>
              <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
                <Button key="demo-primary" label={w.button.primary} variant="primary" onPress={actions.click} />
                <Button key="demo-secondary" label={w.button.secondary} variant="secondary" onPress={actions.click} />
                <Button key="demo-plain" label={w.button.plain} plain onPress={actions.click} />
                <Button key="demo-dim" label={w.button.dim} plain dimColor onPress={actions.click} />
                <Button key="demo-hotkey" label={w.button.hotkey} hotkey="z" plain onPress={actions.click} />
              </Box>
              <Text color="success">{w.button.pressed(state.clicks)}</Text>
            </Box>,
          ),
          entry(
            'input',
            w.input.name,
            w.input.help,
            <Box flexDirection="column">
              <Input key="demo-input" label={`${w.input.label} `} placeholder="…" value={state.typed} submitLabel={w.input.submit} onInput={actions.type} onSubmit={actions.submit} />
              <Text color="subtle">{w.input.typed(state.typed)}</Text>
              <Text color="success">{w.input.submitted(state.submitted)}</Text>
            </Box>,
          ),
          entry(
            'select',
            w.select.name,
            w.select.help,
            <Box flexDirection="column">
              <Select
                key="demo-select"
                label={w.select.label}
                value={state.picked}
                options={[
                  { value: 'a', label: 'Alpha' },
                  { value: 'b', label: 'Beta' },
                  { value: 'c', label: 'Gamma' },
                ]}
                onSelect={actions.pick}
              />
              <Text color="success">{w.select.picked(state.picked)}</Text>
            </Box>,
          ),
        ]
      case 'content':
        return [
          entry(
            'code',
            w.code.name,
            w.code.help,
            <Box flexDirection="column" rowGap={1}>
              <Code language="ts" path="hooks/register.tsx" startLine={12} source={"export const register: Register = on => {\n  on('session.start', async ($, e, next) => next(e))\n}"} />
              <Text color="subtle">{w.code.diff}</Text>
              <Code format="diff" language="ts" source={"@@ -1,2 +1,2 @@\n-const limit = 10\n+const limit = 20\n export { limit }"} />
            </Box>,
          ),
          entry(
            'markdown',
            w.markdown.name,
            w.markdown.help,
            <Markdown text={'### A heading\n\n- **bold**, *italic*, `code`\n- a [link](https://github.com/mvacoimbra/claude-mods)\n\n| Mod | Tab |\n|---|---|\n| cache-tax | Keep warm |\n| skins | Skins |'} />,
          ),
        ]
      case 'graphics': {
        const Svg = ui.Svg
        const Raster = ui.Raster
        const Image = ui.Image
        const Client = ui.Client

        return [
          Svg === undefined
            ? unavailable('svg', w.svg.name, w.svg.help, 'desktop, vscode, mobile')
            : entry('svg', w.svg.name, w.svg.help, <Svg source={SVG_DEMO} alt="a sample ring and bar" width={240} height={64} />),
          Raster === undefined
            ? unavailable('raster', w.raster.name, w.raster.help, 'terminal')
            : entry('raster', w.raster.name, w.raster.help, <Raster key="demo-raster" columns={Math.min(48, columns - 6)} rows={2} cells={rasterCells(Math.min(48, columns - 6))} />),
          Image === undefined
            ? unavailable('image', w.image.name, w.image.help, 'terminal')
            : entry('image', w.image.name, w.image.help, <Image key="demo-image" source={{ rgba: imagePixels(64, 16), width: 64, height: 16 }} columns={16} rows={2} alt="[a gradient]" />),
          Client === undefined
            ? unavailable('client', w.client.name, w.client.help, 'terminal, desktop')
            : entry('client', w.client.name, w.client.help, <Client key="demo-client" module="./demo-client.tsx" props={{ hint: w.client.hint } satisfies DemoClientProps} />),
        ]
      }
      case 'colors':
        return [
          <Text key="colors-help" color="subtle">
            {w.colors.help}
          </Text>,
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
          <Text key="sites-help" color="subtle">
            {w.sites.help}
          </Text>,
          <Box key="sites-list" flexDirection="column">
            {SITES.map(site => (
              <Box key={`site-${site}`} flexDirection="row" columnGap={2}>
                <Box width={18} flexShrink={0}>
                  <Text color="claude">{site}</Text>
                </Box>
                <Box flexShrink={1}>
                  <Text color="subtle">{w.sites.list[site]}</Text>
                </Box>
              </Box>
            ))}
          </Box>,
          <Text key="sites-other" color="subtle">
            {w.sites.other}
          </Text>,
          <Box key="sites-actions" flexDirection="row" columnGap={2}>
            <Button key="demo-toast" label={w.sites.toast} onPress={actions.toast} />
            <Button key="demo-status" label={w.sites.status} onPress={actions.status} />
          </Box>,
        ]
    }
  })()

  return (
    <Box flexDirection="column" rowGap={1}>
      <Text color="subtle">{w.intro}</Text>
      <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
        {SECTION_IDS.map(id => (
          <Button key={`section-components-${id}`} plain dimColor={id !== open} label={`${id === open ? '●' : '○'} ${w.sections[id]}`} onPress={() => actions.section(id)} />
        ))}
      </Box>
      {body}
    </Box>
  )
}
