/**
 * OMEGA PROTOCOL — Pure Deterministic Combat & 3D Perspective Simulation Engine.
 * Pure ES2022 only: compiled by both tsconfig.json and tsconfig.engine.json.
 */

import {
  OMEGA_COVER_LANE_X,
  OMEGA_SECTORS,
  OMEGA_UPGRADES,
  OMEGA_WEAPONS,
  OMEGA_WEAPON_ORDER,
  computeOmegaRank,
  projectOmegaPoint,
  type OmegaAudioCueKind,
  type OmegaCoverLane,
  type OmegaEnemyKind,
  type OmegaPosture,
  type OmegaPropKind,
  type OmegaRank,
  type OmegaSectorConfig,
  type OmegaUpgradeConfig,
  type OmegaUpgradeId,
  type OmegaWeaponId,
} from '../domain/omega-protocol';

export interface OmegaInput {
  readonly aimX: number;
  readonly aimY: number;
  readonly firing: boolean;
  readonly forcingCover?: boolean;
}

export interface OmegaAudioEvent {
  readonly kind: OmegaAudioCueKind;
  readonly pan: number;
}

export interface OmegaBarrierState {
  readonly lane: OmegaCoverLane;
  readonly worldX: number;
  maxHp: number;
  hp: number;
  breached: boolean;
  repairTimer: number;
  hitFlash: number;
}

export interface OmegaBossPart {
  readonly id: string;
  readonly label: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly radius: number;
  maxHp: number;
  hp: number;
  broken: boolean;
  orbitAngle?: number;
}

export interface OmegaEnemyState {
  readonly id: number;
  readonly kind: OmegaEnemyKind;
  readonly isBoss: boolean;
  worldX: number;
  z: number;
  elevation: number;
  baseWorldX: number;
  baseZ: number;
  baseElevation: number;
  maxHp: number;
  hp: number;
  hitRadius: number;
  weakOffsetX: number;
  weakOffsetY: number;
  weakRadius: number;
  shielded: boolean;
  stunTimer: number;
  hitFlash: number;
  age: number;
  attackCooldown: number;
  lockTargetLane: OmegaCoverLane | null;
  lockProgress: number;
  lockDuration: number;
  beamLanes: OmegaCoverLane[];
  beamProgress: number;
  beamDuration: number;
  phase: 1 | 2;
  parts: OmegaBossPart[];
  jumpCooldown: number;
}

export interface OmegaPropState {
  readonly id: number;
  readonly kind: OmegaPropKind;
  readonly worldX: number;
  readonly z: number;
  maxHp: number;
  hp: number;
  destroyed: boolean;
  hitFlash: number;
}

export interface OmegaEnemyShot {
  readonly id: number;
  readonly kind: 'bullet' | 'rocket' | 'plasma';
  readonly startX: number;
  readonly startElevation: number;
  readonly startZ: number;
  worldX: number;
  elevation: number;
  z: number;
  readonly targetLane: OmegaCoverLane;
  readonly damage: number;
  readonly duration: number;
  elapsed: number;
  hp: number;
  maxHp: number;
}

export interface OmegaTracer {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly width: number;
  life: number;
  maxLife: number;
}

export interface OmegaParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
}

export interface OmegaPopup {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface OmegaAfterimage {
  readonly lane: OmegaCoverLane;
  readonly worldX: number;
  life: number;
  maxLife: number;
}

export interface OmegaShockwave {
  readonly x: number;
  readonly y: number;
  radius: number;
  readonly maxRadius: number;
  readonly color: string;
  life: number;
  readonly maxLife: number;
}

export interface OmegaPhantomGhost {
  readonly worldX: number;
  readonly z: number;
  readonly elevation: number;
  life: number;
  readonly maxLife: number;
}

export interface OmegaLightBloom {
  x: number;
  y: number;
  color: string;
  intensity: number;
}

export type OmegaPhase =
  | 'briefing'
  | 'playing'
  | 'upgrade'
  | 'transition'
  | 'paused'
  | 'victory'
  | 'defeat';

export interface OmegaEngineOptions {
  readonly seed?: number;
}

interface PendingSpawn {
  readonly kind: OmegaEnemyKind;
  readonly worldX: number;
  readonly z: number;
  readonly elevation: number;
  timer: number;
}

export class OmegaProtocolEngine {
  private rngState: number;
  private nextEntityId = 1;
  private audioQueue: OmegaAudioEvent[] = [];
  private pendingSpawns: PendingSpawn[] = [];
  private perfectEvadeCooldown = 0;
  private overdriveBoltCounter = 0;
  private phaseBeforePause: OmegaPhase = 'playing';

  readonly state = {
    phase: 'briefing' as OmegaPhase,
    singleSectorMode: false,
    sectorIndex: 0,
    waveIndex: 0,
    waveLabel: '',
    elapsed: 0,
    sectorElapsed: 0,
    lane: 1 as OmegaCoverLane,
    posture: 'cover' as OmegaPosture,
    aimX: 0.5,
    aimY: 0.45,
    camX: 0,
    camY: 0,
    hp: 100,
    maxHp: 100,
    shield: 60,
    maxShield: 60,
    shieldRegenDelay: 0,
    weapon: 'pulse' as OmegaWeaponId,
    mag: {
      pulse: OMEGA_WEAPONS.pulse.magazineSize,
      scatter: OMEGA_WEAPONS.scatter.magazineSize,
      rail: OMEGA_WEAPONS.rail.magazineSize,
    },
    overchargedShots: 0,
    railRechargeTimer: 0,
    fireCooldown: 0,
    reloadActive: false,
    reloadProgress: 0,
    reloadDuration: 1.15,
    reloadAttempted: false,
    reloadJammed: false,
    dashTimer: 0,
    dashCooldown: 0,
    invulnTimer: 0,
    slowMoTimer: 0,
    omegaGauge: 0,
    overdriveCutInTimer: 0,
    overdriveTimer: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    comboTimer: 0,
    kills: 0,
    weakpointKills: 0,
    perfectEvades: 0,
    counterBreaks: 0,
    damageTaken: 0,
    clearedSectors: [] as number[],
    upgrades: [] as OmegaUpgradeId[],
    upgradeChoices: [] as OmegaUpgradeConfig[],
    transitionTimer: 0,
    transitionDuration: 2.5,
    barriers: [] as OmegaBarrierState[],
    enemies: [] as OmegaEnemyState[],
    props: [] as OmegaPropState[],
    enemyShots: [] as OmegaEnemyShot[],
    tracers: [] as OmegaTracer[],
    particles: [] as OmegaParticle[],
    popups: [] as OmegaPopup[],
    afterimages: [] as OmegaAfterimage[],
    shockwaves: [] as OmegaShockwave[],
    phantomGhosts: [] as OmegaPhantomGhost[],
    lastLightBloom: { x: 0.5, y: 0.5, color: '#ff4ec8', intensity: 0 } as OmegaLightBloom,
    commsText: '',
    commsTimer: 0,
    bossWarningTimer: 0,
    bossTitle: '',
    shake: 0,
    hitstopTimer: 0,
    flashAlpha: 0,
    muzzleFlash: 0,
    playerHitFlash: 0,
    lightningFlash: 0,
    lightningCooldown: 4.5,
    rank: 'B' as OmegaRank,
  };

  constructor(options: OmegaEngineOptions = {}) {
    this.rngState = (options.seed ?? 20261119) >>> 0 || 1;
    this.initBarriers();
  }

  get sector(): OmegaSectorConfig {
    return OMEGA_SECTORS[this.state.sectorIndex] ?? OMEGA_SECTORS[0]!;
  }

  hasUpgrade(id: OmegaUpgradeId): boolean {
    return this.state.upgrades.includes(id);
  }

  drainAudioEvents(): OmegaAudioEvent[] {
    return this.audioQueue.splice(0);
  }

  private nextRandom(): number {
    let x = this.rngState;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.rngState = x >>> 0 || 1;
    return this.rngState / 0x100000000;
  }

  private emitAudio(kind: OmegaAudioCueKind, worldX = 0): void {
    const pan = Math.max(-1, Math.min(1, worldX * 2));
    this.audioQueue.push({ kind, pan });
    if (this.audioQueue.length > 48) this.audioQueue.shift();
  }

