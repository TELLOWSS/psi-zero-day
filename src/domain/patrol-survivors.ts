import type { FieldTactics } from './survivors-field-tactics';
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
  isStageBoss?: boolean;
  motion?: {
    phase: 'approach' | 'warning' | 'charge' | 'cooldown' | 'fall' | 'spent';
    timer: number;
    directionX: number;
    directionY: number;
  };
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
  itemKind?: TacticalItemId;
}

export type TacticalItemId = 'record_beacon' | 'radio_battery' | 'control_kit' | 'field_rations' | 'route_lantern';

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

export type CanonicalCharacterId = 'player' | 'kang_taesik' | 'yoon_sungho' | 'lee_jaehoon' | 'lim_junho' | 'safety_monitor';
export type LegacyCharacterId = 'yoon' | 'park' | 'jung';
export type CharacterId = CanonicalCharacterId | LegacyCharacterId;

export interface CharacterProfile {
  readonly id: CharacterId;
  readonly name: string;
  readonly role: string;
  readonly title: string;
  readonly description: string;
  readonly startingWeapon: BaseWeaponId;
  readonly avatar: string;
  readonly portraitUri: string;
  readonly heroBannerUri: string;
  readonly quote: string;
  readonly traits: string[];
  readonly color: string;
  readonly statModifiers?: Partial<{
    maxHpBonus: number;
    speedBonus: number;
    pickupRadiusBonus: number;
    cooldownBonus: number;
    damageBonus: number;
  }>;
}

export interface FieldGuidePerkBonus {
  readonly fgId: string;
  readonly title: string;
  readonly targetKey: PerkId | 'maxHp' | 'speed' | 'pickupRadius' | 'defense';
  readonly value: number;
  readonly description: string;
}

export interface FieldGuideIntegrationSummary {
  readonly totalDiscovered: number;
  readonly activeBonuses: readonly FieldGuidePerkBonus[];
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
  stageBossSpawned?: boolean;
  stageBossNeutralized?: boolean;
  characterId: CharacterId;
  gameTime: number; // in seconds
  maxTime: number; // target survival time (e.g. 180s)
  player: PlayerStats;
  lastDamage?: { source: HazardType | 'CRANE_DROP'; amount: number; remaining: number };
  // Legacy hp/damage/entity IDs denote remaining risk and intervention strength.
  // People are guided to safety; they are not attack targets.
  resolvedWorkers?: Array<{id: string; x: number; y: number; remaining: number}>;
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
  controlKit?: { charges: number; remaining: number };
  fieldRecovery?: { remaining: number };
  routeLantern?: { remaining: number };
  itemNotice?: { id: string; kind: TacticalItemId; remaining: number };

  // Screen Juice & Impact Feedback
  hitStopTimer?: number;
  comboCount: number;
  comboTimer: number;
  lastKilledEvents?: Array<{ type: HazardType; x: number; y: number; isCrit?: boolean }>;

  // Stage & Level Architecture
  stageId: PatrolStageId;
  stage: PatrolStageDefinition;
  interactiveHazards: StageHazardObject[];
  environmentalKills: number;
  operationControlledZones?: string[];
  fieldTactics?: FieldTactics;
  starsEarned: [boolean, boolean, boolean];
  inFloodlight: boolean;
}

export const PATROL_STAGE_IDS = ['stage_01', 'stage_02', 'stage_03', 'stage_04', 'stage_05', 'stage_06', 'stage_07', 'stage_08', 'stage_09', 'stage_10', 'stage_11', 'stage_12', 'stage_13', 'stage_14', 'stage_15', 'stage_16', 'stage_17', 'stage_18', 'stage_19', 'stage_20'] as const;
export type PatrolStageId = typeof PATROL_STAGE_IDS[number];

export type StageHazardType =
  | 'explosive_barrel'
  | 'floodlight_tower'
  | 'crane_drop_zone'
  | 'slurry_puddle'
  | 'electric_transformer';

export interface StageHazardObject {
  id: string;
  type: StageHazardType;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'warning' | 'active' | 'cooldown' | 'destroyed';
  timer: number;
  value?: number;
  label?: string;
}

export interface StageStarChallenge {
  metric?: 'victory' | 'environmental' | 'neutralized' | 'shout' | 'hp' | 'boss';
  starIndex: 1 | 2 | 3;
  title: string;
  description: string;
  isCompleted: boolean;
  currentValue: number;
  targetValue: number;
}

export interface PatrolStageDefinition {
  id: PatrolStageId;
  stageNumber: number;
  siteProfileId?: string;
  hazardMix?: readonly HazardType[];
  difficulty?: number;
  name: string;
  subtitle: string;
  theme: 'surface_logistics' | 'deep_excavation' | 'highrise_slab' | 'curing_chamber' | 'datacenter';
  description: string;
  floorColor: string;
  gridColor: string;
  borderColor: string;
  ambientColor: string;
  icon: string;
  hazards: StageHazardObject[];
  starChallenges: [StageStarChallenge, StageStarChallenge, StageStarChallenge];
  bossName: string;
  bossTitle: string;
  bossType: HazardType;
  bossHp: number;
  narrative?: { speaker: CharacterId; brief: string; success: string; residual: string };
}
