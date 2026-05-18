import { expect, test } from '@playwright/test'
import {
  applyRunRecovery,
  defaultMothershipState,
  isMothershipDepartmentUnlocked,
  mergeArchiveRecords,
  mothershipDepartments,
  normalizeMothershipState,
  purchaseMothershipTier
} from '../src/mothership-progression'

test('starts with archive enabled and no persistent resources', () => {
  const state = defaultMothershipState()

  expect(state.resources).toEqual({ scrap: 0, crystal: 0, cores: 0 })
  expect(state.departments.archive).toBe(1)
  expect(state.departments.scanner).toBe(0)
  expect(state.departments.workbench).toBe(0)
  expect(state.departments.shipyard).toBe(0)
  expect(state.departments.signalCore).toBe(0)
  expect(state.departments.hangarCrew).toBe(0)
  expect(state.archive.records).toEqual({})
})

test('normalizes saved mothership departments to valid tier ranges', () => {
  const state = normalizeMothershipState({
    version: 1,
    resources: { scrap: 4.8, crystal: -12, cores: Number.POSITIVE_INFINITY },
    departments: {
      scanner: 99,
      workbench: 2.7,
      archive: 99,
      shipyard: -4,
      signalCore: Number.NaN,
      hangarCrew: 5
    },
    archive: { records: {}, relicBlueprints: {}, signalFragments: 0 }
  })

  expect(state.resources).toEqual({ scrap: 4, crystal: 0, cores: 0 })
  expect(state.departments.scanner).toBe(mothershipDepartments.scanner.tiers.length)
  expect(state.departments.workbench).toBe(2)
  expect(state.departments.archive).toBe(mothershipDepartments.archive.tiers.length)
  expect(state.departments.shipyard).toBe(0)
  expect(state.departments.signalCore).toBe(0)
  expect(state.departments.hangarCrew).toBe(mothershipDepartments.hangarCrew.tiers.length)
})

test('drops malformed archive records from saved mothership data', () => {
  const state = normalizeMothershipState({
    version: 1,
    resources: {},
    departments: {},
    archive: {
      records: {
        good: { id: 'good', kind: 'lore', title: 'Bone Choir', count: 2.8 },
        badKind: { id: 'badKind', kind: 'unknown', title: 'Bad Kind' },
        badTitle: { id: 'badTitle', kind: 'cache', title: 42 }
      },
      relicBlueprints: { stable: 3.6, broken: 'many' },
      signalFragments: 4.2
    }
  })

  expect(state.archive.records.good).toEqual({
    id: 'good',
    kind: 'lore',
    title: 'Bone Choir',
    count: 2
  })
  expect(state.archive.records.badKind).toBeUndefined()
  expect(state.archive.records.badTitle).toBeUndefined()
  expect(state.archive.relicBlueprints).toEqual({ stable: 3 })
  expect(state.archive.signalFragments).toBe(4)
})

test('destroyed runs preserve archive and recover partial resources', () => {
  const state = defaultMothershipState()
  const next = applyRunRecovery(state, {
    outcome: 'destroyed',
    resources: { scrap: 100, crystal: 20, cores: 3 },
    archiveRecords: {
      'planet:0:0:0': { id: 'planet:0:0:0', kind: 'planet', title: 'LUX MORGUE' }
    },
    skippedBeacons: 0
  })

  expect(next.resources.scrap).toBe(45)
  expect(next.resources.crystal).toBe(9)
  expect(next.resources.cores).toBe(1)
  expect(next.archive.records['planet:0:0:0']?.title).toBe('LUX MORGUE')
})

test('beacon extraction keeps full resources and applies skipped beacon bonus', () => {
  const state = defaultMothershipState()
  const next = applyRunRecovery(state, {
    outcome: 'deepExtraction',
    resources: { scrap: 100, crystal: 20, cores: 2 },
    archiveRecords: {},
    skippedBeacons: 2
  })

  expect(next.resources.scrap).toBe(125)
  expect(next.resources.crystal).toBe(25)
  expect(next.resources.cores).toBe(2)
})

test('signal core improves persistent extraction recovery', () => {
  const state = defaultMothershipState()
  state.departments.signalCore = 2
  const next = applyRunRecovery(state, {
    outcome: 'cleanExtraction',
    resources: { scrap: 100, crystal: 50, cores: 0 },
    archiveRecords: {},
    skippedBeacons: 0
  })

  expect(next.resources.scrap).toBe(106)
  expect(next.resources.crystal).toBe(53)
})

test('archive merge increments repeated discoveries without losing detail', () => {
  const merged = mergeArchiveRecords(
    {
      'cache:a': { id: 'cache:a', kind: 'cache', title: 'Surface Cache', count: 1 }
    },
    {
      'cache:a': { id: 'cache:a', kind: 'cache', title: 'Surface Cache' },
      'lore:b': { id: 'lore:b', kind: 'lore', title: 'Bone Choir' }
    }
  )

  expect(merged['cache:a'].count).toBe(2)
  expect(merged['lore:b'].count).toBe(1)
})

test('department purchases spend resources and increase one tier', () => {
  const state = defaultMothershipState()
  state.resources.scrap = 140
  state.resources.crystal = 20
  const cost = mothershipDepartments.scanner.tiers[0].cost

  expect(cost).toEqual({ scrap: 120, crystal: 0, cores: 0 })

  const result = purchaseMothershipTier(state, 'scanner')

  expect(result.ok).toBe(true)
  expect(result.state.departments.scanner).toBe(1)
  expect(result.state.resources.scrap).toBe(20)
})

test('department purchase fails cleanly when resources are short', () => {
  const state = defaultMothershipState()
  const result = purchaseMothershipTier(state, 'workbench')

  expect(result.ok).toBe(false)
  expect(result.reason).toBe('Not enough scrap.')
  expect(result.state.departments.workbench).toBe(0)
})

test('advanced departments stay locked until their core department is maxed', () => {
  const state = defaultMothershipState()
  state.resources = { scrap: 9999, crystal: 9999, cores: 9999 }

  expect(isMothershipDepartmentUnlocked(state, 'shipyard')).toBe(false)

  const locked = purchaseMothershipTier(state, 'shipyard')

  expect(locked.ok).toBe(false)
  expect(locked.reason).toContain('Workbench Bay 4/4')
  expect(locked.state.departments.shipyard).toBe(0)
})

test('maxing a core department unlocks its advanced department', () => {
  const state = defaultMothershipState()
  state.departments.workbench = mothershipDepartments.workbench.tiers.length
  state.resources = { scrap: 9999, crystal: 9999, cores: 9999 }

  expect(isMothershipDepartmentUnlocked(state, 'shipyard')).toBe(true)

  const result = purchaseMothershipTier(state, 'shipyard')

  expect(result.ok).toBe(true)
  expect(result.state.departments.shipyard).toBe(1)
})
