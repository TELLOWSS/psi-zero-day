/**
 * OMEGA PROTOCOL — Pure Domain Types, Sector Data, Weapons, Upgrades, & 3D Perspective Math.
 * Pure ES2022 only: no React, DOM, Canvas, Phaser, Zod, or storage dependencies.
 */

export type OmegaSectorId = 'sector_1' | 'sector_2' | 'sector_3' | 'sector_4';
export type OmegaWeaponId = 'pulse' | 'scatter' | 'rail';
export type OmegaCoverLane = 0 | 1 | 2;
export type OmegaPosture = 'cover' | 'peek' | 'dash';
export type OmegaRank = 'S' | 'A' | 'B' | 'C';
export type OmegaQualityPreset = 'high' | 'balanced' | 'low';

export type OmegaEnemyKind =
  | 'trooper'
  | 'drone'
  | 'breacher'
  | 'sniper'
  | 'turret'
  | 'boss_gatekeeper'
  | 'boss_widow'
  | 'boss_phantom'
  | 'boss_aeon';

export type OmegaPropKind = 'barrel' | 'emp' | 'supply';

export type OmegaUpgradeId =
  | 'rail_capacitor'
  | 'nano_barriers'
  | 'weakpoint_optics'
  | 'reflex_thrusters'
  | 'chain_rounds'
  | 'omega_siphon';

export type OmegaAudioCueKind =
  | 'pulse'
  | 'scatter'
  | 'rail'
  | 'hit'
  | 'weakpoint'
  | 'ricochet'
  | 'barrier_hit'
  | 'barrier_break'
  | 'sniper_lock'
  | 'sniper_fire'
  | 'counter_break'
  | 'rocket_launch'
  | 'intercept'
  | 'explosion'
  | 'emp'
  | 'supply'
  | 'dash'
  | 'perfect_evade'
  | 'reload_start'
  | 'reload_perfect'
  | 'overdrive'
  | 'sector_clear'
  | 'boss_warn'
  | 'player_hit'
  | 'victory'
  | 'defeat';

export interface OmegaEnemySpawnSpec {
  readonly kind: OmegaEnemyKind;
  readonly worldX: number;
  readonly z: number;
  readonly elevation?: number;
  readonly laneHint?: OmegaCoverLane;
  readonly delay: number;
}

export interface OmegaPropSpawnSpec {
  readonly kind: OmegaPropKind;
  readonly worldX: number;
  readonly z: number;
}

export interface OmegaWaveSpec {
  readonly label: string;
  readonly isBossWave?: boolean;
  readonly spawns: readonly OmegaEnemySpawnSpec[];
  readonly props?: readonly OmegaPropSpawnSpec[];
}

export interface OmegaSectorPalette {
  readonly skyTop: string;
  readonly fog: string;
  readonly accent: string;
  readonly accentAlt: string;
  readonly reflection: string;
}

export interface OmegaSectorConfig {
  readonly id: OmegaSectorId;
  readonly index: number;
  readonly code: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly environmentHint: string;
  readonly backdropUri: string;
  readonly horizonY: number;
  readonly rainDensity: number;
  readonly palette: OmegaSectorPalette;
  readonly bossKind: OmegaEnemyKind;
  readonly bossTitleKo: string;
  readonly bossTitleEn: string;
  readonly bossMechanicKo: string;
  readonly comms: {
    readonly intro: string;
    readonly boss: string;
    readonly clear: string;
  };
  readonly waves: readonly OmegaWaveSpec[];
}

export interface OmegaWeaponConfig {
  readonly id: OmegaWeaponId;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly badge: string;
  readonly magazineSize: number;
  readonly fireInterval: number;
  readonly reloadDuration: number;
  readonly activeReloadWindow: readonly [number, number];
  readonly damage: number;
  readonly weakpointMultiplier: number;
  readonly pellets: number;
  readonly spread: number;
  readonly pierceShield: boolean;
  readonly railRechargeSeconds?: number;
  readonly descriptionKo: string;
}

