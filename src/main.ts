import './style.css'

type GameState = 'title' | 'playing' | 'paused' | 'levelup' | 'planet' | 'landing' | 'surface' | 'takeoff' | 'gameover' | 'scores'
type PickupKind = 'xp' | 'repair' | 'magnet' | 'core' | 'chest'
type EnemyKind = 'chaser' | 'splinter' | 'lancer' | 'mine' | 'warden'
type SurfaceResourceKind = 'crystal' | 'scrap' | 'repair' | 'cache'
type UpgradeId =
  | 'rapid'
  | 'split'
  | 'pierce'
  | 'engine'
  | 'magnet'
  | 'shield'
  | 'repair'
  | 'orbit'
  | 'rail'
  | 'echo'
  | 'vampire'

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
  name: string
  x: number
  y: number
  radius: number
  color: string
  visited: boolean
  reward: string
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
}

interface SurfaceRun {
  planet: Planet
  width: number
  height: number
  pilot: {
    x: number
    y: number
    vx: number
    vy: number
    facing: number
    mineCd: number
    invuln: number
  }
  ship: Vec
  camera: Vec
  resources: SurfaceResource[]
  threats: SurfaceThreat[]
  collected: number
  pendingUpgrade: boolean
  message: string
}

interface Upgrade {
  id: UpgradeId
  name: string
  description: string
  max: number
}

interface ScoreEntry {
  name: string
  score: number
  time: number
  level: number
  kills: number
  date: string
}

const TAU = Math.PI * 2
const WORLD_W = 6200
const WORLD_H = 6200
const STORAGE_KEY = 'vector_shooter_high_scores'
const GRID_CELL = 180
const GRID_STRIDE = 1000
const MAX_PARTICLES = 300
const MAX_SHOCKWAVES = 12
const MAX_BULLETS = 220
const MAX_ENEMIES = 320
const MAX_PICKUPS = 220

const upgrades: Upgrade[] = [
  { id: 'rapid', name: 'Pulse Overclock', description: 'Fire rate increases. Every level makes the ship hum a little angrier.', max: 7 },
  { id: 'split', name: 'Prism Barrel', description: 'Adds side beams to your shot pattern.', max: 4 },
  { id: 'pierce', name: 'Ghost Rounds', description: 'Shots pass through more targets before collapsing.', max: 5 },
  { id: 'engine', name: 'Drift Engine', description: 'More speed, sharper recovery, longer survival routes.', max: 5 },
  { id: 'magnet', name: 'Signal Magnet', description: 'Pull XP shards and drops from farther away.', max: 6 },
  { id: 'shield', name: 'Halo Battery', description: 'Adds and strengthens a regenerating shield.', max: 5 },
  { id: 'repair', name: 'Hull Stitcher', description: 'Repair now and increase maximum hull.', max: 4 },
  { id: 'orbit', name: 'Ion Moons', description: 'Adds orbiting blades that chew through close swarms.', max: 5 },
  { id: 'rail', name: 'Rail Lattice', description: 'Every few shots becomes a long-range piercing lance.', max: 4 },
  { id: 'echo', name: 'Echo Chamber', description: 'Bullets live longer and leave a damaging after-tone.', max: 4 },
  { id: 'vampire', name: 'Salvage Hunger', description: 'Enemy wreckage can repair hull when you are hurt.', max: 3 }
]

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
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
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

class AudioDirector {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private musicTimer = 0
  private unlocked = false

  unlock() {
    if (this.unlocked) return
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    this.context = new AudioCtor()
    this.master = this.context.createGain()
    this.master.gain.value = 0.36
    const limiter = this.context.createDynamicsCompressor()
    limiter.threshold.value = -18
    limiter.ratio.value = 9
    limiter.attack.value = 0.004
    limiter.release.value = 0.16
    this.master.connect(limiter)
    limiter.connect(this.context.destination)
    this.unlocked = true
  }

  update(dt: number, intensity: number) {
    if (!this.context || !this.master) return
    this.musicTimer -= dt
    if (this.musicTimer <= 0) {
      this.musicTimer = clamp(0.7 - intensity * 0.22, 0.3, 0.7)
      const note = 60 + Math.floor(Math.random() * 5) * 7 + Math.floor(intensity * 10)
      this.tone(note, 0.08, 'sawtooth', 0.022, 0.04, -18)
      if (Math.random() < 0.42) this.noise(0.06, 0.018, -22)
    }
  }

  fire(power: number) {
    this.tone(300 + power * 18, 0.045, 'square', 0.035, 0.01, -12)
    this.tone(880 + power * 40, 0.035, 'triangle', 0.018, 0.005, -17)
  }

  hit() {
    this.noise(0.055, 0.09, -12)
    this.tone(90, 0.09, 'sawtooth', 0.05, 0.012, -14)
  }

  pickup() {
    this.tone(660 + Math.random() * 220, 0.08, 'sine', 0.034, 0.012, -15)
  }

  level() {
    this.tone(360, 0.12, 'triangle', 0.05, 0.02, -12)
    setTimeout(() => this.tone(540, 0.14, 'triangle', 0.055, 0.02, -12), 70)
    setTimeout(() => this.tone(810, 0.18, 'triangle', 0.07, 0.02, -12), 140)
  }

  boom(big = false) {
    this.noise(big ? 0.28 : 0.16, big ? 0.18 : 0.1, big ? -8 : -12)
    this.tone(big ? 56 : 92, big ? 0.34 : 0.18, 'sawtooth', big ? 0.08 : 0.04, 0.02, big ? -8 : -13)
  }

  land() {
    this.tone(160, 0.15, 'sine', 0.05, 0.02, -16)
    this.tone(240, 0.22, 'triangle', 0.045, 0.03, -15)
  }

