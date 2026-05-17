export type PersistentResourceKey = 'scrap' | 'crystal' | 'cores'
export type MothershipDepartmentId = 'scanner' | 'workbench' | 'archive'
export type RunOutcomeKind = 'destroyed' | 'cleanExtraction' | 'deepExtraction'
export type ArchiveKind = 'relic' | 'alien' | 'lore' | 'planet' | 'cache'

export interface ResourceBundle {
  scrap: number
  crystal: number
  cores: number
}

export interface PersistentArchiveRecord {
  id: string
  kind: ArchiveKind
  title: string
  detail?: string
  source?: string
  color?: string
  icon?: number
  count?: number
}

export interface MothershipState {
  version: 1
  resources: ResourceBundle
  departments: Record<MothershipDepartmentId, number>
  archive: {
    records: Record<string, PersistentArchiveRecord>
    relicBlueprints: Record<string, number>
    signalFragments: number
  }
}

export interface RunRecoveryInput {
  outcome: RunOutcomeKind
  resources: ResourceBundle
  archiveRecords: Record<string, PersistentArchiveRecord>
  skippedBeacons: number
}

interface DepartmentTier {
  name: string
  description: string
  cost: ResourceBundle
}

interface DepartmentDefinition {
  id: MothershipDepartmentId
  name: string
  description: string
  tiers: DepartmentTier[]
}

export const emptyResources = (): ResourceBundle => ({ scrap: 0, crystal: 0, cores: 0 })

export const defaultMothershipState = (): MothershipState => ({
  version: 1,
  resources: emptyResources(),
  departments: {
    scanner: 0,
    workbench: 0,
    archive: 1
  },
  archive: {
    records: {},
    relicBlueprints: {},
    signalFragments: 0
  }
})

export const mothershipDepartments: Record<MothershipDepartmentId, DepartmentDefinition> = {
  scanner: {
    id: 'scanner',
    name: 'Scanner Array',
    description: 'Planet, beacon, risk, and relic signal intelligence.',
    tiers: [
      { name: 'Planet Signatures', description: 'Reveal planet archetype labels before landing.', cost: { scrap: 120, crystal: 0, cores: 0 } },
      { name: 'Beacon Sweep', description: 'Show return beacon direction and distance once eligible.', cost: { scrap: 220, crystal: 18, cores: 0 } },
      { name: 'Risk Reading', description: 'Show simple planet risk hints.', cost: { scrap: 360, crystal: 44, cores: 1 } },
      { name: 'Relic Trace', description: 'Mark planets with stronger relic or cache signal odds.', cost: { scrap: 520, crystal: 80, cores: 2 } }
    ]
  },
  workbench: {
    id: 'workbench',
    name: 'Workbench Bay',
    description: 'Improves mutation signal drafting between landings.',
    tiers: [
      { name: 'Emergency Reroll', description: 'Start each expedition with 1 workbench reroll.', cost: { scrap: 140, crystal: 0, cores: 0 } },
      { name: 'Expanded Bench', description: 'Small chance for 4 workbench choices.', cost: { scrap: 260, crystal: 16, cores: 0 } },
      { name: 'Coherence Bias', description: 'Owned and same-bucket upgrades appear more often.', cost: { scrap: 420, crystal: 36, cores: 1 } },
      { name: 'Salvage Recycle', description: 'Convert unwanted mutation signals into resources.', cost: { scrap: 640, crystal: 70, cores: 2 } }
    ]
  },
  archive: {
    id: 'archive',
    name: 'Archive Lab',
    description: 'Turns discoveries into permanent progression.',
    tiers: [
      { name: 'Permanent Archive', description: 'Discovered planets, relics, aliens, lore, and caches persist.', cost: { scrap: 0, crystal: 0, cores: 0 } },
      { name: 'Relic Blueprints', description: 'Found relics become future blueprint progress.', cost: { scrap: 160, crystal: 26, cores: 0 } },
      { name: 'Discovery Rewards', description: 'Archive milestones grant crystals and cores.', cost: { scrap: 340, crystal: 58, cores: 1 } },
      { name: 'Signal Decoding', description: 'Lore contributes to Signal Core fragments.', cost: { scrap: 520, crystal: 96, cores: 2 } }
    ]
  }
}

const clampInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))

const normalizeResources = (resources: Partial<ResourceBundle> | undefined): ResourceBundle => ({
  scrap: clampInt(resources?.scrap ?? 0),
  crystal: clampInt(resources?.crystal ?? 0),
  cores: clampInt(resources?.cores ?? 0)
})

