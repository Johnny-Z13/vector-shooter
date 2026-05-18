import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beaconExtractionBonus, beaconSpawnDistance, nextBeaconWindow, returnBeaconAutopilotVector, returnBeaconEligible } from '../src/return-beacons'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

test('blocks first beacon before four minutes or before first planet', () => {
  expect(returnBeaconEligible({ time: 239, planetsVisited: 1, activeBeacon: false, nextBeaconAt: 0 })).toBe(false)
  expect(returnBeaconEligible({ time: 360, planetsVisited: 0, activeBeacon: false, nextBeaconAt: 0 })).toBe(false)
})

test('allows first beacon after four minutes and one planet', () => {
  expect(returnBeaconEligible({ time: 240, planetsVisited: 1, activeBeacon: false, nextBeaconAt: 0 })).toBe(true)
})

test('blocks beacon while another beacon is active', () => {
  expect(returnBeaconEligible({ time: 600, planetsVisited: 3, activeBeacon: true, nextBeaconAt: 0 })).toBe(false)
})

test('uses a later next beacon window after a skipped beacon', () => {
  expect(returnBeaconEligible({ time: 500, planetsVisited: 2, activeBeacon: false, nextBeaconAt: 530 })).toBe(false)
  expect(returnBeaconEligible({ time: 530, planetsVisited: 2, activeBeacon: false, nextBeaconAt: 530 })).toBe(true)
})

test('caps skipped beacon extraction bonus', () => {
  expect(beaconExtractionBonus(0)).toBe(1)
  expect(beaconExtractionBonus(2)).toBe(1.2)
  expect(beaconExtractionBonus(9)).toBe(1.3)
})

test('schedules the next beacon three and a half minutes later', () => {
  expect(nextBeaconWindow(320)).toBe(530)
})

test('spawns the first beacon close enough to read as an offer', () => {
  expect(beaconSpawnDistance(0)).toBe(640)
  expect(beaconSpawnDistance(3)).toBe(910)
})

test('return beacon is reinforced by HUD distance reminder and recall assist', () => {
  const main = source()

  expect(main).toContain('RETURN BEACON AVAILABLE - TAP BEACON TO LOCK')
  expect(main).toContain('RETURN BEACON WAITING - TAP BEACON TO LOCK')
  expect(main).toContain('RECALL ROUTE SET - NUDGE AWAY TO SKIP')
  expect(main).toContain('RETURN BEACON ${Math.floor(Math.sqrt(dist2(this.returnBeacon, this.player)))}')
})

test('beacon autopilot brakes inside the extraction ring instead of flying through', () => {
  const approach = returnBeaconAutopilotVector({ dx: 600, dy: 0, vx: 0, vy: 0, radius: 96 })
  expect(approach.x).toBeGreaterThan(0.9)
  expect(Math.abs(approach.y)).toBeLessThan(0.01)

  const brake = returnBeaconAutopilotVector({ dx: 20, dy: 0, vx: 230, vy: 0, radius: 96 })
  expect(brake.x).toBeLessThan(-0.9)
  expect(Math.abs(brake.y)).toBeLessThan(0.01)
})
