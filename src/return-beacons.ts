export interface ReturnBeaconEligibilityInput {
  time: number
  planetsVisited: number
  activeBeacon: boolean
  nextBeaconAt: number
}

export interface ReturnBeaconAutopilotInput {
  dx: number
  dy: number
  vx: number
  vy: number
  radius: number
}

export const FIRST_BEACON_TIME = 240
export const BEACON_INTERVAL = 210
export const BEACON_HOLD_SECONDS = 3.2

export const returnBeaconEligible = (input: ReturnBeaconEligibilityInput) => {
  if (input.activeBeacon) return false
  if (input.planetsVisited < 1) return false
  if (input.time < FIRST_BEACON_TIME) return false
  if (input.nextBeaconAt > 0 && input.time < input.nextBeaconAt) return false
  return true
}

export const nextBeaconWindow = (currentTime: number) => currentTime + BEACON_INTERVAL

export const beaconExtractionBonus = (skippedBeacons: number) => (
  1 + Math.min(0.3, Math.max(0, skippedBeacons) * 0.1)
)

export const beaconSpawnDistance = (skippedBeacons: number) => (
  640 + Math.min(360, Math.max(0, skippedBeacons) * 90)
)

export const returnBeaconAutopilotVector = ({ dx, dy, vx, vy, radius }: ReturnBeaconAutopilotInput) => {
  const distance = Math.hypot(dx, dy)
  const speed = Math.hypot(vx, vy)
  if (distance < radius * 0.78) {
    if (speed <= 6) return { x: 0, y: 0 }
    return { x: -vx / speed, y: -vy / speed }
  }
  if (distance < radius * 1.22 && speed > 36) {
    const towardX = distance > 1 ? dx / distance : 0
    const towardY = distance > 1 ? dy / distance : 0
    const closingSpeed = vx * towardX + vy * towardY
    if (closingSpeed > 18) return { x: -vx / speed, y: -vy / speed }
  }
  if (distance <= 1) return { x: 0, y: 0 }
  return { x: dx / distance, y: dy / distance }
}
