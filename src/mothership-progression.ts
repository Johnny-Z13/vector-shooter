export type PersistentResourceKey = 'scrap' | 'crystal' | 'cores'
export type MothershipDepartmentId = 'scanner' | 'workbench' | 'archive' | 'shipyard' | 'signalCore' | 'hangarCrew'
export type RunOutcomeKind = 'destroyed' | 'cleanExtraction' | 'deepExtraction'
export type ArchiveKind = 'relic' | 'alien' | 'lore' | 'planet' | 'cache' | 'enemy'

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
  unlock?: {
    department: MothershipDepartmentId
    tier: number
  }
  tiers: DepartmentTier[]
}

export const emptyResources = (): ResourceBundle => ({ scrap: 0, crystal: 0, cores: 0 })

export const defaultMothershipState = (): MothershipState => ({
  version: 1,
  resources: emptyResources(),
  departments: {
    scanner: 0,
    workbench: 0,
    archive: 1,
    shipyard: 0,
    signalCore: 0,
    hangarCrew: 0
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
      { name: 'Expanded Bench', description: 'Maxed and locked systems stay visible below current offers.', cost: { scrap: 260, crystal: 16, cores: 0 } },
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
  },
  shipyard: {
    id: 'shipyard',
    name: 'Shipyard',
    description: 'Launch frames, hull prep, and scout handling upgrades.',
    unlock: { department: 'workbench', tier: 4 },
    tiers: [
      { name: 'Reinforced Frame', description: 'Launch scouts with a stronger permanent hull frame.', cost: { scrap: 760, crystal: 86, cores: 2 } },
      { name: 'Vector Thrusters', description: 'Improve launch handling and baseline scout speed.', cost: { scrap: 980, crystal: 124, cores: 3 } },
      { name: 'Reserve Plating', description: 'Further improve hull integrity before every expedition.', cost: { scrap: 1240, crystal: 172, cores: 4 } },
      { name: 'Elite Scout Frame', description: 'Maximize mothership-backed launch durability.', cost: { scrap: 1580, crystal: 230, cores: 5 } }
    ]
  },
  signalCore: {
    id: 'signalCore',
    name: 'Signal Core',
    description: 'Deep signal decoding, stronger extraction telemetry, and beacon analysis.',
    unlock: { department: 'scanner', tier: 4 },
    tiers: [
      { name: 'Signal Triage', description: 'Recover a little more cargo from every completed extraction.', cost: { scrap: 720, crystal: 112, cores: 2 } },
      { name: 'Beacon Memory', description: 'Improve deep extraction processing after skipped beacons.', cost: { scrap: 940, crystal: 152, cores: 3 } },
      { name: 'Black Box Decode', description: 'Improve destroyed-run cargo reconstruction.', cost: { scrap: 1220, crystal: 198, cores: 4 } },
      { name: 'Core Harmonics', description: 'Maximize persistent extraction signal processing.', cost: { scrap: 1560, crystal: 260, cores: 5 } }
    ]
  },
  hangarCrew: {
    id: 'hangarCrew',
    name: 'Hangar Crew',
    description: 'Crew assignments that improve launch cargo and planet-side preparation.',
    unlock: { department: 'archive', tier: 4 },
    tiers: [
      { name: 'Salvage Crew', description: 'Start each expedition with a small scrap manifest.', cost: { scrap: 700, crystal: 104, cores: 2 } },
      { name: 'Crystal Runners', description: 'Add starting crystal reserves to each expedition.', cost: { scrap: 920, crystal: 148, cores: 3 } },
      { name: 'Dockside Scouts', description: 'Increase launch cargo and improve early economy.', cost: { scrap: 1180, crystal: 190, cores: 4 } },
      { name: 'Core Handlers', description: 'Start elite expeditions with one prepared core.', cost: { scrap: 1500, crystal: 248, cores: 5 } }
    ]
  }
}

const clampInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
const archiveKinds: readonly ArchiveKind[] = ['relic', 'alien', 'lore', 'planet', 'cache', 'enemy']

const normalizeResources = (resources: Partial<ResourceBundle> | undefined): ResourceBundle => ({
  scrap: clampInt(resources?.scrap ?? 0),
  crystal: clampInt(resources?.crystal ?? 0),
  cores: clampInt(resources?.cores ?? 0)
})

const clampDepartmentTier = (department: MothershipDepartmentId, value: number) => (
  Math.min(clampInt(value), mothershipDepartments[department].tiers.length)
)

const normalizeArchiveRecord = (value: unknown): PersistentArchiveRecord | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Partial<PersistentArchiveRecord>
  if (typeof record.id !== 'string' || typeof record.title !== 'string') return null
  if (!archiveKinds.includes(record.kind as ArchiveKind)) return null
  return {
    id: record.id,
    kind: record.kind as ArchiveKind,
    title: record.title,
    ...(typeof record.detail === 'string' ? { detail: record.detail } : {}),
    ...(typeof record.source === 'string' ? { source: record.source } : {}),
    ...(typeof record.color === 'string' ? { color: record.color } : {}),
    ...(typeof record.icon === 'number' ? { icon: clampInt(record.icon) } : {}),
    ...(typeof record.count === 'number' ? { count: clampInt(record.count) } : {})
  }
}

