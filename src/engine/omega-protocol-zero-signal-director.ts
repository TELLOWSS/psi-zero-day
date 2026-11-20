import type { Hazard } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { OmegaBladeComboStep } from '../domain/omega-protocol-blade';
import {
 OMEGA_FIELD_INTERACT_RADIUS,
 omegaFieldCurrentStep,
 omegaFieldScreenMoveToWorld,
 type OmegaFieldObstacle,
 type OmegaFieldPoint,
} from '../domain/omega-protocol-field';
import {
 OMEGA_STRIKERS,
 omegaActiveEvolutions,
 omegaComputeFinalScore,
 omegaLoadoutSpec,
 omegaStrikerSpec,
 omegaStyleRankForPoints,
 type OmegaEvolutionId,
 type OmegaLoadoutId,
 type OmegaStrikerId,
 type OmegaStyleTier,
} from '../domain/omega-protocol-zero-signal';
import type { OmegaBladeStrike, OmegaProtocolCombatSession } from './omega-protocol-combat';

export type OmegaWeaponMode = 'rapid' | 'focus';

export interface OmegaActiveCasing {
 x: number;
 y: number;
 vx: number;
 vy: number;
 z: number;
 vz: number;
 readonly colorHex: string;
 age: number;
 readonly duration: number;
}

export type OmegaDirectorEventKind =
 | 'gunshot'
 | 'hit_impact'
 | 'detonation'
 | 'phantom_dodge'
 | 'striker'
 | 'rank_up'
 | 'moonwave'
 | 'chain_lightning'
 | 'pickup'
 | 'shield_break'
 | 'shield_absorb'
 | 'player_hurt'
 | 'evo_unlock'
 | 'boss_entry'
 | 'wave_clear'
 | 'victory'
 | 'defeat'
 | 'auto_interact'
 | 'rail_burst'
 | 'weapon_mode'
 | 'weave_bonus'
 | 'enemy_kill';

export interface OmegaDirectorEvent {
 readonly kind: OmegaDirectorEventKind;
 readonly detail?: string;
 readonly numeric?: number;
}

export interface OmegaActiveDetonation {
 readonly x: number;
 readonly y: number;
 readonly radius: number;
 readonly stacks: number;
 readonly age: number;
 readonly duration: number;
}

export interface OmegaActiveWave {
 readonly id: number;
 x: number;
 y: number;
 readonly vx: number;
 readonly vy: number;
 readonly angle: number;
 readonly range: number;
 readonly radius: number;
 readonly damage: number;
 readonly crimson: boolean;
 age: number;
 readonly duration: number;
 readonly hitIds: Set<string>;
}

export interface OmegaActiveTurret {
 readonly x: number;
 readonly y: number;
 remaining: number;
 readonly duration: number;
 fireTimer: number;
 aimAngle: number;
}

export interface OmegaActiveDrone {
 x: number;
 y: number;
 vx: number;
 vy: number;
 remaining: number;
}

