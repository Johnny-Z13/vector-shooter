import './style.css'
import glassMiteOracleSheetUrl from './assets/glass-mite-oracle-sheet-alpha.png'
import planetAlienCatalogUrl from './assets/planet-alien-catalog-alpha.png'
import planetBossCatalogUrl from './assets/planet-boss-catalog-alpha.png'
import spaceEnemyCatalogUrl from './assets/space-enemy-catalog-alpha.png'
import surfaceSpacemanSheetUrl from './assets/surface-spaceman-sheet-alpha.png'
import titleLogoMarkUrl from './assets/title-logo-mark.png'
import { orderArtifactArchiveCards } from './artifact-archive'
import { navigationCruiseScalar, navigationTrailProfile } from './navigation-cruise'
import { ONBOARDING_PLANET_COUNT, onboardingPlanetSlot, useOnboardingPlanetField } from './onboarding-planets'
import { pickupMagnetRange, pickupMagnetStrength } from './pickup-magnet'
import { planetRadius } from './planet-sizing'
import { pressurePackSize, shouldRecycleEnemy } from './spawn-pressure'
import {
  cameraTargetFor,
  screenToWorld as spaceScreenToWorld,
  spaceViewportScale,
  worldToScreen as spaceWorldToScreen
} from './space-camera'
import { isSpriteEnemyKind, spaceEnemyDefinitions, spaceEnemySpawnPoint, type SpaceEnemyKind } from './space-enemies'
import { planSurfaceEncounter, rollPlanetArchetype, type PlanetArchetype, type SurfaceEventKind, type SurfaceScenarioKind } from './surface-encounters'
import { surfaceThreatSpawnPoint } from './surface-spawn'
import { dashVector, touchActionLabel } from './mobile-controls'
import {
  applyRunRecovery,
  defaultMothershipState,
  isMothershipDepartmentUnlocked,
  mothershipDepartments,
  mothershipDepartmentUnlockText,
  normalizeMothershipState,
  purchaseMothershipTier,
  type MothershipDepartmentId,
  type MothershipState,
  type PersistentArchiveRecord,
  type RunOutcomeKind
} from './mothership-progression'
import {
  BEACON_HOLD_SECONDS,
  beaconSpawnDistance,
  nextBeaconWindow,
  returnBeaconAutopilotVector,
  returnBeaconEligible
} from './return-beacons'

type GameState = 'title' | 'mothership' | 'playing' | 'paused' | 'levelup' | 'planet' | 'landing' | 'surface' | 'alien' | 'lore' | 'takeoff' | 'dying' | 'debrief' | 'gameover' | 'scores'
type PickupKind = 'xp' | 'repair' | 'magnet' | 'core' | 'chest'
type EnemyKind = SpaceEnemyKind
type SurfaceResourceKind = 'crystal' | 'scrap' | 'repair' | 'cache'
type GraphicsMode = 'LOW' | 'MED' | 'GLOW'
type UpgradeCategory = 'weapon' | 'system'
type UpgradeBucket = 'weapons' | 'navigation' | 'survival' | 'economy' | 'planetcraft' | 'spacesuit' | 'control'
type RelicId = 'staticIdol' | 'glassReactor' | 'deadSunCoin' | 'hungryCompass' | 'blackBoxSaint' | 'mirrorSeed' | 'saintCapacitor' | 'forbiddenMap'
type LimitId = 'might' | 'cooldown' | 'amount' | 'speed' | 'magnet' | 'hull'
type AlienGiftKind = 'herb' | 'idol' | 'map' | 'coin'
type ArtifactKind = 'relic' | 'alien' | 'lore' | 'planet' | 'cache'
type WorkbenchView = 'upgrades' | 'manifest' | 'artifacts'
type UpgradeId =
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

interface Vec {
  x: number
  y: number
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  damage: number
  radius: number
  color: string
  pierce: number
  rail?: boolean
  hostile?: boolean
  chain?: number
  mine?: boolean
}

interface Enemy {
  id: number
  kind: EnemyKind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  radius: number
  speed: number
  value: number
  phase: number
  cd: number
  color: string
  flash: number
}

interface Pickup {
  kind: PickupKind
  x: number
  y: number
  vx: number
  vy: number
  value: number
  radius: number
  life: number
  color: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  angle?: number
  spin?: number
  sides?: number
  length?: number
  glow?: number
}

interface Shockwave {
  x: number
  y: number
  radius: number
  speed: number
  life: number
  maxLife: number
  color: string
  jag: number
}

interface Planet {
  id: string
  name: string
  x: number
  y: number
  radius: number
  color: string
  visited: boolean
  reward: string
  chunkX: number
  chunkY: number
  archetype: PlanetArchetype
}

interface SpaceChunk {
  key: string
  x: number
  y: number
  stars: Vec[]
  planets: Planet[]
}

interface SurfaceResource {
  kind: SurfaceResourceKind
  x: number
  y: number
  radius: number
  value: number
  color: string
  collected: boolean
}

interface SurfaceThreat {
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  radius: number
  phase: number
  color: string
  hit: number
  sprite?: 'glassMiteOracle' | 'bossCatalog'
  spriteRow?: number
  boss?: boolean
}

interface SurfaceBullet {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  radius: number
  damage: number
  color: string
}

interface SurfaceAlien {
  x: number
  y: number
  radius: number
  phase: number
  color: string
  name: string
  gift: AlienGiftKind
  resolved: boolean
  sprite?: 'alienCatalog'
  spriteRow?: number
}

interface SurfaceLoreSite {
  x: number
  y: number
  radius: number
  phase: number
  kind: 'fossils' | 'pyramid' | 'grave' | 'machine' | 'choir'
  title: string
  copy: string
  resolved: boolean
}

interface SurfaceRun {
  planet: Planet
  event: SurfaceEventKind
  scenario: SurfaceScenarioKind
  width: number
  height: number
  pilot: {
    x: number
    y: number
    vx: number
    vy: number
    facing: number
    gunCd: number
    invuln: number
    health: number
    maxHealth: number
    oxygen: number
    maxOxygen: number
  }
  ship: Vec
  camera: Vec
  resources: SurfaceResource[]
  threats: SurfaceThreat[]
  bullets: SurfaceBullet[]
  aliens: SurfaceAlien[]
  loreSites: SurfaceLoreSite[]
  collected: number
  pendingUpgrade: boolean
  bossCacheCount: number
  o2Returning: boolean
  message: string
}

