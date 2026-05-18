import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  evolutions,
  limitBreakChoices,
  pickupBalance,
  powerupBalance,
  relics,
  upgrades,
  workbenchBalance
} from '../src/powerup-balance'

const mainSource = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

test('upgrade and relic definitions live in the powerup balance source', () => {
  expect(upgrades.length).toBeGreaterThan(20)
  expect(relics.length).toBeGreaterThanOrEqual(8)
  expect(evolutions.length).toBeGreaterThanOrEqual(6)
  expect(limitBreakChoices.map((choice) => choice.id)).toEqual(['might', 'cooldown', 'amount', 'speed', 'magnet', 'hull'])
})

test('weapon and pickup tuning values are named config, not main-loop constants', () => {
  expect(powerupBalance.weapon.baseFireCooldown).toBe(0.234)
  expect(powerupBalance.weapon.minFireCooldown).toBe(0.055)
  expect(pickupBalance.xp.radius).toBe(5.6)
  expect(pickupBalance.xp.mergeRadiusMax).toBe(12.6)

  const main = mainSource()
  expect(main).not.toContain('const BASE_FIRE_COOLDOWN')
  expect(main).not.toContain('const XP_PICKUP_RADIUS')
})

test('workbench roll tuning is configurable', () => {
  expect(workbenchBalance.baseChoiceCount).toBe(3)
  expect(workbenchBalance.fourthChoiceBaseChance).toBeGreaterThan(0)
  expect(workbenchBalance.ownedBiasBase).toBeGreaterThan(1)
  expect(workbenchBalance.relicChanceRare).toBeGreaterThan(workbenchBalance.relicChanceBase)
})