export interface OmegaActiveLightning {
 readonly x1: number;
 readonly y1: number;
 readonly x2: number;
 readonly y2: number;
 readonly seed: number;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveBeam {
 readonly x1: number;
 readonly y1: number;
 readonly x2: number;
 readonly y2: number;
 readonly colorRgb: string;
 readonly isPillar: boolean;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveOrb {
 x: number;
 y: number;
 readonly charge: number;
 readonly points: number;
 age: number;
}

export interface OmegaActiveDome {
 readonly x: number;
 readonly y: number;
 remaining: number;
 readonly duration: number;
 readonly radius: number;
}

export interface OmegaFloatingCallout {
 readonly x: number;
 readonly y: number;
 readonly text: string;
 readonly colorHex: string;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveSlashCut {
 readonly x: number;
 readonly y: number;
 readonly angle: number;
 readonly colorRgb: string;
 readonly crit: boolean;
 age: number;
 readonly duration: number;
}

export interface OmegaFloatingDamageNumber {
 x: number;
 y: number;
 vx: number;
 readonly text: string;
 readonly colorHex: string;
 readonly scale: number;
 readonly crit: boolean;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveKillBurst {
 readonly x: number;
 readonly y: number;
 readonly boss: boolean;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveSpark {
 x: number;
 y: number;
 vx: number;
 vy: number;
 z: number;
 vz: number;
 readonly colorRgb: string;
 readonly size: number;
 age: number;
 readonly duration: number;
}

export interface OmegaActiveScorch {
 readonly x: number;
 readonly y: number;
 readonly radius: number;
 readonly colorRgb: string;
 age: number;
 readonly duration: number;
}

export interface OmegaZeroSignalHudSnapshot {
 readonly loadoutId: OmegaLoadoutId;
 readonly dailyMode: boolean;
 readonly stylePoints: number;
 readonly styleRank: OmegaStyleTier;
 readonly styleTitle: string;
 readonly styleColorHex: string;
 readonly styleBonusSummary: string;
 readonly styleProgress: number;
 readonly peakRank: OmegaStyleTier;
 readonly comboCount: number;
 readonly maxCombo: number;
 readonly shield: number;
 readonly maxShield: number;
 readonly strikerCharge: number;
 readonly unlockedStrikers: readonly OmegaStrikerId[];
 readonly strikerCooldowns: Readonly<Record<OmegaStrikerId, number>>;
 readonly overclockRemaining: number;
 readonly slowMoRemaining: number;
 readonly activeEvos: readonly OmegaEvolutionId[];
 readonly detonations: number;
 readonly phantomDodges: number;
 readonly strikersCalled: number;
 readonly strikersCalledById: Readonly<Partial<Record<OmegaStrikerId, number>>>;
 readonly kills: number;
 readonly score: number;
 readonly finalGrade: OmegaStyleTier;
 readonly radioBanner: { readonly text: string; readonly accentHex: string; readonly seriesTag: string } | null;
 readonly activeCalloutsCount: number;
 readonly weaponMode: OmegaWeaponMode;
 readonly railCharge: number;
 readonly railChargesReady: number;
 readonly detonateReadyCount: number;
 readonly nextBladeCombo: OmegaBladeComboStep;
 readonly weaveActiveRemaining: number;
 readonly lockedTargetId: string | null;
 readonly railBurstsFired: number;
}

const RANK_ORDER: readonly OmegaStyleTier[] = ['D', 'C', 'B', 'A', 'S', 'SS', 'OMEGA'];

export function clipRayAgainstObstacles(
 origin: OmegaFieldPoint,
 dirX: number,
 dirY: number,
 maxLength: number,
 obstacles: readonly OmegaFieldObstacle[],
 radius = 4,
): number {
 let visible = maxLength;
 if (!(visible > 0)) return 0;
 for (const o of obstacles) {
  const r = Math.max(0, radius);
  const bounds = [
   { p: origin.x, v: dirX, min: o.x - r, max: o.x + o.width + r },
   { p: origin.y, v: dirY, min: o.y - r, max: o.y + o.height + r },
  ];
  let enter = 0;
  let exit = visible;
  let intersects = true;
  for (const b of bounds) {
   if (Math.abs(b.v) < 1e-9) {
    if (b.p < b.min || b.p > b.max) {
     intersects = false;
     break;
    }
    continue;
   }
   const t0 = (b.min - b.p) / b.v;
   const t1 = (b.max - b.p) / b.v;
   enter = Math.max(enter, Math.min(t0, t1));
   exit = Math.min(exit, Math.max(t0, t1));
   if (exit < enter) {
    intersects = false;
    break;
   }
  }
  if (intersects && enter <= exit) {
   visible = Math.min(visible, Math.max(0, enter - 2));
  }
 }
 return visible;
}

export class OmegaZeroSignalDirector {
 readonly loadoutId: OmegaLoadoutId;
 readonly dailyMode: boolean;

 private loadoutApplied = false;
 private stylePoints = 0;
 private peakPoints = 0;
 private currentRank: OmegaStyleTier = 'D';
 private peakRank: OmegaStyleTier = 'D';
 private comboCount = 0;
 private maxCombo = 0;
 private comboTimer = 0;

 private shield: number;
 private maxShield: number;
 private strikerCharge = 55;
 private readonly unlockedStrikers = new Set<OmegaStrikerId>();
 private readonly strikerCooldowns: Record<OmegaStrikerId, number> = {
  m01_snipe: 0,
  guard_sentry: 0,
  breaker_emp: 0,
  site_aegis: 0,
 };

 private overclockRemaining = 0;
 private slowMoRemaining = 0;
 private phantomGuardCooldown = 0;
 private weaponMode: OmegaWeaponMode = 'rapid';
 private railCharge = 60;
 private railBurstsFired = 0;
 private weaveActiveRemaining = 0;
 private lockedTargetId: string | null = null;
 private casingSeed = 1;

 private kills = 0;
 private detonationsCount = 0;
 private phantomDodgesCount = 0;
 private strikersCalledTotal = 0;
 private readonly strikersCalledById: Partial<Record<OmegaStrikerId, number>> = {};

 private radioBanner: { text: string; accentHex: string; seriesTag: string; remaining: number } | null = null;
 private prevWave = 1;
 private prevBossAlive = false;
 private prevHazardsLeft = true;
 private prevTerminalEmitted: 'victory' | 'defeat' | null = null;
 private lastImpactAudioTime = -1;
 private readonly knownEvos = new Set<OmegaEvolutionId>();
 private readonly marks = new Map<string, number>();
 private prevAliveById = new Map<string, { x: number; y: number; boss: boolean }>();

 private hitstopRemaining = 0;
 private impactFlash = 0;
 private shieldFlash = 0;
 private hpDamageFlash = 0;
 shakeDirX = 0;
 shakeDirY = 0;
 cameraShake = 0;
 zoomPunch = 0;
 cameraRoll = 0;

 readonly detonations: OmegaActiveDetonation[] = [];
 readonly waves: OmegaActiveWave[] = [];
 readonly turrets: OmegaActiveTurret[] = [];
 readonly drones: OmegaActiveDrone[] = [];
 readonly lightnings: OmegaActiveLightning[] = [];
 readonly beams: OmegaActiveBeam[] = [];
 readonly orbs: OmegaActiveOrb[] = [];
 readonly domes: OmegaActiveDome[] = [];
 readonly callouts: OmegaFloatingCallout[] = [];
 readonly casings: OmegaActiveCasing[] = [];
 readonly slashCuts: OmegaActiveSlashCut[] = [];
 readonly damageNumbers: OmegaFloatingDamageNumber[] = [];
 readonly killBursts: OmegaActiveKillBurst[] = [];
 readonly sparks: OmegaActiveSpark[] = [];
 readonly scorches: OmegaActiveScorch[] = [];

 private waveIdSeq = 1;
 private pendingEvents: OmegaDirectorEvent[] = [];

 constructor(loadoutId: OmegaLoadoutId = 'valkyrie', dailyMode = false) {
  this.loadoutId = loadoutId;
  this.dailyMode = dailyMode;
  const spec = omegaLoadoutSpec(loadoutId);
  this.maxShield = spec.baseShield;
  this.shield = spec.baseShield;
  this.unlockedStrikers.add(spec.starterStriker);
 }

 markCount(hazardId: string): number {
  return this.marks.get(hazardId) ?? 0;
 }

 getWeaponMode(): OmegaWeaponMode {
  return this.weaponMode;
 }

 markedHazardIds(): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const [id, count] of this.marks.entries()) {
   if (count > 0) ids.add(id);
  }
  return ids;
 }

 private spawnCasing(x: number, y: number, angle: number, colorHex: string): void {
  const s = this.casingSeed++;
  const ejectAng = angle - Math.PI * 0.55 + Math.sin(s * 2.13) * 0.35;
  const spd = 72 + (s % 4) * 14;
  this.casings.push({
   x,
   y,
   vx: Math.cos(ejectAng) * spd,
   vy: Math.sin(ejectAng) * spd * 0.72,
   z: 22,
   vz: 85 + (s % 3) * 18,
   colorHex,
   age: 0,
   duration: 0.42,
  });
  if (this.casings.length > 18) this.casings.shift();
 }

 private spawnSparkBurst(
  x: number,
  y: number,
  count: number,
  baseAngle: number,
  spreadRad: number,
  colorRgb: string,
  speedScale = 1,
 ): void {
  const total = Math.max(1, Math.round(count));
  for (let i = 0; i < total; i++) {
   const s = this.casingSeed++;
   const frac = Math.sin(s * 19.37 + i * 7.13) * 43758.5453;
   const r1 = frac - Math.floor(frac);
   const frac2 = Math.cos(s * 11.73 + i * 3.91) * 28411.17;
   const r2 = frac2 - Math.floor(frac2);
   const ang = baseAngle + (r1 - 0.5) * spreadRad;
   const spd = (150 + r2 * 220) * speedScale;
   this.sparks.push({
    x,
    y,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd * 0.72,
    z: 18 + (s % 5) * 3.5,
    vz: 95 + r2 * 135,
    colorRgb,
    size: 1.4 + (s % 3) * 0.45,
    age: 0,
    duration: 0.24 + r1 * 0.14,
   });
  }
  while (this.sparks.length > 40) this.sparks.shift();
 }

 private spawnScorch(x: number, y: number, radius: number, colorRgb: string, duration = 3.4): void {
  this.scorches.push({
   x,
   y,
   radius: Math.max(24, radius),
   colorRgb,
   age: 0,
   duration,
  });
  if (this.scorches.length > 14) this.scorches.shift();
 }

 private addCameraRoll(radians: number): void {
  const sign = this.shakeDirX >= 0 ? 1 : -1;
  const next = this.cameraRoll + Math.abs(radians) * sign;
  this.cameraRoll = next < -0.014 ? -0.014 : next > 0.014 ? 0.014 : next;
 }

 toggleWeaponMode(session?: OmegaProtocolCombatSession): OmegaWeaponMode {
  this.weaponMode = this.weaponMode === 'rapid' ? 'focus' : 'rapid';
  if (session) {
   const p = session.engine.state.player;
   this.pushCallout(
    p.x,
    p.y - 68,
    this.weaponMode === 'focus' ? '🎯 집중 관통 모드' : '🔫 연사 기동 모드',
    this.weaponMode === 'focus' ? '#fbbf24' : '#67e8f9',
    0.85,
   );
  }
  this.pendingEvents.push({ kind: 'weapon_mode', detail: this.weaponMode });
  return this.weaponMode;
 }

 resolveLockedTarget(session: OmegaProtocolCombatSession): Hazard | null {
  const state = session.engine.state;
  const p = state.player;
  const maxRange = this.weaponMode === 'focus' ? 490 : 455;
  const obstacles = session.field?.plan.obstacles ?? [];
  let best: Hazard | null = null;
  let bestScore = Infinity;
  for (const h of state.hazards) {
   if (h.hp <= 0) continue;
   const dx = h.x - p.x;
   const dy = h.y - p.y;
   const dist = Math.hypot(dx, dy);
   if (dist > maxRange) continue;
   if (obstacles.length > 0 && dist > 1) {
    const ux = dx / dist;
    const uy = dy / dist;
    const clearDist = clipRayAgainstObstacles(p, ux, uy, dist, obstacles, 2);
    if (clearDist + Math.max(4, h.radius) < dist - 4) continue;
   }
   if (this.weaponMode === 'focus') {
    const bossWeight = h.isStageBoss ? -8000 : 0;
    const armoredWeight =
     session.zombieBrain(h.id)?.kind === 'armored' || h.type === 'RUNAWAY_CART' ? -3000 : 0;
    const markWeight = (this.marks.get(h.id) ?? 0) > 0 ? -900 : 0;
    const score = bossWeight + armoredWeight + markWeight + dist;
    if (score < bestScore) {
     bestScore = score;
     best = h;
    }
   } else {
    if (dist < bestScore) {
     bestScore = dist;
     best = h;
    }
   }
  }
  return best;
 }

 fireRailBurst(
  session: OmegaProtocolCombatSession,
  aimWorld?: Readonly<{ x: number; y: number }> | null,
 ): boolean {
  const state = session.engine.state;
  if (session.run.phase !== 'battle' || state.phase !== 'playing' || session.gateTransit) {
   return false;
  }
  if (this.railCharge < 50) return false;

  const p = state.player;
  const hazards = state.hazards;
  let ux = 1;
  let uy = 0;

  if (aimWorld && Number.isFinite(aimWorld.x) && Number.isFinite(aimWorld.y)) {
   const dx = aimWorld.x - p.x;
   const dy = aimWorld.y - p.y;
   const d = Math.hypot(dx, dy);
   if (d > 8) {
    ux = dx / d;
    uy = dy / d;
   }
  } else {
   const locked =
    this.resolveLockedTarget(session) ??
    hazards
     .filter((h) => h.hp > 0)
     .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] ??
    null;
   if (locked) {
    const dx = locked.x - p.x;
    const dy = locked.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 1e-3) {
     ux = dx / d;
     uy = dy / d;
    }
   } else {
    const worldFacing = session.field
     ? omegaFieldScreenMoveToWorld(session.facing.x, session.facing.y)
     : session.facing;
    const flen = Math.hypot(worldFacing.x, worldFacing.y);
    if (flen > 1e-3) {
     ux = worldFacing.x / flen;
     uy = worldFacing.y / flen;
    }
   }
  }

  this.railCharge = Math.max(0, this.railCharge - 50);
  this.railBurstsFired++;
  this.weaveActiveRemaining = 2.6;

  const obstacles = session.field?.plan.obstacles ?? [];
  const maxLen = 490;
  const beamLen = clipRayAgainstObstacles(p, ux, uy, maxLen, obstacles, 4);
  const startX = p.x + ux * 14;
  const startY = p.y + uy * 14;
  const endX = p.x + ux * beamLen;
  const endY = p.y + uy * beamLen;

  const struck: { hazard: Hazard; along: number }[] = [];
  for (const h of hazards) {
   if (h.hp <= 0) continue;
   const rx = h.x - p.x;
   const ry = h.y - p.y;
   const along = rx * ux + ry * uy;
   if (along < -h.radius || along > beamLen + h.radius) continue;
   const perp = Math.abs(rx * -uy + ry * ux);
   if (perp <= Math.max(22, h.radius + 14)) {
    struck.push({ hazard: h, along });
   }
  }
  struck.sort((a, b) => a.along - b.along);

  let hitCount = 0;
  const baseDmg = (this.weaponMode === 'focus' ? 58 : 44) * Math.min(2, p.damageMultiplier);
  for (let i = 0; i < struck.length; i++) {
   const h = struck[i]!.hazard;
   const armored =
    session.zombieBrain(h.id)?.kind === 'armored' || h.type === 'RUNAWAY_CART';
   let dmg = Math.round(baseDmg * (armored ? 1.25 : 1.0));
   if (h.isStageBoss) {
    dmg = Math.min(dmg, Math.max(18, Math.round(h.maxHp * 0.055)));
   }
   const dealt = session.engine.damageProtocolConstruct(h.id, dmg);
   if (dealt <= 0) continue;
   hitCount++;
   this.pushDamageNumber(h.x, h.y - 26, dealt, 'rail');
   this.pushSlashCut(h.x, h.y, Math.atan2(uy, ux), this.weaponMode === 'focus' ? '251,191,36' : '103,232,249', true);
   this.spawnSparkBurst(
    h.x,
    h.y,
    7,
    Math.atan2(uy, ux),
    1.1,
    this.weaponMode === 'focus' ? '251,191,36' : '103,232,249',
    1.25,
   );
   if (h.hp > 0) {
    const addStacks = i === 0 ? 3 : 2;
    this.marks.set(h.id, Math.min(3, (this.marks.get(h.id) ?? 0) + addStacks));
   }
  }

  const beamAngle = Math.atan2(uy, ux);
  const isFocus = this.weaponMode === 'focus';
  this.beams.push({
   x1: startX,
   y1: startY - 30,
   x2: endX,
   y2: endY - 26,
   colorRgb: isFocus ? '251,191,36' : '103,232,249',
   isPillar: false,
   age: 0,
   duration: 0.24,
  });
  for (let c = 0; c < 3; c++) {
   this.spawnCasing(p.x, p.y, beamAngle + (c - 1) * 0.14, isFocus ? '#fde047' : '#7dd3fc');
  }
  if (struck[0]) {
   this.detonations.push({
    x: struck[0].hazard.x,
    y: struck[0].hazard.y,
    radius: 56,
    stacks: 2,
    age: 0,
    duration: 0.24,
   });
   this.spawnScorch(
    struck[0].hazard.x,
    struck[0].hazard.y,
    54,
    isFocus ? '251,191,36' : '103,232,249',
    3.2,
   );
  }

  this.comboCount += Math.max(1, hitCount);
  this.maxCombo = Math.max(this.maxCombo, this.comboCount);
  this.comboTimer = 3.5;
  this.addStyle(hitCount > 0 ? 85 + hitCount * 35 : 25);
  this.strikerCharge = Math.min(100, this.strikerCharge + (hitCount > 0 ? 8 + hitCount * 4 : 3));
  this.triggerHitstop(hitCount > 0 ? 0.044 : 0.018, hitCount > 0 ? 0.34 : 0.14, 11, ux, uy);
  this.addCameraRoll(0.009);
  this.zoomPunch = Math.max(this.zoomPunch, 0.04);
  if (hitCount > 0) {
   this.pushCallout(
    struck[0]!.hazard.x,
    struck[0]!.hazard.y - 62,
    hitCount > 1 ? `⚡ RAIL PIERCE ×${hitCount}!` : '⚡ SIGMA RAIL!',
    isFocus ? '#fbbf24' : '#67e8f9',
    0.95,
   );
  }
  this.pendingEvents.push({ kind: 'rail_burst', detail: this.weaponMode, numeric: hitCount });
  return true;
 }

 currentOverclockRemaining(): number {
  return this.overclockRemaining;
 }

 currentSlowMoRemaining(): number {
  return this.slowMoRemaining;
 }

 currentShield(): number {
  return this.shield;
 }

 currentHitstopRemaining(): number {
  return this.hitstopRemaining;
 }

 currentImpactFlash(): number {
  return this.impactFlash;
 }

 currentShieldFlash(): number {
  return this.shieldFlash;
 }

 currentHpDamageFlash(): number {
  return this.hpDamageFlash;
 }

 currentRailCharge(): number {
  return this.railCharge;
 }

 tickHitstop(rawRealDt: number): boolean {
  if (this.hitstopRemaining <= 0) return false;
  const dt = Number.isFinite(rawRealDt) && rawRealDt > 0 ? Math.min(0.05, rawRealDt) : 0;
  this.hitstopRemaining = Math.max(0, this.hitstopRemaining - dt);
  if (this.impactFlash > 0) this.impactFlash = Math.max(0, this.impactFlash - dt * 2.8);
  if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 20);
  if (Math.abs(this.cameraRoll) > 0.0001) {
   this.cameraRoll *= Math.exp(-dt * 16);
   if (Math.abs(this.cameraRoll) < 0.0001) this.cameraRoll = 0;
  }
  return this.hitstopRemaining > 0;
 }

