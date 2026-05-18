import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { orderArtifactArchiveCards } from '../src/artifact-archive'
import { collectionCatalog, collectionCatalogById, collectionIconAtlasColumns, collectionIconAtlasRows } from '../src/collection-catalog'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')
const styles = () => readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

test('shipboard workbench keeps discoveries in the mothership collection', () => {
  const main = source()

  expect(main).not.toContain('type WorkbenchView')
  expect(main).not.toContain("artifactsTab.textContent = 'Artifacts'")
  expect(main).not.toContain('this.workbenchView')
  expect(main).toContain("this.mothershipConsoleTab('Collection'")
})

test('shipboard workbench uses one manifest surface for upgrade choices', () => {
  const main = source()
  const css = styles()

  expect(main).not.toContain("type WorkbenchView = 'upgrades' | 'manifest'")
  expect(main).not.toContain("upgradesTab.textContent = 'Upgrades'")
  expect(main).not.toContain("manifestTab.textContent = 'Manifest'")
  expect(main).toContain("view.append(this.renderBuildManifest('workbench'))")
  expect(main).toContain('private workbenchChoiceForUpgrade')
  expect(main).toContain('workbench-install-choice')
  expect(main).toContain('this.beginWorkbenchInstall(choice, chip)')
  expect(css).toContain('.manifest-chip.available')
  expect(css).toContain('.manifest-chip.selected')
})

test('mothership command integrates workbench manifest and collection tabs', () => {
  const main = source()
  const css = styles()

  expect(main).toContain('private renderMothershipConsoleStack()')
  expect(main).toContain("consolePanel.className = 'mothership-console-stack'")
  expect(main).toContain("type MothershipConsoleView = 'workbench' | 'manifest' | 'collection'")
  expect(main).toContain("type MothershipCollectionFilter = 'all' | 'found' | 'locked' | ArtifactKind")
  expect(main).toContain("this.mothershipConsoleTab('Collection'")
  expect(main).toContain('this.renderCollectionScreen()')
  expect(main).toContain('this.collectionCards()')
  expect(main).toContain('collectionCatalog.length')
  expect(main).toContain("const MOTHERSHIP_STORAGE_KEY = 'galactic_hordes_mothership_v2'")
  expect(main).not.toContain('private showMothershipConsole')
  expect(css).toContain('font-family: "Rajdhani", "Oxanium"')
  expect(css).toContain('.mothership-console-tab.active')
  expect(css).toContain('.collection-controls')
  expect(css).toContain('.collection-filter-panel')
  expect(css).toContain('.collection-filter-chip.active')
  expect(css).toContain('clip-path: polygon(0 0, calc(100% - 16px) 0')
})

test('mothership department upgrades preserve command scroll position', () => {
  const main = source()

  expect(main).toContain('private showMothership(options: { scrollTop?: number } = {})')
  expect(main).toContain("this.ui.title.querySelector<HTMLElement>('.mothership-command')?.scrollTop")
  expect(main).toContain('this.showMothership({ scrollTop })')
  expect(main).toContain('requestAnimationFrame(restoreScroll)')
})

test('artifacts track relics aliens lore and planet finds with generated icons', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("import collectionIconAtlasUrl from './assets/collection-icon-atlas.png'")
  expect(main).toContain('interface ArtifactRecord')
  expect(main).toContain('private artifacts = new Map<string, ArtifactRecord>()')
  expect(main).toContain('this.recordArtifact(')
  expect(main).toContain('private artifactIcon(')
  expect(main).toContain('private collectionIcon(')
  expect(css).toContain('.artifact-icon')
  expect(css).toContain('.artifact-grid')
  expect(css).toContain('.collection-icon-grid')
  expect(css).toContain('.collection-detail')
})

test('collection and artifact icons are constrained to square boxes', () => {
  const css = styles()

  expect(css).toContain('.collection-icon {')
  expect(css).toContain('aspect-ratio: 1 / 1')
  expect(css).toContain('background-origin: border-box')
  expect(css).toContain('.collection-detail-icon {')
  expect(css).toContain('.artifact-icon {')
})

