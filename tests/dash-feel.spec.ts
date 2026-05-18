import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = () => readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

test('dash uses a short active burst instead of a one frame nudge', () => {
  const main = source()

  expect(main).toContain('dashTime: 0')
  expect(main).toContain('private dashDuration()')
  expect(main).toContain('private dashSpeed()')
  expect(main).toContain('this.player.dashTime = this.dashDuration()')
  expect(main).toContain('this.player.vx = this.player.dashX * this.player.dashSpeed')
})

test('phase rudder enables controlled dash ramming', () => {
  const main = source()

  expect(main).toContain("levels: ['+0.09s dash invulnerability', 'Dash ram shocks enemies'")
  expect(main).toContain('private tryDashRam(e: Enemy)')
  expect(main).toContain('this.player.dashTime <= 0 || this.build.phase <= 0')
  expect(main).toContain('if (this.tryDashRam(e)) continue')
})
