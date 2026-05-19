# Galactic Hordes Upgrade Progression Design

Galactic Hordes uses Vampire Survivors-style build pressure, but moves the upgrade moment to the ship workbench after planet salvage. XP banks mutation signals. Planets create uncertainty. The workbench creates commitment.

## Core Loop

1. Fly through space, auto-fire, kill hordes, collect XP shards.
2. XP levels bank mutation signals instead of opening upgrades immediately.
3. Land on a planet to collect scrap, crystal, cores, and cache mystery boxes.
4. Return to the ship; the workbench shows 5 clickable offers from the currently unlocked upgrade pool.
5. Choices are weighted by rarity and biased toward already-owned modules.
6. Maxed weapons plus matching relics can evolve into jackpot weapons.
7. If normal upgrades run out, Limit Break keeps feeding small infinite upgrades.

## Upgrade Buckets

The workbench should feel like choosing a build direction, not buying tiny line items. Every upgrade belongs to a larger bucket:

- **Weapons**: how the ship kills hordes, elites, and bosses.
- **Navigation**: how much the player can shape the default auto-cruise, from light nudges to smarter autonomous routing.
- **Survival**: shield, hull, sustain, and forgiveness.
- **Economy**: pickup reach, resource yield, luck, and score pressure.
- **Planetcraft**: safer/richer planet decisions and mystery-box reading.
- **Control**: dash traps, heat tempo, phase safety, and escape tools.

## Workbench Rules

- Owned upgrades are more likely to appear, so builds cohere over a run.
- Maxed upgrades stop appearing as installable offers, but remain visible below current offers as completed systems.
- Locked future systems appear below maxed systems with unlock hints.
- Rare runs can offer relics directly, but planets are the main source of relics.
- Available evolutions get priority as golden choices.
- Limit Break appears only when the normal pool is exhausted or nearly exhausted.

## Weapons

| Weapon | Max | Rarity | Level Progression | Catalyst | Evolution |
|---|---:|---:|---|---|---|
| Pulse Cannon | 8 | 100 | base pulse, cooldown, damage, cooldown, double-pulse, speed, cooldown, evolution-ready | Static Idol | Choir Cannon: three-note burst volley |
| Prism Barrel | 6 | 86 | side ray, control, side ray, damage, side ray, evolution-ready | Glass Reactor | Shatter Prism: wider fan and cracked damage rays |
| Ghost Rounds | 5 | 80 | pierce, pierce, damage, pierce, double pierce | none | none |
| Rail Lattice | 6 | 62 | rail shot, rail damage, faster rail cadence, pierce, faster cadence, evolution-ready | Dead Sun Coin | Solar Lance: heavier screen-splitting rail shots |
| Echo Chamber | 5 | 70 | bullet lifetime, speed, lifetime, echo damage, evolution-ready | Black Box Saint | Resonance Wake: longer damaging trails |
| Ion Moons | 6 | 72 | orbital, radius, orbital, damage, orbital, evolution-ready | Hungry Compass | Gravity Halo: orbitals pull enemies inward |
| Mine Wake | 5 | 55 | dash mines, damage, extra mine, duration, evolution-ready | Forbidden Map | Comet Net: dash mines form larger constellations |
| Static Arc | 5 | 50 | chain hop, arc damage, chain hop, chain hop, evolution-ready | Saint Capacitor | Storm Liturgy: stronger chain lightning |
| Rift Needle | 5 | 45 | periodic needle, damage, faster cadence, pierce, evolution-ready | Mirror Seed | Black Needle: elite-killing heavy shots |

## Ship Systems

| System | Max | Rarity | Purpose |
|---|---:|---:|---|
| Drift Engine | 6 | 95 | Navigation: manual speed, recovery, and dash cadence |
| Nav Ghost | 7 | 82 | Navigation: stronger default cruise, planet lock, threat weave, salvage bias |
| Signal Magnet | 6 | 92 | Economy: pickup comfort and XP collection routing |
| Halo Battery | 5 | 78 | Survival: regenerating shield and mistake forgiveness |
| Hull Stitcher | 5 | 78 | Survival: max hull, full repairs, repair scaling |
| Salvage Hunger | 4 | 52 | Survival: kill-to-repair drops |
| Survey Array | 4 | 58 | Planetcraft: safer planet caches and better relic odds |
| Luck Coil | 5 | 54 | Economy: rarer workbench rolls and better mystery boxes |
| Cargo Spine | 4 | 66 | Economy: more scrap, crystals, cores, and cache score |
| Heat Sink | 4 | 62 | Control: cooldown support for fast-fire builds |
| Phase Rudder | 4 | 58 | Control: dash invulnerability and reduced collision damage |

## Nav Ghost Progression

Baseline movement now starts as low-input cruise: the ship keeps travelling on the last chosen heading, auto-fires at targets, and lets the player bend direction with small nudges. Nav Ghost no longer unlocks that core feel; it improves it until navigation becomes a build identity.

| Rank | Unlock | Player Effect |
|---:|---|---|
| 0 | Baseline Cruise | Releasing movement keeps the ship travelling in the last selected heading. |
| 1 | Vector Memory | Autopilot holds course harder and cruises faster. |
| 2 | Course Bend | Player nudges have more authority over the cruising heading. |
| 3 | Planet Lock | `USE`/`LOCK` away from a landing zone sets a course to the nearest planet beacon. |
| 4 | Threat Weave | The heading subtly bends away from nearby enemies. |
| 5 | Salvage Bias | When idle and unlocked, the heading bends toward valuable pickups. |
| 6 | Overdrive Nav | Cruise speed and heading response increase. |
| 7 | Ghost Pilot | Autonomous steering becomes strong enough to feel like a build identity. |

## Planet Relics

| Relic | Role | Downside |
|---|---|---|
| Static Idol | Catalyst for Choir Cannon, improves spark fantasy | more ambush pressure |
| Glass Reactor | Catalyst for Shatter Prism, damage lens | slower shield recharge |
| Dead Sun Coin | Catalyst for Solar Lance, richer boss cache fantasy | hunter after takeoff |
| Hungry Compass | Catalyst for Gravity Halo, huge pull fantasy | enemies steer harder |
| Black Box Saint | Catalyst for Resonance Wake, cache jackpot flavor | stranger threats |
| Mirror Seed | Catalyst for Black Needle, reroll/needle fantasy | more cursed energy |
| Saint Capacitor | Catalyst for Storm Liturgy, pulse lightning fantasy | pulse pressure |
| Forbidden Map | Catalyst for Comet Net, hidden route fantasy | elite patrol flavor |

## Planet Cache Table

Every cache grants score, scrap, crystal, and at least one core. Then it rolls:

- Relic roll: 18% base, improved by Luck Coil and Survey Array.
- Mutation signal roll: 38% base, improved by Luck Coil and Survey Array.
- Ambush roll: 28% base, reduced by Survey Array, increased by Static Idol.
- Cargo Spine increases all resource yields and can add extra cores.

## Limit Breaks

Once normal upgrades and evolutions are exhausted, workbench choices become:

- Might: +3% weapon damage equivalent.
- Cooldown: small permanent fire-rate improvement.
- Amount: every third rank adds another prism ray.
- Velocity: projectile speed.
- Magnet: pickup reach.
- Hull: max hull and a small repair.

## Balance Intent

The first 5 minutes should offer obvious survival and fire-rate improvements. Minutes 5-12 should make builds diverge. Planet relics should create "one more planet" pressure. Evolutions should feel like jackpots, not guaranteed scheduled rewards.