export interface OmegaUpgradeConfig {
  readonly id: OmegaUpgradeId;
  readonly nameKo: string;
  readonly tag: string;
  readonly descriptionKo: string;
}

export interface OmegaProjectedPoint {
  readonly x: number;
  readonly y: number;
  readonly groundY: number;
  readonly scale: number;
  readonly depthFactor: number;
}

export interface OmegaRunRankStats {
  readonly damageTaken: number;
  readonly weakpointKills: number;
  readonly totalKills: number;
  readonly maxCombo: number;
  readonly perfectEvades: number;
  readonly counterBreaks: number;
  readonly elapsedSeconds: number;
}

export const OMEGA_COVER_LANE_X: readonly [number, number, number] = [-0.26, 0, 0.26];

export const OMEGA_WEAPONS: Record<OmegaWeaponId, OmegaWeaponConfig> = {
  pulse: {
    id: 'pulse',
    nameKo: '펄스 피스톨',
    nameEn: 'PULSE PISTOL',
    badge: '1',
    magazineSize: 18,
    fireInterval: 0.135,
    reloadDuration: 1.15,
    activeReloadWindow: [0.46, 0.68],
    damage: 28,
    weakpointMultiplier: 2.25,
    pellets: 1,
    spread: 0.004,
    pierceShield: false,
    descriptionKo: '정밀 연사형 주무장. 약점 사격 및 타이밍 액티브 리로드에 최적화.',
  },
  scatter: {
    id: 'scatter',
    nameKo: '플라즈마 샷건',
    nameEn: 'SCATTER PULSE',
    badge: '2',
    magazineSize: 6,
    fireInterval: 0.42,
    reloadDuration: 1.35,
    activeReloadWindow: [0.46, 0.68],
    damage: 16,
    weakpointMultiplier: 1.75,
    pellets: 5,
    spread: 0.048,
    pierceShield: false,
    descriptionKo: '근접 돌격병과 날아오는 3D 미사일 요격에 강한 광역 산탄총.',
  },
  rail: {
    id: 'rail',
    nameKo: '레일 랜스',
    nameEn: 'RAIL LANCE',
    badge: '3',
    magazineSize: 3,
    fireInterval: 0.48,
    reloadDuration: 1.0,
    activeReloadWindow: [0.46, 0.68],
    damage: 130,
    weakpointMultiplier: 2.5,
    pellets: 1,
    spread: 0,
    pierceShield: true,
    railRechargeSeconds: 3.4,
    descriptionKo: '전면 방패와 중장갑을 관통하는 고에너지 레일건. 자동 충전 + 퍼펙트 회피 시 즉시 보충.',
  },
};

export const OMEGA_WEAPON_ORDER: readonly OmegaWeaponId[] = ['pulse', 'scatter', 'rail'];

export const OMEGA_UPGRADES: readonly OmegaUpgradeConfig[] = [
  {
    id: 'rail_capacitor',
    nameKo: '고압 레일 축전기',
    tag: 'ARMAMENT',
    descriptionKo: '레일 랜스 충전 속도 +35% 및 레일 탄착 폭풍 피해 +25%.',
  },
  {
    id: 'nano_barriers',
    nameKo: '나노 콘크리트 방벽',
    tag: 'DEFENSE',
    descriptionKo: '모든 엄폐 방벽 최대 내구도 +45, 붕괴 후 복구 속도 +40% 및 즉시 전면 수리.',
  },
  {
    id: 'weakpoint_optics',
    nameKo: '시냅스 약점 조준경',
    tag: 'PRECISION',
    descriptionKo: '약점 배율 +0.45배 상승, 약점 처치 시 오메가 게이지 +6 추가 충전.',
  },
  {
    id: 'reflex_thrusters',
    nameKo: '리플렉스 회피 부스터',
    tag: 'MOBILITY',
    descriptionKo: '대시 무적 시간 +0.12초, 퍼펙트 회피 슬로모션 지속시간 +0.45초 연장.',
  },
  {
    id: 'chain_rounds',
    nameKo: '아크 연쇄 탄두',
    tag: 'BALLISTICS',
    descriptionKo: '약점 명중 및 오버차지 탄환이 주변 적에게 38% 전격 연쇄 피해.',
  },
  {
    id: 'omega_siphon',
    nameKo: '오메가 에너지 사이펀',
    tag: 'CORE',
    descriptionKo: '적 처치 및 카운터 브레이크 시 실드 +8 회복, 오버드라이브 지속시간 +1.5초.',
  },
];

