export type PlanetArchetype = 'cache' | 'hostile' | 'repair' | 'relic' | 'strange' | 'lore' | 'horde'
export type SurfaceEventKind = 'jackpot' | 'swarm' | 'relic' | 'repair' | 'volatile' | 'standard' | 'horde'
export type SurfaceScenarioKind = 'salvage' | 'boss' | 'friendly' | 'mixed' | 'lore' | 'horde'

interface RollPlanetArchetypeInput {
  chunkX: number
  chunkY: number
  index: number
  random: () => number
}

interface PlanSurfaceEncounterInput {
  planetArchetype: PlanetArchetype
  firstRunLanding: boolean
  firstVisitToPlanet: boolean
  interest: number
  time: number
  random: () => number
  luck?: number
  survey?: number
}

export interface SurfaceEncounterProfile {
  event: SurfaceEventKind
  scenario: SurfaceScenarioKind
  resourceCount: number
  threatCount: number
  bossCount: number
  alienCount: number
  loreSiteCount: number
  bossCacheCount: number
}

export const rollPlanetArchetype = ({ chunkX, chunkY, index, random }: RollPlanetArchetypeInput): PlanetArchetype => {
  if (chunkX === 0 && chunkY === 0 && index === 0) return 'cache'
  const archetypes: PlanetArchetype[] = ['cache', 'hostile', 'repair', 'relic', 'strange', 'lore', 'horde']
  return archetypes[Math.floor(random() * archetypes.length)]
}

export const planSurfaceEncounter = (input: PlanSurfaceEncounterInput): SurfaceEncounterProfile => {
  if (input.firstRunLanding) {
    return {
      event: 'relic',
      scenario: 'friendly',
      resourceCount: 24 + Math.floor(input.random() * 7),
      threatCount: 2 + Math.floor(input.random() * 2),
      bossCount: 0,
      alienCount: 1,
      loreSiteCount: 3,
      bossCacheCount: 0
    }
  }

  if (input.planetArchetype === 'horde') {
    return {
      event: 'horde',
      scenario: 'horde',
      resourceCount: 34 + Math.floor(input.random() * 18) + Math.floor(input.interest * 8),
      threatCount: 22 + Math.floor(input.time / 70) + Math.floor(input.interest * 8),
      bossCount: 1,
      alienCount: 0,
      loreSiteCount: 0,
      bossCacheCount: 10 + Math.floor(input.interest * 8)
    }
  }

  const event = rollSurfaceEvent(input)
  const scenario = rollSurfaceScenario(input.planetArchetype, event, input.firstVisitToPlanet, input.interest, input.random)
  return {
    event,
    scenario,
    resourceCount: rollResourceCount(event, scenario, input.firstVisitToPlanet, input.random),
    threatCount: rollThreatCount(event, scenario, input.firstVisitToPlanet, input.time, input.random),
    bossCount: scenario === 'boss' || scenario === 'mixed' ? 1 : 0,
    alienCount: rollAlienCount(event, scenario, input.random),
    loreSiteCount: rollLoreSiteCount(input.planetArchetype, event, scenario, input.random),
    bossCacheCount: 5 + Math.floor(input.interest * 5)
  }
}

const rollSurfaceEvent = (input: PlanSurfaceEncounterInput): SurfaceEventKind => {
  const first = input.firstVisitToPlanet
  const random = input.random
  if (input.planetArchetype === 'lore' && first && random() < 0.62) return 'relic'
  if (input.planetArchetype === 'hostile' && random() < 0.65) return 'swarm'
  if (input.planetArchetype === 'repair' && random() < 0.68) return 'repair'
  if (input.planetArchetype === 'relic' && first && random() < 0.72) return 'relic'
  if (input.planetArchetype === 'strange' && random() < 0.55) return 'volatile'
  if (input.planetArchetype === 'cache' && random() < 0.45) return 'jackpot'
  const luck = (input.luck ?? 0) * 0.025 + (input.survey ?? 0) * 0.02
  const roll = random()
  if (roll < 0.16 + luck) return 'jackpot'
  if (roll < 0.32 + luck) return 'swarm'
  if (roll < 0.44 + luck && first) return 'relic'
  if (roll < 0.56) return 'volatile'
  if (roll < 0.68) return 'repair'
  return 'standard'
}

