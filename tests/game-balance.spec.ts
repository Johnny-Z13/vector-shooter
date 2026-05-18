import { expect, test } from '@playwright/test'
import {
  activeBalanceProfile,
  balancedSpaceEnemyDefinition,
  enemyAttackCooldown,
  GAME_BALANCE_MODE,
  gameBalanceProfiles,
  spaceEnemyBalance,
  spaceEnemyKinds,
  spaceSpawnBalance,
  surfaceThreatBalance
} from '../src/game-balance'

test('active balance mode is explicit and currently easy for testing', () => {
  expect(GAME_BALANCE_MODE).toBe('testEasy')
  expect(activeBalanceProfile.enemyHpMultiplier).toBeLessThan(gameBalanceProfiles.normal.enemyHpMultiplier)
  expect(activeBalanceProfile.enemyDamageMultiplier).toBeLessThan(gameBalanceProfiles.normal.enemyDamageMultiplier)
  expect(activeBalanceProfile.spawnRateMultiplier).toBeLessThan(gameBalanceProfiles.normal.spawnRateMultiplier)
})

test('each space enemy exposes editable balance stats', () => {
  for (const kind of spaceEnemyKinds) {
    const enemy = spaceEnemyBalance[kind]

    expect(enemy.hp).toBeGreaterThan(0)
    expect(enemy.radius).toBeGreaterThan(0)
    expect(enemy.speed).toBeGreaterThan(0)
    expect(enemy.value).toBeGreaterThan(0)
    expect(enemy.contactDamage).toBeGreaterThan(0)
    expect(enemy.timeGateSeconds).toBeGreaterThanOrEqual(0)
    expect(enemy.spawnRollCeiling).toBeGreaterThanOrEqual(0)
    if (enemy.projectileDamage !== undefined) expect(enemy.attackCooldownSeconds).toBeGreaterThan(0)
  }
})

test('balanced space enemy definitions apply global difficulty without mutating base data', () => {
  const normal = balancedSpaceEnemyDefinition('brute', gameBalanceProfiles.normal)
  const easy = balancedSpaceEnemyDefinition('brute', gameBalanceProfiles.testEasy)

  expect(easy.hp).toBeLessThan(normal.hp)
  expect(easy.speed).toBeLessThan(normal.speed)
  expect(easy.contactDamage).toBeLessThan(normal.contactDamage)
  expect(spaceEnemyBalance.brute.hp).toBeGreaterThan(easy.hp)
})

test('enemy attack cooldown ramps are balance data', () => {
  const shooter = balancedSpaceEnemyDefinition('shooter', gameBalanceProfiles.normal)

  expect(enemyAttackCooldown(shooter, 0)).toBe(shooter.attackCooldownSeconds)
  expect(enemyAttackCooldown(shooter, 9999)).toBe(shooter.minimumAttackCooldownSeconds)
})

test('spawn and surface balance values are named and profile-scaled', () => {
  expect(spaceSpawnBalance.spawnCooldown.minSeconds).toBeGreaterThan(0)
  expect(spaceSpawnBalance.quietField.targetNearbyBase).toBeGreaterThan(0)
  expect(surfaceThreatBalance.generic.baseHp).toBeGreaterThan(0)
  expect(surfaceThreatBalance.boss.contactDamage).toBeGreaterThan(surfaceThreatBalance.generic.contactDamage)
})