export const normalizeMothershipState = (value: unknown): MothershipState => {
  const fallback = defaultMothershipState()
  if (!value || typeof value !== 'object') return fallback
  const input = value as Partial<MothershipState>
  if (input.version !== 1) return fallback
  return {
    version: 1,
    resources: normalizeResources(input.resources),
    departments: {
      scanner: clampInt(input.departments?.scanner ?? 0),
      workbench: clampInt(input.departments?.workbench ?? 0),
      archive: Math.max(1, clampInt(input.departments?.archive ?? 1))
    },
    archive: {
      records: input.archive?.records && typeof input.archive.records === 'object' ? input.archive.records : {},
      relicBlueprints: input.archive?.relicBlueprints && typeof input.archive.relicBlueprints === 'object' ? input.archive.relicBlueprints : {},
      signalFragments: clampInt(input.archive?.signalFragments ?? 0)
    }
  }
}

export const mergeArchiveRecords = (
  existing: Record<string, PersistentArchiveRecord>,
  incoming: Record<string, PersistentArchiveRecord>
) => {
  const merged: Record<string, PersistentArchiveRecord> = { ...existing }
  for (const record of Object.values(incoming)) {
    const previous = merged[record.id]
    merged[record.id] = {
      ...previous,
      ...record,
      count: (previous?.count ?? 0) + 1
    }
  }
  return merged
}

const extractionMultiplier = (outcome: RunOutcomeKind, skippedBeacons: number) => {
  if (outcome === 'destroyed') return 0.45
  const skipBonus = Math.min(0.3, Math.max(0, skippedBeacons) * 0.1)
  return outcome === 'deepExtraction' ? 1.05 + skipBonus : 1
}

export const applyRunRecovery = (state: MothershipState, input: RunRecoveryInput): MothershipState => {
  const multiplier = extractionMultiplier(input.outcome, input.skippedBeacons)
  const recovered = normalizeResources({
    scrap: input.resources.scrap * multiplier,
    crystal: input.resources.crystal * multiplier,
    cores: input.outcome === 'destroyed' ? Math.floor(input.resources.cores * multiplier) : input.resources.cores
  })
  const archiveRecords = mergeArchiveRecords(state.archive.records, input.archiveRecords)
  const relicBlueprints = { ...state.archive.relicBlueprints }
  if (state.departments.archive >= 2) {
    for (const record of Object.values(input.archiveRecords)) {
      if (record.kind === 'relic') relicBlueprints[record.id] = (relicBlueprints[record.id] ?? 0) + 1
    }
  }
  const loreCount = Object.values(input.archiveRecords).filter((record) => record.kind === 'lore').length
  return {
    ...state,
    resources: {
      scrap: state.resources.scrap + recovered.scrap,
      crystal: state.resources.crystal + recovered.crystal,
      cores: state.resources.cores + recovered.cores
    },
    archive: {
      records: archiveRecords,
      relicBlueprints,
      signalFragments: state.archive.signalFragments + (state.departments.archive >= 4 ? loreCount : 0)
    }
  }
}

export const canAfford = (resources: ResourceBundle, cost: ResourceBundle) => (
  resources.scrap >= cost.scrap && resources.crystal >= cost.crystal && resources.cores >= cost.cores
)

const shortResource = (cost: ResourceBundle, resources: ResourceBundle) => {
  if (resources.scrap < cost.scrap) return 'Not enough scrap.'
  if (resources.crystal < cost.crystal) return 'Not enough crystals.'
  if (resources.cores < cost.cores) return 'Not enough cores.'
  return 'Department already maxed.'
}

export const purchaseMothershipTier = (state: MothershipState, department: MothershipDepartmentId) => {
  const definition = mothershipDepartments[department]
  const current = state.departments[department]
  const tier = definition.tiers[current]
  if (!tier || !canAfford(state.resources, tier.cost)) {
    return { ok: false as const, state, reason: tier ? shortResource(tier.cost, state.resources) : 'Department already maxed.' }
  }
  return {
    ok: true as const,
    state: {
      ...state,
      resources: {
        scrap: state.resources.scrap - tier.cost.scrap,
        crystal: state.resources.crystal - tier.cost.crystal,
        cores: state.resources.cores - tier.cost.cores
      },
      departments: {
        ...state.departments,
        [department]: current + 1
      }
    },
    purchased: tier
  }
}
