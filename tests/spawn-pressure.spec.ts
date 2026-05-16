import { expect, test } from '@playwright/test'
import { pressurePackSize, shouldRecycleEnemy } from '../src/spawn-pressure'

test('recycles enemies that are far enough to starve new spawns', () => {
  expect(shouldRecycleEnemy({ x: 2500, y: 0 }, { x: 0, y: 0 }, 2200)).toBe(true)
  expect(shouldRecycleEnemy({ x: 800, y: 0 }, { x: 0, y: 0 }, 2200)).toBe(false)
})

test('keeps a minimum pressure pack when nearby field is quiet', () => {
  expect(pressurePackSize({ nearbyEnemies: 0, targetNearbyEnemies: 7, maxPack: 4 })).toBe(4)
  expect(pressurePackSize({ nearbyEnemies: 5, targetNearbyEnemies: 7, maxPack: 4 })).toBe(2)
  expect(pressurePackSize({ nearbyEnemies: 9, targetNearbyEnemies: 7, maxPack: 4 })).toBe(0)
})
