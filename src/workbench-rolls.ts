import type { Upgrade, UpgradeId } from './powerup-balance'

export function firstOpportunityUpgrade<T extends { id: string; max: number }>(
  upgrades: T[],
  build: Record<string, number>,
  requiredId?: string
): T | null {
  if (!requiredId) return null
  if ((build[requiredId] ?? 0) > 0) return null
  return upgrades.find((upgrade) => upgrade.id === requiredId && (build[upgrade.id] ?? 0) < upgrade.max) ?? null
}

export const workbenchStarterUpgradeIds = ['rapid', 'engine', 'magnet', 'shield', 'split'] as const satisfies readonly UpgradeId[]

export const workbenchUnlockEdges = [
  { source: 'rapid', unlocks: ['chain', 'rail'] },
  { source: 'split', unlocks: ['pierce', 'echo'] },
  { source: 'engine', unlocks: ['nav', 'phase'] },
  { source: 'shield', unlocks: ['repair', 'vampire'] },
  { source: 'magnet', unlocks: ['luck', 'cargo'] },
  { source: 'luck', unlocks: ['survey'] },
  { source: 'survey', unlocks: ['suitO2', 'suitHealth', 'suitBlaster'] },
  { source: 'chain', unlocks: ['orbit'] },
  { source: 'rail', unlocks: ['rift'] },
  { source: 'echo', unlocks: ['rift'] },
  { source: 'phase', unlocks: ['mine'] },
  { source: 'cargo', unlocks: ['mine'] }
] as const satisfies ReadonlyArray<{ source: UpgradeId; unlocks: readonly UpgradeId[] }>

export interface WorkbenchLockedUpgrade<T extends { id: string }> {
  upgrade: T
  requirement: string
}

const upgradeName = <T extends { id: string; name?: string }>(upgrades: readonly T[], id: string) => (
  upgrades.find((upgrade) => upgrade.id === id)?.name ?? id
)

const unlockRequirement = <T extends { id: string; name?: string }>(upgrades: readonly T[], id: string) => {
  const sources = workbenchUnlockEdges
    .filter((edge) => (edge.unlocks as readonly UpgradeId[]).includes(id as UpgradeId))
    .map((edge) => upgradeName(upgrades, edge.source))
  if (!sources.length) return 'Future workbench unlock'
  return `Max ${sources.join(' or ')}`
}

export function workbenchUnlockedUpgradeIds<T extends { id: UpgradeId; max: number }>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): UpgradeId[] {
  const validIds = new Set(upgrades.map((upgrade) => upgrade.id))
  const starterIds: readonly UpgradeId[] = workbenchStarterUpgradeIds
  const unlocked = new Set<UpgradeId>(starterIds.filter((id) => validIds.has(id)))
  for (const edge of workbenchUnlockEdges) {
    const source = upgrades.find((upgrade) => upgrade.id === edge.source)
    if (!source || (build[edge.source] ?? 0) < source.max) continue
    for (const id of edge.unlocks) {
      if (validIds.has(id)) unlocked.add(id)
    }
  }
  return [
    ...starterIds.filter((id) => unlocked.has(id)),
    ...upgrades
      .filter((upgrade) => unlocked.has(upgrade.id) && !starterIds.includes(upgrade.id))
      .map((upgrade) => upgrade.id)
  ]
}

export function workbenchRollableUpgrades<T extends Upgrade>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): T[] {
  const unlocked = new Set(workbenchUnlockedUpgradeIds(upgrades, build))
  return upgrades.filter((upgrade) => unlocked.has(upgrade.id) && (build[upgrade.id] ?? 0) < upgrade.max)
}

export function workbenchLockedUpgrades<T extends Upgrade>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): Array<WorkbenchLockedUpgrade<T>> {
  const unlocked = new Set(workbenchUnlockedUpgradeIds(upgrades, build))
  return upgrades
    .filter((upgrade) => !unlocked.has(upgrade.id))
    .map((upgrade) => ({ upgrade, requirement: unlockRequirement(upgrades, upgrade.id) }))
}