  private initBarriers(): void {
    const bonusHp = this.hasUpgrade('nano_barriers') ? 45 : 0;
    const maxHp = 120 + bonusHp;
    this.state.barriers = ([0, 1, 2] as const).map(lane => ({
      lane,
      worldX: OMEGA_COVER_LANE_X[lane],
      maxHp,
      hp: maxHp,
      breached: false,
      repairTimer: 0,
      hitFlash: 0,
    }));
  }

  startCampaign(startSectorIndex = 0, singleSectorMode = false): void {
    const s = this.state;
    const idx = Math.max(0, Math.min(OMEGA_SECTORS.length - 1, Math.floor(startSectorIndex)));
    s.singleSectorMode = singleSectorMode;
    s.sectorIndex = idx;
    s.elapsed = 0;
    s.lane = 1;
    s.posture = 'cover';
    s.aimX = 0.5;
    s.aimY = 0.44;
    s.camX = 0;
    s.camY = 0;
    s.maxHp = 100;
    s.hp = 100;
    s.maxShield = 60;
    s.shield = 60;
    s.shieldRegenDelay = 0;
    s.weapon = 'pulse';
    s.mag = {
      pulse: OMEGA_WEAPONS.pulse.magazineSize,
      scatter: OMEGA_WEAPONS.scatter.magazineSize,
      rail: OMEGA_WEAPONS.rail.magazineSize,
    };
    s.overchargedShots = 0;
    s.railRechargeTimer = 0;
    s.fireCooldown = 0;
    s.reloadActive = false;
    s.reloadProgress = 0;
    s.reloadAttempted = false;
    s.reloadJammed = false;
    s.dashTimer = 0;
    s.dashCooldown = 0;
    s.invulnTimer = 0;
    s.slowMoTimer = 0;
    s.omegaGauge = 0;
    s.overdriveCutInTimer = 0;
    s.overdriveTimer = 0;
    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.comboTimer = 0;
    s.kills = 0;
    s.weakpointKills = 0;
    s.perfectEvades = 0;
    s.counterBreaks = 0;
    s.damageTaken = 0;
    s.clearedSectors = [];
    s.upgrades = [];
    s.upgradeChoices = [];
    s.transitionTimer = 0;
    s.tracers = [];
    s.particles = [];
    s.popups = [];
    s.afterimages = [];
    s.shockwaves = [];
    s.phantomGhosts = [];
    s.lastLightBloom = { x: 0.5, y: 0.5, color: '#ff4ec8', intensity: 0 };
    s.shake = 0;
    s.hitstopTimer = 0;
    s.flashAlpha = 0;
    s.muzzleFlash = 0;
    s.playerHitFlash = 0;
    s.rank = 'B';
    this.audioQueue = [];
    this.perfectEvadeCooldown = 0;
    this.initBarriers();
    this.enterSector(idx);
  }

  private enterSector(sectorIndex: number): void {
    const s = this.state;
    s.sectorIndex = Math.max(0, Math.min(OMEGA_SECTORS.length - 1, sectorIndex));
    s.phase = 'playing';
    s.sectorElapsed = 0;
    s.waveIndex = 0;
    s.enemies = [];
    s.props = [];
    s.enemyShots = [];
    this.pendingSpawns = [];
    for (const barrier of s.barriers) {
      barrier.breached = false;
      barrier.repairTimer = 0;
      barrier.hp = Math.max(barrier.hp, Math.round(barrier.maxHp * 0.7));
    }
    const sec = this.sector;
    s.commsText = sec.comms.intro;
    s.commsTimer = 4.6;
    this.beginWave(0);
  }

  private beginWave(waveIndex: number): void {
    const s = this.state;
    const sec = this.sector;
    const wave = sec.waves[waveIndex];
    if (!wave) return;
    s.waveIndex = waveIndex;
    s.waveLabel = wave.label;
    this.pendingSpawns = wave.spawns.map(spec => ({
      kind: spec.kind,
      worldX: spec.worldX,
      z: spec.z,
      elevation: spec.elevation ?? 0,
      timer: spec.delay,
    }));
    if (wave.props) {
      for (const p of wave.props) {
        s.props.push({
          id: this.nextEntityId++,
          kind: p.kind,
          worldX: p.worldX,
          z: p.z,
          maxHp: p.kind === 'supply' ? 35 : 42,
          hp: p.kind === 'supply' ? 35 : 42,
          destroyed: false,
          hitFlash: 0,
        });
      }
    }
    if (wave.isBossWave) {
      s.commsText = sec.comms.boss;
      s.commsTimer = 5.0;
      s.bossTitle = `${sec.bossTitleEn} · ${sec.bossTitleKo}`;
      s.bossWarningTimer = 1.9;
      this.emitAudio('boss_warn', 0);
    }
  }

  private spawnEnemy(spec: PendingSpawn): void {
    const id = this.nextEntityId++;
    const scaleFactor = 1 + this.state.sectorIndex * 0.14;
    let maxHp = 75;
    let hitRadius = 0.044;
    let weakOffsetX = 0;
    let weakOffsetY = -0.044;
    let weakRadius = 0.02;
    let shielded = false;
    let isBoss = false;
    let parts: OmegaBossPart[] = [];
    let attackCooldown = 1.3 + this.nextRandom() * 0.9;

    switch (spec.kind) {
      case 'trooper':
        maxHp = Math.round(68 * scaleFactor);
        hitRadius = 0.045;
        weakOffsetY = -0.048;
        weakRadius = 0.021;
        break;
      case 'drone':
        maxHp = Math.round(52 * scaleFactor);
        hitRadius = 0.04;
        weakOffsetY = 0;
        weakRadius = 0.024;
        attackCooldown = 1.6 + this.nextRandom() * 0.7;
        break;
      case 'breacher':
        maxHp = Math.round(145 * scaleFactor);
        hitRadius = 0.056;
        weakOffsetY = -0.055;
        weakRadius = 0.02;
        shielded = true;
        attackCooldown = 1.5;
        break;
      case 'sniper':
        maxHp = Math.round(78 * scaleFactor);
        hitRadius = 0.042;
        weakOffsetY = -0.048;
        weakRadius = 0.022;
        attackCooldown = 1.25;
        break;
      case 'turret':
        maxHp = Math.round(130 * scaleFactor);
        hitRadius = 0.052;
        weakOffsetY = -0.026;
        weakRadius = 0.024;
        attackCooldown = 1.9;
        break;
      case 'boss_gatekeeper':
        isBoss = true;
        maxHp = 760;
        hitRadius = 0.115;
        weakOffsetY = -0.025;
        weakRadius = 0.036;
        attackCooldown = 1.4;
        parts = [
          {
            id: 'left_pod',
            label: '좌측 미사일 포드',
            offsetX: -0.088,
            offsetY: -0.068,
            radius: 0.036,
            maxHp: 220,
            hp: 220,
            broken: false,
          },
          {
            id: 'right_pod',
            label: '우측 미사일 포드',
            offsetX: 0.088,
            offsetY: -0.068,
            radius: 0.036,
            maxHp: 220,
            hp: 220,
            broken: false,
          },
        ];
        break;
      case 'boss_widow':
        isBoss = true;
        maxHp = 980;
        hitRadius = 0.11;
        weakOffsetY = 0.015;
        weakRadius = 0.038;
        attackCooldown = 1.5;
        break;
      case 'boss_phantom':
        isBoss = true;
        maxHp = 1120;
        hitRadius = 0.095;
        weakOffsetY = -0.055;
        weakRadius = 0.034;
        attackCooldown = 1.15;
        break;
      case 'boss_aeon':
        isBoss = true;
        maxHp = 1600;
        hitRadius = 0.13;
        weakOffsetY = -0.01;
        weakRadius = 0.042;
        attackCooldown = 1.3;
        parts = [0, 1, 2].map(idx => ({
          id: `pylon_${idx}`,
          label: `실드 파일론 ${idx + 1}`,
          offsetX: 0,
          offsetY: 0,
          radius: 0.032,
          maxHp: 165,
          hp: 165,
          broken: false,
          orbitAngle: (idx * Math.PI * 2) / 3,
        }));
        break;
    }

    this.state.enemies.push({
      id,
      kind: spec.kind,
      isBoss,
      worldX: spec.worldX,
      z: spec.z,
      elevation: spec.elevation,
      baseWorldX: spec.worldX,
      baseZ: spec.z,
      baseElevation: spec.elevation,
      maxHp,
      hp: maxHp,
      hitRadius,
      weakOffsetX,
      weakOffsetY,
      weakRadius,
      shielded,
      stunTimer: 0,
      hitFlash: 0,
      age: 0,
      attackCooldown,
      lockTargetLane: null,
      lockProgress: 0,
      lockDuration: spec.kind === 'sniper' ? 1.65 : 1.05,
      beamLanes: [],
      beamProgress: 0,
      beamDuration: 1.45,
      phase: 1,
      parts,
      jumpCooldown: 2.2,
    });
  }