const rollSurfaceScenario = (
  archetype: PlanetArchetype,
  event: SurfaceEventKind,
  first: boolean,
  interest: number,
  random: () => number
): SurfaceScenarioKind => {
  if (archetype === 'lore') return 'lore'
  let salvage = first ? 0.52 - interest * 0.24 : 0.72 - interest * 0.12
  let boss = 0.11 + interest * 0.24
  let friendly = 0.18 + interest * 0.14
  let mixed = 0.04 + interest * 0.16
  let lore = 0.06 + interest * 0.1
  if (archetype === 'hostile' || event === 'swarm') {
    boss += 0.24
    friendly -= 0.08
    salvage -= 0.14
  }
  if (archetype === 'repair' || event === 'repair') {
    friendly += 0.24
    boss -= 0.08
    lore += 0.05
  }
  if (archetype === 'relic' || archetype === 'strange' || event === 'relic' || event === 'volatile') {
    mixed += 0.16
    boss += 0.08
    friendly += 0.08
    lore += 0.08
    salvage -= 0.12
  }
  if (!first) {
    mixed *= 0.55
    boss *= 0.72
    lore *= 0.52
  }
  salvage = Math.max(0.12, salvage)
  boss = Math.max(0.04, boss)
  friendly = Math.max(0.06, friendly)
  mixed = Math.max(0.02, mixed)
  lore = Math.max(0.02, lore)
  const pick = random() * (salvage + boss + friendly + mixed + lore)
  if (pick < salvage) return 'salvage'
  if (pick < salvage + boss) return 'boss'
  if (pick < salvage + boss + friendly) return 'friendly'
  if (pick < salvage + boss + friendly + mixed) return 'mixed'
  return 'lore'
}

const rollResourceCount = (
  event: SurfaceEventKind,
  scenario: SurfaceScenarioKind,
  first: boolean,
  random: () => number
) => {
  if (scenario === 'lore') return 5 + Math.floor(random() * 5)
  if (scenario === 'friendly') return 9 + Math.floor(random() * 7)
  if (event === 'jackpot') return 28 + Math.floor(random() * 14)
  if (event === 'relic') return 12 + Math.floor(random() * 6)
  if (event === 'repair') return 8 + Math.floor(random() * 5)
  if (event === 'volatile') return 16 + Math.floor(random() * 8)
  if (first) return 10 + Math.floor(random() * 5)
  return 5 + Math.floor(random() * 4)
}

const rollThreatCount = (
  event: SurfaceEventKind,
  scenario: SurfaceScenarioKind,
  first: boolean,
  time: number,
  random: () => number
) => {
  if (scenario === 'lore') return event === 'swarm' ? 3 : random() < 0.16 ? 1 : 0
  if (scenario === 'friendly') return event === 'swarm' ? 4 : random() < 0.18 ? 1 : 0
  if (scenario === 'salvage') return event === 'swarm' ? 7 + Math.floor(time / 55) : random() < 0.32 ? 1 : 0
  if (event === 'swarm') return 10 + Math.floor(time / 45)
  if (event === 'volatile') return 4 + Math.floor(time / 80)
  return (first ? 1 : 0) + (random() < 0.45 ? 1 : 0)
}

const rollAlienCount = (event: SurfaceEventKind, scenario: SurfaceScenarioKind, random: () => number) => {
  const chance =
    scenario === 'friendly' ? 1 :
    scenario === 'mixed' ? 0.72 :
    event === 'swarm' ? 0.06 :
    event === 'volatile' ? 0.22 :
    event === 'repair' ? 0.72 :
    event === 'standard' ? 0.58 :
    event === 'relic' ? 0.46 :
    0.28
  return random() <= chance ? 1 : 0
}

const rollLoreSiteCount = (
  archetype: PlanetArchetype,
  event: SurfaceEventKind,
  scenario: SurfaceScenarioKind,
  random: () => number
) => {
  if (scenario === 'lore') return 2 + Math.floor(random() * 3)
  if (event === 'relic' || archetype === 'strange') return random() < 0.34 ? 1 : 0
  return 0
}
