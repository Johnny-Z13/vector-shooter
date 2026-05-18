export const GAME_BALANCE_MODE = 'testEasy' as const

export type GameBalanceMode = 'testEasy' | 'normal' | 'hard'

export interface GameBalanceProfile {
  label: string
  enemyHpMultiplier: number
  enemyDamageMultiplier: number
  enemySpeedMultiplier: number
  enemyProjectileSpeedMultiplier: number
  enemyAttackCooldownMultiplier: number
  spawnRateMultiplier: number
  bossRateMultiplier: number
  surfaceEnemyHpMultiplier: number
  surfaceEnemyDamageMultiplier: number
  surfaceEnemySpeedMultiplier: number
}

export const gameBalanceProfiles: Record<GameBalanceMode, GameBalanceProfile> = {
  testEasy: {
    label: 'Testing Easy',
    enemyHpMultiplier: 0.45,
    enemyDamageMultiplier: 0.4,
    enemySpeedMultiplier: 0.82,
    enemyProjectileSpeedMultiplier: 0.85,
    enemyAttackCooldownMultiplier: 1.35,
    spawnRateMultiplier: 0.55,
    bossRateMultiplier: 0.65,
    surfaceEnemyHpMultiplier: 0.5,
    surfaceEnemyDamageMultiplier: 0.45,
    surfaceEnemySpeedMultiplier: 0.8
  },
  normal: {
    label: 'Normal',
    enemyHpMultiplier: 1,
    enemyDamageMultiplier: 1,
    enemySpeedMultiplier: 1,
    enemyProjectileSpeedMultiplier: 1,
    enemyAttackCooldownMultiplier: 1,
    spawnRateMultiplier: 1,
    bossRateMultiplier: 1,
    surfaceEnemyHpMultiplier: 1,
    surfaceEnemyDamageMultiplier: 1,
    surfaceEnemySpeedMultiplier: 1
  },
  hard: {
    label: 'Hard',
    enemyHpMultiplier: 1.22,
    enemyDamageMultiplier: 1.16,
    enemySpeedMultiplier: 1.08,
    enemyProjectileSpeedMultiplier: 1.08,
    enemyAttackCooldownMultiplier: 0.88,
    spawnRateMultiplier: 1.18,
    bossRateMultiplier: 1.14,
    surfaceEnemyHpMultiplier: 1.18,
    surfaceEnemyDamageMultiplier: 1.12,
    surfaceEnemySpeedMultiplier: 1.06
  }
}

export const activeBalanceProfile = gameBalanceProfiles[GAME_BALANCE_MODE]

export const spaceEnemyKinds = ['chaser', 'splinter', 'lancer', 'mine', 'brute', 'shooter', 'warden', 'razor', 'skimmer', 'bulwark'] as const
export type SpaceEnemyKind = (typeof spaceEnemyKinds)[number]

export interface SpaceEnemyBalance {
  hp: number
  radius: number
  speed: number
  value: number
  color: string
  contactDamage: number
  timeGateSeconds: number
  spawnRollCeiling: number
  projectileDamage?: number
  projectileSpeed?: number
  attackCooldownSeconds?: number
  minimumAttackCooldownSeconds?: number
  attackCooldownReductionPerSecond?: number
  attackRange?: number
  maxSpeed?: number
  spriteRow?: number
  forwardAmbush: boolean
}

export const spaceEnemyBalance: Record<SpaceEnemyKind, SpaceEnemyBalance> = {
  chaser: { hp: 34, radius: 17, speed: 123, value: 7, color: '#8fff7d', contactDamage: 13, timeGateSeconds: 0, spawnRollCeiling: 1, forwardAmbush: false },
  splinter: { hp: 23, radius: 14, speed: 158, value: 5, color: '#70a8ff', contactDamage: 13, timeGateSeconds: 25, spawnRollCeiling: 0.82, forwardAmbush: false },
  lancer: { hp: 60, radius: 18, speed: 154, value: 13, color: '#fff27a', contactDamage: 13, timeGateSeconds: 55, spawnRollCeiling: 0.7, attackCooldownSeconds: 2.2, maxSpeed: 460, forwardAmbush: false },
  mine: { hp: 46, radius: 22, speed: 68, value: 10, color: '#ff5d73', contactDamage: 23, timeGateSeconds: 100, spawnRollCeiling: 0.58, forwardAmbush: false },
  brute: { hp: 170, radius: 34, speed: 98, value: 24, color: '#ff9d5c', contactDamage: 19, timeGateSeconds: 180, spawnRollCeiling: 0.39, forwardAmbush: false },
  shooter: { hp: 72, radius: 21, speed: 118, value: 18, color: '#ff61d8', contactDamage: 13, timeGateSeconds: 120, spawnRollCeiling: 0.49, projectileDamage: 10, projectileSpeed: 310, attackCooldownSeconds: 2.35, minimumAttackCooldownSeconds: 1.35, attackCooldownReductionPerSecond: 0.00385, attackRange: 760, forwardAmbush: false },
  warden: { hp: 520, radius: 50, speed: 134, value: 90, color: '#b990ff', contactDamage: 24, timeGateSeconds: 0, spawnRollCeiling: 0, projectileDamage: 8, projectileSpeed: 260, attackCooldownSeconds: 1.2, forwardAmbush: false },
  razor: { hp: 92, radius: 18, speed: 335, value: 26, color: '#57fff3', contactDamage: 17, timeGateSeconds: 205, spawnRollCeiling: 0.18, attackCooldownSeconds: 1.15, maxSpeed: 690, spriteRow: 0, forwardAmbush: true },
  skimmer: { hp: 126, radius: 24, speed: 176, value: 32, color: '#ffe66d', contactDamage: 13, timeGateSeconds: 165, spawnRollCeiling: 0.29, projectileDamage: 11, projectileSpeed: 340, attackCooldownSeconds: 2.15, minimumAttackCooldownSeconds: 1.35, attackCooldownReductionPerSecond: 0.00313, attackRange: 840, spriteRow: 1, forwardAmbush: true },
  bulwark: { hp: 270, radius: 38, speed: 86, value: 46, color: '#f46cff', contactDamage: 22, timeGateSeconds: 270, spawnRollCeiling: 0.07, projectileDamage: 9, projectileSpeed: 235, attackCooldownSeconds: 1.55, attackRange: 900, spriteRow: 2, forwardAmbush: true }
}

