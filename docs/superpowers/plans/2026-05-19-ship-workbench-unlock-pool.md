# Ship Workbench Unlock Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the greyed-out workbench manifest install surface with five clickable offers, followed by visible maxed and locked context.

**Architecture:** Add pure unlock-pool helpers in `src/workbench-rolls.ts`, then have `src/main.ts` roll only from the unlocked non-maxed pool and render a workbench-specific install surface. Keep the existing overview manifest for reference views.

**Tech Stack:** TypeScript, Vite, Playwright test runner, existing DOM-rendered UI and CSS.

---

### Task 1: Workbench Unlock Helpers

**Files:**
- Modify: `tests/workbench-rolls.spec.ts`
- Modify: `src/workbench-rolls.ts`

- [ ] **Step 1: Write failing helper tests**

Replace `tests/workbench-rolls.spec.ts` with tests that keep `firstOpportunityUpgrade` coverage and add unlock-pool expectations:

```ts
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
```

- [ ] **Step 2: Run helper tests to verify they fail**

Run: `npm run test -- tests/workbench-rolls.spec.ts`

Expected: FAIL because `workbenchStarterUpgradeIds`, `workbenchUnlockedUpgradeIds`, `workbenchRollableUpgrades`, and `workbenchLockedUpgrades` are not exported yet.

- [ ] **Step 3: Implement unlock helpers**

Replace `src/workbench-rolls.ts` with:

```ts
import type { Upgrade, UpgradeId } from './powerup-balance'

export function firstOpportunityUpgrade<T extends { id: string; max: number }>(
  upgrades: T[],
  build: Record<string, number>,
  requiredId?: string
): T | null {
  if (!requiredId) return null
  if ((build[requiredId] ?? 0) > 0) return null
  return upgrades.find((upgrade) => upgrade.id === requiredId && (build[upgrade.id] ?? 0) < upgrade.max) ?? null
}

export const workbenchStarterUpgradeIds = ['rapid', 'engine', 'magnet', 'shield', 'split'] as const satisfies readonly UpgradeId[]

export const workbenchUnlockEdges = [
  { source: 'rapid', unlocks: ['chain', 'rail'] },
  { source: 'split', unlocks: ['pierce', 'echo'] },
  { source: 'engine', unlocks: ['nav', 'phase'] },
  { source: 'shield', unlocks: ['repair', 'vampire'] },
  { source: 'magnet', unlocks: ['luck', 'cargo'] },
  { source: 'luck', unlocks: ['survey'] },
  { source: 'survey', unlocks: ['suitO2', 'suitHealth', 'suitBlaster'] },
  { source: 'chain', unlocks: ['orbit'] },
  { source: 'rail', unlocks: ['rift'] },
  { source: 'echo', unlocks: ['rift'] },
  { source: 'phase', unlocks: ['mine'] },
  { source: 'cargo', unlocks: ['mine'] }
] as const satisfies ReadonlyArray<{ source: UpgradeId; unlocks: readonly UpgradeId[] }>

export interface WorkbenchLockedUpgrade<T extends { id: string }> {
  upgrade: T
  requirement: string
}

const upgradeName = <T extends { id: string; name?: string }>(upgrades: readonly T[], id: string) => (
  upgrades.find((upgrade) => upgrade.id === id)?.name ?? id
)

const unlockRequirement = <T extends { id: string; name?: string }>(upgrades: readonly T[], id: string) => {
  const sources = workbenchUnlockEdges
    .filter((edge) => edge.unlocks.includes(id as UpgradeId))
    .map((edge) => upgradeName(upgrades, edge.source))
  if (!sources.length) return 'Future workbench unlock'
  return `Max ${sources.join(' or ')}`
}

export function workbenchUnlockedUpgradeIds<T extends { id: UpgradeId; max: number }>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): UpgradeId[] {
  const validIds = new Set(upgrades.map((upgrade) => upgrade.id))
  const unlocked = new Set<UpgradeId>(workbenchStarterUpgradeIds.filter((id) => validIds.has(id)))
  for (const edge of workbenchUnlockEdges) {
    const source = upgrades.find((upgrade) => upgrade.id === edge.source)
    if (!source || (build[edge.source] ?? 0) < source.max) continue
    for (const id of edge.unlocks) {
      if (validIds.has(id)) unlocked.add(id)
    }
  }
  return upgrades.filter((upgrade) => unlocked.has(upgrade.id)).map((upgrade) => upgrade.id)
}

export function workbenchRollableUpgrades<T extends Upgrade>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): T[] {
  const unlocked = new Set(workbenchUnlockedUpgradeIds(upgrades, build))
  return upgrades.filter((upgrade) => unlocked.has(upgrade.id) && (build[upgrade.id] ?? 0) < upgrade.max)
}

export function workbenchLockedUpgrades<T extends Upgrade>(
  upgrades: readonly T[],
  build: Record<UpgradeId, number>
): Array<WorkbenchLockedUpgrade<T>> {
  const unlocked = new Set(workbenchUnlockedUpgradeIds(upgrades, build))
  return upgrades
    .filter((upgrade) => !unlocked.has(upgrade.id))
    .map((upgrade) => ({ upgrade, requirement: unlockRequirement(upgrades, upgrade.id) }))
}
```

