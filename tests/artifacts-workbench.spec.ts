import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { orderArtifactArchiveCards } from '../src/artifact-archive'
import { collectionCatalog } from '../src/collection-catalog'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')
const styles = () => readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

test('workbench exposes an artifacts collection tab', () => {
  const main = source()

  expect(main).toContain("type WorkbenchView = 'upgrades' | 'manifest' | 'artifacts'")
  expect(main).toContain("artifactsTab.textContent = 'Artifacts'")
  expect(main).toContain('this.renderArtifactsCollection()')
})

test('mothership command integrates workbench manifest and collection tabs', () => {
  const main = source()
  const css = styles()

  expect(main).toContain('private renderMothershipConsoleStack()')
  expect(main).toContain("consolePanel.className = 'mothership-console-stack'")
  expect(main).toContain("type MothershipConsoleView = 'workbench' | 'manifest' | 'collection'")
  expect(main).toContain("type MothershipCollectionFilter = 'default' | 'found' | 'locked'")
  expect(main).toContain("this.mothershipConsoleTab('Collection'")
  expect(main).toContain('this.renderCollectionScreen()')
  expect(main).toContain('this.collectionCards()')
  expect(main).toContain('collectionCatalog.length')
  expect(main).toContain("const MOTHERSHIP_STORAGE_KEY = 'galactic_hordes_mothership_v2'")
  expect(main).not.toContain('private showMothershipConsole')
  expect(css).toContain('font-family: "Rajdhani", "Oxanium"')
  expect(css).toContain('.mothership-console-tab.active')
  expect(css).toContain('.collection-controls')
  expect(css).toContain('.collection-control.filter')
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

test('collection catalog only contains real discoverable game records', () => {
  expect(collectionCatalog.length).toBeGreaterThan(30)
  expect(collectionCatalog.some((entry) => entry.id === 'enemy:space:chaser')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id === 'enemy:surface:oracle')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id === 'relic:staticIdol')).toBe(true)
  expect(collectionCatalog.some((entry) => entry.id.startsWith('locked:'))).toBe(false)
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

test('desktop workbench uses one fixed scrollable list panel across tabs', () => {
  const main = source()
  const css = styles()

  expect(main).toContain("panel.className = 'panel workbench-panel'")
  expect(main).toContain("grid.className = 'choice-grid workbench-list'")
  expect(css).toContain('.workbench-panel')
  expect(css).toContain('height: min(760px, calc(100vh - 54px))')
  expect(css).toContain('.workbench-view')
  expect(css).toContain('overflow-y: auto')
  expect(css).toContain('.choice-grid.workbench-list')
  expect(css).toContain('.manifest-grid,')
  expect(css).toContain('.artifact-grid {')
  expect(css).toContain('max-height: none')
})
