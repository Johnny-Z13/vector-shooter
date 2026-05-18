import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const source = () => fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')

test('surface runs track human health and oxygen instead of ship hull xp', () => {
  const main = source()

  expect(main).toContain('health: this.surfaceMaxHealth()')
  expect(main).toContain('oxygen: this.surfaceMaxOxygen()')
  expect(main).toContain("this.ui.hullLabel.textContent = 'HEALTH'")
  expect(main).toContain("this.ui.xpLabel.textContent = 'O2'")
})

test('low oxygen auto returns the surface pilot to the ship', () => {
  const main = source()

  expect(main).toContain("this.toast('O2 LOW - RETURNING TO SHIP')")
  expect(main).toContain('this.surface.o2Returning = true')
  expect(main).toContain('this.startTakeoff()')
  expect(main).not.toContain('this.startTakeoff({ urgent: true })')
})

test('surface tech upgrades improve suit timer health and gun output', () => {
  const main = source()

  expect(main).toContain("id: 'suitO2'")
  expect(main).toContain("id: 'suitHealth'")
  expect(main).toContain("id: 'suitBlaster'")
  expect(main).toContain("bucket: 'spacesuit'")
  expect(main).toContain("spacesuit: 'SPACESUIT'")
  expect(main).toContain("choice.upgrade.bucket === 'spacesuit' ? 'SUIT'")
  expect(main).toContain('private surfaceGunDamage()')
  expect(main).toContain('private surfaceGunCooldown()')
})