 private triggerHitstop(seconds: number, flash = 0, shake = 0, dirX = 0, dirY = 0): void {
  this.hitstopRemaining = Math.min(0.072, Math.max(this.hitstopRemaining, seconds));
  if (flash > 0) this.impactFlash = Math.min(1, Math.max(this.impactFlash, flash));
  if (shake > 0) this.cameraShake = Math.max(this.cameraShake, shake);
  const len = Math.hypot(dirX, dirY);
  if (len > 1e-4) {
   this.shakeDirX = dirX / len;
   this.shakeDirY = dirY / len;
  }
 }

 applyLoadoutToSession(session: OmegaProtocolCombatSession): void {
  if (this.loadoutApplied) return;
  this.loadoutApplied = true;
  const spec = omegaLoadoutSpec(this.loadoutId);
  const p = session.engine.state.player;
  p.speed += spec.speedBonus;
  p.maxHp = Math.max(60, p.maxHp + spec.maxHpBonus);
  p.hp = p.maxHp;
  if (this.loadoutId === 'phantom') {
   p.dashMaxCooldown = Math.max(1.0, (p.dashMaxCooldown ?? 3.0) - 0.35);
  }
  session.syncRunVitality();
  this.prevWave = session.plan.wave;
  this.prevBossAlive = session.engine.state.hazards.some((h) => h.hp > 0 && h.isStageBoss);
  this.prevHazardsLeft = session.engine.state.hazards.some((h) => h.hp > 0);
  this.snapshotAlive(session);
 }

 private snapshotAlive(session: OmegaProtocolCombatSession): void {
  this.prevAliveById.clear();
  for (const h of session.engine.state.hazards) {
   if (h.hp > 0) {
    this.prevAliveById.set(h.id, { x: h.x, y: h.y, boss: Boolean(h.isStageBoss) });
   }
  }
 }

 private addStyle(points: number): void {
  this.stylePoints = Math.min(2600, this.stylePoints + points);
  if (this.stylePoints > this.peakPoints) this.peakPoints = this.stylePoints;
  const resolved = omegaStyleRankForPoints(this.stylePoints).current;
  const prevIdx = RANK_ORDER.indexOf(this.currentRank);
  const nextIdx = RANK_ORDER.indexOf(resolved.tier);
  if (nextIdx > prevIdx) {
   this.currentRank = resolved.tier;
   if (nextIdx > RANK_ORDER.indexOf(this.peakRank)) {
    this.peakRank = resolved.tier;
   }
   this.pendingEvents.push({ kind: 'rank_up', detail: resolved.tier });
  } else {
   this.currentRank = resolved.tier;
  }
 }

 private pushCallout(x: number, y: number, text: string, colorHex: string, duration = 0.95): void {
  this.callouts.push({ x, y, text, colorHex, age: 0, duration });
  if (this.callouts.length > 12) this.callouts.shift();
 }

 private pushSlashCut(x: number, y: number, angle: number, colorRgb: string, crit: boolean): void {
  this.slashCuts.push({ x, y, angle, colorRgb, crit, age: 0, duration: crit ? 0.28 : 0.22 });
  if (this.slashCuts.length > 24) this.slashCuts.shift();
 }