- [ ] **Step 4: Run helper tests to verify they pass**

Run: `npm run test -- tests/workbench-rolls.spec.ts`

Expected: PASS.

### Task 2: Roll Five Actionable Offers

**Files:**
- Modify: `tests/powerup-balance.spec.ts`
- Modify: `src/powerup-balance.ts`
- Modify: `src/main.ts`
- Modify: `src/mothership-progression.ts`

- [ ] **Step 1: Write failing balance and source tests**

Update the workbench tuning test in `tests/powerup-balance.spec.ts`:

```ts
test('workbench roll tuning is configurable', () => {
  expect(workbenchBalance.baseChoiceCount).toBe(5)
  expect(workbenchBalance.ownedBiasBase).toBeGreaterThan(1)
  expect(workbenchBalance.relicChanceRare).toBeGreaterThan(workbenchBalance.relicChanceBase)
})
```

Add expectations to `workbench upgrade cards distinguish next rank from current manifest rank`:

```ts
expect(main).toContain('workbenchRollableUpgrades(upgrades, this.build)')
expect(main).toContain('const count = workbenchBalance.baseChoiceCount')
expect(main).not.toContain('fourthChoiceChance')
```

- [ ] **Step 2: Run balance test to verify it fails**

Run: `npm run test -- tests/powerup-balance.spec.ts`

Expected: FAIL because the base choice count is still 3 and `main.ts` still computes a fourth-choice chance.

- [ ] **Step 3: Update roll tuning and roll source**

In `src/powerup-balance.ts`, set `baseChoiceCount` to `5` and remove `fourthChoiceBaseChance`, `fourthChoiceLuckChancePerRank`, and `fourthChoiceWorkbenchBonus`.

In `src/main.ts`, add this import:

```ts
import {
  workbenchLockedUpgrades,
  workbenchRollableUpgrades
} from './workbench-rolls'
```

Replace `openLevelUp` count logic with:

```ts
const count = workbenchBalance.baseChoiceCount
this.upgradeChoices = this.rollUpgrades(count, rare)
```

Replace normal roll availability with:

```ts
const available = workbenchRollableUpgrades(upgrades, this.build)
  .filter((u) => !choices.some((choice) => choice.kind === 'upgrade' && choice.upgrade.id === u.id))
```

Replace reroll fallbacks with `workbenchBalance.baseChoiceCount`.

In `src/mothership-progression.ts`, update the workbench tier copy for the old expanded bench tier so it no longer promises a fourth choice.

- [ ] **Step 4: Run balance test to verify it passes**

Run: `npm run test -- tests/powerup-balance.spec.ts`

Expected: PASS.

### Task 3: Workbench Install Surface Rendering

**Files:**
- Modify: `tests/artifacts-workbench.spec.ts`
- Modify: `src/main.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Write failing UI source tests**

Update the workbench test in `tests/artifacts-workbench.spec.ts` to expect a workbench-specific install surface:

```ts
test('shipboard workbench shows clickable offers before maxed and locked context', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("view.append(this.renderWorkbenchInstallSurface())")
  expect(main).toContain("offerGrid.className = 'manifest-grid workbench-offers'")
  expect(main).toContain("maxedGrid.className = 'manifest-grid workbench-maxed'")
  expect(main).toContain("lockedGrid.className = 'manifest-grid workbench-locked'")
  expect(main).toContain('workbenchLockedUpgrades(upgrades, this.build)')
  expect(main).toContain('this.beginWorkbenchInstall(choice, chip)')
  expect(main).not.toContain('button.disabled = !available')
  expect(css).toContain('.workbench-section-label')
  expect(css).toContain('.manifest-chip.maxed')
  expect(css).toContain('.manifest-chip.future')
})
```

- [ ] **Step 2: Run UI source tests to verify they fail**

Run: `npm run test -- tests/artifacts-workbench.spec.ts`

Expected: FAIL because `renderWorkbenchInstallSurface` and the new section classes do not exist yet.

- [ ] **Step 3: Implement workbench install renderer**

In `src/main.ts`, replace `view.append(this.renderBuildManifest('workbench'))` with:

```ts
view.append(this.renderWorkbenchInstallSurface())
```

Add helper methods near `renderBuildManifest`:

```ts
private renderManifestSummary() {
  const summary = document.createElement('div')
  summary.className = 'manifest-summary'
  const ownedCount = upgrades.filter((upgrade) => this.build[upgrade.id] > 0).length
  const maxedCount = upgrades.filter((upgrade) => this.build[upgrade.id] >= upgrade.max).length
  const limitCount = Object.values(this.limitBreaks).reduce((sum, value) => sum + value, 0)
  summary.innerHTML = `
    <div><b>${ownedCount}/${upgrades.length}</b><span>systems</span></div>
    <div><b>${maxedCount}</b><span>maxed</span></div>
    <div><b>${this.relics.size}/${relics.length}</b><span>relics</span></div>
    <div><b>${this.evolved.size}/${evolutions.length}</b><span>evolved</span></div>
    <div><b>${limitCount}</b><span>limits</span></div>
  `
  return summary
}

