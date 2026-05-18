import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

test('starter ship fire cadence is thirty percent slower', () => {
  const main = source()

  expect(main).toContain('const BASE_FIRE_COOLDOWN = 0.234')
  expect(main).toContain('BASE_FIRE_COOLDOWN - rapid * 0.014')
  expect(main).toContain('MIN_FIRE_COOLDOWN, BASE_FIRE_COOLDOWN')
})

test('xp pickups are thirty percent smaller including merged drops and halos', () => {
  const main = source()

  expect(main).toContain('const XP_PICKUP_RADIUS = 5.6')
  expect(main).toContain('const XP_PICKUP_MERGE_RADIUS_STEP = 0.45')
  expect(main).toContain('const XP_PICKUP_MERGE_RADIUS_MAX = 12.6')
  expect(main).toContain('const XP_PICKUP_OUTER_HALO = 9.8')
  expect(main).toContain("kind === 'xp' ? XP_PICKUP_RADIUS : DEFAULT_PICKUP_RADIUS")
  expect(main).toContain('pickup.radius + XP_PICKUP_MERGE_RADIUS_STEP')
})
