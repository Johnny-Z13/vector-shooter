interface NavigationCruiseInput {
  navRank: number
  targetLocked?: boolean
}

interface NavigationTrailInput {
  navRank: number
  speedRatio: number
}

export interface NavigationTrailProfile {
  tier: number
  bands: number
  length: number
  alpha: number
  color: string
  accent: string
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export const navigationCruiseScalar = ({ navRank, targetLocked = false }: NavigationCruiseInput) => {
  const rank = clamp(navRank, 0, 7)
  const base = 0.4 + rank * 0.065 + (targetLocked ? 0.12 : 0)
  return clamp(base, 0.4, rank >= 7 ? 0.94 : 0.88)
}

export const navigationTrailProfile = ({ navRank, speedRatio }: NavigationTrailInput): NavigationTrailProfile => {
  const rank = clamp(navRank, 0, 7)
  const speed = clamp(speedRatio, 0, 1)
  const tier = rank >= 6 ? 3 : rank >= 3 ? 2 : rank >= 1 ? 1 : 0
  return {
    tier,
    bands: 1 + tier,
    length: 22 + speed * 20 + rank * 3.8,
    alpha: 0.18 + speed * 0.2 + tier * 0.08,
    color: tier >= 3 ? '#fff27a' : tier >= 1 ? '#70a8ff' : '#57fff3',
    accent: tier >= 3 ? '#f8fffb' : tier >= 2 ? '#b990ff' : '#57fff3'
  }
}
