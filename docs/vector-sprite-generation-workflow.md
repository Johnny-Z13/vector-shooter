# Vector Sprite Generation Workflow

This project uses generated catalog sheets rather than one-off character files. The goal is to spend image generation on variety, then repack the result into small deterministic atlases the renderer can sample cheaply.

## When To Use

Use this workflow for planet bosses, friendly alien NPCs, surface creatures, relic guardians, or future encounter catalogs that should share the current neon Vectrex look.

The existing `game-character-64` skill is good for 64x64 pixel-art RPG characters. Galactic Hordes needs larger transparent neon catalog sheets, so this workflow is the local repeatable pattern for this game.

## Economical Prompt Pattern

Generate five creatures per sheet, four animation poses per creature:

```text
Create a clean game sprite sheet for Galactic Hordes, a portrait mobile survival shooter with black-space Vectrex vector graphics.
Style: glowing neon line art, transparent-feeling black background, simple readable silhouettes, crisp vector strokes, arcade sci-fi, no text, no UI, no scenery.
Layout: exactly 5 rows and 4 columns. Each row is one character. Each column is a subtle animation pose/frame.
Characters: [list five concrete creature concepts].
Keep generous separation between cells. Center every character in its cell. Full body visible.
```

Use one sheet for hostile bosses and one sheet for friendly aliens so their silhouette language stays distinct.

## Repacking Rules

- Detect five horizontal creature bands and four vertical pose bands per row.
- Remove black background to alpha.
- Crop every pose to visible pixels.
- Fit bosses into a `4 x 5` atlas with `256px` cells.
- Fit friendly aliens into a `4 x 5` atlas with `192px` cells.
- Save optimized transparent PNGs in `src/assets/`.
- Sample by `row = creature variant`, `column = animation frame`.

Current catalog assets:

- `src/assets/planet-boss-catalog-alpha.png`: five boss variants, four frames each.
- `src/assets/planet-alien-catalog-alpha.png`: five friendly alien variants, four frames each.

## Design Language

Bosses should read as dangerous from across a phone screen: angular, sharp, large hit silhouette, hot magenta/yellow/cyan cores.

Friendly aliens should read as collectible/conversational: softer shapes, visible hands or offerings, green/cyan/yellow halos, non-aggressive posture.

Avoid enemy-like yellow polygon fillers for NPCs. If it talks, it should have a face, body language, and a clear interaction aura.
