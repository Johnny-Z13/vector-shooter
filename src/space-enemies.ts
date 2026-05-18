import { spaceEnemyBalance, type SpaceEnemyKind } from './game-balance'

export type { SpaceEnemyKind } from './game-balance'

interface PlayerMotion {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
}

export interface Point {
  x: number
  y: number
}

export const spriteEnemyKinds = ['razor', 'skimmer', 'bulwark'] as const

export const spaceEnemyDefinitions = spaceEnemyBalance

export const isSpriteEnemyKind = (kind: SpaceEnemyKind): kind is (typeof spriteEnemyKinds)[number] => {
  return spriteEnemyKinds.includes(kind as (typeof spriteEnemyKinds)[number])
}

export const isForwardAmbushEnemy = (kind: SpaceEnemyKind) => spaceEnemyDefinitions[kind].forwardAmbush

export const spaceEnemySpawnPoint = (
  kind: SpaceEnemyKind,
  player: PlayerMotion,
  minR: number,
  maxR: number,
  random: () => number = Math.random
): Point => {
  if (!isForwardAmbushEnemy(kind)) {
    const a = random() * Math.PI * 2
    const r = minR + (maxR - minR) * random()
    return {
      x: player.x + Math.cos(a) * r,
      y: player.y + Math.sin(a) * r
    }
  }

  const travelSpeed = Math.hypot(player.vx, player.vy)
  const angle = travelSpeed > 24 ? Math.atan2(player.vy, player.vx) : player.angle
  const forward = minR + (maxR - minR) * random()
  const side = (random() * 2 - 1) * Math.min(300, forward * 0.38)
  const fx = Math.cos(angle)
  const fy = Math.sin(angle)

  return {
    x: player.x + fx * forward - fy * side,
    y: player.y + fy * forward + fx * side
  }
}
