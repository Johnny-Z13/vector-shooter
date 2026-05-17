# V1 Mothership Progression Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 expedition-to-mothership progression loop from `docs/superpowers/specs/2026-05-17-galactic-hordes-mothership-progression-design.md`.

**Architecture:** Keep balance rules and persistence math in small pure TypeScript modules, then wire them into the existing `VectorShooter` class. `main.ts` remains the canvas/UI orchestrator, while new modules own return beacon rules and mothership progression state.

**Tech Stack:** Vite, TypeScript, Canvas 2D, Playwright test runner for pure module tests, `localStorage` for browser persistence.

---

## Scope

Implement:

- Persistent mothership state for scrap, crystal, cores, archive records, department tiers, relic blueprints, and signal fragments.
- Run-end outcomes: destroyed black-box recovery and beacon extraction.
- Debrief screen that reports resources/discoveries and then returns to the mothership hub.
- Mothership command hub wrapper with Launch, Scanner Array, Workbench Bay, Archive Lab, and locked future stations.
- Return beacon eligibility, spawning, activation, skipped-beacon bonus, and clean extraction.
- V1 department tiers for Scanner Array, Workbench Bay, and Archive Lab.
- Tests for pure rules and a build/browser verification pass.

Do not implement:

- Walkable mothership.
- Full starting loadout system.
- Offline idle gains.
- Branching upgrade trees.
- Large story chain for Signal Core.
- Extra planet landing choice menus.

## File Structure

- Create `src/mothership-progression.ts`: pure data model, default state, persistence guards, resource recovery, upgrade definitions, upgrade purchasing, archive merging.
- Create `src/return-beacons.ts`: pure beacon eligibility, extraction bonus, and spawn-distance helpers.
- Create `tests/mothership-progression.spec.ts`: unit tests for persistence state, recovery, upgrade costs, and archive merging.
- Create `tests/return-beacons.spec.ts`: unit tests for beacon eligibility and skipped-beacon bonus.
- Modify `src/main.ts`: add game states, mothership state loading/saving, run outcome handling, debrief UI, hub UI, beacon entity, beacon update/render/input wiring, department effects.
- Modify `src/style.css`: add styles for mothership hub, debrief, upgrade station cards, and beacon UI.
- Modify `README.md`: update current prototype section after implementation to mention mothership loop and return beacons.

## Naming Decisions

Use the existing runtime field `resources = { scrap, crystal, cores }` for current expedition resources. Use `mothership.resources` for persistent totals.

Use `crystal` in code to match the existing field name. Display text can say `Crystals`.

Use these game states:

```ts
type GameState =
  | 'title'
  | 'mothership'
  | 'playing'
  | 'paused'
  | 'levelup'
  | 'planet'
  | 'landing'
  | 'surface'
  | 'alien'
  | 'lore'
  | 'takeoff'
  | 'debrief'
  | 'gameover'
  | 'scores'
```

`gameover` remains available for scores, but normal run termination should flow through `debrief`.

---

## Task 1: Add Pure Mothership Progression Model

**Files:**

- Create: `src/mothership-progression.ts`
- Create: `tests/mothership-progression.spec.ts`

- [ ] **Step 1: Write failing tests for default state, recovery, archive merge, and upgrades**

Create `tests/mothership-progression.spec.ts`:

```ts
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
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
npx playwright test tests/mothership-progression.spec.ts
```

Expected: FAIL because `src/mothership-progression.ts` does not exist.

- [ ] **Step 3: Implement the pure progression module**

Create `src/mothership-progression.ts`:

```ts
export type PersistentResourceKey = 'scrap' | 'crystal' | 'cores'
export type MothershipDepartmentId = 'scanner' | 'workbench' | 'archive'
export type RunOutcomeKind = 'destroyed' | 'cleanExtraction' | 'deepExtraction'
export type ArchiveKind = 'relic' | 'alien' | 'lore' | 'planet' | 'cache'

export interface ResourceBundle {
  scrap: number
  crystal: number
  cores: number
}

export interface PersistentArchiveRecord {
  id: string
  kind: ArchiveKind
  title: string
  detail?: string
  source?: string
  color?: string
  icon?: number
  count?: number
}

export interface MothershipState {
  version: 1
  resources: ResourceBundle
  departments: Record<MothershipDepartmentId, number>
  archive: {
    records: Record<string, PersistentArchiveRecord>
    relicBlueprints: Record<string, number>
    signalFragments: number
  }
}

export interface RunRecoveryInput {
  outcome: RunOutcomeKind
  resources: ResourceBundle
  archiveRecords: Record<string, PersistentArchiveRecord>
  skippedBeacons: number
}

interface DepartmentTier {
  name: string
  description: string
  cost: ResourceBundle
}

interface DepartmentDefinition {
  id: MothershipDepartmentId
  name: string
  description: string
  tiers: DepartmentTier[]
}

export const emptyResources = (): ResourceBundle => ({ scrap: 0, crystal: 0, cores: 0 })

export const defaultMothershipState = (): MothershipState => ({
  version: 1,
  resources: emptyResources(),
  departments: {
    scanner: 0,
    workbench: 0,
    archive: 1
  },
  archive: {
    records: {},
    relicBlueprints: {},
    signalFragments: 0
  }
})

export const mothershipDepartments: Record<MothershipDepartmentId, DepartmentDefinition> = {
  scanner: {
    id: 'scanner',
    name: 'Scanner Array',
    description: 'Planet, beacon, risk, and relic signal intelligence.',
    tiers: [
      { name: 'Planet Signatures', description: 'Reveal planet archetype labels before landing.', cost: { scrap: 120, crystal: 0, cores: 0 } },
      { name: 'Beacon Sweep', description: 'Show return beacon direction and distance once eligible.', cost: { scrap: 220, crystal: 18, cores: 0 } },
      { name: 'Risk Reading', description: 'Show simple planet risk hints.', cost: { scrap: 360, crystal: 44, cores: 1 } },
      { name: 'Relic Trace', description: 'Mark planets with stronger relic or cache signal odds.', cost: { scrap: 520, crystal: 80, cores: 2 } }
    ]
  },
  workbench: {
    id: 'workbench',
    name: 'Workbench Bay',
    description: 'Improves mutation signal drafting between landings.',
    tiers: [
      { name: 'Emergency Reroll', description: 'Start each expedition with 1 workbench reroll.', cost: { scrap: 140, crystal: 0, cores: 0 } },
      { name: 'Expanded Bench', description: 'Small chance for 4 workbench choices.', cost: { scrap: 260, crystal: 16, cores: 0 } },
      { name: 'Coherence Bias', description: 'Owned and same-bucket upgrades appear more often.', cost: { scrap: 420, crystal: 36, cores: 1 } },
      { name: 'Salvage Recycle', description: 'Convert unwanted mutation signals into resources.', cost: { scrap: 640, crystal: 70, cores: 2 } }
    ]
  },
  archive: {
    id: 'archive',
    name: 'Archive Lab',
    description: 'Turns discoveries into permanent progression.',
    tiers: [
      { name: 'Permanent Archive', description: 'Discovered planets, relics, aliens, lore, and caches persist.', cost: { scrap: 0, crystal: 0, cores: 0 } },
      { name: 'Relic Blueprints', description: 'Found relics become future blueprint progress.', cost: { scrap: 160, crystal: 26, cores: 0 } },
      { name: 'Discovery Rewards', description: 'Archive milestones grant crystals and cores.', cost: { scrap: 340, crystal: 58, cores: 1 } },
      { name: 'Signal Decoding', description: 'Lore contributes to Signal Core fragments.', cost: { scrap: 520, crystal: 96, cores: 2 } }
    ]
  }
}

const clampInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))

const normalizeResources = (resources: Partial<ResourceBundle> | undefined): ResourceBundle => ({
  scrap: clampInt(resources?.scrap ?? 0),
  crystal: clampInt(resources?.crystal ?? 0),
  cores: clampInt(resources?.cores ?? 0)
})

export const normalizeMothershipState = (value: unknown): MothershipState => {
  const fallback = defaultMothershipState()
  if (!value || typeof value !== 'object') return fallback
  const input = value as Partial<MothershipState>
  if (input.version !== 1) return fallback
  return {
    version: 1,
    resources: normalizeResources(input.resources),
    departments: {
      scanner: clampInt(input.departments?.scanner ?? 0),
      workbench: clampInt(input.departments?.workbench ?? 0),
      archive: Math.max(1, clampInt(input.departments?.archive ?? 1))
    },
    archive: {
      records: input.archive?.records && typeof input.archive.records === 'object' ? input.archive.records : {},
      relicBlueprints: input.archive?.relicBlueprints && typeof input.archive.relicBlueprints === 'object' ? input.archive.relicBlueprints : {},
      signalFragments: clampInt(input.archive?.signalFragments ?? 0)
    }
  }
}

export const mergeArchiveRecords = (
  existing: Record<string, PersistentArchiveRecord>,
  incoming: Record<string, PersistentArchiveRecord>
) => {
  const merged: Record<string, PersistentArchiveRecord> = { ...existing }
  for (const record of Object.values(incoming)) {
    const previous = merged[record.id]
    merged[record.id] = {
      ...previous,
      ...record,
      count: (previous?.count ?? 0) + 1
    }
  }
  return merged
}

const extractionMultiplier = (outcome: RunOutcomeKind, skippedBeacons: number) => {
  if (outcome === 'destroyed') return 0.45
  const skipBonus = Math.min(0.3, Math.max(0, skippedBeacons) * 0.1)
  return outcome === 'deepExtraction' ? 1.05 + skipBonus : 1
}

export const applyRunRecovery = (state: MothershipState, input: RunRecoveryInput): MothershipState => {
  const multiplier = extractionMultiplier(input.outcome, input.skippedBeacons)
  const recovered = normalizeResources({
    scrap: input.resources.scrap * multiplier,
    crystal: input.resources.crystal * multiplier,
    cores: input.outcome === 'destroyed' ? Math.floor(input.resources.cores * multiplier) : input.resources.cores
  })
  const archiveRecords = mergeArchiveRecords(state.archive.records, input.archiveRecords)
  const relicBlueprints = { ...state.archive.relicBlueprints }
  if (state.departments.archive >= 2) {
    for (const record of Object.values(input.archiveRecords)) {
      if (record.kind === 'relic') relicBlueprints[record.id] = (relicBlueprints[record.id] ?? 0) + 1
    }
  }
  const loreCount = Object.values(input.archiveRecords).filter((record) => record.kind === 'lore').length
  return {
    ...state,
    resources: {
      scrap: state.resources.scrap + recovered.scrap,
      crystal: state.resources.crystal + recovered.crystal,
      cores: state.resources.cores + recovered.cores
    },
    archive: {
      records: archiveRecords,
      relicBlueprints,
      signalFragments: state.archive.signalFragments + (state.departments.archive >= 4 ? loreCount : 0)
    }
  }
}

export const canAfford = (resources: ResourceBundle, cost: ResourceBundle) => (
  resources.scrap >= cost.scrap && resources.crystal >= cost.crystal && resources.cores >= cost.cores
)

const shortResource = (cost: ResourceBundle, resources: ResourceBundle) => {
  if (resources.scrap < cost.scrap) return 'Not enough scrap.'
  if (resources.crystal < cost.crystal) return 'Not enough crystals.'
  if (resources.cores < cost.cores) return 'Not enough cores.'
  return 'Department already maxed.'
}

export const purchaseMothershipTier = (state: MothershipState, department: MothershipDepartmentId) => {
  const definition = mothershipDepartments[department]
  const current = state.departments[department]
  const tier = definition.tiers[current]
  if (!tier || !canAfford(state.resources, tier.cost)) {
    return { ok: false as const, state, reason: tier ? shortResource(tier.cost, state.resources) : 'Department already maxed.' }
  }
  return {
    ok: true as const,
    state: {
      ...state,
      resources: {
        scrap: state.resources.scrap - tier.cost.scrap,
        crystal: state.resources.crystal - tier.cost.crystal,
        cores: state.resources.cores - tier.cost.cores
      },
      departments: {
        ...state.departments,
        [department]: current + 1
      }
    },
    purchased: tier
  }
}
```

