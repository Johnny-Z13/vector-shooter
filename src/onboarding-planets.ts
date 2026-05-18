export const ONBOARDING_PLANET_COUNT = 5
export const ONBOARDING_PLANET_MIN_CENTER_DISTANCE = 650

export const useOnboardingPlanetField = (chunkX: number, chunkY: number, visitedPlanets: number) => (
  chunkX === 0 && chunkY === 0 && visitedPlanets === 0
)

export const onboardingPlanetSlot = (index: number) => {
  const slots = [
    { x: 220, y: -130 },
    { x: -430, y: 170 },
    { x: 820, y: 220 },
    { x: -900, y: -300 },
    { x: 80, y: 760 }
  ]
  return slots[index % slots.length]
}
