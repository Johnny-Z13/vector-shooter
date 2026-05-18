import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

test('balance documentation generator is wired into package scripts and git hook', () => {
  const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  expect(pkg.scripts['docs:balance']).toBe('node scripts/update-balance-docs.mjs')
  expect(pkg.scripts['hooks:install']).toBe('git config core.hooksPath .githooks')
  expect(read('.githooks/pre-commit')).toContain('npm run docs:balance')
})

test('README and balance design doc contain generated balance sections', () => {
  for (const path of ['README.md', 'docs/game-balance-design.md']) {
    const doc = read(path)

    expect(doc).toContain('<!-- BALANCE-GENERATED:START -->')
    expect(doc).toContain('<!-- BALANCE-GENERATED:END -->')
    expect(doc).toContain('Active balance mode')
    expect(doc).toContain('| Enemy | HP | Speed | Contact |')
  }
})