private renderWorkbenchInstallSurface() {
  const wrap = document.createElement('div')
  wrap.className = 'build-manifest workbench'
  const title = document.createElement('div')
  title.className = 'manifest-title'
  title.innerHTML = '<b>SHIP WORKBENCH</b><span>installable offers first // maxed and locked systems below</span>'
  const offerGrid = document.createElement('div')
  offerGrid.className = 'manifest-grid workbench-offers'
  for (const choice of this.upgradeChoices) offerGrid.append(this.renderWorkbenchChoiceChip(choice))
  wrap.append(title, this.renderManifestSummary(), this.workbenchSectionLabel('AVAILABLE SIGNALS'), offerGrid)

  const maxed = upgrades.filter((upgrade) => this.build[upgrade.id] >= upgrade.max)
  if (maxed.length) {
    const maxedGrid = document.createElement('div')
    maxedGrid.className = 'manifest-grid workbench-maxed'
    for (const upgrade of maxed) maxedGrid.append(this.renderWorkbenchContextChip(upgrade, 'MAXED', this.maxedUnlockText(upgrade)))
    wrap.append(this.workbenchSectionLabel('MAXED SYSTEMS'), maxedGrid)
  }

  const locked = workbenchLockedUpgrades(upgrades, this.build)
  if (locked.length) {
    const lockedGrid = document.createElement('div')
    lockedGrid.className = 'manifest-grid workbench-locked'
    for (const entry of locked) lockedGrid.append(this.renderWorkbenchContextChip(entry.upgrade, 'LOCKED', entry.requirement, 'future'))
    wrap.append(this.workbenchSectionLabel('LOCKED SYSTEMS'), lockedGrid)
  }

  wrap.append(this.renderManifestRelicLine())
  return wrap
}
```

Implement `renderWorkbenchChoiceChip`, `workbenchSectionLabel`, `renderWorkbenchContextChip`, `maxedUnlockText`, and `renderManifestRelicLine` by reusing the existing choice title/detail/category helpers and the current manifest chip markup. Offer chips must be buttons with `workbench-install-choice`; maxed and locked chips must be `div`s.

- [ ] **Step 4: Update CSS for offer, maxed, and locked sections**

Add section styles in `src/style.css`:

```css
.build-manifest.workbench .manifest-grid {
  grid-template-columns: 1fr;
}

.workbench-section-label {
  margin: 10px 0 6px;
  color: rgba(255, 242, 122, 0.82);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0;
}

.manifest-chip.future {
  border-color: rgba(87, 255, 243, 0.18);
  color: rgba(215, 255, 247, 0.44);
  background: rgba(215, 255, 247, 0.025);
}
```

Add `button.manifest-chip:focus-visible` to the existing focus-visible selector.

- [ ] **Step 5: Run UI source tests to verify they pass**

Run: `npm run test -- tests/artifacts-workbench.spec.ts`

Expected: PASS.

### Task 4: Docs And Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/upgrade-progression-design.md`
- Modify: `docs/game-balance-design.md`
- Modify: `docs/superpowers/specs/2026-05-19-ship-workbench-unlock-pool-design.md`

- [ ] **Step 1: Update progression docs**

Update workbench copy to say the workbench shows five clickable offers, maxed systems remain visible below, and locked systems appear below that as scroll context. Add the missing Static Arc to Ion Moons unlock to the spec doc.

- [ ] **Step 2: Regenerate generated balance docs**

Run: `npm run docs:balance`

Expected: README and `docs/game-balance-design.md` generated sections show `Workbench base choices | 5 |`.

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm run test -- tests/workbench-rolls.spec.ts tests/powerup-balance.spec.ts tests/artifacts-workbench.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Run full build**

Run: `npm run build`

Expected: TypeScript and Vite build successfully.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add src/workbench-rolls.ts src/powerup-balance.ts src/main.ts src/style.css src/mothership-progression.ts tests/workbench-rolls.spec.ts tests/powerup-balance.spec.ts tests/artifacts-workbench.spec.ts README.md docs/game-balance-design.md docs/upgrade-progression-design.md docs/superpowers/specs/2026-05-19-ship-workbench-unlock-pool-design.md docs/superpowers/plans/2026-05-19-ship-workbench-unlock-pool.md
git commit -m "Implement ship workbench unlock pool"
```