const normalizeArchiveRecords = (records: unknown) => {
  const normalized: Record<string, PersistentArchiveRecord> = {}
  if (!records || typeof records !== 'object') return normalized
  for (const value of Object.values(records)) {
    const record = normalizeArchiveRecord(value)
    if (record) normalized[record.id] = record
  }
  return normalized
}

const normalizeRelicBlueprints = (blueprints: unknown) => {
  const normalized: Record<string, number> = {}
  if (!blueprints || typeof blueprints !== 'object') return normalized
  for (const [id, value] of Object.entries(blueprints)) {
    if (typeof value !== 'number') continue
    const count = clampInt(value)
    if (count > 0) normalized[id] = count
  }
  return normalized
}

export const normalizeMothershipState = (value: unknown): MothershipState => {
  const fallback = defaultMothershipState()
  if (!value || typeof value !== 'object') return fallback
  const input = value as Partial<MothershipState>
  if (input.version !== 1) return fallback
  return {
    version: 1,
    resources: normalizeResources(input.resources),
    departments: {
      scanner: clampDepartmentTier('scanner', input.departments?.scanner ?? 0),
      workbench: clampDepartmentTier('workbench', input.departments?.workbench ?? 0),
      archive: Math.max(1, clampDepartmentTier('archive', input.departments?.archive ?? 1)),
      shipyard: clampDepartmentTier('shipyard', input.departments?.shipyard ?? 0),
      signalCore: clampDepartmentTier('signalCore', input.departments?.signalCore ?? 0),
      hangarCrew: clampDepartmentTier('hangarCrew', input.departments?.hangarCrew ?? 0)
    },
    archive: {
      records: normalizeArchiveRecords(input.archive?.records),
      relicBlueprints: normalizeRelicBlueprints(input.archive?.relicBlueprints),
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

const extractionMultiplier = (outcome: RunOutcomeKind, skippedBeacons: number, signalCore = 0) => {
  if (outcome === 'destroyed') return 0.45 + signalCore * 0.015
  const skipBonus = Math.min(0.3, Math.max(0, skippedBeacons) * 0.1)
  const signalBonus = signalCore * 0.03
  return outcome === 'deepExtraction' ? 1.05 + skipBonus + signalBonus : 1 + signalBonus
}

export const applyRunRecovery = (state: MothershipState, input: RunRecoveryInput): MothershipState => {
  const multiplier = extractionMultiplier(input.outcome, input.skippedBeacons, state.departments.signalCore)
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

export const isMothershipDepartmentUnlocked = (state: MothershipState, department: MothershipDepartmentId) => {
  const unlock = mothershipDepartments[department].unlock
  return !unlock || state.departments[unlock.department] >= unlock.tier
}

export const mothershipDepartmentUnlockText = (department: MothershipDepartmentId) => {
  const unlock = mothershipDepartments[department].unlock
  if (!unlock) return ''
  const parent = mothershipDepartments[unlock.department]
  return `${parent.name} ${unlock.tier}/${parent.tiers.length}`
}

const shortResource = (cost: ResourceBundle, resources: ResourceBundle) => {
  if (resources.scrap < cost.scrap) return 'Not enough scrap.'
  if (resources.crystal < cost.crystal) return 'Not enough crystals.'
  if (resources.cores < cost.cores) return 'Not enough cores.'
  return 'Department already maxed.'
}

export const purchaseMothershipTier = (state: MothershipState, department: MothershipDepartmentId) => {
  const definition = mothershipDepartments[department]
  if (!isMothershipDepartmentUnlocked(state, department)) {
    return { ok: false as const, state, reason: `${definition.name} offline. Requires ${mothershipDepartmentUnlockText(department)}.` }
  }
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
