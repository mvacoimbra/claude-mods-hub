# mods

One `/mods` pane for every installed Claude Code mod. The pane lists every mod with its live
state; open one for its settings and actions, all drawn alike from the pack's shared kit, in
Claude Code's own idiom and the skin chosen in skins. The mods themselves register no slash
commands, and every setting is the user's: the same in every session and project.

| View | Mod | What it holds |
| --- | --- | --- |
| Overview | | Every installed mod with its live state, and a way into its view |
| Keep warm | [cache-tax](https://github.com/mvacoimbra/cache-tax) | Whether the prompt cache is warm and when it goes cold, keep-warm windows, every-session switch, the cold-send guard |
| Skins | [skins](https://github.com/mvacoimbra/claude-skins) | The skin with a live preview, the look, the content cards, the usage band, the colours, copy and gallery |
| Files | [filetree](https://github.com/mvacoimbra/claude-code-filetree) | Open or close the file tree, show another folder, and every filetree setting |
| Agents | [savvy-progress](https://github.com/mvacoimbra/claude-kit) | Running, finished and planned subagents, the current flow, and the agents panel |
| Replay | [replay-theater](https://github.com/mvacoimbra/claude-code-playground) | Step through the last turn's edits |
| Components | | Everything a mod can draw or do, named and live: every element with every prop and value (Box, Text, Button, Input, Select, Link, Code, Markdown, Svg, Raster, Image, Client), the theme colours, the sites a mod draws in, the calls outside a drawing (toast, notify, ask, status, copy, panes), and every named component of each installed mod, from its catalog |
| Settings | | The language of the pane and of every view (English or Português), and where settings live |

A mod that is not installed is not listed. 1 to 9 open a mod, 0 goes back, Tab and the arrows move, Esc closes.

## Install

From the [claude-mods](https://github.com/mvacoimbra/claude-mods) marketplace:

```bash
claude plugin marketplace add mvacoimbra/claude-mods
claude plugin install mods@claude-mods
```

## How a mod joins

The hub draws every tab itself from a description the mod hands it, since a press cannot cross
from one mod's tree to another's. [PROTOCOL.md](PROTOCOL.md) has the contract: a noun on `$`
with `panel` and `act`, and its name in the hub's `MODS` table.

## The kit

`kit/` is the pack's component library: tones from the skin (`tone.ts`), stroke icons
(`icons.ts`) and the rows, groups, controls, meters and notices every mod draws with
(`kit.tsx`). Edit it here, then copy it into every mod:

```bash
dev/sync-kit.sh
```

## Develop

```bash
claude plugin validate .
claude plugin test .
```

`dev/preview/` draws captured trees as an HTML approximation of the desktop app
(`render.mjs`) and screenshots it (`shot.sh`), to look at a change outside a live session.
