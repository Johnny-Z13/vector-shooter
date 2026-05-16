import { expect, test } from '@playwright/test'
import { firstOpportunityUpgrade } from '../src/workbench-rolls'

const upgrades = [
  { id: 'rapid', max: 8 },
  { id: 'nav', max: 7 },
  { id: 'shield', max: 5 }
]

test('does not force a first opportunity upgrade by default', () => {
  expect(firstOpportunityUpgrade(upgrades, { rapid: 0, nav: 0, shield: 0 })).toBeNull()
})

test('can still require a specific upgrade when requested', () => {
  expect(firstOpportunityUpgrade(upgrades, { rapid: 0, nav: 0, shield: 0 }, 'nav')?.id).toBe('nav')
  expect(firstOpportunityUpgrade(upgrades, { rapid: 0, nav: 1, shield: 0 }, 'nav')).toBeNull()
})