interface Upgrade {
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

interface Relic {
  id: RelicId
  name: string
  description: string
  rarity: number
  downside?: string
}

interface Evolution {
  weapon: UpgradeId
  relic: RelicId
  name: string
  description: string
}

interface ArtifactRecord {
  id: string
  kind: ArtifactKind
  title: string
  detail: string
  source: string
  color: string
  icon: number
  count: number
}

interface DebriefReport {
  outcome: RunOutcomeKind
  title: string
  copy: string
  resources: {
    earned: { scrap: number; crystal: number; cores: number }
    recovered: { scrap: number; crystal: number; cores: number }
  }
  discoveries: PersistentArchiveRecord[]
  skippedBeacons: number
}

interface ReturnBeacon {
  x: number
  y: number
  radius: number
  hold: number
  phase: number
  age: number
  reminded: boolean
  assistTriggered: boolean
}

type WorkbenchChoice =
  | { kind: 'upgrade'; upgrade: Upgrade }
  | { kind: 'evolution'; evolution: Evolution }
  | { kind: 'limit'; id: LimitId; name: string; description: string }
  | { kind: 'relic'; relic: Relic }

interface ScoreEntry {
  name: string
  score: number
  time: number
  level: number
  kills: number
  date: string
}

interface PerfStats {
  updateMs: number
  renderMs: number
  frameMs: number
  fps: number
}

const TAU = Math.PI * 2
const CHUNK_SIZE = 3600
const CHUNK_LOAD_RADIUS = 1
const CHUNK_KEEP_RADIUS = 3
const STORAGE_KEY = 'vector_shooter_high_scores'
const MOTHERSHIP_STORAGE_KEY = 'galactic_hordes_mothership_v1'
const GRID_CELL = 180
const GRID_STRIDE = 1000
const MAX_PARTICLES = 300
const MAX_SHOCKWAVES = 12
const MAX_BULLETS = 220
const MAX_ENEMIES = 320
const MAX_PICKUPS = 220
const ENEMY_RECYCLE_RADIUS = 2200
const ENEMY_PRESSURE_RADIUS = 1250

const upgrades: Upgrade[] = [
  {
    id: 'rapid',
    name: 'Pulse Cannon',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The main damage bucket: faster pulse rhythm, harder hits, and double-pulse pressure.',
    max: 8,
    rarity: 100,
    catalyst: 'staticIdol',
    evolutionName: 'Choir Cannon',
    evolutionDescription: 'Pulse fire becomes a three-note volley with a brighter synth chord.',
    levels: ['Base pulse stabilizer', '-8% fire cooldown', '+12% pulse damage', '-8% fire cooldown', 'Every fifth shot double-pulses', '+15% projectile speed', '-10% fire cooldown', 'Evolution-ready']
  },
  {
    id: 'split',
    name: 'Prism Barrel',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The screen-control bucket: more rays, a wider fan, and better crowd trimming.',
    max: 6,
    rarity: 86,
    catalyst: 'glassReactor',
    evolutionName: 'Shatter Prism',
    evolutionDescription: 'The fan gains two extra rays and cracks through nearby targets.',
    levels: ['+1 side ray', 'Tighter fan control', '+1 side ray', '+10% ray damage', '+1 side ray', 'Evolution-ready']
  },
  {
    id: 'pierce',
    name: 'Ghost Rounds',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The horde-cutting bucket: pulses travel through bodies instead of dying early.',
    max: 5,
    rarity: 80,
    levels: ['+1 pierce', '+1 pierce', '+10% pulse damage', '+1 pierce', '+2 pierce']
  },
  {
    id: 'rail',
    name: 'Rail Lattice',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The elite-delete bucket: regular fire is interrupted by huge piercing lances.',
    max: 6,
    rarity: 62,
    catalyst: 'deadSunCoin',
    evolutionName: 'Solar Lance',
    evolutionDescription: 'Rail shots become screen-splitting sun lances with heavy pierce.',
    levels: ['Every 8th shot rails', '+15% rail damage', 'Every 7th shot rails', '+2 rail pierce', 'Every 6th shot rails', 'Evolution-ready']
  },
  {
    id: 'echo',
    name: 'Echo Chamber',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The projectile-quality bucket: longer life, more speed, and resonant wake damage.',
    max: 5,
    rarity: 70,
    catalyst: 'blackBoxSaint',
    evolutionName: 'Resonance Wake',
    evolutionDescription: 'Shots leave damaging vector trails after passing through enemies.',
    levels: ['+18% bullet lifetime', '+8% projectile speed', '+18% bullet lifetime', '+12% echo damage', 'Evolution-ready']
  },
  {
    id: 'orbit',
    name: 'Ion Moons',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The close-defense bucket: orbitals punish anything that crowds the hull.',
    max: 6,
    rarity: 72,
    catalyst: 'hungryCompass',
    evolutionName: 'Gravity Halo',
    evolutionDescription: 'Orbitals pull enemies inward before cutting them apart.',
    levels: ['+1 orbital', '+10% orbital radius', '+1 orbital', '+15% orbital damage', '+1 orbital', 'Evolution-ready']
  },
  {
    id: 'mine',
    name: 'Mine Wake',
    category: 'weapon',
    bucket: 'control',
    description: 'The dash-control bucket: movement leaves traps and turns escapes into damage.',
    max: 5,
    rarity: 55,
    catalyst: 'forbiddenMap',
    evolutionName: 'Comet Net',
    evolutionDescription: 'Dash mines link into explosive constellations.',
    levels: ['Dash drops 2 mines', '+20% mine damage', '+1 mine', 'Mines last longer', 'Evolution-ready']
  },
  {
    id: 'chain',
    name: 'Static Arc',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The chain-reaction bucket: pulse impacts jump through tight packs.',
    max: 5,
    rarity: 50,
    catalyst: 'saintCapacitor',
    evolutionName: 'Storm Liturgy',
    evolutionDescription: 'Chain lightning erupts from pulse impacts and surface pistol shots.',
    levels: ['+1 chain hop', '+10% arc damage', '+1 chain hop', '+1 chain hop', 'Evolution-ready']
  },
  {
    id: 'rift',
    name: 'Rift Needle',
    category: 'weapon',
    bucket: 'weapons',
    description: 'The boss-hunter bucket: rare heavy needles punch through elite targets.',
    max: 5,
    rarity: 45,
    catalyst: 'mirrorSeed',
    evolutionName: 'Black Needle',
    evolutionDescription: 'Rare needles execute wounded elites and bosses.',
    levels: ['Every 11th shot fires a needle', '+18% needle damage', 'Every 9th shot fires a needle', '+2 needle pierce', 'Evolution-ready']
  },
  {
    id: 'engine',
    name: 'Drift Engine',
    category: 'system',
    bucket: 'navigation',
    description: 'The manual handling bucket: more speed, sharper recovery, shorter dash cooldown.',
    max: 6,
    rarity: 95,
    levels: ['+18 move speed', '+8% acceleration', '-8% dash cooldown', '+18 move speed', '+0.08s dash invulnerability', '+22 move speed']
  },
  {
    id: 'nav',
    name: 'Nav Ghost',
    category: 'system',
    bucket: 'navigation',
    description: 'The low-input autonomy bucket: base cruise gets faster, smarter, and better at holding intent.',
    max: 7,
    rarity: 82,
    levels: ['Vector Memory: stronger course hold and faster cruise', 'Course Bend: nudges have more authority', 'Planet Lock: USE locks onto the nearest planet beacon', 'Threat Weave: autopilot curves away from nearby enemies', 'Salvage Bias: idle cruise bends toward valuable drops', 'Overdrive Nav: faster cruise and sharper heading changes', 'Ghost Pilot: stronger autonomous steering when your thumb lifts']
  },
  {
    id: 'magnet',
    name: 'Signal Magnet',
    category: 'system',
    bucket: 'economy',
    description: 'The collection bucket: fewer missed shards, richer routes, more numbers vacuumed in.',
    max: 6,
    rarity: 92,
    levels: ['+62 pickup range', '+12% pickup speed', '+62 pickup range', '+12% pickup speed', '+72 pickup range', 'Vacuum pings last longer']
  },
  {
    id: 'shield',
    name: 'Halo Battery',
    category: 'system',
    bucket: 'survival',
    description: 'The mistake-forgiveness bucket: a regenerating buffer before hull damage matters.',
    max: 5,
    rarity: 78,
    levels: ['+18 max shield', '+20% shield regen', '+18 max shield', '-12% recharge delay', '+28 max shield']
  },
  {
    id: 'repair',
    name: 'Hull Stitcher',
    category: 'system',
    bucket: 'survival',
    description: 'The long-run hull bucket: bigger maximum hull and full repairs on install.',
    max: 5,
    rarity: 78,
    levels: ['+18 max hull and full repair', '+12% repair value', '+18 max hull and full repair', '+12% repair value', '+26 max hull and full repair']
  },
  {
    id: 'vampire',
    name: 'Salvage Hunger',
    category: 'system',
    bucket: 'survival',
    description: 'The sustain bucket: enemy wreckage can become emergency repair.',
    max: 4,
    rarity: 52,
    levels: ['+2.5% repair drop chance', '+2.5% repair drop chance', 'Repair drops pull faster', '+3.5% repair drop chance']
  },
  {
    id: 'survey',
    name: 'Survey Array',
    category: 'system',
    bucket: 'planetcraft',
    description: 'The planet-reading bucket: clearer cache rumors, safer mystery boxes, better relic odds.',
    max: 4,
    rarity: 58,
    levels: ['Planet cache rumors improve', '+8% relic discovery', '-10% ambush chance', 'Hidden cache pings appear more often']
  },
  {
    id: 'luck',
    name: 'Luck Coil',
    category: 'system',
    bucket: 'economy',
    description: 'The jackpot bucket: more fourth choices, rarer rolls, and better mystery outcomes.',
    max: 5,
    rarity: 54,
    levels: ['+10% rare roll pressure', '+8% fourth choice chance', '+10% relic chance', '+8% fourth choice chance', 'Cache jackpots become more likely']
  },
  {
    id: 'cargo',
    name: 'Cargo Spine',
    category: 'system',
    bucket: 'economy',
    description: 'The planet-profit bucket: surface salvage pays out more resources and score.',
    max: 4,
    rarity: 66,
    levels: ['+15% planet resources', '+1 core from first cache', '+15% planet resources', '+25% cache score']
  },
  {
    id: 'heat',
    name: 'Heat Sink',
    category: 'system',
    bucket: 'control',
    description: 'The weapon-tempo bucket: high fire-rate builds stay fast and stable.',
    max: 4,
    rarity: 62,
    levels: ['-3% weapon cooldown', '+8% projectile speed', '-3% weapon cooldown', 'Rail and needle shots cool faster']
  },
  {
    id: 'phase',
    name: 'Phase Rudder',
    category: 'system',
    bucket: 'control',
    description: 'The panic-button bucket: safer dashes, softer collisions, stronger escape shockwaves.',
    max: 4,
    rarity: 58,
    levels: ['+0.08s dash invulnerability', '-8% collision damage', '+0.08s dash invulnerability', 'Dash shockwave knocks enemies back harder']
  },
  {
    id: 'suitO2',
    name: 'Exo-Lung',
    category: 'system',
    bucket: 'spacesuit',
    description: 'The surface timer bucket: longer oxygen reserves for planet runs.',
    max: 5,
    rarity: 64,
    levels: ['+14s max O2', '+12s max O2', 'Low-O2 return starts later', '+14s max O2', '+18s max O2']
  },
  {
    id: 'suitHealth',
    name: 'Skinweave Suit',
    category: 'system',
    bucket: 'spacesuit',
    description: 'The human survival bucket: more surface health and better field repairs.',
    max: 4,
    rarity: 66,
    levels: ['+18 max human health', '+15% surface repair', '+18 max human health', '+24 max human health']
  },
  {
    id: 'suitBlaster',
    name: 'Field Blaster',
    category: 'weapon',
    bucket: 'spacesuit',
    description: 'The human weapon bucket: surface pistol shots hit harder and cycle faster.',
    max: 5,
    rarity: 58,
    levels: ['+4 surface gun damage', '-6% surface gun cooldown', '+4 surface gun damage', '+40 surface shot speed', '-8% surface gun cooldown']
  }
]

const relics: Relic[] = [
  { id: 'staticIdol', name: 'Static Idol', rarity: 42, description: 'Pulse weapons arc with little religious sparks.', downside: 'Planet ambush odds rise slightly.' },
  { id: 'glassReactor', name: 'Glass Reactor', rarity: 38, description: 'A dangerous lens that turns spread fire into cutting light.', downside: 'Shield recharge delay is longer.' },
  { id: 'deadSunCoin', name: 'Dead Sun Coin', rarity: 34, description: 'Boss caches become richer and rail weapons wake up.', downside: 'Hunters hear you after takeoff.' },
  { id: 'hungryCompass', name: 'Hungry Compass', rarity: 42, description: 'The map pulls loot, enemies, and fate toward the ship.', downside: 'Enemy steering gets a little more aggressive.' },
  { id: 'blackBoxSaint', name: 'Black Box Saint', rarity: 30, description: 'Every cache sounds like it remembers another run.', downside: 'Caches sometimes summon stranger surface threats.' },
  { id: 'mirrorSeed', name: 'Mirror Seed', rarity: 30, description: 'Rerolls bend toward impossible needles and second chances.', downside: 'Cursed offers become more common.' },
  { id: 'saintCapacitor', name: 'Saint Capacitor', rarity: 36, description: 'Stores a planet pulse for lightning-heavy builds.', downside: 'Mining pulse cooldown is longer.' },
  { id: 'forbiddenMap', name: 'Forbidden Map', rarity: 26, description: 'Reveals hidden cache logic and mine constellations.', downside: 'Elite patrols track your signal.' }
]

const evolutions: Evolution[] = upgrades
  .filter((upgrade) => upgrade.catalyst && upgrade.evolutionName && upgrade.evolutionDescription)
  .map((upgrade) => ({
    weapon: upgrade.id,
    relic: upgrade.catalyst!,
    name: upgrade.evolutionName!,
    description: upgrade.evolutionDescription!
  }))

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const BOSS_CATALOG_ROWS = 5
const BOSS_CATALOG_FRAMES = 4
const ALIEN_CATALOG_ROWS = 5
const ALIEN_CATALOG_FRAMES = 4
const dist2 = (a: Vec, b: Vec) => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}
const len = (x: number, y: number) => Math.hypot(x, y)
const norm = (x: number, y: number): Vec => {
  const l = len(x, y) || 1
  return { x: x / l, y: y / l }
}
const angleLerp = (a: number, b: number, t: number) => {
  const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + diff * t
}
const hash32 = (x: number, y: number, salt = 0) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(salt, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}
const hashString = (value: string, salt = 0) => {
  let h = 2166136261 ^ salt
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const rngFrom = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

type PlanetAudioMood = Planet['archetype'] | 'deepSpace' | 'title'
type WeaponSoundKind = 'pulse' | 'prism' | 'rail' | 'needle' | 'surface'
type AudioUpgradeCue = UpgradeBucket | 'evolution' | 'relic' | 'limit'
type ExplosionSoundKind = 'small' | 'heavy' | 'surface' | 'gameover'
type PickupSoundKind = PickupKind | SurfaceResourceKind | 'gift' | 'nav'

interface PlanetMoodProfile {
  root: number
  chord: [number, number, number]
  noise: number
  pulse: number
  wobble: number
  filter: number
}

interface WeaponSoundProfile {
  base: number
  upper: number
  wave: OscillatorType
  duration: number
  bend: number
  gain: number
  noise: number
  filter: number
}

class AudioDirector {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private sfx: GainNode | null = null
  private bed: GainNode | null = null
  private weaponBus: GainNode | null = null
  private flangerLfo: OscillatorNode | null = null
  private beatTimer = 0
  private beatInterval = 0.7
  private beatIndex = 0
  private ambientTimer = 0
  private mood: PlanetAudioMood = 'title'
  private unlocked = false
  private planetMoods: Record<PlanetAudioMood, PlanetMoodProfile> = {
    title: { root: 55, chord: [0, 7, 12], noise: 0.012, pulse: 0.6, wobble: 0.4, filter: 820 },
    deepSpace: { root: 44, chord: [0, 5, 12], noise: 0.016, pulse: 0.48, wobble: 0.65, filter: 620 },
    cache: { root: 58, chord: [0, 7, 14], noise: 0.018, pulse: 0.68, wobble: 0.5, filter: 980 },
    hostile: { root: 41, chord: [0, 1, 7], noise: 0.03, pulse: 0.36, wobble: 0.9, filter: 520 },
    repair: { root: 62, chord: [0, 5, 9], noise: 0.01, pulse: 0.82, wobble: 0.28, filter: 1180 },
    relic: { root: 49, chord: [0, 7, 11], noise: 0.02, pulse: 0.52, wobble: 0.72, filter: 760 },
    strange: { root: 46, chord: [0, 6, 13], noise: 0.024, pulse: 0.44, wobble: 1.1, filter: 690 },
    lore: { root: 52, chord: [0, 3, 10], noise: 0.014, pulse: 0.72, wobble: 0.8, filter: 880 },
    horde: { root: 38, chord: [0, 1, 6], noise: 0.04, pulse: 0.3, wobble: 1.18, filter: 500 }
  }
  private weaponProfiles: Record<WeaponSoundKind, WeaponSoundProfile> = {
    pulse: { base: 310, upper: 890, wave: 'square', duration: 0.044, bend: 46, gain: 0.034, noise: 0.009, filter: 2500 },
    prism: { base: 420, upper: 1220, wave: 'triangle', duration: 0.052, bend: 82, gain: 0.032, noise: 0.006, filter: 3400 },
    rail: { base: 145, upper: 1480, wave: 'sawtooth', duration: 0.09, bend: -36, gain: 0.052, noise: 0.026, filter: 2100 },
    needle: { base: 760, upper: 1900, wave: 'square', duration: 0.065, bend: 180, gain: 0.038, noise: 0.014, filter: 3800 },
    surface: { base: 238, upper: 720, wave: 'square', duration: 0.048, bend: 24, gain: 0.04, noise: 0.018, filter: 1800 }
  }

  unlock() {
    if (this.unlocked) return
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    this.context = new AudioCtor()
    this.master = this.context.createGain()
    this.sfx = this.context.createGain()
    this.bed = this.context.createGain()
    this.master.gain.value = 0.36
    this.sfx.gain.value = 1
    this.bed.gain.value = 0.55
    this.setupWeaponFlanger()
    const limiter = this.context.createDynamicsCompressor()
    limiter.threshold.value = -18
    limiter.ratio.value = 9
    limiter.attack.value = 0.004
    limiter.release.value = 0.16
    this.sfx.connect(this.master)
    this.bed.connect(this.master)
    this.master.connect(limiter)
    limiter.connect(this.context.destination)
    this.unlocked = true
  }

  update(dt: number, intensity: number, mood: PlanetAudioMood) {
    if (!this.context || !this.master || !this.bed) return
    this.mood = mood
    this.ambientTimer -= dt
    if (this.ambientTimer <= 0) {
      this.ambientTimer = this.emitAmbientMood(mood, intensity)
    }
    this.updateBeatClock(dt, intensity, mood)
  }

  fire(kind: WeaponSoundKind, power: number) {
    const profile = this.weaponProfiles[kind]
    const drive = Math.min(9, power)
    const low = profile.base + drive * 14
    const high = profile.upper + drive * 28
    const destination = this.weaponDestination(kind)
    this.tone(low, profile.duration, profile.wave, profile.gain, 0.006, kind === 'rail' ? -10 : -12, { destination, filter: profile.filter, bend: profile.bend })
    this.tone(high, profile.duration * 0.72, kind === 'prism' ? 'sine' : 'triangle', profile.gain * 0.46, 0.004, kind === 'needle' ? -13 : -16, { destination, filter: profile.filter + 900, bend: profile.bend * 0.5 })
    if (profile.noise > 0) this.noise(profile.duration * 0.75, profile.noise, kind === 'rail' ? -14 : -19, { destination, filter: profile.filter * 0.72, type: kind === 'surface' ? 'highpass' : 'bandpass' })
  }

  hit() {
    this.noise(0.055, 0.09, -12, { filter: 740, type: 'bandpass' })
    this.tone(90, 0.09, 'sawtooth', 0.05, 0.012, -14, { bend: -22, filter: 900 })
  }

  pickup(kind: PickupSoundKind = 'xp') {
    const base = {
      xp: 760,
      repair: 520,
      magnet: 980,
      core: 620,
      chest: 430,
      crystal: 840,
      scrap: 360,
      cache: 560,
      gift: 700,
      nav: 1040
    }[kind]
    const wave: OscillatorType = kind === 'scrap' || kind === 'chest' ? 'square' : kind === 'repair' ? 'triangle' : 'sine'
    this.tone(base + Math.random() * 70, 0.075, wave, 0.034, 0.01, -15, { filter: base * 3, bend: kind === 'magnet' || kind === 'nav' ? 120 : 22 })
    if (kind === 'chest' || kind === 'cache' || kind === 'core') this.tone(base * 1.5, 0.11, 'triangle', 0.026, 0.018, -17, { filter: 2400 })
  }

  level() {
    this.tone(360, 0.12, 'triangle', 0.05, 0.02, -12, { filter: 1800 })
    setTimeout(() => this.tone(540, 0.14, 'triangle', 0.055, 0.02, -12, { filter: 2200 }), 70)
    setTimeout(() => this.tone(810, 0.18, 'triangle', 0.07, 0.02, -12, { filter: 2800 }), 140)
    this.syncToBeat(() => this.tone(720, 0.08, 'sine', 0.026, 0.012, -18, { filter: 2600 }), 2)
  }

  install(cue: AudioUpgradeCue, rare = false) {
    const root = {
      weapons: 520,
      navigation: 680,
      survival: 390,
      economy: 760,
      planetcraft: 470,
      spacesuit: 580,
      control: 610,
      evolution: 300,
      relic: 260,
      limit: 860
    }[cue]
    const wave: OscillatorType = cue === 'weapons' || cue === 'control' ? 'square' : cue === 'relic' || cue === 'evolution' ? 'sawtooth' : 'triangle'
    this.tone(root, 0.08, wave, 0.043, 0.008, rare ? -10 : -13, { filter: 1900, bend: cue === 'evolution' ? 120 : 34 })
    setTimeout(() => this.tone(root * (cue === 'survival' ? 1.34 : 1.5), 0.1, 'square', 0.03, 0.006, rare ? -11 : -15, { filter: 2600 }), 55)
    setTimeout(() => this.tone(root * (rare ? 2.08 : 1.88), 0.13, 'sine', 0.034, 0.006, rare ? -10 : -14, { filter: 3400 }), 120)
    if (rare) this.noise(0.1, 0.08, -17, { filter: cue === 'relic' ? 920 : 1700, type: 'bandpass' })
  }

  boom(kind: ExplosionSoundKind = 'small') {
    const big = kind === 'heavy' || kind === 'gameover'
    const surface = kind === 'surface'
    this.noise(big ? 0.34 : surface ? 0.2 : 0.16, big ? 0.2 : 0.11, big ? -8 : -12, { filter: big ? 520 : 880, type: 'lowpass' })
    this.noise(big ? 0.16 : 0.08, big ? 0.1 : 0.046, big ? -14 : -18, { filter: big ? 1600 : 2400, type: 'bandpass' })
    this.tone(big ? 52 : surface ? 74 : 92, big ? 0.36 : 0.18, 'sawtooth', big ? 0.09 : 0.044, 0.018, big ? -8 : -13, { bend: big ? -28 : -16, filter: big ? 760 : 1100 })
    if (kind === 'gameover') setTimeout(() => this.tone(38, 0.55, 'triangle', 0.07, 0.04, -12, { bend: -10, filter: 620 }), 120)
  }

  land() {
    this.tone(160, 0.15, 'sine', 0.05, 0.02, -16, { bend: -22, filter: 900 })
    this.tone(240, 0.22, 'triangle', 0.045, 0.03, -15, { bend: -38, filter: 1300 })
    this.noise(0.12, 0.04, -20, { filter: 620, type: 'lowpass' })
  }

  planetSignal(mood: PlanetAudioMood) {
    const profile = this.planetMoods[mood]
    for (let i = 0; i < profile.chord.length; i += 1) {
      const note = this.note(profile.root, profile.chord[i] + 12)
      setTimeout(() => this.syncToBeat(() => this.tone(note, 0.12, i === 1 ? 'square' : 'triangle', 0.032, 0.014, -15, { filter: profile.filter + note * 2, bend: profile.wobble * 16 }), 2), i * 68)
    }
    this.noise(0.11, profile.noise * 2.6, -21, { filter: profile.filter, type: 'bandpass' })
  }

  private emitAmbientMood(mood: PlanetAudioMood, intensity: number) {
    if (!this.bed) return 1
    const bed = this.bed
    const profile = this.planetMoods[mood]
    const chord = profile.chord[Math.floor(Math.random() * profile.chord.length)]
    const low = this.note(profile.root, chord - 12)
    const dur = clamp(0.9 + Math.random() * 0.75 - intensity * 0.24, 0.44, 1.45)
    this.tone(low + rand(-profile.wobble * 3, profile.wobble * 3), dur, mood === 'hostile' ? 'sawtooth' : 'triangle', 0.024, 0.08, -24, { destination: bed, filter: profile.filter, bend: rand(-profile.wobble * 18, profile.wobble * 18) })
    if (Math.random() < 0.62) this.noise(0.08 + profile.noise * 4, profile.noise, -25, { destination: bed, filter: profile.filter + rand(-120, 220), type: mood === 'repair' ? 'lowpass' : 'bandpass' })
    return clamp(profile.pulse * 1.65 + Math.random() * 0.5, 0.55, 1.8)
  }

  private updateBeatClock(dt: number, intensity: number, mood: PlanetAudioMood) {
    if (!this.bed) return
    this.beatTimer -= dt
    if (this.beatTimer > 0) return
    const profile = this.planetMoods[mood]
    this.beatInterval = clamp(profile.pulse - intensity * 0.2, 0.24, 0.9)
    this.beatTimer = this.beatInterval
    this.heartbeat(mood, intensity)
    this.beatIndex += 1
  }

  private heartbeat(mood: PlanetAudioMood, intensity: number) {
    if (!this.bed) return
    const profile = this.planetMoods[mood]
    const accent = this.beatIndex % 4 === 0
    const chord = profile.chord[this.beatIndex % profile.chord.length]
    const note = this.note(profile.root, chord + Math.floor(intensity * 5))
    this.tone(note, 0.075, 'sawtooth', 0.024, 0.035, -18, { destination: this.bed, filter: profile.filter + note })
    this.tone(profile.root * 0.5, accent ? 0.12 : 0.08, 'sine', accent ? 0.02 : 0.012, 0.025, accent ? -23 : -27, { destination: this.bed, filter: profile.filter * 0.7 })
    if (Math.random() < 0.36 + intensity * 0.24) this.noise(0.055, profile.noise, -23, { destination: this.bed, filter: profile.filter, type: 'bandpass' })
  }

  private nextBeatDelay(subdivision = 1) {
    const step = this.beatInterval / Math.max(1, subdivision)
    if (step <= 0) return 0
    return clamp(this.beatTimer % step, 0, step)
  }

  private syncToBeat(fn: () => void, subdivision = 1) {
    const delay = this.nextBeatDelay(subdivision)
    if (delay <= 0.018) fn()
    else setTimeout(fn, delay * 1000)
  }

  private note(root: number, semitones: number) {
    return root * Math.pow(2, semitones / 12)
  }

  private setupWeaponFlanger() {
    if (!this.context || !this.sfx) return
    const weaponBus = this.context.createGain()
    const flangerDelay = this.context.createDelay(0.03)
    const flangerFeedback = this.context.createGain()
    const flangerWet = this.context.createGain()
    const flangerLfo = this.context.createOscillator()
    const flangerDepth = this.context.createGain()

    weaponBus.gain.value = 1
    flangerDelay.delayTime.value = 0.006
    flangerFeedback.gain.value = 0.18
    flangerWet.gain.value = 0.16
    flangerLfo.type = 'sine'
    flangerLfo.frequency.value = 0.16
    flangerDepth.gain.value = 0.0038

    flangerLfo.connect(flangerDepth)
    flangerDepth.connect(flangerDelay.delayTime)
    weaponBus.connect(this.sfx)
    weaponBus.connect(flangerDelay)
    flangerDelay.connect(flangerFeedback)
    flangerFeedback.connect(flangerDelay)
    flangerDelay.connect(flangerWet)
    flangerWet.connect(this.sfx)
    flangerLfo.start()

    this.weaponBus = weaponBus
    this.flangerLfo = flangerLfo
  }

  private weaponDestination(kind: WeaponSoundKind) {
    if (kind === 'surface') return undefined
    return this.weaponBus ?? undefined
  }

  private tone(freq: number, duration: number, type: OscillatorType, gain: number, attack: number, db: number, options: { bend?: number; filter?: number; destination?: AudioNode } = {}) {
    if (!this.context || !this.sfx) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const filter = this.context.createBiquadFilter()
    const amp = this.context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    if (options.bend) osc.frequency.exponentialRampToValueAtTime(Math.max(24, freq + options.bend), now + duration)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(options.filter ?? 1800 + freq, now)
    amp.gain.setValueAtTime(0.0001, now)
    amp.gain.exponentialRampToValueAtTime(gain * Math.pow(10, db / 20), now + attack)
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(filter)
    filter.connect(amp)
    amp.connect(options.destination ?? this.sfx)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  private noise(duration: number, gain: number, db: number, options: { filter?: number; type?: BiquadFilterType; destination?: AudioNode } = {}) {
    if (!this.context || !this.sfx) return
    const now = this.context.currentTime
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      const crush = i % 5 === 0 ? Math.random() * 2 - 1 : data[i - 1] || 0
      data[i] = crush * (1 - i / data.length)
    }
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const amp = this.context.createGain()
    source.buffer = buffer
    filter.type = options.type ?? 'bandpass'
    filter.frequency.value = options.filter ?? 420 + Math.random() * 1400
    filter.Q.value = 1.8
    amp.gain.value = gain * Math.pow(10, db / 20)
    source.connect(filter)
    filter.connect(amp)
    amp.connect(options.destination ?? this.sfx)
    source.start(now)
  }
}

class VectorShooter {
  private app = document.querySelector<HTMLDivElement>('#app')!
  private canvas: HTMLCanvasElement
  private mini: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private miniCtx: CanvasRenderingContext2D
  private dpr = window.devicePixelRatio || 1
  private width = 1280
  private height = 720
  private last = performance.now()
  private state: GameState = 'title'
  private previousState: GameState = 'title'
  private graphicsMode: GraphicsMode = (localStorage.getItem('vector_shooter_graphics') as GraphicsMode) || 'LOW'
  private perf: PerfStats = { updateMs: 0, renderMs: 0, frameMs: 16.7, fps: 60 }
  private keys = new Set<string>()
  private pressed = new Set<string>()
  private mouse = { x: 0, y: 0, down: false }
  private touchStick = { active: false, id: -1, startX: 0, startY: 0, x: 0, y: 0 }
  private mobileActionQueued = false
  private mobileDashQueued = false
  private mobileFireQueued = false
  private audio = new AudioDirector()
  private camera = { x: 0, y: 0, shake: 0 }
  private glassMiteOracleSheet = new Image()
  private planetAlienCatalog = new Image()
  private planetBossCatalog = new Image()
  private spaceEnemyCatalog = new Image()
  private surfaceSpacemanSheet = new Image()
  private scoreSaved = false
  private scoreName = 'ACE'
  private toastTimer = 0
  private toastText = ''
  private mothership: MothershipState = defaultMothershipState()
  private debrief: DebriefReport | null = null
  private upgradeChoices: WorkbenchChoice[] = []
  private workbenchInstalling = false
  private workbenchView: WorkbenchView = 'upgrades'
  private workbenchRerolls = 0
  private planetChoice: Planet | null = null
  private alienChoice: SurfaceAlien | null = null
  private orbitReturnPoint: Vec | null = null
  private transitionTimer = 0
  private transitionDuration = 1.25
  private deathTimer = 0
  private surface: SurfaceRun | null = null
  private returnBeacon: ReturnBeacon | null = null
  private nextReturnBeaconAt = 0
  private skippedReturnBeacons = 0
  private collisionFxCooldown = 0
  private pendingUpgrades = 0
  private takeoffAfterWorkbench = false
  private enemyId = 0
  private fireSerial = 0
  private spawnTimer = 0
  private bossTimer = 75
  private chestTimer = 30
  private chunks = new Map<string, SpaceChunk>()
  private stars: Vec[] = []
  private activeChunkKey = ''
  private autoNavHeading = 0
  private autoNavActive = false
  private autoNavTargetPlanetId: string | null = null
  private autoNavTargetBeacon = false
  private highs: ScoreEntry[] = []
  private resources = { scrap: 0, crystal: 0, cores: 0 }
  private relics = new Set<RelicId>()
  private evolved = new Set<UpgradeId>()
  private artifacts = new Map<string, ArtifactRecord>()
  private limitBreaks: Record<LimitId, number> = { might: 0, cooldown: 0, amount: 0, speed: 0, magnet: 0, hull: 0 }

  private player = this.makePlayer()
  private bullets: Bullet[] = []
  private enemies: Enemy[] = []
  private enemyGrid = new Map<number, Enemy[]>()
  private nearbyEnemyScratch: Enemy[] = []
  private pickups: Pickup[] = []
  private particles: Particle[] = []
  private shockwaves: Shockwave[] = []
  private planets: Planet[] = []
  private visitedPlanets = new Set<string>()

  private stats = {
    time: 0,
    kills: 0,
    level: 1,
    xp: 0,
    nextXp: 24,
    highScore: 0,
    planets: 0,
    score: 0
  }

  private build: Record<UpgradeId, number> = {
    rapid: 0,
    split: 0,
    pierce: 0,
    mine: 0,
    chain: 0,
    rift: 0,
    engine: 0,
    nav: 0,
    magnet: 0,
    shield: 0,
    repair: 0,
    orbit: 0,
    rail: 0,
    echo: 0,
    vampire: 0,
    survey: 0,
    luck: 0,
    cargo: 0,
    heat: 0,
    phase: 0,
    suitO2: 0,
    suitHealth: 0,
    suitBlaster: 0
  }

  private ui = {
    score: document.createElement('span'),
    time: document.createElement('span'),
    hullLabel: document.createElement('span'),
    level: document.createElement('span'),
    xpLabel: document.createElement('span'),
    hull: document.createElement('span'),
    wave: document.createElement('span'),
    high: document.createElement('span'),
    resources: document.createElement('span'),
    hullFill: document.createElement('div'),
    xpFill: document.createElement('div'),
    toast: document.createElement('div'),
    perf: document.createElement('div'),
    touchControls: document.createElement('div'),
    touchStick: document.createElement('div'),
    touchKnob: document.createElement('div'),
    touchAction: document.createElement('button'),
    touchDash: document.createElement('button'),
    title: document.createElement('section'),
    levelup: document.createElement('section'),
    planet: document.createElement('section'),
    gameover: document.createElement('section'),
    scores: document.createElement('section')
  }

  constructor() {
    this.app.innerHTML = ''
    const shell = document.createElement('div')
    shell.className = 'game-shell'
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.mini = document.createElement('canvas')
    this.mini.className = 'minimap'
    this.miniCtx = this.mini.getContext('2d')!
    shell.append(this.canvas)
    shell.append(this.mini)
    shell.append(this.makeHud())
    shell.append(this.makeScreens())
    this.app.append(shell)
    this.resize()
    this.bind()
    this.glassMiteOracleSheet.src = glassMiteOracleSheetUrl
    this.planetAlienCatalog.src = planetAlienCatalogUrl
    this.planetBossCatalog.src = planetBossCatalogUrl
    this.spaceEnemyCatalog.src = spaceEnemyCatalogUrl
    this.surfaceSpacemanSheet.src = surfaceSpacemanSheetUrl
    this.highs = this.loadScores()
    this.mothership = this.loadMothership()
    this.stats.highScore = this.highs[0]?.score ?? 0
    this.updateSpaceChunks()
    this.showTitle()
    requestAnimationFrame((t) => this.frame(t))
  }

  private makePlayer() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      aimAngle: -Math.PI / 2,
      radius: 18,
      hull: 110,
      maxHull: 110,
      shield: 0,
      maxShield: 0,
      shieldDelay: 0,
      invuln: 0,
      fireCd: 0,
      dashCd: 0,
      speed: 270,
      landedCd: 0
    }
  }

  private makeHud() {
    const hud = document.createElement('div')
    hud.className = 'hud'
    const top = document.createElement('div')
    top.className = 'topbar'
    const meters = document.createElement('div')
    meters.className = 'hud-meters'
    meters.append(this.meter('HULL', this.ui.hull, this.ui.hullFill, 'health', this.ui.hullLabel), this.meter('XP', this.ui.level, this.ui.xpFill, 'xp', this.ui.xpLabel))
    const left = document.createElement('div')
    left.className = 'hud-cluster hud-cluster-left'
    left.append(this.chip('TIME', this.ui.time), this.chip('SCORE', this.ui.score))
    this.ui.toast.className = 'toast'
    this.ui.perf.className = 'perf'
    hud.append(top, this.ui.toast, this.makeTouchControls())
    top.append(meters, left)
    return hud
  }

  private meter(label: string, value: HTMLElement, fill: HTMLElement, tone: string, labelEl = document.createElement('span')) {
    const meter = document.createElement('div')
    meter.className = `hud-meter ${tone}`
    const meta = document.createElement('div')
    meta.className = 'hud-meter-meta'
    labelEl.textContent = label
    value.className = 'hud-meter-value'
    meta.append(labelEl, value)
    const bar = document.createElement('div')
    bar.className = 'hud-meter-bar'
    fill.className = `hud-meter-fill ${tone}`
    bar.append(fill)
    meter.append(meta, bar)
    return meter
  }

  private makeTouchControls() {
    this.ui.touchControls.className = 'touch-controls'
    this.ui.touchStick.className = 'touch-stick'
    this.ui.touchKnob.className = 'touch-knob'
    this.ui.touchStick.append(this.ui.touchKnob)
    const buttons = document.createElement('div')
    buttons.className = 'touch-buttons'
    this.ui.touchAction.className = 'touch-button action'
    this.ui.touchAction.type = 'button'
    this.ui.touchAction.textContent = 'ACTION'
    this.ui.touchDash.className = 'touch-button dash'
    this.ui.touchDash.type = 'button'
    this.ui.touchDash.textContent = 'DASH'
    this.ui.touchAction.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.audio.unlock()
      this.mobileActionQueued = true
    })
    this.ui.touchDash.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.audio.unlock()
      if (this.state === 'surface') this.mobileFireQueued = true
      else this.mobileDashQueued = true
    })
    buttons.append(this.ui.touchAction, this.ui.touchDash)
    this.ui.touchControls.append(this.ui.touchStick, buttons)
    return this.ui.touchControls
  }

  private chunkKey(x: number, y: number) {
    return `${x},${y}`
  }

  private currentChunk() {
    return { x: Math.floor(this.player.x / CHUNK_SIZE), y: Math.floor(this.player.y / CHUNK_SIZE) }
  }

  private updateSpaceChunks(force = false) {
    const center = this.currentChunk()
    const centerKey = this.chunkKey(center.x, center.y)
    if (!force && centerKey === this.activeChunkKey && this.planets.length) return
    this.activeChunkKey = centerKey
    for (let x = center.x - CHUNK_LOAD_RADIUS; x <= center.x + CHUNK_LOAD_RADIUS; x += 1) {
      for (let y = center.y - CHUNK_LOAD_RADIUS; y <= center.y + CHUNK_LOAD_RADIUS; y += 1) {
        const key = this.chunkKey(x, y)
        if (!this.chunks.has(key)) this.chunks.set(key, this.generateChunk(x, y))
      }
    }
    for (const [key, chunk] of this.chunks) {
      if (Math.abs(chunk.x - center.x) > CHUNK_KEEP_RADIUS || Math.abs(chunk.y - center.y) > CHUNK_KEEP_RADIUS) this.chunks.delete(key)
    }
    this.stars = []
    this.planets = []
    for (const chunk of this.chunks.values()) {
      if (Math.abs(chunk.x - center.x) <= CHUNK_LOAD_RADIUS && Math.abs(chunk.y - center.y) <= CHUNK_LOAD_RADIUS) {
        this.stars.push(...chunk.stars)
        this.planets.push(...chunk.planets)
      }
    }
  }

  private generateChunk(x: number, y: number): SpaceChunk {
    const key = this.chunkKey(x, y)
    const rng = rngFrom(hash32(x, y, 17))
    const stars: Vec[] = []
    const starCount = 120 + Math.floor(rng() * 90)
    for (let i = 0; i < starCount; i += 1) {
      stars.push({ x: x * CHUNK_SIZE + rng() * CHUNK_SIZE, y: y * CHUNK_SIZE + rng() * CHUNK_SIZE })
    }
    const planets: Planet[] = []
    const onboardingField = useOnboardingPlanetField(x, y, this.visitedPlanets.size)
    const planetCount = onboardingField ? ONBOARDING_PLANET_COUNT : key === '0,0' ? 3 : 1 + Math.floor(rng() * 3)
    for (let i = 0; i < planetCount; i += 1) planets.push(this.generatePlanet(x, y, i, rng, planets))
    return { key, x, y, stars, planets }
  }

  private generatePlanet(chunkX: number, chunkY: number, index: number, rng: () => number, existing: Planet[] = []): Planet {
    const archetype = rollPlanetArchetype({ chunkX, chunkY, index, random: rng })
    const prefix = ['LUX', 'RED', 'SAINT', 'GREEN', 'NULL', 'IRON', 'GHOST', 'VOID', 'GLASS', 'STATIC', 'DUST', 'HALO']
    const suffix = archetype === 'lore'
      ? ['OSSUARY', 'PYRAMID', 'GRAVE', 'FOSSIL SEA', 'TOMB', 'SCRIPTURE', 'BONE ORCHARD', 'MEMORIAL']
      : archetype === 'horde'
        ? ['HORDE VAULT', 'MASS GRAVE', 'FEAST VAULT', 'WARREN', 'DREAD HOLD', 'TREASURE PIT']
      : ['MORGUE', 'MERCY', 'CHOIR', 'CATHEDRAL', 'WELL', 'ENGINE', 'RELIQUARY', 'ORCHARD', 'VAULT', 'CRADLE', 'WAKE', 'BEACON']
    const color = {
      cache: '#57fff3',
      hostile: '#ff5d73',
      repair: '#8fff7d',
      relic: '#fff27a',
      strange: '#b990ff',
      lore: '#d7fff7',
      horde: '#ff61d8'
    }[archetype]
    const name = chunkX === 0 && chunkY === 0 && index === 0 ? 'LUX MORGUE' : `${prefix[Math.floor(rng() * prefix.length)]} ${suffix[Math.floor(rng() * suffix.length)]}`
    const margin = 420
    const onboardingField = useOnboardingPlanetField(chunkX, chunkY, this.visitedPlanets.size)
    const centerBias = chunkX === 0 && chunkY === 0 && index === 0
    const radius = planetRadius(rng)
    const onboardingSlot = onboardingField ? onboardingPlanetSlot(index) : null
    let x = onboardingSlot ? onboardingSlot.x : centerBias ? 720 : chunkX * CHUNK_SIZE + margin + rng() * (CHUNK_SIZE - margin * 2)
    let y = onboardingSlot ? onboardingSlot.y : centerBias ? 220 : chunkY * CHUNK_SIZE + margin + rng() * (CHUNK_SIZE - margin * 2)
    if (!centerBias && !onboardingSlot) {
      let placed = false
      for (let attempt = 0; attempt < 28; attempt += 1) {
        const candidate = {
          x: chunkX * CHUNK_SIZE + margin + rng() * (CHUNK_SIZE - margin * 2),
          y: chunkY * CHUNK_SIZE + margin + rng() * (CHUNK_SIZE - margin * 2)
        }
        const clear = existing.every((planet) => Math.sqrt((planet.x - candidate.x) ** 2 + (planet.y - candidate.y) ** 2) > this.planetClearance(radius, planet.radius))
        if (clear) {
          x = candidate.x
          y = candidate.y
          placed = true
          break
        }
      }
      if (!placed) {
        const slot = this.planetFallbackSlot(index, existing.length)
        x = chunkX * CHUNK_SIZE + margin + slot.x * (CHUNK_SIZE - margin * 2)
        y = chunkY * CHUNK_SIZE + margin + slot.y * (CHUNK_SIZE - margin * 2)
      }
    }
    const reward = {
      cache: 'Cache-heavy salvage and mutation signals.',
      hostile: 'Hostile planet. Better rewards, uglier landing.',
      repair: 'Repair-rich safe dock with quieter salvage.',
      relic: 'Relic signatures and rare cache odds.',
      strange: 'Unstable signal. Anything could be waiting.',
      lore: 'Quiet ruins, fossils, graves, and inspectable narrative signals.',
      horde: 'Vast enemy horde guarding a massive treasure vault.'
    }[archetype]
    const id = `${chunkX}:${chunkY}:${index}`
    return { id, name, x, y, radius, color, visited: this.visitedPlanets.has(id), reward, chunkX, chunkY, archetype }
  }

  private planetClearance(a: number, b: number) {
    return Math.max(520, a + b + 300)
  }

  private planetFallbackSlot(index: number, existingCount: number) {
    const slots = [
      { x: 0.2, y: 0.24 },
      { x: 0.78, y: 0.34 },
      { x: 0.42, y: 0.78 }
    ]
    return slots[(index + existingCount) % slots.length]
  }

  private chip(label: string, value: HTMLElement, tone = '') {
    const chip = document.createElement('div')
    chip.className = `hud-chip ${tone}`.trim()
    const l = document.createElement('span')
    l.className = 'hud-label'
    l.textContent = label
    value.className = 'hud-value'
    chip.append(l, value)
    return chip
  }

  private makeScreens() {
    const wrap = document.createElement('div')
    const screenList = [this.ui.title, this.ui.levelup, this.ui.planet, this.ui.gameover, this.ui.scores]
    for (const s of screenList) {
      s.className = 'screen'
      wrap.append(s)
    }
    return wrap
  }

  private bind() {
    window.addEventListener('resize', () => this.resize())
    const preventBrowserGesture = (event: Event) => event.preventDefault()
    document.addEventListener('gesturestart', preventBrowserGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('gesturechange', preventBrowserGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('gestureend', preventBrowserGesture, { passive: false } as AddEventListenerOptions)
    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 1) event.preventDefault()
    }, { passive: false })
    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      if (target?.closest('button, input')) return
      const now = performance.now()
      if (now - lastTouchEnd < 320) event.preventDefault()
      lastTouchEnd = now
    }, { passive: false })
    window.addEventListener('keydown', (e) => {
      this.audio.unlock()
      if (!this.keys.has(e.code)) this.pressed.add(e.code)
      this.keys.add(e.code)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (e.code === 'Escape') this.togglePause()
      if (e.code === 'Enter' && this.state === 'title') this.showMothership()
      if (e.code === 'Enter' && this.state === 'mothership') this.start()
      if (e.code === 'Enter' && this.state === 'gameover') this.restartFromGameOver()
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') {
        if (this.touchStick.active && e.pointerId === this.touchStick.id) {
          this.touchStick.x = e.clientX
          this.touchStick.y = e.clientY
          e.preventDefault()
        }
        return
      }
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
    })
    window.addEventListener('pointerdown', (e) => {
      this.audio.unlock()
      if (e.pointerType === 'touch') {
        const target = e.target instanceof HTMLElement ? e.target : null
        if (target?.closest('button, input')) return
        if (this.canStartTouchMove(e.clientX, e.clientY)) {
          this.touchStick = { active: true, id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY }
          this.ui.touchStick.style.left = `${e.clientX}px`
          this.ui.touchStick.style.top = `${e.clientY}px`
          this.ui.touchStick.style.setProperty('--touch-line', '0px')
          this.ui.touchStick.style.setProperty('--touch-angle', '0rad')
          this.ui.touchStick.classList.add('active')
          e.preventDefault()
        }
        return
      }
      this.mouse.down = true
    })
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') {
        if (e.pointerId === this.touchStick.id) this.clearTouchStick()
        return
      }
      this.mouse.down = false
    })
    window.addEventListener('pointercancel', (e) => {
      if (e.pointerType === 'touch' && e.pointerId === this.touchStick.id) this.clearTouchStick()
    })
    window.addEventListener('gamepadconnected', () => this.toast('GAMEPAD SIGNAL LOCKED: LEFT STICK MOVE, RIGHT STICK FIRE'))
  }

  private resize() {
    const modeCap = this.graphicsMode === 'LOW' ? 1 : this.graphicsMode === 'MED' ? 1.25 : 1.75
    this.dpr = Math.min(window.devicePixelRatio || 1, modeCap)
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.mini.width = 154 * this.dpr
    this.mini.height = 154 * this.dpr
    this.miniCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private clearTouchStick() {
    this.touchStick.active = false
    this.touchStick.id = -1
    this.ui.touchStick.classList.remove('active')
  }

  private canStartTouchMove(x: number, y: number) {
    if (this.state !== 'playing' && this.state !== 'surface') return false
    if (y < Math.max(82, this.height * 0.13)) return false
    if (x > this.width - 118 && y > this.height - 250) return false
    return true
  }

  private frame(now: number) {
    const dt = clamp((now - this.last) / 1000, 0, 0.033)
    const frameMs = now - this.last
    this.last = now
    const updateStart = performance.now()
    this.update(dt)
    const renderStart = performance.now()
    this.render()
    const renderEnd = performance.now()
    this.perf.updateMs = this.perf.updateMs * 0.9 + (renderStart - updateStart) * 0.1
    this.perf.renderMs = this.perf.renderMs * 0.9 + (renderEnd - renderStart) * 0.1
    this.perf.frameMs = this.perf.frameMs * 0.9 + frameMs * 0.1
    this.perf.fps = 1000 / Math.max(1, this.perf.frameMs)
    this.pressed.clear()
    requestAnimationFrame((t) => this.frame(t))
  }

  private update(dt: number) {
    const intensity = this.state === 'surface' ? 0.18 : clamp(this.stats.time / 360 + this.enemies.length / 120, 0, 1)
    this.audio.update(dt, intensity, this.audioMood())
    if (this.state === 'landing') {
      this.updateLanding(dt)
      return
    }
    if ((this.state === 'alien' || this.state === 'lore') && this.surface) {
      this.stats.time += dt * 0.08
      this.toastTimer -= dt
      if (this.toastTimer <= 0) this.ui.toast.classList.remove('visible')
      this.updateParticles(dt)
      this.updateHud()
      return
    }
    if (this.state === 'surface') {
      this.updateSurface(dt)
      return
    }
    if (this.state === 'takeoff') {
      this.updateTakeoff(dt)
      return
    }
    if (this.state === 'dying') {
      this.updateDying(dt)
      return
    }
    if (this.state !== 'playing') {
      this.drawTitleDrift(dt)
      return
    }

    this.stats.time += dt
    this.spawnTimer -= dt
    this.bossTimer -= dt
    this.chestTimer -= dt
    this.collisionFxCooldown -= dt
    this.player.fireCd -= dt
    this.player.dashCd -= dt
    this.player.invuln -= dt
    this.player.shieldDelay -= dt
    this.player.landedCd -= dt
    this.toastTimer -= dt
    if (this.toastTimer <= 0) this.ui.toast.classList.remove('visible')

    if (this.player.maxShield > 0 && this.player.shieldDelay <= 0) {
      const reactorPenalty = this.relics.has('glassReactor') ? 0.7 : 1
      this.player.shield = clamp(this.player.shield + dt * (4 + this.build.shield * 3) * reactorPenalty, 0, this.player.maxShield)
    }

    this.updatePlayer(dt)
    this.updateBullets(dt)
    this.updateEnemies(dt)
    this.updatePickups(dt)
    this.updateParticles(dt)
    this.updateOrbitals(dt)
    this.updateSpawning()
    this.updateReturnBeacon(dt)
    this.updateCamera(dt)
    this.updateHud()
    if (this.player.hull <= 0) this.gameOver()
  }

  private audioMood(): PlanetAudioMood {
    if (this.state === 'title' || this.state === 'mothership' || this.state === 'scores' || this.state === 'dying' || this.state === 'debrief' || this.state === 'gameover') return 'title'
    if (this.surface) return this.surface.planet.archetype
    if (this.planetChoice) return this.planetChoice.archetype
    let best: Planet | null = null
    let bestD = Number.POSITIVE_INFINITY
    for (const planet of this.planets) {
      const d = dist2(planet, this.player)
      if (d < bestD) {
        bestD = d
        best = planet
      }
    }
    if (best && bestD < (best.radius + 760) ** 2) return best.archetype
    return 'deepSpace'
  }

  private drawTitleDrift(dt: number) {
    this.stats.time += dt * 0.08
    this.updateParticles(dt)
    this.camera.x = -this.width / 2 + Math.cos(performance.now() / 8000) * 80
    this.camera.y = -this.height / 2 + Math.sin(performance.now() / 9000) * 80
    this.updateSpaceChunks()
    this.updateHud()
  }

  private updatePlayer(dt: number) {
    const input = this.getInput()
    const move = this.resolveNavigationMove(input.move, input.moveActive, dt)
    const accel = (1680 + this.build.engine * 210 + this.build.nav * 82) * dt
    const maxSpeed = this.player.speed + this.build.engine * 36 + this.build.nav * 18
    this.player.vx += move.x * accel
    this.player.vy += move.y * accel
    const speed = len(this.player.vx, this.player.vy)
    if (speed > maxSpeed) {
      this.player.vx = (this.player.vx / speed) * maxSpeed
      this.player.vy = (this.player.vy / speed) * maxSpeed
    }
    if (input.dash && this.player.dashCd <= 0) {
      const d = dashVector({
        vx: this.player.vx,
        vy: this.player.vy,
        speed,
        aimAngle: this.player.aimAngle,
        move,
        moveActive: input.moveActive
      })
      this.player.vx += d.x * 520
      this.player.vy += d.y * 520
      this.player.dashCd = clamp(1.15 - this.build.engine * 0.12 - this.build.heat * 0.025, 0.48, 1.15)
      this.player.invuln = 0.18 + this.build.phase * 0.08
      this.camera.shake = Math.max(this.camera.shake, 8)
      this.burst(this.player.x, this.player.y, '#70a8ff', 14 + this.build.phase * 3, 180 + this.build.phase * 24)
      this.deployMineWake(d)
    }
    this.player.vx *= Math.pow(0.06, dt)
    this.player.vy *= Math.pow(0.06, dt)
    this.player.x += this.player.vx * dt
    this.player.y += this.player.vy * dt
    this.updateSpaceChunks()

    if (input.aiming) this.player.aimAngle = input.aimAngle
    if (speed > 20) this.player.angle = angleLerp(this.player.angle, Math.atan2(this.player.vy, this.player.vx), 0.12)
    this.player.angle = angleLerp(this.player.angle, this.player.aimAngle, input.firing ? 0.2 : 0.04)

    if (input.firing && this.player.fireCd <= 0) this.fire()
    if (input.interact) this.tryLand()
  }

  private resolveNavigationMove(move: Vec, moveActive: boolean, dt: number): Vec {
    const level = this.navigationCruiseLevel()

    const manualActive = moveActive && Math.abs(move.x) + Math.abs(move.y) > 0.06
    if (manualActive) {
      const target = Math.atan2(move.y, move.x)
      this.autoNavHeading = this.autoNavActive ? angleLerp(this.autoNavHeading, target, clamp(dt * (3.6 + level * 0.42), 0, 0.38)) : target
      this.autoNavActive = true
      this.autoNavTargetPlanetId = null
      this.autoNavTargetBeacon = false
    } else if (!this.autoNavActive) {
      const speed = len(this.player.vx, this.player.vy)
      this.autoNavHeading = speed > 20 ? Math.atan2(this.player.vy, this.player.vx) : this.player.angle
      this.autoNavActive = true
    }

    const targetPlanet = this.autoNavTargetPlanetId ? this.planets.find((planet) => planet.id === this.autoNavTargetPlanetId) : null
    const beaconTarget = this.autoNavTargetBeacon ? this.returnBeacon : null
    if (targetPlanet) {
      const targetAngle = Math.atan2(targetPlanet.y - this.player.y, targetPlanet.x - this.player.x)
      this.autoNavHeading = angleLerp(this.autoNavHeading, targetAngle, clamp(dt * (1.7 + level * 0.24), 0, 0.22))
      if (Math.sqrt(dist2(targetPlanet, this.player)) < targetPlanet.radius + 108) {
        this.autoNavTargetPlanetId = null
        this.toast('LANDING BEACON IN RANGE')
      }
    } else if (beaconTarget) {
      const targetAngle = Math.atan2(beaconTarget.y - this.player.y, beaconTarget.x - this.player.x)
      this.autoNavHeading = angleLerp(this.autoNavHeading, targetAngle, clamp(dt * 1.9, 0, 0.24))
    } else if (!manualActive && level >= 5) {
      const pickup = this.bestNavigationPickup()
      if (pickup) {
        const targetAngle = Math.atan2(pickup.y - this.player.y, pickup.x - this.player.x)
        this.autoNavHeading = angleLerp(this.autoNavHeading, targetAngle, clamp(dt * 0.82, 0, 0.12))
      }
    }

    if (level >= 4) this.applyThreatWeave(dt, level)

    if (beaconTarget && !manualActive) {
      const beaconMove = returnBeaconAutopilotVector({
        dx: beaconTarget.x - this.player.x,
        dy: beaconTarget.y - this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        radius: beaconTarget.radius
      })
      if (Math.abs(beaconMove.x) + Math.abs(beaconMove.y) > 0.01) {
        this.autoNavHeading = Math.atan2(beaconMove.y, beaconMove.x)
      }
      return beaconMove
    }

    const cruise = navigationCruiseScalar({ navRank: this.build.nav, targetLocked: !!targetPlanet })
    const influence = manualActive ? 0.58 + level * 0.035 : 0
    const ghost = { x: Math.cos(this.autoNavHeading) * cruise, y: Math.sin(this.autoNavHeading) * cruise }
    if (!manualActive) return ghost
    const steered = { x: ghost.x + move.x * influence, y: ghost.y + move.y * influence }
    const magnitude = len(steered.x, steered.y)
    return magnitude > 1 ? { x: steered.x / magnitude, y: steered.y / magnitude } : steered
  }

  private navigationCruiseLevel() {
    return this.build.nav
  }

  private bestNavigationPickup() {
    let best: Pickup | null = null
    let bestScore = 0
    const reach = 760 + this.build.nav * 90 + this.build.magnet * 26
    const reach2 = reach * reach
    for (const pickup of this.pickups) {
      const d = dist2(pickup, this.player)
      if (d > reach2) continue
      const kindValue = pickup.kind === 'chest' ? 9 : pickup.kind === 'core' ? 7 : pickup.kind === 'repair' ? 5 : pickup.kind === 'magnet' ? 4 : 1
      const score = kindValue / Math.max(120, d)
      if (score > bestScore) {
        bestScore = score
        best = pickup
      }
    }
    return best
  }

  private updateReturnBeacon(dt: number) {
    if (this.state !== 'playing') return
    if (!this.returnBeacon && returnBeaconEligible({
      time: this.stats.time,
      planetsVisited: this.stats.planets,
      activeBeacon: false,
      nextBeaconAt: this.nextReturnBeaconAt
    })) {
      this.spawnReturnBeacon()
    }
    if (!this.returnBeacon) return
    this.returnBeacon.phase += dt
    this.returnBeacon.age += dt
    const distance = Math.sqrt(dist2(this.returnBeacon, this.player))
    if (this.returnBeacon.age > 22 && !this.returnBeacon.reminded) {
      this.returnBeacon.reminded = true
      this.toast('RETURN BEACON WAITING - TAP BEACON TO LOCK')
      this.audio.pickup('nav')
    }
    if (this.returnBeacon.age > 48 && !this.returnBeacon.assistTriggered && !this.autoNavTargetBeacon) {
      this.returnBeacon.assistTriggered = true
      this.autoNavTargetPlanetId = null
      this.autoNavTargetBeacon = true
      this.autoNavActive = true
      this.autoNavHeading = Math.atan2(this.returnBeacon.y - this.player.y, this.returnBeacon.x - this.player.x)
      this.toast('RECALL ROUTE SET - NUDGE AWAY TO SKIP')
      this.audio.pickup('nav')
    }
    if (distance > 2400) {
      this.skipReturnBeacon()
      return
    }
    if (distance < this.returnBeacon.radius) {
      this.returnBeacon.hold += dt
      if (this.returnBeacon.hold >= BEACON_HOLD_SECONDS) {
        this.finishRun(this.skippedReturnBeacons > 0 ? 'deepExtraction' : 'cleanExtraction')
        return
      }
    } else {
      this.returnBeacon.hold = Math.max(0, this.returnBeacon.hold - dt * 1.5)
    }
  }

  private spawnReturnBeacon() {
    const angle = this.player.angle + rand(-0.9, 0.9)
    const distance = beaconSpawnDistance(this.skippedReturnBeacons)
    this.returnBeacon = {
      x: this.player.x + Math.cos(angle) * distance,
      y: this.player.y + Math.sin(angle) * distance,
      radius: 96,
      hold: 0,
      phase: 0,
      age: 0,
      reminded: false,
      assistTriggered: false
    }
    this.toast('RETURN BEACON AVAILABLE - TAP BEACON TO LOCK')
    this.audio.pickup('nav')
  }

  private skipReturnBeacon() {
    if (!this.returnBeacon) return
    this.returnBeacon = null
    this.autoNavTargetBeacon = false
    this.skippedReturnBeacons += 1
    this.nextReturnBeaconAt = nextBeaconWindow(this.stats.time)
    this.toast('RETURN BEACON SKIPPED. DEEP EXTRACTION BONUS RISING.')
  }

  private lockReturnBeacon() {
    if (!this.returnBeacon) return false
    this.autoNavTargetPlanetId = null
    this.autoNavTargetBeacon = true
    this.autoNavActive = true
    this.autoNavHeading = Math.atan2(this.returnBeacon.y - this.player.y, this.returnBeacon.x - this.player.x)
    this.toast('RETURN BEACON LOCKED')
    this.audio.pickup('nav')
    return true
  }

  private applyThreatWeave(dt: number, level: number) {
    let ax = 0
    let ay = 0
    const radius = 230 + level * 38
    const radius2 = radius * radius
    for (const enemy of this.enemies) {
      const dx = this.player.x - enemy.x
      const dy = this.player.y - enemy.y
      const d = dx * dx + dy * dy
      if (d <= 1 || d > radius2) continue
      const weight = (enemy.kind === 'brute' || enemy.kind === 'warden' ? 1.45 : 1) * (1 - d / radius2)
      ax += (dx / Math.sqrt(d)) * weight
      ay += (dy / Math.sqrt(d)) * weight
    }
    if (Math.abs(ax) + Math.abs(ay) <= 0.02) return
    const avoidAngle = Math.atan2(ay, ax)
    this.autoNavHeading = angleLerp(this.autoNavHeading, avoidAngle, clamp(dt * (0.72 + level * 0.08), 0, 0.14))
  }

  private updateLanding(dt: number) {
    this.transitionTimer += dt
    this.toastTimer -= dt
    this.updateParticles(dt)
    this.updateCamera(dt)
    this.updateHud()
    if (this.transitionTimer >= this.transitionDuration) {
      this.transitionTimer = 0
      this.state = 'surface'
      this.toast('SURFACE TEAM DEPLOYED: COLLECT SIGNALS, RETURN TO SHIP')
    }
  }

  private updateTakeoff(dt: number) {
    this.transitionTimer += dt
    this.toastTimer -= dt
    this.updateParticles(dt)
    this.updateHud()
    if (this.transitionTimer >= this.transitionDuration * 0.5) this.snapToOrbitReturnPoint()
    if (this.transitionTimer >= this.transitionDuration) this.finishTakeoff()
  }

  private updateDying(dt: number) {
    this.deathTimer += dt
    this.toastTimer -= dt
    if (this.toastTimer <= 0) this.ui.toast.classList.remove('visible')
    this.player.vx *= Math.pow(0.02, dt)
    this.player.vy *= Math.pow(0.02, dt)
    this.player.x += this.player.vx * dt
    this.player.y += this.player.vy * dt
    this.camera.shake = Math.max(this.camera.shake, 18 * Math.max(0, 1 - this.deathTimer / 1.6))
    this.updateBullets(dt)
    this.updateEnemies(dt)
    this.updatePickups(dt)
    this.updateParticles(dt)
    this.updateOrbitals(dt)
    this.updateCamera(dt)
    this.updateHud()
    if (this.deathTimer >= 2.35) this.finishRun('destroyed')
  }

  private snapToOrbitReturnPoint() {
    if (!this.orbitReturnPoint) return
    this.player.x = this.orbitReturnPoint.x
    this.player.y = this.orbitReturnPoint.y
    this.player.vx = 0
    this.player.vy = 0
    const target = cameraTargetFor(this.player, this.width, this.height, this.spaceScale())
    this.camera.x = target.x
    this.camera.y = target.y
    this.updateSpaceChunks(true)
  }

  private updateSurface(dt: number) {
    if (!this.surface) return
    const input = this.getInput()
    this.stats.time += dt * 0.25
    this.toastTimer -= dt
    if (this.toastTimer <= 0) this.ui.toast.classList.remove('visible')
    this.surface.pilot.gunCd -= dt
    this.surface.pilot.invuln -= dt
    this.updateSurfaceOxygen(dt)
    if (this.state !== 'surface' || !this.surface) return

    const accel = 1080 * dt
    this.surface.pilot.vx += input.move.x * accel
    this.surface.pilot.vy += input.move.y * accel
    if (this.surface.o2Returning) {
      const toShip = norm(this.surface.ship.x - this.surface.pilot.x, this.surface.ship.y - this.surface.pilot.y)
      this.surface.pilot.vx += toShip.x * 1360 * dt
      this.surface.pilot.vy += toShip.y * 1360 * dt
      this.surface.pilot.facing = Math.atan2(toShip.y, toShip.x)
    }
    const speed = len(this.surface.pilot.vx, this.surface.pilot.vy)
    const maxSpeed = 178 + this.build.engine * 10
    if (speed > maxSpeed) {
      this.surface.pilot.vx = (this.surface.pilot.vx / speed) * maxSpeed
      this.surface.pilot.vy = (this.surface.pilot.vy / speed) * maxSpeed
    }
    this.surface.pilot.vx *= Math.pow(0.04, dt)
    this.surface.pilot.vy *= Math.pow(0.04, dt)
    this.surface.pilot.x = clamp(this.surface.pilot.x + this.surface.pilot.vx * dt, 40, this.surface.width - 40)
    this.surface.pilot.y = clamp(this.surface.pilot.y + this.surface.pilot.vy * dt, 40, this.surface.height - 40)
    if (Math.abs(input.move.x) + Math.abs(input.move.y) > 0.05) this.surface.pilot.facing = Math.atan2(input.move.y, input.move.x)

    if (this.surface.pilot.gunCd <= 0 && this.findSurfaceTarget()) this.fireSurfaceGun()
    this.collectSurfaceResources()
    this.updateSurfaceBullets(dt)
    this.updateSurfaceThreats(dt)

    const nearShip = Math.sqrt(dist2(this.surface.pilot, this.surface.ship)) < 64
    const lore = this.findNearbyLoreSite()
    const alien = this.findNearbyAlien()
    if (this.surface.o2Returning && nearShip) this.startTakeoff()
    else if (input.interact && lore) this.inspectLoreSite(lore)
    else if (input.interact && alien) this.openAlienEncounter(alien)
    else if (input.interact && nearShip) this.startTakeoff()
    if (this.surface.collected >= this.surface.resources.length && !nearShip) {
      this.surface.message = 'CACHE CLEARED. RETURN TO SHIP.'
    }

    this.surface.camera.x += (this.surface.pilot.x - this.width / 2 - this.surface.camera.x) * clamp(dt * 7, 0, 1)
    this.surface.camera.y += (this.surface.pilot.y - this.height / 2 - this.surface.camera.y) * clamp(dt * 7, 0, 1)
    this.surface.camera.x = clamp(this.surface.camera.x, 0, Math.max(0, this.surface.width - this.width))
    this.surface.camera.y = clamp(this.surface.camera.y, 0, Math.max(0, this.surface.height - this.height))

    this.updateParticles(dt)
    this.updateHud()
    if (this.player.hull <= 0) this.gameOver()
  }

  private updateSurfaceOxygen(dt: number) {
    if (!this.surface) return
    this.surface.pilot.oxygen = Math.max(0, this.surface.pilot.oxygen - dt)
    const low = this.surface.pilot.oxygen <= this.surface.pilot.maxOxygen * this.surfaceLowOxygenRatio()
    if (low && !this.surface.o2Returning) {
      this.surface.o2Returning = true
      this.surface.message = 'O2 LOW - RETURNING TO SHIP'
      this.toast('O2 LOW - RETURNING TO SHIP')
    }
    if (this.surface.pilot.oxygen <= 0) this.startTakeoff()
  }

  private getInput() {
    let mx = 0
    let my = 0
    if (this.keys.has('KeyA')) mx -= 1
    if (this.keys.has('KeyD')) mx += 1
    if (this.keys.has('KeyW')) my -= 1
    if (this.keys.has('KeyS')) my += 1
    if (this.touchStick.active) {
      const dx = this.touchStick.x - this.touchStick.startX
      const dy = this.touchStick.y - this.touchStick.startY
      const distance = Math.min(82, Math.hypot(dx, dy))
      const direction = Math.atan2(dy, dx)
      mx = Math.cos(direction) * (distance / 82)
      my = Math.sin(direction) * (distance / 82)
    }
    let aimX = 0
    let aimY = 0
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyJ')) aimX -= 1
    if (this.keys.has('ArrowRight') || this.keys.has('KeyL')) aimX += 1
    if (this.keys.has('ArrowUp') || this.keys.has('KeyI')) aimY -= 1
    if (this.keys.has('ArrowDown') || this.keys.has('KeyK')) aimY += 1
    let gamepadFire = false
    let gamepadDash = false
    const gamepad = navigator.getGamepads?.().find((pad): pad is Gamepad => Boolean(pad))
    if (gamepad) {
      const lx = this.deadzone(gamepad.axes[0] ?? 0)
      const ly = this.deadzone(gamepad.axes[1] ?? 0)
      const rx = this.deadzone(gamepad.axes[2] ?? 0)
      const ry = this.deadzone(gamepad.axes[3] ?? 0)
      if (Math.abs(lx) + Math.abs(ly) > 0) {
        mx = lx
        my = ly
      }
      if (Math.abs(rx) + Math.abs(ry) > 0) {
        aimX = rx
        aimY = ry
        gamepadFire = true
      }
      gamepadFire ||= (gamepad.buttons[7]?.value ?? 0) > 0.45 || !!gamepad.buttons[0]?.pressed
      gamepadDash ||= !!gamepad.buttons[1]?.pressed || !!gamepad.buttons[5]?.pressed
      if (gamepad.buttons[3]?.pressed) this.pressed.add('KeyE')
    }
    const moveActive = Math.abs(mx) + Math.abs(my) > 0.04
    const move = norm(mx, my)
    if (!moveActive) {
      move.x = 0
      move.y = 0
    }

    let aiming = Math.abs(aimX) + Math.abs(aimY) > 0
    let aimAngle = aiming ? Math.atan2(aimY, aimX) : this.player.aimAngle
    if (!aiming && this.mouse.down) {
      const world = this.screenToWorld(this.mouse.x, this.mouse.y)
      aimAngle = Math.atan2(world.y - this.player.y, world.x - this.player.x)
      aiming = true
    }
    let autoFire = false
    if (!aiming && this.state === 'playing') {
      const target = this.findAutoTarget()
      if (target) {
        aimAngle = Math.atan2(target.y - this.player.y, target.x - this.player.x)
        aiming = true
        autoFire = true
      }
    }
    return {
      move,
      moveActive,
      aiming,
      aimAngle,
      firing: this.keys.has('Space') || this.mouse.down || gamepadFire || aiming || autoFire || this.consumeMobileFire(),
      dash: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || gamepadDash || this.consumeMobileDash(),
      interact: this.consume('KeyE') || this.consume('Enter') || this.consumeMobileAction()
    }
  }

  private consumeMobileAction() {
    const queued = this.mobileActionQueued
    this.mobileActionQueued = false
    return queued
  }

  private consumeMobileDash() {
    const queued = this.mobileDashQueued
    this.mobileDashQueued = false
    return queued
  }

  private consumeMobileFire() {
    const queued = this.mobileFireQueued
    this.mobileFireQueued = false
    return queued
  }

  private findAutoTarget() {
    let best: Enemy | null = null
    let bestD = 900 * 900
    for (const enemy of this.enemies) {
      const d = (enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2
      if (d < bestD) {
        bestD = d
        best = enemy
      }
    }
    return best
  }

  private deadzone(v: number) {
    const z = 0.18
    if (Math.abs(v) < z) return 0
    return Math.sign(v) * ((Math.abs(v) - z) / (1 - z))
  }

  private consume(code: string) {
    const has = this.pressed.has(code)
    if (has) this.pressed.delete(code)
    return has
  }

  private deployMineWake(direction: Vec) {
    const level = this.build.mine
    if (level <= 0) return
    const evolved = this.evolved.has('mine')
    const count = Math.min(6, 1 + Math.ceil(level / 2) + (evolved ? 2 : 0))
    const side = { x: -direction.y, y: direction.x }
    for (let i = 0; i < count; i += 1) {
      if (this.bullets.length > MAX_BULLETS) this.bullets.shift()
      const offset = i - (count - 1) / 2
      this.bullets.push({
        x: this.player.x - direction.x * (28 + i * 8) + side.x * offset * 18,
        y: this.player.y - direction.y * (28 + i * 8) + side.y * offset * 18,
        vx: -direction.x * 24,
        vy: -direction.y * 24,
        life: 1.25 + level * 0.22 + (evolved ? 0.55 : 0),
        damage: 20 + level * 7 + this.limitBreaks.might * 1.5,
        radius: evolved ? 18 : 13,
        color: evolved ? '#fff27a' : '#70a8ff',
        pierce: evolved ? 5 : 2,
        mine: true
      })
    }
  }

  private fire() {
    if (this.bullets.length > MAX_BULLETS) this.bullets.splice(0, this.bullets.length - MAX_BULLETS)
    const rapid = this.build.rapid
    const choir = this.evolved.has('rapid')
    const shatter = this.evolved.has('split')
    const solar = this.evolved.has('rail')
    const resonance = this.evolved.has('echo')
    const storm = this.evolved.has('chain')
    const blackNeedle = this.evolved.has('rift')
    const glassRisk = this.relics.has('glassReactor') ? 1.12 : 1
    this.player.fireCd = clamp((0.18 - rapid * 0.014 - this.build.heat * 0.006 - this.limitBreaks.cooldown * 0.004) * (choir ? 0.88 : 1), 0.055, 0.18)
    const damage = (14 + this.stats.level * 0.65 + this.build.rail * 2 + this.build.rift * 2 + this.limitBreaks.might * 1.6) * glassRisk
    const speed = 780 + this.build.echo * 55 + this.build.heat * 18 + this.limitBreaks.speed * 14
    const count = 1 + this.build.split + (shatter ? 2 : 0) + Math.floor(this.limitBreaks.amount / 3)
    const spread = count === 1 ? 0 : clamp(0.12 + count * 0.035, 0.12, 0.31)
    const rail = this.build.rail > 0 && this.fireSerial % Math.max((solar ? 6 : 8) - this.build.rail, 3) === 0
    const needle = this.build.rift > 0 && this.fireSerial % Math.max((blackNeedle ? 9 : 12) - this.build.rift, 4) === 0
    const pulseColor = storm ? '#8fff7d' : choir ? '#f6fffe' : this.build.heat >= 3 ? '#ff9d5c' : this.build.pierce >= 3 ? '#70a8ff' : '#57fff3'
    const volleys = choir ? 2 : 1
    this.fireSerial += 1
    for (let v = 0; v < volleys; v += 1) {
      for (let i = 0; i < count; i += 1) {
        const offset = (count === 1 ? 0 : (i - (count - 1) / 2) * spread) + (volleys === 1 ? 0 : (v - 0.5) * 0.055)
        const a = this.player.aimAngle + offset
        this.bullets.push({
          x: this.player.x + Math.cos(a) * 22,
          y: this.player.y + Math.sin(a) * 22,
          vx: Math.cos(a) * speed + this.player.vx * 0.14,
          vy: Math.sin(a) * speed + this.player.vy * 0.14,
          life: rail ? 0.86 + (solar ? 0.28 : 0) : 0.62 + this.build.echo * 0.13 + (resonance ? 0.24 : 0),
          damage: rail ? damage * (solar ? 3.4 : 2.4) : damage * (shatter && i !== Math.floor(count / 2) ? 0.82 : 1),
          radius: rail ? (solar ? 7 : 5) : 3.5,
          color: rail ? '#fff27a' : needle ? '#b990ff' : pulseColor,
          pierce: rail ? 7 + this.build.pierce + (solar ? 5 : 0) : this.build.pierce + (resonance ? 1 : 0),
          rail,
          chain: this.build.chain + (storm ? 3 : 0)
        })
      }
    }
    if (needle) {
      const a = this.player.aimAngle
      this.bullets.push({
        x: this.player.x + Math.cos(a) * 24,
        y: this.player.y + Math.sin(a) * 24,
        vx: Math.cos(a) * (speed * 0.62),
        vy: Math.sin(a) * (speed * 0.62),
        life: 1.1,
        damage: damage * (blackNeedle ? 5.2 : 3.4),
        radius: blackNeedle ? 9 : 6,
        color: blackNeedle ? '#ffffff' : '#b990ff',
        pierce: 4 + this.build.rift + (blackNeedle ? 8 : 0),
        rail: true,
        chain: storm ? 2 : 0
      })
    }
    this.audio.fire(this.weaponSoundKind(rail, needle, count), this.stats.level + rapid)
  }

  private weaponSoundKind(rail: boolean, needle: boolean, count: number): WeaponSoundKind {
    if (needle) return 'needle'
    if (rail) return 'rail'
    if (count > 1 || this.build.split > 0) return 'prism'
    return 'pulse'
  }

  private updateBullets(dt: number) {
    this.rebuildEnemyGrid()
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const b = this.bullets[i]
      b.life -= dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.life <= 0 || Math.abs(b.x - this.player.x) > 1900 || Math.abs(b.y - this.player.y) > 1900) {
        this.bullets.splice(i, 1)
        continue
      }
      if (b.hostile) {
        const rr = this.player.radius + b.radius
        if ((this.player.x - b.x) ** 2 + (this.player.y - b.y) ** 2 < rr * rr) {
          this.damagePlayer(b.damage)
          this.bullets.splice(i, 1)
        }
        continue
      }
      const candidates = this.getNearbyEnemies(b.x, b.y)
      for (let j = candidates.length - 1; j >= 0; j -= 1) {
        const e = candidates[j]
        if (e.hp <= 0) continue
        if (Math.abs(e.x - b.x) > e.radius + b.radius || Math.abs(e.y - b.y) > e.radius + b.radius) continue
        const rr = e.radius + b.radius
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < rr * rr) {
          this.damageEnemy(e, b.damage, b.rail ? '#fff27a' : '#57fff3')
          if (b.chain && b.chain > 0) this.spawnChainBolt(b, e)
          if (b.mine) this.burst(b.x, b.y, b.color, this.evolved.has('mine') ? 10 : 5, 120)
          b.pierce -= 1
          if (b.pierce < 0) {
            this.bullets.splice(i, 1)
            break
          }
        }
      }
    }
  }

  private spawnChainBolt(source: Bullet, hit: Enemy) {
    if (this.bullets.length > MAX_BULLETS - 4) return
    let best: Enemy | null = null
    let bestD = (220 + this.build.chain * 26) ** 2
    for (const enemy of this.enemies) {
      if (enemy === hit || enemy.hp <= 0) continue
      const d = (enemy.x - hit.x) ** 2 + (enemy.y - hit.y) ** 2
      if (d < bestD) {
        bestD = d
        best = enemy
      }
    }
    if (!best) return
    const aim = norm(best.x - hit.x, best.y - hit.y)
    this.bullets.push({
      x: hit.x,
      y: hit.y,
      vx: aim.x * 960,
      vy: aim.y * 960,
      life: 0.16,
      damage: source.damage * (this.evolved.has('chain') ? 0.58 : 0.42),
      radius: 4,
      color: '#fff27a',
      pierce: 0,
      rail: true,
      chain: source.chain ? source.chain - 1 : 0
    })
  }

  private rebuildEnemyGrid() {
    this.enemyGrid.clear()
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue
      const key = this.gridKey(enemy.x, enemy.y)
      let bucket = this.enemyGrid.get(key)
      if (!bucket) {
        bucket = []
        this.enemyGrid.set(key, bucket)
      }
      bucket.push(enemy)
    }
  }

  private gridKey(x: number, y: number) {
    return Math.floor(x / GRID_CELL) * GRID_STRIDE + Math.floor(y / GRID_CELL)
  }

  private getNearbyEnemies(x: number, y: number) {
    const cx = Math.floor(x / GRID_CELL)
    const cy = Math.floor(y / GRID_CELL)
    const result = this.nearbyEnemyScratch
    result.length = 0
    for (let gx = cx - 1; gx <= cx + 1; gx += 1) {
      for (let gy = cy - 1; gy <= cy + 1; gy += 1) {
        const bucket = this.enemyGrid.get(gx * GRID_STRIDE + gy)
        if (bucket) result.push(...bucket)
      }
    }
    return result
  }

  private updateEnemies(dt: number) {
    const hunger = this.relics.has('hungryCompass') ? 1.08 : 1
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const e = this.enemies[i]
      e.phase += dt
      e.cd -= dt
      e.flash -= dt
      const toP = norm(this.player.x - e.x, this.player.y - e.y)
      if (e.kind === 'chaser' || e.kind === 'splinter') {
        e.vx += toP.x * e.speed * 3.4 * hunger * dt
        e.vy += toP.y * e.speed * 3.4 * hunger * dt
      } else if (e.kind === 'brute') {
        e.vx += toP.x * e.speed * 2.15 * hunger * dt
        e.vy += toP.y * e.speed * 2.15 * hunger * dt
      } else if (e.kind === 'shooter') {
        const d = Math.sqrt(dist2(e, this.player))
        const side = { x: -toP.y, y: toP.x }
        const rangePull = d > 560 ? 1 : d < 360 ? -1.35 : 0.1
        e.vx += (toP.x * rangePull * e.speed + side.x * e.speed * 0.55) * dt
        e.vy += (toP.y * rangePull * e.speed + side.y * e.speed * 0.55) * dt
        if (e.cd <= 0 && d < 760) {
          e.cd = clamp(2.35 - this.stats.time / 260, 1.35, 2.35)
          const spread = this.stats.time > 210 ? 0.18 : 0
          for (let shot = spread ? -1 : 0; shot <= (spread ? 1 : 0); shot += 1) {
            const a = Math.atan2(toP.y, toP.x) + shot * spread
            this.bullets.push({
              x: e.x + Math.cos(a) * e.radius,
              y: e.y + Math.sin(a) * e.radius,
              vx: Math.cos(a) * 310,
              vy: Math.sin(a) * 310,
              life: 1.8,
              damage: 10,
              radius: 4,
              color: '#ff61d8',
              pierce: 0,
              hostile: true
            })
          }
          this.burst(e.x, e.y, '#ff61d8', 5, 100)
        }
      } else if (e.kind === 'razor') {
        const sideSign = e.id % 2 === 0 ? 1 : -1
        const side = { x: -toP.y * sideSign, y: toP.x * sideSign }
        e.vx += (side.x * e.speed * 5.4 + toP.x * e.speed * 0.7) * dt
        e.vy += (side.y * e.speed * 5.4 + toP.y * e.speed * 0.7) * dt
        if (e.cd <= 0) {
          e.cd = 1.15
          e.vx += side.x * 220 + toP.x * 90
          e.vy += side.y * 220 + toP.y * 90
          this.emitEnemyTrail(e, '#57fff3', 2)
        }
      } else if (e.kind === 'skimmer') {
        const d = Math.sqrt(dist2(e, this.player))
        const sideSign = e.id % 2 === 0 ? 1 : -1
        const side = { x: -toP.y * sideSign, y: toP.x * sideSign }
        const rangePull = d > 650 ? 0.72 : d < 390 ? -1.15 : -0.04
        const wave = Math.sin(e.phase * 3.6) * e.speed * 0.35
        e.vx += (toP.x * rangePull * e.speed + side.x * e.speed * 1.28 + side.x * wave) * dt
        e.vy += (toP.y * rangePull * e.speed + side.y * e.speed * 1.28 + side.y * wave) * dt
        if (e.cd <= 0 && d < 840) {
          e.cd = clamp(2.15 - this.stats.time / 320, 1.35, 2.15)
          const baseAngle = Math.atan2(toP.y, toP.x)
          for (let shot = -1; shot <= 1; shot += 1) {
            const a = baseAngle + shot * 0.24
            this.bullets.push({
              x: e.x + Math.cos(a) * e.radius,
              y: e.y + Math.sin(a) * e.radius,
              vx: Math.cos(a) * 340,
              vy: Math.sin(a) * 340,
              life: 1.55,
              damage: 11,
              radius: 4.5,
              color: '#ffe66d',
              pierce: 0,
              hostile: true
            })
          }
          this.burst(e.x, e.y, '#ffe66d', 6, 120)
        }
      } else if (e.kind === 'bulwark') {
        const d = Math.sqrt(dist2(e, this.player))
        const side = { x: -toP.y, y: toP.x }
        const rangePull = d > 620 ? 0.95 : d < 460 ? -1.25 : -0.1
        const drift = Math.sin(e.phase * 1.6 + e.id) * e.speed * 0.65
        e.vx += (toP.x * rangePull * e.speed + side.x * drift) * dt
        e.vy += (toP.y * rangePull * e.speed + side.y * drift) * dt
        if (e.cd <= 0 && d < 900) {
          e.cd = 1.55
          for (let k = 0; k < 10; k += 1) {
            const a = (k / 10) * TAU + e.phase * 0.55
            this.bullets.push({
              x: e.x + Math.cos(a) * e.radius,
              y: e.y + Math.sin(a) * e.radius,
              vx: Math.cos(a) * 235,
              vy: Math.sin(a) * 235,
              life: 1.45,
              damage: 9,
              radius: 4,
              color: '#f46cff',
              pierce: 0,
              hostile: true
            })
          }
          this.burst(e.x, e.y, '#f46cff', 10, 150)
        }
      } else if (e.kind === 'lancer') {
        const d = Math.sqrt(dist2(e, this.player))
        if (e.cd <= 0 && d < 520) {
          e.vx = toP.x * (520 + this.stats.time * 1.2)
          e.vy = toP.y * (520 + this.stats.time * 1.2)
          e.cd = 2.2
          this.burst(e.x, e.y, '#fff27a', 8, 120)
        } else {
          e.vx += Math.sin(e.phase * 3) * 14 * dt
          e.vy += Math.cos(e.phase * 2.5) * 14 * dt
        }
      } else if (e.kind === 'mine') {
        e.vx += Math.sin(e.phase * 2.1) * 28 * dt
        e.vy += Math.cos(e.phase * 1.7) * 28 * dt
        if (Math.sqrt(dist2(e, this.player)) < 74) {
          this.damagePlayer(23)
          this.killEnemy(e, false)
          continue
        }
      } else if (e.kind === 'warden') {
        const d = Math.sqrt(dist2(e, this.player))
        e.vx += toP.x * (d > 380 ? 120 : -70) * dt
        e.vy += toP.y * (d > 380 ? 120 : -70) * dt
        if (e.cd <= 0) {
          e.cd = 1.2
          for (let k = 0; k < 12; k += 1) {
            const a = (k / 12) * TAU + e.phase
            this.bullets.push({
              x: e.x + Math.cos(a) * e.radius,
              y: e.y + Math.sin(a) * e.radius,
              vx: Math.cos(a) * 260,
              vy: Math.sin(a) * 260,
              life: 1.2,
              damage: 8,
              radius: 4,
              color: '#ff5d73',
              pierce: 0,
              hostile: true
            })
          }
        }
      }
      const max = e.kind === 'razor' ? 690 : e.kind === 'lancer' ? 460 : e.kind === 'brute' ? e.speed * 0.84 : e.speed
      const s = len(e.vx, e.vy)
      if (s > max) {
        e.vx = (e.vx / s) * max
        e.vy = (e.vy / s) * max
      }
      e.vx *= Math.pow(0.2, dt)
      e.vy *= Math.pow(0.2, dt)
      e.x += e.vx * dt
      e.y += e.vy * dt
      if (isSpriteEnemyKind(e.kind)) this.emitEnemyTrail(e, e.color, e.kind === 'razor' ? 1.6 : 1)

      const rr = e.radius + this.player.radius
      if (dist2(e, this.player) < rr * rr) {
        this.damagePlayer(e.kind === 'warden' ? 24 : e.kind === 'bulwark' ? 22 : e.kind === 'brute' ? 19 : e.kind === 'razor' ? 17 : 13)
        if (e.kind === 'brute' || e.kind === 'bulwark') {
          e.vx -= toP.x * 260
          e.vy -= toP.y * 260
        } else if (e.kind !== 'warden') this.killEnemy(e, false)
      }
    }
  }

  private updatePickups(dt: number) {
    const magnetInput = {
      magnetLevel: this.build.magnet,
      limitMagnet: this.limitBreaks.magnet,
      hasHungryCompass: this.relics.has('hungryCompass')
    }
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const p = this.pickups[i]
      p.life -= dt
      const d = Math.sqrt(dist2(p, this.player))
      const magnet = pickupMagnetRange(p.kind, magnetInput)
      if (d < magnet || p.kind === 'magnet') {
        const pull = norm(this.player.x - p.x, this.player.y - p.y)
        const strength = pickupMagnetStrength(p.kind)
        p.vx += pull.x * strength * dt
        p.vy += pull.y * strength * dt
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= Math.pow(0.08, dt)
      p.vy *= Math.pow(0.08, dt)
      const rr = p.radius + this.player.radius + 6
      if (d < rr || p.life <= 0) {
        if (d < rr) this.collect(p)
        this.pickups.splice(i, 1)
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i -= 1) {
      const w = this.shockwaves[i]
      w.life -= dt
      w.radius += w.speed * dt
      if (w.life <= 0) this.shockwaves.splice(i, 1)
    }
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i]
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.angle = (p.angle ?? 0) + (p.spin ?? 0) * dt
      p.vx *= Math.pow(0.12, dt)
      p.vy *= Math.pow(0.12, dt)
      if (p.life <= 0) this.particles.splice(i, 1)
    }
  }

  private emitEnemyTrail(e: Enemy, color: string, intensity = 1) {
    if (this.isHighLoad() || this.particles.length >= MAX_PARTICLES) return
    const speed = Math.hypot(e.vx, e.vy)
    if (speed < 85 || Math.random() > 0.42 * intensity) return
    const back = norm(-e.vx, -e.vy)
    const side = { x: -back.y, y: back.x }
    const spread = e.kind === 'bulwark' ? 18 : e.kind === 'skimmer' ? 13 : 8
    const life = e.kind === 'razor' ? 0.34 : 0.46
    this.particles.push({
      x: e.x + back.x * e.radius * 0.75 + side.x * rand(-spread, spread),
      y: e.y + back.y * e.radius * 0.75 + side.y * rand(-spread, spread),
      vx: back.x * rand(30, 90) + side.x * rand(-24, 24),
      vy: back.y * rand(30, 90) + side.y * rand(-24, 24),
      life,
      maxLife: life,
      color,
      size: e.kind === 'bulwark' ? rand(3, 7) : rand(2, 5),
      angle: Math.atan2(e.vy, e.vx),
      spin: rand(-2, 2),
      sides: e.kind === 'bulwark' ? 4 : undefined,
      length: e.kind === 'razor' ? rand(34, 68) : rand(20, 44),
      glow: this.allowGlow() ? 28 : 14
    })
  }

  private updateOrbitals(dt: number) {
    const count = this.build.orbit
    if (count <= 0) return
    const radius = 66 + count * 8
    const gravity = this.evolved.has('orbit')
    const damage = (18 + count * 5 + this.limitBreaks.might * 1.4) * (gravity ? 1.35 : 1) * dt
    for (const e of this.enemies) {
      if (gravity && (e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2 < (radius + 90) ** 2) {
        const pull = norm(this.player.x - e.x, this.player.y - e.y)
        e.vx += pull.x * 28 * dt
        e.vy += pull.y * 28 * dt
      }
      for (let i = 0; i < count; i += 1) {
        const a = this.stats.time * (2.4 + count * 0.18) + (i / count) * TAU
        const x = this.player.x + Math.cos(a) * radius
        const y = this.player.y + Math.sin(a) * radius
        const rr = e.radius + 12
        if ((e.x - x) ** 2 + (e.y - y) ** 2 < rr * rr) this.damageEnemy(e, damage, '#8fff7d')
      }
    }
  }

  private updateSpawning() {
    this.recycleDistantEnemies()
    this.reinforceQuietField()
    const pressure = this.stats.time / 60
    if (this.spawnTimer <= 0) {
      this.spawnTimer = clamp(0.62 - pressure * 0.045 - this.stats.planets * 0.025, 0.12, 0.62)
      const pack = 1 + Math.floor(pressure * 0.65) + (Math.random() < 0.2 ? 2 : 0)
      const room = Math.max(0, MAX_ENEMIES - this.enemies.length)
      for (let i = 0; i < Math.min(pack, room); i += 1) this.spawnEnemy(this.pickEnemyKind())
    }
    if (this.bossTimer <= 0) {
      this.bossTimer = clamp(95 - this.stats.time / 7, 46, 95)
      this.spawnEnemy('warden')
      if (this.stats.time > 180 && this.enemies.length < MAX_ENEMIES - 2) this.spawnEnemy(Math.random() < 0.55 ? 'brute' : 'shooter')
      this.toast('WARDEN VECTOR ENTERING THE FIELD')
    }
    if (this.chestTimer <= 0) {
      this.chestTimer = 38 + Math.random() * 20
      const p = this.randomNearPlayer(680, 980)
      this.pickups.push({ kind: 'chest', x: p.x, y: p.y, vx: 0, vy: 0, value: 1, radius: 16, life: 999, color: '#fff27a' })
      this.toast('A TREASURE CORE IS BROADCASTING NEARBY')
    }
  }

  private recycleDistantEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (shouldRecycleEnemy(this.enemies[i], this.player, ENEMY_RECYCLE_RADIUS)) this.enemies.splice(i, 1)
    }
  }

  private reinforceQuietField() {
    const pressure = this.stats.time / 60
    const nearby = this.countNearbyEnemies(ENEMY_PRESSURE_RADIUS)
    const targetNearbyEnemies = clamp(7 + Math.floor(pressure * 0.9) + this.stats.planets, 7, 18)
    const maxPack = clamp(3 + Math.floor(pressure * 0.4), 3, 7)
    const room = Math.max(0, MAX_ENEMIES - this.enemies.length)
    const pack = Math.min(room, pressurePackSize({ nearbyEnemies: nearby, targetNearbyEnemies, maxPack }))
    for (let i = 0; i < pack; i += 1) this.spawnEnemy(this.pickEnemyKind())
  }

  private countNearbyEnemies(radius: number) {
    const r2 = radius * radius
    let count = 0
    for (const enemy of this.enemies) {
      if (dist2(enemy, this.player) <= r2) count += 1
    }
    return count
  }

  private pickEnemyKind(): EnemyKind {
    const t = this.stats.time
    const r = Math.random()
    if (t > 270 && r < 0.07) return 'bulwark'
    if (t > 205 && r < 0.18) return 'razor'
    if (t > 165 && r < 0.29) return 'skimmer'
    if (t > 180 && r < 0.39) return 'brute'
    if (t > 120 && r < 0.49) return 'shooter'
    if (t > 100 && r < 0.58) return 'mine'
    if (t > 55 && r < 0.7) return 'lancer'
    if (t > 25 && r < 0.82) return 'splinter'
    return 'chaser'
  }

  private spawnEnemy(kind: EnemyKind) {
    if (this.enemies.length >= MAX_ENEMIES) return
    const p = spaceEnemySpawnPoint(kind, this.player, 620, 980)
    const scale = 1.12 + this.stats.time / 200 + this.stats.planets * 0.1
    const base = spaceEnemyDefinitions[kind]
    this.enemies.push({
      id: this.enemyId++,
      kind,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      hp: base.hp * scale,
      maxHp: base.hp * scale,
      radius: base.r,
      speed: base.speed + this.stats.time * 0.3,
      value: Math.floor(base.value * scale),
      phase: Math.random() * TAU,
      cd: Math.random() * 2,
      color: base.color,
      flash: 0
    })
  }

  private randomNearPlayer(minR: number, maxR: number): Vec {
    const a = Math.random() * TAU
    const r = rand(minR, maxR)
    return {
      x: this.player.x + Math.cos(a) * r,
      y: this.player.y + Math.sin(a) * r
    }
  }

  private damageEnemy(e: Enemy, amount: number, color: string) {
    e.hp -= amount
    e.flash = 0.05
    if (!this.isHighLoad() && this.particles.length < MAX_PARTICLES && Math.random() < 0.2) {
      this.particles.push({ x: e.x, y: e.y, vx: rand(-80, 80), vy: rand(-80, 80), life: 0.22, maxLife: 0.22, color, size: 2, glow: 10 })
    }
    if (e.hp <= 0) this.killEnemy(e, true)
  }

  private killEnemy(e: Enemy, reward: boolean) {
    this.removeEnemy(e)
    const big = e.kind === 'warden' || e.kind === 'brute' || e.kind === 'bulwark'
    const highLoad = this.isHighLoad()
    if (big || !highLoad || this.collisionFxCooldown <= 0) {
      this.audio.boom(big ? 'heavy' : 'small')
      this.camera.shake = Math.max(this.camera.shake, big ? 16 : highLoad ? 2 : 5)
      this.burst(e.x, e.y, e.color, big ? 42 : highLoad ? 4 : 12, big ? 330 : highLoad ? 120 : 150)
      this.collisionFxCooldown = highLoad ? 0.04 : 0
    }
    if (reward) {
      this.stats.kills += 1
      this.stats.score += e.value
      const xpCount = e.kind === 'warden' ? 9 : e.kind === 'bulwark' ? 5 : e.kind === 'brute' ? 3 : e.kind === 'razor' || e.kind === 'skimmer' || e.kind === 'shooter' || e.kind === 'lancer' ? 2 : 1
      const xpDrops = highLoad && e.kind !== 'warden' ? 1 : xpCount
      const xpValue = e.kind === 'warden' ? 8 : e.kind === 'bulwark' ? 5 : e.kind === 'brute' ? 4 : highLoad ? 3 * xpCount : 3
      for (let i = 0; i < xpDrops; i += 1) this.drop('xp', e.x, e.y, xpValue)
      if (e.kind === 'warden') this.drop('chest', e.x, e.y, 1)
      if (e.kind === 'splinter' && this.enemies.length < MAX_ENEMIES - 3 && Math.random() < 0.55) {
        for (let k = 0; k < 3; k += 1) {
          const child = this.spawnChild(e.x, e.y)
          this.enemies.push(child)
        }
      }
      if (Math.random() < 0.03 + this.build.vampire * 0.025) this.drop('repair', e.x, e.y, 14)
      if (Math.random() < 0.008 + this.stats.time / 50000) this.drop('magnet', e.x, e.y, 1)
    }
  }

  private removeEnemy(e: Enemy) {
    const idx = this.enemies.indexOf(e)
    if (idx < 0) return
    const last = this.enemies.pop()
    if (last && idx < this.enemies.length) this.enemies[idx] = last
  }

  private spawnChild(x: number, y: number): Enemy {
    const a = Math.random() * TAU
    return {
      id: this.enemyId++,
      kind: 'chaser',
      x: x + Math.cos(a) * 24,
      y: y + Math.sin(a) * 24,
      vx: Math.cos(a) * 160,
      vy: Math.sin(a) * 160,
      hp: 12 + this.stats.time / 18,
      maxHp: 12 + this.stats.time / 18,
      radius: 10,
      speed: 185,
      value: 3,
      phase: Math.random() * TAU,
      cd: 0,
      color: '#70a8ff',
      flash: 0
    }
  }

  private damagePlayer(amount: number) {
    if (this.state === 'surface' && this.surface) {
      this.damageSurfacePilot(amount)
      return
    }
    if (this.player.invuln > 0) return
    this.player.invuln = 0.42
    this.player.shieldDelay = 2.4
    let remaining = Math.max(1, amount * (1 - this.build.phase * 0.08))
    if (this.player.shield > 0) {
      const used = Math.min(this.player.shield, remaining)
      this.player.shield -= used
      remaining -= used
    }
    this.player.hull -= remaining
    this.audio.hit()
    this.camera.shake = Math.max(this.camera.shake, 12)
    this.burst(this.player.x, this.player.y, '#ff5d73', 16, 210)
  }

  private damageSurfacePilot(amount: number) {
    if (!this.surface || this.surface.pilot.invuln > 0) return
    const pilot = this.surface.pilot
    pilot.invuln = 0.65
    pilot.health = Math.max(0, pilot.health - Math.max(1, amount * (1 - this.build.phase * 0.05)))
    this.audio.hit()
    this.camera.shake = Math.max(this.camera.shake, 10)
    this.burst(pilot.x, pilot.y, '#ff5d73', 12, 180)
    if (pilot.health <= 0) {
      this.surface.message = 'SUIT CRITICAL - RETURNING TO SHIP'
      this.toast('SUIT CRITICAL - RETURNING TO SHIP')
      this.startTakeoff()
    }
  }

  private drop(kind: PickupKind, x: number, y: number, value: number) {
    if (kind === 'xp' && this.isHighLoad()) {
      for (const pickup of this.pickups) {
        if (pickup.kind !== 'xp') continue
        const dx = pickup.x - x
        const dy = pickup.y - y
        if (dx * dx + dy * dy > 120 * 120) continue
        pickup.value += value
        pickup.life = Math.max(pickup.life, 22)
        pickup.radius = clamp(pickup.radius + 0.65, 8, 18)
        pickup.vx += rand(-18, 18)
        pickup.vy += rand(-18, 18)
        return
      }
    }
    if (this.pickups.length >= MAX_PICKUPS) {
      const xpIndex = this.pickups.findIndex((pickup) => pickup.kind === 'xp')
      if (xpIndex >= 0) this.pickups.splice(xpIndex, 1)
      else this.pickups.shift()
    }
    const a = Math.random() * TAU
    const speed = rand(80, 220)
    const color = kind === 'xp' ? '#57fff3' : kind === 'repair' ? '#8fff7d' : kind === 'chest' ? '#fff27a' : '#b990ff'
    this.pickups.push({ kind, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, value, radius: kind === 'chest' ? 16 : 8, life: kind === 'xp' ? 42 : 999, color })
  }

  private collect(p: Pickup) {
    this.audio.pickup(p.kind)
    if (p.kind === 'xp') {
      this.stats.xp += p.value
      this.stats.score += p.value
      while (this.stats.xp >= this.stats.nextXp) {
        this.stats.xp -= this.stats.nextXp
        this.stats.level += 1
        this.stats.nextXp = Math.floor(this.stats.nextXp * 1.18 + 11)
        this.bankUpgrade('MUTATION SIGNAL BANKED. LAND TO INSTALL IT.')
      }
    } else if (p.kind === 'repair') {
      this.player.hull = clamp(this.player.hull + p.value, 0, this.player.maxHull)
    } else if (p.kind === 'magnet') {
      for (const drop of this.pickups) drop.life = Math.max(drop.life, 2)
      this.build.magnet = clamp(this.build.magnet + 1, 0, upgrades.find((u) => u.id === 'magnet')!.max)
      this.toast('SIGNAL MAGNET TEMPORARILY OVERCHARGED')
    } else if (p.kind === 'chest') {
      this.bankUpgrade('TREASURE CORE BANKED. INSTALL IT WHEN YOU BOARD.')
      this.stats.score += 250 + this.stats.level * 35
    }
  }

  private bankUpgrade(message?: string) {
    this.pendingUpgrades += 1
    if (message) this.toast(message)
  }

  private openLevelUp(title = 'SHIPBOARD WORKBENCH', copy = 'Spend one banked mutation signal before takeoff.', rare = false) {
    this.state = 'levelup'
    this.audio.level()
    this.workbenchInstalling = false
    this.workbenchView = 'upgrades'
    const benchTier = this.mothership.departments.workbench
    const fourthChoiceChance = 0.08 + this.build.luck * 0.08 + (benchTier >= 2 ? 0.08 : 0)
    const count = 3 + (rare || Math.random() < fourthChoiceChance ? 1 : 0)
    this.upgradeChoices = this.rollUpgrades(count, rare)
    this.renderLevelUp(title, copy)
  }

  private openChest() {
    this.bankUpgrade('TREASURE CORE BANKED. INSTALL IT WHEN YOU BOARD.')
    this.stats.score += 250 + this.stats.level * 35
  }

  private rollUpgrades(count: number, rare = false): WorkbenchChoice[] {
    const choices: WorkbenchChoice[] = []
    const evo = this.availableEvolutions()
    if (evo.length && (rare || Math.random() < 0.55 + this.build.luck * 0.06)) {
      choices.push({ kind: 'evolution', evolution: evo[Math.floor(Math.random() * evo.length)] })
    }
    const relic = this.rollRelicChoice(rare)
    if (relic && choices.length < count) choices.push({ kind: 'relic', relic })
    const available = upgrades.filter((u) => this.build[u.id] < u.max && !choices.some((choice) => choice.kind === 'upgrade' && choice.upgrade.id === u.id))
    while (choices.length < count && available.length) {
      const selected = this.weightedUpgrade(available, rare)
      choices.push({ kind: 'upgrade', upgrade: selected })
      available.splice(available.indexOf(selected), 1)
    }
    while (choices.length < count) choices.push(this.rollLimitBreak())
    return choices
  }

  private weightedUpgrade(pool: Upgrade[], rare: boolean) {
    const benchTier = this.mothership.departments.workbench
    const ownedBias = 1.55 + this.build.luck * 0.08 + (benchTier >= 3 ? 0.2 : 0)
    const rareBias = rare ? 0.72 : 1
    const weights = pool.map((upgrade) => {
      const owned = this.build[upgrade.id] > 0
      const weaponFocus = upgrade.category === 'weapon' ? 1.08 : 1
      return Math.max(1, upgrade.rarity * (owned ? ownedBias : 1) * weaponFocus * (upgrade.rarity < 60 ? rareBias : 1))
    })
    let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0)
    for (let i = 0; i < pool.length; i += 1) {
      roll -= weights[i]
      if (roll <= 0) return pool[i]
    }
    return pool[pool.length - 1]
  }

  private rollRelicChoice(rare: boolean): Relic | null {
    const missing = relics.filter((relic) => !this.relics.has(relic.id))
    if (!missing.length) return null
    const chance = (rare ? 0.2 : 0.04) + this.build.luck * 0.025 + this.build.survey * 0.018
    if (Math.random() > chance) return null
    let roll = Math.random() * missing.reduce((sum, relic) => sum + relic.rarity, 0)
    for (const relic of missing) {
      roll -= relic.rarity
      if (roll <= 0) return relic
    }
    return missing[0]
  }

  private rollLimitBreak(): WorkbenchChoice {
    const options: Array<{ id: LimitId; name: string; description: string }> = [
      { id: 'might', name: 'Limit: Might', description: '+3% weapon damage. Stacks forever.' },
      { id: 'cooldown', name: 'Limit: Cooldown', description: '-0.4% weapon cooldown. Stacks forever.' },
      { id: 'amount', name: 'Limit: Amount', description: 'Every third rank adds another prism ray.' },
      { id: 'speed', name: 'Limit: Velocity', description: '+2% projectile speed. Stacks forever.' },
      { id: 'magnet', name: 'Limit: Magnet', description: '+4% pickup reach. Stacks forever.' },
      { id: 'hull', name: 'Limit: Hull', description: '+3 max hull and a small repair.' }
    ]
    return { kind: 'limit', ...options[Math.floor(Math.random() * options.length)] }
  }

  private availableEvolutions() {
    return evolutions.filter((evolution) => this.build[evolution.weapon] >= upgrades.find((upgrade) => upgrade.id === evolution.weapon)!.max && this.relics.has(evolution.relic) && !this.evolved.has(evolution.weapon))
  }

  private applyWorkbenchChoice(choice: WorkbenchChoice) {
    this.workbenchInstalling = false
    if (!this.canApplyWorkbenchChoice(choice)) {
      this.toast('SIGNAL REJECTED: SYSTEM ALREADY MAXED')
      this.openLevelUp('SHIPBOARD WORKBENCH', `${this.pendingUpgrades} mutation signal${this.pendingUpgrades === 1 ? '' : 's'} remain before takeoff.`)
      return
    }
    if (choice.kind === 'upgrade') this.applyUpgrade(choice.upgrade)
    else if (choice.kind === 'evolution') this.applyEvolution(choice.evolution)
    else if (choice.kind === 'relic') this.acquireRelic(choice.relic, 'WORKBENCH RELIC INSTALLED')
    else this.applyLimitBreak(choice)
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1)
    if (this.pendingUpgrades > 0) {
      this.openLevelUp('SHIPBOARD WORKBENCH', `${this.pendingUpgrades} mutation signal${this.pendingUpgrades === 1 ? '' : 's'} remain before takeoff.`)
      return
    }
    this.showOnly(null)
    if (this.takeoffAfterWorkbench) {
      this.takeoffAfterWorkbench = false
      this.startTakeoff()
    } else {
      this.state = 'playing'
    }
  }

  private applyUpgrade(upgrade: Upgrade) {
    const nextLevel = Math.min(this.build[upgrade.id] + 1, upgrade.max)
    if (nextLevel === this.build[upgrade.id]) {
      this.toast(`${upgrade.name.toUpperCase()} ALREADY MAXED`)
      return
    }
    this.build[upgrade.id] = nextLevel
    if (upgrade.id === 'engine') this.player.speed += 18
    if (upgrade.id === 'nav') {
      this.autoNavActive = true
      this.autoNavHeading = len(this.player.vx, this.player.vy) > 20 ? Math.atan2(this.player.vy, this.player.vx) : this.player.angle
      if (nextLevel === 1) this.toast('NAV GHOST TUNED TO YOUR DRIFT')
    }
    if (upgrade.id === 'shield') {
      this.player.maxShield += 18
      this.player.shield = this.player.maxShield
    }
    if (upgrade.id === 'repair') {
      this.player.maxHull += 18
      this.player.hull = this.player.maxHull
    }
    if (upgrade.id === 'suitHealth' && this.surface) {
      this.surface.pilot.maxHealth = this.surfaceMaxHealth()
      this.surface.pilot.health = this.surface.pilot.maxHealth
    }
    if (upgrade.id === 'suitO2' && this.surface) {
      this.surface.pilot.maxOxygen = this.surfaceMaxOxygen()
      this.surface.pilot.oxygen = this.surface.pilot.maxOxygen
    }
    if (upgrade.id === 'magnet') this.stats.score += 60
    this.camera.shake = Math.max(this.camera.shake, upgrade.category === 'weapon' ? 7 : 5)
    const anchor = this.fxAnchor()
    const color = this.upgradeFxColor(upgrade)
    this.upgradeSurge(anchor.x, anchor.y, color, upgrade.category === 'weapon' ? '#ffffff' : '#d7fff7', upgrade.category === 'weapon' ? 1.1 : 0.92)
    this.toast(`${upgrade.name.toUpperCase()} ONLINE`)
  }

  private applyEvolution(evolution: Evolution) {
    this.evolved.add(evolution.weapon)
    this.audio.level()
    this.camera.shake = Math.max(this.camera.shake, 12)
    const anchor = this.fxAnchor()
    this.upgradeSurge(anchor.x, anchor.y, '#fff27a', '#ffffff', 1.75)
    this.toast(`${evolution.name.toUpperCase()} EVOLVED`)
  }

  private acquireRelic(relic: Relic, message = 'PLANET RELIC FOUND') {
    if (this.relics.has(relic.id)) {
      this.resources.cores += 1
      this.stats.score += 250
      this.toast('DUPLICATE RELIC CONVERTED TO CORE')
      return
    }
    this.relics.add(relic.id)
    this.recordArtifact({
      id: `relic:${relic.id}`,
      kind: 'relic',
      title: relic.name,
      detail: relic.description,
      source: message,
      color: this.artifactColor('relic', relic.id),
      icon: hashString(relic.id, 41) % 12
    })
    this.stats.score += 500 + this.relics.size * 120
    this.audio.level()
    const anchor = this.fxAnchor()
    this.upgradeSurge(anchor.x, anchor.y, '#fff27a', '#b990ff', 1.25)
    this.toast(`${message}: ${relic.name.toUpperCase()}`)
  }

  private applyLimitBreak(choice: Extract<WorkbenchChoice, { kind: 'limit' }>) {
    this.limitBreaks[choice.id] += 1
    if (choice.id === 'hull') {
      this.player.maxHull += 3
      this.player.hull = clamp(this.player.hull + 10, 0, this.player.maxHull)
    }
    const anchor = this.fxAnchor()
    this.upgradeSurge(anchor.x, anchor.y, '#70a8ff', '#d7fff7', 0.72)
    this.toast(choice.name.toUpperCase())
  }

  private fxAnchor(): Vec {
    return this.surface?.ship ?? this.player
  }

  private upgradeFxColor(upgrade: Upgrade) {
    if (upgrade.category === 'weapon') return '#57fff3'
    return {
      weapons: '#57fff3',
      navigation: '#70a8ff',
      survival: '#8fff7d',
      economy: '#fff27a',
      planetcraft: '#fff27a',
      spacesuit: '#70a8ff',
      control: '#b990ff'
    }[upgrade.bucket] ?? '#8fff7d'
  }

  private upgradeSurge(x: number, y: number, color: string, accent: string, intensity: number) {
    const baseCount = Math.floor(18 + intensity * 18)
    const baseSpeed = 190 + intensity * 85
    this.burst(x, y, color, baseCount, baseSpeed)
    if (intensity > 0.9) this.burst(x, y, accent, Math.floor(baseCount * 0.45), baseSpeed * 0.72)
    const spokes = Math.floor(8 + intensity * 6)
    const ring = 30 + intensity * 18
    for (let i = 0; i < spokes; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift()
      const a = (i / spokes) * TAU + rand(-0.08, 0.08)
      const speed = rand(baseSpeed * 0.62, baseSpeed * 1.25)
      const life = rand(0.45, 0.82 + intensity * 0.12)
      this.particles.push({
        x: x + Math.cos(a) * ring,
        y: y + Math.sin(a) * ring,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        color: i % 3 === 0 ? accent : color,
        size: rand(2.5, 6 + intensity * 4),
        angle: a,
        spin: rand(-10, 10),
        sides: i % 2 ? 4 : 3,
        glow: this.allowGlow() ? 34 : 16
      })
    }
    if (this.shockwaves.length < MAX_SHOCKWAVES) {
      this.shockwaves.push({
        x,
        y,
        radius: 24 + intensity * 10,
        speed: 150 + intensity * 70,
        life: 0.5 + intensity * 0.12,
        maxLife: 0.5 + intensity * 0.12,
        color: accent,
        jag: rand(0, TAU)
      })
    }
  }

  private recordPlanetArtifact(planet: Planet, source: string) {
    this.recordArtifact({
      id: `planet:${planet.id}`,
      kind: 'planet',
      title: planet.name,
      detail: planet.reward,
      source: `${source} // ${planet.archetype.toUpperCase()}`,
      color: planet.color,
      icon: hashString(planet.id, 19) % 12
    })
  }

  private tryLand() {
    if (this.player.landedCd > 0) return
    const planet = this.planets.find((p) => Math.sqrt(dist2(p, this.player)) < p.radius + 86)
    if (!planet) {
      if (this.lockReturnBeacon()) return
      if (this.build.nav >= 3) {
        const target = this.nearestPlanetBeacon()
        if (target) {
          this.autoNavTargetPlanetId = target.id
          this.autoNavActive = true
          this.autoNavHeading = Math.atan2(target.y - this.player.y, target.x - this.player.x)
          this.toast(`NAV GHOST LOCKED: ${target.name}`)
          this.audio.pickup('nav')
          return
        }
      }
      this.toast('NO LANDING BEACON IN RANGE')
      return
    }
    this.startLanding(planet)
  }

  private nearestPlanetBeacon() {
    let best: Planet | null = null
    let bestD = Number.POSITIVE_INFINITY
    for (const planet of this.planets) {
      const d = dist2(planet, this.player)
      if (d < bestD) {
        bestD = d
        best = planet
      }
    }
    return best
  }

  private startLanding(planet: Planet) {
    this.state = 'landing'
    this.planetChoice = planet
    this.autoNavTargetPlanetId = null
    this.orbitReturnPoint = { x: this.player.x, y: this.player.y }
    this.transitionTimer = 0
    this.transitionDuration = 1.35
    this.showOnly(null)
    this.audio.land()
    this.audio.planetSignal(planet.archetype)
    this.surface = this.createSurfaceRun(planet)
    this.player.vx *= 0.1
    this.player.vy *= 0.1
    this.toast(`DESCENDING TO ${planet.name}`)
  }

  private createSurfaceRun(planet: Planet): SurfaceRun {
    const resources: SurfaceResource[] = []
    const pilot = {
      x: 840,
      y: 660,
      vx: 0,
      vy: 0,
      facing: 0,
      gunCd: 0,
      invuln: 0,
      health: this.surfaceMaxHealth(),
      maxHealth: this.surfaceMaxHealth(),
      oxygen: this.surfaceMaxOxygen(),
      maxOxygen: this.surfaceMaxOxygen()
    }
    const ship = { x: 780, y: 590 }
    const threatKeepouts = this.surfaceThreatKeepouts(pilot, ship)
    const first = !planet.visited
    const profile = planSurfaceEncounter({
      planetArchetype: planet.archetype,
      firstRunLanding: this.visitedPlanets.size === 0 && this.stats.planets === 0,
      firstVisitToPlanet: first,
      interest: this.surfaceInterest(),
      time: this.stats.time,
      luck: this.build.luck,
      survey: this.build.survey,
      random: Math.random
    })
    const event = profile.event
    const scenario = profile.scenario
    const count = profile.resourceCount
    for (let i = 0; i < count; i += 1) {
      const kindRoll = Math.random()
      const kind: SurfaceResourceKind =
        i === 0 && first ? 'cache' :
        event === 'horde' && i < 5 ? 'cache' :
        event === 'relic' && i < 3 ? 'cache' :
        event === 'jackpot' && kindRoll < 0.16 ? 'cache' :
        event === 'horde' && kindRoll < 0.2 ? 'cache' :
        event === 'repair' && kindRoll < 0.55 ? 'repair' :
        event === 'volatile' && kindRoll < 0.24 ? 'cache' :
        kindRoll < 0.58 ? 'crystal' :
        kindRoll < 0.84 ? 'scrap' :
        'repair'
      const color = kind === 'cache' ? '#fff27a' : kind === 'crystal' ? planet.color : kind === 'scrap' ? '#70a8ff' : '#8fff7d'
      const cluster = this.surfaceSafePoint(this.surfaceEventPoint(event, i, count), kind === 'cache' ? 240 : 210)
      resources.push({
        kind,
        x: cluster.x,
        y: cluster.y,
        radius: kind === 'cache' ? 18 : 12,
        value: kind === 'crystal' ? (event === 'horde' ? 18 : event === 'jackpot' ? 12 : 8) : kind === 'scrap' ? (event === 'horde' ? 260 : event === 'jackpot' ? 165 : 120) : kind === 'repair' ? (event === 'repair' ? 28 : 18) : 1,
        color,
        collected: false
      })
    }
    const threats: SurfaceThreat[] = []
    const threatCount = profile.threatCount + (planet.name === 'NULL CATHEDRAL' && event !== 'horde' ? 1 : 0)
    for (let i = 0; i < threatCount; i += 1) {
      threats.push(this.createGenericSurfaceThreat(planet, event, i, threatCount, threatKeepouts))
    }
    for (let i = 0; i < profile.bossCount; i += 1) {
      threats.push(this.createPlanetBossThreat(planet, scenario === 'mixed' || scenario === 'horde', threatKeepouts))
    }
    if (profile.bossCount === 0 && (scenario === 'boss' || scenario === 'mixed')) {
      threats.push(this.createPlanetBossThreat(planet, scenario === 'mixed', threatKeepouts))
    } else if (event === 'volatile' && first && Math.random() < 0.18) {
      threats.push(this.createGlassMiteOracleThreat(threatKeepouts))
    }
    const aliens = this.createSurfaceAliens(planet, event, threatCount, scenario, profile.alienCount)
    const loreSites = this.createSurfaceLoreSites(planet, scenario, event, profile.loreSiteCount)
    return {
      planet,
      event,
      scenario,
      width: 1600,
      height: 1180,
      pilot,
      ship,
      camera: { x: 0, y: 0 },
      resources,
      threats,
      bullets: [],
      aliens,
      loreSites,
      collected: 0,
      pendingUpgrade: false,
      bossCacheCount: profile.bossCacheCount,
      o2Returning: false,
      message: this.surfaceEventMessage(event, first, scenario)
    }
  }

  private surfaceInterest() {
    return clamp(this.stats.time / 420 + this.stats.planets * 0.075 + this.stats.level * 0.012, 0, 1)
  }

  private surfaceMaxHealth() {
    return 86 + this.build.suitHealth * 18
  }

  private surfaceMaxOxygen() {
    return 42 + this.build.suitO2 * 14
  }

  private surfaceLowOxygenRatio() {
    return this.build.suitO2 >= 3 ? 0.12 : 0.18
  }

  private surfaceGunDamage() {
    return 18 + this.build.suitBlaster * 4
  }

  private surfaceGunCooldown() {
    return clamp(0.22 - this.build.suitBlaster * 0.014, 0.14, 0.22)
  }

  private surfaceGunSpeed() {
    return 540 + this.build.suitBlaster * 40
  }

  private surfaceThreatKeepouts(pilot: Vec, ship: Vec) {
    return [
      { x: pilot.x, y: pilot.y, radius: 26 },
      { x: ship.x, y: ship.y, radius: 34 }
    ]
  }

  private safeSurfaceThreatPoint(candidate: Vec, keepouts: ReturnType<VectorShooter['surfaceThreatKeepouts']>, clearance = 120, fallbackAngle = 0) {
    return surfaceThreatSpawnPoint(candidate, keepouts, { minX: 40, maxX: 1560, minY: 40, maxY: 1140 }, clearance, fallbackAngle)
  }

  private createGenericSurfaceThreat(planet: Planet, event: SurfaceEventKind, i: number, total: number, keepouts: ReturnType<VectorShooter['surfaceThreatKeepouts']>): SurfaceThreat {
    const a = (i / Math.max(1, total)) * TAU + rand(-0.25, 0.25)
    const r = event === 'horde' ? rand(240, 620) : event === 'swarm' ? rand(260, 520) : rand(120, 440)
    const point = this.safeSurfaceThreatPoint({
      x: 800 + Math.cos(a) * r,
      y: 590 + Math.sin(a) * r
    }, keepouts, event === 'swarm' || event === 'horde' ? 150 : 132, a)
    return {
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      hp: event === 'horde' ? 16 + this.stats.time * 0.08 : event === 'swarm' ? 20 + this.stats.time * 0.12 : planet.name === 'NULL CATHEDRAL' ? 46 : 28,
      radius: event === 'horde' ? 12 : event === 'swarm' ? 13 : planet.name === 'NULL CATHEDRAL' ? 22 : 16,
      phase: rand(0, TAU),
      color: event === 'horde' ? '#ff61d8' : planet.name === 'RED MERCY' || planet.name === 'NULL CATHEDRAL' ? '#ff5d73' : '#fff27a',
      hit: 0
    }
  }

  private createPlanetBossThreat(planet: Planet, crowded: boolean, keepouts: ReturnType<VectorShooter['surfaceThreatKeepouts']>): SurfaceThreat {
    const seed = hashString(planet.id, this.stats.planets + Math.floor(this.stats.time / 60))
    const row = seed % BOSS_CATALOG_ROWS
    const angle = ((seed >>> 4) / 0xfffffff) * TAU
    const distance = crowded ? rand(280, 420) : rand(170, 320)
    const point = this.safeSurfaceThreatPoint({
      x: 800 + Math.cos(angle) * distance,
      y: 590 + Math.sin(angle) * distance
    }, keepouts, 170, angle)
    return {
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      hp: 120 + this.stats.time * 0.36 + this.stats.level * 6,
      radius: 42,
      phase: rand(0, TAU),
      color: ['#57fff3', '#fff27a', '#8fff7d', '#ff61d8', '#d7fff7'][row],
      hit: 0,
      sprite: 'bossCatalog',
      spriteRow: row,
      boss: true
    }
  }

  private createGlassMiteOracleThreat(keepouts: ReturnType<VectorShooter['surfaceThreatKeepouts']>): SurfaceThreat {
    const point = this.safeSurfaceThreatPoint({ x: rand(990, 1080), y: rand(760, 880) }, keepouts, 150, Math.PI * 0.25)
    return {
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      hp: 70 + this.stats.time * 0.18,
      radius: 32,
      phase: rand(0, TAU),
      color: '#57fff3',
      hit: 0,
      sprite: 'glassMiteOracle'
    }
  }

  private createSurfaceAliens(planet: Planet, event: SurfaceEventKind, threatCount: number, scenario: SurfaceScenarioKind, forcedCount?: number): SurfaceAlien[] {
    if (forcedCount === 0) return []
    const quiet = threatCount === 0
    const chance =
      scenario === 'friendly' ? 1 :
      scenario === 'mixed' ? 0.62 + this.surfaceInterest() * 0.24 :
      event === 'swarm' ? 0.06 :
      event === 'volatile' ? 0.22 :
      event === 'repair' ? 0.72 :
      event === 'standard' ? 0.58 :
      event === 'relic' ? 0.46 :
      0.28
    if (forcedCount === undefined && Math.random() > chance + (quiet ? 0.18 : 0)) return []
    const colors = ['#b990ff', '#fff27a', '#57fff3', '#8fff7d']
    const names = ['THE GLASS HERBALIST', 'A STATIC PILGRIM', 'THE COIN KEEPER', 'THE STAR MAPMAKER', 'THE RELIC MONK']
    const gifts: AlienGiftKind[] = ['herb', 'idol', 'map', 'coin']
    const row = hashString(planet.id, Math.floor(this.stats.time) + 17) % ALIEN_CATALOG_ROWS
    return [{
      x: rand(260, 1340),
      y: rand(210, 960),
      radius: 28,
      phase: rand(0, TAU),
      color: colors[row % colors.length],
      name: names[row],
      gift: gifts[Math.floor(Math.random() * gifts.length)],
      resolved: false,
      sprite: 'alienCatalog',
      spriteRow: row
    }]
  }

  private createSurfaceLoreSites(planet: Planet, scenario: SurfaceScenarioKind, event: SurfaceEventKind, forcedCount?: number): SurfaceLoreSite[] {
    if (forcedCount === 0) return []
    if (forcedCount === undefined && scenario !== 'lore' && event !== 'relic' && planet.archetype !== 'strange') return []
    const count = forcedCount ?? (scenario === 'lore' ? 2 + Math.floor(Math.random() * 3) : Math.random() < 0.34 ? 1 : 0)
    const sites: SurfaceLoreSite[] = []
    const library = this.loreLibrary(planet)
    for (let i = 0; i < count; i += 1) {
      const entry = library[(hashString(planet.id, i + this.stats.planets * 11) + i) % library.length]
      const a = (i / Math.max(1, count)) * TAU + rand(-0.42, 0.42)
      const point = this.surfaceSafePoint({ x: 800 + Math.cos(a) * rand(260, 520), y: 590 + Math.sin(a) * rand(220, 420) }, 260)
      sites.push({
        x: point.x,
        y: point.y,
        radius: entry.kind === 'pyramid' ? 36 : 30,
        phase: rand(0, TAU),
        kind: entry.kind,
        title: entry.title,
        copy: entry.copy,
        resolved: false
      })
    }
    return sites
  }

  private loreLibrary(planet: Planet): Array<Pick<SurfaceLoreSite, 'kind' | 'title' | 'copy'>> {
    const name = planet.name
    return [
      {
        kind: 'fossils',
        title: 'FOSSIL BED',
        copy: `The fossils are arranged in spirals, not by tide but by ritual. Whatever lived on ${name} learned to count the stars before it learned to leave.`
      },
      {
        kind: 'pyramid',
        title: 'VECTOR PYRAMID',
        copy: `The pyramid has no entrance, only a black seam humming under the dust. Your suit translates one repeated phrase: "We aimed the sky at ourselves."`
      },
      {
        kind: 'grave',
        title: 'GLASS GRAVES',
        copy: `Each grave marker contains a tiny preserved storm. The names are gone, but the weather inside them still remembers the dead.`
      },
      {
        kind: 'machine',
        title: 'SLEEPING MACHINE',
        copy: `A buried engine ticks once when your shadow crosses it. It is still waiting for pilots who became fossils long before your species had radios.`
      },
      {
        kind: 'choir',
        title: 'BONE CHOIR',
        copy: `Rib-like arches vibrate when you walk between them. The song is only two notes, but your ship answers from orbit.`
      }
    ]
  }

  private surfaceEventPoint(event: SurfaceEventKind, i: number, count: number): Vec {
    if (event === 'jackpot') {
      const a = (i / count) * TAU * 3
      const r = 60 + i * 8
      return { x: clamp(800 + Math.cos(a) * r + rand(-18, 18), 110, 1490), y: clamp(590 + Math.sin(a) * r + rand(-18, 18), 110, 1070) }
    }
    if (event === 'horde') {
      const a = (i / Math.max(1, count)) * TAU * 2.4
      const r = 120 + i * 7
      return { x: clamp(800 + Math.cos(a) * r + rand(-32, 32), 120, 1480), y: clamp(590 + Math.sin(a) * r + rand(-32, 32), 120, 1060) }
    }
    if (event === 'swarm') {
      return { x: rand(220, 1380), y: rand(190, 990) }
    }
    if (event === 'repair') {
      return { x: rand(560, 1040), y: rand(400, 780) }
    }
    if (event === 'relic') {
      const a = (i / Math.max(1, count)) * TAU
      return { x: clamp(800 + Math.cos(a) * rand(80, 360), 130, 1470), y: clamp(590 + Math.sin(a) * rand(80, 360), 130, 1050) }
    }
    return { x: rand(180, 1420), y: rand(170, 1010) }
  }

  private surfaceSafePoint(point: Vec, minDistance = 210): Vec {
    const ship = { x: 780, y: 590 }
    const pilot = { x: 840, y: 660 }
    let x = clamp(point.x, 110, 1490)
    let y = clamp(point.y, 110, 1070)
    for (let pass = 0; pass < 3; pass += 1) {
      for (const anchor of [ship, pilot]) {
        const dx = x - anchor.x
        const dy = y - anchor.y
        const distance = Math.hypot(dx, dy)
        if (distance >= minDistance) continue
        const angle = distance > 1 ? Math.atan2(dy, dx) : rand(0, TAU)
        const push = minDistance + rand(18, 96)
        x = clamp(anchor.x + Math.cos(angle) * push, 110, 1490)
        y = clamp(anchor.y + Math.sin(angle) * push, 110, 1070)
      }
    }
    return { x, y }
  }

  private surfaceEventMessage(event: SurfaceEventKind, first: boolean, scenario?: SurfaceScenarioKind) {
    if (scenario === 'lore') return 'QUIET RUINS BELOW. INSPECT THE OLD SIGNALS.'
    if (scenario === 'boss') return 'LARGE BIO-SIGNAL BELOW. KILL IT OR RUN.'
    if (scenario === 'friendly') return 'SINGLE LIFEFORM HAILING YOUR SUIT. APPROACH CAREFULLY.'
    if (scenario === 'mixed') return 'WEIRD SURFACE. CONTACTS AND A RARE SIGNAL SHARE THE SAME GROUND.'
    if (scenario === 'horde') return 'HORDE VAULT BELOW. SURVIVE IT AND THE TREASURE BREAKS OPEN.'
    if (event === 'jackpot') return 'SIGNAL JACKPOT. GRAB EVERYTHING.'
    if (event === 'horde') return 'HORDE VAULT. THE LOOT IS REAL. SO ARE THEY.'
    if (event === 'swarm') return 'BAD PLANET. CONTACTS EVERYWHERE.'
    if (event === 'relic') return 'RELIC SIGNATURES BELOW. CACHE HUNT.'
    if (event === 'repair') return 'QUIET DOCK. PATCH UP AND SCAVENGE.'
    if (event === 'volatile') return 'VOLATILE CACHE FIELD. EXPECT TROUBLE.'
    return first ? 'UNKNOWN SURFACE. MINE THE SIGNAL CACHE.' : 'OLD LANDING SITE. QUICK SALVAGE ONLY.'
  }

  private confirmLanding() {
    if (!this.planetChoice) return
    const p = this.planetChoice
    const first = !p.visited
    p.visited = true
    this.visitedPlanets.add(p.id)
    this.stats.planets = this.visitedPlanets.size
    this.stats.score += first ? 900 + this.stats.planets * 300 : 120
    if (first) this.recordPlanetArtifact(p, 'Docked from orbit')
    this.player.hull = clamp(this.player.hull + (first ? 45 : 14), 0, this.player.maxHull)
    if (p.name === 'NULL CATHEDRAL' && first) this.spawnEnemy('warden')
    if (p.name === 'SAINT STATIC' && first) this.drop('chest', p.x, p.y, 1)
    if (p.name === 'GREEN CHOIR' && first) {
      this.build.shield = clamp(this.build.shield + 1, 0, 5)
      this.player.maxShield += 22
      this.player.shield = this.player.maxShield
    }
    this.player.landedCd = 2.2
    this.state = 'playing'
    this.toast(first ? `${p.name}: ${p.reward.toUpperCase()}` : `${p.name}: QUIET DOCKING COMPLETE`)
    if (first) this.openLevelUp()
    else this.showOnly(null)
  }

  private collectSurfaceResources() {
    if (!this.surface) return
    for (const resource of this.surface.resources) {
      if (resource.collected) continue
      const rr = resource.radius + 18
      if ((resource.x - this.surface.pilot.x) ** 2 + (resource.y - this.surface.pilot.y) ** 2 > rr * rr) continue
      resource.collected = true
      this.surface.collected += 1
      this.audio.pickup(resource.kind)
      this.burst(resource.x, resource.y, resource.color, resource.kind === 'cache' ? 22 : 10, resource.kind === 'cache' ? 240 : 140)
      if (resource.kind === 'crystal') {
        const gained = Math.ceil(resource.value * (1 + this.build.cargo * 0.15))
        this.resources.crystal += gained
        this.stats.xp += resource.value
        this.stats.score += resource.value * 12
        while (this.stats.xp >= this.stats.nextXp) {
          this.stats.xp -= this.stats.nextXp
          this.stats.level += 1
          this.stats.nextXp = Math.floor(this.stats.nextXp * 1.18 + 11)
          this.surface.pendingUpgrade = true
          this.bankUpgrade()
        }
      } else if (resource.kind === 'scrap') {
        const gained = Math.ceil(resource.value * (1 + this.build.cargo * 0.15))
        this.resources.scrap += gained
        this.stats.score += gained
      } else if (resource.kind === 'repair') {
        const surfaceRepair = resource.value * (1 + this.build.suitHealth * 0.15)
        this.surface.pilot.health = clamp(this.surface.pilot.health + surfaceRepair, 0, this.surface.pilot.maxHealth)
      } else if (resource.kind === 'cache') {
        this.resolvePlanetCache(resource)
      }
    }
  }

  private resolvePlanetCache(resource: SurfaceResource) {
    if (!this.surface) return
    this.recordArtifact({
      id: `cache:${this.surface.planet.id}:${Math.round(resource.x)}:${Math.round(resource.y)}`,
      kind: 'cache',
      title: 'Surface Cache',
      detail: `${this.surface.event.toUpperCase()} cache cracked open.`,
      source: this.surface.planet.name,
      color: this.artifactColor('cache', `${this.surface.planet.id}:${resource.x}:${resource.y}`),
      icon: hashString(`${this.surface.planet.id}:${resource.x}:${resource.y}`, 67) % 12
    })
    const luck = this.build.luck * 0.06 + this.build.survey * 0.035
    const cargoBonus = 1 + this.build.cargo * 0.15
    this.stats.score += Math.floor((450 + this.stats.level * 45) * (1 + this.build.cargo * 0.06))
    this.resources.scrap += Math.ceil(rand(10, 24) * cargoBonus)
    this.resources.crystal += Math.ceil(rand(3, 9) * cargoBonus)
    this.resources.cores += 1 + (this.build.cargo >= 2 ? 1 : 0)
    const missingRelics = relics.filter((relic) => !this.relics.has(relic.id))
    const relicChance = 0.18 + luck
    const extraSignalChance = 0.38 + luck
    if (missingRelics.length && Math.random() < relicChance) {
      const relic = missingRelics[Math.floor(Math.random() * missingRelics.length)]
      this.acquireRelic(relic)
      this.surface.message = `${relic.name.toUpperCase()} RECOVERED. GET BACK TO THE SHIP.`
    } else {
      this.surface.pendingUpgrade = true
      this.bankUpgrade()
      this.surface.message = 'MUTATION CACHE SECURED. GET BACK TO THE SHIP.'
    }
    if (Math.random() < extraSignalChance) {
      this.surface.pendingUpgrade = true
      this.bankUpgrade('BONUS MUTATION SIGNAL FOUND IN CACHE')
    }
    const cacheMessage = this.surface.message
    const ambushChance = Math.max(0.08, 0.28 - this.build.survey * 0.04 + (this.relics.has('staticIdol') ? 0.06 : 0))
    if (Math.random() < ambushChance) {
      const keepouts = this.surfaceThreatKeepouts(this.surface.pilot, this.surface.ship)
      for (let i = 0; i < 2 + Math.floor(this.stats.time / 90); i += 1) {
        const point = this.safeSurfaceThreatPoint({
          x: resource.x + rand(-180, 180),
          y: resource.y + rand(-180, 180)
        }, keepouts, 132, rand(0, TAU))
        this.surface.threats.push({
          x: point.x,
          y: point.y,
          vx: 0,
          vy: 0,
          hp: 24 + this.stats.time * 0.25,
          radius: 14,
          phase: Math.random() * TAU,
          color: '#ff5d73',
          hit: 0
        })
      }
      this.surface.message = `${cacheMessage} CACHE WAS WIRED.`
    }
  }

  private updateSurfaceThreats(dt: number) {
    if (!this.surface) return
    for (let i = this.surface.threats.length - 1; i >= 0; i -= 1) {
      const threat = this.surface.threats[i]
      threat.phase += dt
      threat.hit -= dt
      const toPilot = norm(this.surface.pilot.x - threat.x, this.surface.pilot.y - threat.y)
      const accel = threat.boss ? 230 : 360
      const maxSpeed = threat.boss ? 70 : 92
      threat.vx += toPilot.x * accel * dt
      threat.vy += toPilot.y * accel * dt
      const speed = len(threat.vx, threat.vy)
      if (speed > maxSpeed) {
        threat.vx = (threat.vx / speed) * maxSpeed
        threat.vy = (threat.vy / speed) * maxSpeed
      }
      threat.vx *= Math.pow(0.16, dt)
      threat.vy *= Math.pow(0.16, dt)
      threat.x = clamp(threat.x + threat.vx * dt, 40, this.surface.width - 40)
      threat.y = clamp(threat.y + threat.vy * dt, 40, this.surface.height - 40)
      const rr = threat.radius + 13
      if ((threat.x - this.surface.pilot.x) ** 2 + (threat.y - this.surface.pilot.y) ** 2 < rr * rr && this.surface.pilot.invuln <= 0) {
        this.damagePlayer(threat.boss ? 16 : 9)
        this.burst(this.surface.pilot.x, this.surface.pilot.y, '#ff5d73', 10, 160)
      }
      if (threat.hp <= 0) {
        this.burst(threat.x, threat.y, threat.color, threat.boss ? 42 : 24, threat.boss ? 360 : 260)
        this.audio.boom(threat.boss ? 'heavy' : 'surface')
        this.stats.score += threat.boss ? 1200 : 160
        if (threat.boss) this.dropSurfaceBossCache(threat)
        this.surface.threats.splice(i, 1)
      }
    }
  }

  private dropSurfaceBossCache(threat: SurfaceThreat) {
    if (!this.surface) return
    const count = this.surface.bossCacheCount
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * TAU + rand(-0.2, 0.2)
      const r = rand(22, 96)
      const point = this.surfaceSafePoint({ x: threat.x + Math.cos(a) * r, y: threat.y + Math.sin(a) * r }, 190)
      this.surface.resources.push({
        kind: i < 2 && this.surface.scenario === 'horde' ? 'cache' : i === 0 ? 'cache' : Math.random() < 0.65 ? 'crystal' : 'scrap',
        x: point.x,
        y: point.y,
        radius: i === 0 ? 18 : 12,
        value: i === 0 ? 1 : this.surface.scenario === 'horde' ? (i % 2 ? 22 + this.stats.level : 300 + this.stats.level * 12) : i % 2 ? 12 + this.stats.level : 150 + this.stats.level * 8,
        color: i === 0 ? '#fff27a' : i % 2 ? threat.color : '#70a8ff',
        collected: false
      })
    }
    this.surface.message = this.surface.scenario === 'horde' ? 'HORDE VAULT DEFEATED. MASSIVE TREASURE SPILLED.' : 'BOSS SIGNAL BROKE OPEN. RICH CACHE SPILLED.'
    this.camera.shake = Math.max(this.camera.shake, 10)
  }

  private findNearbyAlien() {
    if (!this.surface) return null
    return this.surface.aliens.find((alien) => !alien.resolved && Math.sqrt(dist2(alien, this.surface!.pilot)) < alien.radius + 34) ?? null
  }

  private findNearbyLoreSite() {
    if (!this.surface) return null
    return this.surface.loreSites.find((site) => !site.resolved && Math.sqrt(dist2(site, this.surface!.pilot)) < site.radius + 30) ?? null
  }

  private inspectLoreSite(site: SurfaceLoreSite) {
    if (!this.surface || site.resolved) return
    this.state = 'lore'
    site.resolved = true
    this.surface.message = `${site.title}: ${site.copy}`
    const score = 260 + this.stats.level * 35
    this.stats.score += score
    this.resources.crystal += 1
    this.recordArtifact({
      id: `lore:${this.surface.planet.id}:${site.title}`,
      kind: 'lore',
      title: site.title,
      detail: site.copy,
      source: this.surface.planet.name,
      color: this.artifactColor('lore', `${this.surface.planet.id}:${site.kind}`),
      icon: hashString(`${site.kind}:${site.title}`, 31) % 12
    })
    let decodedSignal = false
    if (Math.random() < 0.18 + this.build.survey * 0.04) {
      this.surface.pendingUpgrade = true
      this.bankUpgrade('OLD SIGNAL DECODED: MUTATION SIGNAL BANKED')
      decodedSignal = true
    } else {
      this.toast(`${site.title} INSPECTED`)
    }
    this.audio.level()
    this.burst(site.x, site.y, '#d7fff7', 18, 210)
    this.surface.pilot.vx = 0
    this.surface.pilot.vy = 0
    this.ui.planet.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = site.title
    const copy = document.createElement('p')
    copy.className = 'copy'
    copy.textContent = site.copy
    const reward = document.createElement('p')
    reward.className = 'copy'
    reward.textContent = decodedSignal ? `Recovered 1 crystal, ${score} score, and a mutation signal.` : `Recovered 1 crystal and ${score} score.`
    const row = document.createElement('div')
    row.className = 'button-row'
    const close = document.createElement('button')
    close.className = 'vector-button'
    close.textContent = 'Continue'
    close.addEventListener('click', () => {
      this.state = 'surface'
      this.showOnly(null)
    })
    row.append(close)
    panel.append(h, copy, reward, row)
    this.ui.planet.append(panel)
    this.showOnly('planet')
  }

  private openAlienEncounter(alien: SurfaceAlien) {
    if (!this.surface || alien.resolved) return
    this.state = 'alien'
    this.alienChoice = alien
    this.surface.pilot.vx = 0
    this.surface.pilot.vy = 0
    this.ui.planet.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = alien.name
    const copy = document.createElement('p')
    copy.className = 'copy'
    copy.textContent = this.alienOfferCopy(alien)
    const row = document.createElement('div')
    row.className = 'button-row'
    const take = document.createElement('button')
    take.className = 'vector-button'
    take.textContent = 'Take Gift'
    take.addEventListener('click', () => this.resolveAlienGift(true))
    const leave = document.createElement('button')
    leave.className = 'vector-button secondary'
    leave.textContent = 'Leave It'
    leave.addEventListener('click', () => this.resolveAlienGift(false))
    row.append(take, leave)
    panel.append(h, copy, row)
    this.ui.planet.append(panel)
    this.showOnly('planet')
  }

  private alienOfferCopy(alien: SurfaceAlien) {
    return {
      herb: 'It unfolds a luminous herb in both hands. The suit reads medicine, poison, and prayer in equal measure.',
      idol: 'It offers a tiny idol made of cooled lightning. The object is either a charm or a trap pretending to be polite.',
      map: 'It draws a living map in the dust. The route keeps changing when you blink.',
      coin: 'It flips a black coin into the air and waits for your glove to open.'
    }[alien.gift]
  }

  private resolveAlienGift(take: boolean) {
    if (!this.surface || !this.alienChoice) return
    const alien = this.alienChoice
    alien.resolved = true
    this.alienChoice = null
    this.recordArtifact({
      id: `alien:${this.surface.planet.id}:${alien.name}:${alien.gift}`,
      kind: 'alien',
      title: alien.name,
      detail: `${take ? 'Accepted' : 'Refused'} ${alien.gift.toUpperCase()} gift.`,
      source: this.surface.planet.name,
      color: alien.color,
      icon: hashString(`${alien.name}:${alien.gift}`, 53) % 12
    })
    this.state = 'surface'
    this.showOnly(null)
    if (!take) {
      this.surface.message = `${alien.name} FADES WITHOUT OFFENCE.`
      this.toast('ALIEN GIFT REFUSED')
      return
    }
    const luck = this.build.luck * 0.04 + this.build.survey * 0.025
    const good = Math.random() < 0.62 + luck
    if (good) this.applyGoodAlienGift(alien)
    else this.applyBadAlienGift(alien)
  }

  private applyGoodAlienGift(alien: SurfaceAlien) {
    if (!this.surface) return
    if (alien.gift === 'herb') {
      this.player.hull = clamp(this.player.hull + 34, 0, this.player.maxHull)
      this.resources.crystal += 4
      this.surface.message = 'THE HERB IS SWEET. HULL KNITS SHUT.'
    } else if (alien.gift === 'idol') {
      const missingRelics = relics.filter((relic) => !this.relics.has(relic.id))
      if (missingRelics.length && Math.random() < 0.45 + this.build.luck * 0.04) {
        this.acquireRelic(missingRelics[Math.floor(Math.random() * missingRelics.length)], 'ALIEN ARTEFACT CLAIMED')
        this.surface.message = 'THE IDOL OPENS INTO A RARE ARTEFACT.'
      } else {
        this.bankUpgrade('ALIEN IDOL BANKED A MUTATION SIGNAL')
        this.resources.cores += 1
        this.surface.message = 'THE IDOL HUMS IN TUNE WITH THE SHIP.'
      }
    } else if (alien.gift === 'map') {
      this.build.survey = clamp(this.build.survey + 1, 0, upgrades.find((u) => u.id === 'survey')?.max ?? 6)
      this.stats.score += 650
      this.surface.message = 'THE MAP BURNS A BETTER PLANET SENSE INTO YOUR HUD.'
    } else {
      this.resources.scrap += 180
      this.resources.cores += 1
      this.stats.score += 900
      this.surface.message = 'THE COIN LANDS EDGE-UP. IMPOSSIBLE. PROFITABLE.'
    }
    this.audio.pickup('gift')
    this.burst(alien.x, alien.y, alien.color, 22, 220)
    this.toast('ALIEN GIFT ACCEPTED')
  }

  private applyBadAlienGift(alien: SurfaceAlien) {
    if (!this.surface) return
    if (alien.gift === 'herb') {
      this.damagePlayer(18)
      this.surface.message = 'THE HERB BITES BACK. YOUR SUIT HATES IT.'
    } else if (alien.gift === 'idol') {
      this.damagePlayer(9)
      for (let i = 0; i < 3; i += 1) {
        this.surface.threats.push({
          x: clamp(alien.x + rand(-150, 150), 60, this.surface.width - 60),
          y: clamp(alien.y + rand(-150, 150), 60, this.surface.height - 60),
          vx: 0,
          vy: 0,
          hp: 22 + this.stats.time * 0.1,
          radius: 13,
          phase: rand(0, TAU),
          color: '#ff5d73',
          hit: 0
        })
      }
      this.surface.message = 'THE IDOL OPENS. SMALL HUNGRY THINGS FALL OUT.'
    } else if (alien.gift === 'map') {
      this.resources.crystal = Math.max(0, this.resources.crystal - 8)
      this.surface.message = 'THE MAP IS A MOUTH. IT EATS YOUR CRYSTALS.'
    } else {
      this.resources.scrap = Math.max(0, this.resources.scrap - 120)
      this.damagePlayer(12)
      this.surface.message = 'THE COIN LANDS ON A SIDE YOU DO NOT HAVE.'
    }
    this.audio.boom('surface')
    this.burst(alien.x, alien.y, '#ff5d73', 24, 240)
    this.toast('ALIEN GIFT WAS BAD')
  }

  private updateSurfaceBullets(dt: number) {
    if (!this.surface) return
    for (let i = this.surface.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.surface.bullets[i]
      bullet.life -= dt
      bullet.x += bullet.vx * dt
      bullet.y += bullet.vy * dt
      if (bullet.life <= 0 || bullet.x < -20 || bullet.y < -20 || bullet.x > this.surface.width + 20 || bullet.y > this.surface.height + 20) {
        this.surface.bullets.splice(i, 1)
        continue
      }
      for (const threat of this.surface.threats) {
        const rr = threat.radius + bullet.radius
        if ((threat.x - bullet.x) ** 2 + (threat.y - bullet.y) ** 2 > rr * rr) continue
        threat.hp -= bullet.damage
        threat.hit = 0.035
        const push = norm(threat.x - bullet.x, threat.y - bullet.y)
        threat.vx += push.x * 70
        threat.vy += push.y * 70
        this.surfaceHitSpark(bullet.x, bullet.y, bullet.color)
        this.surface.bullets.splice(i, 1)
        break
      }
    }
  }

  private surfaceHitSpark(x: number, y: number, color: string) {
    for (let i = 0; i < 1; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift()
      const a = rand(-0.45, 0.45) + (i ? Math.PI : 0)
      const speed = rand(32, 58)
      const life = rand(0.1, 0.16)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        color,
        size: rand(0.8, 1.5),
        angle: a,
        length: rand(3, 7),
        glow: 0
      })
    }
  }

  private findSurfaceTarget() {
    if (!this.surface) return null
    let best: SurfaceThreat | null = null
    let bestD = 420 * 420
    for (const threat of this.surface.threats) {
      const d = (threat.x - this.surface.pilot.x) ** 2 + (threat.y - this.surface.pilot.y) ** 2
      if (d < bestD) {
        bestD = d
        best = threat
      }
    }
    return best
  }

  private fireSurfaceGun() {
    if (!this.surface) return
    const target = this.findSurfaceTarget()
    if (!target) return
    const angle = Math.atan2(target.y - this.surface.pilot.y, target.x - this.surface.pilot.x)
    this.surface.pilot.facing = angle
    this.surface.pilot.gunCd = this.surfaceGunCooldown()
    this.audio.fire('surface', 1)
    const muzzleX = this.surface.pilot.x + Math.cos(angle) * 19
    const muzzleY = this.surface.pilot.y + Math.sin(angle) * 19
    const speed = this.surfaceGunSpeed()
    this.surface.bullets.push({
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.62,
      radius: 4,
      damage: this.surfaceGunDamage(),
      color: '#fff27a'
    })
    this.burst(muzzleX, muzzleY, '#fff27a', 4, 90)
  }

  private startTakeoff(options: { urgent?: boolean } = {}) {
    if (!this.surface) return
    if (this.pendingUpgrades > 0 && !options.urgent) {
      this.takeoffAfterWorkbench = true
      this.openLevelUp('SHIPBOARD WORKBENCH', `${this.pendingUpgrades} banked mutation signal${this.pendingUpgrades === 1 ? '' : 's'} available. Spend before takeoff.`)
      return
    }
    this.state = 'takeoff'
    this.transitionTimer = 0
    this.transitionDuration = 1.2
    this.audio.land()
    this.toast(options.urgent ? 'O2 LOW - RETURNING TO SHIP' : 'RETURNING TO ORBIT')
  }

  private finishTakeoff() {
    if (!this.surface) return
    this.snapToOrbitReturnPoint()
    const first = !this.surface.planet.visited
    this.surface.planet.visited = true
    this.visitedPlanets.add(this.surface.planet.id)
    this.stats.planets = this.visitedPlanets.size
    if (this.stats.planets === 1) {
      this.chunks.clear()
      this.activeChunkKey = ''
      this.updateSpaceChunks(true)
    }
    if (first) this.recordPlanetArtifact(this.surface.planet, 'Surface expedition')
    this.stats.score += first ? 420 + this.surface.collected * 45 : this.surface.collected * 25
    this.player.landedCd = 2.2
    this.player.invuln = 0.8
    const planetName = this.surface.planet.name
    this.surface = null
    this.alienChoice = null
    this.orbitReturnPoint = null
    this.state = 'playing'
    this.showOnly(null)
    this.toast(`${planetName}: SURFACE CACHE EXTRACTED`)
    if (this.relics.has('deadSunCoin') && Math.random() < 0.75) {
      this.spawnEnemy('warden')
      this.toast('DEAD SUN HUNTER FOUND YOUR WAKE')
    }
  }

  private updateCamera(dt: number) {
    const target = cameraTargetFor(this.player, this.width, this.height, this.spaceScale())
    const targetX = target.x
    const targetY = target.y
    this.camera.x += (targetX - this.camera.x) * clamp(dt * 7, 0, 1)
    this.camera.y += (targetY - this.camera.y) * clamp(dt * 7, 0, 1)
    this.camera.shake = Math.max(0, this.camera.shake - dt * 35)
  }

  private spaceScale() {
    return spaceViewportScale(this.width, this.height)
  }

  private burst(x: number, y: number, color: string, count: number, speed: number) {
    const load = this.particles.length / MAX_PARTICLES
    const glow = this.allowGlow()
    const modeBoost = glow ? 1.65 : this.graphicsMode === 'MED' ? 1.15 : 1
    const particleCount = Math.max(3, Math.floor(count * modeBoost * clamp(1 - load * (glow ? 0.35 : 0.65), glow ? 0.5 : 0.3, 1)))
    const big = count > 24
    if (this.shockwaves.length < MAX_SHOCKWAVES) {
      this.shockwaves.push({
        x,
        y,
        radius: big ? 18 : 8,
        speed: big ? speed * 0.9 : speed * 0.72,
        life: big ? 0.62 : 0.36,
        maxLife: big ? 0.62 : 0.36,
        color,
        jag: rand(0, TAU)
      })
      if (big && this.shockwaves.length < MAX_SHOCKWAVES) {
        this.shockwaves.push({
          x,
          y,
          radius: 4,
          speed: speed * 1.35,
          life: 0.42,
          maxLife: 0.42,
          color: '#ffffff',
          jag: rand(0, TAU)
        })
      }
      if (glow && this.shockwaves.length < MAX_SHOCKWAVES) {
        this.shockwaves.push({
          x,
          y,
          radius: big ? 30 : 14,
          speed: speed * 0.46,
          life: big ? 0.82 : 0.52,
          maxLife: big ? 0.82 : 0.52,
          color: '#57fff3',
          jag: rand(0, TAU)
        })
      }
    }
    for (let i = 0; i < particleCount; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift()
      const a = Math.random() * TAU
      const s = rand(speed * 0.35, speed)
      const shard = i % 3 === 0
      const life = rand(big ? 0.42 : 0.28, big ? 1.05 : 0.72)
      this.particles.push({
        x: x + Math.cos(a) * rand(0, 12),
        y: y + Math.sin(a) * rand(0, 12),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        maxLife: life,
        color: i % 7 === 0 ? '#ffffff' : color,
        size: shard ? rand(4, big ? 12 : 8) : rand(1, 4),
        angle: a,
        spin: rand(-8, 8),
        sides: shard ? Math.floor(rand(3, 6)) : undefined,
        length: shard ? undefined : rand(glow ? 22 : 14, big ? (glow ? 72 : 46) : (glow ? 42 : 30)),
        glow: glow ? (shard ? 32 : 24) : shard ? 18 : 12
      })
    }
  }

  private screenToWorld(x: number, y: number): Vec {
    return spaceScreenToWorld({ x, y }, this.camera, this.spaceScale())
  }

  private worldToScreen(x: number, y: number): Vec {
    const shakeX = this.camera.shake > 0 ? rand(-this.camera.shake, this.camera.shake) : 0
    const shakeY = this.camera.shake > 0 ? rand(-this.camera.shake, this.camera.shake) : 0
    const p = spaceWorldToScreen({ x, y }, this.camera, this.spaceScale())
    return { x: p.x + shakeX, y: p.y + shakeY }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#020305'
    ctx.fillRect(0, 0, this.width, this.height)
    if ((this.state === 'levelup' || this.state === 'alien' || this.state === 'lore') && this.surface) {
      this.mini.style.display = 'none'
      this.renderSurface(ctx)
      return
    }
    if (this.state === 'surface') {
      this.mini.style.display = 'none'
      this.renderSurface(ctx)
      return
    }
    if (this.state === 'landing') {
      const t = clamp(this.transitionTimer / this.transitionDuration, 0, 1)
      if (t < 0.58) this.renderSpaceScene(ctx)
      else this.renderSurface(ctx)
      this.renderTransitionOverlay(ctx, t, 'LANDING')
      return
    }
    if (this.state === 'takeoff') {
      const t = clamp(this.transitionTimer / this.transitionDuration, 0, 1)
      if (t < 0.5) this.renderSurface(ctx)
      else this.renderSpaceScene(ctx)
      this.renderTransitionOverlay(ctx, t, 'TAKEOFF')
      return
    }
    if (this.state === 'dying') {
      this.renderSpaceScene(ctx)
      this.renderDeathOverlay(ctx)
      return
    }
    this.renderSpaceScene(ctx)
  }

  private renderSpaceScene(ctx: CanvasRenderingContext2D) {
    this.mini.style.display = this.state === 'dying' ? 'none' : ''
    this.renderBackground(ctx)
    this.renderPlanets(ctx)
    this.renderReturnBeacon(ctx)
    this.renderPickups(ctx)
    this.renderBullets(ctx)
    this.renderEnemies(ctx)
    this.renderOrbitals(ctx)
    this.renderAutopilot(ctx)
    if (this.state !== 'dying' || this.deathTimer < 0.16) this.renderPlayer(ctx)
    this.renderShockwaves(ctx)
    this.renderParticles(ctx)
    this.renderLandingPrompt(ctx)
    this.renderMinimap()
  }

  private surfaceToScreen(x: number, y: number): Vec {
    if (!this.surface) return { x, y }
    return { x: x - this.surface.camera.x, y: y - this.surface.camera.y }
  }

  private effectToScreen(x: number, y: number): Vec {
    if (this.surface && (this.state === 'surface' || this.state === 'takeoff' || (this.state === 'landing' && this.transitionTimer / this.transitionDuration > 0.58))) {
      return this.surfaceToScreen(x, y)
    }
    return this.worldToScreen(x, y)
  }

  private isHighLoad() {
    return this.graphicsMode === 'LOW' || this.particles.length > 170 || this.enemies.length > 120 || this.bullets.length > 130 || this.pickups.length > 150
  }

  private allowGlow() {
    return this.graphicsMode === 'GLOW' && !this.isHighLoad()
  }

  private setGraphicsMode(mode: GraphicsMode) {
    this.graphicsMode = mode
    localStorage.setItem('vector_shooter_graphics', mode)
    this.resize()
    this.toast(`GRAPHICS ${mode}`)
  }

  private renderSurface(ctx: CanvasRenderingContext2D) {
    if (!this.surface) return
    const s = this.surface
    ctx.save()
    const sky = ctx.createLinearGradient(0, 0, 0, this.height)
    sky.addColorStop(0, '#010306')
    sky.addColorStop(0.52, '#041015')
    sky.addColorStop(1, '#050706')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.strokeStyle = 'rgba(87,255,243,0.08)'
    ctx.lineWidth = 1
    const grid = 90
    for (let x = -s.camera.x % grid; x < this.width + grid; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + Math.sin((x + s.camera.x) * 0.004) * 24, this.height)
      ctx.stroke()
    }
    for (let y = -s.camera.y % grid; y < this.height + grid; y += grid) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.width, y + Math.sin((y + s.camera.y) * 0.005) * 18)
      ctx.stroke()
    }

    const horizon = this.surfaceToScreen(s.width / 2, s.height + 520)
    ctx.strokeStyle = s.planet.color
    ctx.shadowColor = s.planet.color
    ctx.shadowBlur = 20
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(horizon.x, horizon.y, 860, Math.PI * 1.12, Math.PI * 1.88)
    ctx.stroke()
    ctx.globalAlpha = 0.26
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath()
      ctx.arc(horizon.x, horizon.y, 720 - i * 62, Math.PI * 1.2, Math.PI * 1.8)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    this.renderSurfaceShip(ctx, s)
    this.renderSurfaceResources(ctx, s)
    this.renderSurfaceLoreSites(ctx, s)
    this.renderSurfaceAliens(ctx, s)
    this.renderSurfaceBullets(ctx, s)
    this.renderSurfaceThreats(ctx, s)
    this.renderSurfacePilot(ctx, s)
    this.renderShockwaves(ctx)
    this.renderParticles(ctx)
    this.renderSurfaceHud(ctx, s)
    ctx.restore()
  }

  private renderSurfaceShip(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const p = this.surfaceToScreen(s.ship.x, s.ship.y)
    const pulse = Math.sin(this.stats.time * 3) * 0.06
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.strokeStyle = '#57fff3'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 20
    ctx.lineWidth = 2
    ctx.rotate(-Math.PI / 2)
    ctx.scale(2.35 + pulse, 2.35 + pulse)
    ctx.beginPath()
    ctx.moveTo(24, 0)
    ctx.lineTo(-15, -13)
    ctx.lineTo(-8, 0)
    ctx.lineTo(-15, 13)
    ctx.closePath()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-16, -8)
    ctx.lineTo(-30, 0)
    ctx.lineTo(-16, 8)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.strokeStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = 14
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-22, 28)
    ctx.lineTo(-46, 50)
    ctx.moveTo(22, 28)
    ctx.lineTo(46, 50)
    ctx.moveTo(-32, 50)
    ctx.lineTo(32, 50)
    ctx.stroke()
    ctx.restore()
  }

  private renderSurfaceResources(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    for (const r of s.resources) {
      if (r.collected) continue
      const p = this.surfaceToScreen(r.x, r.y)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(this.stats.time * 1.8)
      ctx.strokeStyle = r.color
      ctx.shadowColor = r.color
      ctx.shadowBlur = r.kind === 'cache' ? 24 : 14
      ctx.lineWidth = r.kind === 'cache' ? 3 : 2
      ctx.beginPath()
      if (r.kind === 'cache') {
        ctx.rect(-r.radius, -r.radius, r.radius * 2, r.radius * 2)
        ctx.moveTo(-r.radius, 0)
        ctx.lineTo(r.radius, 0)
        ctx.moveTo(0, -r.radius)
        ctx.lineTo(0, r.radius)
      } else {
        ctx.moveTo(0, -r.radius)
        ctx.lineTo(r.radius, 0)
        ctx.lineTo(0, r.radius)
        ctx.lineTo(-r.radius, 0)
        ctx.closePath()
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderSurfaceLoreSites(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    for (const site of s.loreSites) {
      if (site.resolved) continue
      const p = this.surfaceToScreen(site.x, site.y)
      const pulse = Math.sin(this.stats.time * 2.8 + site.phase)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.strokeStyle = '#d7fff7'
      ctx.shadowColor = '#d7fff7'
      ctx.shadowBlur = this.allowGlow() ? 18 : 8
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.9
      if (site.kind === 'pyramid') {
        ctx.beginPath()
        ctx.moveTo(0, -site.radius)
        ctx.lineTo(site.radius * 0.95, site.radius * 0.62)
        ctx.lineTo(-site.radius * 0.95, site.radius * 0.62)
        ctx.closePath()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, -site.radius)
        ctx.lineTo(0, site.radius * 0.62)
        ctx.stroke()
      } else if (site.kind === 'grave') {
        ctx.beginPath()
        ctx.moveTo(-site.radius * 0.72, site.radius * 0.62)
        ctx.lineTo(-site.radius * 0.72, -site.radius * 0.2)
        ctx.quadraticCurveTo(0, -site.radius, site.radius * 0.72, -site.radius * 0.2)
        ctx.lineTo(site.radius * 0.72, site.radius * 0.62)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-site.radius * 0.32, -site.radius * 0.1)
        ctx.lineTo(site.radius * 0.32, -site.radius * 0.1)
        ctx.moveTo(0, -site.radius * 0.42)
        ctx.lineTo(0, site.radius * 0.28)
        ctx.stroke()
      } else if (site.kind === 'fossils') {
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath()
          ctx.ellipse((i - 2) * 10, Math.sin(i) * 5, 7, 18, i * 0.65, 0, TAU)
          ctx.stroke()
        }
      } else if (site.kind === 'machine') {
        ctx.beginPath()
        ctx.rect(-site.radius * 0.7, -site.radius * 0.45, site.radius * 1.4, site.radius * 0.9)
        ctx.moveTo(-site.radius, -site.radius * 0.72)
        ctx.lineTo(site.radius, site.radius * 0.72)
        ctx.moveTo(site.radius, -site.radius * 0.72)
        ctx.lineTo(-site.radius, site.radius * 0.72)
        ctx.stroke()
      } else {
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath()
          ctx.arc(0, 0, site.radius * (0.35 + i * 0.18), i * 0.7, Math.PI + i * 0.7)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 0.32 + pulse * 0.08
      ctx.beginPath()
      ctx.arc(0, 0, site.radius + 10 + pulse * 3, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderSurfaceThreats(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    for (const threat of s.threats) {
      if (threat.sprite === 'glassMiteOracle') {
        this.renderGlassMiteOracleThreat(ctx, threat)
        continue
      }
      if (threat.sprite === 'bossCatalog') {
        this.renderCatalogBossThreat(ctx, threat)
        continue
      }
      const p = this.surfaceToScreen(threat.x, threat.y)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(threat.phase)
      ctx.strokeStyle = threat.hit > 0 ? '#fff27a' : threat.color
      ctx.shadowColor = threat.color
      ctx.shadowBlur = 18
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * TAU
        const radius = i % 2 ? threat.radius * 0.45 : threat.radius
        const x = Math.cos(a) * radius
        const y = Math.sin(a) * radius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderGlassMiteOracleThreat(ctx: CanvasRenderingContext2D, threat: SurfaceThreat) {
    const p = this.surfaceToScreen(threat.x, threat.y)
    const sheet = this.glassMiteOracleSheet
    if (!sheet.complete || sheet.naturalWidth === 0) {
      this.renderFallbackMite(ctx, threat, p)
      return
    }
    const frameCount = 5
    const frame = Math.floor((this.stats.time * 8 + threat.phase) % frameCount)
    const sw = sheet.naturalWidth / frameCount
    const sh = sheet.naturalHeight
    const bob = Math.sin(this.stats.time * 5 + threat.phase) * 3
    const scale = threat.hit > 0 ? 0.475 : 0.46
    const dw = sw * scale
    const dh = sh * scale
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = threat.hit > 0 ? 0.96 : 0.92
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = this.allowGlow() ? 20 : 8
    ctx.drawImage(sheet, frame * sw, 0, sw, sh, p.x - dw / 2, p.y - dh * 0.54 + bob, dw, dh)
    if (threat.hit > 0) {
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = 0.16
      ctx.fillStyle = '#57fff3'
      ctx.beginPath()
      ctx.arc(p.x, p.y - 14 + bob, threat.radius + 14, 0, TAU)
      ctx.fill()
    }
    ctx.restore()
  }

  private renderCatalogBossThreat(ctx: CanvasRenderingContext2D, threat: SurfaceThreat) {
    const p = this.surfaceToScreen(threat.x, threat.y)
    const sheet = this.planetBossCatalog
    if (!sheet.complete || sheet.naturalWidth === 0) {
      this.renderFallbackMite(ctx, threat, p)
      return
    }
    const row = clamp(Math.floor(threat.spriteRow ?? 0), 0, BOSS_CATALOG_ROWS - 1)
    const frame = Math.floor((this.stats.time * 6 + threat.phase) % BOSS_CATALOG_FRAMES)
    const sw = sheet.naturalWidth / BOSS_CATALOG_FRAMES
    const sh = sheet.naturalHeight / BOSS_CATALOG_ROWS
    const bob = Math.sin(this.stats.time * 3.2 + threat.phase) * 4
    const scale = threat.hit > 0 ? 0.56 : 0.54
    const dw = sw * scale
    const dh = sh * scale
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = threat.hit > 0 ? 0.98 : 0.94
    ctx.shadowColor = threat.color
    ctx.shadowBlur = this.allowGlow() ? 24 : 8
    ctx.drawImage(sheet, frame * sw, row * sh, sw, sh, p.x - dw / 2, p.y - dh * 0.55 + bob, dw, dh)
    ctx.globalAlpha = 0.45
    ctx.strokeStyle = threat.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y + bob, threat.radius + 9 + Math.sin(this.stats.time * 4 + threat.phase) * 4, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  private renderFallbackMite(ctx: CanvasRenderingContext2D, threat: SurfaceThreat, p: Vec) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.strokeStyle = threat.hit > 0 ? '#fff27a' : '#57fff3'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 16
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -34)
    ctx.lineTo(22, -2)
    ctx.lineTo(10, 25)
    ctx.lineTo(-12, 24)
    ctx.lineTo(-22, -2)
    ctx.closePath()
    ctx.stroke()
    ctx.strokeStyle = '#fff27a'
    ctx.beginPath()
    ctx.moveTo(-14, 16)
    ctx.lineTo(-34, 34)
    ctx.moveTo(14, 16)
    ctx.lineTo(34, 34)
    ctx.stroke()
    ctx.restore()
  }

  private renderSurfaceAliens(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    for (const alien of s.aliens) {
      if (alien.resolved) continue
      if (alien.sprite === 'alienCatalog' && this.planetAlienCatalog.complete && this.planetAlienCatalog.naturalWidth > 0) {
        this.renderCatalogAlien(ctx, alien)
        continue
      }
      const p = this.surfaceToScreen(alien.x, alien.y)
      const bob = Math.sin(this.stats.time * 2.4 + alien.phase) * 5
      ctx.save()
      ctx.translate(p.x, p.y + bob)
      ctx.strokeStyle = alien.color
      ctx.fillStyle = alien.color
      ctx.shadowColor = alien.color
      ctx.shadowBlur = 18
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(0, -8, 13, 23, Math.sin(alien.phase) * 0.25, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, -30, 11, 0, TAU)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(-4, -31, 1.8, 0, TAU)
      ctx.arc(4, -31, 1.8, 0, TAU)
      ctx.arc(0, -25, 1.8, 0, TAU)
      ctx.fill()
      ctx.globalAlpha = 0.45
      ctx.beginPath()
      ctx.arc(0, -10, alien.radius + Math.sin(this.stats.time * 3) * 3, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.moveTo(-8, 10)
      ctx.lineTo(-16, 24)
      ctx.moveTo(8, 10)
      ctx.lineTo(16, 24)
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderCatalogAlien(ctx: CanvasRenderingContext2D, alien: SurfaceAlien) {
    const p = this.surfaceToScreen(alien.x, alien.y)
    const sheet = this.planetAlienCatalog
    if (!sheet.complete || sheet.naturalWidth === 0) return
    const row = clamp(Math.floor(alien.spriteRow ?? 0), 0, ALIEN_CATALOG_ROWS - 1)
    const frame = Math.floor((this.stats.time * 4 + alien.phase) % ALIEN_CATALOG_FRAMES)
    const sw = sheet.naturalWidth / ALIEN_CATALOG_FRAMES
    const sh = sheet.naturalHeight / ALIEN_CATALOG_ROWS
    const bob = Math.sin(this.stats.time * 2.2 + alien.phase) * 5
    const scale = 0.48
    const dw = sw * scale
    const dh = sh * scale
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.94
    ctx.shadowColor = alien.color
    ctx.shadowBlur = this.allowGlow() ? 20 : 8
    ctx.drawImage(sheet, frame * sw, row * sh, sw, sh, p.x - dw / 2, p.y - dh * 0.58 + bob, dw, dh)
    ctx.globalAlpha = 0.55
    ctx.strokeStyle = '#8fff7d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(p.x, p.y + bob, alien.radius + 12 + Math.sin(this.stats.time * 3) * 3, 0, TAU)
    ctx.stroke()
    ctx.restore()
  }

  private renderSurfaceBullets(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    ctx.save()
    ctx.strokeStyle = '#fff27a'
    ctx.fillStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = this.allowGlow() ? 4 : 0
    ctx.lineWidth = 1.1
    ctx.globalAlpha = 0.58
    for (const bullet of s.bullets) {
      const p = this.surfaceToScreen(bullet.x, bullet.y)
      const angle = Math.atan2(bullet.vy, bullet.vx)
      ctx.beginPath()
      ctx.moveTo(p.x - Math.cos(angle) * 7, p.y - Math.sin(angle) * 7)
      ctx.lineTo(p.x + Math.cos(angle) * 6, p.y + Math.sin(angle) * 6)
      ctx.stroke()
    }
    ctx.restore()
  }

  private renderSurfacePilot(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const p = this.surfaceToScreen(s.pilot.x, s.pilot.y)
    const sheet = this.surfaceSpacemanSheet
    if (sheet.complete && sheet.naturalWidth > 0) {
      const frameCount = 8
      const moving = len(s.pilot.vx, s.pilot.vy) > 12
      const frame = moving ? Math.floor(this.stats.time * 11) % frameCount : 0
      const sw = sheet.naturalWidth / frameCount
      const sh = sheet.naturalHeight
      const scale = s.pilot.invuln > 0 ? 0.45 : 0.42
      const dw = sw * scale
      const dh = sh * scale
      const flip = Math.cos(s.pilot.facing) < 0 ? -1 : 1
      const bob = moving ? Math.sin(this.stats.time * 18) * 1.5 : Math.sin(this.stats.time * 3) * 0.8
      ctx.save()
      ctx.translate(p.x, p.y + bob)
      ctx.scale(flip, 1)
      ctx.globalCompositeOperation = 'lighter'
      ctx.globalAlpha = s.pilot.invuln > 0 ? 1 : 0.96
      ctx.shadowColor = s.pilot.invuln > 0 ? '#fff27a' : '#57fff3'
      ctx.shadowBlur = this.allowGlow() ? 14 : 5
      ctx.drawImage(sheet, frame * sw, 0, sw, sh, -dw / 2, -dh * 0.62, dw, dh)
      ctx.restore()
      return
    }
    this.renderFallbackSurfacePilot(ctx, s, p)
  }

  private renderFallbackSurfacePilot(ctx: CanvasRenderingContext2D, s: SurfaceRun, p: Vec) {
    const step = Math.sin(this.stats.time * 11) * 4
    const facing = Math.sign(Math.cos(s.pilot.facing)) || 1
    const aim = s.pilot.facing
    const gunKick = Math.max(0, s.pilot.gunCd) * 18
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.strokeStyle = s.pilot.invuln > 0 ? '#fff27a' : '#d7fff7'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 10
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, -16, 5, 0, TAU)
    ctx.moveTo(0, -11)
    ctx.lineTo(0, 6)
    ctx.moveTo(0, -5)
    ctx.lineTo(Math.cos(aim) * 11, Math.sin(aim) * 11 - 3)
    ctx.moveTo(0, -4)
    ctx.lineTo(facing * -8, 2)
    ctx.moveTo(0, 6)
    ctx.lineTo(-7, 20 + step)
    ctx.moveTo(0, 6)
    ctx.lineTo(7, 20 - step)
    ctx.stroke()
    ctx.strokeStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.beginPath()
    ctx.moveTo(Math.cos(aim) * 8, Math.sin(aim) * 8 - 3)
    ctx.lineTo(Math.cos(aim) * (22 - gunKick), Math.sin(aim) * (22 - gunKick) - 3)
    ctx.stroke()
    ctx.restore()
  }

  private renderSurfaceHud(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const nearShip = Math.sqrt(dist2(s.pilot, s.ship)) < 64
    const nearLore = this.findNearbyLoreSite()
    const nearAlien = this.findNearbyAlien()
    ctx.save()
    ctx.fillStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = 12
    ctx.font = this.width < 560 ? '12px Courier New' : '14px Courier New'
    ctx.textAlign = 'center'
    const message = nearLore ? `PRESS E / Y TO INSPECT: ${nearLore.title}` : nearAlien ? `PRESS E / Y TO SPEAK: ${nearAlien.name}` : nearShip ? 'PRESS E / Y TO BOARD SHIP' : s.message
    ctx.fillText(`${s.planet.name} // ${this.surfaceScenarioLabel(s.scenario)} // ${this.surfaceEventLabel(s.event)} // ${s.collected}/${s.resources.length} SIGNALS`, this.width / 2, 86, this.width - 16)
    const actionInset = this.width < 560 ? 132 : 0
    const messageX = actionInset ? (this.width - actionInset) / 2 : this.width / 2
    ctx.fillText(message, messageX, this.height - 42, this.width - actionInset - 18)
    ctx.restore()
  }

  private surfaceEventLabel(event: SurfaceEventKind) {
    return {
      jackpot: 'JACKPOT',
      horde: 'HORDE VAULT',
      swarm: 'INFESTED',
      relic: 'RELIC SITE',
      repair: 'SAFE DOCK',
      volatile: 'VOLATILE',
      standard: 'UNKNOWN'
    }[event]
  }

  private surfaceScenarioLabel(scenario: SurfaceScenarioKind) {
    return {
      salvage: 'SALVAGE',
      boss: 'BOSS',
      friendly: 'CONTACT',
      mixed: 'MYSTERY',
      lore: 'RUINS',
      horde: 'VAST HORDE'
    }[scenario]
  }

  private renderTransitionOverlay(ctx: CanvasRenderingContext2D, t: number, label: string) {
    const pulse = Math.sin(t * Math.PI)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = '#57fff3'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 24
    ctx.lineWidth = 2
    for (let i = 0; i < 9; i += 1) {
      const r = (i + 1) * 70 + pulse * 120
      ctx.beginPath()
      ctx.arc(this.width / 2, this.height / 2, r, 0, TAU)
      ctx.stroke()
    }
    ctx.fillStyle = `rgba(0,0,0,${0.18 + pulse * 0.32})`
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#d7fff7'
    ctx.font = '18px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText(label, this.width / 2, this.height / 2)
    ctx.restore()
  }

  private renderDeathOverlay(ctx: CanvasRenderingContext2D) {
    const t = clamp(this.deathTimer / 2.35, 0, 1)
    const flash = Math.max(0, 1 - this.deathTimer * 2.6)
    const p = this.worldToScreen(this.player.x, this.player.y)
    ctx.save()
    ctx.fillStyle = `rgba(0,0,0,${0.2 + t * 0.52})`
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.globalCompositeOperation = 'lighter'
    const boom = clamp(this.deathTimer / 1.1, 0, 1)
    for (let i = 0; i < 4; i += 1) {
      const ring = boom * (70 + i * 38)
      const alpha = Math.max(0, 0.52 - boom * 0.42 - i * 0.06)
      ctx.strokeStyle = i % 2 === 0 ? `rgba(255,93,115,${alpha})` : `rgba(255,242,122,${alpha})`
      ctx.shadowColor = i % 2 === 0 ? '#ff5d73' : '#fff27a'
      ctx.shadowBlur = 22
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, ring, 0, TAU)
      ctx.stroke()
    }
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * TAU + this.deathTimer * 0.9
      const length = 54 + boom * 120
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,242,122,0.46)' : 'rgba(87,255,243,0.34)'
      ctx.beginPath()
      ctx.moveTo(p.x + Math.cos(a) * 18, p.y + Math.sin(a) * 18)
      ctx.lineTo(p.x + Math.cos(a) * length, p.y + Math.sin(a) * length)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
    if (flash > 0) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = `rgba(255,242,122,${flash * 0.42})`
      ctx.fillRect(0, 0, this.width, this.height)
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#ff5d73'
    ctx.shadowBlur = 26
    ctx.fillStyle = '#ffedf1'
    ctx.font = '24px Courier New'
    ctx.fillText('YOU DIED', this.width / 2, this.height * 0.42)
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#d7fff7'
    ctx.font = '13px Courier New'
    ctx.fillText('BLACK BOX TRANSMITTING TO MOTHERSHIP', this.width / 2, this.height * 0.42 + 34)
    const barWidth = Math.min(320, this.width - 52)
    const x = (this.width - barWidth) / 2
    const y = this.height * 0.42 + 58
    ctx.strokeStyle = 'rgba(87,255,243,0.62)'
    ctx.strokeRect(x, y, barWidth, 7)
    ctx.fillStyle = '#57fff3'
    ctx.fillRect(x, y, barWidth * t, 7)
    ctx.restore()
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    ctx.save()
    this.renderNebulaBands(ctx)
    this.renderSectorLandmarks(ctx)
    ctx.strokeStyle = 'rgba(87,255,243,0.08)'
    ctx.lineWidth = 1
    const grid = 240
    const scale = this.spaceScale()
    const viewRight = this.camera.x + this.width / scale
    const viewBottom = this.camera.y + this.height / scale
    const startX = Math.floor(this.camera.x / grid) * grid
    const startY = Math.floor(this.camera.y / grid) * grid
    for (let x = startX; x < viewRight + grid; x += grid) {
      const sx = (x - this.camera.x) * scale
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, this.height)
      ctx.stroke()
    }
    for (let y = startY; y < viewBottom + grid; y += grid) {
      const sy = (y - this.camera.y) * scale
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(this.width, sy)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,242,122,0.16)'
    ctx.fillStyle = 'rgba(255,242,122,0.42)'
    ctx.font = '11px Courier New'
    const chunkStartX = Math.floor(this.camera.x / CHUNK_SIZE) * CHUNK_SIZE
    const chunkStartY = Math.floor(this.camera.y / CHUNK_SIZE) * CHUNK_SIZE
    for (let x = chunkStartX; x < viewRight + CHUNK_SIZE; x += CHUNK_SIZE) {
      const sx = (x - this.camera.x) * scale
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, this.height)
      ctx.stroke()
    }
    for (let y = chunkStartY; y < viewBottom + CHUNK_SIZE; y += CHUNK_SIZE) {
      const sy = (y - this.camera.y) * scale
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(this.width, sy)
      ctx.stroke()
    }
    const sector = this.currentChunk()
    ctx.fillText(`SECTOR ${sector.x}:${sector.y}`, 14, this.height - 18)
    for (const s of this.stars) {
      const p = this.worldToScreen(s.x, s.y)
      if (p.x < -10 || p.x > this.width + 10 || p.y < -10 || p.y > this.height + 10) continue
      const h = hash32(Math.floor(s.x), Math.floor(s.y), 23)
      const alpha = 0.34 + (h % 50) / 100
      const size = h % 17 === 0 ? 2.2 : h % 7 === 0 ? 1.7 : 1.15
      const palette = h % 11 === 0 ? '255,242,122' : h % 5 === 0 ? '185,144,255' : h % 3 === 0 ? '143,255,125' : '215,255,247'
      ctx.fillStyle = `rgba(${palette},${alpha})`
      ctx.fillRect(p.x, p.y, size, size)
    }
    ctx.restore()
  }

  private renderSectorLandmarks(ctx: CanvasRenderingContext2D) {
    const colors = [
      [87, 255, 243],
      [143, 255, 125],
      [185, 144, 255],
      [255, 242, 122],
      [112, 168, 255],
      [255, 93, 115]
    ]
    const landmarkGrid = 820
    const scale = this.spaceScale()
    const viewRight = this.camera.x + this.width / scale
    const viewBottom = this.camera.y + this.height / scale
    const minX = Math.floor((this.camera.x - landmarkGrid) / landmarkGrid)
    const maxX = Math.floor((viewRight + landmarkGrid) / landmarkGrid)
    const minY = Math.floor((this.camera.y - landmarkGrid) / landmarkGrid)
    const maxY = Math.floor((viewBottom + landmarkGrid) / landmarkGrid)
    const glow = this.allowGlow()
    ctx.save()
    ctx.globalCompositeOperation = glow ? 'screen' : 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let gx = minX; gx <= maxX; gx += 1) {
      for (let gy = minY; gy <= maxY; gy += 1) {
        const rng = rngFrom(hash32(gx, gy, 177))
        if (rng() < 0.16) continue
        const color = colors[Math.floor(rng() * colors.length)]
        const accent = colors[Math.floor(rng() * colors.length)]
        const alpha = glow ? 0.22 : 0.13
        const landmarkCount = 1 + Math.floor(rng() * 2)
        for (let i = 0; i < landmarkCount; i += 1) {
          const worldX = gx * landmarkGrid + rng() * landmarkGrid
          const worldY = gy * landmarkGrid + rng() * landmarkGrid
          const p = this.worldToScreen(worldX, worldY)
          const x = p.x
          const y = p.y
          const kind = Math.floor(rng() * 4)
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(rng() * TAU)
          ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},0.34)`
          ctx.shadowBlur = glow ? 12 : 0
          if (kind === 0) {
            const radius = 62 + rng() * 110
            ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.72})`
            ctx.lineWidth = 1.2
            ctx.beginPath()
            ctx.ellipse(0, 0, radius * (1.3 + rng() * 0.7), radius * (0.18 + rng() * 0.18), 0, 0, TAU)
            ctx.stroke()
            ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${alpha * 0.42})`
            ctx.beginPath()
            ctx.arc(0, 0, radius * 0.32, rng() * TAU, rng() * TAU + TAU * (0.34 + rng() * 0.3))
            ctx.stroke()
          } else if (kind === 1) {
            const length = 160 + rng() * 280
            ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.62})`
            ctx.lineWidth = 1 + rng() * 1.4
            ctx.beginPath()
            ctx.moveTo(-length / 2, 0)
            ctx.lineTo(length / 2, 0)
            ctx.stroke()
            ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${alpha * 0.36})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(-length * 0.36, 16)
            ctx.lineTo(length * 0.42, 16)
            ctx.stroke()
          } else if (kind === 2) {
            const radius = 54 + rng() * 88
            ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.54})`
            ctx.lineWidth = 1
            for (let j = 0; j < 3; j += 1) {
              ctx.beginPath()
              ctx.arc(0, 0, radius * (0.48 + j * 0.24), rng() * TAU, rng() * TAU + TAU * (0.18 + rng() * 0.24))
              ctx.stroke()
            }
          } else {
            const points = 7 + Math.floor(rng() * 8)
            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha * 0.56})`
            for (let j = 0; j < points; j += 1) {
              const a = rng() * TAU
              const d = rng() * 90
              const size = 1 + rng() * 1.8
              ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d, size, size)
            }
          }
          ctx.restore()
        }
      }
    }
    ctx.restore()
  }

  private renderNebulaBands(ctx: CanvasRenderingContext2D) {
    const colors = [
      [87, 255, 243],
      [143, 255, 125],
      [185, 144, 255],
      [255, 242, 122],
      [112, 168, 255],
      [255, 93, 115]
    ]
    const scale = this.spaceScale()
    const viewRight = this.camera.x + this.width / scale
    const viewBottom = this.camera.y + this.height / scale
    const minX = Math.floor((this.camera.x - CHUNK_SIZE) / CHUNK_SIZE)
    const maxX = Math.floor((viewRight + CHUNK_SIZE) / CHUNK_SIZE)
    const minY = Math.floor((this.camera.y - CHUNK_SIZE) / CHUNK_SIZE)
    const maxY = Math.floor((viewBottom + CHUNK_SIZE) / CHUNK_SIZE)
    const glow = this.allowGlow()
    ctx.save()
    ctx.globalCompositeOperation = glow ? 'screen' : 'source-over'
    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        const rng = rngFrom(hash32(cx, cy, 91))
        if (rng() < 0.46) continue
        const color = colors[Math.floor(rng() * colors.length)]
        const accent = colors[Math.floor(rng() * colors.length)]
        const worldX = cx * CHUNK_SIZE + rng() * CHUNK_SIZE
        const worldY = cy * CHUNK_SIZE + rng() * CHUNK_SIZE
        const p = this.worldToScreen(worldX, worldY)
        const x = p.x
        const y = p.y
        const length = CHUNK_SIZE * (0.8 + rng() * 0.75)
        const breadth = 150 + rng() * 260
        const angle = rng() * TAU
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.filter = `blur(${glow ? 34 : 24}px)`
        const gradient = ctx.createLinearGradient(-length / 2, 0, length / 2, 0)
        const alpha = glow ? 0.075 : 0.045
        gradient.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0)`)
        gradient.addColorStop(0.36, `rgba(${color[0]},${color[1]},${color[2]},${alpha})`)
        gradient.addColorStop(0.62, `rgba(${accent[0]},${accent[1]},${accent[2]},${alpha * 0.55})`)
        gradient.addColorStop(1, `rgba(${accent[0]},${accent[1]},${accent[2]},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(-length / 2, -breadth / 2, length, breadth)
        if (glow && rng() > 0.55) {
          ctx.globalAlpha = 0.24
          ctx.fillRect(-length * 0.35, -breadth * 0.06, length * 0.72, breadth * 0.12)
        }
        ctx.restore()
      }
    }
    ctx.restore()
  }

  private renderPlanets(ctx: CanvasRenderingContext2D) {
    const scale = this.spaceScale()
    for (const p of this.planets) {
      const s = this.worldToScreen(p.x, p.y)
      const radius = p.radius * scale
      if (s.x < -260 || s.x > this.width + 260 || s.y < -260 || s.y > this.height + 260) continue
      ctx.save()
      ctx.strokeStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 18
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(s.x, s.y, radius, 0, TAU)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 0.38
      ctx.beginPath()
      ctx.ellipse(s.x, s.y, radius * 1.75, radius * 0.38, Math.sin(this.stats.time * 0.3) * 0.35, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, radius * (0.35 + i * 0.15), 0, TAU * (0.56 + Math.sin(this.stats.time + i) * 0.08))
        ctx.stroke()
      }
      ctx.fillStyle = p.visited ? '#8fff7d' : '#d7fff7'
      ctx.font = '12px Courier New'
      ctx.textAlign = 'center'
      ctx.fillText(p.name, s.x, s.y + radius + 24 * scale)
      ctx.restore()
    }
  }

  private renderReturnBeacon(ctx: CanvasRenderingContext2D) {
    if (!this.returnBeacon) return
    const p = this.worldToScreen(this.returnBeacon.x, this.returnBeacon.y)
    const distance = Math.floor(Math.sqrt(dist2(this.returnBeacon, this.player)))
    const margin = 34
    const topMargin = 92
    const onScreen = p.x >= margin && p.x <= this.width - margin && p.y >= topMargin && p.y <= this.height - margin
    if (!onScreen) {
      const edge = {
        x: clamp(p.x, margin, this.width - margin),
        y: clamp(p.y, topMargin, this.height - margin)
      }
      const angle = Math.atan2(p.y - this.height / 2, p.x - this.width / 2)
      ctx.save()
      ctx.translate(edge.x, edge.y)
      ctx.rotate(angle)
      ctx.fillStyle = '#fff27a'
      ctx.strokeStyle = '#111827'
      ctx.shadowColor = '#fff27a'
      ctx.shadowBlur = this.allowGlow() ? 14 : 0
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(18, 0)
      ctx.lineTo(-10, -12)
      ctx.lineTo(-5, 0)
      ctx.lineTo(-10, 12)
      ctx.closePath()
      ctx.stroke()
      ctx.fill()
      ctx.restore()

      ctx.save()
      ctx.fillStyle = '#fff27a'
      ctx.font = '12px Courier New'
      ctx.textAlign = edge.x > this.width - 120 ? 'right' : edge.x < 120 ? 'left' : 'center'
      const labelX = clamp(edge.x, 64, this.width - 64)
      const labelY = clamp(edge.y - 20, topMargin, this.height - 52)
      ctx.fillText(`BEACON ${distance}`, labelX, labelY)
      ctx.restore()
      return
    }
    const pulse = Math.sin(this.returnBeacon.phase * 4) * 0.5 + 0.5
    const radius = this.returnBeacon.radius * this.spaceScale()
    ctx.save()
    ctx.strokeStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = this.allowGlow() ? 24 : 8
    ctx.lineWidth = 2 + pulse
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, TAU)
    ctx.stroke()
    ctx.strokeStyle = '#57fff3'
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius * clamp(this.returnBeacon.hold / BEACON_HOLD_SECONDS, 0, 1), 0, TAU)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff27a'
    ctx.font = '12px Courier New'
    ctx.textAlign = 'center'
    ctx.fillText(`RETURN BEACON ${distance}`, p.x, p.y - radius - 12)
    ctx.restore()
  }

  private renderAutopilot(ctx: CanvasRenderingContext2D) {
    if (this.state !== 'playing' || !this.autoNavActive) return
    const p = this.worldToScreen(this.player.x, this.player.y)
    const target = this.autoNavTargetPlanetId ? this.planets.find((planet) => planet.id === this.autoNavTargetPlanetId) : null
    const beaconTarget = this.autoNavTargetBeacon ? this.returnBeacon : null
    const level = this.navigationCruiseLevel()
    const scale = this.spaceScale()
    const color = beaconTarget ? '#fff27a' : this.build.nav <= 0 ? '#57fff3' : this.build.nav >= 6 ? '#fff27a' : '#70a8ff'
    ctx.save()
    ctx.strokeStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = this.graphicsMode === 'LOW' ? 0 : 14
    ctx.lineWidth = 1.2
    ctx.globalAlpha = this.build.nav <= 0 ? 0.34 : 0.62
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    if (target) {
      const t = this.worldToScreen(target.x, target.y)
      ctx.lineTo(t.x, t.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 0.78
      ctx.beginPath()
      ctx.arc(t.x, t.y, target.radius * scale + 16 * scale + Math.sin(this.stats.time * 5) * 3 * scale, 0, TAU)
      ctx.stroke()
    } else if (beaconTarget) {
      const t = this.worldToScreen(beaconTarget.x, beaconTarget.y)
      ctx.lineTo(t.x, t.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 0.78
      ctx.beginPath()
      ctx.arc(t.x, t.y, beaconTarget.radius * scale + 12 * scale + Math.sin(this.stats.time * 5) * 4 * scale, 0, TAU)
      ctx.stroke()
    } else {
      const length = (62 + level * 13) * scale
      ctx.lineTo(p.x + Math.cos(this.autoNavHeading) * length, p.y + Math.sin(this.autoNavHeading) * length)
      ctx.stroke()
    }
    ctx.restore()
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.worldToScreen(this.player.x, this.player.y)
    const scale = this.spaceScale()
    const a = this.player.angle
    const engineGlow = this.build.engine + this.build.heat + this.limitBreaks.speed * 0.2
    const weaponGlow = this.build.rapid + this.build.split + this.build.rail + this.build.rift
    const hullGlow = this.build.repair + this.limitBreaks.hull
    const navGlow = this.build.nav
    const travelSpeed = len(this.player.vx, this.player.vy)
    const speedCap = this.player.speed + this.build.engine * 36 + this.build.nav * 18
    const trail = navigationTrailProfile({ navRank: navGlow, speedRatio: speedCap > 0 ? travelSpeed / speedCap : 0 })
    const hullColor = this.evolved.size > 0 ? '#fff27a' : weaponGlow > 8 ? '#f6fffe' : '#57fff3'
    const exhaustColor = this.build.heat >= 3 ? '#ff9d5c' : navGlow >= 5 ? '#fff27a' : this.build.engine >= 3 || navGlow > 0 ? '#70a8ff' : '#57fff3'
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(a)
    ctx.scale(scale, scale)
    if (travelSpeed > 22) {
      ctx.save()
      ctx.globalCompositeOperation = this.allowGlow() ? 'lighter' : 'source-over'
      ctx.shadowColor = trail.color
      ctx.shadowBlur = this.graphicsMode === 'LOW' ? 0 : 12 + trail.tier * 4
      ctx.lineWidth = 1.2 + trail.tier * 0.35
      for (let i = 0; i < trail.bands; i += 1) {
        const offset = (i - (trail.bands - 1) / 2) * (5 + trail.tier * 2)
        const wobble = Math.sin(this.stats.time * (7 + i) + i * 1.7) * (2 + trail.tier)
        ctx.globalAlpha = trail.alpha * (1 - i * 0.12)
        ctx.strokeStyle = i === 0 ? trail.color : trail.accent
        ctx.beginPath()
        ctx.moveTo(-13, offset * 0.42)
        ctx.lineTo(-trail.length * 0.54, offset + wobble)
        ctx.lineTo(-trail.length, offset * 0.35 - wobble * 0.65)
        ctx.stroke()
      }
      if (trail.tier >= 2) {
        ctx.globalAlpha = trail.alpha * 0.42
        ctx.strokeStyle = trail.accent
        ctx.beginPath()
        ctx.arc(-trail.length * 0.46, 0, 10 + trail.tier * 4 + Math.sin(this.stats.time * 9) * 1.5, -0.75, 0.75)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.strokeStyle = this.player.invuln > 0 ? '#fff27a' : hullColor
    ctx.shadowColor = hullColor
    ctx.shadowBlur = 14 + Math.min(8, weaponGlow)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(24, 0)
    ctx.lineTo(-15, -13)
    ctx.lineTo(-8, 0)
    ctx.lineTo(-15, 13)
    ctx.closePath()
    ctx.stroke()
    if (this.build.split > 0 || this.build.rail > 0) {
      ctx.strokeStyle = this.build.rail > 0 ? '#fff27a' : '#70a8ff'
      ctx.beginPath()
      ctx.moveTo(2, -12)
      ctx.lineTo(16 + Math.min(10, this.build.rail * 2), -20 - Math.min(8, this.build.split))
      ctx.moveTo(2, 12)
      ctx.lineTo(16 + Math.min(10, this.build.rail * 2), 20 + Math.min(8, this.build.split))
      ctx.stroke()
    }
    if (hullGlow > 0) {
      ctx.strokeStyle = '#8fff7d'
      ctx.globalAlpha = 0.72
      ctx.beginPath()
      ctx.moveTo(-8, -8)
      ctx.lineTo(6, -4)
      ctx.moveTo(-8, 8)
      ctx.lineTo(6, 4)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    if (navGlow > 0) {
      ctx.strokeStyle = navGlow >= 6 ? '#fff27a' : '#70a8ff'
      ctx.globalAlpha = 0.35 + Math.min(0.25, navGlow * 0.035)
      ctx.beginPath()
      ctx.arc(-2, 0, 19 + navGlow * 1.8 + Math.sin(this.stats.time * 7) * 1.5, -0.8, 0.8)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    ctx.beginPath()
    ctx.moveTo(-16, -8)
    ctx.strokeStyle = exhaustColor
    ctx.shadowColor = exhaustColor
    ctx.lineTo(-28 - Math.random() * (8 + engineGlow * 2), 0)
    ctx.lineTo(-16, 8)
    ctx.stroke()
    if (this.build.phase > 0) {
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = '#b990ff'
      ctx.beginPath()
      ctx.arc(0, 0, 28 + Math.sin(this.stats.time * 8) * 2, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()

    if (this.player.maxShield > 0 && this.player.shield > 1) {
      ctx.save()
      ctx.strokeStyle = `rgba(112,168,255,${0.25 + this.player.shield / this.player.maxShield * 0.42})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, (this.player.radius + 10) * scale, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.strokeStyle = 'rgba(255,242,122,0.52)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + Math.cos(this.player.aimAngle) * 58 * scale, p.y + Math.sin(this.player.aimAngle) * 58 * scale)
    ctx.stroke()
    ctx.restore()
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    if (this.isHighLoad()) {
      this.renderBulletsSimple(ctx)
      return
    }
    const scale = this.spaceScale()
    for (const b of this.bullets) {
      const p = this.worldToScreen(b.x, b.y)
      if (p.x < -80 || p.x > this.width + 80 || p.y < -80 || p.y > this.height + 80) continue
      ctx.save()
      ctx.strokeStyle = b.color
      ctx.shadowColor = b.color
      ctx.shadowBlur = this.allowGlow() ? (b.rail ? 18 : 10) : 0
      ctx.lineWidth = b.rail ? 3 : 2
      ctx.beginPath()
      if (b.mine) {
        const radius = b.radius * scale
        ctx.arc(p.x, p.y, radius, 0, TAU)
        ctx.moveTo(p.x - radius, p.y)
        ctx.lineTo(p.x + radius, p.y)
      } else {
        const tail = norm(b.vx, b.vy)
        ctx.moveTo(p.x - tail.x * (b.rail ? 26 : 12) * scale, p.y - tail.y * (b.rail ? 26 : 12) * scale)
        ctx.lineTo(p.x + tail.x * (b.rail ? 16 : 7) * scale, p.y + tail.y * (b.rail ? 16 : 7) * scale)
      }
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderBulletsSimple(ctx: CanvasRenderingContext2D) {
    const scale = this.spaceScale()
    ctx.save()
    ctx.shadowBlur = 0
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(215,255,247,0.82)'
    ctx.beginPath()
    for (const b of this.bullets) {
      const { x, y } = this.worldToScreen(b.x, b.y)
      if (x < -80 || x > this.width + 80 || y < -80 || y > this.height + 80) continue
      const mag = Math.hypot(b.vx, b.vy) || 1
      const tx = b.vx / mag
      const ty = b.vy / mag
      const rear = (b.rail ? 24 : 11) * scale
      const nose = (b.rail ? 15 : 7) * scale
      ctx.moveTo(x - tx * rear, y - ty * rear)
      ctx.lineTo(x + tx * nose, y + ty * nose)
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(255,242,122,0.86)'
    ctx.lineWidth = 3
    ctx.beginPath()
    for (const b of this.bullets) {
      if (!b.rail) continue
      const { x, y } = this.worldToScreen(b.x, b.y)
      if (x < -80 || x > this.width + 80 || y < -80 || y > this.height + 80) continue
      const mag = Math.hypot(b.vx, b.vy) || 1
      const tx = b.vx / mag
      const ty = b.vy / mag
      ctx.moveTo(x - tx * 28 * scale, y - ty * 28 * scale)
      ctx.lineTo(x + tx * 18 * scale, y + ty * 18 * scale)
    }
    ctx.stroke()
    ctx.restore()
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    const highLoad = this.isHighLoad()
    if (highLoad) {
      this.renderHordeEnemies(ctx)
      return
    }
    for (const e of this.enemies) {
      const p = this.worldToScreen(e.x, e.y)
      if (p.x < -90 || p.x > this.width + 90 || p.y < -90 || p.y > this.height + 90) continue
      if (isSpriteEnemyKind(e.kind)) {
        this.renderSpaceSpriteEnemy(ctx, e, p)
        continue
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(e.phase)
      ctx.scale(this.spaceScale(), this.spaceScale())
      ctx.strokeStyle = e.flash > 0 ? '#ffffff' : e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = this.allowGlow() ? 12 : 0
      ctx.lineWidth = e.kind === 'warden' || e.kind === 'brute' ? 3 : 2
      ctx.beginPath()
      if (e.kind === 'chaser') {
        for (let i = 0; i < 5; i += 1) {
          const a = (i / 5) * TAU
          const r = i % 2 ? e.radius * 0.62 : e.radius
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      } else if (e.kind === 'splinter') {
        ctx.moveTo(0, -e.radius)
        ctx.lineTo(e.radius, 0)
        ctx.lineTo(0, e.radius)
        ctx.lineTo(-e.radius, 0)
      } else if (e.kind === 'lancer') {
        ctx.moveTo(e.radius * 1.35, 0)
        ctx.lineTo(-e.radius, -e.radius * 0.55)
        ctx.lineTo(-e.radius * 0.45, 0)
        ctx.lineTo(-e.radius, e.radius * 0.55)
      } else if (e.kind === 'mine') {
        for (let i = 0; i < 8; i += 1) {
          const a = (i / 8) * TAU
          const r = i % 2 ? e.radius * 0.52 : e.radius
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      } else if (e.kind === 'brute') {
        for (let i = 0; i < 8; i += 1) {
          const a = (i / 8) * TAU
          const r = i % 2 ? e.radius * 0.7 : e.radius
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      } else if (e.kind === 'shooter') {
        ctx.moveTo(e.radius, 0)
        ctx.lineTo(e.radius * 0.25, e.radius * 0.72)
        ctx.lineTo(-e.radius * 0.85, e.radius * 0.44)
        ctx.lineTo(-e.radius * 0.85, -e.radius * 0.44)
        ctx.lineTo(e.radius * 0.25, -e.radius * 0.72)
      } else {
        for (let i = 0; i < 9; i += 1) {
          const a = (i / 9) * TAU
          const r = i % 2 ? e.radius * 0.58 : e.radius
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.stroke()
      if (e.kind === 'warden') {
        ctx.rotate(-e.phase * 1.7)
        ctx.beginPath()
        ctx.arc(0, 0, e.radius + 13, 0, TAU)
        ctx.stroke()
      } else if (e.kind === 'shooter') {
        ctx.beginPath()
        ctx.arc(0, 0, e.radius * 0.42, 0, TAU)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  private renderSpaceSpriteEnemy(ctx: CanvasRenderingContext2D, e: Enemy, p: Vec) {
    const sheet = this.spaceEnemyCatalog
    if (!sheet.complete || sheet.naturalWidth === 0) {
      this.renderEnemyLod(ctx, e, p)
      return
    }
    const row = spaceEnemyDefinitions[e.kind].spriteRow ?? 0
    const sw = sheet.naturalWidth / 4
    const sh = sheet.naturalHeight / 3
    const frame = Math.floor((e.phase * 8 + e.id) % 4)
    const speed = Math.hypot(e.vx, e.vy)
    const angle = e.kind === 'bulwark'
      ? e.phase * 0.45
      : speed > 8
        ? Math.atan2(e.vy, e.vx)
        : Math.atan2(this.player.y - e.y, this.player.x - e.x)
    const spriteScale = (e.kind === 'bulwark' ? 4.55 : e.kind === 'skimmer' ? 5.35 : 5.85) * this.spaceScale()
    const dw = e.radius * spriteScale
    const dh = e.radius * spriteScale

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(angle)
    ctx.shadowColor = e.color
    ctx.shadowBlur = this.allowGlow() ? (e.kind === 'bulwark' ? 18 : 14) : 0
    ctx.globalAlpha = e.flash > 0 ? 0.92 : 1
    ctx.drawImage(sheet, frame * sw, row * sh, sw, sh, -dw / 2, -dh / 2, dw, dh)
    if (e.flash > 0) {
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, e.radius * 1.35 * this.spaceScale(), 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }

  private renderHordeEnemies(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.shadowBlur = 0
    ctx.lineWidth = 1.45
    this.strokeEnemyBatch(ctx, 'chaser', '#8fff7d')
    this.strokeEnemyBatch(ctx, 'splinter', '#70a8ff')
    this.strokeEnemyBatch(ctx, 'lancer', '#fff27a')
    this.strokeEnemyBatch(ctx, 'mine', '#ff5d73')
    this.strokeEnemyBatch(ctx, 'shooter', '#ff61d8')
    this.strokeEnemyBatch(ctx, 'razor', '#57fff3')
    this.strokeEnemyBatch(ctx, 'skimmer', '#ffe66d')
    ctx.lineWidth = 2.4
    this.strokeEnemyBatch(ctx, 'brute', '#ff9d5c')
    this.strokeEnemyBatch(ctx, 'bulwark', '#f46cff')
    this.strokeEnemyBatch(ctx, 'warden', '#b990ff')
    ctx.lineWidth = 1.8
    ctx.strokeStyle = '#ffffff'
    ctx.beginPath()
    for (const e of this.enemies) {
      if (e.flash <= 0) continue
      const { x, y } = this.worldToScreen(e.x, e.y)
      if (x < -95 || x > this.width + 95 || y < -95 || y > this.height + 95) continue
      this.addEnemyGlyph(ctx, e, x, y)
    }
    ctx.stroke()
    ctx.restore()
  }

  private strokeEnemyBatch(ctx: CanvasRenderingContext2D, kind: EnemyKind, color: string) {
    ctx.strokeStyle = color
    ctx.beginPath()
    for (const e of this.enemies) {
      if (e.kind !== kind || e.flash > 0) continue
      const { x, y } = this.worldToScreen(e.x, e.y)
      if (x < -95 || x > this.width + 95 || y < -95 || y > this.height + 95) continue
      this.addEnemyGlyph(ctx, e, x, y)
    }
    ctx.stroke()
  }

  private addEnemyGlyph(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number) {
    const r = e.radius * this.spaceScale()
    if (e.kind === 'lancer') {
      const dx = this.player.x - e.x
      const dy = this.player.y - e.y
      const m = Math.hypot(dx, dy) || 1
      const ux = dx / m
      const uy = dy / m
      const px = -uy
      const py = ux
      ctx.moveTo(x + ux * r * 1.2, y + uy * r * 1.2)
      ctx.lineTo(x - ux * r * 0.78 + px * r * 0.48, y - uy * r * 0.78 + py * r * 0.48)
      ctx.lineTo(x - ux * r * 0.42, y - uy * r * 0.42)
      ctx.lineTo(x - ux * r * 0.78 - px * r * 0.48, y - uy * r * 0.78 - py * r * 0.48)
      ctx.closePath()
    } else if (e.kind === 'mine') {
      ctx.rect(x - r * 0.58, y - r * 0.58, r * 1.16, r * 1.16)
    } else if (e.kind === 'brute') {
      ctx.moveTo(x + r, y)
      for (let i = 1; i < 8; i += 1) {
        const a = (i / 8) * TAU
        const rr = i % 2 ? r * 0.7 : r
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
      }
      ctx.closePath()
    } else if (e.kind === 'shooter') {
      const dx = this.player.x - e.x
      const dy = this.player.y - e.y
      const m = Math.hypot(dx, dy) || 1
      const ux = dx / m
      const uy = dy / m
      const px = -uy
      const py = ux
      ctx.moveTo(x + ux * r, y + uy * r)
      ctx.lineTo(x + px * r * 0.72 - ux * r * 0.25, y + py * r * 0.72 - uy * r * 0.25)
      ctx.lineTo(x - ux * r * 0.88, y - uy * r * 0.88)
      ctx.lineTo(x - px * r * 0.72 - ux * r * 0.25, y - py * r * 0.72 - uy * r * 0.25)
      ctx.closePath()
    } else if (e.kind === 'razor') {
      const speed = Math.hypot(e.vx, e.vy)
      const ux = speed > 8 ? e.vx / speed : 1
      const uy = speed > 8 ? e.vy / speed : 0
      const px = -uy
      const py = ux
      ctx.moveTo(x + ux * r * 1.9, y + uy * r * 1.9)
      ctx.lineTo(x - ux * r * 1.15 + px * r * 0.72, y - uy * r * 1.15 + py * r * 0.72)
      ctx.lineTo(x - ux * r * 0.32, y - uy * r * 0.32)
      ctx.lineTo(x - ux * r * 1.15 - px * r * 0.72, y - uy * r * 1.15 - py * r * 0.72)
      ctx.closePath()
    } else if (e.kind === 'skimmer') {
      ctx.moveTo(x + r * 1.1, y - r * 0.55)
      ctx.lineTo(x - r * 0.2, y - r * 1.08)
      ctx.lineTo(x - r * 1.15, y - r * 0.35)
      ctx.lineTo(x - r * 0.88, y + r * 0.72)
      ctx.lineTo(x + r * 0.86, y + r * 0.72)
      ctx.closePath()
    } else if (e.kind === 'bulwark') {
      ctx.moveTo(x + r, y)
      ctx.arc(x, y, r, 0, TAU)
      ctx.moveTo(x + r * 0.62, y)
      ctx.arc(x, y, r * 0.62, 0, TAU)
      ctx.moveTo(x, y - r * 0.78)
      ctx.lineTo(x + r * 0.62, y)
      ctx.lineTo(x, y + r * 0.78)
      ctx.lineTo(x - r * 0.62, y)
      ctx.closePath()
    } else if (e.kind === 'warden') {
      ctx.moveTo(x + r, y)
      ctx.arc(x, y, r, 0, TAU)
      ctx.moveTo(x + r + 12, y)
      ctx.arc(x, y, r + 12, 0, TAU)
    } else {
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
    }
  }

  private renderEnemyLod(ctx: CanvasRenderingContext2D, e: Enemy, p: Vec) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(e.phase)
    ctx.scale(this.spaceScale(), this.spaceScale())
    ctx.strokeStyle = e.flash > 0 ? '#ffffff' : e.color
    ctx.lineWidth = 1.5
    const r = e.radius
    ctx.beginPath()
    if (e.kind === 'lancer') {
      ctx.moveTo(r * 1.25, 0)
      ctx.lineTo(-r * 0.8, -r * 0.45)
      ctx.lineTo(-r * 0.55, 0)
      ctx.lineTo(-r * 0.8, r * 0.45)
    } else if (e.kind === 'mine') {
      ctx.rect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1)
    } else if (e.kind === 'brute') {
      ctx.moveTo(r, 0)
      for (let i = 1; i < 8; i += 1) {
        const a = (i / 8) * TAU
        const rr = i % 2 ? r * 0.7 : r
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
      }
      ctx.closePath()
    } else if (e.kind === 'shooter') {
      ctx.moveTo(r, 0)
      ctx.lineTo(r * 0.22, r * 0.72)
      ctx.lineTo(-r * 0.9, 0)
      ctx.lineTo(r * 0.22, -r * 0.72)
      ctx.closePath()
    } else if (e.kind === 'razor') {
      ctx.moveTo(r * 1.8, 0)
      ctx.lineTo(-r * 1.05, r * 0.7)
      ctx.lineTo(-r * 0.32, 0)
      ctx.lineTo(-r * 1.05, -r * 0.7)
      ctx.closePath()
    } else if (e.kind === 'skimmer') {
      ctx.moveTo(r * 1.1, -r * 0.55)
      ctx.lineTo(-r * 0.2, -r * 1.05)
      ctx.lineTo(-r * 1.1, -r * 0.35)
      ctx.lineTo(-r * 0.85, r * 0.7)
      ctx.lineTo(r * 0.85, r * 0.7)
      ctx.closePath()
    } else if (e.kind === 'bulwark') {
      ctx.moveTo(r, 0)
      ctx.arc(0, 0, r, 0, TAU)
      ctx.moveTo(r * 0.62, 0)
      ctx.arc(0, 0, r * 0.62, 0, TAU)
    } else {
      ctx.moveTo(0, -r)
      ctx.lineTo(r, 0)
      ctx.lineTo(0, r)
      ctx.lineTo(-r, 0)
      ctx.closePath()
    }
    ctx.stroke()
    ctx.restore()
  }

  private renderPickups(ctx: CanvasRenderingContext2D) {
    const highLoad = this.isHighLoad()
    const scale = this.spaceScale()
    for (const p of this.pickups) {
      const s = this.worldToScreen(p.x, p.y)
      if (s.x < -60 || s.x > this.width + 60 || s.y < -60 || s.y > this.height + 60) continue
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.strokeStyle = p.color
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = highLoad ? 0 : this.allowGlow() ? 18 : 10
      ctx.lineWidth = 2
      const pulse = 1 + Math.sin(this.stats.time * 5 + p.value) * 0.08
      const r = p.radius * pulse * scale
      ctx.globalAlpha = 0.28
      ctx.beginPath()
      ctx.arc(0, 0, r + 8, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 0.95
      ctx.beginPath()
      if (p.kind === 'xp') {
        ctx.arc(0, 0, Math.max(4, r * 0.55), 0, TAU)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.moveTo(-r - 3, 0)
        ctx.lineTo(r + 3, 0)
        ctx.moveTo(0, -r - 3)
        ctx.lineTo(0, r + 3)
      } else if (p.kind === 'chest') {
        ctx.roundRect(-r, -r * 0.72, r * 2, r * 1.44, 4)
        ctx.moveTo(-r, -r * 0.18)
        ctx.lineTo(r, -r * 0.18)
        ctx.moveTo(0, -r * 0.72)
        ctx.lineTo(0, r * 0.72)
      } else if (p.kind === 'repair') {
        ctx.arc(0, 0, r, 0, TAU)
        ctx.moveTo(-r * 0.58, 0)
        ctx.lineTo(r * 0.58, 0)
        ctx.moveTo(0, -r * 0.58)
        ctx.lineTo(0, r * 0.58)
      } else if (p.kind === 'magnet') {
        ctx.arc(0, 0, r, Math.PI * 0.18, Math.PI * 0.82)
        ctx.moveTo(-r * 0.82, r * 0.18)
        ctx.lineTo(-r * 0.82, r * 0.76)
        ctx.moveTo(r * 0.82, r * 0.18)
        ctx.lineTo(r * 0.82, r * 0.76)
      } else {
        ctx.arc(0, 0, r, 0, TAU)
      }
      ctx.stroke()
      if (p.kind === 'xp') {
        ctx.globalAlpha = 0.42
        ctx.beginPath()
        ctx.arc(0, 0, r + 14, 0, TAU)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    const highLoad = this.isHighLoad()
    if (highLoad) {
      this.renderParticlesSimple(ctx)
      return
    }
    const surfaceMode = this.surface && (this.state === 'surface' || this.state === 'takeoff' || (this.state === 'landing' && this.transitionTimer / this.transitionDuration > 0.58))
    ctx.save()
    ctx.globalCompositeOperation = this.allowGlow() ? 'lighter' : 'source-over'
    const visibleBudget = highLoad ? 160 : MAX_PARTICLES
    let drawn = 0
    for (const p of this.particles) {
      const s = this.effectToScreen(p.x, p.y)
      if (s.x < -80 || s.x > this.width + 80 || s.y < -80 || s.y > this.height + 80) continue
      if (drawn++ > visibleBudget) break
      ctx.save()
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1)
      ctx.strokeStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = this.allowGlow() ? p.glow ?? 10 : 0
      ctx.lineWidth = p.sides ? 1.5 : clamp(p.size, 1, 3)
      ctx.translate(s.x, s.y)
      ctx.rotate(p.angle ?? 0)
      if (!surfaceMode) ctx.scale(this.spaceScale(), this.spaceScale())
      ctx.beginPath()
      if (p.sides && p.sides > 2) {
        for (let i = 0; i < p.sides; i += 1) {
          const a = (i / p.sides) * TAU
          const r = p.size * (i % 2 ? 0.55 : 1)
          const x = Math.cos(a) * r
          const y = Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
      } else {
        const length = p.length ?? Math.hypot(p.vx, p.vy) * 0.04
        ctx.moveTo(0, 0)
        ctx.lineTo(-length, 0)
      }
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }

  private renderParticlesSimple(ctx: CanvasRenderingContext2D) {
    const surfaceMode = this.surface && (this.state === 'surface' || this.state === 'takeoff' || (this.state === 'landing' && this.transitionTimer / this.transitionDuration > 0.58))
    const camX = surfaceMode ? this.surface!.camera.x : this.camera.x
    const camY = surfaceMode ? this.surface!.camera.y : this.camera.y
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.78
    ctx.strokeStyle = 'rgba(215,255,247,0.76)'
    ctx.lineWidth = 1
    ctx.beginPath()
    let drawn = 0
    for (const p of this.particles) {
      const screen = surfaceMode ? { x: p.x - camX, y: p.y - camY } : this.worldToScreen(p.x, p.y)
      const x = screen.x
      const y = screen.y
      if (x < -80 || x > this.width + 80 || y < -80 || y > this.height + 80) continue
      if (drawn++ > 140) break
      const alpha = clamp(p.life / p.maxLife, 0, 1)
      const length = Math.max(3, (p.length ?? Math.hypot(p.vx, p.vy) * 0.035) * alpha * (surfaceMode ? 1 : this.spaceScale()))
      const mag = Math.hypot(p.vx, p.vy) || 1
      ctx.moveTo(x, y)
      ctx.lineTo(x - (p.vx / mag) * length, y - (p.vy / mag) * length)
    }
    ctx.stroke()
    ctx.restore()
  }

  private renderShockwaves(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = this.allowGlow() ? 'lighter' : 'source-over'
    const highLoad = this.isHighLoad()
    const glow = this.allowGlow()
    for (const w of this.shockwaves) {
      const s = this.effectToScreen(w.x, w.y)
      const radius = w.radius * (this.surface && (this.state === 'surface' || this.state === 'takeoff' || (this.state === 'landing' && this.transitionTimer / this.transitionDuration > 0.58)) ? 1 : this.spaceScale())
      if (s.x + radius < -120 || s.x - radius > this.width + 120 || s.y + radius < -120 || s.y - radius > this.height + 120) continue
      const alpha = clamp(w.life / w.maxLife, 0, 1)
      const points = highLoad ? 10 : glow ? 28 : 18
      ctx.save()
      ctx.globalAlpha = alpha * 0.92
      ctx.strokeStyle = w.color
      ctx.shadowColor = w.color
      ctx.shadowBlur = glow ? 42 : highLoad ? 0 : 22
      ctx.lineWidth = (glow ? 2.6 : 2) + alpha * (glow ? 4.6 : 3)
      ctx.beginPath()
      for (let i = 0; i <= points; i += 1) {
        const a = (i / points) * TAU
        const wobble = Math.sin(a * 5 + w.jag) * 0.12 + Math.sin(a * 9 - w.jag) * 0.06
        const r = radius * (1 + wobble)
        const x = s.x + Math.cos(a) * r
        const y = s.y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = alpha * (glow ? 0.42 : 0.25)
      ctx.lineWidth = glow ? 12 : 8
      ctx.stroke()
      if (glow) {
        ctx.globalAlpha = alpha * 0.2
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < 10; i += 1) {
          const a = (i / 10) * TAU + w.jag
          ctx.moveTo(s.x + Math.cos(a) * radius * 0.18, s.y + Math.sin(a) * radius * 0.18)
          ctx.lineTo(s.x + Math.cos(a) * radius * 0.96, s.y + Math.sin(a) * radius * 0.96)
        }
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.restore()
  }

  private renderOrbitals(ctx: CanvasRenderingContext2D) {
    const count = this.build.orbit
    if (count <= 0) return
    const center = this.worldToScreen(this.player.x, this.player.y)
    const scale = this.spaceScale()
    const radius = (66 + count * 8) * scale
    const glow = this.allowGlow()
    ctx.save()
    ctx.globalCompositeOperation = glow ? 'lighter' : 'source-over'
    ctx.strokeStyle = '#8fff7d'
    ctx.shadowColor = '#8fff7d'
    ctx.shadowBlur = glow ? 28 : this.isHighLoad() ? 0 : 14
    for (let i = 0; i < count; i += 1) {
      const a = this.stats.time * (2.4 + count * 0.18) + (i / count) * TAU
      const x = center.x + Math.cos(a) * radius
      const y = center.y + Math.sin(a) * radius
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(a) * 12 * scale, y - Math.sin(a) * 12 * scale)
      ctx.lineTo(x + Math.cos(a) * 12 * scale, y + Math.sin(a) * 12 * scale)
      ctx.stroke()
      if (glow) {
        ctx.globalAlpha = 0.28
        ctx.lineWidth = 5
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.lineWidth = 1
      }
    }
    ctx.restore()
  }

  private renderLandingPrompt(ctx: CanvasRenderingContext2D) {
    if (this.state !== 'playing') return
    const planet = this.planets.find((p) => Math.sqrt(dist2(p, this.player)) < p.radius + 86)
    if (!planet) return
    const s = this.worldToScreen(planet.x, planet.y - planet.radius - 42)
    ctx.save()
    ctx.fillStyle = '#fff27a'
    ctx.font = '13px Courier New'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = 12
    ctx.fillText(`PRESS E / Y TO LAND: ${planet.name}`, s.x, s.y)
    ctx.restore()
  }

  private renderMinimap() {
    const ctx = this.miniCtx
    const w = 154
    const h = 154
    const scale = CHUNK_SIZE * (CHUNK_LOAD_RADIUS * 2 + 1)
    const toMini = (x: number, y: number) => ({
      x: w / 2 + ((x - this.player.x) / scale) * w,
      y: h / 2 + ((y - this.player.y) / scale) * h
    })
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(2,8,12,0.72)'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(87,255,243,0.5)'
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    ctx.strokeStyle = 'rgba(87,255,243,0.18)'
    ctx.beginPath()
    ctx.moveTo(w / 2, 8)
    ctx.lineTo(w / 2, h - 8)
    ctx.moveTo(8, h / 2)
    ctx.lineTo(w - 8, h / 2)
    ctx.stroke()
    for (const p of this.planets) {
      const m = toMini(p.x, p.y)
      if (m.x < -6 || m.x > w + 6 || m.y < -6 || m.y > h + 6) continue
      ctx.strokeStyle = p.visited ? '#8fff7d' : p.color
      ctx.beginPath()
      ctx.arc(m.x, m.y, p.visited ? 4 : 3, 0, TAU)
      ctx.stroke()
    }
    for (const e of this.enemies.slice(0, 70)) {
      const m = toMini(e.x, e.y)
      if (m.x < 0 || m.x > w || m.y < 0 || m.y > h) continue
      ctx.fillStyle = e.kind === 'warden' ? '#b990ff' : '#ff5d73'
      ctx.fillRect(m.x - 1, m.y - 1, 2, 2)
    }
    ctx.fillStyle = '#57fff3'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 4, 0, TAU)
    ctx.fill()
  }

  private updateHud() {
    this.ui.score.textContent = Math.floor(this.stats.score).toString()
    this.ui.time.textContent = formatTime(this.stats.time)
    this.ui.wave.textContent = this.stats.kills.toString()
    this.ui.high.textContent = Math.max(this.stats.highScore, this.stats.score).toString()
    const beaconText = this.returnBeacon
      ? ` // RETURN BEACON ${Math.floor(Math.sqrt(dist2(this.returnBeacon, this.player)))}`
      : ''
    this.ui.resources.textContent = `Scrap ${this.resources.scrap}  Crystals ${this.resources.crystal}  Cores ${this.resources.cores}${beaconText}`
    if (this.state === 'surface' && this.surface) {
      this.ui.hullLabel.textContent = 'HEALTH'
      this.ui.xpLabel.textContent = 'O2'
      this.ui.hull.textContent = `${Math.ceil(this.surface.pilot.health)}/${this.surface.pilot.maxHealth}`
      this.ui.level.textContent = `${Math.ceil(this.surface.pilot.oxygen)}s`
      this.ui.hullFill.style.width = `${clamp((this.surface.pilot.health / this.surface.pilot.maxHealth) * 100, 0, 100)}%`
      this.ui.xpFill.style.width = `${clamp((this.surface.pilot.oxygen / this.surface.pilot.maxOxygen) * 100, 0, 100)}%`
    } else {
      this.ui.hullLabel.textContent = 'HULL'
      this.ui.xpLabel.textContent = 'XP'
      this.ui.level.textContent = `LV ${this.stats.level}`
      const shield = this.player.maxShield > 0 ? ` +${Math.floor(this.player.shield)}` : ''
      this.ui.hull.textContent = `${Math.ceil(Math.max(0, this.player.hull))}/${this.player.maxHull}${shield}`
      this.ui.hullFill.style.width = `${clamp((Math.max(0, this.player.hull) / this.player.maxHull) * 100, 0, 100)}%`
      this.ui.xpFill.style.width = `${clamp((this.stats.xp / this.stats.nextXp) * 100, 0, 100)}%`
    }
    this.updateTouchHud()
    this.updatePerfHud()
  }

  private updatePerfHud() {
    this.ui.perf.textContent = ''
  }

  private updateTouchHud() {
    const show = this.state === 'playing' || this.state === 'surface'
    this.ui.touchControls.classList.toggle('visible', show)
    if (this.touchStick.active) {
      const rawDx = this.touchStick.x - this.touchStick.startX
      const rawDy = this.touchStick.y - this.touchStick.startY
      const length = Math.hypot(rawDx, rawDy)
      const scale = length > 82 ? 82 / length : 1
      const dx = rawDx * scale
      const dy = rawDy * scale
      this.ui.touchKnob.style.transform = `translate(${dx}px, ${dy}px)`
      this.ui.touchStick.style.setProperty('--touch-line', `${Math.min(82, length)}px`)
      this.ui.touchStick.style.setProperty('--touch-angle', `${Math.atan2(dy, dx)}rad`)
    } else {
      this.ui.touchKnob.style.transform = 'translate(0, 0)'
      this.ui.touchStick.style.setProperty('--touch-line', '0px')
    }
    if (this.state === 'surface') {
      const lore = this.findNearbyLoreSite()
      const alien = this.findNearbyAlien()
      const nearShip = Boolean(this.surface && Math.sqrt(dist2(this.surface.pilot, this.surface.ship)) < 64)
      const action = touchActionLabel({ state: 'surface', nearLore: Boolean(lore), nearAlien: Boolean(alien), nearShip })
      this.ui.touchAction.classList.toggle('hidden', !action)
      this.ui.touchAction.textContent = action ?? ''
      this.ui.touchDash.textContent = this.findSurfaceTarget() ? 'AUTO' : 'SAFE'
      return
    }
    const planet = this.planets.find((p) => Math.sqrt(dist2(p, this.player)) < p.radius + 86)
    const action = touchActionLabel({
      state: 'playing',
      planetNearby: Boolean(planet),
      returnBeaconAvailable: Boolean(this.returnBeacon && !this.autoNavTargetBeacon),
      canPlanetLock: Boolean(!this.autoNavTargetPlanetId && !this.returnBeacon && this.build.nav >= 3 && this.planets.length)
    })
    this.ui.touchAction.classList.toggle('hidden', !action)
    this.ui.touchAction.textContent = action ?? ''
    this.ui.touchDash.textContent = 'DASH'
  }

  private renderLevelUp(title: string, copy: string) {
    this.ui.levelup.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel workbench-panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = title
    const p = document.createElement('p')
    p.className = 'copy'
    p.textContent = copy
    const tabs = document.createElement('div')
    tabs.className = 'workbench-tabs'
    const upgradesTab = document.createElement('button')
    upgradesTab.className = `workbench-tab ${this.workbenchView === 'upgrades' ? 'active' : ''}`
    upgradesTab.textContent = 'Upgrades'
    upgradesTab.addEventListener('click', () => {
      if (this.workbenchInstalling || this.workbenchView === 'upgrades') return
      this.workbenchView = 'upgrades'
      this.renderLevelUp(title, copy)
    })
    const manifestTab = document.createElement('button')
    manifestTab.className = `workbench-tab ${this.workbenchView === 'manifest' ? 'active' : ''}`
    manifestTab.textContent = 'Manifest'
    manifestTab.addEventListener('click', () => {
      if (this.workbenchInstalling || this.workbenchView === 'manifest') return
      this.workbenchView = 'manifest'
      this.renderLevelUp(title, copy)
    })
    const artifactsTab = document.createElement('button')
    artifactsTab.className = `workbench-tab ${this.workbenchView === 'artifacts' ? 'active' : ''}`
    artifactsTab.textContent = 'Artifacts'
    artifactsTab.addEventListener('click', () => {
      if (this.workbenchInstalling || this.workbenchView === 'artifacts') return
      this.workbenchView = 'artifacts'
      this.renderLevelUp(title, copy)
    })
    tabs.append(upgradesTab, manifestTab, artifactsTab)
    if (this.workbenchView === 'upgrades' && this.workbenchRerolls > 0) {
      const reroll = document.createElement('button')
      reroll.className = 'workbench-tab reroll'
      reroll.textContent = `Reroll (${this.workbenchRerolls})`
      reroll.addEventListener('click', () => {
        if (this.workbenchRerolls <= 0 || this.workbenchInstalling) return
        this.workbenchRerolls -= 1
        this.upgradeChoices = this.rollUpgrades(this.upgradeChoices.length || 3)
        this.renderLevelUp(title, copy)
      })
      tabs.append(reroll)
    }
    const view = document.createElement('div')
    view.className = `workbench-view ${this.workbenchView}`
    const grid = document.createElement('div')
    grid.className = 'choice-grid workbench-list'
    for (const choice of this.upgradeChoices) {
      const button = document.createElement('button')
      button.className = `choice ${choice.kind}${choice.kind === 'upgrade' ? ` ${choice.upgrade.bucket}` : ''}`
      button.innerHTML = this.choiceMarkup(choice)
      button.disabled = !this.canApplyWorkbenchChoice(choice)
      button.addEventListener('click', () => this.beginWorkbenchInstall(choice, button))
      grid.append(button)
    }
    if (this.workbenchView === 'upgrades' && this.mothership.departments.workbench >= 4 && this.pendingUpgrades > 0) {
      const recycle = document.createElement('button')
      recycle.className = 'choice limit'
      recycle.innerHTML = '<strong>Recycle Signal</strong><em>WORKBENCH BAY</em><span>Convert this mutation signal into salvage instead of installing an upgrade.</span>'
      recycle.addEventListener('click', () => this.recycleWorkbenchSignal())
      grid.append(recycle)
    }
    if (this.workbenchView === 'upgrades') view.append(grid)
    else if (this.workbenchView === 'manifest') view.append(this.renderBuildManifest())
    else view.append(this.renderArtifactsCollection())
    panel.append(h, p, tabs, view)
    this.ui.levelup.append(panel)
    this.showOnly('levelup')
  }

  private recycleWorkbenchSignal() {
    if (this.workbenchInstalling || this.pendingUpgrades <= 0 || this.mothership.departments.workbench < 4) return
    const scrap = 70 + Math.floor(this.stats.level * 8)
    const crystal = 4 + Math.floor(this.stats.planets * 2)
    this.resources.scrap += scrap
    this.resources.crystal += crystal
    this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1)
    this.toast(`SIGNAL RECYCLED: +${scrap} SCRAP +${crystal} CRYSTALS`)
    if (this.pendingUpgrades > 0) {
      this.openLevelUp('SHIPBOARD WORKBENCH', `${this.pendingUpgrades} mutation signal${this.pendingUpgrades === 1 ? '' : 's'} remain before takeoff.`)
      return
    }
    this.showOnly(null)
    if (this.takeoffAfterWorkbench) {
      this.takeoffAfterWorkbench = false
      this.startTakeoff()
    } else {
      this.state = 'playing'
    }
  }

  private beginWorkbenchInstall(choice: WorkbenchChoice, button: HTMLButtonElement) {
    if (this.workbenchInstalling) return
    if (!this.canApplyWorkbenchChoice(choice)) {
      button.disabled = true
      button.classList.add('invalid')
      this.toast('SYSTEM ALREADY MAXED')
      this.upgradeChoices = this.rollUpgrades(this.upgradeChoices.length || 3)
      this.renderLevelUp('SHIPBOARD WORKBENCH', `${this.pendingUpgrades} mutation signal${this.pendingUpgrades === 1 ? '' : 's'} remain before takeoff.`)
      return
    }
    this.workbenchInstalling = true
    const rare = choice.kind !== 'upgrade' || choice.upgrade.rarity < 65
    this.audio.install(this.installCueFor(choice), rare)
    this.camera.shake = Math.max(this.camera.shake, rare ? 10 : 6)
    const color = choice.kind === 'evolution' || choice.kind === 'relic' ? '#fff27a' : choice.kind === 'limit' ? '#70a8ff' : this.upgradeFxColor(choice.upgrade)
    button.style.setProperty('--install-color', color)
    const anchor = this.surface?.ship ?? this.player
    this.burst(anchor.x, anchor.y, color, rare ? 28 : 18, rare ? 260 : 190)
    button.classList.add('selected')
    for (const el of Array.from(this.ui.levelup.querySelectorAll<HTMLButtonElement>('.choice'))) el.disabled = true
    window.setTimeout(() => this.applyWorkbenchChoice(choice), rare ? 760 : 560)
  }

  private installCueFor(choice: WorkbenchChoice): AudioUpgradeCue {
    if (choice.kind === 'upgrade') return choice.upgrade.bucket
    return choice.kind
  }

  private canApplyWorkbenchChoice(choice: WorkbenchChoice) {
    if (choice.kind === 'upgrade') return this.build[choice.upgrade.id] < choice.upgrade.max
    if (choice.kind === 'evolution') {
      const upgrade = upgrades.find((candidate) => candidate.id === choice.evolution.weapon)
      return !!upgrade && this.build[choice.evolution.weapon] >= upgrade.max && this.relics.has(choice.evolution.relic) && !this.evolved.has(choice.evolution.weapon)
    }
    if (choice.kind === 'relic') return !this.relics.has(choice.relic.id)
    return true
  }

  private choiceTitle(choice: WorkbenchChoice) {
    if (choice.kind === 'upgrade') return choice.upgrade.name
    if (choice.kind === 'evolution') return choice.evolution.name
    if (choice.kind === 'relic') return choice.relic.name
    return choice.name
  }

  private renderBuildManifest() {
    const wrap = document.createElement('div')
    wrap.className = 'build-manifest'
    const title = document.createElement('div')
    title.className = 'manifest-title'
    title.innerHTML = '<b>BUILD MANIFEST</b><span>locked systems, owned ranks, and evolution routes</span>'
    const summary = document.createElement('div')
    summary.className = 'manifest-summary'
    const ownedCount = upgrades.filter((upgrade) => this.build[upgrade.id] > 0).length
    const maxedCount = upgrades.filter((upgrade) => this.build[upgrade.id] >= upgrade.max).length
    const limitCount = Object.values(this.limitBreaks).reduce((sum, value) => sum + value, 0)
    summary.innerHTML = `
      <div><b>${ownedCount}/${upgrades.length}</b><span>systems</span></div>
      <div><b>${maxedCount}</b><span>maxed</span></div>
      <div><b>${this.relics.size}/${relics.length}</b><span>relics</span></div>
      <div><b>${this.evolved.size}/${evolutions.length}</b><span>evolved</span></div>
      <div><b>${limitCount}</b><span>limits</span></div>
    `
    const chips = document.createElement('div')
    chips.className = 'manifest-grid'
    for (const upgrade of upgrades) {
      const level = this.build[upgrade.id]
      const maxed = level >= upgrade.max
      const evolved = this.evolved.has(upgrade.id)
      const catalyst = upgrade.catalyst ? relics.find((relic) => relic.id === upgrade.catalyst) : null
      const ready = maxed && catalyst && this.relics.has(catalyst.id) && !evolved
      const chip = document.createElement('div')
      chip.className = `manifest-chip ${level > 0 ? 'owned' : 'locked'} ${maxed ? 'maxed' : ''} ${ready ? 'ready' : ''} ${evolved ? 'evolved' : ''}`
      const route = evolved ? 'EVOLVED' : ready ? 'EVOLUTION READY' : catalyst ? `CATALYST: ${catalyst.name}` : upgrade.category === 'weapon' ? 'WEAPON SYSTEM' : 'SHIP SYSTEM'
      chip.innerHTML = `
        <div class="manifest-chip-head">
          <strong>${this.escape(upgrade.name)}</strong>
          <b>${level}/${upgrade.max}</b>
        </div>
        <span>${this.escape(route)}</span>
        <em>${this.bucketLabel(upgrade.bucket)}</em>
      `
      chips.append(chip)
    }
    const relicLine = document.createElement('div')
    relicLine.className = 'manifest-relics'
    relicLine.textContent = this.relics.size > 0
      ? Array.from(this.relics).map((id) => relics.find((relic) => relic.id === id)?.name ?? id).join(' // ')
      : 'No relics installed yet.'
    wrap.append(title, summary, chips, relicLine)
    return wrap
  }

  private renderArtifactsCollection() {
    const wrap = document.createElement('div')
    wrap.className = 'artifact-collection'
    const title = document.createElement('div')
    title.className = 'manifest-title'
    title.innerHTML = '<b>ARTEFACT ARCHIVE</b><span>relics, contacts, ruins, caches, and planet firsts</span>'
    const summary = document.createElement('div')
    summary.className = 'manifest-summary artifact-summary'
    const unlocked = Array.from(this.artifacts.values())
    const counts: Record<ArtifactKind, number> = { relic: 0, alien: 0, lore: 0, planet: 0, cache: 0 }
    for (const artifact of unlocked) counts[artifact.kind] += 1
    summary.innerHTML = `
      <div><b>${counts.relic}/${relics.length}</b><span>relics</span></div>
      <div><b>${counts.alien}</b><span>contacts</span></div>
      <div><b>${counts.lore}</b><span>ruins</span></div>
      <div><b>${counts.planet}</b><span>planets</span></div>
      <div><b>${counts.cache}</b><span>caches</span></div>
    `
    const grid = document.createElement('div')
    grid.className = 'artifact-grid'
    for (const card of orderArtifactArchiveCards(this.artifactCards())) grid.append(this.artifactCard(card.record, card.locked))
    wrap.append(title, summary, grid)
    return wrap
  }

  private artifactCards() {
    const cards: Array<{ record: ArtifactRecord; locked: boolean }> = []
    for (const relic of relics) {
      const id = `relic:${relic.id}`
      const found = this.artifacts.get(id)
      cards.push({
        locked: !found,
        record: found ?? {
          id,
          kind: 'relic',
          title: 'Unknown Relic',
          detail: 'Signature not recovered this run.',
          source: 'Relic signal',
          color: '#fff27a',
          icon: hashString(relic.id, 41) % 12,
          count: 0
        }
      })
    }
    for (const artifact of this.artifacts.values()) {
      if (artifact.kind !== 'relic') cards.push({ record: artifact, locked: false })
    }
    return cards
  }

  private artifactCard(record: ArtifactRecord, locked: boolean) {
    const card = document.createElement('div')
    card.className = `artifact-card ${record.kind} ${locked ? 'locked' : 'found'}`
    const meta = document.createElement('div')
    meta.className = 'artifact-meta'
    const count = record.count > 1 ? ` x${record.count}` : ''
    meta.innerHTML = `<strong>${this.escape(record.title)}${count}</strong><span>${this.escape(record.detail)}</span><em>${this.escape(record.source)}</em>`
    card.append(this.artifactIcon(record, locked), meta)
    return card
  }

  private artifactIcon(record: ArtifactRecord, locked = false) {
    const icon = document.createElement('div')
    icon.className = `artifact-icon ${record.kind} shape-${record.icon % 12} ${locked ? 'locked' : ''}`
    icon.style.setProperty('--artifact-color', locked ? 'rgba(215, 255, 247, 0.28)' : record.color)
    icon.style.setProperty('--artifact-spin', `${(record.icon % 8) * 45}deg`)
    for (let i = 0; i < 4; i += 1) {
      const mark = document.createElement('span')
      mark.className = `artifact-mark m${i + 1}`
      icon.append(mark)
    }
    return icon
  }

  private recordArtifact(record: Omit<ArtifactRecord, 'count'>) {
    const existing = this.artifacts.get(record.id)
    if (existing) {
      existing.count += 1
      existing.detail = record.detail
      existing.source = record.source
      return
    }
    this.artifacts.set(record.id, { ...record, count: 1 })
  }

  private artifactColor(kind: ArtifactKind, key: string) {
    const palettes: Record<ArtifactKind, string[]> = {
      relic: ['#fff27a', '#f8fffb', '#b990ff'],
      alien: ['#b990ff', '#57fff3', '#8fff7d'],
      lore: ['#d7fff7', '#70a8ff', '#fff27a'],
      planet: ['#57fff3', '#8fff7d', '#ff5d73', '#b990ff'],
      cache: ['#fff27a', '#70a8ff', '#57fff3']
    }
    const colors = palettes[kind]
    return colors[hashString(key, 73) % colors.length]
  }

  private choiceMarkup(choice: WorkbenchChoice) {
    if (choice.kind === 'upgrade') {
      const level = this.build[choice.upgrade.id] + 1
      const detail = choice.upgrade.levels[level - 1] ?? choice.upgrade.description
      const systemLabel = choice.upgrade.bucket === 'spacesuit' ? 'SUIT' : choice.upgrade.category === 'weapon' ? 'WEAPON' : 'SHIP'
      const tag = `${this.bucketLabel(choice.upgrade.bucket)} // ${systemLabel}`
      return `<strong>${this.escape(choice.upgrade.name)} ${level}/${choice.upgrade.max}</strong><em>${tag}</em><span>${this.escape(detail)}</span>`
    }
    if (choice.kind === 'evolution') {
      return `<strong>${this.escape(choice.evolution.name)}</strong><em>EVOLUTION</em><span>${this.escape(choice.evolution.description)}</span>`
    }
    if (choice.kind === 'relic') {
      const downside = choice.relic.downside ? ` Risk: ${choice.relic.downside}` : ''
      return `<strong>${this.escape(choice.relic.name)}</strong><em>RELIC</em><span>${this.escape(choice.relic.description + downside)}</span>`
    }
    return `<strong>${this.escape(choice.name)}</strong><em>LIMIT BREAK</em><span>${this.escape(choice.description)}</span>`
  }

  private bucketLabel(bucket: UpgradeBucket) {
    const labels: Record<UpgradeBucket, string> = {
      weapons: 'WEAPONS',
      navigation: 'NAVIGATION',
      survival: 'SURVIVAL',
      economy: 'ECONOMY',
      planetcraft: 'PLANETCRAFT',
      spacesuit: 'SPACESUIT',
      control: 'CONTROL'
    }
    return labels[bucket]
  }

  private renderPlanet(p: Planet) {
    this.ui.planet.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = p.name
    const copy = document.createElement('p')
    copy.className = 'copy'
    const scanner = this.mothership.departments.scanner
    const risk = this.planetRiskLabel(p)
    copy.textContent = p.visited
      ? 'The dock remembers you. It offers a small repair and a moment of quiet.'
      : scanner >= 3
        ? `${p.reward} Risk: ${risk}.`
        : scanner >= 1
          ? `${p.archetype.toUpperCase()} SIGNAL // ${p.reward}`
          : p.reward
    const row = document.createElement('div')
    row.className = 'button-row'
    const land = document.createElement('button')
    land.className = 'vector-button'
    land.textContent = p.visited ? 'Dock' : 'Land and Salvage'
    land.addEventListener('click', () => this.confirmLanding())
    const leave = document.createElement('button')
    leave.className = 'vector-button secondary'
    leave.textContent = 'Break Orbit'
    leave.addEventListener('click', () => {
      this.state = 'playing'
      this.showOnly(null)
    })
    row.append(land, leave)
    panel.append(h, copy, row)
    this.ui.planet.append(panel)
    this.showOnly('planet')
  }

  private planetRiskLabel(p: Planet) {
    if (p.archetype === 'horde') return 'EXTREME'
    if (p.archetype === 'hostile' || p.archetype === 'strange') return 'HOSTILE'
    if (p.archetype === 'relic' || p.archetype === 'cache') return 'UNSTABLE'
    return 'QUIET'
  }

  private showTitle() {
    this.state = 'title'
    this.ui.title.innerHTML = ''
    this.ui.title.className = 'screen title-screen'
    const panel = document.createElement('div')
    panel.className = 'title-panel'
    const logo = document.createElement('img')
    logo.className = 'title-mark'
    logo.src = titleLogoMarkUrl
    logo.alt = 'Galactic Hordes ship emblem'
    const wordmark = document.createElement('h1')
    wordmark.className = 'title-wordmark'
    wordmark.innerHTML = '<span>GALACTIC</span><span>HORDES</span>'
    const row = document.createElement('div')
    row.className = 'title-actions'
    const start = document.createElement('button')
    start.className = 'vector-button start-button'
    start.textContent = 'Mothership'
    start.addEventListener('click', () => this.showMothership())
    const scores = document.createElement('button')
    scores.className = 'vector-button secondary'
    scores.textContent = 'Scores'
    scores.addEventListener('click', () => this.showScores())
    row.append(start, scores)
    panel.append(logo, wordmark, row)
    this.ui.title.append(panel)
    this.showOnly('title')
  }

  private showMothership() {
    this.state = 'mothership'
    this.ui.title.innerHTML = ''
    this.ui.title.className = 'screen mothership-screen'
    const shell = document.createElement('div')
    shell.className = 'mothership-command'
    const header = document.createElement('header')
    header.className = 'mothership-command-top'
    const intro = document.createElement('div')
    intro.className = 'mothership-command-title'
    intro.innerHTML = '<span>COMMAND DECK</span><h1>MOTHERSHIP</h1><p>Scout systems docked. Spend recovered cargo, review the ship, then launch the next expedition.</p>'
    if (this.debrief) {
      const lastRun = document.createElement('p')
      lastRun.className = 'mothership-last-report'
      lastRun.textContent = `${this.debrief.title} // ${this.debrief.discoveries.length} discoveries // Scrap ${this.debrief.resources.recovered.scrap} // Crystals ${this.debrief.resources.recovered.crystal} // Cores ${this.debrief.resources.recovered.cores}`
      intro.append(lastRun)
    }
    const resources = document.createElement('div')
    resources.className = 'mothership-resources'
    resources.innerHTML = `
      <span><b>Scrap</b>${this.mothership.resources.scrap}</span>
      <span><b>Crystals</b>${this.mothership.resources.crystal}</span>
      <span><b>Cores</b>${this.mothership.resources.cores}</span>
    `
    header.append(intro, resources)

    const flight = document.createElement('section')
    flight.className = 'mothership-flight'
    const status = document.createElement('div')
    status.className = 'mothership-status-stack'
    const hullPct = clamp(Math.max(0, this.player.hull) / Math.max(1, this.player.maxHull), 0, 1)
    const xpPct = clamp(this.stats.xp / Math.max(1, this.stats.nextXp), 0, 1)
    status.append(
      this.mothershipMeter('Hull Integrity', `${Math.ceil(Math.max(0, this.player.hull))}/${this.player.maxHull}`, hullPct, 'health'),
      this.mothershipMeter('Mutation XP', `LV ${this.stats.level} // ${Math.floor(this.stats.xp)}/${this.stats.nextXp}`, xpPct, 'xp'),
      this.mothershipMeter('Archive Signal', `${Object.keys(this.mothership.archive.records).length} records`, clamp(Object.keys(this.mothership.archive.records).length / 18, 0, 1), 'archive')
    )
    const shipBay = document.createElement('div')
    shipBay.className = 'mothership-ship-bay'
    const ship = document.createElement('img')
    ship.src = titleLogoMarkUrl
    ship.alt = 'Scout ship docked nose north'
    ship.className = 'mothership-ship-art'
    const launch = document.createElement('button')
    launch.className = 'vector-button start-button mothership-launch'
    launch.textContent = 'Launch Expedition'
    launch.addEventListener('click', () => this.start())
    shipBay.append(ship, launch)
    const consolePanel = this.renderMothershipConsoleStack()
    flight.append(status, shipBay, consolePanel)

    const systemsHeader = document.createElement('div')
    systemsHeader.className = 'mothership-section-title'
    systemsHeader.innerHTML = '<h2>Meta Systems</h2><span>Permanent upgrades bought with recovered cargo</span>'
    const grid = document.createElement('section')
    grid.className = 'station-grid'
    grid.append(
      this.departmentStation('scanner'),
      this.departmentStation('workbench'),
      this.departmentStation('archive'),
      this.departmentStation('shipyard'),
      this.departmentStation('signalCore'),
      this.departmentStation('hangarCrew')
    )
    shell.append(header, flight, systemsHeader, grid)
    this.ui.title.append(shell)
    this.showOnly('title')
  }

  private mothershipMeter(label: string, value: string, pct: number, tone: string) {
    const meter = document.createElement('div')
    meter.className = `mothership-meter ${tone}`
    meter.innerHTML = `
      <div><span>${this.escape(label)}</span><b>${this.escape(value)}</b></div>
      <i><em style="width:${clamp(pct, 0, 1) * 100}%"></em></i>
    `
    return meter
  }

  private renderMothershipConsoleStack() {
    const consolePanel = document.createElement('div')
    consolePanel.className = 'mothership-console-stack'
    const workbench = document.createElement('details')
    workbench.className = 'mothership-console-section'
    workbench.open = true
    workbench.innerHTML = `
      <summary><span>Workbench Bay</span><b>${this.pendingUpgrades} signals</b></summary>
      <p>Mutation choices install during expeditions. Review the ship build and archive here without leaving command.</p>
    `

    const manifest = document.createElement('details')
    manifest.className = 'mothership-console-section'
    manifest.innerHTML = '<summary><span>Build Manifest</span><b>systems</b></summary>'
    manifest.append(this.renderBuildManifest())

    const archive = document.createElement('details')
    archive.className = 'mothership-console-section'
    archive.innerHTML = `<summary><span>Archive</span><b>${Object.keys(this.mothership.archive.records).length} records</b></summary>`
    archive.append(this.renderArtifactsCollection())

    consolePanel.append(workbench, manifest, archive)
    return consolePanel
  }

  private mothershipStation(title: string, copy: string, actionLabel: string, action: () => void) {
    const card = document.createElement('div')
    card.className = 'station-card'
    const h = document.createElement('h2')
    h.textContent = title
    const p = document.createElement('p')
    p.textContent = copy
    const button = document.createElement('button')
    button.className = 'vector-button'
    button.textContent = actionLabel
    button.addEventListener('click', action)
    card.append(h, p, button)
    return card
  }

  private lockedStation(title: string, copy: string) {
    const card = document.createElement('div')
    card.className = 'station-card locked'
    card.innerHTML = `<h2>${this.escape(title)}</h2><p>${this.escape(copy)}</p><span>OFFLINE</span>`
    return card
  }

  private departmentStation(id: MothershipDepartmentId) {
    const definition = mothershipDepartments[id]
    const tier = this.mothership.departments[id]
    const next = definition.tiers[tier]
    const unlocked = isMothershipDepartmentUnlocked(this.mothership, id)
    const card = document.createElement('div')
    card.className = `station-card ${unlocked ? '' : 'locked'}`.trim()
    const h = document.createElement('h2')
    h.textContent = `${definition.name} ${tier}/${definition.tiers.length}`
    const p = document.createElement('p')
    p.textContent = unlocked ? next ? next.description : 'Department maxed.' : definition.description
    const cost = document.createElement('span')
    cost.className = 'station-cost'
    cost.textContent = unlocked ? next ? `Scrap ${next.cost.scrap} // Crystals ${next.cost.crystal} // Cores ${next.cost.cores}` : 'MAXED' : `Requires ${mothershipDepartmentUnlockText(id)}`
    const button = document.createElement('button')
    button.className = 'vector-button secondary'
    button.textContent = unlocked ? next ? 'Upgrade' : 'Online' : 'Offline'
    button.disabled = !next || !unlocked
    button.addEventListener('click', () => this.buyMothershipDepartment(id))
    card.append(h, p, cost, button)
    return card
  }

  private buyMothershipDepartment(id: MothershipDepartmentId) {
    const result = purchaseMothershipTier(this.mothership, id)
    if (!result.ok) {
      this.toast(result.reason)
      return
    }
    this.mothership = result.state
    this.saveMothership()
    this.toast(`${result.purchased.name.toUpperCase()} ONLINE`)
    this.showMothership()
  }

  private showScores() {
    this.state = 'scores'
    this.ui.scores.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = 'HIGH SCORES'
    const table = document.createElement('table')
    table.className = 'score-table'
    table.innerHTML = '<thead><tr><th>Pilot</th><th>Score</th><th>Time</th><th>Level</th><th>Kills</th></tr></thead>'
    const body = document.createElement('tbody')
    for (const s of this.highs.slice(0, 8)) {
      const tr = document.createElement('tr')
      tr.innerHTML = `<td>${this.escape(s.name)}</td><td>${s.score}</td><td>${formatTime(s.time)}</td><td>${s.level}</td><td>${s.kills}</td>`
      body.append(tr)
    }
    if (!body.children.length) {
      const tr = document.createElement('tr')
      tr.innerHTML = '<td colspan="5">No signals recorded yet.</td>'
      body.append(tr)
    }
    table.append(body)
    const row = document.createElement('div')
    row.className = 'button-row'
    const back = document.createElement('button')
    back.className = 'vector-button'
    back.textContent = 'Back'
    back.addEventListener('click', () => this.showTitle())
    row.append(back)
    panel.append(h, table, row)
    this.ui.scores.append(panel)
    this.showOnly('scores')
  }

  private gameOver() {
    if (this.state === 'dying' || this.state === 'debrief') return
    this.state = 'dying'
    this.deathTimer = 0
    this.player.hull = 0
    this.showOnly(null)
    this.audio.boom('gameover')
    this.camera.shake = Math.max(this.camera.shake, 28)
    this.burst(this.player.x, this.player.y, '#ff5d73', 46, 360)
    this.burst(this.player.x, this.player.y, '#fff27a', 32, 300)
    this.toast('SCOUT DESTROYED')
  }

  private finishRun(outcome: RunOutcomeKind) {
    if (this.state === 'debrief') return
    const before = { ...this.mothership.resources }
    const archiveRecords = this.currentRunArchiveRecords()
    const discoveries = Object.values(archiveRecords)
    this.mothership = applyRunRecovery(this.mothership, {
      outcome,
      resources: this.resources,
      archiveRecords,
      skippedBeacons: this.skippedReturnBeacons
    })
    this.saveMothership()
    const recovered = {
      scrap: this.mothership.resources.scrap - before.scrap,
      crystal: this.mothership.resources.crystal - before.crystal,
      cores: this.mothership.resources.cores - before.cores
    }
    this.debrief = {
      outcome,
      title: outcome === 'destroyed' ? 'BLACK BOX RECOVERED' : outcome === 'deepExtraction' ? 'DEEP EXPEDITION EXTRACTED' : 'EXPEDITION EXTRACTED',
      copy: outcome === 'destroyed'
        ? 'The scout ship was lost. The mothership recovered partial cargo and all transmitted discoveries.'
        : 'The scout ship returned through a beacon. Cargo, signals, and discoveries were processed cleanly.',
      resources: {
        earned: { ...this.resources },
        recovered
      },
      discoveries,
      skippedBeacons: this.skippedReturnBeacons
    }
    this.returnBeacon = null
    this.autoNavTargetBeacon = false
    this.state = 'debrief'
    this.renderDebrief()
  }

  private currentRunArchiveRecords(): Record<string, PersistentArchiveRecord> {
    const records: Record<string, PersistentArchiveRecord> = {}
    for (const artifact of this.artifacts.values()) {
      records[artifact.id] = {
        id: artifact.id,
        kind: artifact.kind,
        title: artifact.title,
        detail: artifact.detail,
        source: artifact.source,
        color: artifact.color,
        icon: artifact.icon,
        count: artifact.count
      }
    }
    return records
  }

  private renderDebrief() {
    if (!this.debrief) return
    this.ui.gameover.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel debrief-panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = this.debrief.title
    const copy = document.createElement('p')
    copy.className = 'copy'
    copy.textContent = this.debrief.copy
    const resources = document.createElement('div')
    resources.className = 'debrief-grid'
    resources.innerHTML = `
      <div><b>${this.debrief.resources.recovered.scrap}</b><span>Scrap Recovered</span></div>
      <div><b>${this.debrief.resources.recovered.crystal}</b><span>Crystals Recovered</span></div>
      <div><b>${this.debrief.resources.recovered.cores}</b><span>Cores Recovered</span></div>
      <div><b>${this.debrief.discoveries.length}</b><span>Discoveries Logged</span></div>
    `
    const discoveries = document.createElement('p')
    discoveries.className = 'copy small'
    discoveries.textContent = this.debrief.discoveries.length
      ? this.debrief.discoveries.slice(0, 4).map((record) => record.title).join(' // ')
      : 'No new archive records.'
    const bonus = document.createElement('p')
    bonus.className = 'copy small'
    bonus.textContent = this.debrief.skippedBeacons > 0 ? `Deep extraction bonus from ${this.debrief.skippedBeacons} skipped beacon${this.debrief.skippedBeacons === 1 ? '' : 's'}.` : ''
    const input = document.createElement('input')
    input.className = 'name-entry'
    input.maxLength = 12
    input.placeholder = 'ACE'
    input.autocapitalize = 'characters'
    input.autocomplete = 'name'
    input.inputMode = 'text'
    input.value = this.scoreName === 'ACE' ? '' : this.scoreName
    input.addEventListener('input', () => {
      this.scoreName = input.value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 12)
      input.value = this.scoreName
    })
    input.addEventListener('focus', () => input.select())
    input.addEventListener('blur', () => {
      if (!this.scoreName.trim()) this.scoreName = 'ACE'
    })
    const row = document.createElement('div')
    row.className = 'button-row'
    const continueButton = document.createElement('button')
    continueButton.className = 'vector-button'
    continueButton.textContent = 'Return to Mothership'
    continueButton.addEventListener('click', () => {
      this.saveScoreFromInput(input)
      this.showMothership()
    })
    const scores = document.createElement('button')
    scores.className = 'vector-button secondary'
    scores.textContent = 'Scores'
    scores.addEventListener('click', () => {
      this.saveScoreFromInput(input)
      this.showScores()
    })
    row.append(continueButton, scores)
    panel.append(h, copy, resources, discoveries, bonus, input, row)
    this.ui.gameover.append(panel)
    this.showOnly('gameover')
  }

  private renderGameOver() {
    this.ui.gameover.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = 'SIGNAL LOST'
    const copy = document.createElement('p')
    copy.className = 'copy'
    copy.textContent = `Score ${Math.floor(this.stats.score)}. Survived ${formatTime(this.stats.time)}. Level ${this.stats.level}. Kills ${this.stats.kills}. Planets landed ${this.stats.planets}.`
    const input = document.createElement('input')
    input.className = 'name-entry'
    input.maxLength = 12
    input.placeholder = 'ACE'
    input.autocapitalize = 'characters'
    input.autocomplete = 'name'
    input.inputMode = 'text'
    input.value = this.scoreName === 'ACE' ? '' : this.scoreName
    input.addEventListener('input', () => {
      this.scoreName = input.value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 12)
      input.value = this.scoreName
    })
    input.addEventListener('focus', () => input.select())
    input.addEventListener('blur', () => {
      if (!this.scoreName.trim()) this.scoreName = 'ACE'
    })
    const row = document.createElement('div')
    row.className = 'button-row'
    const retry = document.createElement('button')
    retry.className = 'vector-button'
    retry.textContent = 'Run Again'
    retry.addEventListener('click', () => {
      this.saveScoreFromInput(input)
      this.restartFromGameOver()
    })
    const scores = document.createElement('button')
    scores.className = 'vector-button secondary'
    scores.textContent = 'Scores'
    scores.addEventListener('click', () => {
      this.saveScoreFromInput(input)
      this.showScores()
    })
    row.append(retry, scores)
    panel.append(h, copy, input, document.createElement('br'), document.createElement('br'), row)
    this.ui.gameover.append(panel)
    this.showOnly('gameover')
  }

  private start() {
    this.audio.unlock()
    this.reset()
    this.state = 'playing'
    this.showOnly(null)
    this.toast('FIND THE PLANETS. BUILD UNTIL THE SCREEN SINGS.')
  }

  private restartFromGameOver() {
    this.scoreSaved = true
    this.start()
  }

  private saveScoreFromInput(input: HTMLInputElement) {
    this.scoreName = input.value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 12).trim() || 'ACE'
    input.value = this.scoreName
    this.saveScore()
  }

  private reset() {
    this.player = this.makePlayer()
    const shipyard = this.mothership.departments.shipyard
    this.player.maxHull += shipyard * 12
    this.player.hull = this.player.maxHull
    this.player.speed += shipyard * 8
    this.bullets = []
    this.enemies = []
    this.enemyGrid.clear()
    this.pickups = []
    this.particles = []
    this.shockwaves = []
    this.chunks.clear()
    this.stars = []
    this.planets = []
    this.visitedPlanets.clear()
    this.activeChunkKey = ''
    this.autoNavHeading = 0
    this.autoNavActive = false
    this.autoNavTargetPlanetId = null
    this.autoNavTargetBeacon = false
    this.orbitReturnPoint = null
    this.surface = null
    this.returnBeacon = null
    this.nextReturnBeaconAt = 0
    this.skippedReturnBeacons = 0
    this.transitionTimer = 0
    this.pendingUpgrades = 0
    this.workbenchInstalling = false
    this.takeoffAfterWorkbench = false
    this.workbenchRerolls = this.mothership.departments.workbench >= 1 ? 1 : 0
    const hangarCrew = this.mothership.departments.hangarCrew
    this.resources = {
      scrap: hangarCrew * 25,
      crystal: hangarCrew >= 2 ? hangarCrew * 2 : 0,
      cores: hangarCrew >= 4 ? 1 : 0
    }
    this.relics.clear()
    this.evolved.clear()
    this.artifacts.clear()
    this.limitBreaks = { might: 0, cooldown: 0, amount: 0, speed: 0, magnet: 0, hull: 0 }
    this.stats = { time: 0, kills: 0, level: 1, xp: 0, nextXp: 24, highScore: this.highs[0]?.score ?? 0, planets: 0, score: 0 }
    for (const k of Object.keys(this.build) as UpgradeId[]) this.build[k] = 0
    this.spawnTimer = 0.4
    this.bossTimer = 75
    this.chestTimer = 28
    this.scoreSaved = false
    const target = cameraTargetFor(this.player, this.width, this.height, this.spaceScale())
    this.camera.x = target.x
    this.camera.y = target.y
    this.updateSpaceChunks(true)
  }

  private togglePause() {
    if (this.state === 'playing' || this.state === 'surface') {
      this.previousState = this.state
      this.state = 'paused'
      this.toast('PAUSED')
    } else if (this.state === 'paused') {
      this.state = this.previousState
      this.toast('SIGNAL RESUMED')
    } else if (this.state === 'levelup' || this.state === 'planet') {
      return
    }
  }

  private toast(message: string) {
    this.toastText = message
    this.toastTimer = 3.2
    this.ui.toast.textContent = message
    this.ui.toast.classList.add('visible')
  }

  private showOnly(which: GameState | null) {
    const screens: Partial<Record<GameState, HTMLElement>> = {
      title: this.ui.title,
      levelup: this.ui.levelup,
      planet: this.ui.planet,
      gameover: this.ui.gameover,
      scores: this.ui.scores
    }
    for (const [name, el] of Object.entries(screens)) {
      el?.classList.toggle('visible', name === which)
    }
  }

  private loadScores(): ScoreEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ScoreEntry[]
    } catch {
      return []
    }
  }

  private loadMothership() {
    try {
      return normalizeMothershipState(JSON.parse(localStorage.getItem(MOTHERSHIP_STORAGE_KEY) || 'null'))
    } catch {
      return defaultMothershipState()
    }
  }

  private saveMothership() {
    localStorage.setItem(MOTHERSHIP_STORAGE_KEY, JSON.stringify(this.mothership))
  }

  private saveScore() {
    if (this.scoreSaved) return
    this.scoreSaved = true
    const entry: ScoreEntry = {
      name: this.scoreName,
      score: Math.floor(this.stats.score),
      time: this.stats.time,
      level: this.stats.level,
      kills: this.stats.kills,
      date: new Date().toISOString()
    }
    this.highs = [...this.highs, entry].sort((a, b) => b.score - a.score).slice(0, 10)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.highs))
  }

  private escape(value: string) {
    return value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch]!)
  }
}

declare global {
  interface Window {
    __vectorShooter?: VectorShooter
  }
}

window.__vectorShooter = new VectorShooter()