- [ ] **Step 4: Run tests for the progression module**

Run:

```bash
npx playwright test tests/mothership-progression.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/mothership-progression.ts tests/mothership-progression.spec.ts
git commit -m "feat: add mothership progression rules"
```

Expected: commit succeeds.

---

## Task 2: Add Pure Return Beacon Rules

**Files:**

- Create: `src/return-beacons.ts`
- Create: `tests/return-beacons.spec.ts`

- [ ] **Step 1: Write failing beacon tests**

Create `tests/return-beacons.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { beaconExtractionBonus, nextBeaconWindow, returnBeaconEligible } from '../src/return-beacons'

test('blocks first beacon before five minutes or before first planet', () => {
  expect(returnBeaconEligible({ time: 299, planetsVisited: 1, activeBeacon: false, nextBeaconAt: 0 })).toBe(false)
  expect(returnBeaconEligible({ time: 360, planetsVisited: 0, activeBeacon: false, nextBeaconAt: 0 })).toBe(false)
})

test('allows first beacon after five minutes and one planet', () => {
  expect(returnBeaconEligible({ time: 300, planetsVisited: 1, activeBeacon: false, nextBeaconAt: 0 })).toBe(true)
})

test('blocks beacon while another beacon is active', () => {
  expect(returnBeaconEligible({ time: 600, planetsVisited: 3, activeBeacon: true, nextBeaconAt: 0 })).toBe(false)
})

test('uses a later next beacon window after a skipped beacon', () => {
  expect(returnBeaconEligible({ time: 500, planetsVisited: 2, activeBeacon: false, nextBeaconAt: 540 })).toBe(false)
  expect(returnBeaconEligible({ time: 540, planetsVisited: 2, activeBeacon: false, nextBeaconAt: 540 })).toBe(true)
})

test('caps skipped beacon extraction bonus', () => {
  expect(beaconExtractionBonus(0)).toBe(1)
  expect(beaconExtractionBonus(2)).toBe(1.2)
  expect(beaconExtractionBonus(9)).toBe(1.3)
})

test('schedules the next beacon four minutes later', () => {
  expect(nextBeaconWindow(320)).toBe(560)
})
```

- [ ] **Step 2: Run the beacon test to verify it fails**

Run:

```bash
npx playwright test tests/return-beacons.spec.ts
```

Expected: FAIL because `src/return-beacons.ts` does not exist.

- [ ] **Step 3: Implement the beacon rules module**

Create `src/return-beacons.ts`:

```ts
export interface ReturnBeaconEligibilityInput {
  time: number
  planetsVisited: number
  activeBeacon: boolean
  nextBeaconAt: number
}

export const FIRST_BEACON_TIME = 300
export const BEACON_INTERVAL = 240
export const BEACON_HOLD_SECONDS = 3.2

export const returnBeaconEligible = (input: ReturnBeaconEligibilityInput) => {
  if (input.activeBeacon) return false
  if (input.planetsVisited < 1) return false
  if (input.time < FIRST_BEACON_TIME) return false
  if (input.nextBeaconAt > 0 && input.time < input.nextBeaconAt) return false
  return true
}

export const nextBeaconWindow = (currentTime: number) => currentTime + BEACON_INTERVAL

export const beaconExtractionBonus = (skippedBeacons: number) => (
  1 + Math.min(0.3, Math.max(0, skippedBeacons) * 0.1)
)

export const beaconSpawnDistance = (skippedBeacons: number) => (
  760 + Math.min(420, Math.max(0, skippedBeacons) * 110)
)
```

- [ ] **Step 4: Run beacon tests**

Run:

```bash
npx playwright test tests/return-beacons.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/return-beacons.ts tests/return-beacons.spec.ts
git commit -m "feat: add return beacon rules"
```

Expected: commit succeeds.

---

## Task 3: Wire Mothership Persistence Into Game State

**Files:**

- Modify: `src/main.ts`
- Test: `tests/mothership-progression.spec.ts`

- [ ] **Step 1: Import the progression model in `src/main.ts`**

At the import section, add:

```ts
import {
  applyRunRecovery,
  defaultMothershipState,
  mothershipDepartments,
  normalizeMothershipState,
  purchaseMothershipTier,
  type MothershipDepartmentId,
  type MothershipState,
  type PersistentArchiveRecord,
  type RunOutcomeKind
} from './mothership-progression'
```

- [ ] **Step 2: Add game states and debrief types**

Change `GameState` to include `mothership` and `debrief` as shown in the Naming Decisions section.

Add near the other interfaces:

```ts
interface DebriefReport {
  outcome: RunOutcomeKind
  title: string
  copy: string
  resources: {
    earned: { scrap: number; crystal: number; cores: number }
    recovered: { scrap: number; crystal: number; cores: number }
  }
  discoveries: PersistentArchiveRecord[]
  skippedBeacons: number
}
```

- [ ] **Step 3: Add mothership fields and storage key**

Near `STORAGE_KEY`, add:

```ts
const MOTHERSHIP_STORAGE_KEY = 'galactic_hordes_mothership_v1'
```

Near existing class fields, add:

```ts
private mothership: MothershipState = defaultMothershipState()
private debrief: DebriefReport | null = null
```

- [ ] **Step 4: Load mothership state in the constructor**

After score loading in the constructor, add:

```ts
this.mothership = this.loadMothership()
```

- [ ] **Step 5: Add load/save helpers**

Near `loadScores()` and `saveScore()`, add:

```ts
private loadMothership() {
  try {
    return normalizeMothershipState(JSON.parse(localStorage.getItem(MOTHERSHIP_STORAGE_KEY) || 'null'))
  } catch {
    return defaultMothershipState()
  }
}

private saveMothership() {
  localStorage.setItem(MOTHERSHIP_STORAGE_KEY, JSON.stringify(this.mothership))
}
```

- [ ] **Step 6: Convert current run artifacts to persistent archive records**

Add helper:

```ts
private currentRunArchiveRecords(): Record<string, PersistentArchiveRecord> {
  const records: Record<string, PersistentArchiveRecord> = {}
  for (const artifact of this.artifacts.values()) {
    records[artifact.id] = {
      id: artifact.id,
      kind: artifact.kind,
      title: artifact.title,
      detail: artifact.detail,
      source: artifact.source,
      color: artifact.color,
      icon: artifact.icon,
      count: artifact.count
    }
  }
  return records
}
```

- [ ] **Step 7: Keep runtime reset separate from persistent mothership**

Confirm `reset()` still clears only current run values:

```ts
this.resources = { scrap: 0, crystal: 0, cores: 0 }
this.artifacts.clear()
```

Do not reset `this.mothership` inside `reset()`.

- [ ] **Step 8: Run tests and build**

Run:

```bash
npx playwright test tests/mothership-progression.spec.ts tests/return-beacons.spec.ts
npm run build
```

Expected: tests pass and build exits 0.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/main.ts
git commit -m "feat: persist mothership state"
```

Expected: commit succeeds.

---

## Task 4: Replace Normal Death With Debrief Recovery

**Files:**

- Modify: `src/main.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Add a run recovery helper**

Add method:

```ts
private finishRun(outcome: RunOutcomeKind) {
  const before = { ...this.mothership.resources }
  const archiveRecords = this.currentRunArchiveRecords()
  const discoveries = Object.values(archiveRecords)
  this.mothership = applyRunRecovery(this.mothership, {
    outcome,
    resources: this.resources,
    archiveRecords,
    skippedBeacons: this.skippedReturnBeacons
  })
  this.saveMothership()
  const recovered = {
    scrap: this.mothership.resources.scrap - before.scrap,
    crystal: this.mothership.resources.crystal - before.crystal,
    cores: this.mothership.resources.cores - before.cores
  }
  this.debrief = {
    outcome,
    title: outcome === 'destroyed' ? 'BLACK BOX RECOVERED' : outcome === 'deepExtraction' ? 'DEEP EXPEDITION EXTRACTED' : 'EXPEDITION EXTRACTED',
    copy: outcome === 'destroyed'
      ? 'The scout ship was lost. The mothership recovered partial cargo and all transmitted discoveries.'
      : 'The scout ship returned through a beacon. Cargo, signals, and discoveries were processed cleanly.',
    resources: {
      earned: { ...this.resources },
      recovered
    },
    discoveries,
    skippedBeacons: this.skippedReturnBeacons
  }
  this.state = 'debrief'
  this.renderDebrief()
}
```

This step depends on Task 5 for `skippedReturnBeacons`; until then add the field with default `0` in Task 4:

```ts
private skippedReturnBeacons = 0
```

- [ ] **Step 2: Route fatal damage into debrief**

Find the current gameover trigger and change it from directly showing gameover to:

```ts
this.finishRun('destroyed')
```

Keep high score saving available from the debrief or mothership later; do not remove score code.

- [ ] **Step 3: Add debrief renderer**

Add method:

```ts
private renderDebrief() {
  if (!this.debrief) return
  this.ui.gameover.innerHTML = ''
  const panel = document.createElement('div')
  panel.className = 'panel debrief-panel'
  const h = document.createElement('h1')
  h.className = 'title'
  h.textContent = this.debrief.title
  const copy = document.createElement('p')
  copy.className = 'copy'
  copy.textContent = this.debrief.copy
  const resources = document.createElement('div')
  resources.className = 'debrief-grid'
  resources.innerHTML = `
    <div><b>${this.debrief.resources.recovered.scrap}</b><span>Scrap Recovered</span></div>
    <div><b>${this.debrief.resources.recovered.crystal}</b><span>Crystals Recovered</span></div>
    <div><b>${this.debrief.resources.recovered.cores}</b><span>Cores Recovered</span></div>
    <div><b>${this.debrief.discoveries.length}</b><span>Discoveries Logged</span></div>
  `
  const discoveries = document.createElement('p')
  discoveries.className = 'copy small'
  discoveries.textContent = this.debrief.discoveries.length
    ? this.debrief.discoveries.slice(0, 4).map((record) => record.title).join(' // ')
    : 'No new archive records.'
  const row = document.createElement('div')
  row.className = 'button-row'
  const continueButton = document.createElement('button')
  continueButton.className = 'vector-button'
  continueButton.textContent = 'Return to Mothership'
  continueButton.addEventListener('click', () => this.showMothership())
  row.append(continueButton)
  panel.append(h, copy, resources, discoveries, row)
  this.ui.gameover.append(panel)
  this.showOnly('gameover')
}
```

- [ ] **Step 4: Add debrief styles**

Append to `src/style.css`:

```css
.debrief-panel {
  max-width: 760px;
}

.debrief-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0;
}

.debrief-grid div {
  border: 1px solid rgba(87, 255, 243, 0.24);
  background: rgba(6, 18, 26, 0.72);
  padding: 12px 10px;
  text-align: center;
}

.debrief-grid b {
  display: block;
  color: #fff27a;
  font-size: 1.25rem;
}

.debrief-grid span {
  display: block;
  color: rgba(215, 255, 247, 0.72);
  font-size: 0.72rem;
  text-transform: uppercase;
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/main.ts src/style.css
git commit -m "feat: add expedition debrief recovery"
```

Expected: commit succeeds.

---

## Task 5: Add Mothership Command Hub

**Files:**

- Modify: `src/main.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Make Start enter the mothership hub**

Change title start button behavior from `this.start()` to:

```ts
this.showMothership()
```

Keep `start()` as the method that launches an expedition.

- [ ] **Step 2: Add mothership renderer**

Add method:

```ts
private showMothership() {
  this.state = 'mothership'
  this.ui.title.innerHTML = ''
  this.ui.title.className = 'screen mothership-screen'
  const panel = document.createElement('div')
  panel.className = 'mothership-command'
  const header = document.createElement('div')
  header.className = 'mothership-header'
  header.innerHTML = `
    <div>
      <h1 class="title">MOTHERSHIP COMMAND</h1>
      <p class="copy">Scout docked. Archive linked. Expedition systems waiting.</p>
    </div>
    <div class="mothership-resources">
      <span>S ${this.mothership.resources.scrap}</span>
      <span>C ${this.mothership.resources.crystal}</span>
      <span>K ${this.mothership.resources.cores}</span>
    </div>
  `
  const grid = document.createElement('div')
  grid.className = 'station-grid'
  grid.append(
    this.mothershipStation('Launch Deck', 'Start the next expedition.', 'Launch Expedition', () => this.start()),
    this.departmentStation('scanner'),
    this.departmentStation('workbench'),
    this.departmentStation('archive'),
    this.lockedStation('Shipyard', 'Starting loadouts and scout prep. Offline.'),
    this.lockedStation('Signal Core', 'Deep signal decoding. Offline.')
  )
  panel.append(header, grid)
  this.ui.title.append(panel)
  this.showOnly('title')
}
```

- [ ] **Step 3: Add station helpers**

Add methods:

```ts
private mothershipStation(title: string, copy: string, actionLabel: string, action: () => void) {
  const card = document.createElement('div')
  card.className = 'station-card'
  const h = document.createElement('h2')
  h.textContent = title
  const p = document.createElement('p')
  p.textContent = copy
  const button = document.createElement('button')
  button.className = 'vector-button'
  button.textContent = actionLabel
  button.addEventListener('click', action)
  card.append(h, p, button)
  return card
}

private lockedStation(title: string, copy: string) {
  const card = document.createElement('div')
  card.className = 'station-card locked'
  card.innerHTML = `<h2>${this.escape(title)}</h2><p>${this.escape(copy)}</p><span>OFFLINE</span>`
  return card
}

private departmentStation(id: MothershipDepartmentId) {
  const definition = mothershipDepartments[id]
  const tier = this.mothership.departments[id]
  const next = definition.tiers[tier]
  const card = document.createElement('div')
  card.className = 'station-card'
  const h = document.createElement('h2')
  h.textContent = `${definition.name} ${tier}/${definition.tiers.length}`
  const p = document.createElement('p')
  p.textContent = next ? next.description : 'Department maxed.'
  const cost = document.createElement('span')
  cost.className = 'station-cost'
  cost.textContent = next ? `S ${next.cost.scrap} // C ${next.cost.crystal} // K ${next.cost.cores}` : 'MAXED'
  const button = document.createElement('button')
  button.className = 'vector-button secondary'
  button.textContent = next ? 'Upgrade' : 'Online'
  button.disabled = !next
  button.addEventListener('click', () => this.buyMothershipDepartment(id))
  card.append(h, p, cost, button)
  return card
}

