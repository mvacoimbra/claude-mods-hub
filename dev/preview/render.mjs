// Draws captured mod trees as an HTML approximation of the Claude Code desktop app, so a
// redesign can be looked at outside a live session. Not the engine's renderer: close enough
// to judge hierarchy, spacing and colour, never pixel truth.
//
//   node render.mjs <capture.json> <out.html>
//
// A capture is { title, sections: [{ title, items: [{ label, tree, width? }] }] }.
import { readFileSync, writeFileSync } from 'node:fs'

const THEMES = {
  dark: {
    page: '#262624', panel: '#1f1e1d', fg: '#e8e6dc', line: '#3a3936',
    keys: {
      text: '#e8e6dc', inverseText: '#1f1e1d', inactive: '#9a9893', subtle: '#6b6a66', suggestion: '#b1b9f9', remember: '#b1b9f9',
      success: '#4eba65', error: '#ff6b80', warning: '#ffc107', merged: '#af87ff', claude: '#d97757', permission: '#b1b9f9',
      planMode: '#48968c', autoAccept: '#af87ff', promptBorder: '#888888', bashBorder: '#fd5db1', ide: '#4782c8',
      diffAdded: '#225c2b', diffRemoved: '#7a2936', diffAddedDimmed: '#47584a', diffRemovedDimmed: '#69484d',
      diffAddedWord: '#38a660', diffRemovedWord: '#b3596b',
    },
  },
  light: {
    page: '#faf9f5', panel: '#ffffff', fg: '#1f1e1d', line: '#e5e3da',
    keys: {
      text: '#1f1e1d', inverseText: '#ffffff', inactive: '#6b6a66', subtle: '#a8a69e', suggestion: '#5769f7', remember: '#5769f7',
      success: '#2c7a39', error: '#ab2b3f', warning: '#966c1e', merged: '#8700ff', claude: '#c96442', permission: '#5769f7',
      planMode: '#006666', autoAccept: '#8700ff', promptBorder: '#999999', bashBorder: '#ff0087', ide: '#4782c8',
      diffAdded: '#69db7c', diffRemoved: '#ffa8b4', diffAddedDimmed: '#c7e1cb', diffRemovedDimmed: '#fdd2d8',
      diffAddedWord: '#2f9d44', diffRemovedWord: '#d1454b',
    },
  },
}

const CELL = 8 // px per layout unit across
const LINE = 20 // px per layout unit down

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const color = (theme, c) => (c === undefined ? undefined : theme.keys[c] ?? c)
const across = v => (typeof v === 'number' ? `${v * CELL}px` : v)
const down = v => (typeof v === 'number' ? `${v * LINE}px` : v)

const BORDERS = { single: 'solid', round: 'solid', bold: 'solid', double: 'double', singleDouble: 'double', doubleSingle: 'double', classic: 'dashed', arrow: 'dotted' }

