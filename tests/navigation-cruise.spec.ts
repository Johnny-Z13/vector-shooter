import { expect, test } from '@playwright/test'
import { navigationCruiseScalar, navigationTrailProfile } from '../src/navigation-cruise'

test('baseline auto cruise starts a notch lower but each nav rank increases it', () => {
  const oldBaselineCruise = 0.45
  const values = Array.from({ length: 8 }, (_, navRank) => navigationCruiseScalar({ navRank }))

  expect(values[0]).toBeLessThan(oldBaselineCruise)
  for (let i = 1; i < values.length; i += 1) {
    expect(values[i]).toBeGreaterThan(values[i - 1])
  }
})

test('navigation trail profile grows from exhaust wake to visible nav ribbons', () => {
  const baseline = navigationTrailProfile({ navRank: 0, speedRatio: 0.5 })
  const mid = navigationTrailProfile({ navRank: 3, speedRatio: 0.72 })
  const max = navigationTrailProfile({ navRank: 7, speedRatio: 0.9 })

  expect(baseline.tier).toBe(0)
  expect(mid.tier).toBeGreaterThan(baseline.tier)
  expect(max.tier).toBeGreaterThan(mid.tier)
  expect(max.bands).toBeGreaterThan(mid.bands)
  expect(max.length).toBeGreaterThan(baseline.length)
})
