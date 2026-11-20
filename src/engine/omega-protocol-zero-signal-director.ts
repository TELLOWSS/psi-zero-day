import type { Hazard } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import {
 OMEGA_FIELD_INTERACT_RADIUS,
 omegaFieldCurrentStep,
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
 | 'evo_unlock'
 | 'boss_entry'
 | 'wave_clear'
 | 'victory'
 | 'defeat'
 | 'auto_interact';

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
}

const RANK_ORDER: readonly OmegaStyleTier[] = ['D', 'C', 'B', 'A', 'S', 'SS', 'OMEGA'];

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
 shakeDirX = 0;
 shakeDirY = 0;
 cameraShake = 0;
 zoomPunch = 0;

 readonly detonations: OmegaActiveDetonation[] = [];
 readonly waves: OmegaActiveWave[] = [];
 readonly turrets: OmegaActiveTurret[] = [];
 readonly drones: OmegaActiveDrone[] = [];
 readonly lightnings: OmegaActiveLightning[] = [];
 readonly beams: OmegaActiveBeam[] = [];
 readonly orbs: OmegaActiveOrb[] = [];
 readonly domes: OmegaActiveDome[] = [];
 readonly callouts: OmegaFloatingCallout[] = [];

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

 tickHitstop(rawRealDt: number): boolean {
  if (this.hitstopRemaining <= 0) return false;
  const dt = Number.isFinite(rawRealDt) && rawRealDt > 0 ? Math.min(0.05, rawRealDt) : 0;
  this.hitstopRemaining = Math.max(0, this.hitstopRemaining - dt);
  if (this.impactFlash > 0) this.impactFlash = Math.max(0, this.impactFlash - dt * 2.8);
  if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 20);
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

   const prev = this.marks.get(ev.targetId) ?? 0;
   const nextMark = Math.min(3, prev + (this.overclockRemaining > 0 ? 2 : 1));
   this.marks.set(ev.targetId, nextMark);
   this.comboCount++;
   this.maxCombo = Math.max(this.maxCombo, this.comboCount);
   this.comboTimer = 3.2;
   this.addStyle(22);
   this.strikerCharge = Math.min(100, this.strikerCharge + 3.2 * this.chargeRateMultiplier());

   if (this.overclockRemaining > 0) {
    // Piercing railgun arc to nearest second target behind/near struck enemy.
    const secondary = hazards.find(
     (h) => h.hp > 0 && h.id !== ev.targetId && Math.hypot(h.x - ev.x, h.y - ev.y) <= 210,
    );
    if (secondary) {
     session.engine.damageProtocolConstruct(secondary.id, 14);
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
     session.engine.damageProtocolConstruct(h.id, 26);
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
  session.engine.state.ultimateCharge = Math.min(
   session.engine.state.maxUltimateCharge,
   session.engine.state.ultimateCharge + 18,
  );
  this.shield = Math.min(this.maxShield, this.shield + 8);
  this.addStyle(180);
  this.zoomPunch = 0.085;
  this.cameraShake = Math.max(this.cameraShake, 9);
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
     session.engine.damageProtocolConstruct(h.id, dmg);
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
      session.engine.damageProtocolConstruct(h.id, 18);
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
   this.zoomPunch = Math.max(this.zoomPunch, 0.045);
   this.pushCallout(target.x, target.y - 54, `💥 DETONATE ×${stacks}!`, stacks >= 3 ? '#fbbf24' : '#67e8f9', 0.9);
   this.pendingEvents.push({ kind: 'detonation', numeric: stacks });
  }

  // 2. Empowers close strike if Overclocked from Phantom Dodge.
  if (this.overclockRemaining > 0 && strike.hits > 0) {
   for (const h of session.engine.state.hazards) {
    if (h.hp > 0 && Math.hypot(h.x - reachCenterX, h.y - reachCenterY) <= 135) {
     session.engine.damageProtocolConstruct(h.id, 22);
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
    session.engine.damageProtocolConstruct(target.id, 120);
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
     session.engine.damageProtocolConstruct(h.id, 72);
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

  // 1. Intercept incoming Watch damage with Energy Shield when hpBeforeUpdate provided.
  if (typeof hpBeforeUpdate === 'number' && hpBeforeUpdate > player.hp && this.shield > 0 && state.phase === 'playing') {
   const lost = hpBeforeUpdate - player.hp;
   const absorbed = Math.min(this.shield, lost);
   this.shield = Math.max(0, this.shield - absorbed);
   player.hp = Math.min(player.maxHp, player.hp + absorbed);
   if (this.shield <= 0.01) {
    this.shield = 0;
    this.pendingEvents.push({ kind: 'shield_break' });
    this.pushCallout(player.x, player.y - 64, '🛡 SHIELD DOWN!', '#fca5a5', 0.9);
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
    if (evos.includes('signal_swarm') && this.drones.length < 5) {
     this.drones.push({ x: player.x, y: player.y - 24, vx: 110, vy: -90, remaining: 4.5 });
    }
   }
  }
  this.snapshotAlive(session);

  // 4. Advance timers (using real unscaled dt so slow-mo feels crisp).
  if (this.hitstopRemaining > 0) this.hitstopRemaining = Math.max(0, this.hitstopRemaining - dt);
  if (this.impactFlash > 0) this.impactFlash = Math.max(0, this.impactFlash - dt * 3.4);
  if (this.slowMoRemaining > 0) this.slowMoRemaining = Math.max(0, this.slowMoRemaining - dt);
  if (this.overclockRemaining > 0) this.overclockRemaining = Math.max(0, this.overclockRemaining - dt);
  if (this.phantomGuardCooldown > 0) this.phantomGuardCooldown = Math.max(0, this.phantomGuardCooldown - dt);
  if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 36);
  if (this.zoomPunch > 0) this.zoomPunch = Math.max(0, this.zoomPunch - dt * 0.25);

  for (const key of Object.keys(this.strikerCooldowns) as OmegaStrikerId[]) {
   if (this.strikerCooldowns[key] > 0) {
    this.strikerCooldowns[key] = Math.max(0, this.strikerCooldowns[key] - dt);
   }
  }
  if (this.radioBanner) {
   this.radioBanner.remaining -= dt;
   if (this.radioBanner.remaining <= 0) this.radioBanner = null;
  }

  // Gentle passive recharge of shield out-of-combat + combo decay.
  if (state.phase === 'playing') {
   this.strikerCharge = Math.min(100, this.strikerCharge + dt * 2.2 * this.chargeRateMultiplier());
   const aliveEnemies = state.hazards.filter((h) => h.hp > 0).length;
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
      session.engine.damageProtocolConstruct(target.id, 14);
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
      session.engine.damageProtocolConstruct(target.id, 24);
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
      session.engine.damageProtocolConstruct(h.id, wv.damage);
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
  };
 }
}
