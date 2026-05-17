import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { orderArtifactArchiveCards } from '../src/artifact-archive'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')
const styles = () => readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')

test('workbench exposes an artifacts collection tab', () => {
  const main = source()

  expect(main).toContain("type WorkbenchView = 'upgrades' | 'manifest' | 'artifacts'")
  expect(main).toContain("artifactsTab.textContent = 'Artifacts'")
  expect(main).toContain('this.renderArtifactsCollection()')
})

test('artifacts track relics aliens lore and planet finds with generated icons', () => {
  const main = source()
  const css = styles()

  expect(main).toContain('interface ArtifactRecord')
  expect(main).toContain('private artifacts = new Map<string, ArtifactRecord>()')
  expect(main).toContain('this.recordArtifact(')
  expect(main).toContain('private artifactIcon(')
  expect(css).toContain('.artifact-icon')
  expect(css).toContain('.artifact-grid')
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
