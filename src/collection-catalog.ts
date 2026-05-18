import { spaceEnemyBalance, spaceEnemyKinds } from './game-balance'
import { relics } from './powerup-balance'
import type { ArchiveKind } from './mothership-progression'

export interface CollectionCatalogEntry {
  id: string
  kind: ArchiveKind
  title: string
  detail: string
  source: string
  color: string
  icon: number
}

const titleCase = (value: string) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (ch) => ch.toUpperCase())

const relicEntries: CollectionCatalogEntry[] = relics.map((relic, index) => ({
  id: `relic:${relic.id}`,
  kind: 'relic',
  title: relic.name,
  detail: relic.description,
  source: 'Relic signal',
  color: '#fff27a',
  icon: index
}))

const spaceEnemyEntries: CollectionCatalogEntry[] = spaceEnemyKinds.map((kind, index) => {
  const enemy = spaceEnemyBalance[kind]
  return {
    id: `enemy:space:${kind}`,
    kind: 'enemy',
    title: `${titleCase(kind)} Vector`,
    detail: `Space contact. Hull ${enemy.hp}, contact damage ${enemy.contactDamage}.`,
    source: 'Space horde telemetry',
    color: enemy.color,
    icon: 16 + index
  }
})

const surfaceEnemyEntries: CollectionCatalogEntry[] = [
  { id: 'enemy:surface:standard', kind: 'enemy', title: 'Surface Crawler', detail: 'Common hostile biosignal found near surface caches.', source: 'Planet surface telemetry', color: '#fff27a', icon: 32 },
  { id: 'enemy:surface:swarm', kind: 'enemy', title: 'Swarm Skitterer', detail: 'Fast surface lifeform found on bad planets and swarm events.', source: 'Planet surface telemetry', color: '#ff5d73', icon: 33 },
  { id: 'enemy:surface:horde', kind: 'enemy', title: 'Horde Larva', detail: 'Small hostile from horde vault planets.', source: 'Planet surface telemetry', color: '#ff61d8', icon: 34 },
  { id: 'enemy:surface:null-cathedral', kind: 'enemy', title: 'Cathedral Sentinel', detail: 'Special surface guardian tied to NULL CATHEDRAL.', source: 'Planet surface telemetry', color: '#ff5d73', icon: 35 },
  { id: 'enemy:surface:oracle', kind: 'enemy', title: 'Glass Mite Oracle', detail: 'A rare crystalline oracle form from strange worlds.', source: 'Planet surface telemetry', color: '#57fff3', icon: 36 },
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `enemy:surface:boss:${index}`,
    kind: 'enemy' as const,
    title: `Planet Boss ${index + 1}`,
    detail: 'Large generated creature guarding richer surface cache rewards.',
    source: 'Boss catalog telemetry',
    color: ['#57fff3', '#fff27a', '#8fff7d', '#ff61d8', '#d7fff7'][index],
    icon: 37 + index
  }))
]

const alienEntries: CollectionCatalogEntry[] = [
  { id: 'alien:the-glass-herbalist', kind: 'alien', title: 'The Glass Herbalist', detail: 'A quiet contact offering strange medicinal gifts.', source: 'Alien contact log', color: '#b990ff', icon: 48 },
  { id: 'alien:a-static-pilgrim', kind: 'alien', title: 'A Static Pilgrim', detail: 'A devotional signal wrapped around a bargaining lifeform.', source: 'Alien contact log', color: '#fff27a', icon: 49 },
  { id: 'alien:the-coin-keeper', kind: 'alien', title: 'The Coin Keeper', detail: 'An alien trader that weighs resources against risk.', source: 'Alien contact log', color: '#57fff3', icon: 50 },
  { id: 'alien:the-star-mapmaker', kind: 'alien', title: 'The Star Mapmaker', detail: 'A contact with impossible maps and dangerous routes.', source: 'Alien contact log', color: '#8fff7d', icon: 51 },
  { id: 'alien:the-relic-monk', kind: 'alien', title: 'The Relic Monk', detail: 'A silent keeper of artefacts and unstable bargains.', source: 'Alien contact log', color: '#b990ff', icon: 52 }
]

const loreEntries: CollectionCatalogEntry[] = [
  { id: 'lore:fossils', kind: 'lore', title: 'Fossil Field', detail: 'Old bones and pressure marks from extinct surface life.', source: 'Lore signal', color: '#d7fff7', icon: 56 },
  { id: 'lore:pyramid', kind: 'lore', title: 'Buried Pyramid', detail: 'A geometric ruin broadcasting from under the dust.', source: 'Lore signal', color: '#70a8ff', icon: 57 },
  { id: 'lore:grave', kind: 'lore', title: 'Signal Grave', detail: 'A memorial trace from a failed expedition.', source: 'Lore signal', color: '#fff27a', icon: 58 },
  { id: 'lore:machine', kind: 'lore', title: 'Buried Machine', detail: 'An ancient mechanism still thinking under the planet crust.', source: 'Lore signal', color: '#70a8ff', icon: 59 },
  { id: 'lore:choir', kind: 'lore', title: 'Choir Remnant', detail: 'A harmonic ruin that remembers the first galactic songs.', source: 'Lore signal', color: '#d7fff7', icon: 60 }
]

const planetEntries: CollectionCatalogEntry[] = [
  { id: 'planet:cache', kind: 'planet', title: 'Cache World', detail: 'Planet archetype with richer salvage and jackpot odds.', source: 'Planet survey', color: '#57fff3', icon: 64 },
  { id: 'planet:hostile', kind: 'planet', title: 'Hostile World', detail: 'Planet archetype with heavier surface fights.', source: 'Planet survey', color: '#ff5d73', icon: 65 },
  { id: 'planet:repair', kind: 'planet', title: 'Repair Dock', detail: 'Planet archetype with safer docking and hull recovery.', source: 'Planet survey', color: '#8fff7d', icon: 66 },
  { id: 'planet:relic', kind: 'planet', title: 'Relic World', detail: 'Planet archetype with stronger rare-object odds.', source: 'Planet survey', color: '#fff27a', icon: 67 },
  { id: 'planet:strange', kind: 'planet', title: 'Strange World', detail: 'Planet archetype with volatile mixed rewards and ambushes.', source: 'Planet survey', color: '#b990ff', icon: 68 },
  { id: 'planet:lore', kind: 'planet', title: 'Lore World', detail: 'Quiet ruin planet with inspectable old signals.', source: 'Planet survey', color: '#70a8ff', icon: 69 },
  { id: 'planet:horde', kind: 'planet', title: 'Horde Vault', detail: 'Dangerous treasure world guarded by a large enemy crowd.', source: 'Planet survey', color: '#ff61d8', icon: 70 }
]

const cacheEntries: CollectionCatalogEntry[] = [
  { id: 'cache:surface', kind: 'cache', title: 'Surface Cache', detail: 'A cracked open planet cache containing resources, signals, or relics.', source: 'Cache telemetry', color: '#fff27a', icon: 72 },
  { id: 'cache:treasure-core', kind: 'cache', title: 'Treasure Core', detail: 'A space broadcast cache carrying concentrated rewards.', source: 'Cache telemetry', color: '#70a8ff', icon: 73 }
]

export const collectionCatalog: CollectionCatalogEntry[] = [
  ...relicEntries,
  ...spaceEnemyEntries,
  ...surfaceEnemyEntries,
  ...alienEntries,
  ...loreEntries,
  ...planetEntries,
  ...cacheEntries
]