  togglePause(): void {
    const s = this.state;
    if (s.phase === 'playing') {
      this.phaseBeforePause = 'playing';
      s.phase = 'paused';
    } else if (s.phase === 'paused') {
      s.phase = this.phaseBeforePause;
    }
  }

  selectWeapon(weapon: OmegaWeaponId): void {
    const s = this.state;
    if (s.weapon === weapon) return;
    s.weapon = weapon;
    s.reloadActive = false;
    s.reloadProgress = 0;
    s.reloadAttempted = false;
    s.reloadJammed = false;
    s.overchargedShots = 0;
  }

  cycleWeapon(): void {
    const idx = OMEGA_WEAPON_ORDER.indexOf(this.state.weapon);
    const next = OMEGA_WEAPON_ORDER[(idx + 1) % OMEGA_WEAPON_ORDER.length]!;
    this.selectWeapon(next);
  }

  moveToLane(targetLane: OmegaCoverLane): boolean {
    const s = this.state;
    if (s.phase !== 'playing' || s.overdriveCutInTimer > 0) return false;
    if (targetLane === s.lane || s.dashCooldown > 0) return false;
    const oldLane = s.lane;
    const oldX = OMEGA_COVER_LANE_X[oldLane];
    s.afterimages.push({ lane: oldLane, worldX: oldX, life: 0.36, maxLife: 0.36 });
    if (s.afterimages.length > 8) s.afterimages.shift();
    s.lane = targetLane;
    s.dashTimer = 0.28;
    s.dashCooldown = 0.22;
    s.invulnTimer = 0.34 + (this.hasUpgrade('reflex_thrusters') ? 0.12 : 0);
    s.posture = 'dash';
    this.emitAudio('dash', OMEGA_COVER_LANE_X[targetLane]);
    this.checkPerfectEvade(oldLane);
    return true;
  }

  dash(direction: -1 | 1): boolean {
    const next = Math.max(0, Math.min(2, this.state.lane + direction)) as OmegaCoverLane;
    return this.moveToLane(next);
  }

  private checkPerfectEvade(oldLane: OmegaCoverLane): void {
    if (this.perfectEvadeCooldown > 0) return;
    const s = this.state;
    const incomingShot = s.enemyShots.some(
      shot => shot.targetLane === oldLane && shot.duration - shot.elapsed <= 0.3,
    );
    const incomingLock = s.enemies.some(
      e =>
        (e.lockTargetLane === oldLane && e.lockProgress >= 0.72) ||
        (e.beamLanes.includes(oldLane) && e.beamProgress >= 0.68),
    );
    if (!incomingShot && !incomingLock) return;

    this.perfectEvadeCooldown = 0.85;
    s.slowMoTimer = Math.max(s.slowMoTimer, 1.35 + (this.hasUpgrade('reflex_thrusters') ? 0.45 : 0));
    s.reloadActive = false;
    s.reloadProgress = 0;
    s.reloadAttempted = false;
    s.reloadJammed = false;
    if (s.weapon !== 'rail') {
      s.mag[s.weapon] = OMEGA_WEAPONS[s.weapon].magazineSize;
    }
    this.grantRailCell(1);
    this.addOmegaGauge(18);
    s.perfectEvades += 1;
    s.score += 250;
    this.bumpCombo(2);
    const p = projectOmegaPoint(OMEGA_COVER_LANE_X[s.lane], 0.14, 0, this.sector.horizonY, s.camX, s.camY);
    this.spawnPopup(p.x, p.y - 0.08, 'PERFECT EVADE', '#4ef9ff', 1.25);
    this.emitAudio('perfect_evade', OMEGA_COVER_LANE_X[s.lane]);
  }

  triggerReload(): boolean {
    const s = this.state;
    if (s.phase !== 'playing') return false;
    const cfg = OMEGA_WEAPONS[s.weapon];
    if (s.weapon === 'rail') return false;

    if (s.reloadActive) {
      if (s.reloadAttempted || s.reloadJammed) return false;
      s.reloadAttempted = true;
      const [winStart, winEnd] = cfg.activeReloadWindow;
      if (s.reloadProgress >= winStart && s.reloadProgress <= winEnd) {
        s.reloadActive = false;
        s.reloadProgress = 0;
        s.mag[s.weapon] = cfg.magazineSize;
        s.overchargedShots = cfg.magazineSize;
        this.addOmegaGauge(10);
        const p = projectOmegaPoint(OMEGA_COVER_LANE_X[s.lane], 0.14, 0, this.sector.horizonY, s.camX, s.camY);
        this.spawnPopup(p.x, p.y - 0.07, 'OVERCHARGED', '#ffd45a', 1.15);
        this.emitAudio('reload_perfect', OMEGA_COVER_LANE_X[s.lane]);
        return true;
      }
      s.reloadJammed = true;
      s.reloadDuration += 0.28;
      this.emitAudio('ricochet', OMEGA_COVER_LANE_X[s.lane]);
      return false;
    }

    if (s.mag[s.weapon] >= cfg.magazineSize) return false;
    s.reloadActive = true;
    s.reloadProgress = 0;
    s.reloadDuration = cfg.reloadDuration;
    s.reloadAttempted = false;
    s.reloadJammed = false;
    s.overchargedShots = 0;
    this.emitAudio('reload_start', OMEGA_COVER_LANE_X[s.lane]);
    return true;
  }

  activateOverdrive(): boolean {
    const s = this.state;
    if (s.phase !== 'playing') return false;
    if (s.omegaGauge < 100 || s.overdriveTimer > 0 || s.overdriveCutInTimer > 0) return false;
    s.omegaGauge = 0;
    s.overdriveCutInTimer = 0.78;
    s.overdriveTimer = 6.5 + (this.hasUpgrade('omega_siphon') ? 1.5 : 0);
    s.reloadActive = false;
    s.reloadProgress = 0;
    s.invulnTimer = Math.max(s.invulnTimer, 0.9);
    s.flashAlpha = 0.65;
    s.shake = Math.max(s.shake, 0.022);
    s.shield = Math.min(s.maxShield, s.shield + 25);
    this.emitAudio('overdrive', 0);
    const p = projectOmegaPoint(OMEGA_COVER_LANE_X[s.lane], 0.18, 0, this.sector.horizonY, s.camX, s.camY);
    this.spawnShockwave(p.x, p.y - 0.04, 0.42, '#ff4ec8', 0.55);
    this.setLightBloom(p.x, p.y - 0.04, '#ff4ec8', 1.0);
    this.spawnPopup(p.x, p.y - 0.1, 'OMEGA OVERDRIVE', '#ff59ce', 1.45);
    return true;
  }

  chooseUpgrade(id: OmegaUpgradeId): boolean {
    const s = this.state;
    if (s.phase !== 'upgrade') return false;
    if (!s.upgradeChoices.some(choice => choice.id === id)) return false;
    s.upgrades.push(id);
    if (id === 'nano_barriers') {
      for (const b of s.barriers) {
        b.maxHp = 165;
        b.hp = 165;
        b.breached = false;
        b.repairTimer = 0;
      }
    }
    if (id === 'rail_capacitor') {
      this.grantRailCell(1);
    }
    s.upgradeChoices = [];
    s.phase = 'transition';
    s.transitionDuration = 2.5;
    s.transitionTimer = 2.5;
    return true;
  }

  private grantRailCell(amount: number): void {
    const maxCells = OMEGA_WEAPONS.rail.magazineSize;
    this.state.mag.rail = Math.min(maxCells, this.state.mag.rail + amount);
  }

  private addOmegaGauge(amount: number): void {
    if (this.state.overdriveTimer > 0) return;
    this.state.omegaGauge = Math.min(100, this.state.omegaGauge + amount);
  }

  private bumpCombo(delta = 1): void {
    const s = this.state;
    s.combo += delta;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.comboTimer = 4.2;
  }

  private spawnPopup(x: number, y: number, text: string, color: string, scale = 1): void {
    this.state.popups.push({
      x,
      y,
      vy: -0.075,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      scale,
    });
    if (this.state.popups.length > 24) this.state.popups.shift();
  }

