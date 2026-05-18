export type UpgradeCategory = 'weapon' | 'system'
export type UpgradeBucket = 'weapons' | 'navigation' | 'survival' | 'economy' | 'planetcraft' | 'spacesuit' | 'control'
export type RelicId = 'staticIdol' | 'glassReactor' | 'deadSunCoin' | 'hungryCompass' | 'blackBoxSaint' | 'mirrorSeed' | 'saintCapacitor' | 'forbiddenMap'
export type LimitId = 'might' | 'cooldown' | 'amount' | 'speed' | 'magnet' | 'hull'
export type UpgradeId =
  | 'rapid'
  | 'split'
  | 'pierce'
  | 'mine'
  | 'chain'
  | 'rift'
  | 'engine'
  | 'nav'
  | 'magnet'
  | 'shield'
  | 'repair'
  | 'orbit'
  | 'rail'
  | 'echo'
  | 'vampire'
  | 'survey'
  | 'luck'
  | 'cargo'
  | 'heat'
  | 'phase'
  | 'suitO2'
  | 'suitHealth'
  | 'suitBlaster'

export interface Upgrade {
  id: UpgradeId
  name: string
  category: UpgradeCategory
  bucket: UpgradeBucket
  description: string
  max: number
  rarity: number
  levels: string[]
  catalyst?: RelicId
  evolutionName?: string
  evolutionDescription?: string
}

export interface Relic {
  id: RelicId
  name: string
  description: string
  rarity: number
  downside?: string
}

export interface Evolution {
  weapon: UpgradeId
  relic: RelicId
  name: string
  description: string
}

