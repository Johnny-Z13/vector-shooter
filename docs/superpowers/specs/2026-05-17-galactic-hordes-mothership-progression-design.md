# Galactic Hordes Mothership Progression Design

Date: 2026-05-17
Status: V1 design direction

## Design Thesis

Galactic Hordes is a run-based survival expedition game built around Vampire Survivors-style pressure, planet mystery boxes, and mothership meta-progression.

The player pilots a small scout ship through galactic hordes, kills enemies for XP, lands on planets for salvage and discovery, then either extracts through a return beacon or dies and recovers partial black-box data. Each run should feel useful, but clean extraction should feel meaningfully smarter and more profitable than destruction.

The intended feeling is:

> I pushed one expedition deeper, found strange things, fed the mothership, and unlocked a better next run.

Player skill should matter, but lightly. The important decisions are movement, planet choice, when to extract, and how to shape a build at the workbench.

## Core Loop

1. Launch from the mothership.
2. Survive in endless procedural space.
3. Kill galactic hordes and collect XP.
4. XP banks mutation signals instead of opening upgrades immediately.
5. Find and land on planets.
6. Planet surfaces provide salvage, crystals, cores, relics, aliens, lore, caches, and danger.
7. Returning to the scout ship opens the workbench to spend mutation signals.
8. After 5 minutes and at least 1 planet landing, return beacons can appear.
9. The player extracts through a beacon or pushes deeper.
10. The run ends in a debrief, then returns to the mothership hub.

## Player Experience

The game should not be a hardcore mastery roguelike. It should be closer to a productive expedition loop with rising pressure.

The player should feel:

- Curious about the next planet.
- Greedy about pushing to one more cache, relic, or lore signal.
- Satisfied when numbers climb and systems come online.
- Lightly threatened by the horde, without feeling punished for every mistake.
- Pulled back to the mothership because there is always one more upgrade, archive entry, or signal to inspect.

The main challenge is keeping the optimal play pattern interesting. If the best strategy becomes standing still and waiting for numbers to grow, the action layer collapses. Space movement, planet signals, return beacons, and surface salvage should keep the player making small decisions.

## Economy

### Current-Run Economy

XP and mutation signals are current-run resources.

- XP drops from enemies and some planet resources.
- XP levels bank mutation signals.
- Mutation signals are spent at the ship workbench.
- Mutation signals do not persist between runs.

The job of XP is to make the current expedition escalate.

### Persistent Economy

The first persistent currency set should reuse the existing resources:

- Scrap: common engineering currency.
- Crystals: discovery and signal currency.
- Cores: rare breakthrough currency.
- Archive records: permanent discovery progress.

Scrap improves practical mothership infrastructure. Crystals support scanner, archive, and signal systems. Cores unlock major upgrades, late tiers, blueprints, and future system expansions.

### Reset Between Runs

These should reset at the end of each expedition:

- XP.
- Banked mutation signals.
- Weapon levels.
- Ship system levels gained during the run.
- Active relic effects.
- Evolutions.
- Limit breaks.
- Temporary build synergies.

### Persist Between Runs

These should persist between runs:

- Scrap.
- Crystals.
- Cores.
- Archive discoveries.
- Relic blueprints or relic discovery records.
- Unlocked weapons and systems.
- Mothership department upgrades.
- Story and Signal Core progress.

Permanent progression should make future runs wider, clearer, and more controllable. It should not simply erase the danger of the run.

## Planets

Planets are the game's main discovery objects. They should remain mystery boxes, but not pure randomness.

Current archetypes remain the right base:

- Cache.
- Hostile.
- Repair.
- Relic.
- Strange.
- Lore.
- Horde.

Planets should provide readable signal categories before landing as scanner upgrades come online. The player should know the risk/reward family, but not the exact outcome.

Planet landings should usually stay fast:

1. Approach planet.
2. Land.
3. Reveal surface event.
4. Salvage, fight, inspect, or interact.
5. Return to the ship.
6. Spend banked mutation signals.
7. Take off.

Do not add a 2-3 choice menu to every landing in V1. Choices should appear through special content such as aliens, relic bargains, anomalies, and rare events.

Design rule:

> XP makes the ship stronger. Planets make the run memorable.

## Surface Expeditions

Planet surfaces are a reward break and discovery layer, not a second full game.

Surface expeditions should stay short, readable, and focused. They can have danger, oxygen pressure, resources, alien contacts, lore sites, caches, and bosses, but they should not become long levels that compete with the space survival loop.

Recommended surface role:

- Provide a rhythm break from space horde pressure.
- Let the player physically collect salvage and caches.
- Reveal strange narrative fragments.
- Gate workbench upgrade spending behind landing and returning.
- Create memorable moments through relics, aliens, and rare encounters.

Primary risk:

> If surface expeditions become too long, Galactic Hordes stops feeling like a survival expedition game and becomes two competing games.

## Return Beacons

Return beacons are the clean extraction mechanic. They create the decision to bank the expedition or push deeper.

### First Beacon

The first return beacon becomes eligible only when:

- The player has survived at least 5 minutes.
- The player has landed on at least 1 planet.

This ensures the player has completed the core expedition loop before extraction appears.

### Beacon Behavior

- Beacons appear in space, not on planets.
- The beacon spawns at a navigable distance.
- Scanner upgrades improve beacon visibility and direction finding.
- The player must enter the beacon zone and hold position briefly.
- Enemies continue attacking during activation.
- Successful activation extracts the scout ship to the mothership.

### Skipping Beacons

Ignoring a beacon should increase the extraction bonus. Later beacon windows should appear after roughly another 4 minutes. Later beacons can spawn farther away or under heavier horde pressure.

Simple V1 rule:

- First beacon after 5 minutes plus 1 planet.
- If ignored, another beacon can appear about 4 minutes later.
- Each skipped beacon adds an extraction bonus.
- Cap the bonus until the economy has been tested.

Design rule:

> Extraction should be a tempting interruption, not an emergency pause button.

## Run-End Outcomes

The debrief should make even a failed run feel useful, while making extraction feel clearly better.

### Destroyed

The scout ship is destroyed and the mothership recovers the black box.

Persist:

- Archive discoveries.
- Lore entries.
- First-time planet records.
- Relic discovery records.
- Partial scrap, crystals, and cores.

Lose:

- Run build.
- Active relic effects.
- XP level.
- Mutation signals.
- Extraction bonus.

Suggested recovery range:

- 35-50% of normal resources.
- Major first-time discoveries should still be protected.

### Clean Extraction

The scout ship leaves through a return beacon.

Persist:

- Full resources.
- Archive discoveries.
- Relic records.
- Extraction bonus.
- Better archive processing.

Clean extraction should feel like the player made a smart strategic decision.

### Deep Extraction

The player skips an earlier beacon and extracts later.

Persist:

- Full resources.
- Larger extraction bonus.
- Better rare signal or core chance.
- Possible deep expedition badge or debrief label.

Deep extraction is the greed path: more risk, more reward, stronger story of the run.

## Debrief

Debrief is a report, not the upgrade shop. It should celebrate the run, then return the player to the mothership hub.

Recommended debrief sections:

- Expedition Outcome.
- Recovered Resources.
- New Discoveries.
- Archive Progress.
- Signals Decoded.
- Mothership Upgrade Available indicators.

After debrief, the player continues to the mothership command deck. From there they can launch, inspect archive entries, upgrade mothership systems, adjust loadout, or review signals.

Design rule:

> Debrief celebrates the run. The mothership converts it into progression.

## Mothership Hub

The mothership should be an atmospheric in-world command deck wrapper around a fast menu.

It should feel massive, damaged, quiet, and functional. It should not be a walkable base or a chatty character.

Tone:

- Quiet.
- Lonely.
- Utilitarian.
- Mysterious.
- Sparse.

Avoid:

- Chatty AI.
- Long required dialogue.
- Slow walking between stations.
- A second management game.

Recommended hub sections:

- Launch Deck.
- Scanner Array.
- Shipyard.
- Workbench Bay.
- Archive Lab.
- Signal Core.

Design rule:

> The hub looks like a command deck, but behaves like a sharp menu.

## V1 Mothership Departments

V1 should start with three active upgrade departments. Other departments can appear visually as locked, damaged, or offline systems.

### Scanner Array

Purpose: make planet and beacon decisions better.

Tiers:

1. Planet Signatures: reveal planet archetype labels before landing.
2. Beacon Sweep: show return beacon direction and distance once eligible.
3. Risk Reading: show simple planet risk hints such as quiet, unstable, hostile, or extreme.
4. Relic Trace: show planets with stronger relic or cache signal odds.

Currency emphasis:

- Scrap.
- Crystals.

### Workbench Bay

Purpose: make current-run build drafting more satisfying.

Tiers:

