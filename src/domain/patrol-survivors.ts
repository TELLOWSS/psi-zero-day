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

export type ProjectileKind =
  | 'radio'
  | 'extinguisher'
  | 'drone_laser'
  | 'cone_trap'
  | 'satellite_wave'
  | 'cryo_blast'
  | 'tesla_bolt'
  | 'emf_beam'
  | 'hunter_beam'
  | 'shout_shockwave';

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
  kind: ProjectileKind;
  scale?: number;
  color?: string;
}

export interface SafetyDrop {
  readonly id: string;
  x: number;
  y: number;
  exp: number;
  isHeal?: boolean;
}

export type BaseWeaponId =
  | 'radio_boost'
  | 'extinguisher'
  | 'floodlight'
  | 'cone_trap'
  | 'safety_drone';

export type SupportPerkId =
  | 'steel_boots'
  | 'magnet_beacon'
  | 'safety_harness'
  | 'quick_reflexes'
  | 'data_chip';

export type EvolutionPerkId =
  | 'satellite_broadcast'
  | 'cryo_blizzard'
  | 'tesla_dome'
  | 'emf_barricade'
  | 'hunter_swarm';

export type PerkId = BaseWeaponId | SupportPerkId | EvolutionPerkId;

export interface Perk {
  readonly id: PerkId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly level: number;
  readonly maxLevel: number;
  readonly category: 'weapon' | 'support' | 'evolution';
  readonly recipe?: {
    weapon: BaseWeaponId;
    support: SupportPerkId;
  };
}

export type CharacterId = 'yoon' | 'park' | 'jung';

export interface CharacterProfile {
  readonly id: CharacterId;
  readonly name: string;
  readonly role: string;
  readonly title: string;
  readonly description: string;
  readonly startingWeapon: BaseWeaponId;
  readonly avatar: string;
  readonly color: string;
}

export interface PermanentUpgrades {
  vitality: number;     // +HP per level (max 5)
  mobility: number;     // +Speed per level (max 5)
  intelligence: number; // +EXP magnet & gain (max 5)
  firstAid: number;     // 1 = revive with 50% HP once per run
  reroll: number;       // +1 reroll per level (max 3)
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
  critRate: number;
  regenRate: number;
}

export interface EvolutionBanner {
  title: string;
  subtitle: string;
  icon: string;
  timer: number;
}

export interface SurvivorsGameState {
  phase: 'ready' | 'playing' | 'paused' | 'levelup' | 'victory' | 'defeat';
  characterId: CharacterId;
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

  // Ultimate: 소장 샤우팅 (The Director's Roaring Shout)
  ultimateCharge: number; // 0 to 100
  maxUltimateCharge: number;
  directorShoutTimer: number; // countdown when active
  directorCutinPhase: 'none' | 'cutin' | 'shout' | 'invert' | 'recovering';

  // Evolution announcement banner
  evolutionBanner?: EvolutionBanner | null;

  // Boss Alert & Cinematic Time Dilation
  bossAlertTimer: number;
  bossName: string | null;
  timeDilation: number; // 1.0 = normal, 0.2 = slow-mo
  timeDilationTimer: number;

  // Meta stats & run perks
  psiCredits: number;
  permanentUpgrades: PermanentUpgrades;
  hasRevived: boolean;
  rerollsLeft: number;
}

