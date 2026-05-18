import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pickupBalance, powerupBalance } from '../src/powerup-balance'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

test('starter ship fire cadence is thirty percent slower', () => {
  const main = source()

  expect(powerupBalance.weapon.baseFireCooldown).toBe(0.234)
  expect(powerupBalance.weapon.rapidCooldownPerRank).toBe(0.014)
  expect(powerupBalance.weapon.minFireCooldown).toBe(0.055)
  expect(main).toContain('powerupBalance.weapon.baseFireCooldown')
  expect(main).toContain('powerupBalance.weapon.rapidCooldownPerRank')
})

test('xp pickups are thirty percent smaller including merged drops and halos', () => {
  const main = source()

  expect(pickupBalance.xp.radius).toBe(5.6)
  expect(pickupBalance.xp.mergeRadiusStep).toBe(0.45)
  expect(pickupBalance.xp.mergeRadiusMax).toBe(12.6)
  expect(pickupBalance.xp.outerHalo).toBe(9.8)
  expect(main).toContain("kind === 'xp' ? pickupBalance.xp.radius : pickupBalance.defaultRadius")
  expect(main).toContain('pickup.radius + pickupBalance.xp.mergeRadiusStep')
})