export const powerupBalance = {
  ship: {
    glassReactorShieldRegenMultiplier: 0.7,
    shieldBaseRegenPerSecond: 4,
    shieldRegenPerRank: 3,
    accelerationBase: 1680,
    accelerationPerEngineRank: 210,
    accelerationPerNavRank: 82,
    maxSpeedPerEngineRank: 36,
    maxSpeedPerNavRank: 18,
    surfaceAcceleration: 1080,
    surfaceReturnAcceleration: 1360,
    surfaceMaxSpeedBase: 178,
    surfaceMaxSpeedPerEngineRank: 10,
    navPickupReachBase: 760,
    navPickupReachPerNavRank: 90,
    navPickupReachPerMagnetRank: 26,
    navPickupMinScoreDistance: 120
  },
  dash: {
    durationBase: 0.14,
    durationPerEngineRank: 0.014,
    durationPerPhaseRank: 0.004,
    durationMax: 0.24,
    speedBase: 760,
    speedPerEngineRank: 34,
    speedPerPhaseRank: 18,
    cooldownBase: 1.15,
    cooldownMin: 0.48,
    cooldownReductionPerEngineRank: 0.12,
    cooldownReductionPerHeatRank: 0.025,
    invulnerabilityBase: 0.22,
    engineInvulnerabilityThreshold: 5,
    engineInvulnerabilityBonus: 0.08,
    invulnerabilityPerPhaseRank: 0.09,
    ramForceBase: 260,
    ramForcePerPhaseRank: 70,
    ramDamageBase: 16,
    ramDamagePerPhaseRank: 9,
    ramDamagePerEngineRank: 1.5
  },
  weapon: {
    baseFireCooldown: 0.234,
    minFireCooldown: 0.055,
    rapidCooldownPerRank: 0.014,
    heatCooldownPerRank: 0.006,
    limitCooldownPerRank: 0.004,
    choirCooldownMultiplier: 0.88,
    baseDamage: 14,
    damagePerLevel: 0.65,
    railDamagePerRank: 2,
    riftDamagePerRank: 2,
    limitMightDamagePerRank: 1.6,
    baseProjectileSpeed: 780,
    echoProjectileSpeedPerRank: 55,
    heatProjectileSpeedPerRank: 18,
    limitSpeedProjectileSpeedPerRank: 14,
    shatterExtraRays: 2,
    limitAmountRanksPerExtraRay: 3,
    spreadBase: 0.12,
    spreadPerRay: 0.035,
    spreadMax: 0.31,
    volleyOffset: 0.055,
    railBaseInterval: 8,
    solarRailBaseInterval: 6,
    railMinimumInterval: 3,
    needleBaseInterval: 12,
    blackNeedleBaseInterval: 9,
    needleMinimumInterval: 4,
    railBaseLife: 0.86,
    solarRailLifeBonus: 0.28,
    pulseBaseLife: 0.62,
    echoLifePerRank: 0.13,
    resonanceLifeBonus: 0.24,
    solarRailDamageMultiplier: 3.4,
    railDamageMultiplier: 2.4,
    shatterSideRayDamageMultiplier: 0.82,
    railPierceBase: 7,
    solarRailPierceBonus: 5,
    resonancePierceBonus: 1,
    stormChainBonus: 3,
    needleSpeedMultiplier: 0.62,
    needleLife: 1.1,
    blackNeedleDamageMultiplier: 5.2,
    needleDamageMultiplier: 3.4,
    blackNeedleRadius: 9,
    needleRadius: 6,
    needlePierceBase: 4,
    blackNeedlePierceBonus: 8,
    stormNeedleChainBonus: 2
  },
  mineWake: {
    maxMines: 6,
    baseMines: 1,
    ranksPerExtraMine: 2,
    evolvedMineBonus: 2,
    backOffsetBase: 28,
    backOffsetStep: 8,
    sideOffsetStep: 18,
    driftSpeed: 24,
    lifeBase: 1.25,
    lifePerRank: 0.22,
    evolvedLifeBonus: 0.55,
    damageBase: 20,
    damagePerRank: 7,
    limitMightDamagePerRank: 1.5,
    radius: 13,
    evolvedRadius: 18,
    pierce: 2,
    evolvedPierce: 5
  },
  chain: {
    rangeBase: 220,
    rangePerRank: 26
  },
  orbit: {
    radiusBase: 66,
    radiusPerRank: 8,
    damageBase: 18,
    damagePerRank: 5,
    limitMightDamagePerRank: 1.4,
    gravityDamageMultiplier: 1.35,
    gravityPullRadiusBonus: 90,
    gravityPullForce: 28
  },
  upgradeApply: {
    engineSpeedPerRank: 18,
    shieldCapacityPerRank: 18,
    repairHullPerRank: 18,
    magnetInstallScore: 60,
    phaseShipDamageReductionPerRank: 0.08,
    phaseSurfaceDamageReductionPerRank: 0.05,
    vampireRepairDropBaseChance: 0.03,
    vampireRepairDropChancePerRank: 0.025,
    vampireRepairDropValue: 14,
    magnetDropBaseChance: 0.008,
    magnetDropChancePerSecond: 0.00002,
    magnetDropValue: 1,
    cargoResourceBonusPerRank: 0.15,
    cargoCacheScoreBonusPerRank: 0.06,
    cargoCoreBonusThreshold: 2,
    cargoCoreBonus: 1,
    suitRepairBonusPerRank: 0.15,
    loreSignalBaseChance: 0.18,
    loreSignalSurveyChancePerRank: 0.04,
    alienGiftLuckPerRank: 0.04,
    alienGiftSurveyPerRank: 0.025,
    alienGiftGoodBaseChance: 0.62,
    alienIdolRelicBaseChance: 0.45,
    alienIdolRelicLuckChancePerRank: 0.04
  },
  surface: {
    baseGunDamage: 18,
    gunDamagePerBlasterRank: 4,
    baseGunCooldown: 0.22,
    gunCooldownPerBlasterRank: 0.014,
    minGunCooldown: 0.14,
    baseGunSpeed: 540,
    gunSpeedPerBlasterRank: 40,
    baseHealth: 86,
    healthPerSuitRank: 18,
    baseOxygen: 42,
    oxygenPerSuitRank: 14,
    lowOxygenSuitThreshold: 3,
    lowOxygenRatioBase: 0.18,
    lowOxygenRatioUpgraded: 0.12
  },
  planetCache: {
    luckRelicChancePerRank: 0.06,
    surveyRelicChancePerRank: 0.035,
    scoreBase: 450,
    scorePerLevel: 45,
    scrapMin: 10,
    scrapMax: 24,
    crystalMin: 3,
    crystalMax: 9,
    coresBase: 1,
    relicChanceBase: 0.18,
    extraSignalChanceBase: 0.38,
    ambushChanceMin: 0.08,
    ambushChanceBase: 0.28,
    ambushChanceReductionPerSurveyRank: 0.04,
    staticIdolAmbushChancePenalty: 0.06
  }
} as const

export const pickupBalance = {
  xp: {
    radius: 5.6,
    mergeRadiusStep: 0.45,
    mergeRadiusMax: 12.6,
    outerHalo: 9.8,
    mergeDistance: 120,
    lifeSeconds: 42
  },
  defaultRadius: 8,
  chestRadius: 16,
  persistentLifeSeconds: 999,
  scatterSpeedMin: 80,
  scatterSpeedMax: 220
} as const

