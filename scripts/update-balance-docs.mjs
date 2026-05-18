import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const write = (path, text) => writeFileSync(resolve(root, path), text)

const balance = read('src/game-balance.ts')
const activeMode = balance.match(/export const GAME_BALANCE_MODE = '([^']+)'/)?.[1] ?? 'unknown'
const profileBlock = balance.match(new RegExp(`${activeMode}: \\{([\\s\\S]*?)\\n  \\}`))?.[1] ?? ''
const label = profileBlock.match(/label: '([^']+)'/)?.[1] ?? activeMode
const multiplier = (name) => profileBlock.match(new RegExp(`${name}: ([0-9.]+)`))?.[1] ?? ''

const enemyRows = [...balance.matchAll(/^\s+(\w+): \{ hp: ([0-9.]+), radius: ([0-9.]+), speed: ([0-9.]+), value: ([0-9.]+), color: '[^']+', contactDamage: ([0-9.]+), timeGateSeconds: ([0-9.]+), spawnRollCeiling: ([0-9.]+)/gm)]
  .map((match) => `| ${match[1]} | ${match[2]} | ${match[4]} | ${match[6]} | ${match[7]}s | ${match[8]} |`)
  .join('\n')

const generated = `### Active Balance Snapshot

Active balance mode: \`${activeMode}\` (${label}).

| Multiplier | Value |
| --- | ---: |
| Enemy HP | ${multiplier('enemyHpMultiplier')} |
| Enemy damage | ${multiplier('enemyDamageMultiplier')} |
| Enemy speed | ${multiplier('enemySpeedMultiplier')} |
| Enemy projectile speed | ${multiplier('enemyProjectileSpeedMultiplier')} |
| Enemy attack cooldown | ${multiplier('enemyAttackCooldownMultiplier')} |
| Spawn rate | ${multiplier('spawnRateMultiplier')} |
| Boss rate | ${multiplier('bossRateMultiplier')} |
| Surface HP | ${multiplier('surfaceEnemyHpMultiplier')} |
| Surface damage | ${multiplier('surfaceEnemyDamageMultiplier')} |
| Surface speed | ${multiplier('surfaceEnemySpeedMultiplier')} |

| Enemy | HP | Speed | Contact | Time Gate | Spawn Roll |
| --- | ---: | ---: | ---: | ---: | ---: |
${enemyRows}

Generated from \`src/game-balance.ts\`. Do not edit this section by hand.`

const replaceGeneratedSection = (path) => {
  const start = '<!-- BALANCE-GENERATED:START -->'
  const end = '<!-- BALANCE-GENERATED:END -->'
  const doc = read(path)
  if (!doc.includes(start) || !doc.includes(end)) throw new Error(`${path} is missing balance generated markers`)
  const next = doc.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${generated}\n${end}`)
  if (next !== doc) write(path, next)
}

replaceGeneratedSection('README.md')
replaceGeneratedSection('docs/game-balance-design.md')
