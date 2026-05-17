import { expect, test } from '@playwright/test'
import {
  applyRunRecovery,
  defaultMothershipState,
  mergeArchiveRecords,
  mothershipDepartments,
  purchaseMothershipTier
} from '../src/mothership-progression'

test('starts with archive enabled and no persistent resources', () => {
  const state = defaultMothershipState()

  expect(state.resources).toEqual({ scrap: 0, crystal: 0, cores: 0 })
  expect(state.departments.archive).toBe(1)
  expect(state.departments.scanner).toBe(0)
  expect(state.departments.workbench).toBe(0)
  expect(state.archive.records).toEqual({})
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
