# Galactic Hordes

Galactic Hordes is a mobile-first portrait survival shooter: Vampire Survivors pressure, Asteroids movement, and Vectrex-style vector graphics. The ship auto-fires, so the player focuses on steering through hordes, landing on planets, salvaging mystery caches, and evolving the build at the ship workbench.

## Current Prototype

- Portrait-first 2D canvas game built with Vite and TypeScript.
- Thumb-anywhere mobile movement: drag in the playfield to steer.
- Baseline auto-cruise: release your thumb and the ship keeps travelling, then nudge the route when you touch again.
- `Nav Ghost` upgrades make cruise faster, smarter, able to lock onto planet beacons, and leave stronger vector trails.
- Auto-targeting ship fire with keyboard, touch, mouse, and gamepad support.
- Planet landing transitions into on-foot surface salvage.
- Endless procedural space sectors with deterministic planets and starfields.
- Workbench upgrades happen when returning to the ship.
- Weighted upgrade choices inspired by Vampire Survivors.
- Planet relics, weapon evolutions, limit breaks, treasure cores, and mystery cache ambushes.
- Procedural planet encounter types: salvage, boss, friendly contact, and mixed mystery sites.
- Lore planets with inspectable fossils, pyramids, graves, machines, and other short narrative nuggets.
- Generated boss and friendly alien sprite catalogs for stranger planet discoveries.
- Quiet planet encounters with one-time alien bargains and rare artefact rolls.
- A generated 8-frame surface spaceman sprite replaces the original stick pilot.
- Mothership command hub wraps launch, archive, and department upgrades.
- Return beacons appear after a planet and about four minutes, then escalate from visible exit offer to soft recall route.
- Destroyed runs recover black-box archive data and partial resources.
- High scores with editable pilot names.
- LOW/MED/GLOW graphics modes for phones, low-GPU Macs, and high-end PCs.

## Mobile Controls

The default experience is designed for an iPhone-style portrait screen.

- Drag anywhere in the playfield to bend the ship's cruise heading.
- Release to keep travelling on the last heading.
- The ship auto-fires at nearby enemies.
- Tap `LAND` near a planet.
- Tap `BEACON` when a return beacon is available to auto-travel toward extraction.
- On a planet, tap `BOARD` near the ship to leave.
- Tap `DASH` in space.
- On planet surfaces, the pilot auto-shoots when threats are nearby.

The lower-right action buttons are protected from movement input, so tapping them will not accidentally steer the player.

## Desktop and Gamepad Controls

Keyboard:

- `WASD`: move
- `E` or `Enter`: land / interact / board
- `Shift`: dash
- `Space`: fire ship weapons / surface pistol

Gamepad:

- Left stick: move
- Right stick: aim
- Right trigger / A: fire
- B / RB: dash
- Y: land / interact / board

## Graphics Modes

Choose a mode from the title screen:

- `LOW`: default for mobile and low-GPU machines. Caps DPR, disables glow-heavy effects, uses batched horde rendering.
- `MED`: cleaner vectors and moderate effects.
- `GLOW`: high-end PC mode with richer Vectrex bloom, layered shockwaves, brighter orbitals, and heavier particles.

## Upgrade Loop

Galactic Hordes does not open upgrade choices immediately on level-up. XP banks mutation signals. To spend them:

1. Survive in space and collect XP shards.
2. Land on a planet.
3. Salvage crystals, scrap, cores, and mystery caches.
4. Return to the ship.
5. Spend banked mutation signals at the workbench.

Workbench choices are weighted by rarity and biased toward upgrades already owned. Maxed upgrades disappear. If a maxed weapon has the right planet relic, an evolution can appear as a jackpot choice.

Upgrades are grouped into bigger build buckets:

- `WEAPONS`: fire pattern, damage shape, pierce, orbitals, elites, chains.
- `NAVIGATION`: manual speed, brighter trail feedback, and `Nav Ghost` improvements to the default low-input cruise brain.
- `SURVIVAL`: shields, hull, sustain, and mistake recovery.
- `ECONOMY`: pickups, luck, cargo, and planet profit.
- `PLANETCRAFT`: reading planets and making mystery boxes safer/richer.
- `CONTROL`: dash traps, heat tempo, phase safety, and escape tools.

See [docs/upgrade-progression-design.md](docs/upgrade-progression-design.md) for the full progression design.

## Endless Exploration

Space is split into deterministic 3600px sectors around the player. The game keeps nearby sectors alive in memory and prunes distant ones, so travelling across boundaries feels seamless without turning the whole universe into one huge expensive scene.

Each sector has its own generated starfield and one to three planets. Planets have an archetype:

- `cache`: richer salvage and more jackpot odds
- `hostile`: heavier surface fights
- `repair`: safer dock with more hull repair
- `relic`: stronger rare-object odds
- `strange`: volatile mixed rewards and ambushes
- `horde`: a vast enemy wave guarding a large treasure spill

Visited planets stay remembered for the run even if their sector is unloaded and regenerated later.

## Planet Salvage

Planets are mystery boxes. The first planet landing in a run is curated as a friendly, loot-rich tutorial stop with an alien contact, inspectable relic/lore signals, and only a few easy enemies. After that, landing first rolls a surface event, then a broader encounter scenario. Early planets skew toward salvage and simple resource grabs; as run time, level, and visited planets climb, the generator pushes more boss-like, horde-vault, and mixed discoveries into the pool.

The main encounter scenarios are:

- `salvage`: mostly resources and collectables, with an occasional enemy.
- `boss`: a bespoke generated creature guarding richer cache rewards.
- `friendly`: a strange alien NPC with a one-time offer.
- `mixed`: some combination of dangerous life, resources, and alien weirdness.
- `lore`: quiet ruins with inspectable two-sentence discoveries and small rewards.
- `horde`: a dangerous treasure vault with a large enemy crowd and a massive post-fight cache.

Surface caches can grant:

- scrap
- crystals
- cores
- mutation signals
- rare relics
- ambushes
- evolution catalysts

Relics can unlock weapon evolutions, but many come with downsides.

Some planets also contain strange alien entities. Walk up and tap `TALK`/press `E` to hear the offer. Taking the gift is a one-time roll: it may heal, reveal, grant rare artefacts, or enrich you, but it can also bite, steal resources, or wake hostile things.

See [docs/vector-sprite-generation-workflow.md](docs/vector-sprite-generation-workflow.md) for the repeatable GPT Image sprite-catalog workflow.

## Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

The current local dev server usually runs at:

```text
http://127.0.0.1:5176/
```

## Design Direction

The goal is an addictive mobile survival loop:

> one more horde, one more planet, one more cache, one more mutation.

The game should stay readable and performant on low-end hardware while still offering a neon-heavy GLOW mode for stronger GPUs.
