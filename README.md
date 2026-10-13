# mods

One `/mods` pane for every installed Claude Code mod. Each mod gets a tab with its state, its
settings and its actions, all drawn alike; the mods themselves register no slash commands.

| Tab | Mod | What it holds |
| --- | --- | --- |
| Overview | | Every installed mod's one-line state, and a way into its tab |
| Keep warm | [cache-tax](https://github.com/mvacoimbra/cache-tax) | Whether the prompt cache is warm and when it goes cold, keep-warm windows, every-session switch, the cold-send guard |
| Skins | [skins](https://github.com/mvacoimbra/claude-skins) | The skin with a live preview, the look, the content cards, the usage band, the colours, copy and gallery |
| Files | [filetree](https://github.com/mvacoimbra/claude-code-filetree) | Open or close the file tree, show another folder, and every filetree setting |
| Agents | [savvy-progress](https://github.com/mvacoimbra/claude-kit) | Running, finished and planned subagents, the current flow, and the agents panel |
| Replay | [replay-theater](https://github.com/mvacoimbra/claude-code-playground) | Step through the last turn's edits |
| Components | | A live catalog of every element a mod can draw (Box, Text, Button, Input, Select, Link, Code, Markdown, Svg, Raster, Image, Client), the theme colours and the sites a mod draws in, with working examples on the surface you are on |
| Settings | | The language of the pane and of every tab: English or Português |

A mod that is not installed has no tab. The digits switch tabs, Tab and the arrows move, Esc closes.

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

## Develop

```bash
claude plugin validate .
claude plugin test .
```