export const workbenchBalance = {
  baseChoiceCount: 3,
  fourthChoiceBaseChance: 0.08,
  fourthChoiceLuckChancePerRank: 0.08,
  fourthChoiceWorkbenchBonus: 0.08,
  evolutionChanceBase: 0.55,
  evolutionChanceLuckPerRank: 0.06,
  relicChanceBase: 0.04,
  relicChanceRare: 0.2,
  relicChanceLuckPerRank: 0.025,
  relicChanceSurveyPerRank: 0.018,
  ownedBiasBase: 1.55,
  ownedBiasLuckPerRank: 0.08,
  ownedBiasWorkbenchBonus: 0.2,
  weaponFocusWeight: 1.08,
  rareUpgradeWeightMultiplier: 0.72,
  rareUpgradeRarityThreshold: 60,
  rareInstallRarityThreshold: 65,
  installDelaySeconds: 0.56,
  rareInstallDelaySeconds: 0.76,
  recycleScrapBase: 70,
  recycleScrapPerLevel: 8,
  recycleCrystalBase: 4,
  recycleCrystalPerPlanet: 2
} as const

export const limitBreakChoices: Array<{ id: LimitId; name: string; description: string }> = [
  { id: 'might', name: 'Limit: Might', description: '+3% weapon damage. Stacks forever.' },
  { id: 'cooldown', name: 'Limit: Cooldown', description: '-0.4% weapon cooldown. Stacks forever.' },
  { id: 'amount', name: 'Limit: Amount', description: 'Every third rank adds another prism ray.' },
  { id: 'speed', name: 'Limit: Velocity', description: '+2% projectile speed. Stacks forever.' },
  { id: 'magnet', name: 'Limit: Magnet', description: '+4% pickup reach. Stacks forever.' },
  { id: 'hull', name: 'Limit: Hull', description: '+3 max hull and a small repair.' }
]

