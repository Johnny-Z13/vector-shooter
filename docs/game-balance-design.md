# Game Balance Architecture

Galactic Hordes needs balance data to be easy to inspect, edit, test, and document. Combat tuning must not be scattered as anonymous numbers through the game loop.

## Goals

- Keep the active testing difficulty explicit.
- Centralize enemy HP, damage, speed, attack cadence, spawn timing, and surface threat tuning.
- Preserve per-enemy personality while making numeric calibration table-driven.
- Generate balance documentation from the same source used by the game.
- Prevent README and balance docs from drifting when tuning changes.

## Source Of Truth

`src/game-balance.ts` is the source of truth for:

- active balance mode
- global difficulty multipliers
- space enemy base stats
- space enemy attack stats
- space spawn pressure
- boss cadence
- surface threat stats

Runtime code may transform these values for elapsed time, planet count, or run state, but the underlying constants must live in the balance module with descriptive names.

## Difficulty Profiles

Profiles are named modes, not loose multipliers in random files:

- `testEasy`: temporary low-pressure mode for playtesting progression and planet loops.
- `normal`: intended baseline once tuning stabilizes.
- `hard`: future high-pressure calibration target.

The active mode is a single exported value in `src/game-balance.ts`. During development it may be set to `testEasy`; release builds should move back to `normal`.

## Documentation Hook

`scripts/update-balance-docs.mjs` reads `src/game-balance.ts` and updates generated balance sections in:

- `README.md`
- `docs/game-balance-design.md`

`.githooks/pre-commit` runs the generator and stages updated docs. This keeps docs synchronized when balance data changes.

<!-- BALANCE-GENERATED:START -->
### Active Balance Snapshot

Active balance mode: `testEasy` (Testing Easy).

| Multiplier | Value |
| --- | ---: |
| Enemy HP | 0.45 |
| Enemy damage | 0.4 |
| Enemy speed | 0.82 |
| Enemy projectile speed | 0.85 |
| Enemy attack cooldown | 1.35 |
| Spawn rate | 0.55 |
| Boss rate | 0.65 |
| Surface HP | 0.5 |
| Surface damage | 0.45 |
| Surface speed | 0.8 |

| Enemy | HP | Speed | Contact | Time Gate | Spawn Roll |
| --- | ---: | ---: | ---: | ---: | ---: |
| chaser | 34 | 123 | 13 | 0s | 1 |
| splinter | 23 | 158 | 13 | 25s | 0.82 |
| lancer | 60 | 154 | 13 | 55s | 0.7 |
| mine | 46 | 68 | 23 | 100s | 0.58 |
| brute | 170 | 98 | 19 | 180s | 0.39 |
| shooter | 72 | 118 | 13 | 120s | 0.49 |
| warden | 520 | 134 | 24 | 0s | 0 |
| razor | 92 | 335 | 17 | 205s | 0.18 |
| skimmer | 126 | 176 | 13 | 165s | 0.29 |
| bulwark | 270 | 86 | 22 | 270s | 0.07 |

Generated from `src/game-balance.ts`. Do not edit this section by hand.
<!-- BALANCE-GENERATED:END -->
