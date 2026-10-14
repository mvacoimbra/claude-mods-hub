// Turns a mod's @@PREVIEW line ({ mod, catalog }) into a capture for render.mjs.
//   node catalog.mjs <mod.json> <capture.json>
import { readFileSync, writeFileSync } from 'node:fs'
const [, , input, output] = process.argv
const lines = readFileSync(input, 'utf8').trim().split('\n').map(l => JSON.parse(l))
const sections = lines.flatMap(({ mod, catalog }) => [{ title: `${mod} · ${catalog.length} components`, items: catalog.map(e => ({ label: `${e.id} · ${e.name}`, tree: e.tree, width: 90 })) }])
writeFileSync(output, JSON.stringify({ title: lines.map(l => l.mod).join(', '), sections }))