export const upgrades: Upgrade[] = [
  { id: 'rapid', name: 'Pulse Cannon', category: 'weapon', bucket: 'weapons', description: 'The main damage bucket: faster pulse rhythm, harder hits, and double-pulse pressure.', max: 8, rarity: 100, catalyst: 'staticIdol', evolutionName: 'Choir Cannon', evolutionDescription: 'Pulse fire becomes a three-note volley with a brighter synth chord.', levels: ['Base pulse stabilizer', '-8% fire cooldown', '+12% pulse damage', '-8% fire cooldown', 'Every fifth shot double-pulses', '+15% projectile speed', '-10% fire cooldown', 'Evolution-ready'] },
  { id: 'split', name: 'Prism Barrel', category: 'weapon', bucket: 'weapons', description: 'The screen-control bucket: more rays, a wider fan, and better crowd trimming.', max: 6, rarity: 86, catalyst: 'glassReactor', evolutionName: 'Shatter Prism', evolutionDescription: 'The fan gains two extra rays and cracks through nearby targets.', levels: ['+1 side ray', 'Tighter fan control', '+1 side ray', '+10% ray damage', '+1 side ray', 'Evolution-ready'] },
  { id: 'pierce', name: 'Ghost Rounds', category: 'weapon', bucket: 'weapons', description: 'The horde-cutting bucket: pulses travel through bodies instead of dying early.', max: 5, rarity: 80, levels: ['+1 pierce', '+1 pierce', '+10% pulse damage', '+1 pierce', '+2 pierce'] },
  { id: 'rail', name: 'Rail Lattice', category: 'weapon', bucket: 'weapons', description: 'The elite-delete bucket: regular fire is interrupted by huge piercing lances.', max: 6, rarity: 62, catalyst: 'deadSunCoin', evolutionName: 'Solar Lance', evolutionDescription: 'Rail shots become screen-splitting sun lances with heavy pierce.', levels: ['Every 8th shot rails', '+15% rail damage', 'Every 7th shot rails', '+2 rail pierce', 'Every 6th shot rails', 'Evolution-ready'] },
  { id: 'echo', name: 'Echo Chamber', category: 'weapon', bucket: 'weapons', description: 'The projectile-quality bucket: longer life, more speed, and resonant wake damage.', max: 5, rarity: 70, catalyst: 'blackBoxSaint', evolutionName: 'Resonance Wake', evolutionDescription: 'Shots leave damaging vector trails after passing through enemies.', levels: ['+18% bullet lifetime', '+8% projectile speed', '+18% bullet lifetime', '+12% echo damage', 'Evolution-ready'] },
  { id: 'orbit', name: 'Ion Moons', category: 'weapon', bucket: 'weapons', description: 'The close-defense bucket: orbitals punish anything that crowds the hull.', max: 6, rarity: 72, catalyst: 'hungryCompass', evolutionName: 'Gravity Halo', evolutionDescription: 'Orbitals pull enemies inward before cutting them apart.', levels: ['+1 orbital', '+10% orbital radius', '+1 orbital', '+15% orbital damage', '+1 orbital', 'Evolution-ready'] },
  { id: 'mine', name: 'Mine Wake', category: 'weapon', bucket: 'control', description: 'The dash-control bucket: movement leaves traps and turns escapes into damage.', max: 5, rarity: 55, catalyst: 'forbiddenMap', evolutionName: 'Comet Net', evolutionDescription: 'Dash mines link into explosive constellations.', levels: ['Dash drops 2 mines', '+20% mine damage', '+1 mine', 'Mines last longer', 'Evolution-ready'] },
  { id: 'chain', name: 'Static Arc', category: 'weapon', bucket: 'weapons', description: 'The chain-reaction bucket: pulse impacts jump through tight packs.', max: 5, rarity: 50, catalyst: 'saintCapacitor', evolutionName: 'Storm Liturgy', evolutionDescription: 'Chain lightning erupts from pulse impacts and surface pistol shots.', levels: ['+1 chain hop', '+10% arc damage', '+1 chain hop', '+1 chain hop', 'Evolution-ready'] },
  { id: 'rift', name: 'Rift Needle', category: 'weapon', bucket: 'weapons', description: 'The boss-hunter bucket: rare heavy needles punch through elite targets.', max: 5, rarity: 45, catalyst: 'mirrorSeed', evolutionName: 'Black Needle', evolutionDescription: 'Rare needles execute wounded elites and bosses.', levels: ['Every 11th shot fires a needle', '+18% needle damage', 'Every 9th shot fires a needle', '+2 needle pierce', 'Evolution-ready'] },
  { id: 'engine', name: 'Drift Engine', category: 'system', bucket: 'navigation', description: 'The manual handling bucket: more speed, longer dash burns, sharper recovery, shorter dash cooldown.', max: 6, rarity: 95, levels: ['+18 move speed', 'Dash carries farther', '-8% dash cooldown', '+18 move speed', '+0.08s dash invulnerability', '+22 move speed'] },
  { id: 'nav', name: 'Nav Ghost', category: 'system', bucket: 'navigation', description: 'The low-input autonomy bucket: base cruise gets faster, smarter, and better at holding intent.', max: 7, rarity: 82, levels: ['Vector Memory: stronger course hold and faster cruise', 'Course Bend: nudges have more authority', 'Planet Lock: USE locks onto the nearest planet beacon', 'Threat Weave: autopilot curves away from nearby enemies', 'Salvage Bias: idle cruise bends toward valuable drops', 'Overdrive Nav: faster cruise and sharper heading changes', 'Ghost Pilot: stronger autonomous steering when your thumb lifts'] },
  { id: 'magnet', name: 'Signal Magnet', category: 'system', bucket: 'economy', description: 'The collection bucket: fewer missed shards, richer routes, more numbers vacuumed in.', max: 6, rarity: 92, levels: ['+62 pickup range', '+12% pickup speed', '+62 pickup range', '+12% pickup speed', '+72 pickup range', 'Vacuum pings last longer'] },
  { id: 'shield', name: 'Halo Battery', category: 'system', bucket: 'survival', description: 'The mistake-forgiveness bucket: a regenerating buffer before hull damage matters.', max: 5, rarity: 78, levels: ['+18 max shield', '+20% shield regen', '+18 max shield', '-12% recharge delay', '+28 max shield'] },
  { id: 'repair', name: 'Hull Stitcher', category: 'system', bucket: 'survival', description: 'The long-run hull bucket: bigger maximum hull and full repairs on install.', max: 5, rarity: 78, levels: ['+18 max hull and full repair', '+12% repair value', '+18 max hull and full repair', '+12% repair value', '+26 max hull and full repair'] },
  { id: 'vampire', name: 'Salvage Hunger', category: 'system', bucket: 'survival', description: 'The sustain bucket: enemy wreckage can become emergency repair.', max: 4, rarity: 52, levels: ['+2.5% repair drop chance', '+2.5% repair drop chance', 'Repair drops pull faster', '+3.5% repair drop chance'] },
  { id: 'survey', name: 'Survey Array', category: 'system', bucket: 'planetcraft', description: 'The planet-reading bucket: clearer cache rumors, safer mystery boxes, better relic odds.', max: 4, rarity: 58, levels: ['Planet cache rumors improve', '+8% relic discovery', '-10% ambush chance', 'Hidden cache pings appear more often'] },
  { id: 'luck', name: 'Luck Coil', category: 'system', bucket: 'economy', description: 'The jackpot bucket: more fourth choices, rarer rolls, and better mystery outcomes.', max: 5, rarity: 54, levels: ['+10% rare roll pressure', '+8% fourth choice chance', '+10% relic chance', '+8% fourth choice chance', 'Cache jackpots become more likely'] },
  { id: 'cargo', name: 'Cargo Spine', category: 'system', bucket: 'economy', description: 'The planet-profit bucket: surface salvage pays out more resources and score.', max: 4, rarity: 66, levels: ['+15% planet resources', '+1 core from first cache', '+15% planet resources', '+25% cache score'] },
  { id: 'heat', name: 'Heat Sink', category: 'system', bucket: 'control', description: 'The weapon-tempo bucket: high fire-rate builds stay fast and stable.', max: 4, rarity: 62, levels: ['-3% weapon cooldown', '+8% projectile speed', '-3% weapon cooldown', 'Rail and needle shots cool faster'] },
  { id: 'phase', name: 'Phase Rudder', category: 'system', bucket: 'control', description: 'The panic-button bucket: safer dashes, brief ram damage, softer collisions, stronger escape shockwaves.', max: 4, rarity: 58, levels: ['+0.09s dash invulnerability', 'Dash ram shocks enemies', '+0.09s dash invulnerability', 'Dash shockwave knocks enemies back harder'] },
  { id: 'suitO2', name: 'Exo-Lung', category: 'system', bucket: 'spacesuit', description: 'The surface timer bucket: longer oxygen reserves for planet runs.', max: 5, rarity: 64, levels: ['+14s max O2', '+12s max O2', 'Low-O2 return starts later', '+14s max O2', '+18s max O2'] },
  { id: 'suitHealth', name: 'Skinweave Suit', category: 'system', bucket: 'spacesuit', description: 'The human survival bucket: more surface health and better field repairs.', max: 4, rarity: 66, levels: ['+18 max human health', '+15% surface repair', '+18 max human health', '+24 max human health'] },
  { id: 'suitBlaster', name: 'Field Blaster', category: 'weapon', bucket: 'spacesuit', description: 'The human weapon bucket: surface pistol shots hit harder and cycle faster.', max: 5, rarity: 58, levels: ['+4 surface gun damage', '-6% surface gun cooldown', '+4 surface gun damage', '+40 surface shot speed', '-8% surface gun cooldown'] }
]