 private pushDamageNumber(
  x: number,
  y: number,
  amount: number,
  style: 'blade' | 'blade_crit' | 'rail' | 'detonate' | 'striker' | 'player_hp' | 'player_shield',
 ): void {
  const rounded = Math.max(1, Math.round(amount));
  const idx = this.casingSeed++;
  const staggerX = ((idx % 5) - 2) * 7;
  const crit = style === 'blade_crit' || style === 'detonate' || style === 'rail' || style === 'striker';
  const colorHex =
   style === 'player_hp'
    ? '#fb7185'
    : style === 'player_shield'
      ? '#38bdf8'
      : style === 'blade_crit'
        ? '#fde047'
        : style === 'detonate'
          ? '#fb923c'
          : style === 'rail'
            ? '#fbbf24'
            : style === 'striker'
              ? '#c084fc'
              : '#67e8f9';
  const text =
   style === 'player_hp'
    ? `-${rounded} HP`
    : style === 'player_shield'
      ? `🛡 -${rounded}`
      : style === 'blade_crit'
        ? `${rounded}!`
        : String(rounded);
  this.damageNumbers.push({
   x: x + staggerX,
   y: y - 34,
   vx: staggerX * 2.4,
   text,
   colorHex,
   scale: crit ? 1.24 : 1.0,
   crit,
   age: 0,
   duration: style === 'player_hp' ? 0.85 : 0.62,
  });
  if (this.damageNumbers.length > 24) this.damageNumbers.shift();
 }

 private chargeRateMultiplier(): number {
  const rankIdx = RANK_ORDER.indexOf(this.currentRank);
  return rankIdx >= 5 ? 1.35 : rankIdx >= 1 ? 1.15 : 1.0;
 }

 onProjectileFeedback(session: OmegaProtocolCombatSession, feedback: readonly ProjectileFeedback[]): void {
  if (feedback.length === 0) return;
  const hazards = session.engine.state.hazards;
  const evos = omegaActiveEvolutions(session.run.owned);

  for (const ev of feedback) {
   if (ev.phase === 'launch') {
    this.pendingEvents.push({ kind: 'gunshot', detail: this.overclockRemaining > 0 ? 'overclock' : 'normal' });
    this.spawnCasing(ev.x, ev.y, ev.angle, this.weaponMode === 'focus' ? '#fbbf24' : '#67e8f9');
    continue;
   }
   if (ev.phase !== 'impact' || !ev.targetId) continue;

   const struckHazard = hazards.find((h) => h.id === ev.targetId);
   const material: 'boss' | 'armored' | 'normal' = struckHazard?.isStageBoss
    ? 'boss'
    : session.zombieBrain(ev.targetId)?.kind === 'armored' || struckHazard?.variant === 'reinforced_cart'
      ? 'armored'
      : 'normal';
   const gameNow = session.engine.state.gameTime;
   if (material !== 'normal' || this.lastImpactAudioTime < 0 || gameNow - this.lastImpactAudioTime >= 0.045) {
    this.lastImpactAudioTime = gameNow;
    this.pendingEvents.push({ kind: 'hit_impact', detail: material });
   }
   this.spawnSparkBurst(
    ev.x,
    ev.y,
    material === 'normal' ? 3 : 5,
    ev.angle + Math.PI,
    1.15,
    material === 'armored' ? '251,191,36' : material === 'boss' ? '244,114,182' : '125,211,252',
    0.85,
   );

   const prev = this.marks.get(ev.targetId) ?? 0;
   const focusBonusMark = this.weaponMode === 'focus' && material !== 'normal' ? 1 : 0;
   const nextMark = Math.min(3, prev + (this.overclockRemaining > 0 ? 2 : 1) + focusBonusMark);
   this.marks.set(ev.targetId, nextMark);
   this.comboCount++;
   this.maxCombo = Math.max(this.maxCombo, this.comboCount);
   this.comboTimer = 3.2;
   this.addStyle(22);
   this.strikerCharge = Math.min(100, this.strikerCharge + 3.2 * this.chargeRateMultiplier());
   this.railCharge = Math.min(
    100,
    this.railCharge + (this.weaponMode === 'rapid' ? 13 : 9) * (this.overclockRemaining > 0 ? 1.35 : 1),
   );

   if (this.weaponMode === 'focus' && struckHazard && struckHazard.hp > 0) {
    const focusDmg =
     material === 'boss'
      ? Math.min(14, Math.max(4, Math.round(struckHazard.maxHp * 0.012)))
      : material === 'armored'
        ? 14
        : 8;
    const fDealt = session.engine.damageProtocolConstruct(struckHazard.id, focusDmg);
    if (fDealt > 0) this.pushDamageNumber(struckHazard.x, struckHazard.y - 24, fDealt, 'rail');
   }

   if (this.overclockRemaining > 0) {
    // Piercing railgun arc to nearest second target behind/near struck enemy.
    const secondary = hazards.find(
     (h) => h.hp > 0 && h.id !== ev.targetId && Math.hypot(h.x - ev.x, h.y - ev.y) <= 210,
    );
    if (secondary) {
     const oDealt = session.engine.damageProtocolConstruct(secondary.id, 14);
     if (oDealt > 0) this.pushDamageNumber(secondary.x, secondary.y - 22, oDealt, 'blade');
     this.marks.set(secondary.id, Math.min(3, (this.marks.get(secondary.id) ?? 0) + 1));
     this.lightnings.push({
      x1: ev.x,
      y1: ev.y - 24,
      x2: secondary.x,
      y2: secondary.y - 24,
      seed: Math.round(ev.x + ev.y),
      age: 0,
      duration: 0.18,
     });
    }
   }

   if (evos.includes('signal_swarm') && this.drones.length < 4 && prev === 2) {
    const p = session.engine.state.player;
    this.drones.push({ x: p.x, y: p.y - 20, vx: 120, vy: -80, remaining: 4.0 });
   }
  }
 }

 onPlayerDash(session: OmegaProtocolCombatSession): { readonly phantomDodge: boolean } {
  const player = session.engine.state.player;
  const spec = omegaLoadoutSpec(this.loadoutId);
  const windowSec = spec.dodgeWindowSeconds;

  let imminent = false;
  if (this.phantomGuardCooldown <= 0) {
   for (const h of session.engine.state.hazards) {
    if (h.hp <= 0) continue;
    const d = Math.hypot(h.x - player.x, h.y - player.y);
    const brain = session.zombieBrain(h.id);
    if (brain && (brain.phase === 'warning' || brain.phase === 'charge') && d <= 205) {
     imminent = true;
     break;
    }
    if (h.type === 'RUNAWAY_CART' && d <= 220) {
     imminent = true;
     break;
    }
   }
   const bt = session.snapshot.bossTelegraph;
   if (!imminent && bt && bt.phase === 'warning' && bt.timer <= windowSec + 0.18) {
    imminent = true;
   }
  }

  // Volt Phantom Evo triggers lightning dash slash regardless of Phantom Dodge timing.
  const evos = omegaActiveEvolutions(session.run.owned);
  if (evos.includes('volt_phantom')) {
   for (const h of session.engine.state.hazards) {
    if (h.hp <= 0) continue;
    if (Math.hypot(h.x - player.x, h.y - player.y) <= 155) {
     const vDealt = session.engine.damageProtocolConstruct(h.id, 26);
     if (vDealt > 0) this.pushDamageNumber(h.x, h.y - 22, vDealt, 'blade');
     this.marks.set(h.id, Math.min(3, (this.marks.get(h.id) ?? 0) + 1));
     this.lightnings.push({
      x1: player.x,
      y1: player.y - 24,
      x2: h.x,
      y2: h.y - 24,
      seed: Math.round(h.x),
      age: 0,
      duration: 0.22,
     });
    }
   }
   this.pendingEvents.push({ kind: 'chain_lightning' });
  }

  if (!imminent) {
   return { phantomDodge: false };
  }

  this.phantomGuardCooldown = 0.85;
  this.slowMoRemaining = 0.40;
  this.overclockRemaining = 3.5;
  this.phantomDodgesCount++;
  this.comboCount += 2;
  this.maxCombo = Math.max(this.maxCombo, this.comboCount);
  this.comboTimer = 3.5;
  this.strikerCharge = Math.min(100, this.strikerCharge + 24);
  this.railCharge = Math.min(100, this.railCharge + 50);
  session.engine.state.ultimateCharge = Math.min(
   session.engine.state.maxUltimateCharge,
   session.engine.state.ultimateCharge + 18,
  );
  this.shield = Math.min(this.maxShield, this.shield + 8);
  this.addStyle(180);
  this.zoomPunch = 0.085;
  this.cameraShake = Math.max(this.cameraShake, 9);
  this.addCameraRoll(0.0075);
  this.spawnSparkBurst(player.x, player.y, 8, Math.atan2(session.facing.y, session.facing.x) + Math.PI, Math.PI * 1.4, '103,232,249', 1.1);
  this.pushCallout(player.x, player.y - 72, '⚡ PHANTOM DODGE!', '#67e8f9', 1.15);
  this.pendingEvents.push({ kind: 'phantom_dodge' });
  return { phantomDodge: true };
 }