function boxStyle(theme, p) {
  const s = ['display:flex', `flex-direction:${p.flexDirection ?? 'row'}`]
  const put = (k, v) => v !== undefined && s.push(`${k}:${v}`)
  put('flex-wrap', p.flexWrap)
  put('column-gap', across(p.columnGap ?? p.gap))
  put('row-gap', down(p.rowGap ?? p.gap))
  put('align-items', p.alignItems === 'flex-start' ? 'flex-start' : p.alignItems)
  put('justify-content', p.justifyContent)
  put('align-self', p.alignSelf)
  put('flex-grow', p.flexGrow)
  put('flex-shrink', p.flexShrink)
  put('flex-basis', across(p.flexBasis))
  put('width', across(p.width))
  put('min-width', across(p.minWidth))
  put('max-width', across(p.maxWidth))
  put('height', down(p.height))
  put('min-height', down(p.minHeight))
  const pad = ['Top', 'Bottom', 'Left', 'Right'].map(side => p[`padding${side}`] ?? (side === 'Top' || side === 'Bottom' ? p.paddingY : p.paddingX) ?? p.padding ?? 0)
  s.push(`padding:${down(pad[0])} ${across(pad[3])} ${down(pad[1])} ${across(pad[2])}`)
  const mar = ['Top', 'Bottom', 'Left', 'Right'].map(side => p[`margin${side}`] ?? (side === 'Top' || side === 'Bottom' ? p.marginY : p.marginX) ?? p.margin ?? 0)
  s.push(`margin:${down(mar[0])} ${across(mar[3])} ${down(mar[1])} ${across(mar[2])}`)
  if (p.borderStyle) {
    const c = color(theme, p.borderColor) ?? theme.line
    const style = BORDERS[p.borderStyle] ?? 'solid'
    for (const side of ['Top', 'Bottom', 'Left', 'Right']) {
      if (p[`border${side}`] !== false) s.push(`border-${side.toLowerCase()}:1px ${style} ${color(theme, p[`border${side}Color`]) ?? c}`)
    }
    if (p.borderStyle === 'round') s.push('border-radius:8px')
    if (p.borderDimColor) s.push('opacity:.7')
  }
  put('background', color(theme, p.backgroundColor))
  if (p.position === 'absolute') {
    s.push('position:absolute')
    for (const k of ['top', 'left']) put(k, p[k] === undefined ? undefined : (k === 'top' ? down : across)(p[k]))
    for (const k of ['bottom', 'right']) put(k, p[k] === undefined ? undefined : (k === 'bottom' ? down : across)(p[k]))
  } else if (p.position === 'relative') s.push('position:relative')
  if (p.overflow === 'hidden' || p.overflowX === 'hidden' || p.overflowY === 'hidden') s.push('overflow:hidden')
  if (p.display === 'none') s.push('display:none')
  return s.join(';')
}

function textStyle(theme, p) {
  const s = []
  const put = (k, v) => v !== undefined && s.push(`${k}:${v}`)
  put('color', color(theme, p.color))
  put('background', color(theme, p.backgroundColor))
  if (p.bold) s.push('font-weight:600')
  if (p.italic) s.push('font-style:italic')
  const deco = [p.underline && 'underline', p.strikethrough && 'line-through'].filter(Boolean).join(' ')
  if (deco) s.push(`text-decoration:${deco}`)
  if (p.dimColor) s.push('opacity:.55')
  if (p.inverse) s.push(`filter:invert(1)`)
  if (p.wrap && String(p.wrap).startsWith('truncate')) s.push('white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%')
  return s.join(';')
}

function children(theme, node, inText) {
  return (node.children ?? []).map(c => draw(theme, c, inText)).join('')
}

function draw(theme, node, inText = false) {
  if (node === null || node === undefined || node === false || node === '') return ''
  if (typeof node === 'string' || typeof node === 'number') return esc(node)
  if (Array.isArray(node)) return node.map(n => draw(theme, n, inText)).join('')
  const p = node.props ?? {}
  const key = p.key ? ` data-key="${esc(p.key)}"` : ''
  switch (node.type) {
    case 'Box':
      return `<div class="box"${key} style="${boxStyle(theme, p)}">${children(theme, node, false)}</div>`
    case 'Text': {
      const tag = inText ? 'span' : 'span class="text"'
      return `<${tag}${key} style="${textStyle(theme, p)}">${children(theme, node, true)}</span>`
    }
    case 'Button': {
      const variant = p.plain ? 'plain' : p.variant ?? 'secondary'
      const tone = color(theme, p.color)
      const style = [tone && `--tone:${tone}`, p.dimColor && 'opacity:.6'].filter(Boolean).join(';')
      const label = p.label ?? children(theme, node, true)
      const hint = p.hint ? ` title="${esc(p.hint)}"` : ''
      return `<button class="btn ${variant}${p.isSelected || p.selected ? ' on' : ''}"${key}${hint} style="${style}">${p.icon ? `<i>${esc(p.icon)}</i>` : ''}${esc(label)}</button>`
    }
    case 'Input':
      return `<span class="input"${key}>${p.value ? esc(p.value) : `<span class="ph">${esc(p.placeholder ?? '')}</span>`}</span>`
    case 'Select': {
      const current = (p.options ?? []).find(o => o.value === p.value)
      return `<span class="select"${key}>${esc(current?.label ?? p.placeholder ?? 'Select')}<b>⌄</b></span>`
    }
    case 'Link':
      return `<a class="link"${key} style="${textStyle(theme, p)}">${p.label ? esc(p.label) : children(theme, node, true)}</a>`
    case 'Code':
      return `<pre class="code"${key}>${esc(p.source ?? p.code ?? p.text ?? children(theme, node, true))}</pre>`
    case 'Markdown':
      return `<div class="md"${key}>${esc(p.text ?? '')}</div>`
    case 'Svg': {
      const w = p.width === undefined ? '' : `width:${p.width}px;`
      const h = p.height === undefined ? '' : `height:${p.height}px;`
      const src = String(p.source ?? '').replace(/<svg /, `<svg style="${w}${h}display:block" `)
      return `<span class="svg"${key}>${src}</span>`
    }
    case 'Client':
      return `<div class="client"${key}>Client · ${esc(p.module ?? p.src ?? '')}<small>${esc(JSON.stringify(p.props ?? {}).slice(0, 220))}</small></div>`
    case 'Raster':
    case 'Image':
      return `<div class="client"${key}>${node.type}</div>`
    default:
      return `<div class="unknown">${esc(node.type)}${children(theme, node, inText)}</div>`
  }
}