export const spaceEnemyRunScaling = {
  base: 1.12,
  perSecond: 0.005,
  perPlanet: 0.1,
  speedPerSecond: 0.3
} as const

export const spaceSpawnBalance = {
  spawnCooldown: {
    maxSeconds: 0.62,
    minSeconds: 0.12,
    pressureReductionPerMinute: 0.045,
    planetReduction: 0.025
  },
  pack: {
    base: 1,
    pressurePerMinute: 0.65,
    bonusChance: 0.2,
    bonusCount: 2
  },
  boss: {
    maxSeconds: 95,
    minSeconds: 46,
    timeReductionDivisor: 7,
    reinforcementTimeSeconds: 180,
    reinforcementChance: 0.55
  },
  quietField: {
    targetNearbyBase: 7,
    targetNearbyPerMinute: 0.9,
    targetNearbyMin: 7,
    targetNearbyMax: 18,
    maxPackBase: 3,
    maxPackPerMinute: 0.4,
    maxPackMin: 3,
    maxPackMax: 7
  }
} as const

export const surfaceThreatBalance = {
  generic: {
    baseHp: 28,
    hordeBaseHp: 16,
    hordeHpPerSecond: 0.08,
    swarmBaseHp: 20,
    swarmHpPerSecond: 0.12,
    specialBaseHp: 46,
    radius: 16,
    hordeRadius: 12,
    swarmRadius: 13,
    specialRadius: 22,
    contactDamage: 9,
    acceleration: 360,
    maxSpeed: 92
  },
  boss: {
    baseHp: 120,
    hpPerSecond: 0.36,
    hpPerLevel: 6,
    radius: 42,
    contactDamage: 16,
    acceleration: 230,
    maxSpeed: 70
  },
  oracle: {
    baseHp: 70,
    hpPerSecond: 0.18,
    radius: 32,
    contactDamage: 12
  }
} as const

const scaled = (value: number, multiplier: number) => value * multiplier

export const balancedSpaceEnemyDefinition = (
  kind: SpaceEnemyKind,
  profile: GameBalanceProfile = activeBalanceProfile
): SpaceEnemyBalance => {
  const enemy = spaceEnemyBalance[kind]
  return {
    ...enemy,
    hp: scaled(enemy.hp, profile.enemyHpMultiplier),
    speed: scaled(enemy.speed, profile.enemySpeedMultiplier),
    contactDamage: scaled(enemy.contactDamage, profile.enemyDamageMultiplier),
    projectileDamage: enemy.projectileDamage === undefined ? undefined : scaled(enemy.projectileDamage, profile.enemyDamageMultiplier),
    projectileSpeed: enemy.projectileSpeed === undefined ? undefined : scaled(enemy.projectileSpeed, profile.enemyProjectileSpeedMultiplier),
    attackCooldownSeconds: enemy.attackCooldownSeconds === undefined ? undefined : scaled(enemy.attackCooldownSeconds, profile.enemyAttackCooldownMultiplier),
    minimumAttackCooldownSeconds: enemy.minimumAttackCooldownSeconds === undefined ? undefined : scaled(enemy.minimumAttackCooldownSeconds, profile.enemyAttackCooldownMultiplier)
  }
}

export const enemyAttackCooldown = (enemy: SpaceEnemyBalance, elapsedSeconds: number) => {
  const base = enemy.attackCooldownSeconds ?? 0
  const minimum = enemy.minimumAttackCooldownSeconds ?? base
  return Math.max(minimum, base - elapsedSeconds * (enemy.attackCooldownReductionPerSecond ?? 0))
}

export const spaceEnemyRunScale = (timeSeconds: number, planetsVisited: number) => (
  spaceEnemyRunScaling.base + timeSeconds * spaceEnemyRunScaling.perSecond + planetsVisited * spaceEnemyRunScaling.perPlanet
)

export const spaceEnemySpeedBonus = (timeSeconds: number) => timeSeconds * spaceEnemyRunScaling.speedPerSecond

export const scaledSpawnTimer = (seconds: number, profile: GameBalanceProfile = activeBalanceProfile) => seconds / profile.spawnRateMultiplier
export const scaledBossTimer = (seconds: number, profile: GameBalanceProfile = activeBalanceProfile) => seconds / profile.bossRateMultiplier

export const scaledSurfaceHp = (hp: number, profile: GameBalanceProfile = activeBalanceProfile) => hp * profile.surfaceEnemyHpMultiplier
export const scaledSurfaceDamage = (damage: number, profile: GameBalanceProfile = activeBalanceProfile) => damage * profile.surfaceEnemyDamageMultiplier
export const scaledSurfaceSpeed = (speed: number, profile: GameBalanceProfile = activeBalanceProfile) => speed * profile.surfaceEnemySpeedMultiplier