 onPlayerBlade(session: OmegaProtocolCombatSession, strike: OmegaBladeStrike | null): void {
  if (!strike) return;
  const spec = omegaLoadoutSpec(this.loadoutId);
  const evos = omegaActiveEvolutions(session.run.owned);
  const rankIdx = RANK_ORDER.indexOf(this.currentRank);
  const rankRadiusScale = rankIdx >= 2 ? 1.12 : 1.0;
  const rankBlastScale = rankIdx >= 5 ? 1.3 : 1.0;

  const angle = Math.atan2(strike.facingY || 0, strike.facingX || 1);
  const reachCenterX = strike.x + Math.cos(angle) * 78;
  const reachCenterY = strike.y + Math.sin(angle) * 78;
  const slashColorRgb =
   strike.combo === 3 ? '251,191,36' : strike.combo === 2 ? '192,132,252' : '103,232,249';

  // Emit per-target slash-cut wound flare & floating damage number for EVERY actual melee hit.
  if (strike.hitTargets?.length) {
   for (const hit of strike.hitTargets) {
    this.pushSlashCut(hit.x, hit.y, angle, slashColorRgb, strike.combo === 3);
    this.pushDamageNumber(hit.x, hit.y, hit.damage, strike.combo === 3 ? 'blade_crit' : 'blade');
    this.spawnSparkBurst(
     hit.x,
     hit.y,
     strike.combo === 3 ? 10 : 6,
     angle,
     strike.combo === 3 ? 1.7 : 1.25,
     slashColorRgb,
     strike.combo === 3 ? 1.3 : 1.0,
    );
   }
  }
  if (strike.combo === 3 && strike.hits > 0) {
   this.spawnScorch(reachCenterX, reachCenterY, 64, '251,191,36', 2.8);
   this.addCameraRoll(0.0085);
  }

  // Snapshot alive before extra detonation/moonwave so we can award kill refunds accurately.
  const preKillCount = session.engine.state.hazards.filter((h) => h.hp > 0).length;

  // 1. Trigger Signal Mark Detonation on marked enemies caught inside blade swing.
  const markedTargets: Hazard[] = [];
  for (const h of session.engine.state.hazards) {
   if (h.hp <= 0) continue;
   const stacks = this.marks.get(h.id) ?? 0;
   if (stacks <= 0) continue;
   const nearBlade =
    Math.hypot(h.x - strike.x, h.y - strike.y) <= 136 ||
    Math.hypot(h.x - reachCenterX, h.y - reachCenterY) <= 118;
   if (nearBlade) markedTargets.push(h);
  }

  for (const target of markedTargets) {
   const stacks = this.marks.get(target.id) ?? 0;
   if (stacks <= 0) continue;
   this.marks.delete(target.id);
   this.detonationsCount++;

   const radius = spec.detonationRadius * rankRadiusScale;
   const stackBonus = stacks >= 3 ? spec.threeStackBonus : 1.0;
   const overBonus = this.overclockRemaining > 0 ? 1.35 : 1.0;
   const dmg = Math.round(
    (18 + stacks * 16) * spec.detonationMultiplier * stackBonus * rankBlastScale * overBonus,
   );

   for (const h of session.engine.state.hazards) {
    if (h.hp <= 0) continue;
    if (Math.hypot(h.x - target.x, h.y - target.y) <= radius) {
     const detDealt = session.engine.damageProtocolConstruct(h.id, dmg);
     if (detDealt > 0) this.pushDamageNumber(h.x, h.y - 14, detDealt, 'detonate');
     if (h.id !== target.id && h.hp > 0 && rankIdx >= 3) {
      this.marks.set(h.id, Math.min(3, (this.marks.get(h.id) ?? 0) + 1));
     }
    }
   }

   // Volt Phantom / OMEGA rank chain lightning jump on detonation.
   if (evos.includes('volt_phantom') || this.currentRank === 'OMEGA') {
    let jumps = 0;
    for (const h of session.engine.state.hazards) {
     if (h.hp <= 0 || h.id === target.id || jumps >= 4) continue;
     if (Math.hypot(h.x - target.x, h.y - target.y) <= 270) {
      const boltDealt = session.engine.damageProtocolConstruct(h.id, 18);
      if (boltDealt > 0) this.pushDamageNumber(h.x, h.y - 12, boltDealt, 'blade');
      this.lightnings.push({
       x1: target.x,
       y1: target.y - 26,
       x2: h.x,
       y2: h.y - 26,
       seed: Math.round(h.x + target.y),
       age: 0,
       duration: 0.24,
      });
      jumps++;
     }
    }
   }

   this.detonations.push({
    x: target.x,
    y: target.y,
    radius,
    stacks,
    age: 0,
    duration: 0.36,
   });
   this.spawnSparkBurst(
    target.x,
    target.y,
    12,
    angle,
    Math.PI * 2,
    stacks >= 3 ? '251,191,36' : '103,232,249',
    stacks >= 3 ? 1.35 : 1.1,
   );
   this.spawnScorch(
    target.x,
    target.y,
    radius * 0.72,
    stacks >= 3 ? '251,191,36' : '103,232,249',
    3.8,
   );
   this.shield = Math.min(this.maxShield, this.shield + stacks * 5);
   this.strikerCharge = Math.min(100, this.strikerCharge + stacks * 10 * this.chargeRateMultiplier());
   this.comboCount += stacks;
   this.maxCombo = Math.max(this.maxCombo, this.comboCount);
   this.comboTimer = 3.5;
   this.addStyle(110 * stacks);
   this.triggerHitstop(
    stacks >= 3 ? 0.068 : 0.042,
    stacks >= 3 ? 0.55 : 0.30,
    9 + stacks * 4,
    Math.cos(angle),
    Math.sin(angle),
   );
   this.addCameraRoll(stacks >= 3 ? 0.011 : 0.007);
   this.zoomPunch = Math.max(this.zoomPunch, 0.045);
   this.pushCallout(target.x, target.y - 54, `💥 DETONATE ×${stacks}!`, stacks >= 3 ? '#fbbf24' : '#67e8f9', 0.9);
   this.pendingEvents.push({ kind: 'detonation', numeric: stacks });
  }

  if (markedTargets.length > 0 && this.weaveActiveRemaining > 0) {
   this.weaveActiveRemaining = 0;
   this.railCharge = Math.min(100, this.railCharge + 35);
   this.shield = Math.min(this.maxShield, this.shield + 8);
   this.addStyle(120);
   this.pendingEvents.push({ kind: 'weave_bonus' });
   this.pushCallout(strike.x, strike.y - 72, '⚡ GUN-BLADE WEAVE!', '#fde047', 1.0);
  }

  // 2. Empowers close strike if Overclocked from Phantom Dodge.
  if (this.overclockRemaining > 0 && strike.hits > 0) {
   for (const h of session.engine.state.hazards) {
    if (h.hp > 0 && Math.hypot(h.x - reachCenterX, h.y - reachCenterY) <= 135) {
     const ocDealt = session.engine.damageProtocolConstruct(h.id, 22);
     if (ocDealt > 0) this.pushDamageNumber(h.x, h.y - 10, ocDealt, 'blade');
    }
   }
  }

  // 3. Fire long-range piercing Moonwave at Rank S+ or Crimson Moon Combo-3.
  const canMoonwave =
   rankIdx >= 4 || (evos.includes('crimson_moon') && strike.combo === 3);
  if (canMoonwave) {
   const speed = 640;
   this.waves.push({
    id: this.waveIdSeq++,
    x: strike.x + Math.cos(angle) * 28,
    y: strike.y + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    range: 420,
    radius: evos.includes('crimson_moon') ? 68 : 54,
    damage: evos.includes('crimson_moon') ? 38 : 28,
    crimson: evos.includes('crimson_moon'),
    age: 0,
    duration: 0.65,
    hitIds: new Set<string>(),
   });
   this.pendingEvents.push({ kind: 'moonwave' });
  }

  if (strike.hits > 0) {
   this.comboCount += strike.hits;
   this.maxCombo = Math.max(this.maxCombo, this.comboCount);
   this.comboTimer = 3.4;
   this.addStyle(35 * strike.hits);
   this.strikerCharge = Math.min(100, this.strikerCharge + 5 * strike.hits * this.chargeRateMultiplier());
   this.railCharge = Math.min(
    100,
    this.railCharge + 14 * strike.hits + (strike.combo === 3 ? 18 : 0),
   );
   if (markedTargets.length === 0) {
    this.triggerHitstop(
     strike.combo === 3 ? 0.048 : 0.028,
     strike.combo === 3 ? 0.28 : 0,
     strike.combo === 3 ? 9 : 4,
     strike.facingX,
     strike.facingY,
    );
    if (strike.combo === 3) this.zoomPunch = Math.max(this.zoomPunch, 0.036);
   }
   let bladeMat: 'boss' | 'armored' | 'normal' = 'normal';
   for (const h of session.engine.state.hazards) {
    const nearBlade =
     Math.hypot(h.x - strike.x, h.y - strike.y) <= 136 ||
     Math.hypot(h.x - reachCenterX, h.y - reachCenterY) <= 118;
    if (!nearBlade) continue;
    if (h.isStageBoss) {
     bladeMat = 'boss';
     break;
    }
    if (session.zombieBrain(h.id)?.kind === 'armored' || h.variant === 'reinforced_cart') {
     bladeMat = 'armored';
    }
   }
   this.pendingEvents.push({ kind: 'hit_impact', detail: bladeMat });
  }

  // Check if sword strike / detonation killed any enemy -> cooldown refund!
  const postKillCount = session.engine.state.hazards.filter((h) => h.hp > 0).length;
  if (postKillCount < preKillCount || (strike.hits > 0 && markedTargets.length > 0)) {
   const refund = evos.includes('crimson_moon') ? 1.0 : spec.bladeKillCooldownRefundRatio;
   if (refund > 0) session.refundBladeCooldown(refund);
  }
 }

