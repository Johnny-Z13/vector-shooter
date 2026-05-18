import { expect, test } from '@playwright/test'
import { PLANET_RADIUS_MAX, PLANET_RADIUS_MIN, planetRadius } from '../src/planet-sizing'

test('planet radius uses the current readable size as the minimum', () => {
  expect(planetRadius(() => 0)).toBe(PLANET_RADIUS_MIN)
})

test('planet radius can grow by at most twenty five percent', () => {
  expect(planetRadius(() => 1)).toBe(PLANET_RADIUS_MAX)
  expect(PLANET_RADIUS_MAX).toBe(PLANET_RADIUS_MIN * 1.25)
})

test('planet radius varies inside the allowed range', () => {
  const small = planetRadius(() => 0.2)
  const large = planetRadius(() => 0.8)

  expect(small).toBeGreaterThan(PLANET_RADIUS_MIN)
  expect(large).toBeLessThan(PLANET_RADIUS_MAX)
  expect(large).toBeGreaterThan(small)
})
