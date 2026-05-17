import { expect, test } from '@playwright/test'
import { dashVector, touchActionLabel } from '../src/mobile-controls'

test('dash has a fallback direction when the ship is idle', () => {
  const dash = dashVector({
    vx: 0,
    vy: 0,
    speed: 0,
    aimAngle: -Math.PI / 2,
    move: { x: 0, y: 0 },
    moveActive: false
  })

  expect(Math.abs(dash.x)).toBeLessThan(0.01)
  expect(dash.y).toBeLessThan(-0.99)
})

test('dash prefers current movement when already moving', () => {
  const dash = dashVector({
    vx: 40,
    vy: 0,
    speed: 40,
    aimAngle: -Math.PI / 2,
    move: { x: 0, y: -1 },
    moveActive: true
  })

  expect(dash.x).toBeGreaterThan(0.99)
  expect(Math.abs(dash.y)).toBeLessThan(0.01)
})

test('touch action hides unless there is a contextual action', () => {
  expect(touchActionLabel({ state: 'playing' })).toBeNull()
  expect(touchActionLabel({ state: 'playing', planetNearby: true })).toBe('LAND')
  expect(touchActionLabel({ state: 'playing', returnBeaconAvailable: true })).toBe('BEACON')
  expect(touchActionLabel({ state: 'playing', canPlanetLock: true })).toBe('LOCK')
  expect(touchActionLabel({ state: 'surface' })).toBeNull()
  expect(touchActionLabel({ state: 'surface', nearShip: true })).toBe('BOARD')
})