 triggerStriker(session: OmegaProtocolCombatSession, id: OmegaStrikerId): boolean {
  if (session.run.phase !== 'battle' || session.engine.state.phase !== 'playing') return false;
  if (!this.unlockedStrikers.has(id)) return false;
  if ((this.strikerCooldowns[id] ?? 0) > 0) return false;
  const spec = omegaStrikerSpec(id);
  if (this.strikerCharge < spec.costCharge) return false;

  this.strikerCharge -= spec.costCharge;
  this.strikerCooldowns[id] = spec.cooldownSeconds;
  this.strikersCalledTotal++;
  this.strikersCalledById[id] = (this.strikersCalledById[id] ?? 0) + 1;
  this.radioBanner = {
   text: spec.radioLine,
   accentHex: spec.accentHex,
   seriesTag: spec.seriesTag,
   remaining: 3.4,
  };
  this.addStyle(140);
  this.comboCount += 2;
  this.maxCombo = Math.max(this.maxCombo, this.comboCount);
  this.comboTimer = 3.4;

  const player = session.engine.state.player;
  const hazards = session.engine.state.hazards;

  if (id === 'm01_snipe') {
   const target =
    hazards
     .filter((h) => h.hp > 0)
     .sort((a, b) => Number(Boolean(b.isStageBoss)) - Number(Boolean(a.isStageBoss)) || b.hp - a.hp)[0] ??
    null;
   const tx = target ? target.x : player.x + 280;
   const ty = target ? target.y : player.y;
   if (target) {
    const sDealt = session.engine.damageProtocolConstruct(target.id, 120);
    if (sDealt > 0) this.pushDamageNumber(target.x, target.y - 30, sDealt, 'striker');
    if (target.hp > 0) this.marks.set(target.id, 3);
   }
   this.beams.push({
    x1: tx - 380,
    y1: ty - 420,
    x2: tx,
    y2: ty - 24,
    colorRgb: '56,189,248',
    isPillar: false,
    age: 0,
    duration: 0.45,
   });
   this.triggerHitstop(0.056, 0.42, 12, 0.7, 0.4);
   this.addCameraRoll(0.009);
   this.spawnSparkBurst(tx, ty, 10, 0.5, Math.PI * 1.8, '56,189,248', 1.25);
   this.spawnScorch(tx, ty, 56, '56,189,248', 3.4);
   this.pushCallout(tx, ty - 68, '🎯 M01 OVERWATCH!', '#38bdf8', 1.1);
  } else if (id === 'guard_sentry') {
   this.turrets.push({
    x: player.x + 42,
    y: player.y + 18,
    remaining: 12,
    duration: 12,
    fireTimer: 0.1,
    aimAngle: 0,
   });
   this.pushCallout(player.x, player.y - 68, '🛡️ GUARD SENTRY DEPLOYED!', '#34d399', 1.1);
  } else if (id === 'breaker_emp') {
   const center =
    hazards.find((h) => h.hp > 0) ?? ({ x: player.x + 140, y: player.y } as OmegaFieldPoint);
   for (const h of hazards) {
    if (h.hp <= 0) continue;
    if (Math.hypot(h.x - center.x, h.y - center.y) <= 235) {
     const eDealt = session.engine.damageProtocolConstruct(h.id, 72);
     if (eDealt > 0) this.pushDamageNumber(h.x, h.y - 24, eDealt, 'striker');
     this.marks.set(h.id, Math.min(3, (this.marks.get(h.id) ?? 0) + 2));
    }
   }
   this.beams.push({
    x1: center.x,
    y1: center.y - 460,
    x2: center.x,
    y2: center.y,
    colorRgb: '192,132,252',
    isPillar: true,
    age: 0,
    duration: 0.55,
   });
   this.detonations.push({ x: center.x, y: center.y, radius: 235, stacks: 3, age: 0, duration: 0.42 });
   this.triggerHitstop(0.056, 0.45, 14, 0, -1);
   this.addCameraRoll(0.012);
   this.spawnSparkBurst(center.x, center.y, 16, 0, Math.PI * 2, '192,132,252', 1.35);
   this.spawnScorch(center.x, center.y, 118, '192,132,252', 4.5);
   this.pushCallout(center.x, center.y - 72, '⚡ BREAKER ORBITAL EMP!', '#c084fc', 1.15);
  } else if (id === 'site_aegis') {
   player.hp = Math.min(player.maxHp, player.hp + 22);
   this.shield = this.maxShield;
   this.domes.push({ x: player.x, y: player.y, remaining: 6.0, duration: 6.0, radius: 135 });
   for (const h of hazards) {
    if (h.hp <= 0 || h.isStageBoss) continue;
    const dx = h.x - player.x;
    const dy = h.y - player.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 165) {
     h.x += (dx / d) * 65;
     h.y += (dy / d) * 65;
    }
   }
   this.pushCallout(player.x, player.y - 72, '💛 SITE TEAM AEGIS DOME!', '#fbbf24', 1.15);
  }

