export type HazardType = 'UNHELMETED' | 'RUNAWAY_CART' | 'GAS_LEAK' | 'FALLING_DEBRIS' | 'CRANE_BOSS';

export interface Hazard {
  readonly id: string;
  readonly type: HazardType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  expValue: number;
  isStunned?: number; // duration in seconds
  vx?: number;
  vy?: number;
}

export interface Projectile {
  readonly id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  duration: number; // remaining life
  pierce: number;
  kind: 'radio' | 'extinguisher' | 'drone_laser' | 'cone_trap';
}

export interface SafetyDrop {
  readonly id: string;
  x: number;
  y: number;
  exp: number;
  isHeal?: boolean;
}

export type PerkId =
  | 'radio_boost'
  | 'extinguisher'
  | 'floodlight'
  | 'cone_trap'
  | 'safety_drone'
  | 'steel_boots'
  | 'magnet_beacon'
  | 'safety_harness'
  | 'quick_reflexes';

export interface Perk {
  readonly id: PerkId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly level: number;
  readonly maxLevel: number;
  readonly category: 'weapon' | 'support';
}

export interface PlayerStats {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  invincibleTime: number;
  pickupRadius: number;
  cooldownReduction: number;
  damageMultiplier: number;
  regenRate: number;
}

export interface SurvivorsGameState {
  phase: 'ready' | 'playing' | 'paused' | 'levelup' | 'victory' | 'defeat';
  gameTime: number; // in seconds
  maxTime: number; // target survival time (e.g. 180s)
  player: PlayerStats;
  hazards: Hazard[];
  projectiles: Projectile[];
  drops: SafetyDrop[];
  level: number;
  currentExp: number;
  nextLevelExp: number;
  score: number;
  hazardsNeutralized: number;
  activePerks: Record<PerkId, number>; // perkId -> current level
  perkOptions: Perk[];
  droneAngle?: number;
}
