---
version: 1
slug: "claude-mods-hub-hooks-register-tsx"
primary_target: "claude-mods-hub/hooks/register.tsx"
related_targets: ["claude-skins/hooks/register.tsx","cache-tax/hooks/register.ts","claude-code-filetree/hooks","claude-kit/plugins/savvy-progress/hooks","claude-code-playground/claude-code/mods"]
---

# Surface: the claude-mods pack (desktop)

Scope: every surface the pack draws on the Claude Code desktop app: the `/mods` pane (hub), the band above the prompt, skins' transcript rows and cards, the filetree pane, savvy-progress's band and agents view, replay-theater's pane, blast-radius's hold dialog, cache-tax's band row and guard notices. Visitor mode: Operate.

Audience and job: one developer living in the Code tab; glance at state (usage, cache, agents), change a mod's setting in seconds, read richer transcript output. Must not lose any information shown today. Terminal keeps working, is not designed for.

Constraints: engine elements only (Box, Text, Button, Input, Select, Link, Code, Markdown, Svg, Client); layout in character cells; Button is drawn native on desktop; Svg is an image (isInteractive for hover/tooltips); no presses across mods; colours come from the skin chosen in skins, Claude Code's own colours by default.

## Direction contract

THESIS: The pack disappears into Claude Code. One shared kit draws every pane, band, row, card and dialog in the app's own grammar, refusing the plugin-settings dump: stacked bordered boxes, rows of chip buttons, glyph icons, and seven mods each with its own look.

OWN-WORLD: Claude Code desktop's grammar, themed by the skin. Native Buttons; system sans; primary text in the app's text colour, secondary in its muted tone; hairline rounded groups, never nested; one accent from the skin (Claude orange by default) for the current choice and the one main action; status only in ok, warn, err; authored 16px stroke icons (1.8 stroke, round caps) instead of glyphs; the ring meter as the single data glyph for anything with a percent.

STORY: Open /mods and read every mod's live state in one list; step into a mod, change a setting in place, step back. The band, the tree, the agents view and the dialogs look like they came from the same hand, and wear whichever skin is chosen.

FIRST VIEWPORT: Pane docked at the side. Top: the mod list, one hoverable row per mod: icon, name, a one-line live state in its tone, a chevron to open. A quiet gap, then Components and Settings rows. Inside a mod: a back control and the mod's name, then titled groups of rows, label and help at left, control at right; the group's main action last, in the accent.

FORM: canon, pinned by the user ("as if it were native to Claude Code"); no seed rolled, the pinned direction beats the roll. Signature move: one skin threads everything, so the same palette and ring meter show up in the band, the hub rows, the tree and the agents view.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