  private spawnParticles(x: number, y: number, color: string, count: number, speed = 0.24): void {
    for (let i = 0; i < count; i++) {
      const ang = this.nextRandom() * Math.PI * 2;
      const spd = speed * (0.35 + this.nextRandom() * 0.85);
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.06,
        size: 2 + this.nextRandom() * 3.5,
        color,
        life: 0.35 + this.nextRandom() * 0.25,
        maxLife: 0.6,
        gravity: 0.38,
      });
    }
    if (this.state.particles.length > 160) {
      this.state.particles.splice(0, this.state.particles.length - 160);
    }
  }

  private spawnShockwave(x: number, y: number, maxRadius: number, color: string, maxLife = 0.42): void {
    this.state.shockwaves.push({
      x,
      y,
      radius: 0.015,
      maxRadius,
      color,
      life: maxLife,
      maxLife,
    });
    if (this.state.shockwaves.length > 16) {
      this.state.shockwaves.shift();
    }
  }

  private setLightBloom(x: number, y: number, color: string, intensity: number): void {
    if (intensity >= this.state.lastLightBloom.intensity * 0.75) {
      this.state.lastLightBloom = { x, y, color, intensity: Math.min(1.2, intensity) };
    }
  }

  update(dt: number, input: OmegaInput): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const clampedDt = Math.min(dt, 0.05);
    const s = this.state;

    // Visual effects decay cleanly even during cut-in/transition
    this.decayVisualEffects(clampedDt);

    if (s.phase === 'paused' || s.phase === 'briefing' || s.phase === 'upgrade' || s.phase === 'victory' || s.phase === 'defeat') {
      return;
    }

    if (s.phase === 'transition') {
      s.transitionTimer = Math.max(0, s.transitionTimer - clampedDt);
      if (s.transitionTimer === 0) {
        s.hp = Math.min(s.maxHp, s.hp + 30);
        s.shield = s.maxShield;
        this.enterSector(s.sectorIndex + 1);
      }
      return;
    }

    // Clamp & store player aim
    s.aimX = Math.max(0.04, Math.min(0.96, input.aimX));
    s.aimY = Math.max(0.08, Math.min(0.86, input.aimY));

    // Smooth 3D camera parallax rig combining cover lane + crosshair offset
    const targetCamX = OMEGA_COVER_LANE_X[s.lane] * 0.32 + (s.aimX - 0.5) * 0.16;
    const targetCamY = (s.aimY - 0.45) * 0.075;
    const camLerp = 1 - Math.exp(-10 * clampedDt);
    s.camX += (targetCamX - s.camX) * camLerp;
    s.camY += (targetCamY - s.camY) * camLerp;

    if (s.overdriveCutInTimer > 0) {
      s.overdriveCutInTimer = Math.max(0, s.overdriveCutInTimer - clampedDt);
      return;
    }

    if (s.hitstopTimer > 0) {
      s.hitstopTimer = Math.max(0, s.hitstopTimer - clampedDt);
      return;
    }

    s.elapsed += clampedDt;
    s.sectorElapsed += clampedDt;
    this.perfectEvadeCooldown = Math.max(0, this.perfectEvadeCooldown - clampedDt);
    s.dashTimer = Math.max(0, s.dashTimer - clampedDt);
    s.dashCooldown = Math.max(0, s.dashCooldown - clampedDt);
    s.invulnTimer = Math.max(0, s.invulnTimer - clampedDt);
    s.fireCooldown = Math.max(0, s.fireCooldown - clampedDt);
    s.slowMoTimer = Math.max(0, s.slowMoTimer - clampedDt);
    s.overdriveTimer = Math.max(0, s.overdriveTimer - clampedDt);
    s.comboTimer = Math.max(0, s.comboTimer - clampedDt);
    if (s.comboTimer === 0) s.combo = 0;

    // Time dilation for enemy actions during Perfect Evade or Omega Overdrive
    const worldScale = s.overdriveTimer > 0 ? 0.45 : s.slowMoTimer > 0 ? 0.38 : 1;
    const worldDt = clampedDt * worldScale;

    // Posture resolution
    const forcingCover = Boolean(input.forcingCover);
    const wantsFire = input.firing && !forcingCover;
    if (s.dashTimer > 0) {
      s.posture = 'dash';
    } else if (wantsFire && !s.reloadActive) {
      s.posture = 'peek';
    } else {
      s.posture = 'cover';
    }

    // Shield passive regeneration
    s.shieldRegenDelay = Math.max(0, s.shieldRegenDelay - clampedDt);
    if (s.shieldRegenDelay === 0 && s.shield < s.maxShield) {
      const regenRate = s.posture === 'cover' ? 14 : 4;
      s.shield = Math.min(s.maxShield, s.shield + regenRate * clampedDt);
    }

    // Barrier auto-repair countdown
    const repairRate = this.hasUpgrade('nano_barriers') ? 1.4 : 1.0;
    for (const b of s.barriers) {
      b.hitFlash = Math.max(0, b.hitFlash - clampedDt * 4);
      if (b.breached) {
        b.repairTimer = Math.max(0, b.repairTimer - clampedDt * repairRate);
        if (b.repairTimer === 0) {
          b.breached = false;
          b.hp = Math.round(b.maxHp * 0.85);
        }
      }
    }

    // Passive Rail cell recharge
    const railMax = OMEGA_WEAPONS.rail.magazineSize;
    if (s.mag.rail < railMax) {
      const rechargeBase = OMEGA_WEAPONS.rail.railRechargeSeconds ?? 3.4;
      const rechargeTime = this.hasUpgrade('rail_capacitor') ? rechargeBase / 1.35 : rechargeBase;
      s.railRechargeTimer += clampedDt;
      if (s.railRechargeTimer >= rechargeTime) {
        s.railRechargeTimer -= rechargeTime;
        s.mag.rail = Math.min(railMax, s.mag.rail + 1);
      }
    } else {
      s.railRechargeTimer = 0;
    }

    // Active reload progress
    if (s.reloadActive) {
      s.reloadProgress += clampedDt / s.reloadDuration;
      if (s.reloadProgress >= 1) {
        s.reloadActive = false;
        s.reloadProgress = 0;
        s.reloadAttempted = false;
        s.reloadJammed = false;
        if (s.weapon !== 'rail') {
          s.mag[s.weapon] = OMEGA_WEAPONS[s.weapon].magazineSize;
        }
      }
    }

    // Firing handling
    if (wantsFire && s.posture === 'peek' && s.fireCooldown === 0) {
      this.firePlayerWeapon();
    }

    // Spawn pending enemies
    this.updatePendingSpawns(worldDt);

    // Update enemies, boss attacks, and enemy projectiles
    this.updateEnemies(worldDt);
    this.updateEnemyShots(worldDt);

    // Check sector / wave progression
    if (s.hp <= 0) {
      s.phase = 'defeat';
      s.rank = computeOmegaRank({
        damageTaken: s.damageTaken,
        weakpointKills: s.weakpointKills,
        totalKills: s.kills,
        maxCombo: s.maxCombo,
        perfectEvades: s.perfectEvades,
        counterBreaks: s.counterBreaks,
        elapsedSeconds: s.elapsed,
      });
      this.emitAudio('defeat', 0);
      return;
    }

    this.checkWaveCompletion();
  }

  private decayVisualEffects(dt: number): void {
    const s = this.state;
    s.commsTimer = Math.max(0, s.commsTimer - dt);
    s.bossWarningTimer = Math.max(0, s.bossWarningTimer - dt);
    s.shake = Math.max(0, s.shake - dt * 0.08);
    s.flashAlpha = Math.max(0, s.flashAlpha - dt * 2.2);
    s.muzzleFlash = Math.max(0, s.muzzleFlash - dt * 8);
    s.playerHitFlash = Math.max(0, s.playerHitFlash - dt * 3.5);
    s.lightningFlash = Math.max(0, s.lightningFlash - dt * 2.4);
    s.lightningCooldown -= dt;
    if (s.lightningCooldown <= 0) {
      s.lightningFlash = 0.65;
      s.lightningCooldown = 6 + this.nextRandom() * 7;
    }
    s.tracers = s.tracers.filter(t => {
      t.life -= dt;
      return t.life > 0;
    });
    s.particles = s.particles.filter(p => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      return p.life > 0;
    });
    s.popups = s.popups.filter(pop => {
      pop.life -= dt;
      pop.y += pop.vy * dt;
      return pop.life > 0;
    });
    s.afterimages = s.afterimages.filter(a => {
      a.life -= dt;
      return a.life > 0;
    });
    s.shockwaves = s.shockwaves.filter(sw => {
      sw.life -= dt;
      const t = 1 - Math.max(0, sw.life / sw.maxLife);
      sw.radius = sw.maxRadius * (1 - Math.pow(1 - t, 2.2));
      return sw.life > 0;
    });
    s.phantomGhosts = s.phantomGhosts.filter(g => {
      g.life -= dt;
      return g.life > 0;
    });
    s.lastLightBloom.intensity = Math.max(0, s.lastLightBloom.intensity - dt * 2.6);
    for (const e of s.enemies) {
      e.hitFlash = Math.max(0, e.hitFlash - dt * 6);
    }
    for (const p of s.props) {
      p.hitFlash = Math.max(0, p.hitFlash - dt * 6);
    }
  }

  private firePlayerWeapon(): void {
    const s = this.state;
    const cfg = OMEGA_WEAPONS[s.weapon];
    const inOverdrive = s.overdriveTimer > 0;

    if (!inOverdrive) {
      if (s.mag[s.weapon] <= 0) {
        if (s.weapon !== 'rail') {
          this.triggerReload();
        }
        return;
      }
      s.mag[s.weapon] -= 1;
      if (s.mag[s.weapon] === 0 && s.weapon !== 'rail') {
        this.triggerReload();
      }
    }

    const overcharged = inOverdrive || s.overchargedShots > 0;
    if (!inOverdrive && s.overchargedShots > 0) {
      s.overchargedShots -= 1;
    }

    s.fireCooldown = inOverdrive ? Math.min(cfg.fireInterval, 0.11) : cfg.fireInterval;
    s.muzzleFlash = 1;
    s.shake = Math.max(s.shake, s.weapon === 'rail' ? 0.015 : s.weapon === 'scatter' ? 0.009 : 0.004);
    this.emitAudio(s.weapon, OMEGA_COVER_LANE_X[s.lane]);

    const muzzle = projectOmegaPoint(OMEGA_COVER_LANE_X[s.lane] + 0.018, 0.145, 0, this.sector.horizonY, s.camX, s.camY);
    this.setLightBloom(
      muzzle.x,
      muzzle.y,
      s.weapon === 'rail' ? '#5bf5ff' : overcharged ? '#ffd666' : '#ff52c2',
      s.weapon === 'rail' ? 0.95 : 0.55,
    );

    const pelletCount = cfg.pellets;
    for (let i = 0; i < pelletCount; i++) {
      const jitterX = pelletCount > 1 ? (this.nextRandom() - 0.5) * cfg.spread * 2 : (this.nextRandom() - 0.5) * cfg.spread;
      const jitterY = pelletCount > 1 ? (this.nextRandom() - 0.5) * cfg.spread * 1.4 : (this.nextRandom() - 0.5) * cfg.spread;
      const tx = Math.max(0.02, Math.min(0.98, s.aimX + jitterX));
      const ty = Math.max(0.04, Math.min(0.92, s.aimY + jitterY));

      const tracerColor = s.weapon === 'rail'
        ? '#5bf5ff'
        : overcharged
          ? '#ffd666'
          : '#ff52c2';
      s.tracers.push({
        x1: muzzle.x,
        y1: muzzle.y,
        x2: tx,
        y2: ty,
        color: tracerColor,
        width: s.weapon === 'rail' ? 5 : overcharged ? 2.8 : 2,
        life: s.weapon === 'rail' ? 0.18 : 0.09,
        maxLife: s.weapon === 'rail' ? 0.18 : 0.09,
      });
      if (s.tracers.length > 36) s.tracers.shift();

      let dmg = cfg.damage * (overcharged ? 1.35 : 1);
      if (s.weapon === 'rail' && this.hasUpgrade('rail_capacitor')) {
        dmg *= 1.25;
      }
      const pierce = cfg.pierceShield || inOverdrive;
      if (s.weapon === 'rail') {
        this.spawnShockwave(tx, ty, 0.095, '#5bf5ff', 0.34);
        this.setLightBloom(tx, ty, '#5bf5ff', 0.85);
      }
      this.resolveShotImpact(tx, ty, dmg, cfg.weakpointMultiplier, pierce, overcharged);
    }

    if (inOverdrive) {
      this.overdriveBoltCounter += 1;
      if (this.overdriveBoltCounter % 3 === 0 && s.enemies.length > 0) {
        const target = s.enemies[0]!;
        const proj = projectOmegaPoint(target.worldX, target.elevation, target.z, this.sector.horizonY, s.camX, s.camY);
        s.tracers.push({
          x1: muzzle.x,
          y1: muzzle.y,
          x2: proj.x,
          y2: proj.y - 0.03 * proj.scale,
          color: '#d87bff',
          width: 3.5,
          life: 0.14,
          maxLife: 0.14,
        });
        this.damageEnemy(target, 42, true, proj.x, proj.y);
      }
    }
  }

  private resolveShotImpact(
    aimX: number,
    aimY: number,
    baseDamage: number,
    weaponWeakMult: number,
    pierceShield: boolean,
    overcharged: boolean,
  ): void {
    const s = this.state;
    const horizonY = this.sector.horizonY;

    // 1. Interceptable incoming 3D rockets first!
    for (let i = s.enemyShots.length - 1; i >= 0; i--) {
      const shot = s.enemyShots[i]!;
      if (shot.kind !== 'rocket') continue;
      const sp = projectOmegaPoint(shot.worldX, shot.elevation, shot.z, horizonY, s.camX, s.camY);
      const radius = 0.048 * sp.scale;
      if (Math.hypot(aimX - sp.x, aimY - sp.y) <= radius) {
        shot.hp -= baseDamage;
        this.spawnParticles(sp.x, sp.y, '#ff9848', 6);
        if (shot.hp <= 0) {
          s.enemyShots.splice(i, 1);
          s.score += 120;
          this.bumpCombo();
          this.addOmegaGauge(8);
          this.spawnPopup(sp.x, sp.y - 0.02, 'INTERCEPT', '#59f3ff', 1.05);
          this.spawnParticles(sp.x, sp.y, '#ff64d2', 14, 0.32);
          this.emitAudio('intercept', shot.worldX);
        }
        return;
      }
    }

    // 2. Z-sorted interactive props and enemies (front-to-back, smallest z first for true 3D occlusion)
    type HitTarget =
      | { kind: 'prop'; z: number; prop: OmegaPropState }
      | { kind: 'enemy'; z: number; enemy: OmegaEnemyState };
    const hitTargets: HitTarget[] = [];
    for (const prop of s.props) {
      if (!prop.destroyed) hitTargets.push({ kind: 'prop', z: prop.z, prop });
    }
    for (const enemy of s.enemies) {
      hitTargets.push({ kind: 'enemy', z: enemy.z, enemy });
    }
    hitTargets.sort((a, b) => a.z - b.z);

    for (const target of hitTargets) {
      if (target.kind === 'prop') {
        const prop = target.prop;
        const pp = projectOmegaPoint(prop.worldX, 0.09, prop.z, horizonY, s.camX, s.camY);
        const hitR = 0.045 * pp.scale;
        if (Math.hypot(aimX - pp.x, aimY - pp.y) <= hitR) {
          prop.hp -= baseDamage;
          prop.hitFlash = 1;
          this.spawnParticles(pp.x, pp.y, '#ffd266', 5);
          if (prop.hp <= 0) {
            this.triggerPropExplosion(prop, pp.x, pp.y);
          }
          return;
        }
        continue;
      }

      const enemy = target.enemy;
      const ep = projectOmegaPoint(enemy.worldX, enemy.elevation, enemy.z, horizonY, s.camX, s.camY);
      const scale = ep.scale;

      // Check boss sub-parts first (shoulder pods or orbiting pylons)
      for (const part of enemy.parts) {
        if (part.broken) continue;
        const partScreenX = ep.x + part.offsetX * scale;
        const partScreenY = ep.y + part.offsetY * scale;
        if (Math.hypot(aimX - partScreenX, aimY - partScreenY) <= part.radius * scale) {
          part.hp -= baseDamage;
          enemy.hitFlash = 1;
          this.spawnParticles(partScreenX, partScreenY, '#ff9c54', 7);
          this.emitAudio('weakpoint', enemy.worldX);
          if (part.hp <= 0) {
            part.broken = true;
            part.hp = 0;
            enemy.stunTimer = Math.max(enemy.stunTimer, 1.4);
            this.grantRailCell(1);
            this.addOmegaGauge(16);
            s.score += 350;
            this.bumpCombo(2);
            this.spawnPopup(partScreenX, partScreenY - 0.03, 'PART BREAK', '#ffd859', 1.2);
            this.spawnParticles(partScreenX, partScreenY, '#ff59b8', 22, 0.35);
            this.spawnShockwave(partScreenX, partScreenY, 0.18, '#ffd859', 0.48);
            this.setLightBloom(partScreenX, partScreenY, '#ffd859', 1.0);
            this.emitAudio('explosion', enemy.worldX);
            // If all pylons broken on Omega Aeon, enter Phase 2
            if (enemy.kind === 'boss_aeon' && enemy.parts.every(p => p.broken)) {
              enemy.phase = 2;
              s.commsText = 'AIRA: 리액터 파일론 전부 파괴! 오메가 아이가 완전히 노출됐다!';
              s.commsTimer = 3.8;
            }
          } else {
            this.damageEnemy(enemy, Math.round(baseDamage * 0.45), false, partScreenX, partScreenY);
          }
          return;
        }
      }

      // Check weakpoint reticle
      const weakX = ep.x + enemy.weakOffsetX * scale;
      const weakY = ep.y + enemy.weakOffsetY * scale;
      const weakR = enemy.weakRadius * scale;
      const weakHit = Math.hypot(aimX - weakX, aimY - weakY) <= weakR;

      // Body hitbox center slightly elevated around torso
      const bodyY = ep.y - 0.025 * scale;
      const bodyR = enemy.hitRadius * scale;
      const bodyHit = Math.hypot(aimX - ep.x, aimY - bodyY) <= bodyR;

      if (!weakHit && !bodyHit) continue;

      // Breacher frontal riot shield check
      if (enemy.shielded && enemy.stunTimer === 0 && !weakHit && !pierceShield) {
        enemy.hitFlash = 0.5;
        this.spawnParticles(aimX, aimY, '#75d8ff', 6, 0.22);
        this.spawnPopup(ep.x, ep.y - 0.07 * scale, 'RICOCHET', '#8ae7ff', 0.9);
        this.emitAudio('ricochet', enemy.worldX);
        return;
      }

      // Counter-break check against active Sniper or Phantom lock
      if (enemy.lockTargetLane !== null && enemy.lockProgress > 0.15) {
        enemy.lockTargetLane = null;
        enemy.lockProgress = 0;
        enemy.stunTimer = Math.max(enemy.stunTimer, 2.2);
        enemy.attackCooldown = 2.6;
        s.counterBreaks += 1;
        this.addOmegaGauge(12 + (this.hasUpgrade('omega_siphon') ? 4 : 0));
        if (this.hasUpgrade('omega_siphon')) {
          s.shield = Math.min(s.maxShield, s.shield + 8);
        }
        s.score += 220;
        this.bumpCombo();
        this.spawnPopup(ep.x, ep.y - 0.08 * scale, 'COUNTER BREAK', '#5ef9ff', 1.15);
        this.emitAudio('counter_break', enemy.worldX);
      }

      const weakMult = weaponWeakMult + (this.hasUpgrade('weakpoint_optics') ? 0.45 : 0);
      let finalDamage = weakHit ? baseDamage * weakMult : baseDamage;

      // Boss armor modifiers
      if (enemy.kind === 'boss_gatekeeper') {
        const intactPods = enemy.parts.filter(p => !p.broken).length;
        if (intactPods === 2) finalDamage *= 0.38;
        else if (intactPods === 1) finalDamage *= 0.72;
        else finalDamage *= 1.35;
      } else if (enemy.kind === 'boss_aeon') {
        const intactPylons = enemy.parts.filter(p => !p.broken).length;
        if (intactPylons > 0) finalDamage *= 0.28;
        else if (weakHit) finalDamage *= 1.3;
      }

      this.damageEnemy(enemy, Math.round(finalDamage), weakHit, aimX, aimY);

      if ((weakHit || overcharged) && this.hasUpgrade('chain_rounds')) {
        this.applyChainArc(enemy, Math.round(finalDamage * 0.38));
      }
      return;
    }

    // Missed everything — wall/floor spark
    this.spawnParticles(aimX, aimY, '#c9b4ff', 3, 0.16);
  }

  private applyChainArc(sourceEnemy: OmegaEnemyState, arcDamage: number): void {
    const horizonY = this.sector.horizonY;
    const sp = projectOmegaPoint(sourceEnemy.worldX, sourceEnemy.elevation, sourceEnemy.z, horizonY, this.state.camX, this.state.camY);
    for (const other of this.state.enemies) {
      if (other.id === sourceEnemy.id || other.hp <= 0) continue;
      if (Math.hypot(other.worldX - sourceEnemy.worldX, other.z - sourceEnemy.z) <= 0.42) {
        const op = projectOmegaPoint(other.worldX, other.elevation, other.z, horizonY, this.state.camX, this.state.camY);
        this.state.tracers.push({
          x1: sp.x,
          y1: sp.y - 0.02,
          x2: op.x,
          y2: op.y - 0.02,
          color: '#6df5ff',
          width: 2.4,
          life: 0.14,
          maxLife: 0.14,
        });
        this.damageEnemy(other, arcDamage, false, op.x, op.y);
        break;
      }
    }
  }

  private damageEnemy(
    enemy: OmegaEnemyState,
    amount: number,
    isWeakpoint: boolean,
    fxX: number,
    fxY: number,
  ): void {
    if (enemy.hp <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - amount);
    enemy.hitFlash = 1;

    if (isWeakpoint) {
      this.spawnParticles(fxX, fxY, '#ff4ec6', 10, 0.28);
      this.spawnPopup(fxX, fxY - 0.02, `CRIT ${amount}`, '#ff69d4', 1.05);
      this.emitAudio('weakpoint', enemy.worldX);
      this.addOmegaGauge(4);
    } else {
      this.spawnParticles(fxX, fxY, '#ffd891', 5, 0.2);
      this.emitAudio('hit', enemy.worldX);
      this.addOmegaGauge(2);
    }

    if (enemy.hp <= 0) {
      this.handleEnemyKilled(enemy, isWeakpoint, fxX, fxY);
    }
  }

  private handleEnemyKilled(enemy: OmegaEnemyState, isWeakpoint: boolean, fxX: number, fxY: number): void {
    const s = this.state;
    const idx = s.enemies.indexOf(enemy);
    if (idx !== -1) s.enemies.splice(idx, 1);

    s.kills += 1;
    if (isWeakpoint) {
      s.weakpointKills += 1;
      if (this.hasUpgrade('weakpoint_optics')) {
        this.addOmegaGauge(6);
      }
    }
    if (this.hasUpgrade('omega_siphon')) {
      s.shield = Math.min(s.maxShield, s.shield + 8);
    }

    const baseScore = enemy.isBoss ? 2500 : enemy.kind === 'breacher' || enemy.kind === 'turret' ? 240 : 150;
    const mult = 1 + Math.min(2.5, s.combo * 0.1);
    s.score += Math.round(baseScore * mult);
    this.bumpCombo();
    this.addOmegaGauge(enemy.isBoss ? 30 : isWeakpoint ? 12 : 8);

    this.spawnParticles(fxX, fxY, enemy.isBoss ? '#ff59ce' : '#ff9a4e', enemy.isBoss ? 38 : 16, enemy.isBoss ? 0.42 : 0.3);
    if (enemy.isBoss) {
      s.hitstopTimer = 0.065;
      s.shake = Math.max(s.shake, 0.03);
      s.flashAlpha = 0.45;
      this.spawnShockwave(fxX, fxY, 0.36, '#ff63d2', 0.6);
      this.setLightBloom(fxX, fxY, '#ff63d2', 1.2);
      this.emitAudio('explosion', enemy.worldX);
      this.spawnPopup(fxX, fxY - 0.05, 'TARGET TERMINATED', '#ffe26a', 1.45);
    }
  }

  private triggerPropExplosion(prop: OmegaPropState, px: number, py: number): void {
    const s = this.state;
    prop.destroyed = true;
    prop.hp = 0;

    if (prop.kind === 'supply') {
      s.hp = Math.min(s.maxHp, s.hp + 25);
      for (const b of s.barriers) {
        b.breached = false;
        b.repairTimer = 0;
        b.hp = Math.min(b.maxHp, b.hp + 45);
      }
      this.grantRailCell(1);
      this.spawnPopup(px, py - 0.03, 'SUPPLY +25 HP', '#62ffaf', 1.15);
      this.spawnParticles(px, py, '#62ffaf', 16, 0.28);
      this.emitAudio('supply', prop.worldX);
      return;
    }

    const isEmp = prop.kind === 'emp';
    const radius = isEmp ? 0.56 : 0.42;
    const damage = isEmp ? 65 : 165;
    s.shake = Math.max(s.shake, isEmp ? 0.016 : 0.025);
    this.spawnParticles(px, py, isEmp ? '#52efff' : '#ff8938', 26, 0.38);
    this.spawnShockwave(px, py, isEmp ? 0.28 : 0.22, isEmp ? '#5ef5ff' : '#ff9c42', 0.45);
    this.setLightBloom(px, py, isEmp ? '#5ef5ff' : '#ff9c42', 1.05);
    this.spawnPopup(px, py - 0.04, isEmp ? 'EMP SHOCKWAVE' : 'BLAST!', isEmp ? '#5df3ff' : '#ffab4c', 1.25);
    this.emitAudio(isEmp ? 'emp' : 'explosion', prop.worldX);

    for (const enemy of [...s.enemies]) {
      const dist = Math.hypot(enemy.worldX - prop.worldX, enemy.z - prop.z);
      if (dist <= radius) {
        const ep = projectOmegaPoint(enemy.worldX, enemy.elevation, enemy.z, this.sector.horizonY, s.camX, s.camY);
        if (isEmp) {
          enemy.stunTimer = Math.max(enemy.stunTimer, 3.0);
          enemy.lockTargetLane = null;
          enemy.lockProgress = 0;
        }
        this.damageEnemy(enemy, damage, false, ep.x, ep.y);
      }
    }
  }

  private updatePendingSpawns(dt: number): void {
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const sp = this.pendingSpawns[i]!;
      sp.timer -= dt;
      if (sp.timer <= 0) {
        this.pendingSpawns.splice(i, 1);
        this.spawnEnemy(sp);
      }
    }
  }

  private updateEnemies(dt: number): void {
    const s = this.state;
    for (const e of s.enemies) {
      e.age += dt;
      if (e.stunTimer > 0) {
        e.stunTimer = Math.max(0, e.stunTimer - dt);
        continue;
      }

      // Archetype movement + attack logic
      switch (e.kind) {
        case 'trooper':
          e.worldX = e.baseWorldX + Math.sin(e.age * 1.4 + e.id) * 0.09;
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            this.fireEnemyShot(e, 'bullet', 14, 0.92);
            e.attackCooldown = 1.65 + this.nextRandom() * 0.85;
          }
          break;

        case 'drone':
          e.worldX = e.baseWorldX + Math.sin(e.age * 2.2 + e.id) * 0.16;
          e.elevation = e.baseElevation + Math.sin(e.age * 3.1) * 0.05;
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            this.fireEnemyShot(e, 'plasma', 12, 0.85);
            e.attackCooldown = 1.55 + this.nextRandom() * 0.7;
          }
          break;

        case 'breacher':
          e.z = Math.max(0.24, e.z - 0.032 * dt);
          e.worldX = e.baseWorldX + Math.sin(e.age * 0.9) * 0.05;
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            this.fireEnemyShot(e, 'bullet', 18, 0.78);
            e.attackCooldown = 1.7 + this.nextRandom() * 0.6;
          }
          break;

        case 'sniper':
          this.updateLaserLockEnemy(e, dt, 26, 2.2);
          break;

        case 'turret':
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            this.fireEnemyShot(e, 'rocket', 24, 1.95);
            e.attackCooldown = 2.6 + this.nextRandom() * 0.8;
          }
          break;

        case 'boss_gatekeeper':
          e.worldX = Math.sin(e.age * 0.65) * 0.14;
          e.attackCooldown -= dt;
          if (e.attackCooldown <= 0) {
            const intactPods = e.parts.filter(p => !p.broken).length;
            if (intactPods > 0 && this.nextRandom() < 0.55) {
              this.fireEnemyShot(e, 'rocket', 26, 1.9);
            } else {
              this.fireEnemyShot(e, 'bullet', 18, 0.85);
            }
            e.attackCooldown = intactPods === 0 ? 1.05 : 1.35;
          }
          break;

        case 'boss_widow':
          e.worldX = Math.sin(e.age * 0.95) * 0.34;
          e.elevation = 0.28 + Math.cos(e.age * 1.4) * 0.04;
          this.updateWidowBoss(e, dt);
          break;

        case 'boss_phantom':
          this.updatePhantomBoss(e, dt);
          break;

        case 'boss_aeon':
          this.updateAeonBoss(e, dt);
          break;
      }
    }
  }

  private updateLaserLockEnemy(e: OmegaEnemyState, dt: number, damage: number, resetCooldown: number): void {
    const s = this.state;
    if (e.lockTargetLane === null) {
      e.attackCooldown -= dt;
      if (e.attackCooldown <= 0) {
        e.lockTargetLane = s.lane;
        e.lockProgress = 0;
        this.emitAudio('sniper_lock', e.worldX);
      }
      return;
    }

    e.lockProgress += dt / e.lockDuration;
    if (e.lockProgress >= 1) {
      const targetLane = e.lockTargetLane;
      e.lockTargetLane = null;
      e.lockProgress = 0;
      e.attackCooldown = resetCooldown;
      this.emitAudio('sniper_fire', e.worldX);
      const ep = projectOmegaPoint(e.worldX, e.elevation + 0.04, e.z, this.sector.horizonY, s.camX, s.camY);
      const lp = projectOmegaPoint(OMEGA_COVER_LANE_X[targetLane], 0.14, 0, this.sector.horizonY, s.camX, s.camY);
      s.tracers.push({
        x1: ep.x,
        y1: ep.y,
        x2: lp.x,
        y2: lp.y,
        color: '#ff3466',
        width: 4,
        life: 0.22,
        maxLife: 0.22,
      });
      this.resolveDamageAtLane(targetLane, damage, true);
    }
  }

  private updateWidowBoss(e: OmegaEnemyState, dt: number): void {
    const s = this.state;
    if (e.beamLanes.length > 0) {
      e.beamProgress += dt / e.beamDuration;
      if (e.beamProgress >= 1) {
        for (const lane of e.beamLanes) {
          this.resolveDamageAtLane(lane, 26, false);
          const lp = projectOmegaPoint(OMEGA_COVER_LANE_X[lane], 0.12, 0, this.sector.horizonY, s.camX, s.camY);
          const ep = projectOmegaPoint(e.worldX, e.elevation, e.z, this.sector.horizonY, s.camX, s.camY);
          s.tracers.push({
            x1: ep.x,
            y1: ep.y,
            x2: lp.x,
            y2: lp.y,
            color: '#4bf5ff',
            width: 6,
            life: 0.25,
            maxLife: 0.25,
          });
        }
        s.shake = Math.max(s.shake, 0.014);
        this.emitAudio('explosion', e.worldX);
        e.beamLanes = [];
        e.beamProgress = 0;
        e.attackCooldown = 1.4;
      }
      return;
    }

    e.attackCooldown -= dt;
    if (e.attackCooldown <= 0) {
      if (this.nextRandom() < 0.6) {
        const safeLane = Math.floor(this.nextRandom() * 3) as OmegaCoverLane;
        e.beamLanes = ([0, 1, 2] as const).filter(l => l !== safeLane);
        e.beamProgress = 0;
        e.beamDuration = 1.4;
        this.emitAudio('sniper_lock', e.worldX);
      } else {
        this.fireEnemyShot(e, 'plasma', 16, 0.85);
        e.attackCooldown = 1.1;
      }
    }
  }

  private updatePhantomBoss(e: OmegaEnemyState, dt: number): void {
    e.jumpCooldown -= dt;
    if (e.jumpCooldown <= 0 && e.lockTargetLane === null) {
      this.state.phantomGhosts.push({
        worldX: e.worldX,
        z: e.z,
        elevation: e.elevation,
        life: 0.45,
        maxLife: 0.45,
      });
      if (this.state.phantomGhosts.length > 6) this.state.phantomGhosts.shift();
      const positions = [-0.34, 0, 0.34];
      const pick = positions[Math.floor(this.nextRandom() * positions.length)] ?? 0;
      e.worldX = pick;
      e.z = 0.45 + this.nextRandom() * 0.32;
      e.jumpCooldown = 2.6;
    }
    this.updateLaserLockEnemy(e, dt, 24, 1.15);
  }

  private updateAeonBoss(e: OmegaEnemyState, dt: number): void {
    const s = this.state;
    if (e.hp <= e.maxHp * 0.55 && e.phase === 1) {
      e.phase = 2;
      for (const p of e.parts) {
        p.broken = true;
        p.hp = 0;
      }
      s.commsText = 'AIRA: 오메가 이온 2페이즈 돌입! 스위핑 코어 빔을 피하면서 중앙 코어를 파괴해!';
      s.commsTimer = 4.2;
    }

    // Orbit remaining shield pylons
    e.parts.forEach((p, idx) => {
      if (p.broken) return;
      const angle = (p.orbitAngle ?? (idx * Math.PI * 2) / 3) + e.age * 1.45;
      p.orbitAngle = angle;
      (p as { offsetX: number }).offsetX = Math.cos(angle) * 0.14;
      (p as { offsetY: number }).offsetY = Math.sin(angle) * 0.08;
    });

    if (e.beamLanes.length > 0) {
      e.beamProgress += dt / e.beamDuration;
      if (e.beamProgress >= 1) {
        for (const lane of e.beamLanes) {
          this.resolveDamageAtLane(lane, 30, false);
          const lp = projectOmegaPoint(OMEGA_COVER_LANE_X[lane], 0.12, 0, this.sector.horizonY, s.camX, s.camY);
          const ep = projectOmegaPoint(e.worldX, e.elevation, e.z, this.sector.horizonY, s.camX, s.camY);
          s.tracers.push({
            x1: ep.x,
            y1: ep.y,
            x2: lp.x,
            y2: lp.y,
            color: '#ff42c8',
            width: 8,
            life: 0.28,
            maxLife: 0.28,
          });
        }
        s.shake = Math.max(s.shake, 0.02);
        this.emitAudio('explosion', 0);
        e.beamLanes = [];
        e.beamProgress = 0;
        e.attackCooldown = e.phase === 2 ? 1.1 : 1.45;
      }
      return;
    }

    e.attackCooldown -= dt;
    if (e.attackCooldown <= 0) {
      const roll = this.nextRandom();
      if (roll < (e.phase === 2 ? 0.55 : 0.35)) {
        const safeLane = Math.floor(this.nextRandom() * 3) as OmegaCoverLane;
        e.beamLanes = ([0, 1, 2] as const).filter(l => l !== safeLane);
        e.beamProgress = 0;
        e.beamDuration = e.phase === 2 ? 1.35 : 1.55;
        this.emitAudio('sniper_lock', 0);
      } else if (roll < 0.78) {
        this.fireEnemyShot(e, 'rocket', 25, 1.85);
        e.attackCooldown = e.phase === 2 ? 1.25 : 1.6;
      } else {
        this.fireEnemyShot(e, 'plasma', 16, 0.85);
        e.attackCooldown = e.phase === 2 ? 0.95 : 1.3;
      }
    }
  }

  private fireEnemyShot(
    e: OmegaEnemyState,
    kind: OmegaEnemyShot['kind'],
    damage: number,
    duration: number,
  ): void {
    const s = this.state;
    const targetLane = s.lane;
    s.enemyShots.push({
      id: this.nextEntityId++,
      kind,
      startX: e.worldX,
      startElevation: e.elevation + 0.05,
      startZ: e.z,
      worldX: e.worldX,
      elevation: e.elevation + 0.05,
      z: e.z,
      targetLane,
      damage,
      duration,
      elapsed: 0,
      hp: kind === 'rocket' ? 24 : 999,
      maxHp: kind === 'rocket' ? 24 : 999,
    });
    if (kind === 'rocket') {
      this.emitAudio('rocket_launch', e.worldX);
    }
  }

  private updateEnemyShots(dt: number): void {
    const s = this.state;
    for (let i = s.enemyShots.length - 1; i >= 0; i--) {
      const shot = s.enemyShots[i]!;
      shot.elapsed += dt;
      const t = Math.min(1, shot.elapsed / shot.duration);
      const targetX = OMEGA_COVER_LANE_X[shot.targetLane];
      shot.worldX = shot.startX + (targetX - shot.startX) * t;
      shot.z = shot.startZ * (1 - t);
      const arc = shot.kind === 'rocket' ? Math.sin(t * Math.PI) * 0.22 : 0;
      shot.elevation = shot.startElevation * (1 - t) + 0.12 * t + arc;

      if (t >= 1) {
        s.enemyShots.splice(i, 1);
        this.resolveDamageAtLane(shot.targetLane, shot.damage, shot.kind !== 'rocket');
      }
    }
  }

  private resolveDamageAtLane(targetLane: OmegaCoverLane, damage: number, blockableByCover: boolean): void {
    const s = this.state;
    const barrier = s.barriers[targetLane];

    // If attacking a lane where player isn't standing, only damage that lane's barrier slightly
    if (targetLane !== s.lane) {
      if (barrier && !barrier.breached) {
        barrier.hp = Math.max(0, barrier.hp - Math.round(damage * 0.65));
        barrier.hitFlash = 1;
        if (barrier.hp === 0) {
          barrier.breached = true;
          barrier.repairTimer = 7.0;
          this.emitAudio('barrier_break', barrier.worldX);
        }
      }
      return;
    }

    // Dashing i-frames or Omega Overdrive shield aura
    if (s.invulnTimer > 0) return;

    if (s.posture === 'cover' && blockableByCover && barrier && !barrier.breached) {
      barrier.hp = Math.max(0, barrier.hp - damage);
      barrier.hitFlash = 1;
      const bp = projectOmegaPoint(barrier.worldX, 0.08, 0, this.sector.horizonY, s.camX, s.camY);
      this.spawnParticles(bp.x, bp.y, '#ffd278', 8, 0.24);
      if (barrier.hp === 0) {
        barrier.breached = true;
        barrier.repairTimer = 7.0;
        this.spawnPopup(bp.x, bp.y - 0.06, 'BARRIER BREACH', '#ff647c', 1.15);
        this.emitAudio('barrier_break', barrier.worldX);
      } else {
        this.emitAudio('barrier_hit', barrier.worldX);
      }
      return;
    }

    // Player hit directly!
    if (s.overdriveTimer > 0) {
      // Overdrive absorbs most damage on barrier aura
      return;
    }

    s.shieldRegenDelay = 2.4;
    s.damageTaken += damage;
    s.combo = 0;
    s.playerHitFlash = 1;
    s.shake = Math.max(s.shake, 0.018);
    this.emitAudio('player_hit', OMEGA_COVER_LANE_X[s.lane]);

    if (s.shield > 0) {
      const absorbed = Math.min(s.shield, damage);
      s.shield -= absorbed;
      const rem = damage - absorbed;
      if (rem > 0) s.hp = Math.max(0, s.hp - rem);
    } else {
      s.hp = Math.max(0, s.hp - damage);
    }
  }

  private checkWaveCompletion(): void {
    const s = this.state;
    if (this.pendingSpawns.length > 0 || s.enemies.length > 0) return;

    const sec = this.sector;
    if (s.waveIndex + 1 < sec.waves.length) {
      this.beginWave(s.waveIndex + 1);
      return;
    }

    // Sector cleared!
    if (!s.clearedSectors.includes(sec.index)) {
      s.clearedSectors.push(sec.index);
    }
    s.enemyShots = [];
    s.commsText = sec.comms.clear;
    s.commsTimer = 4.2;
    this.emitAudio('sector_clear', 0);

    if (s.singleSectorMode || s.sectorIndex >= OMEGA_SECTORS.length - 1) {
      s.phase = 'victory';
      s.rank = computeOmegaRank({
        damageTaken: s.damageTaken,
        weakpointKills: s.weakpointKills,
        totalKills: s.kills,
        maxCombo: s.maxCombo,
        perfectEvades: s.perfectEvades,
        counterBreaks: s.counterBreaks,
        elapsedSeconds: s.elapsed,
      });
      this.emitAudio('victory', 0);
      return;
    }

    // Offer 3 field upgrade cards between connected sectors
    const pool = OMEGA_UPGRADES.filter(u => !s.upgrades.includes(u.id));
    const shuffled = [...pool].sort(() => this.nextRandom() - 0.5);
    s.upgradeChoices = shuffled.slice(0, 3);
    s.phase = 'upgrade';
  }
}
