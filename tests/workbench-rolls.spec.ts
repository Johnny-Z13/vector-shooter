import { expect, test } from '@playwright/test'
import { upgrades, type UpgradeId } from '../src/powerup-balance'
import {
  firstOpportunityUpgrade,
  workbenchLockedUpgrades,
  workbenchRollableUpgrades,
  workbenchStarterUpgradeIds,
  workbenchUnlockedUpgradeIds
} from '../src/workbench-rolls'

const simpleUpgrades = [
  { id: 'rapid', max: 8 },
  { id: 'nav', max: 7 },
  { id: 'shield', max: 5 }
]

const emptyBuild = () => Object.fromEntries(upgrades.map((upgrade) => [upgrade.id, 0])) as Record<UpgradeId, number>

test('does not force a first opportunity upgrade by default', () => {
  expect(firstOpportunityUpgrade(simpleUpgrades, { rapid: 0, nav: 0, shield: 0 })).toBeNull()
})

test('can still require a specific upgrade when requested', () => {
  expect(firstOpportunityUpgrade(simpleUpgrades, { rapid: 0, nav: 0, shield: 0 }, 'nav')?.id).toBe('nav')
  expect(firstOpportunityUpgrade(simpleUpgrades, { rapid: 0, nav: 1, shield: 0 }, 'nav')).toBeNull()
})

test('starter workbench pool has five immediately rollable systems', () => {
  expect(workbenchStarterUpgradeIds).toEqual(['rapid', 'engine', 'magnet', 'shield', 'split'])
  expect(workbenchUnlockedUpgradeIds(upgrades, emptyBuild())).toEqual(workbenchStarterUpgradeIds)
})

test('maxing a starter system unlocks configured children', () => {
  const build = emptyBuild()
  build.rapid = upgrades.find((upgrade) => upgrade.id === 'rapid')!.max

  const unlocked = workbenchUnlockedUpgradeIds(upgrades, build)

  expect(unlocked).toContain('chain')
  expect(unlocked).toContain('rail')
})

test('rollable workbench upgrades exclude maxed systems and include newly unlocked systems', () => {
  const build = emptyBuild()
  build.rapid = upgrades.find((upgrade) => upgrade.id === 'rapid')!.max

  const rollable = workbenchRollableUpgrades(upgrades, build).map((upgrade) => upgrade.id)

  expect(rollable).not.toContain('rapid')
  expect(rollable).toContain('chain')
  expect(rollable).toContain('rail')
})

test('locked workbench upgrades include human readable unlock requirements', () => {
  const locked = workbenchLockedUpgrades(upgrades, emptyBuild())
  const nav = locked.find((entry) => entry.upgrade.id === 'nav')
  const rift = locked.find((entry) => entry.upgrade.id === 'rift')

  expect(nav?.requirement).toBe('Max Drift Engine')
  expect(rift?.requirement).toBe('Max Rail Lattice or Echo Chamber')
})