export const relics: Relic[] = [
  { id: 'staticIdol', name: 'Static Idol', rarity: 42, description: 'Pulse weapons arc with little religious sparks.', downside: 'Planet ambush odds rise slightly.' },
  { id: 'glassReactor', name: 'Glass Reactor', rarity: 38, description: 'A dangerous lens that turns spread fire into cutting light.', downside: 'Shield recharge delay is longer.' },
  { id: 'deadSunCoin', name: 'Dead Sun Coin', rarity: 34, description: 'Boss caches become richer and rail weapons wake up.', downside: 'Hunters hear you after takeoff.' },
  { id: 'hungryCompass', name: 'Hungry Compass', rarity: 42, description: 'The map pulls loot, enemies, and fate toward the ship.', downside: 'Enemy steering gets a little more aggressive.' },
  { id: 'blackBoxSaint', name: 'Black Box Saint', rarity: 30, description: 'Every cache sounds like it remembers another run.', downside: 'Caches sometimes summon stranger surface threats.' },
  { id: 'mirrorSeed', name: 'Mirror Seed', rarity: 30, description: 'Rerolls bend toward impossible needles and second chances.', downside: 'Cursed offers become more common.' },
  { id: 'saintCapacitor', name: 'Saint Capacitor', rarity: 36, description: 'Stores a planet pulse for lightning-heavy builds.', downside: 'Mining pulse cooldown is longer.' },
  { id: 'forbiddenMap', name: 'Forbidden Map', rarity: 26, description: 'Reveals hidden cache logic and mine constellations.', downside: 'Elite patrols track your signal.' }
]

export const evolutions: Evolution[] = upgrades
  .filter((upgrade) => upgrade.catalyst && upgrade.evolutionName && upgrade.evolutionDescription)
  .map((upgrade) => ({
    weapon: upgrade.id,
    relic: upgrade.catalyst!,
    name: upgrade.evolutionName!,
    description: upgrade.evolutionDescription!
  }))