test('collection catalog only contains real discoverable game records', () => {
  const iconSet = new Set(collectionCatalog.map((entry) => entry.icon))

  expect(collectionCatalog.length).toBeGreaterThan(30)
  expect(collectionCatalog.some((entry) => entry.id === 'enemy:space:chaser')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id === 'enemy:surface:oracle')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id === 'relic:staticIdol')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id.startsWith('locked:'))).toBe(false)
  expect(iconSet.size).toBe(collectionCatalog.length)
  expect(Math.max(...iconSet)).toBeLessThan(collectionIconAtlasColumns * collectionIconAtlasRows)
  expect(collectionCatalogById.size).toBe(collectionCatalog.length)
})

test('collection atlas has enough unique cells for every catalog entry', () => {
  const atlas = readFileSync(resolve(process.cwd(), 'src/assets/collection-icon-atlas.png'))
  expect(atlas.toString('ascii', 1, 4)).toBe('PNG')
  expect(atlas.readUInt32BE(16)).toBe(collectionIconAtlasColumns * 96)
  expect(atlas.readUInt32BE(20)).toBe(collectionIconAtlasRows * 96)
  expect(source()).toContain('collectionIconAtlasColumns')
  expect(source()).toContain('collectionIconAtlasRows')
  expect(source()).toContain('icon.style.backgroundSize')
})

test('collection screen supports Vampire Survivors style category filters and detail footer', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("this.collectionFilterButton('all')")
  expect(main).toContain("this.collectionFilterButton('enemy')")
  expect(main).toContain("this.collectionFilterButton('planet')")
  expect(main).toContain("if (this.mothershipCollectionFilter !== 'all')")
  expect(main).toContain('private collectionKindLabel')
  expect(main).toContain("selected.locked ? 'LOCKED' : 'DISCOVERED'")
  expect(css).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  expect(css).toContain('.collection-detail small')
})

test('collection screen uses canonical catalog icons for found records', () => {
  const main = source()

  expect(main).toContain('collectionCatalogById.get(record.id)')
  expect(main).toContain('icon: collectionEntry.icon')
  expect(main).toContain('icon: entry.icon')
  expect(main).toContain('color: entry.color')
})

test('artifact archive lists found cards before locked unknowns', () => {
  const ordered = orderArtifactArchiveCards([
    { locked: true, record: { title: 'Unknown Relic' } },
    { locked: false, record: { title: 'Found Cache' } },
    { locked: false, record: { title: 'Found Planet' } },
    { locked: true, record: { title: 'Missing Relic' } }
  ])

  expect(ordered.map((card) => card.record.title)).toEqual([
    'Found Cache',
    'Found Planet',
    'Unknown Relic',
    'Missing Relic'
  ])
})

test('desktop workbench uses one fixed scrollable manifest panel', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("panel.className = 'panel workbench-panel'")
  expect(main).toContain("view.className = 'workbench-view manifest'")
  expect(css).toContain('.workbench-panel')
  expect(css).toContain('height: min(760px, calc(100vh - 54px))')
  expect(css).toContain('.workbench-view')
  expect(css).toContain('overflow-y: auto')
  expect(css).toContain('.manifest-grid,')
  expect(css).toContain('.artifact-grid {')
  expect(css).toContain('max-height: none')
})

test('mothership console controls expose clear focus disabled and tab labels', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("button.setAttribute('aria-label', `${label}: ${meta}`)")
  expect(main).toContain("button.setAttribute('aria-pressed',")
  expect(css).toContain('.mothership-console-tab:focus-visible')
  expect(css).toContain('.collection-filter-chip:focus-visible')
  expect(css).toContain('.vector-button:disabled')
  expect(css).toContain('background: linear-gradient(135deg, rgba(255, 242, 122, 0.2)')
})