  this.pendingEvents.push({ kind: 'striker', detail: id });
  return true;
 }

 step(
  session: OmegaProtocolCombatSession,
  rawDt: number,
  hpBeforeUpdate?: number,
 ): { readonly effectiveDt: number; readonly events: readonly OmegaDirectorEvent[] } {
  const dt = Number.isFinite(rawDt) && rawDt > 0 ? Math.min(0.05, rawDt) : 0;
  const state = session.engine.state;
  const player = state.player;

  // 1. Intercept incoming Watch damage with Energy Shield when hpBeforeUpdate provided,
  // and give unambiguous shield-absorb vs net-HP-loss feedback on AIRA.
  if (typeof hpBeforeUpdate === 'number' && hpBeforeUpdate > player.hp && state.phase === 'playing') {
   const lost = hpBeforeUpdate - player.hp;
   const absorbed = Math.min(this.shield, lost);
   const netHpLost = lost - absorbed;
   if (absorbed > 0) {
    this.shield = Math.max(0, this.shield - absorbed);
    player.hp = Math.min(player.maxHp, player.hp + absorbed);
    this.shieldFlash = 1.0;
    this.pushDamageNumber(player.x, player.y - 36, absorbed, 'player_shield');
    if (this.shield <= 0.01) {
     this.shield = 0;
     this.pendingEvents.push({ kind: 'shield_break' });
     this.pushCallout(player.x, player.y - 68, '🛡 SHIELD DOWN!', '#fca5a5', 0.9);
    } else if (netHpLost <= 0.01) {
     this.pendingEvents.push({ kind: 'shield_absorb' });
     if (state.lastDamage) state.lastDamage.remaining = Math.min(state.lastDamage.remaining, 1.80);
    }
   }
   if (netHpLost > 0.01) {
    this.hpDamageFlash = Math.min(1, 0.55 + netHpLost / 30);
    this.cameraShake = Math.max(this.cameraShake, 6);
    this.pushDamageNumber(player.x, player.y - 38, netHpLost, 'player_hp');
    this.pendingEvents.push({ kind: 'player_hurt' });
   }
  }

  // 2. Wave transition, boss entry, clear & terminal state transitions.
  if (session.plan.wave !== this.prevWave) {
   this.prevWave = session.plan.wave;
   this.prevBossAlive = state.hazards.some((h) => h.hp > 0 && h.isStageBoss);
   this.prevHazardsLeft = state.hazards.some((h) => h.hp > 0);
   this.shield = Math.min(this.maxShield, Math.max(this.shield, this.maxShield * 0.75));
   this.snapshotAlive(session);
  }
  const bossNow = state.hazards.some((h) => h.hp > 0 && h.isStageBoss);
  if (!this.prevBossAlive && bossNow) {
   this.pendingEvents.push({ kind: 'boss_entry' });
  }
  this.prevBossAlive = bossNow;

  const hazardsNow = state.hazards.some((h) => h.hp > 0);
  if (this.prevHazardsLeft && !hazardsNow && session.run.phase === 'battle' && session.plan.wave === this.prevWave) {
   this.pendingEvents.push({ kind: 'wave_clear' });
  }
  this.prevHazardsLeft = hazardsNow;

  if (session.run.phase === 'victory' && this.prevTerminalEmitted !== 'victory') {
   this.prevTerminalEmitted = 'victory';
   this.pendingEvents.push({ kind: 'victory' });
  } else if ((session.run.phase === 'defeat' || state.phase === 'defeat') && this.prevTerminalEmitted !== 'defeat') {
   this.prevTerminalEmitted = 'defeat';
   this.pendingEvents.push({ kind: 'defeat' });
  }
  for (const s of OMEGA_STRIKERS) {
   if (session.plan.wave >= s.unlockWave || this.kills >= s.unlockWave * 4) {
    this.unlockedStrikers.add(s.id);
   }
  }
  for (const evo of omegaActiveEvolutions(session.run.owned)) {
   if (!this.knownEvos.has(evo)) {
    this.knownEvos.add(evo);
    const label =
     evo === 'volt_phantom' ? '⚡ 팬텀 뇌전 각성!' : evo === 'crimson_moon' ? '🩸 크림슨 일섬 각성!' : '🛰️ 오버로드 드론 각성!';
    this.pushCallout(player.x, player.y - 84, label, '#fbbf24', 1.5);
    this.pendingEvents.push({ kind: 'evo_unlock', detail: evo });
   }
  }

  // 3. Detect confirmed kills -> drop Signal Orbs & Signal Swarm drones.
  const evos = omegaActiveEvolutions(session.run.owned);
  for (const [id, info] of this.prevAliveById.entries()) {
   const cur = state.hazards.find((h) => h.id === id);
   if (!cur || cur.hp <= 0) {
    this.kills++;
    this.marks.delete(id);
    this.comboCount++;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    this.comboTimer = 3.5;
    this.addStyle(info.boss ? 280 : 65);
    this.orbs.push({
     x: info.x,
     y: info.y,
     charge: info.boss ? 35 : 8,
     points: info.boss ? 120 : 35,
     age: 0,
    });
    this.killBursts.push({
     x: info.x,
     y: info.y,
     boss: info.boss,
     age: 0,
     duration: info.boss ? 0.55 : 0.34,
    });
    if (this.killBursts.length > 24) this.killBursts.shift();
    this.spawnSparkBurst(
     info.x,
     info.y,
     info.boss ? 18 : 8,
     0,
     Math.PI * 2,
     info.boss ? '244,114,182' : '103,232,249',
     info.boss ? 1.45 : 1.05,
    );
    if (info.boss) {
     this.spawnScorch(info.x, info.y, 90, '244,114,182', 4.5);
    }
    this.pendingEvents.push({ kind: 'enemy_kill', detail: info.boss ? 'boss' : 'normal' });
    if (evos.includes('signal_swarm') && this.drones.length < 5) {
     this.drones.push({ x: player.x, y: player.y - 24, vx: 110, vy: -90, remaining: 4.5 });
    }
   }
  }
  this.snapshotAlive(session);

  // 4. Advance timers (using real unscaled dt so slow-mo feels crisp).
  if (this.hitstopRemaining > 0) this.hitstopRemaining = Math.max(0, this.hitstopRemaining - dt);
  if (this.impactFlash > 0) this.impactFlash = Math.max(0, this.impactFlash - dt * 3.4);
  if (this.shieldFlash > 0) this.shieldFlash = Math.max(0, this.shieldFlash - dt * 2.6);
  if (this.hpDamageFlash > 0) this.hpDamageFlash = Math.max(0, this.hpDamageFlash - dt * 2.2);
  if (this.slowMoRemaining > 0) this.slowMoRemaining = Math.max(0, this.slowMoRemaining - dt);
  if (this.overclockRemaining > 0) this.overclockRemaining = Math.max(0, this.overclockRemaining - dt);
  if (this.weaveActiveRemaining > 0) this.weaveActiveRemaining = Math.max(0, this.weaveActiveRemaining - dt);
  if (this.phantomGuardCooldown > 0) this.phantomGuardCooldown = Math.max(0, this.phantomGuardCooldown - dt);
  if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 36);
  if (this.zoomPunch > 0) this.zoomPunch = Math.max(0, this.zoomPunch - dt * 0.25);
  if (Math.abs(this.cameraRoll) > 0.0001) {
   this.cameraRoll *= Math.exp(-dt * 16);
   if (Math.abs(this.cameraRoll) < 0.0001) this.cameraRoll = 0;
  }

  for (const key of Object.keys(this.strikerCooldowns) as OmegaStrikerId[]) {
   if (this.strikerCooldowns[key] > 0) {
    this.strikerCooldowns[key] = Math.max(0, this.strikerCooldowns[key] - dt);
   }
  }
  if (this.radioBanner) {
   this.radioBanner.remaining -= dt;
   if (this.radioBanner.remaining <= 0) this.radioBanner = null;
  }

  // Gentle passive recharge of shield out-of-combat, rail capacitor + combo decay.
  if (state.phase === 'playing') {
   this.strikerCharge = Math.min(100, this.strikerCharge + dt * 2.2 * this.chargeRateMultiplier());
   const aliveEnemies = state.hazards.filter((h) => h.hp > 0).length;
   if (aliveEnemies > 0) {
    this.railCharge = Math.min(100, this.railCharge + dt * 3.5);
   }
   this.lockedTargetId = aliveEnemies > 0 ? (this.resolveLockedTarget(session)?.id ?? null) : null;
   if (aliveEnemies === 0 && this.shield < this.maxShield) {
    this.shield = Math.min(this.maxShield, this.shield + dt * 6);
   }
   if (this.comboTimer > 0) {
    this.comboTimer -= dt;
   } else if (this.comboCount > 0 || this.stylePoints > 0) {
    this.comboCount = 0;
    this.stylePoints = Math.max(0, this.stylePoints - dt * 42);
    this.currentRank = omegaStyleRankForPoints(this.stylePoints).current.tier;
   }
  }

  // 5. Advance Turrets, Drones, Moonwaves, Orbs, Beams, Lightnings, Domes, Detonations, Callouts.
  if (state.phase === 'playing') {
   for (let i = this.turrets.length - 1; i >= 0; i--) {
    const t = this.turrets[i]!;
    t.remaining -= dt;
    t.fireTimer -= dt;
    if (t.remaining <= 0) {
     this.turrets.splice(i, 1);
     continue;
    }
    const target = state.hazards
     .filter((h) => h.hp > 0)
     .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
    if (target) {
     t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
     if (t.fireTimer <= 0 && Math.hypot(target.x - t.x, target.y - t.y) <= 440) {
      t.fireTimer = 0.42;
      const tDealt = session.engine.damageProtocolConstruct(target.id, 14);
      if (tDealt > 0) this.pushDamageNumber(target.x, target.y - 12, tDealt, 'blade');
      this.marks.set(target.id, Math.min(3, (this.marks.get(target.id) ?? 0) + 1));
      this.beams.push({
       x1: t.x,
       y1: t.y - 22,
       x2: target.x,
       y2: target.y - 24,
       colorRgb: '52,211,153',
       isPillar: false,
       age: 0,
       duration: 0.08,
      });
     }
    }
   }

   for (let i = this.drones.length - 1; i >= 0; i--) {
    const dr = this.drones[i]!;
    dr.remaining -= dt;
    if (dr.remaining <= 0) {
     this.drones.splice(i, 1);
     continue;
    }
    const target = state.hazards
     .filter((h) => h.hp > 0)
     .sort((a, b) => Math.hypot(a.x - dr.x, a.y - dr.y) - Math.hypot(b.x - dr.x, b.y - dr.y))[0];
    if (target) {
     const dx = target.x - dr.x;
     const dy = target.y - dr.y;
     const dist = Math.hypot(dx, dy) || 1;
     dr.vx = (dx / dist) * 340;
     dr.vy = (dy / dist) * 340;
     dr.x += dr.vx * dt;
     dr.y += dr.vy * dt;
     if (dist <= 30) {
      const drDealt = session.engine.damageProtocolConstruct(target.id, 24);
      if (drDealt > 0) this.pushDamageNumber(target.x, target.y - 14, drDealt, 'detonate');
      this.marks.set(target.id, Math.min(3, (this.marks.get(target.id) ?? 0) + 1));
      this.detonations.push({ x: target.x, y: target.y, radius: 68, stacks: 1, age: 0, duration: 0.22 });
      this.drones.splice(i, 1);
     }
    } else {
     dr.x += (player.x - 28 - dr.x) * Math.min(1, dt * 4);
     dr.y += (player.y - 32 - dr.y) * Math.min(1, dt * 4);
    }
   }

   for (let i = this.waves.length - 1; i >= 0; i--) {
    const wv = this.waves[i]!;
    wv.age += dt;
    wv.x += wv.vx * dt;
    wv.y += wv.vy * dt;
    for (const h of state.hazards) {
     if (h.hp <= 0 || wv.hitIds.has(h.id)) continue;
     if (Math.hypot(h.x - wv.x, h.y - wv.y) <= wv.radius) {
      wv.hitIds.add(h.id);
      const wvDealt = session.engine.damageProtocolConstruct(h.id, wv.damage);
      if (wvDealt > 0) {
       this.pushDamageNumber(h.x, h.y - 14, wvDealt, 'blade_crit');
       this.pushSlashCut(h.x, h.y, wv.angle, wv.crimson ? '244,114,182' : '103,232,249', false);
      }
      this.marks.set(h.id, Math.min(3, (this.marks.get(h.id) ?? 0) + 1));
     }
    }
    if (wv.age >= wv.duration) this.waves.splice(i, 1);
   }

   for (let i = this.orbs.length - 1; i >= 0; i--) {
    const orb = this.orbs[i]!;
    orb.age += dt;
    const dx = player.x - orb.x;
    const dy = player.y - orb.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 260) {
     const pull = 440 + (260 - dist) * 2.2;
     orb.x += (dx / dist) * pull * dt;
     orb.y += (dy / dist) * pull * dt;
    }
    if (dist <= 34) {
     this.strikerCharge = Math.min(100, this.strikerCharge + orb.charge);
     this.shield = Math.min(this.maxShield, this.shield + 4);
     this.addStyle(orb.points);
     this.pendingEvents.push({ kind: 'pickup' });
     this.orbs.splice(i, 1);
    }
   }

   for (let i = this.domes.length - 1; i >= 0; i--) {
    const dm = this.domes[i]!;
    dm.remaining -= dt;
    if (dm.remaining <= 0) this.domes.splice(i, 1);
   }

   // 6. Auto-Flow Field Resonance: once threats are cleared, walking onto active console or exit interacts automatically.
   if (session.field && !session.gateTransit && session.run.phase === 'battle') {
    const hazardsLeft = state.hazards.some((h) => h.hp > 0);
    if (!hazardsLeft) {
     const progress = session.field.progress;
     if (progress.phase === 'objective') {
      const step = omegaFieldCurrentStep(session.field.plan, progress);
      if (step && Math.hypot(player.x - step.target.x, player.y - step.target.y) <= OMEGA_FIELD_INTERACT_RADIUS - 2) {
       const res = session.interact();
       if (res.success) {
        this.pushCallout(step.target.x, step.target.y - 54, '📡 자동 해킹 완료', '#67e8f9', 1.0);
        this.pendingEvents.push({ kind: 'auto_interact', detail: res.reason });
       }
      }
     } else if (progress.phase === 'exit') {
      const exit = session.field.plan.exit;
      if (Math.hypot(player.x - exit.x, player.y - exit.y) <= OMEGA_FIELD_INTERACT_RADIUS + 4) {
       const res = session.interact();
       if (res.success) {
        this.pushCallout(exit.x, exit.y - 54, '🚪 다음 구역 진입', '#70f0bd', 1.0);
        this.pendingEvents.push({ kind: 'auto_interact', detail: res.reason });
       }
      }
     }
    }
   }
  }

  for (let i = this.detonations.length - 1; i >= 0; i--) {
   const d = this.detonations[i]!;
   const next = { ...d, age: d.age + dt };
   if (next.age >= next.duration) this.detonations.splice(i, 1);
   else this.detonations[i] = next;
  }
  for (let i = this.lightnings.length - 1; i >= 0; i--) {
   const l = this.lightnings[i]!;
   l.age += dt;
   if (l.age >= l.duration) this.lightnings.splice(i, 1);
  }
  for (let i = this.beams.length - 1; i >= 0; i--) {
   const b = this.beams[i]!;
   b.age += dt;
   if (b.age >= b.duration) this.beams.splice(i, 1);
  }
  for (let i = this.callouts.length - 1; i >= 0; i--) {
   const c = this.callouts[i]!;
   c.age += dt;
   if (c.age >= c.duration) this.callouts.splice(i, 1);
  }
  for (let i = this.casings.length - 1; i >= 0; i--) {
   const c = this.casings[i]!;
   c.age += dt;
   c.x += c.vx * dt;
   c.y += c.vy * dt;
   c.vz -= 420 * dt;
   c.z += c.vz * dt;
   if (c.z < 0) {
    c.z = 0;
    c.vz = Math.abs(c.vz) * 0.42;
    c.vx *= 0.65;
    c.vy *= 0.65;
   }
   if (c.age >= c.duration) this.casings.splice(i, 1);
  }
  for (let i = this.slashCuts.length - 1; i >= 0; i--) {
   const sc = this.slashCuts[i]!;
   sc.age += dt;
   if (sc.age >= sc.duration) this.slashCuts.splice(i, 1);
  }
  for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
   const dn = this.damageNumbers[i]!;
   dn.age += dt;
   dn.x += dn.vx * dt;
   dn.vx *= Math.pow(0.08, dt);
   if (dn.age >= dn.duration) this.damageNumbers.splice(i, 1);
  }
  for (let i = this.killBursts.length - 1; i >= 0; i--) {
   const kb = this.killBursts[i]!;
   kb.age += dt;
   if (kb.age >= kb.duration) this.killBursts.splice(i, 1);
  }
  for (let i = this.sparks.length - 1; i >= 0; i--) {
   const sp = this.sparks[i]!;
   sp.age += dt;
   sp.x += sp.vx * dt;
   sp.y += sp.vy * dt;
   sp.vz -= 540 * dt;
   sp.z += sp.vz * dt;
   if (sp.z < 0) {
    sp.z = 0;
    sp.vz = Math.abs(sp.vz) * 0.44;
    sp.vx *= 0.72;
    sp.vy *= 0.72;
   }
   if (sp.age >= sp.duration) this.sparks.splice(i, 1);
  }
  for (let i = this.scorches.length - 1; i >= 0; i--) {
   const sc = this.scorches[i]!;
   sc.age += dt;
   if (sc.age >= sc.duration) this.scorches.splice(i, 1);
  }

  const timeScale = this.slowMoRemaining > 0 ? 0.24 : 1.0;
  const events = this.pendingEvents;
  this.pendingEvents = [];
  return {
   effectiveDt: dt * timeScale,
   events,
  };
 }

 hudSnapshot(session: OmegaProtocolCombatSession): OmegaZeroSignalHudSnapshot {
  const rank = omegaStyleRankForPoints(this.stylePoints);
  const victory = session.run.phase === 'victory';
  const clearedWaves = victory ? 15 : Math.max(0, session.run.victories);
  const finalEval = omegaComputeFinalScore({
   clearedWaves,
   maxCombo: this.maxCombo,
   detonations: this.detonationsCount,
   phantomDodges: this.phantomDodgesCount,
   kills: this.kills,
   peakPoints: this.peakPoints,
   victory,
  });
  const player = session.engine.state.player;
  let detonateReadyCount = 0;
  for (const h of session.engine.state.hazards) {
   if (h.hp <= 0) continue;
   if ((this.marks.get(h.id) ?? 0) > 0 && Math.hypot(h.x - player.x, h.y - player.y) <= 178) {
    detonateReadyCount++;
   }
  }
  return {
   loadoutId: this.loadoutId,
   dailyMode: this.dailyMode,
   stylePoints: Math.round(this.stylePoints),
   styleRank: rank.current.tier,
   styleTitle: rank.current.title,
   styleColorHex: rank.current.colorHex,
   styleBonusSummary: rank.current.bonusSummary,
   styleProgress: rank.progress,
   peakRank: this.peakRank,
   comboCount: this.comboCount,
   maxCombo: this.maxCombo,
   shield: Math.round(this.shield),
   maxShield: this.maxShield,
   strikerCharge: Math.floor(this.strikerCharge),
   unlockedStrikers: Array.from(this.unlockedStrikers),
   strikerCooldowns: { ...this.strikerCooldowns },
   overclockRemaining: this.overclockRemaining,
   slowMoRemaining: this.slowMoRemaining,
   activeEvos: omegaActiveEvolutions(session.run.owned),
   detonations: this.detonationsCount,
   phantomDodges: this.phantomDodgesCount,
   strikersCalled: this.strikersCalledTotal,
   strikersCalledById: { ...this.strikersCalledById },
   kills: this.kills,
   score: finalEval.score,
   finalGrade: finalEval.grade,
   radioBanner: this.radioBanner
    ? {
       text: this.radioBanner.text,
       accentHex: this.radioBanner.accentHex,
       seriesTag: this.radioBanner.seriesTag,
      }
    : null,
   activeCalloutsCount: this.callouts.length,
   weaponMode: this.weaponMode,
   railCharge: Math.floor(this.railCharge),
   railChargesReady: Math.floor(this.railCharge / 50),
   detonateReadyCount,
   nextBladeCombo: session.nextBladeCombo,
   weaveActiveRemaining: this.weaveActiveRemaining,
   lockedTargetId: this.lockedTargetId,
   railBurstsFired: this.railBurstsFired,
  };
 }
}