export const OMEGA_SECTORS: readonly OmegaSectorConfig[] = [
  {
    id: 'sector_1',
    index: 1,
    code: 'SECTOR 01',
    nameKo: '서측 진입 게이트',
    nameEn: 'WEST ACCESS GATE',
    environmentHint: '폭우 속 외곽 검문 게이트 · 야간 탐조등과 콘크리트 바리케이드 진입로',
    backdropUri: '/assets/omega/zones/zone-1-gate.webp',
    horizonY: 0.54,
    rainDensity: 1.0,
    palette: {
      skyTop: '#0b091c',
      fog: '#291a4b',
      accent: '#ff48b8',
      accentAlt: '#ffb84d',
      reflection: '#b24aff',
    },
    bossKind: 'boss_gatekeeper',
    bossTitleKo: '아이언 게이트키퍼',
    bossTitleEn: 'IRON GATEKEEPER',
    bossMechanicKo: '양 어깨 미사일 포드를 먼저 파괴해 흉부 코어를 노출시키세요.',
    comms: {
      intro: 'AIRA: 1구역 서측 게이트 진입 확인. 시야 확보 완료, 제압을 시작한다.',
      boss: '경고! 중장갑 바리케이드 워커 [IRON GATEKEEPER] 접근! 어깨 포드를 노려라!',
      clear: 'AIRA: 1구역 게이트 봉쇄 해제. 다음 철골 자재 야드로 돌파한다!',
    },
    waves: [
      {
        label: 'WAVE 1-1 · 외곽 순찰선 돌파',
        props: [
          { kind: 'barrel', worldX: -0.34, z: 0.54 },
          { kind: 'supply', worldX: 0.36, z: 0.62 },
        ],
        spawns: [
          { kind: 'trooper', worldX: -0.28, z: 0.58, delay: 0.2 },
          { kind: 'trooper', worldX: 0.22, z: 0.66, delay: 0.5 },
          { kind: 'drone', worldX: -0.05, z: 0.72, elevation: 0.34, delay: 0.8 },
          { kind: 'trooper', worldX: 0.35, z: 0.52, delay: 1.3 },
        ],
      },
      {
        label: 'WAVE 1-2 · 폭동 진압조 교전',
        props: [
          { kind: 'barrel', worldX: 0.04, z: 0.48 },
          { kind: 'emp', worldX: -0.32, z: 0.64 },
        ],
        spawns: [
          { kind: 'breacher', worldX: -0.14, z: 0.72, delay: 0.2 },
          { kind: 'sniper', worldX: 0.34, z: 0.84, delay: 0.45 },
          { kind: 'drone', worldX: 0.16, z: 0.58, elevation: 0.36, delay: 0.9 },
          { kind: 'trooper', worldX: -0.36, z: 0.56, delay: 1.2 },
          { kind: 'turret', worldX: 0.26, z: 0.76, delay: 1.6 },
        ],
      },
      {
        label: 'SECTOR 01 BOSS · IRON GATEKEEPER',
        isBossWave: true,
        props: [
          { kind: 'barrel', worldX: -0.36, z: 0.52 },
          { kind: 'emp', worldX: 0.36, z: 0.52 },
          { kind: 'supply', worldX: 0, z: 0.44 },
        ],
        spawns: [
          { kind: 'boss_gatekeeper', worldX: 0, z: 0.68, delay: 0.6 },
        ],
      },
    ],
  },
  {
    id: 'sector_2',
    index: 2,
    code: 'SECTOR 02',
    nameKo: '철골 자재 야드',
    nameEn: 'STEEL GIRDER YARD',
    environmentHint: 'H빔 갠트리 크레인과 침수된 야적장 · 복층 구조물 매복 저격전',
    backdropUri: '/assets/omega/zones/zone-2-yard.webp',
    horizonY: 0.54,
    rainDensity: 1.15,
    palette: {
      skyTop: '#090b1e',
      fog: '#231b52',
      accent: '#ff48b8',
      accentAlt: '#4cf3ff',
      reflection: '#5de2ff',
    },
    bossKind: 'boss_widow',
    bossTitleKo: '갠트리 위도우',
    bossTitleEn: 'GANTRY WIDOW',
    bossMechanicKo: '크레인 레일을 횡단하는 현수 포격기. 레일 빔 예고를 대시로 회피하세요.',
    comms: {
      intro: 'AIRA: 2구역 철골 야드. 복층 크레인 상단에서 저격 반응 다수, 엄폐에 주의하라.',
      boss: '상공 경보! 현수 포격기 [GANTRY WIDOW] 강하! 레일 포격 궤적을 피해 움직여!',
      clear: 'AIRA: 갠트리 봉쇄 돌파 완료. 고공 크레인 데크 승강로로 이동한다.',
    },
    waves: [
      {
        label: 'WAVE 2-1 · 철골 통로 매복',
        props: [
          { kind: 'barrel', worldX: 0.26, z: 0.56 },
          { kind: 'emp', worldX: -0.22, z: 0.64 },
        ],
        spawns: [
          { kind: 'sniper', worldX: -0.34, z: 0.86, elevation: 0.14, delay: 0.2 },
          { kind: 'breacher', worldX: 0.1, z: 0.66, delay: 0.45 },
          { kind: 'turret', worldX: -0.2, z: 0.74, delay: 0.9 },
          { kind: 'drone', worldX: 0.32, z: 0.55, elevation: 0.36, delay: 1.1 },
          { kind: 'trooper', worldX: 0.22, z: 0.54, delay: 1.45 },
        ],
      },
      {
        label: 'WAVE 2-2 · 중화기 포위망',
        props: [
          { kind: 'barrel', worldX: -0.1, z: 0.5 },
          { kind: 'supply', worldX: 0.34, z: 0.56 },
        ],
        spawns: [
          { kind: 'breacher', worldX: -0.26, z: 0.72, delay: 0.2 },
          { kind: 'breacher', worldX: 0.24, z: 0.72, delay: 0.5 },
          { kind: 'sniper', worldX: 0.02, z: 0.88, elevation: 0.16, delay: 0.8 },
          { kind: 'drone', worldX: -0.35, z: 0.6, elevation: 0.38, delay: 1.2 },
          { kind: 'turret', worldX: 0.34, z: 0.78, delay: 1.5 },
        ],
      },
      {
        label: 'SECTOR 02 BOSS · GANTRY WIDOW',
        isBossWave: true,
        props: [
          { kind: 'emp', worldX: -0.34, z: 0.52 },
          { kind: 'barrel', worldX: 0.34, z: 0.54 },
          { kind: 'supply', worldX: -0.08, z: 0.46 },
        ],
        spawns: [
          { kind: 'boss_widow', worldX: 0, z: 0.68, elevation: 0.28, delay: 0.55 },
        ],
      },
    ],
  },
  {
    id: 'sector_3',
    index: 3,
    code: 'SECTOR 03',
    nameKo: '고공 크레인 데크',
    nameEn: 'SKYLINE CRANE DECK',
    environmentHint: '폭풍우 위 초고층 스카이웨이 브리지 · 탐조등 교차와 초고속 기동전',
    backdropUri: '/assets/omega/zones/zone-3-deck.webp',
    horizonY: 0.55,
    rainDensity: 1.28,
    palette: {
      skyTop: '#060a1e',
      fog: '#1e1c5a',
      accent: '#ff49c0',
      accentAlt: '#3df5ff',
      reflection: '#ff5cd2',
    },
    bossKind: 'boss_phantom',
    bossTitleKo: '팬텀 뱅가드',
    bossTitleEn: 'PHANTOM VANGUARD',
    bossMechanicKo: '스카이웨이를 도약하는 암살기. 붉은 락온 순간 대시로 퍼펙트 회피를 노리세요!',
    comms: {
      intro: 'AIRA: 3구역 고공 데크 도달. 강풍과 교차 포격 주의, 신속히 제압한다.',
      boss: '적 고기동 기체 [PHANTOM VANGUARD] 포착! 조준 락온 순간 퍼펙트 회피로 역전하라!',
      clear: 'AIRA: 스카이웨이 장악 완료. 오메가 코어 리액터 최종 구역으로 돌입한다!',
    },
    waves: [
      {
        label: 'WAVE 3-1 · 스카이웨이 교차 사격',
        props: [
          { kind: 'emp', worldX: 0.0, z: 0.52 },
          { kind: 'barrel', worldX: -0.35, z: 0.58 },
        ],
        spawns: [
          { kind: 'drone', worldX: -0.3, z: 0.62, elevation: 0.36, delay: 0.2 },
          { kind: 'drone', worldX: 0.3, z: 0.62, elevation: 0.36, delay: 0.4 },
          { kind: 'sniper', worldX: -0.18, z: 0.86, delay: 0.7 },
          { kind: 'sniper', worldX: 0.2, z: 0.86, delay: 1.0 },
          { kind: 'turret', worldX: 0.0, z: 0.72, delay: 1.4 },
        ],
      },
      {
        label: 'WAVE 3-2 · 방패 돌격 편대',
        props: [
          { kind: 'barrel', worldX: 0.28, z: 0.48 },
          { kind: 'supply', worldX: -0.3, z: 0.48 },
          { kind: 'emp', worldX: 0.0, z: 0.64 },
        ],
        spawns: [
          { kind: 'breacher', worldX: -0.18, z: 0.66, delay: 0.2 },
          { kind: 'breacher', worldX: 0.18, z: 0.66, delay: 0.45 },
          { kind: 'trooper', worldX: -0.38, z: 0.55, delay: 0.85 },
          { kind: 'trooper', worldX: 0.38, z: 0.55, delay: 1.05 },
          { kind: 'sniper', worldX: 0.0, z: 0.88, delay: 1.45 },
          { kind: 'drone', worldX: 0.25, z: 0.54, elevation: 0.4, delay: 1.75 },
        ],
      },
      {
        label: 'SECTOR 03 BOSS · PHANTOM VANGUARD',
        isBossWave: true,
        props: [
          { kind: 'emp', worldX: -0.32, z: 0.54 },
          { kind: 'supply', worldX: 0.32, z: 0.52 },
        ],
        spawns: [
          { kind: 'boss_phantom', worldX: 0, z: 0.74, delay: 0.55 },
        ],
      },
    ],
  },
  {
    id: 'sector_4',
    index: 4,
    code: 'SECTOR 04',
    nameKo: '오메가 코어 리액터',
    nameEn: 'OMEGA CORE REACTOR',
    environmentHint: '오메가 에너지 코어 제어실 · 회전 보호 파일론과 최종 프로토콜 결전',
    backdropUri: '/assets/omega/zones/zone-4-core.webp',
    horizonY: 0.54,
    rainDensity: 0.92,
    palette: {
      skyTop: '#0c0519',
      fog: '#35104b',
      accent: '#ff38b8',
      accentAlt: '#ffd257',
      reflection: '#f04bff',
    },
    bossKind: 'boss_aeon',
    bossTitleKo: '오메가 이온',
    bossTitleEn: 'OMEGA AEON',
    bossMechanicKo: '1페이즈 회전 코어 파일론을 파괴하고, 2페이즈 코어 빔을 피해 중앙 오메가 아이를 격파하세요!',
    comms: {
      intro: 'AIRA: 최종 구역 오메가 리액터 도착. 모든 화력을 집중해 프로토콜 코어를 정지시킨다!',
      boss: 'OMEGA AEON 각성! 회전 파일론 실드를 무너뜨리고 오메가 코어를 직접 타격하라!',
      clear: 'AIRA: 오메가 코어 완전 정지 확인. 작전 종료 — 전 구역 안전 확보 완료.',
    },
    waves: [
      {
        label: 'WAVE 4-1 · 리액터 외곽 경비대',
        props: [
          { kind: 'barrel', worldX: -0.25, z: 0.52 },
          { kind: 'emp', worldX: 0.25, z: 0.52 },
          { kind: 'supply', worldX: 0.0, z: 0.46 },
        ],
        spawns: [
          { kind: 'turret', worldX: -0.32, z: 0.74, delay: 0.2 },
          { kind: 'turret', worldX: 0.32, z: 0.74, delay: 0.45 },
          { kind: 'breacher', worldX: 0.0, z: 0.68, delay: 0.8 },
          { kind: 'sniper', worldX: -0.2, z: 0.88, delay: 1.2 },
          { kind: 'drone', worldX: 0.22, z: 0.56, elevation: 0.36, delay: 1.5 },
        ],
      },
      {
        label: 'SECTOR 04 FINAL BOSS · OMEGA AEON',
        isBossWave: true,
        props: [
          { kind: 'emp', worldX: -0.35, z: 0.5 },
          { kind: 'barrel', worldX: 0.35, z: 0.5 },
          { kind: 'supply', worldX: 0.0, z: 0.42 },
        ],
        spawns: [
          { kind: 'boss_aeon', worldX: 0, z: 0.74, elevation: 0.16, delay: 0.7 },
        ],
      },
    ],
  },
];

