export function firstOpportunityUpgrade<T extends { id: string; max: number }>(
  upgrades: T[],
  build: Record<string, number>,
  requiredId?: string
): T | null {
  if (!requiredId) return null
  if ((build[requiredId] ?? 0) > 0) return null
  return upgrades.find((upgrade) => upgrade.id === requiredId && (build[upgrade.id] ?? 0) < upgrade.max) ?? null
}