function page(capture, themeName) {
  const theme = THEMES[themeName]
  const k = theme.keys
  const sections = capture.sections
    .map(
      section => `<section><h2>${esc(section.title)}</h2>${section.items
        .map(item => `<figure style="${item.width ? `width:${item.width * CELL + 32}px` : ''}"><figcaption>${esc(item.label)}</figcaption><div class="frame">${draw(theme, item.tree)}</div></figure>`)
        .join('')}</section>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(capture.title)}</title><style>
  :root{color-scheme:${themeName}}
  *{box-sizing:border-box}
  body{margin:0;background:${theme.page};color:${theme.fg};font:13px/20px -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;padding:24px}
  h1{font-size:15px;font-weight:600;margin:0 0 16px}
  h2{font-size:12px;font-weight:600;color:${k.inactive};margin:28px 0 10px;text-transform:none}
  section{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
  section h2{flex-basis:100%}
  figure{margin:0;min-width:320px;max-width:100%}
  figcaption{font-size:11px;color:${k.subtle};margin-bottom:4px;font-family:ui-monospace,Menlo,monospace}
  .frame{background:${theme.panel};border:1px solid ${theme.line};border-radius:10px;padding:12px 16px;overflow:hidden;position:relative}
  .box{min-width:0}
  .text{white-space:pre-wrap;min-width:0}
  .btn{font:inherit;font-size:12.5px;line-height:18px;border-radius:6px;padding:3px 10px;border:1px solid ${theme.line};background:transparent;color:var(--tone,${theme.fg});cursor:default;white-space:nowrap}
  .btn.primary{background:${k.claude};border-color:${k.claude};color:#fff}
  .btn.plain{border:0;padding:0 2px;color:var(--tone,${k.inactive})}
  .btn.ghost{border-color:transparent}
  .btn.danger{border-color:${k.error};color:${k.error}}
  .btn.on{background:${theme.line}}
  .btn i{font-style:normal;margin-right:6px}
  .input,.select{display:inline-flex;align-items:center;gap:8px;min-width:160px;border:1px solid ${theme.line};border-radius:6px;padding:3px 8px;background:${theme.page}}
  .ph{color:${k.subtle}}
  .select b{margin-left:auto;color:${k.inactive};font-weight:400}
  .link{color:${k.suggestion};text-decoration:underline;text-underline-offset:2px}
  .code{font:12px/18px ui-monospace,"SF Mono",Menlo,monospace;background:${theme.page};border-radius:6px;padding:8px 10px;margin:0;white-space:pre-wrap}
  .md{white-space:pre-wrap}
  .svg{display:inline-block;line-height:0}
  .client{border:1px dashed ${k.subtle};border-radius:6px;padding:6px 8px;color:${k.inactive};font-size:11px}
  .client small{display:block;color:${k.subtle};word-break:break-all}
  .unknown{outline:1px dashed red}
  </style></head><body><h1>${esc(capture.title)} · ${themeName}</h1>${sections}</body></html>`
}

const [, , input, output, themeName = 'dark'] = process.argv
const capture = JSON.parse(readFileSync(input, 'utf8'))
writeFileSync(output, page(capture, themeName))
console.log(`wrote ${output}`)