  private tone(freq: number, duration: number, type: OscillatorType, gain: number, attack: number, db: number) {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    const osc = this.context.createOscillator()
    const filter = this.context.createBiquadFilter()
    const amp = this.context.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1800 + freq, now)
    amp.gain.setValueAtTime(0.0001, now)
    amp.gain.exponentialRampToValueAtTime(gain * Math.pow(10, db / 20), now + attack)
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    osc.connect(filter)
    filter.connect(amp)
    amp.connect(this.master)
    osc.start(now)
    osc.stop(now + duration + 0.02)
  }

  private noise(duration: number, gain: number, db: number) {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    const buffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const amp = this.context.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = 420 + Math.random() * 1400
    filter.Q.value = 1.8
    amp.gain.value = gain * Math.pow(10, db / 20)
    source.connect(filter)
    filter.connect(amp)
    amp.connect(this.master)
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
  private keys = new Set<string>()
  private pressed = new Set<string>()
  private mouse = { x: 0, y: 0, down: false }
  private touchStick = { active: false, id: -1, startX: 0, startY: 0, x: 0, y: 0 }
  private mobileActionQueued = false
  private mobileDashQueued = false
  private mobileFireQueued = false
  private audio = new AudioDirector()
  private camera = { x: 0, y: 0, shake: 0 }
  private scoreSaved = false
  private scoreName = 'ACE'
  private toastTimer = 0
  private toastText = ''
  private upgradeChoices: Upgrade[] = []
  private planetChoice: Planet | null = null
  private transitionTimer = 0
  private transitionDuration = 1.25
  private surface: SurfaceRun | null = null
  private collisionFxCooldown = 0
  private enemyId = 0
  private fireSerial = 0
  private spawnTimer = 0
  private bossTimer = 75
  private chestTimer = 30
  private stars: Vec[] = []
  private highs: ScoreEntry[] = []

  private player = this.makePlayer()
  private bullets: Bullet[] = []
  private enemies: Enemy[] = []
  private enemyGrid = new Map<number, Enemy[]>()
  private nearbyEnemyScratch: Enemy[] = []
  private pickups: Pickup[] = []
  private particles: Particle[] = []
  private shockwaves: Shockwave[] = []
  private planets: Planet[] = [
    { name: 'LUX MORGUE', x: 1020, y: 1240, radius: 88, color: '#57fff3', visited: false, reward: 'Repairs hull and grants an experimental upgrade.' },
    { name: 'RED MERCY', x: 5030, y: 1110, radius: 112, color: '#ff5d73', visited: false, reward: 'Awakens tougher waves, then doubles the landing score.' },
    { name: 'SAINT STATIC', x: 1780, y: 4870, radius: 130, color: '#fff27a', visited: false, reward: 'Tunes the signal magnet and drops a chest.' },
    { name: 'GREEN CHOIR', x: 4870, y: 4800, radius: 96, color: '#8fff7d', visited: false, reward: 'Adds shield charge and maps nearby pickups.' },
    { name: 'NULL CATHEDRAL', x: 3100, y: 3070, radius: 150, color: '#b990ff', visited: false, reward: 'Summons a warden and offers rare salvage.' }
  ]

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
    engine: 0,
    magnet: 0,
    shield: 0,
    repair: 0,
    orbit: 0,
    rail: 0,
    echo: 0,
    vampire: 0
  }

  private ui = {
    score: document.createElement('span'),
    time: document.createElement('span'),
    level: document.createElement('span'),
    hull: document.createElement('span'),
    wave: document.createElement('span'),
    high: document.createElement('span'),
    xpFill: document.createElement('div'),
    toast: document.createElement('div'),
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
    shell.append(this.makeHud())
    shell.append(this.mini)
    shell.append(this.makeScreens())
    this.app.append(shell)
    this.resize()
    this.bind()
    this.highs = this.loadScores()
    this.stats.highScore = this.highs[0]?.score ?? 0
    for (let i = 0; i < 680; i += 1) this.stars.push({ x: Math.random() * WORLD_W, y: Math.random() * WORLD_H })
    this.showTitle()
    requestAnimationFrame((t) => this.frame(t))
  }

  private makePlayer() {
    return {
      x: WORLD_W / 2,
      y: WORLD_H / 2,
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
    const left = document.createElement('div')
    left.className = 'hud-cluster'
    const right = document.createElement('div')
    right.className = 'hud-cluster'
    right.style.justifyContent = 'flex-end'
    left.append(this.chip('SCORE', this.ui.score), this.chip('TIME', this.ui.time), this.chip('KILLS', this.ui.wave))
    right.append(this.chip('HULL', this.ui.hull), this.chip('HIGH', this.ui.high))
    const xp = document.createElement('div')
    xp.className = 'xp-wrap'
    xp.innerHTML = `<div class="xp-title"><span>LEVEL <b></b></span><span>XP SIGNAL</span></div><div class="xp-bar"></div>`
    xp.querySelector('b')!.replaceWith(this.ui.level)
    xp.querySelector('.xp-bar')!.append(this.ui.xpFill)
    this.ui.xpFill.className = 'xp-fill'
    this.ui.toast.className = 'toast'
    hud.append(top, this.ui.toast, this.makeTouchControls())
    top.append(left, xp, right)
    return hud
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

  private chip(label: string, value: HTMLElement) {
    const chip = document.createElement('div')
    chip.className = 'hud-chip'
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
    window.addEventListener('keydown', (e) => {
      this.audio.unlock()
      if (!this.keys.has(e.code)) this.pressed.add(e.code)
      this.keys.add(e.code)
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (e.code === 'Escape') this.togglePause()
      if (e.code === 'Enter' && this.state === 'title') this.start()
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
        if ((this.state === 'playing' || this.state === 'surface') && e.clientY > this.height * 0.28 && e.clientX < this.width * 0.68) {
          this.touchStick = { active: true, id: e.pointerId, startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY }
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
    this.dpr = window.devicePixelRatio || 1
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

  private frame(now: number) {
    const dt = clamp((now - this.last) / 1000, 0, 0.033)
    this.last = now
    this.update(dt)
    this.render()
    this.pressed.clear()
    requestAnimationFrame((t) => this.frame(t))
  }

  private update(dt: number) {
    const intensity = this.state === 'surface' ? 0.18 : clamp(this.stats.time / 360 + this.enemies.length / 120, 0, 1)
    this.audio.update(dt, intensity)
    if (this.state === 'landing') {
      this.updateLanding(dt)
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
      this.player.shield = clamp(this.player.shield + dt * (4 + this.build.shield * 3), 0, this.player.maxShield)
    }

    this.updatePlayer(dt)
    this.updateBullets(dt)
    this.updateEnemies(dt)
    this.updatePickups(dt)
    this.updateParticles(dt)
    this.updateOrbitals(dt)
    this.updateSpawning()
    this.updateCamera(dt)
    this.updateHud()
    if (this.player.hull <= 0) this.gameOver()
  }

  private drawTitleDrift(dt: number) {
    this.stats.time += dt * 0.08
    this.updateParticles(dt)
    this.camera.x = WORLD_W / 2 - this.width / 2 + Math.cos(performance.now() / 8000) * 80
    this.camera.y = WORLD_H / 2 - this.height / 2 + Math.sin(performance.now() / 9000) * 80
    this.updateHud()
  }

  private updatePlayer(dt: number) {
    const input = this.getInput()
    const accel = (1680 + this.build.engine * 210) * dt
    const maxSpeed = this.player.speed + this.build.engine * 36
    this.player.vx += input.move.x * accel
    this.player.vy += input.move.y * accel
    const speed = len(this.player.vx, this.player.vy)
    if (speed > maxSpeed) {
      this.player.vx = (this.player.vx / speed) * maxSpeed
      this.player.vy = (this.player.vy / speed) * maxSpeed
    }
    if (input.dash && this.player.dashCd <= 0 && speed > 18) {
      const d = norm(this.player.vx, this.player.vy)
      this.player.vx += d.x * 520
      this.player.vy += d.y * 520
      this.player.dashCd = clamp(1.15 - this.build.engine * 0.12, 0.55, 1.15)
      this.player.invuln = 0.18
      this.camera.shake = Math.max(this.camera.shake, 8)
      this.burst(this.player.x, this.player.y, '#70a8ff', 14, 180)
    }
    this.player.vx *= Math.pow(0.06, dt)
    this.player.vy *= Math.pow(0.06, dt)
    this.player.x = clamp(this.player.x + this.player.vx * dt, 80, WORLD_W - 80)
    this.player.y = clamp(this.player.y + this.player.vy * dt, 80, WORLD_H - 80)

    if (input.aiming) this.player.aimAngle = input.aimAngle
    if (speed > 20) this.player.angle = angleLerp(this.player.angle, Math.atan2(this.player.vy, this.player.vx), 0.12)
    this.player.angle = angleLerp(this.player.angle, this.player.aimAngle, input.firing ? 0.2 : 0.04)

    if (input.firing && this.player.fireCd <= 0) this.fire()
    if (input.interact) this.tryLand()
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
    if (this.transitionTimer >= this.transitionDuration) this.finishTakeoff()
  }

  private updateSurface(dt: number) {
    if (!this.surface) return
    const input = this.getInput()
    this.stats.time += dt * 0.25
    this.toastTimer -= dt
    if (this.toastTimer <= 0) this.ui.toast.classList.remove('visible')
    this.surface.pilot.mineCd -= dt
    this.surface.pilot.invuln -= dt

    const accel = 920 * dt
    this.surface.pilot.vx += input.move.x * accel
    this.surface.pilot.vy += input.move.y * accel
    const speed = len(this.surface.pilot.vx, this.surface.pilot.vy)
    const maxSpeed = 148 + this.build.engine * 8
    if (speed > maxSpeed) {
      this.surface.pilot.vx = (this.surface.pilot.vx / speed) * maxSpeed
      this.surface.pilot.vy = (this.surface.pilot.vy / speed) * maxSpeed
    }
    this.surface.pilot.vx *= Math.pow(0.04, dt)
    this.surface.pilot.vy *= Math.pow(0.04, dt)
    this.surface.pilot.x = clamp(this.surface.pilot.x + this.surface.pilot.vx * dt, 40, this.surface.width - 40)
    this.surface.pilot.y = clamp(this.surface.pilot.y + this.surface.pilot.vy * dt, 40, this.surface.height - 40)
    if (Math.abs(input.move.x) + Math.abs(input.move.y) > 0.05) this.surface.pilot.facing = Math.atan2(input.move.y, input.move.x)

    if (input.firing && this.surface.pilot.mineCd <= 0) this.fireMiningPulse()
    this.collectSurfaceResources()
    this.updateSurfaceThreats(dt)

    const nearShip = Math.sqrt(dist2(this.surface.pilot, this.surface.ship)) < 64
    if (input.interact && nearShip) this.startTakeoff()
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
      const distance = Math.min(64, Math.hypot(dx, dy))
      const direction = Math.atan2(dy, dx)
      mx = Math.cos(direction) * (distance / 64)
      my = Math.sin(direction) * (distance / 64)
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
    const move = norm(mx, my)
    if (Math.abs(mx) + Math.abs(my) === 0) {
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

  private fire() {
    if (this.bullets.length > MAX_BULLETS) this.bullets.splice(0, this.bullets.length - MAX_BULLETS)
    const rapid = this.build.rapid
    this.player.fireCd = clamp(0.18 - rapid * 0.016, 0.06, 0.18)
    const damage = 14 + this.stats.level * 0.8 + this.build.rail * 2
    const speed = 780 + this.build.echo * 55
    const count = 1 + this.build.split
    const spread = count === 1 ? 0 : clamp(0.12 + count * 0.035, 0.12, 0.31)
    const rail = this.build.rail > 0 && this.fireSerial % Math.max(8 - this.build.rail, 3) === 0
    this.fireSerial += 1
    for (let i = 0; i < count; i += 1) {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread
      const a = this.player.aimAngle + offset
      this.bullets.push({
        x: this.player.x + Math.cos(a) * 22,
        y: this.player.y + Math.sin(a) * 22,
        vx: Math.cos(a) * speed + this.player.vx * 0.14,
        vy: Math.sin(a) * speed + this.player.vy * 0.14,
        life: rail ? 0.86 : 0.62 + this.build.echo * 0.13,
        damage: rail ? damage * 2.4 : damage,
        radius: rail ? 5 : 3.5,
        color: rail ? '#fff27a' : '#57fff3',
        pierce: rail ? 7 + this.build.pierce : this.build.pierce,
        rail
      })
    }
    this.audio.fire(this.stats.level + rapid)
  }

  private updateBullets(dt: number) {
    this.rebuildEnemyGrid()
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const b = this.bullets[i]
      b.life -= dt
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.life <= 0 || b.x < 0 || b.x > WORLD_W || b.y < 0 || b.y > WORLD_H) {
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
          b.pierce -= 1
          if (b.pierce < 0) {
            this.bullets.splice(i, 1)
            break
          }
        }
      }
    }
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
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const e = this.enemies[i]
      e.phase += dt
      e.cd -= dt
      e.flash -= dt
      const toP = norm(this.player.x - e.x, this.player.y - e.y)
      if (e.kind === 'chaser' || e.kind === 'splinter') {
        e.vx += toP.x * e.speed * 3.4 * dt
        e.vy += toP.y * e.speed * 3.4 * dt
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
      const max = e.kind === 'lancer' ? 460 : e.speed
      const s = len(e.vx, e.vy)
      if (s > max) {
        e.vx = (e.vx / s) * max
        e.vy = (e.vy / s) * max
      }
      e.vx *= Math.pow(0.2, dt)
      e.vy *= Math.pow(0.2, dt)
      e.x += e.vx * dt
      e.y += e.vy * dt

      const rr = e.radius + this.player.radius
      if (dist2(e, this.player) < rr * rr) {
        this.damagePlayer(e.kind === 'warden' ? 24 : 13)
        if (e.kind !== 'warden') this.killEnemy(e, false)
      }
    }
  }

  private updatePickups(dt: number) {
    const magnet = 105 + this.build.magnet * 62
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const p = this.pickups[i]
      p.life -= dt
      const d = Math.sqrt(dist2(p, this.player))
      if (d < magnet || p.kind === 'magnet') {
        const pull = norm(this.player.x - p.x, this.player.y - p.y)
        const strength = p.kind === 'xp' ? 720 : 540
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

  private updateOrbitals(dt: number) {
    const count = this.build.orbit
    if (count <= 0) return
    const radius = 66 + count * 8
    const damage = (18 + count * 5) * dt
    for (const e of this.enemies) {
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
    const pressure = this.stats.time / 60
    if (this.spawnTimer <= 0) {
      this.spawnTimer = clamp(0.62 - pressure * 0.045 - this.stats.planets * 0.025, 0.12, 0.62)
      const pack = 1 + Math.floor(pressure * 0.65) + (Math.random() < 0.2 ? 2 : 0)
      const room = Math.max(0, MAX_ENEMIES - this.enemies.length)
      for (let i = 0; i < Math.min(pack, room); i += 1) this.spawnEnemy(this.pickEnemyKind())
    }
    if (this.bossTimer <= 0) {
      this.bossTimer = 95
      this.spawnEnemy('warden')
      this.toast('WARDEN VECTOR ENTERING THE FIELD')
    }
    if (this.chestTimer <= 0) {
      this.chestTimer = 38 + Math.random() * 20
      const p = this.randomNearPlayer(680, 980)
      this.pickups.push({ kind: 'chest', x: p.x, y: p.y, vx: 0, vy: 0, value: 1, radius: 16, life: 999, color: '#fff27a' })
      this.toast('A TREASURE CORE IS BROADCASTING NEARBY')
    }
  }

  private pickEnemyKind(): EnemyKind {
    const t = this.stats.time
    const r = Math.random()
    if (t > 100 && r < 0.08) return 'mine'
    if (t > 55 && r < 0.2) return 'lancer'
    if (t > 25 && r < 0.38) return 'splinter'
    return 'chaser'
  }

  private spawnEnemy(kind: EnemyKind) {
    if (this.enemies.length >= MAX_ENEMIES) return
    const p = this.randomNearPlayer(620, 980)
    const scale = 1 + this.stats.time / 220 + this.stats.planets * 0.08
    const base = {
      chaser: { hp: 28, r: 17, speed: 120, value: 7, color: '#8fff7d' },
      splinter: { hp: 18, r: 14, speed: 155, value: 5, color: '#70a8ff' },
      lancer: { hp: 48, r: 18, speed: 150, value: 13, color: '#fff27a' },
      mine: { hp: 36, r: 22, speed: 65, value: 10, color: '#ff5d73' },
      warden: { hp: 420, r: 48, speed: 130, value: 90, color: '#b990ff' }
    }[kind]
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
      x: clamp(this.player.x + Math.cos(a) * r, 40, WORLD_W - 40),
      y: clamp(this.player.y + Math.sin(a) * r, 40, WORLD_H - 40)
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
    const big = e.kind === 'warden'
    const highLoad = this.isHighLoad()
    if (big || !highLoad || this.collisionFxCooldown <= 0) {
      this.audio.boom(big)
      this.camera.shake = Math.max(this.camera.shake, big ? 16 : highLoad ? 2 : 5)
      this.burst(e.x, e.y, e.color, big ? 42 : highLoad ? 4 : 12, big ? 330 : highLoad ? 120 : 150)
      this.collisionFxCooldown = highLoad ? 0.04 : 0
    }
    if (reward) {
      this.stats.kills += 1
      this.stats.score += e.value
      const xpCount = e.kind === 'warden' ? 18 : e.kind === 'lancer' ? 4 : 2
      const xpDrops = highLoad && e.kind !== 'warden' ? 1 : xpCount
      const xpValue = e.kind === 'warden' ? 8 : highLoad ? 3 * xpCount : 3
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
    if (this.player.invuln > 0) return
    this.player.invuln = 0.42
    this.player.shieldDelay = 2.4
    let remaining = amount
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

  private drop(kind: PickupKind, x: number, y: number, value: number) {
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
    this.audio.pickup()
    if (p.kind === 'xp') {
      this.stats.xp += p.value
      this.stats.score += p.value
      while (this.stats.xp >= this.stats.nextXp) {
        this.stats.xp -= this.stats.nextXp
        this.stats.level += 1
        this.stats.nextXp = Math.floor(this.stats.nextXp * 1.18 + 11)
        this.openLevelUp()
      }
    } else if (p.kind === 'repair') {
      this.player.hull = clamp(this.player.hull + p.value, 0, this.player.maxHull)
    } else if (p.kind === 'magnet') {
      for (const drop of this.pickups) drop.life = Math.max(drop.life, 2)
      this.build.magnet = clamp(this.build.magnet + 1, 0, upgrades.find((u) => u.id === 'magnet')!.max)
      this.toast('SIGNAL MAGNET TEMPORARILY OVERCHARGED')
    } else if (p.kind === 'chest') {
      this.openChest()
    }
  }

  private openLevelUp() {
    this.state = 'levelup'
    this.audio.level()
    this.upgradeChoices = this.rollUpgrades(3)
    this.renderLevelUp('LEVEL SIGNAL FOUND', 'Choose one vector mutation. The horde keeps its place while you decide.')
  }

  private openChest() {
    this.state = 'levelup'
    this.audio.level()
    this.stats.score += 250 + this.stats.level * 35
    this.upgradeChoices = this.rollUpgrades(3, true)
    this.renderLevelUp('TREASURE CORE CRACKED', 'Boss and field cores offer stronger, messier upgrades.')
  }

  private rollUpgrades(count: number, rare = false) {
    const available = upgrades.filter((u) => this.build[u.id] < u.max)
    const picked: Upgrade[] = []
    while (picked.length < count && available.length) {
      available.sort(() => Math.random() - 0.5)
      const idx = rare && Math.random() < 0.45 ? Math.floor(Math.random() * Math.min(4, available.length)) : Math.floor(Math.random() * available.length)
      const u = available.splice(idx, 1)[0]
      picked.push(u)
    }
    return picked
  }

  private applyUpgrade(upgrade: Upgrade) {
    this.build[upgrade.id] += 1
    if (upgrade.id === 'engine') this.player.speed += 18
    if (upgrade.id === 'shield') {
      this.player.maxShield += 18
      this.player.shield = this.player.maxShield
    }
    if (upgrade.id === 'repair') {
      this.player.maxHull += 18
      this.player.hull = this.player.maxHull
    }
    if (upgrade.id === 'magnet') this.stats.score += 60
    this.toast(`${upgrade.name.toUpperCase()} ONLINE`)
    this.state = 'playing'
    this.showOnly(null)
  }

  private tryLand() {
    if (this.player.landedCd > 0) return
    const planet = this.planets.find((p) => Math.sqrt(dist2(p, this.player)) < p.radius + 86)
    if (!planet) {
      this.toast('NO LANDING BEACON IN RANGE')
      return
    }
    this.startLanding(planet)
  }

  private startLanding(planet: Planet) {
    this.state = 'landing'
    this.planetChoice = planet
    this.transitionTimer = 0
    this.transitionDuration = 1.35
    this.showOnly(null)
    this.audio.land()
    this.surface = this.createSurfaceRun(planet)
    this.player.vx *= 0.1
    this.player.vy *= 0.1
    this.toast(`DESCENDING TO ${planet.name}`)
  }

  private createSurfaceRun(planet: Planet): SurfaceRun {
    const resources: SurfaceResource[] = []
    const first = !planet.visited
    const count = first ? 10 + Math.floor(Math.random() * 5) : 5 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i += 1) {
      const kindRoll = Math.random()
      const kind: SurfaceResourceKind = i === 0 && first ? 'cache' : kindRoll < 0.58 ? 'crystal' : kindRoll < 0.84 ? 'scrap' : 'repair'
      const color = kind === 'cache' ? '#fff27a' : kind === 'crystal' ? planet.color : kind === 'scrap' ? '#70a8ff' : '#8fff7d'
      resources.push({
        kind,
        x: rand(180, 1420),
        y: rand(170, 1010),
        radius: kind === 'cache' ? 18 : 12,
        value: kind === 'crystal' ? 8 : kind === 'scrap' ? 120 : kind === 'repair' ? 18 : 1,
        color,
        collected: false
      })
    }
    const threats: SurfaceThreat[] = []
    const threatCount = (first ? 1 : 0) + (Math.random() < 0.45 || planet.name === 'NULL CATHEDRAL' ? 1 : 0)
    for (let i = 0; i < threatCount; i += 1) {
      threats.push({
        x: rand(300, 1300),
        y: rand(250, 950),
        vx: 0,
        vy: 0,
        hp: planet.name === 'NULL CATHEDRAL' ? 46 : 28,
        radius: planet.name === 'NULL CATHEDRAL' ? 22 : 16,
        phase: rand(0, TAU),
        color: planet.name === 'RED MERCY' || planet.name === 'NULL CATHEDRAL' ? '#ff5d73' : '#fff27a',
        hit: 0
      })
    }
    return {
      planet,
      width: 1600,
      height: 1180,
      pilot: { x: 840, y: 660, vx: 0, vy: 0, facing: 0, mineCd: 0, invuln: 0 },
      ship: { x: 780, y: 590 },
      camera: { x: 0, y: 0 },
      resources,
      threats,
      collected: 0,
      pendingUpgrade: false,
      message: first ? 'UNKNOWN SURFACE. MINE THE SIGNAL CACHE.' : 'OLD LANDING SITE. QUICK SALVAGE ONLY.'
    }
  }

  private confirmLanding() {
    if (!this.planetChoice) return
    const p = this.planetChoice
    const first = !p.visited
    p.visited = true
    this.stats.planets = this.planets.filter((planet) => planet.visited).length
    this.stats.score += first ? 900 + this.stats.planets * 300 : 120
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
      this.audio.pickup()
      this.burst(resource.x, resource.y, resource.color, resource.kind === 'cache' ? 22 : 10, resource.kind === 'cache' ? 240 : 140)
      if (resource.kind === 'crystal') {
        this.stats.xp += resource.value
        this.stats.score += resource.value * 12
        while (this.stats.xp >= this.stats.nextXp) {
          this.stats.xp -= this.stats.nextXp
          this.stats.level += 1
          this.stats.nextXp = Math.floor(this.stats.nextXp * 1.18 + 11)
          this.surface.pendingUpgrade = true
        }
      } else if (resource.kind === 'scrap') {
        this.stats.score += resource.value
      } else if (resource.kind === 'repair') {
        this.player.hull = clamp(this.player.hull + resource.value, 0, this.player.maxHull)
      } else if (resource.kind === 'cache') {
        this.stats.score += 450 + this.stats.level * 45
        this.surface.pendingUpgrade = true
        this.surface.message = 'MUTATION CACHE SECURED. GET BACK TO THE SHIP.'
      }
    }
  }

  private updateSurfaceThreats(dt: number) {
    if (!this.surface) return
    for (let i = this.surface.threats.length - 1; i >= 0; i -= 1) {
      const threat = this.surface.threats[i]
      threat.phase += dt
      threat.hit -= dt
      const toPilot = norm(this.surface.pilot.x - threat.x, this.surface.pilot.y - threat.y)
      threat.vx += toPilot.x * 360 * dt
      threat.vy += toPilot.y * 360 * dt
      const speed = len(threat.vx, threat.vy)
      if (speed > 92) {
        threat.vx = (threat.vx / speed) * 92
        threat.vy = (threat.vy / speed) * 92
      }
      threat.vx *= Math.pow(0.16, dt)
      threat.vy *= Math.pow(0.16, dt)
      threat.x = clamp(threat.x + threat.vx * dt, 40, this.surface.width - 40)
      threat.y = clamp(threat.y + threat.vy * dt, 40, this.surface.height - 40)
      const rr = threat.radius + 13
      if ((threat.x - this.surface.pilot.x) ** 2 + (threat.y - this.surface.pilot.y) ** 2 < rr * rr && this.surface.pilot.invuln <= 0) {
        this.surface.pilot.invuln = 0.65
        this.damagePlayer(9)
        this.burst(this.surface.pilot.x, this.surface.pilot.y, '#ff5d73', 10, 160)
      }
      if (threat.hp <= 0) {
        this.burst(threat.x, threat.y, threat.color, 24, 260)
        this.audio.boom(false)
        this.stats.score += 160
        this.surface.threats.splice(i, 1)
      }
    }
  }

  private fireMiningPulse() {
    if (!this.surface) return
    this.surface.pilot.mineCd = 0.28
    this.audio.fire(2)
    this.shockwaves.push({
      x: this.surface.pilot.x,
      y: this.surface.pilot.y,
      radius: 8,
      speed: 220,
      life: 0.24,
      maxLife: 0.24,
      color: '#57fff3',
      jag: rand(0, TAU)
    })
    for (const threat of this.surface.threats) {
      const d = Math.sqrt((threat.x - this.surface.pilot.x) ** 2 + (threat.y - this.surface.pilot.y) ** 2)
      if (d > 92) continue
      threat.hp -= 18
      threat.hit = 0.08
      const away = norm(threat.x - this.surface.pilot.x, threat.y - this.surface.pilot.y)
      threat.vx += away.x * 180
      threat.vy += away.y * 180
      this.burst(threat.x, threat.y, '#57fff3', 6, 120)
    }
  }

  private startTakeoff() {
    if (!this.surface) return
    this.state = 'takeoff'
    this.transitionTimer = 0
    this.transitionDuration = 1.2
    this.audio.land()
    this.toast('RETURNING TO ORBIT')
  }

  private finishTakeoff() {
    if (!this.surface) return
    const first = !this.surface.planet.visited
    this.surface.planet.visited = true
    this.stats.planets = this.planets.filter((planet) => planet.visited).length
    this.stats.score += first ? 420 + this.surface.collected * 45 : this.surface.collected * 25
    this.player.landedCd = 2.2
    this.player.invuln = 0.8
    const needsUpgrade = this.surface.pendingUpgrade || (first && this.surface.collected > 0)
    const planetName = this.surface.planet.name
    this.surface = null
    this.state = 'playing'
    this.showOnly(null)
    this.toast(`${planetName}: SURFACE CACHE EXTRACTED`)
    if (needsUpgrade) this.openLevelUp()
  }

  private updateCamera(dt: number) {
    const targetX = this.player.x - this.width / 2
    const targetY = this.player.y - this.height / 2
    this.camera.x += (targetX - this.camera.x) * clamp(dt * 7, 0, 1)
    this.camera.y += (targetY - this.camera.y) * clamp(dt * 7, 0, 1)
    this.camera.x = clamp(this.camera.x, 0, WORLD_W - this.width)
    this.camera.y = clamp(this.camera.y, 0, WORLD_H - this.height)
    this.camera.shake = Math.max(0, this.camera.shake - dt * 35)
  }

  private burst(x: number, y: number, color: string, count: number, speed: number) {
    const load = this.particles.length / MAX_PARTICLES
    const particleCount = Math.max(3, Math.floor(count * clamp(1 - load * 0.65, 0.3, 1)))
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
        length: shard ? undefined : rand(14, big ? 46 : 30),
        glow: shard ? 18 : 12
      })
    }
  }

  private screenToWorld(x: number, y: number): Vec {
    return { x: x + this.camera.x, y: y + this.camera.y }
  }

  private worldToScreen(x: number, y: number): Vec {
    const shakeX = this.camera.shake > 0 ? rand(-this.camera.shake, this.camera.shake) : 0
    const shakeY = this.camera.shake > 0 ? rand(-this.camera.shake, this.camera.shake) : 0
    return { x: x - this.camera.x + shakeX, y: y - this.camera.y + shakeY }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#020305'
    ctx.fillRect(0, 0, this.width, this.height)
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
    this.renderSpaceScene(ctx)
  }

  private renderSpaceScene(ctx: CanvasRenderingContext2D) {
    this.mini.style.display = ''
    this.renderBackground(ctx)
    this.renderPlanets(ctx)
    this.renderPickups(ctx)
    this.renderBullets(ctx)
    this.renderEnemies(ctx)
    this.renderOrbitals(ctx)
    this.renderPlayer(ctx)
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
    return this.particles.length > 170 || this.enemies.length > 120 || this.bullets.length > 130 || this.pickups.length > 150
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
    this.renderSurfaceThreats(ctx, s)
    this.renderSurfacePilot(ctx, s)
    this.renderShockwaves(ctx)
    this.renderParticles(ctx)
    this.renderSurfaceHud(ctx, s)
    ctx.restore()
  }

  private renderSurfaceShip(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const p = this.surfaceToScreen(s.ship.x, s.ship.y)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.strokeStyle = '#57fff3'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 18
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -38)
    ctx.lineTo(48, 30)
    ctx.lineTo(14, 18)
    ctx.lineTo(0, 38)
    ctx.lineTo(-14, 18)
    ctx.lineTo(-48, 30)
    ctx.closePath()
    ctx.stroke()
    ctx.strokeStyle = '#fff27a'
    ctx.beginPath()
    ctx.moveTo(-34, 34)
    ctx.lineTo(-54, 58)
    ctx.moveTo(34, 34)
    ctx.lineTo(54, 58)
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

  private renderSurfaceThreats(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    for (const threat of s.threats) {
      const p = this.surfaceToScreen(threat.x, threat.y)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(threat.phase)
      ctx.strokeStyle = threat.hit > 0 ? '#ffffff' : threat.color
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

  private renderSurfacePilot(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const p = this.surfaceToScreen(s.pilot.x, s.pilot.y)
    const step = Math.sin(this.stats.time * 11) * 4
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(s.pilot.facing)
    ctx.strokeStyle = s.pilot.invuln > 0 ? '#fff27a' : '#d7fff7'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 10
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(8, 0, 5, 0, TAU)
    ctx.moveTo(2, 0)
    ctx.lineTo(-10, 0)
    ctx.moveTo(-1, 0)
    ctx.lineTo(-8, -9 - step)
    ctx.moveTo(-1, 0)
    ctx.lineTo(-8, 9 + step)
    ctx.moveTo(-10, 0)
    ctx.lineTo(-18, -8 + step)
    ctx.moveTo(-10, 0)
    ctx.lineTo(-18, 8 - step)
    ctx.stroke()
    if (s.pilot.mineCd > 0.18) {
      ctx.strokeStyle = '#57fff3'
      ctx.beginPath()
      ctx.arc(0, 0, 34, 0, TAU)
      ctx.stroke()
    }
    ctx.restore()
  }

  private renderSurfaceHud(ctx: CanvasRenderingContext2D, s: SurfaceRun) {
    const nearShip = Math.sqrt(dist2(s.pilot, s.ship)) < 64
    ctx.save()
    ctx.fillStyle = '#fff27a'
    ctx.shadowColor = '#fff27a'
    ctx.shadowBlur = 12
    ctx.font = '14px Courier New'
    ctx.textAlign = 'center'
    const message = nearShip ? 'PRESS E / Y TO BOARD SHIP' : s.message
    ctx.fillText(`${s.planet.name} SURFACE: ${s.collected}/${s.resources.length} SIGNALS`, this.width / 2, 86)
    ctx.fillText(message, this.width / 2, this.height - 42)
    ctx.restore()
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

  private renderBackground(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.strokeStyle = 'rgba(87,255,243,0.08)'
    ctx.lineWidth = 1
    const grid = 240
    const startX = Math.floor(this.camera.x / grid) * grid
    const startY = Math.floor(this.camera.y / grid) * grid
    for (let x = startX; x < this.camera.x + this.width + grid; x += grid) {
      const sx = x - this.camera.x
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, this.height)
      ctx.stroke()
    }
    for (let y = startY; y < this.camera.y + this.height + grid; y += grid) {
      const sy = y - this.camera.y
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(this.width, sy)
      ctx.stroke()
    }
    for (const s of this.stars) {
      const p = this.worldToScreen(s.x, s.y)
      if (p.x < -10 || p.x > this.width + 10 || p.y < -10 || p.y > this.height + 10) continue
      ctx.fillStyle = 'rgba(215,255,247,0.5)'
      ctx.fillRect(p.x, p.y, 1.4, 1.4)
    }
    ctx.strokeStyle = 'rgba(255,242,122,0.18)'
    ctx.strokeRect(-this.camera.x, -this.camera.y, WORLD_W, WORLD_H)
    ctx.restore()
  }

  private renderPlanets(ctx: CanvasRenderingContext2D) {
    for (const p of this.planets) {
      const s = this.worldToScreen(p.x, p.y)
      if (s.x < -260 || s.x > this.width + 260 || s.y < -260 || s.y > this.height + 260) continue
      ctx.save()
      ctx.strokeStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 18
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(s.x, s.y, p.radius, 0, TAU)
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 0.38
      ctx.beginPath()
      ctx.ellipse(s.x, s.y, p.radius * 1.75, p.radius * 0.38, Math.sin(this.stats.time * 0.3) * 0.35, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, p.radius * (0.35 + i * 0.15), 0, TAU * (0.56 + Math.sin(this.stats.time + i) * 0.08))
        ctx.stroke()
      }
      ctx.fillStyle = p.visited ? '#8fff7d' : '#d7fff7'
      ctx.font = '12px Courier New'
      ctx.textAlign = 'center'
      ctx.fillText(p.name, s.x, s.y + p.radius + 24)
      ctx.restore()
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.worldToScreen(this.player.x, this.player.y)
    const a = this.player.angle
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(a)
    ctx.strokeStyle = this.player.invuln > 0 ? '#fff27a' : '#57fff3'
    ctx.shadowColor = '#57fff3'
    ctx.shadowBlur = 14
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(24, 0)
    ctx.lineTo(-15, -13)
    ctx.lineTo(-8, 0)
    ctx.lineTo(-15, 13)
    ctx.closePath()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-16, -8)
    ctx.lineTo(-28 - Math.random() * 8, 0)
    ctx.lineTo(-16, 8)
    ctx.stroke()
    ctx.restore()

    if (this.player.maxShield > 0 && this.player.shield > 1) {
      ctx.save()
      ctx.strokeStyle = `rgba(112,168,255,${0.25 + this.player.shield / this.player.maxShield * 0.42})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(p.x, p.y, this.player.radius + 10, 0, TAU)
      ctx.stroke()
      ctx.restore()
    }

    ctx.save()
    ctx.strokeStyle = 'rgba(255,242,122,0.52)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(p.x + Math.cos(this.player.aimAngle) * 58, p.y + Math.sin(this.player.aimAngle) * 58)
    ctx.stroke()
    ctx.restore()
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      const p = this.worldToScreen(b.x, b.y)
      if (p.x < -80 || p.x > this.width + 80 || p.y < -80 || p.y > this.height + 80) continue
      ctx.save()
      ctx.strokeStyle = b.color
      ctx.shadowColor = b.color
      ctx.shadowBlur = this.isHighLoad() ? 0 : b.rail ? 18 : 10
      ctx.lineWidth = b.rail ? 3 : 2
      ctx.beginPath()
      const tail = norm(b.vx, b.vy)
      ctx.moveTo(p.x - tail.x * (b.rail ? 26 : 12), p.y - tail.y * (b.rail ? 26 : 12))
      ctx.lineTo(p.x + tail.x * (b.rail ? 16 : 7), p.y + tail.y * (b.rail ? 16 : 7))
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    const highLoad = this.isHighLoad()
    for (const e of this.enemies) {
      const p = this.worldToScreen(e.x, e.y)
      if (p.x < -90 || p.x > this.width + 90 || p.y < -90 || p.y > this.height + 90) continue
      if (highLoad && e.kind !== 'warden') {
        this.renderEnemyLod(ctx, e, p)
        continue
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(e.phase)
      ctx.strokeStyle = e.flash > 0 ? '#ffffff' : e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = highLoad ? 0 : 12
      ctx.lineWidth = e.kind === 'warden' ? 3 : 2
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
      }
      ctx.restore()
    }
  }

  private renderEnemyLod(ctx: CanvasRenderingContext2D, e: Enemy, p: Vec) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(e.phase)
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
    for (const p of this.pickups) {
      const s = this.worldToScreen(p.x, p.y)
      if (s.x < -60 || s.x > this.width + 60 || s.y < -60 || s.y > this.height + 60) continue
      ctx.save()
      ctx.strokeStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = this.isHighLoad() ? 0 : 12
      ctx.lineWidth = 2
      ctx.translate(s.x, s.y)
      ctx.rotate(this.stats.time * 2)
      ctx.beginPath()
      if (p.kind === 'xp') {
        ctx.moveTo(0, -p.radius)
        ctx.lineTo(p.radius, 0)
        ctx.lineTo(0, p.radius)
        ctx.lineTo(-p.radius, 0)
      } else if (p.kind === 'chest') {
        ctx.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2)
        ctx.moveTo(-p.radius, 0)
        ctx.lineTo(p.radius, 0)
      } else {
        ctx.arc(0, 0, p.radius, 0, TAU)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const highLoad = this.isHighLoad()
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
      ctx.shadowBlur = highLoad ? 0 : p.glow ?? 10
      ctx.lineWidth = p.sides ? 1.5 : clamp(p.size, 1, 3)
      ctx.translate(s.x, s.y)
      ctx.rotate(p.angle ?? 0)
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

  private renderShockwaves(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const highLoad = this.isHighLoad()
    for (const w of this.shockwaves) {
      const s = this.effectToScreen(w.x, w.y)
      if (s.x + w.radius < -120 || s.x - w.radius > this.width + 120 || s.y + w.radius < -120 || s.y - w.radius > this.height + 120) continue
      const alpha = clamp(w.life / w.maxLife, 0, 1)
      const points = highLoad ? 10 : 18
      ctx.save()
      ctx.globalAlpha = alpha * 0.92
      ctx.strokeStyle = w.color
      ctx.shadowColor = w.color
      ctx.shadowBlur = highLoad ? 0 : 28
      ctx.lineWidth = 2 + alpha * 3
      ctx.beginPath()
      for (let i = 0; i <= points; i += 1) {
        const a = (i / points) * TAU
        const wobble = Math.sin(a * 5 + w.jag) * 0.12 + Math.sin(a * 9 - w.jag) * 0.06
        const r = w.radius * (1 + wobble)
        const x = s.x + Math.cos(a) * r
        const y = s.y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.globalAlpha = alpha * 0.25
      ctx.lineWidth = 8
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }

  private renderOrbitals(ctx: CanvasRenderingContext2D) {
    const count = this.build.orbit
    if (count <= 0) return
    const center = this.worldToScreen(this.player.x, this.player.y)
    const radius = 66 + count * 8
    ctx.save()
    ctx.strokeStyle = '#8fff7d'
    ctx.shadowColor = '#8fff7d'
    ctx.shadowBlur = 14
    for (let i = 0; i < count; i += 1) {
      const a = this.stats.time * (2.4 + count * 0.18) + (i / count) * TAU
      const x = center.x + Math.cos(a) * radius
      const y = center.y + Math.sin(a) * radius
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(a) * 12, y - Math.sin(a) * 12)
      ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12)
      ctx.stroke()
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
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(2,8,12,0.72)'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(87,255,243,0.5)'
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
    for (const p of this.planets) {
      ctx.strokeStyle = p.visited ? '#8fff7d' : p.color
      ctx.beginPath()
      ctx.arc((p.x / WORLD_W) * w, (p.y / WORLD_H) * h, p.visited ? 4 : 3, 0, TAU)
      ctx.stroke()
    }
    for (const e of this.enemies.slice(0, 70)) {
      ctx.fillStyle = e.kind === 'warden' ? '#b990ff' : '#ff5d73'
      ctx.fillRect((e.x / WORLD_W) * w - 1, (e.y / WORLD_H) * h - 1, 2, 2)
    }
    ctx.fillStyle = '#57fff3'
    ctx.beginPath()
    ctx.arc((this.player.x / WORLD_W) * w, (this.player.y / WORLD_H) * h, 4, 0, TAU)
    ctx.fill()
  }

  private updateHud() {
    this.ui.score.textContent = Math.floor(this.stats.score).toString()
    this.ui.time.textContent = formatTime(this.stats.time)
    this.ui.level.textContent = this.stats.level.toString()
    this.ui.wave.textContent = this.stats.kills.toString()
    const shield = this.player.maxShield > 0 ? ` +${Math.floor(this.player.shield)}` : ''
    this.ui.hull.textContent = `${Math.ceil(Math.max(0, this.player.hull))}/${this.player.maxHull}${shield}`
    this.ui.high.textContent = Math.max(this.stats.highScore, this.stats.score).toString()
    this.ui.xpFill.style.width = `${clamp((this.stats.xp / this.stats.nextXp) * 100, 0, 100)}%`
    this.updateTouchHud()
  }

  private updateTouchHud() {
    const show = this.state === 'playing' || this.state === 'surface'
    this.ui.touchControls.classList.toggle('visible', show)
    if (this.touchStick.active) {
      const dx = clamp(this.touchStick.x - this.touchStick.startX, -64, 64)
      const dy = clamp(this.touchStick.y - this.touchStick.startY, -64, 64)
      this.ui.touchKnob.style.transform = `translate(${dx}px, ${dy}px)`
    } else {
      this.ui.touchKnob.style.transform = 'translate(0, 0)'
    }
    if (this.state === 'surface') {
      this.ui.touchAction.textContent = this.surface && Math.sqrt(dist2(this.surface.pilot, this.surface.ship)) < 64 ? 'BOARD' : 'USE'
      this.ui.touchDash.textContent = 'PULSE'
      return
    }
    const planet = this.planets.find((p) => Math.sqrt(dist2(p, this.player)) < p.radius + 86)
    this.ui.touchAction.textContent = planet ? 'LAND' : 'USE'
    this.ui.touchDash.textContent = 'DASH'
  }

  private renderLevelUp(title: string, copy: string) {
    this.ui.levelup.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = title
    const p = document.createElement('p')
    p.className = 'copy'
    p.textContent = copy
    const grid = document.createElement('div')
    grid.className = 'choice-grid'
    for (const upgrade of this.upgradeChoices) {
      const button = document.createElement('button')
      button.className = 'choice'
      button.innerHTML = `<strong>${upgrade.name} ${this.build[upgrade.id] + 1}/${upgrade.max}</strong><span>${upgrade.description}</span>`
      button.addEventListener('click', () => this.applyUpgrade(upgrade))
      grid.append(button)
    }
    panel.append(h, p, grid)
    this.ui.levelup.append(panel)
    this.showOnly('levelup')
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
    copy.textContent = p.visited ? 'The dock remembers you. It offers a small repair and a moment of quiet.' : p.reward
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

  private showTitle() {
    this.state = 'title'
    this.ui.title.innerHTML = ''
    const panel = document.createElement('div')
    panel.className = 'panel'
    const h = document.createElement('h1')
    h.className = 'title'
    h.textContent = 'VECTOR SHOOTER'
    const k = document.createElement('p')
    k.className = 'kicker'
    k.textContent = 'Vampire Survivors pressure, Asteroids handling, Vectrex glow.'
    const grid = document.createElement('div')
    grid.className = 'menu-grid'
    const left = document.createElement('div')
    const copy = document.createElement('p')
    copy.className = 'copy'
    copy.textContent = 'Explore a large signal map, land on strange planets, run surface salvage in a tiny pressure suit, crack treasure cores, and build a ridiculous little ship while the vector horde thickens.'
    const row = document.createElement('div')
    row.className = 'button-row'
    const start = document.createElement('button')
    start.className = 'vector-button'
    start.textContent = 'Start Run'
    start.addEventListener('click', () => this.start())
    const scores = document.createElement('button')
    scores.className = 'vector-button secondary'
    scores.textContent = 'High Scores'
    scores.addEventListener('click', () => this.showScores())
    row.append(start, scores)
    left.append(copy, row)
    const meta = document.createElement('div')
    meta.className = 'meta-list'
    meta.innerHTML = `
      <div>WASD move. Mouse, arrows, IJKL, or right stick aim and fire.</div>
      <div>Space or right trigger fires. Shift, B, or RB dashes.</div>
      <div>Press E or Y near a planet to descend, then return to the ship when the cache is clear.</div>
      <div>On foot, move with WASD or left stick. Space, mouse, A, or RT fires the mining pulse.</div>
    `
    grid.append(left, meta)
    panel.append(h, k, grid)
    this.ui.title.append(panel)
    this.showOnly('title')
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
    this.state = 'gameover'
    this.audio.boom(true)
    this.saveScore()
    this.renderGameOver()
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
    copy.textContent = `Score ${Math.floor(this.stats.score)}. Survived ${formatTime(this.stats.time)}. Level ${this.stats.level}. Kills ${this.stats.kills}. Planets landed ${this.stats.planets}/${this.planets.length}.`
    const input = document.createElement('input')
    input.className = 'name-entry'
    input.maxLength = 12
    input.value = this.scoreName
    input.addEventListener('input', () => {
      this.scoreName = input.value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '').slice(0, 12) || 'ACE'
      input.value = this.scoreName
    })
    const row = document.createElement('div')
    row.className = 'button-row'
    const retry = document.createElement('button')
    retry.className = 'vector-button'
    retry.textContent = 'Run Again'
    retry.addEventListener('click', () => this.restartFromGameOver())
    const scores = document.createElement('button')
    scores.className = 'vector-button secondary'
    scores.textContent = 'Scores'
    scores.addEventListener('click', () => this.showScores())
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

  private reset() {
    this.player = this.makePlayer()
    this.bullets = []
    this.enemies = []
    this.pickups = []
    this.particles = []
    this.shockwaves = []
    this.surface = null
    this.transitionTimer = 0
    this.planets.forEach((p) => (p.visited = false))
    this.stats = { time: 0, kills: 0, level: 1, xp: 0, nextXp: 24, highScore: this.highs[0]?.score ?? 0, planets: 0, score: 0 }
    for (const k of Object.keys(this.build) as UpgradeId[]) this.build[k] = 0
    this.spawnTimer = 0.4
    this.bossTimer = 75
    this.chestTimer = 28
    this.scoreSaved = false
    this.camera.x = this.player.x - this.width / 2
    this.camera.y = this.player.y - this.height / 2
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