1. Emergency Reroll: start each expedition with 1 workbench reroll.
2. Expanded Bench: add a small chance for 4 workbench choices.
3. Coherence Bias: owned upgrades and same-bucket upgrades appear more often.
4. Salvage Recycle: skip a workbench choice and convert the mutation signal into scrap or crystal.

Currency emphasis:

- Scrap.
- Cores for higher tiers.

Balance warning:

Salvage Recycle should be a consolation option, not the best farming strategy.

### Archive Lab

Purpose: turn discovery into progression.

Tiers:

1. Permanent Archive: discovered planets, relics, aliens, lore, and cache records persist between runs.
2. Relic Blueprints: found relics become future blueprint progress.
3. Discovery Rewards: completed archive sets grant crystals or cores.
4. Signal Decoding: lore entries contribute to Signal Core fragments and future content hooks.

Currency emphasis:

- Crystals.
- Cores for higher tiers.

Archive Lab Tier 1 should effectively be granted early. The archive is an emotional center of the game, not a luxury feature.

## Later Mothership Departments

These are not required for V1, but the hub can reserve space for them.

### Shipyard

Purpose: prepare the scout ship before launch.

Possible features:

- Choose starting weapon.
- Choose starting ship system.
- Small hull or shield prep.
- Cargo fittings.
- Emergency recall improvements.

Raw combat stats should remain modest.

### Logistics

Purpose: improve recovery, extraction, and cargo handling.

Possible features:

- Better black-box recovery.
- Higher extraction bonus.
- Increased cargo retention.
- Return beacon appears slightly sooner.
- Deep-run multiplier improvements.

### Signal Core

Purpose: provide the long-term mystery layer.

Possible features:

- Decode horde-origin fragments.
- Unlock new planet/event types.
- Reveal late-game signal chains.
- Gate rare unlocks behind lore and archive progress.

The Signal Core should stay sparse and mysterious. It should not over-explain the setting too early.

## Starting Loadout

Starting loadouts are recommended later, not as the first V1 priority.

Recommended progression:

1. Early game: fixed starter weapon.
2. After unlocks: choose 1 starting weapon.
3. Later: choose 1 starting weapon plus 1 starting system.
4. Much later: optionally choose a weakened relic blueprint slot.

Good starting weapon candidates:

- Pulse Cannon: balanced.
- Prism Barrel: area/fan.
- Rail Lattice: piercing line damage.
- Ion Moons: passive orbiting defense.

Good starting system candidates:

- Signal Magnet: easier XP collection.
- Drift Engine: better movement.
- Halo Battery: safety.
- Survey Array: better planet outcomes.

Design rule:

> Loadout chooses the first 2 minutes. Planet and workbench choices decide the run.

## Progression Model

Use simple linear department tiers first. Avoid a large branching tree in V1.

Rationale:

- Faster to implement.
- Easier to balance.
- Easier for players to understand.
- Keeps focus on expeditions.
- Still supports the fantasy of mothership systems coming online.

Later, milestone choices can be added at important tiers. Example: Scanner Array III could offer a calibration choice between planet reading, beacon reading, or relic reading. Do not build this until the core meta-loop is proven.

## Design Risks

### Surface Scope Creep

Planet surfaces are valuable, but they can easily become the main game. Keep them short and focused.

### Permanent Power Creep

Permanent damage, fire rate, hull, and income upgrades can flatten the run game. Prefer upgrades that add information, options, recovery, and control.

### Hub Friction

The mothership should look atmospheric, but launching another run must stay fast. The hub should not require walking, repeated dialogue, or slow animation gates.

### Menu Overload

Do not turn every planet, cache, and landing into a menu choice. Preserve the speed and surprise of the current prototype.

### Resource Bloat

Do not add a separate research currency yet. Use scrap, crystals, cores, and archive records.

## V1 Scope Recommendation

The first implementation plan should focus on:

1. Persistent resource and archive data model.
2. Run-end outcome handling.
3. Debrief screen.
4. Mothership command hub wrapper.
5. Scanner Array, Workbench Bay, and Archive Lab departments.
6. Return beacon extraction loop.
7. Black-box recovery on death.

V1 should not focus on:

- Large branching upgrade trees.
- Full starting loadout system.
- Offline idle gains.
- Walkable mothership.
- Complex mission selection.
- Fully developed Signal Core story chain.

## Summary

Galactic Hordes should stay centered on expeditions:

> Launch, survive, land, salvage, discover, upgrade, extract or die, feed the mothership, launch again.

The mothership explains persistence. The scout ship delivers play. Planets make runs memorable. XP makes runs escalate. Beacons create risk/reward. The archive gives curiosity a permanent home.
