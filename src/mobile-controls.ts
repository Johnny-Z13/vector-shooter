interface Vec {
  x: number
  y: number
}

export interface DashVectorInput {
  vx: number
  vy: number
  speed: number
  aimAngle: number
  move: Vec
  moveActive: boolean
}

export interface TouchActionInput {
  state: 'playing' | 'surface'
  planetNearby?: boolean
  returnBeaconAvailable?: boolean
  canPlanetLock?: boolean
  nearLore?: boolean
  nearAlien?: boolean
  nearShip?: boolean
}

const normalize = (x: number, y: number): Vec => {
  const length = Math.hypot(x, y)
  return length > 0.001 ? { x: x / length, y: y / length } : { x: 0, y: 0 }
}

export const dashVector = ({ vx, vy, speed, aimAngle, move, moveActive }: DashVectorInput): Vec => {
  if (speed > 18) return normalize(vx, vy)
  if (moveActive && Math.abs(move.x) + Math.abs(move.y) > 0.01) return normalize(move.x, move.y)
  return { x: Math.cos(aimAngle), y: Math.sin(aimAngle) }
}

export const touchActionLabel = (input: TouchActionInput) => {
  if (input.state === 'surface') {
    if (input.nearLore) return 'INSPECT'
    if (input.nearAlien) return 'TALK'
    if (input.nearShip) return 'BOARD'
    return null
  }
  if (input.planetNearby) return 'LAND'
  if (input.returnBeaconAvailable) return 'BEACON'
  if (input.canPlanetLock) return 'LOCK'
  return null
}