export function getOmegaSector(id: OmegaSectorId): OmegaSectorConfig {
  return OMEGA_SECTORS.find(sector => sector.id === id) ?? OMEGA_SECTORS[0]!;
}

/**
 * Shared 2.5D perspective projection used identically by simulation hitboxes and Canvas depth rendering.
 * `z` ranges from 0 (player cover line) to 1 (deep horizon).
 */
export function projectOmegaPoint(
  worldX: number,
  elevation: number,
  z: number,
  horizonY: number,
  camX: number,
  camY: number,
): OmegaProjectedPoint {
  const clampedZ = Math.max(0, Math.min(1.25, z));
  const t = 1 / (1 + clampedZ * 2.4);
  const scale = 0.28 + t * 0.78;
  const nearGroundY = 0.84;
  const groundY = horizonY + (nearGroundY - horizonY) * t - camY * (0.22 + t * 0.72);
  const x = 0.5 + (worldX - camX) * scale;
  const y = groundY - elevation * t * 0.58;
  return { x, y, groundY, scale, depthFactor: t };
}

export function computeOmegaRank(stats: OmegaRunRankStats): OmegaRank {
  let points = 0;
  if (stats.damageTaken <= 20) points += 3;
  else if (stats.damageTaken <= 65) points += 2;
  else if (stats.damageTaken <= 120) points += 1;

  const weakRatio = stats.totalKills > 0 ? stats.weakpointKills / stats.totalKills : 0;
  if (weakRatio >= 0.45) points += 3;
  else if (weakRatio >= 0.25) points += 2;
  else if (weakRatio >= 0.1) points += 1;

  if (stats.maxCombo >= 18) points += 2;
  else if (stats.maxCombo >= 10) points += 1;

  if (stats.perfectEvades + stats.counterBreaks >= 4) points += 2;
  else if (stats.perfectEvades + stats.counterBreaks >= 2) points += 1;

  if (stats.elapsedSeconds <= 180) points += 1;

  if (points >= 9) return 'S';
  if (points >= 6) return 'A';
  if (points >= 4) return 'B';
  return 'C';
}