private buyMothershipDepartment(id: MothershipDepartmentId) {
  const result = purchaseMothershipTier(this.mothership, id)
  if (!result.ok) {
    this.toast(result.reason)
    return
  }
  this.mothership = result.state
  this.saveMothership()
  this.toast(`${result.purchased.name.toUpperCase()} ONLINE`)
  this.showMothership()
}
```

- [ ] **Step 4: Add hub styles**

Append:

```css
.mothership-screen {
  align-items: stretch;
  justify-content: center;
  padding: 18px;
}

.mothership-command {
  width: min(980px, 100%);
  margin: auto;
}

.mothership-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  border-bottom: 1px solid rgba(87, 255, 243, 0.24);
  padding-bottom: 14px;
  margin-bottom: 14px;
}

.mothership-resources {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  color: #fff27a;
  font-size: 0.85rem;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.station-card {
  border: 1px solid rgba(87, 255, 243, 0.26);
  background: linear-gradient(180deg, rgba(10, 24, 34, 0.92), rgba(4, 10, 18, 0.88));
  min-height: 178px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.station-card h2 {
  margin: 0;
  color: #d7fff7;
  font-size: 1rem;
}

.station-card p {
  margin: 0;
  color: rgba(215, 255, 247, 0.76);
  line-height: 1.35;
  flex: 1;
}

.station-card.locked {
  opacity: 0.58;
}

.station-cost {
  color: #fff27a;
  font-size: 0.76rem;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .mothership-header {
    flex-direction: column;
  }

  .station-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/main.ts src/style.css
git commit -m "feat: add mothership command hub"
```

Expected: commit succeeds.

---

## Task 6: Add Return Beacon Runtime Integration

**Files:**

- Modify: `src/main.ts`
- Modify: `src/style.css`
- Test: `tests/return-beacons.spec.ts`

- [ ] **Step 1: Import beacon rules**

Add:

```ts
import {
  BEACON_HOLD_SECONDS,
  beaconSpawnDistance,
  nextBeaconWindow,
  returnBeaconEligible
} from './return-beacons'
```

- [ ] **Step 2: Add return beacon interface and fields**

Near other interfaces:

```ts
interface ReturnBeacon {
  x: number
  y: number
  radius: number
  hold: number
  phase: number
}
```

Near class fields:

```ts
private returnBeacon: ReturnBeacon | null = null
private nextReturnBeaconAt = 0
private skippedReturnBeacons = 0
```

If `skippedReturnBeacons` was added in Task 4, keep one field only.

- [ ] **Step 3: Reset beacon state per expedition**

In `reset()`, add:

```ts
this.returnBeacon = null
this.nextReturnBeaconAt = 0
this.skippedReturnBeacons = 0
```

- [ ] **Step 4: Spawn eligible beacons during playing update**

In the main update loop when `state === 'playing'`, call:

```ts
this.updateReturnBeacon(dt)
```

Add method:

```ts
private updateReturnBeacon(dt: number) {
  if (this.state !== 'playing') return
  if (!this.returnBeacon && returnBeaconEligible({
    time: this.stats.time,
    planetsVisited: this.stats.planets,
    activeBeacon: false,
    nextBeaconAt: this.nextReturnBeaconAt
  })) {
    this.spawnReturnBeacon()
  }
  if (!this.returnBeacon) return
  this.returnBeacon.phase += dt
  const inside = Math.sqrt(dist2(this.returnBeacon, this.player)) < this.returnBeacon.radius
  if (inside) {
    this.returnBeacon.hold += dt
    if (this.returnBeacon.hold >= BEACON_HOLD_SECONDS) {
      this.finishRun(this.skippedReturnBeacons > 0 ? 'deepExtraction' : 'cleanExtraction')
      return
    }
  } else {
    this.returnBeacon.hold = Math.max(0, this.returnBeacon.hold - dt * 1.5)
  }
}
```

- [ ] **Step 5: Add beacon spawn and skip helpers**

Add:

```ts
private spawnReturnBeacon() {
  const angle = this.player.angle + rand(-0.9, 0.9)
  const distance = beaconSpawnDistance(this.skippedReturnBeacons)
  this.returnBeacon = {
    x: this.player.x + Math.cos(angle) * distance,
    y: this.player.y + Math.sin(angle) * distance,
    radius: 96,
    hold: 0,
    phase: 0
  }
  this.toast('RETURN BEACON DETECTED')
  this.audio.pickup('nav')
}

private skipReturnBeacon() {
  if (!this.returnBeacon) return
  this.returnBeacon = null
  this.skippedReturnBeacons += 1
  this.nextReturnBeaconAt = nextBeaconWindow(this.stats.time)
  this.toast('RETURN BEACON SKIPPED. DEEP EXTRACTION BONUS RISING.')
}
```

Skipping can be wired later to leaving the beacon far behind or to a small `SKIP` button if needed. V1 can treat beacon expiry as manual in polish if no clean input exists.

- [ ] **Step 6: Render the beacon in space**

In the space render path after planets, add:

```ts
this.renderReturnBeacon(ctx)
```

Add method:

```ts
private renderReturnBeacon(ctx: CanvasRenderingContext2D) {
  if (!this.returnBeacon) return
  const p = this.worldToScreen(this.returnBeacon.x, this.returnBeacon.y)
  const pulse = Math.sin(this.returnBeacon.phase * 4) * 0.5 + 0.5
  ctx.save()
  ctx.strokeStyle = '#fff27a'
  ctx.shadowColor = '#fff27a'
  ctx.shadowBlur = this.allowGlow() ? 24 : 8
  ctx.lineWidth = 2 + pulse
  ctx.beginPath()
  ctx.arc(p.x, p.y, this.returnBeacon.radius, 0, TAU)
  ctx.stroke()
  ctx.strokeStyle = '#57fff3'
  ctx.beginPath()
  ctx.arc(p.x, p.y, this.returnBeacon.radius * clamp(this.returnBeacon.hold / BEACON_HOLD_SECONDS, 0, 1), 0, TAU)
  ctx.stroke()
  ctx.fillStyle = '#fff27a'
  ctx.textAlign = 'center'
  ctx.fillText('RETURN BEACON', p.x, p.y - this.returnBeacon.radius - 12)
  ctx.restore()
}
```

- [ ] **Step 7: Add HUD hint for scanner tier**

If `this.mothership.departments.scanner >= 2` and a beacon exists, show direction/distance in `updateUi()` or the existing resources/status line:

```ts
const beaconText = this.returnBeacon && this.mothership.departments.scanner >= 2
  ? ` // BEACON ${Math.floor(Math.sqrt(dist2(this.returnBeacon, this.player)))}`
  : ''
this.ui.resources.textContent = `S ${this.resources.scrap} C ${this.resources.crystal} K ${this.resources.cores}${beaconText}`
```

- [ ] **Step 8: Run tests and build**

Run:

```bash
npx playwright test tests/return-beacons.spec.ts
npm run build
```

Expected: tests pass and build exits 0.

- [ ] **Step 9: Commit**

Run:

```bash
git add src/main.ts src/style.css
git commit -m "feat: add return beacon extraction"
```

Expected: commit succeeds.

---

## Task 7: Apply Mothership Department Effects

**Files:**

- Modify: `src/main.ts`
- Modify: `src/mothership-progression.ts` if balance costs need adjustment

- [ ] **Step 1: Apply Scanner Array tiers to planet UI**

In `renderPlanet(p: Planet)`, change copy generation:

```ts
const scanner = this.mothership.departments.scanner
const risk = this.planetRiskLabel(p)
copy.textContent = p.visited
  ? 'The dock remembers you. It offers a small repair and a moment of quiet.'
  : scanner >= 3
    ? `${p.reward} Risk: ${risk}.`
    : scanner >= 1
      ? `${p.archetype.toUpperCase()} SIGNAL // ${p.reward}`
      : p.reward
```

Add helper:

```ts
private planetRiskLabel(p: Planet) {
  if (p.archetype === 'horde') return 'EXTREME'
  if (p.archetype === 'hostile' || p.archetype === 'strange') return 'HOSTILE'
  if (p.archetype === 'relic' || p.archetype === 'cache') return 'UNSTABLE'
  return 'QUIET'
}
```

- [ ] **Step 2: Apply Workbench Bay tier 2 to choice count**

In `openLevelUp()`, change count logic to include mothership workbench:

```ts
const benchTier = this.mothership.departments.workbench
const fourthChoiceChance = 0.08 + this.build.luck * 0.08 + (benchTier >= 2 ? 0.08 : 0)
const count = 3 + (rare || Math.random() < fourthChoiceChance ? 1 : 0)
```

- [ ] **Step 3: Apply Workbench Bay tier 3 to coherence bias**

In `weightedUpgrade()`, include:

```ts
const benchTier = this.mothership.departments.workbench
const ownedBias = 1.55 + this.build.luck * 0.08 + (benchTier >= 3 ? 0.2 : 0)
```

- [ ] **Step 4: Add Workbench Bay tier 1 reroll budget**

Add field:

```ts
private workbenchRerolls = 0
```

In `reset()`:

```ts
this.workbenchRerolls = this.mothership.departments.workbench >= 1 ? 1 : 0
```

In `renderLevelUp()`, add a reroll button when `this.workbenchRerolls > 0`:

```ts
const reroll = document.createElement('button')
reroll.className = 'vector-button secondary'
reroll.textContent = `Reroll (${this.workbenchRerolls})`
reroll.addEventListener('click', () => {
  if (this.workbenchRerolls <= 0 || this.workbenchInstalling) return
  this.workbenchRerolls -= 1
  this.upgradeChoices = this.rollUpgrades(this.upgradeChoices.length)
  this.renderLevelUp(title, copy)
})
```

Append this button near the workbench tabs or choice grid.

- [ ] **Step 5: Apply Archive Lab tier 2 blueprints**

No extra main code is needed if Task 1's `applyRunRecovery()` already records relic blueprint progress when archive tier is at least 2. Verify debrief shows archive counts.

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build exits 0.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/main.ts src/mothership-progression.ts
git commit -m "feat: apply mothership department effects"
```

Expected: commit succeeds.

---

## Task 8: Polish Mothership, Debrief, and Beacon Pacing

**Files:**

- Modify: `src/main.ts`
- Modify: `src/style.css`
- Modify: `README.md`

- [ ] **Step 1: Add clear launch/debrief shortcuts**

In `showMothership()`, if `this.debrief` exists, add a compact status line:

```ts
const lastRun = document.createElement('p')
lastRun.className = 'copy small'
lastRun.textContent = `Last report: ${this.debrief.title} // ${this.debrief.discoveries.length} discoveries // S ${this.debrief.resources.recovered.scrap} C ${this.debrief.resources.recovered.crystal} K ${this.debrief.resources.recovered.cores}`
header.append(lastRun)
```

- [ ] **Step 2: Tune death recovery if first playtest feels too harsh or too generous**

Change only `extractionMultiplier()` in `src/mothership-progression.ts`.

Default target:

```ts
if (outcome === 'destroyed') return 0.45
```

Acceptable V1 range:

```ts
0.35 to 0.5
```

Use 0.45 unless browser play shows destroyed runs feel pointless.

- [ ] **Step 3: Tune first beacon distance if travel feels unclear**

Change only `beaconSpawnDistance()` in `src/return-beacons.ts`.

Default:

```ts
760 + Math.min(420, Math.max(0, skippedBeacons) * 110)
```

Acceptable V1 range:

```ts
650 to 950 base distance
```

Use 760 unless the beacon appears too close to feel like a decision.

- [ ] **Step 4: Update README current prototype bullets**

Add bullets under Current Prototype:

```md
- Mothership command hub wraps launch, archive, and department upgrades.
- Return beacons allow clean extraction after a meaningful expedition.
- Destroyed runs recover black-box archive data and partial resources.
```

- [ ] **Step 5: Run focused tests and build**

Run:

```bash
npx playwright test tests/mothership-progression.spec.ts tests/return-beacons.spec.ts
npm run build
```

Expected: tests pass and build exits 0.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/main.ts src/style.css src/mothership-progression.ts src/return-beacons.ts README.md
git commit -m "polish: tune mothership progression loop"
```

Expected: commit succeeds.

---

## Task 9: Browser Verification and Balance Pass

**Files:**

- Modify only if verification finds a concrete issue.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Vite starts and prints a local URL.

- [ ] **Step 2: Open in browser**

Use the Browser plugin or Playwright skill to open the Vite URL.

Verify:

- Title screen opens.
- Start enters mothership hub.
- Launch starts the expedition.
- HUD remains readable on desktop and mobile-sized viewport.
- Landing and surface return still work.
- Workbench still opens after banked mutation signals.

- [ ] **Step 3: Use debug assistance if needed**

If manual play to 5 minutes is too slow, add a temporary query-param-only debug path in `main.ts`:

```ts
const debugFastBeacon = new URLSearchParams(location.search).has('beacondebug')
```

Then use it only to reduce beacon eligibility for verification. Remove the debug path before final commit unless the project already has a debug-query convention to keep.

- [ ] **Step 4: Verify return beacon flow**

In browser:

- Reach eligibility.
- Confirm beacon appears in space.
- Confirm Scanner tier 2 shows beacon distance after buying/forcing it.
- Hold in beacon.
- Confirm debrief appears.
- Confirm Return to Mothership works.
- Confirm persistent resources increased.

- [ ] **Step 5: Verify death recovery**

In browser:

- Let ship die.
- Confirm debrief appears with black-box copy.
- Confirm discoveries and partial resources are recovered.
- Confirm returning to mothership works.

- [ ] **Step 6: Verify persistence**

In browser:

- Buy one department upgrade.
- Reload page.
- Confirm the department tier and persistent resources remain.

- [ ] **Step 7: Final verification commands**

Run:

```bash
npx playwright test
npm run build
```

Expected: all tests pass and build exits 0.

- [ ] **Step 8: Commit any verification fixes**

If verification required fixes:

```bash
git add src/main.ts src/style.css src/mothership-progression.ts src/return-beacons.ts tests README.md
git commit -m "fix: verify mothership progression loop"
```

Expected: commit succeeds if there are fixes. If no fixes are needed, do not make an empty commit.

---

## Self-Review Checklist

- Spec coverage:
  - Persistent resources and archive: Task 1, Task 3.
  - Death black-box recovery: Task 4.
  - Beacon extraction: Task 2, Task 6.
  - Debrief then mothership: Task 4, Task 5.
  - Mothership hub wrapper: Task 5.
  - Three V1 departments: Task 1, Task 5, Task 7.
  - Tests/build/browser verification: Task 1, Task 2, Task 8, Task 9.

- Deliberate omissions:
  - Starting loadout is deferred.
  - Walkable mothership is deferred.
  - Branching department trees are deferred.
  - Signal Core content chain is deferred.

- Risk controls:
  - Pure modules get tests before `main.ts` wiring.
  - Beacon and recovery numbers live in small functions for tuning.
  - Hub remains a fast menu.
  - Planet landing choice menus are not added.

## Execution Notes

Run this plan task-by-task. Do not start implementation until the user approves the plan.

Preferred execution mode after approval:

1. Subagent-driven for pure modules and CSS/UI review if multiple agents are allowed.
2. Inline execution for `main.ts` integration because the file is large and coordination conflicts are likely.
