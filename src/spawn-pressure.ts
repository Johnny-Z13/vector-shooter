interface Point {
  x: number
  y: number
}

interface PressurePackInput {
  nearbyEnemies: number
  targetNearbyEnemies: number
  maxPack: number
}

export const shouldRecycleEnemy = (enemy: Point, player: Point, recycleRadius: number) => {
  const dx = enemy.x - player.x
  const dy = enemy.y - player.y
  return dx * dx + dy * dy > recycleRadius * recycleRadius
}

export const pressurePackSize = ({ nearbyEnemies, targetNearbyEnemies, maxPack }: PressurePackInput) => (
  Math.max(0, Math.min(maxPack, targetNearbyEnemies - nearbyEnemies))
)
