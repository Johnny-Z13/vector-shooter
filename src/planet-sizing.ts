export const PLANET_RADIUS_MIN = 130
export const PLANET_RADIUS_MAX = PLANET_RADIUS_MIN * 1.25

export const planetRadius = (random: () => number) => (
  PLANET_RADIUS_MIN + random() * (PLANET_RADIUS_MAX - PLANET_RADIUS_MIN)
)
