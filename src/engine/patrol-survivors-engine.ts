import type {
  CharacterId,
  CharacterProfile,
  Hazard,
  HazardType,
  Perk,
  PerkId,
  PermanentUpgrades,
  PlayerStats,
  Projectile,
  SafetyDrop,
  SurvivorsGameState,
  BaseWeaponId,
  EvolutionPerkId,
  SupportPerkId,
  PatrolStageId,
  PatrolStageDefinition,
  StageHazardObject,
} from '../domain/patrol-survivors';

export const WORLD_WIDTH = 1400;
export const WORLD_HEIGHT = 900;
export const TARGET_SURVIVAL_TIME = 180; // 3 minutes

export const PATROL_STAGES: Record<PatrolStageId, PatrolStageDefinition> = {
  stage_01: {
    id: 'stage_01',
    stageNumber: 1,
    name: '서측 게이트 및 지상 복합 하역장',
    subtitle: 'Surface Logistics Hub',
    theme: 'surface_logistics',
    description: '야간 콘크리트 타설을 앞두고 덤프트럭과 자재가 뒤엉킨 하역 광장. 이동식 투광기를 활용하고 시너 드럼통을 유폭시켜 스웜을 섬멸하십시오.',
    floorColor: '#0c1219',
    gridColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: '#f59e0b',
    ambientColor: 'rgba(245, 158, 11, 0.05)',
    icon: '🏗️',
    hazards: [
      { id: 'barrel_01', type: 'explosive_barrel', x: 380, y: 280, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '인화성 드럼통' },
      { id: 'barrel_02', type: 'explosive_barrel', x: 1020, y: 300, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '인화성 드럼통' },
      { id: 'barrel_03', type: 'explosive_barrel', x: 420, y: 640, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '인화성 드럼통' },
      { id: 'barrel_04', type: 'explosive_barrel', x: 980, y: 660, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '인화성 드럼통' },
      { id: 'floodlight_01', type: 'floodlight_tower', x: 700, y: 220, radius: 180, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '야간 투광기' },
      { id: 'floodlight_02', type: 'floodlight_tower', x: 700, y: 680, radius: 180, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '야간 투광기' },
    ],
    starChallenges: [
      { starIndex: 1, title: '생존 작전 완수', description: '생존 시간 180초 달성 및 보스 격퇴', isCompleted: false, currentValue: 0, targetValue: 1 },
      { starIndex: 2, title: '환경 기믹 마스터', description: '드럼통 유폭으로 적 5마리 이상 처치', isCompleted: false, currentValue: 0, targetValue: 5 },
      { starIndex: 3, title: '소장 권한 마스터리', description: '현장소장 샤우팅 1회 이상 성공', isCompleted: false, currentValue: 0, targetValue: 1 },
    ],
    bossName: '폭주 덤프트럭 골리앗',
    bossTitle: 'HEAVY GOLIATH 25T',
    bossType: 'RUNAWAY_CART',
    bossHp: 800,
  },
  stage_02: {
    id: 'stage_02',
    stageNumber: 2,
    name: '대심도 기초 굴착 구역 (-4F)',
    subtitle: 'Deep Underground Pit',
    theme: 'deep_excavation',
    description: '지하 20m 대심도 굴착 참호. 지반 침하와 암반 균열로 발생한 진흙 슬러지 웅덩이를 피해 기동하며 자율 굴착기를 제압하십시오.',
    floorColor: '#120f0c',
    gridColor: 'rgba(180, 140, 100, 0.08)',
    borderColor: '#d97706',
    ambientColor: 'rgba(217, 119, 6, 0.06)',
    icon: '⛏️',
    hazards: [
      { id: 'slurry_01', type: 'slurry_puddle', x: 450, y: 350, radius: 130, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '진흙 웅덩이' },
      { id: 'slurry_02', type: 'slurry_puddle', x: 950, y: 550, radius: 140, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '진흙 웅덩이' },
      { id: 'barrel_05', type: 'explosive_barrel', x: 700, y: 450, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '인화성 드럼통' },
      { id: 'floodlight_03', type: 'floodlight_tower', x: 700, y: 200, radius: 170, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '굴착 투광등' },
    ],
    starChallenges: [
      { starIndex: 1, title: '지하 탈출 성공', description: '대심도 생존 시간 180초 달성', isCompleted: false, currentValue: 0, targetValue: 1 },
      { starIndex: 2, title: '토사 재해 극복', description: '적 80마리 이상 제압', isCompleted: false, currentValue: 0, targetValue: 80 },
      { starIndex: 3, title: '안전 수칙 준수', description: '체력 50% 이상 유지한 채 승리', isCompleted: false, currentValue: 0, targetValue: 50 },
    ],
    bossName: '자율 크롤러 굴삭기 베헤모스',
    bossTitle: 'EXCAVATOR BEHEMOTH',
    bossType: 'RUNAWAY_CART',
    bossHp: 1000,
  },
  stage_03: {
    id: 'stage_03',
    stageNumber: 3,
    name: '45층 초고층 메가 골조 슬래브',
    subtitle: 'High-Rise Superframe Slab',
    theme: 'highrise_slab',
    description: '외벽이 트인 180m 초고층 슬래브. 타워크레인 와이어가 휘몰아치는 낙하 경고 구역에 적을 유인하여 5,000 압살 피해를 입히십시오.',
    floorColor: '#101720',
    gridColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: '#0284c7',
    ambientColor: 'rgba(2, 132, 199, 0.06)',
    icon: '🏢',
    hazards: [
      { id: 'crane_drop_01', type: 'crane_drop_zone', x: 700, y: 450, radius: 140, hp: 9999, maxHp: 9999, state: 'idle', timer: 10, label: '크레인 낙하 구역' },
      { id: 'crane_drop_02', type: 'crane_drop_zone', x: 380, y: 300, radius: 120, hp: 9999, maxHp: 9999, state: 'idle', timer: 16, label: '크레인 낙하 구역' },
      { id: 'crane_drop_03', type: 'crane_drop_zone', x: 1020, y: 600, radius: 120, hp: 9999, maxHp: 9999, state: 'idle', timer: 22, label: '크레인 낙하 구역' },
    ],
    starChallenges: [
      { starIndex: 1, title: '고공 풍압 극복', description: '45층 골조 생존 180초 달성', isCompleted: false, currentValue: 0, targetValue: 1 },
      { starIndex: 2, title: '낙하물 유인 압살', description: '크레인 낙하 구역으로 적 5마리 이상 압살', isCompleted: false, currentValue: 0, targetValue: 5 },
      { starIndex: 3, title: '타워크레인 격추', description: '보스 광폭화 크레인 아라크네 제압', isCompleted: false, currentValue: 0, targetValue: 1 },
    ],
    bossName: '광폭화 타워크레인 아라크네',
    bossTitle: 'TOWER CRANE ARACHNE',
    bossType: 'CRANE_BOSS',
    bossHp: 1200,
  },
  stage_04: {
    id: 'stage_04',
    stageNumber: 4,
    name: '혹한기 동절기 밀폐 양생 챔버',
    subtitle: 'Sub-Zero Winter Curing Chamber',
    theme: 'curing_chamber',
    description: '영하 15도 방풍 천막 내부. 바닥의 빙판 관성과 일산화탄소 위험을 이겨내고 초대형 콘크리트 펌프카를 격퇴하십시오.',
    floorColor: '#0a1622',
    gridColor: 'rgba(147, 197, 253, 0.09)',
    borderColor: '#38bdf8',
    ambientColor: 'rgba(56, 189, 248, 0.08)',
    icon: '❄️',
    hazards: [
      { id: 'barrel_06', type: 'explosive_barrel', x: 450, y: 300, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '가열기 연료통' },
      { id: 'barrel_07', type: 'explosive_barrel', x: 950, y: 600, radius: 22, hp: 40, maxHp: 40, state: 'idle', timer: 0, label: '가열기 연료통' },
      { id: 'slurry_03', type: 'slurry_puddle', x: 700, y: 450, radius: 150, hp: 9999, maxHp: 9999, state: 'active', timer: 0, label: '동결 빙판' },
    ],
    starChallenges: [
      { starIndex: 1, title: '동절기 혹한 극복', description: '혹한 양생실 생존 180초 달성', isCompleted: false, currentValue: 0, targetValue: 1 },
      { starIndex: 2, title: '화염 버너 유폭', description: '연료통 유폭 3회 이상 발동', isCompleted: false, currentValue: 0, targetValue: 3 },
      { starIndex: 3, title: '펌프카 격파', description: '인페르노 매머드 처치 성공', isCompleted: false, currentValue: 0, targetValue: 1 },
    ],
    bossName: '초대형 펌프카 인페르노 매머드',
    bossTitle: 'INFERNO PUMP MAMMOTH',
    bossType: 'RUNAWAY_CART',
    bossHp: 1400,
  },
  stage_05: {
    id: 'stage_05',
    stageNumber: 5,
    name: '하이퍼스케일 전산 플랜트',
    subtitle: 'Hyperscale Data Center Plant',
    theme: 'datacenter',
    description: '최종 결전지. 특고압 수전설비와 서버 랙이 늘어선 사이버네틱 시설. 제로 데이 AI 코어 프로토콜 오메가를 셧다운하십시오.',
    floorColor: '#070a10',
    gridColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: '#a855f7',
    ambientColor: 'rgba(168, 85, 247, 0.08)',
    icon: '⚡',
    hazards: [
      { id: 'trans_01', type: 'electric_transformer', x: 450, y: 300, radius: 30, hp: 60, maxHp: 60, state: 'idle', timer: 0, label: '특고압 변전반' },
      { id: 'trans_02', type: 'electric_transformer', x: 950, y: 600, radius: 30, hp: 60, maxHp: 60, state: 'idle', timer: 0, label: '특고압 변전반' },
      { id: 'crane_drop_04', type: 'crane_drop_zone', x: 700, y: 450, radius: 150, hp: 9999, maxHp: 9999, state: 'idle', timer: 10, label: '서지 방전 구역' },
    ],
    starChallenges: [
      { starIndex: 1, title: '제로 데이 셧다운', description: '데이터센터 180초 방어 및 코어 파괴', isCompleted: false, currentValue: 0, targetValue: 1 },
      { starIndex: 2, title: '변전반 아크 방전', description: '특고압 변전반 3회 이상 가동', isCompleted: false, currentValue: 0, targetValue: 3 },
      { starIndex: 3, title: '최종 사자후 피니시', description: '소장 샤우팅으로 피니시 달성', isCompleted: false, currentValue: 0, targetValue: 1 },
    ],
    bossName: '재해 예측 AI 코어 프로토콜 오메가',
    bossTitle: 'CORE PROTOCOL OMEGA',
    bossType: 'CRANE_BOSS',
    bossHp: 1800,
  },
};


export const CHARACTER_PROFILES: Record<CharacterId, CharacterProfile> = {
  player: {
    id: 'player',
    name: '윤안전 (정민주)',
    role: '공인 산업안전관리자',
    title: '안전 하한선 총괄 책임자',
    description: '원칙과 법적 기준을 수호하는 안전관리자. 태블릿 스마트 센서로 위험 탐색 반경 및 경험치 수집 +25%, 쿨다운 -10%.',
    startingWeapon: 'safety_drone',
    avatar: '👩‍💼',
    portraitUri: '/assets/episode01/characters/player-portrait.webp',
    heroBannerUri: '/assets/episode01/hires/key-art.webp',
    quote: '"법은 하한선이며, 안전은 타협의 대상이 아닙니다."',
    traits: ['✦ 스마트 태블릿 센서 탐색', '✦ 경험치 자석 반경 +30', '✦ 전 구역 작업중지권'],
    color: '#2563eb',
    statModifiers: { pickupRadiusBonus: 35, cooldownBonus: 0.1 },
  },
  kang_taesik: {
    id: 'kang_taesik',
    name: '강태식 (박기철)',
    role: '베테랑 골조반장',
    title: '30년 현장의 버팀목',
    description: '수십 년 현장 경험으로 다져진 강인한 피지컬과 통솔력. 최대 HP +60, 넉백 파워 +40%, 피해 감소.',
    startingWeapon: 'extinguisher',
    avatar: '👷‍♂️',
    portraitUri: '/assets/episode01/characters/kang-taesik-portrait.webp',
    heroBannerUri: '/assets/episode01/hires/kang-taesik-portrait.webp',
    quote: '"철근과 콘크리트는 거짓말 안 해. 안전 하한선 넘으면 다 무너지는 거여."',
    traits: ['✦ 최대 체력 +60', '✦ 분말 소화기 광역 압제', '✦ 넉백 충격파 +40%'],
    color: '#f97316',
    statModifiers: { maxHpBonus: 60, damageBonus: 0.2 },
  },
  yoon_sungho: {
    id: 'yoon_sungho',
    name: '윤성호',
    role: '철근 숙련 기능공',
    title: '철근 결속의 달인',
    description: '묵묵히 현장을 지탱하는 베테랑 철근공. 낙하물 완충 및 근접 제압 대미지 +30%, 든든한 맷집.',
    startingWeapon: 'cone_trap',
    avatar: '💪',
    portraitUri: '/assets/episode01/characters/yoon-sungho-portrait.webp',
    heroBannerUri: '/assets/episode01/hires/yoon-sungho-portrait.webp',
    quote: '"반장님이랑 관리자님 믿고 묶습니다. 결속선 하나도 대충 안 옙니다."',
    traits: ['✦ 방호 콘 바리케이드', '✦ 근접 충돌 피해 -30%', '✦ 이동식 방호벽 가설'],
    color: '#d97706',
    statModifiers: { maxHpBonus: 30, damageBonus: 0.25 },
  },
  lee_jaehoon: {
    id: 'lee_jaehoon',
    name: '이재훈',
    role: '공사팀 시공대리',
    title: '도면·공정 분석관',
    description: '정밀 설계와 공정 효율을 계산하는 시공 엔지니어. 크리티컬 확률 +20%, 쿨다운 단축.',
    startingWeapon: 'floodlight',
    avatar: '📐',
    portraitUri: '/assets/episode01/characters/lee-jaehoon-portrait.webp',
    heroBannerUri: '/assets/episode01/characters/lee-jaehoon-portrait.webp',
    quote: '"도면상 규격과 실제 현장 설치 상태가 다르면 즉시 시정해야 합니다."',
    traits: ['✦ 360도 투광등 사각 제거', '✦ 크리티컬 확률 +20%', '✦ 시공 오차 원거리 보정'],
    color: '#0284c7',
    statModifiers: { cooldownBonus: 0.15 },
  },
  lim_junho: {
    id: 'lim_junho',
    name: '임준호',
    role: '현장 신입 신호수',
    title: '고속 기동 신호 유도원',
    description: '누구보다 빠른 발과 예리한 시야로 위험을 먼저 발견하는 신호수. 이동 속도 +40, 회피 기동 특화.',
    startingWeapon: 'radio_boost',
    avatar: '🦺',
    portraitUri: '/assets/episode01/characters/lim-junho-portrait.webp',
    heroBannerUri: '/assets/episode01/characters/lim-junho-portrait.webp',
    quote: '"양중 작업 반경 내 접근 금지입니다! 신호 확인 후 이동하세요!"',
    traits: ['✦ 초고속 기동 속도 +40', '✦ 신호 유도 무전 전파', '✦ 긴급 회피율 증가'],
    color: '#10b981',
    statModifiers: { speedBonus: 40 },
  },
  // Legacy aliases for backward compatibility & test suites
  yoon: {
    id: 'yoon',
    name: '윤성호',
    role: '총괄 현장소장',
    title: '작업중지권 총괄 지휘관',
    description: '30년 경력의 베테랑 현장소장. 확성기 사자후 게이지 충전속도 +30%, 위험 캐치 반경 확장.',
    startingWeapon: 'radio_boost',
    avatar: '👨‍💼',
    portraitUri: '/assets/episode01/characters/yoon-sungho-portrait.webp',
    heroBannerUri: '/assets/survivors/director_yoon_hero.jpg',
    quote: '"30년 현장 경력의 베테랑 · 작업중지권 절대 사수 · 오늘도 무사히"',
    traits: ['✦ 확성기 사자후 제압', '✦ 전 구역 작업중지권', '✦ 현장 근로자 전원 구출'],
    color: '#84cc16',
    statModifiers: {},
  },
  park: {
    id: 'park',
    name: '박기철',
    role: '베테랑 골조반장',
    title: '현장 돌파 맷집',
    description: '수십 년 현장 경험으로 다져진 강인한 체력. 최대 HP +50, 충돌 넉백 저항 및 높은 위력.',
    startingWeapon: 'extinguisher',
    avatar: '👷‍♂️',
    portraitUri: '/assets/episode01/characters/kang-taesik-portrait.webp',
    heroBannerUri: '/assets/episode01/hires/kang-taesik-portrait.webp',
    quote: '"철근과 콘크리트는 거짓말을 안 해 · 안전이 무너지면 건물도 무너진다"',
    traits: ['✦ 최대 체력 +50', '✦ 분말 소화기 광역 냉각', '✦ 충돌 넉백 완충'],
    color: '#f97316',
    statModifiers: { maxHpBonus: 50, damageBonus: 0.2 },
  },
  jung: {
    id: 'jung',
    name: '정민주',
    role: '스마트 안전 연구원',
    title: 'AI 오버클러커',
    description: '드론과 센서 통제 전문가. 모든 쿨다운 -15%, 치명타 확률 +15%, 스마트 드론으로 순찰 시작.',
    startingWeapon: 'safety_drone',
    avatar: '👩‍🔬',
    portraitUri: '/assets/episode01/characters/player-portrait.webp',
    heroBannerUri: '/assets/episode01/hires/key-art.webp',
    quote: '"사고가 터진 뒤엔 늦습니다 · 데이터와 센서 신호로 0.1초 앞을 봅니다"',
    traits: ['✦ 쿨다운 -15% 가속', '✦ 치명타 확률 +15%', '✦ 스마트 드론 자동 레이저'],
    color: '#a855f7',
    statModifiers: { cooldownBonus: 0.15, damageBonus: 0.1 },
  },
};

export const PERK_CATALOG: Record<PerkId, Omit<Perk, 'level'>> = {
  // --- Base Weapons ---
  radio_boost: {
    id: 'radio_boost',
    name: '고출력 무전 지시',
    description: '가장 가까운 위험에 즉시 경고 신호를 보내 정지시킵니다. (위력 + 발사체 수 증가)',
    icon: '📢',
    maxLevel: 5,
    category: 'weapon',
  },
  extinguisher: {
    id: 'extinguisher',
    name: '분말 소화기 분사',
    description: '전방에 넓은 부채꼴 분말을 분사해 위험 요소를 감속시키고 제압합니다.',
    icon: '🧯',
    maxLevel: 5,
    category: 'weapon',
  },
  floodlight: {
    id: 'floodlight',
    name: '360도 안전 투광등',
    description: '주변을 밝히는 광역 안전 지대를 형성하여 접근하는 위험을 지속적으로 무력화합니다.',
    icon: '🔦',
    maxLevel: 5,
    category: 'weapon',
  },
  cone_trap: {
    id: 'cone_trap',
    name: '라바콘 통제선',
    description: '바닥에 안전 통제 삼각콘을 설치하여 접근하는 돌진체를 튕겨내고 파괴합니다.',
    icon: '🚧',
    maxLevel: 5,
    category: 'weapon',
  },
  safety_drone: {
    id: 'safety_drone',
    name: '스마트 안전 드론',
    description: '플레이어 주위를 선회하며 접근하는 위험에 레이저 감시 빔을 발사합니다.',
    icon: '📡',
    maxLevel: 5,
    category: 'weapon',
  },

  // --- Support Perks ---
  steel_boots: {
    id: 'steel_boots',
    name: '초경량 절연 안전화',
    description: '현장 기동성을 대폭 향상시켜 이동 속도가 15% 빨라집니다.',
    icon: '👟',
    maxLevel: 3,
    category: 'support',
  },
  magnet_beacon: {
    id: 'magnet_beacon',
    name: '무선 안전 센서 비콘',
    description: '바닥에 떨어진 안전 기록(PSI 데이터)의 자석 흡수 반경이 35% 증가합니다.',
    icon: '🧲',
    maxLevel: 3,
    category: 'support',
  },
  safety_harness: {
    id: 'safety_harness',
    name: '풀바디 안전 하네스',
    description: '최대 현장 안전도(HP)가 30 증가하고, 초당 체력이 서서히 회복됩니다.',
    icon: '🛡️',
    maxLevel: 3,
    category: 'support',
  },
  quick_reflexes: {
    id: 'quick_reflexes',
    name: '위기 대응 신속 훈련',
    description: '모든 현장 안전 도구의 발사 및 재사용 대기 시간이 12% 단축됩니다.',
    icon: '⚡',
    maxLevel: 3,
    category: 'support',
  },
  data_chip: {
    id: 'data_chip',
    name: '스마트 설계 데이터칩',
    description: '정밀 센서 칩셋을 연동하여 치명타 확률 +10%, 공격력 배율 +15% 향상됩니다.',
    icon: '💾',
    maxLevel: 3,
    category: 'support',
  },

  // --- Super Protocol Evolutions ---
  satellite_broadcast: {
    id: 'satellite_broadcast',
    name: '★ 위성 브로드캐스트 메가폰',
    description: '[진화 무전기] 전 구역을 뒤흔드는 초고주파 통제 음파를 360도로 방출하여 대상을 일거에 제압합니다.',
    icon: '🛰️',
    maxLevel: 1,
    category: 'evolution',
    recipe: { weapon: 'radio_boost', support: 'magnet_beacon' },
  },
  cryo_blizzard: {
    id: 'cryo_blizzard',
    name: '★ 극저온 액화질소 블리자드',
    description: '[진화 소화기] 영하 196도의 액화질소를 전방위에 뿜어내어 적을 얼리고 연쇄 동결 폭발을 일으킵니다.',
    icon: '❄️',
    maxLevel: 1,
    category: 'evolution',
    recipe: { weapon: 'extinguisher', support: 'quick_reflexes' },
  },
  tesla_dome: {
    id: 'tesla_dome',
    name: '★ 고전압 테슬라 통제 돔',
    description: '[진화 투광등] 안전 지대가 테슬라 타워로 변환되어 접근하는 적들에게 연쇄 감전 번개를 내리꽂습니다.',
    icon: '⚡',
    maxLevel: 1,
    category: 'evolution',
    recipe: { weapon: 'floodlight', support: 'safety_harness' },
  },
  emf_barricade: {
    id: 'emf_barricade',
    name: '★ 전자기 차단 바리케이드',
    description: '[진화 라바콘] 설치된 콘들이 고압 전자기 빔을 상호 연결하여 닿는 모든 돌진체를 순식간에 절단합니다.',
    icon: '🚷',
    maxLevel: 1,
    category: 'evolution',
    recipe: { weapon: 'cone_trap', support: 'steel_boots' },
  },
  hunter_swarm: {
    id: 'hunter_swarm',
    name: '★ 자율 비행 헌터-킬러 편대',
    description: '[진화 드론] 드론이 3기의 공격 편대로 증강되어 360도 연속 관통 고출력 레이저를 퍼붓습니다.',
    icon: '🛸',
    maxLevel: 1,
    category: 'evolution',
    recipe: { weapon: 'safety_drone', support: 'data_chip' },
  },
};

export const EVOLUTION_RECIPES: Record<EvolutionPerkId, { weapon: BaseWeaponId; support: SupportPerkId }> = {
  satellite_broadcast: { weapon: 'radio_boost', support: 'magnet_beacon' },
  cryo_blizzard: { weapon: 'extinguisher', support: 'quick_reflexes' },
  tesla_dome: { weapon: 'floodlight', support: 'safety_harness' },
  emf_barricade: { weapon: 'cone_trap', support: 'steel_boots' },
  hunter_swarm: { weapon: 'safety_drone', support: 'data_chip' },
};

export interface GameInput {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  aimX?: number; // target coordinate
  aimY?: number;
  triggerAction?: boolean;
}

export const DEFAULT_PERMANENT_UPGRADES: PermanentUpgrades = {
  vitality: 0,
  mobility: 0,
  intelligence: 0,
  firstAid: 0,
  reroll: 0,
};

export function createInitialSurvivorsState(
  characterId: CharacterId = 'yoon',
  upgrades: PermanentUpgrades = DEFAULT_PERMANENT_UPGRADES,
  stageId: PatrolStageId = 'stage_01',
): SurvivorsGameState {
  const profile = CHARACTER_PROFILES[characterId];
  const stage = PATROL_STAGES[stageId] || PATROL_STAGES.stage_01;

  // Base stats influenced by character profile statModifiers & permanent upgrades
  const mods = profile.statModifiers || {};
  const baseHp = 100 + (mods.maxHpBonus || 0) + upgrades.vitality * 15;
  const baseSpeed = 220 + (mods.speedBonus || 0) + upgrades.mobility * 15;
  const basePickup = 90 + (mods.pickupRadiusBonus || 0) + upgrades.intelligence * 20;
  const baseCooldown = mods.cooldownBonus || 0;
  const baseCrit = 0.05 + (mods.damageBonus ? 0.05 : 0);
  const baseDmg = 1.0 + (mods.damageBonus || 0);

  const initialPlayer: PlayerStats = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    hp: baseHp,
    maxHp: baseHp,
    speed: baseSpeed,
    invincibleTime: 0,
    pickupRadius: basePickup,
    cooldownReduction: baseCooldown,
    damageMultiplier: baseDmg,
    critRate: baseCrit,
    regenRate: 0,
  };

  const initialPerks: Record<PerkId, number> = {
    radio_boost: 0,
    extinguisher: 0,
    floodlight: 0,
    cone_trap: 0,
    safety_drone: 0,
    steel_boots: 0,
    magnet_beacon: 0,
    safety_harness: 0,
    quick_reflexes: 0,
    data_chip: 0,
    satellite_broadcast: 0,
    cryo_blizzard: 0,
    tesla_dome: 0,
    emf_barricade: 0,
    hunter_swarm: 0,
  };

  // Set starting weapon
  initialPerks[profile.startingWeapon] = 1;

  return {
    phase: 'ready',
    characterId,
    gameTime: 0,
    maxTime: TARGET_SURVIVAL_TIME,
    player: initialPlayer,
    hazards: [],
    projectiles: [],
    drops: [],
    level: 1,
    currentExp: 0,
    nextLevelExp: 10,
    score: 0,
    hazardsNeutralized: 0,
    activePerks: initialPerks,
    perkOptions: [],
    droneAngle: 0,

    ultimateCharge: 0,
    maxUltimateCharge: 100,
    directorShoutTimer: 0,
    directorCutinPhase: 'none',

    evolutionBanner: null,
    bossAlertTimer: 0,
    bossName: null,
    timeDilation: 1.0,
    timeDilationTimer: 0,

    psiCredits: 0,
    permanentUpgrades: { ...upgrades },
    hasRevived: false,
    rerollsLeft: upgrades.reroll,

    hitStopTimer: 0,
    comboCount: 0,
    comboTimer: 0,
    lastKilledEvents: [],

    stageId: stage.id,
    stage: {
      ...stage,
      starChallenges: [
        { ...stage.starChallenges[0] },
        { ...stage.starChallenges[1] },
        { ...stage.starChallenges[2] },
      ],
    },
    interactiveHazards: stage.hazards.map(h => ({ ...h })),
    environmentalKills: 0,
    starsEarned: [false, false, false],
    inFloodlight: false,
  };
}

let nextEntityId = 1;
function genId(prefix: string): string {
  return `${prefix}_${nextEntityId++}`;
}

// Cooldown trackers
interface Cooldowns {
  radio: number;
  extinguisher: number;
  cone: number;
  drone: number;
  satellite: number;
  cryo: number;
  tesla: number;
  emf: number;
  hunter: number;
  spawnTimer: number;
}

export class SurvivorsEngine {
  private cooldowns: Cooldowns = {
    radio: 0,
    extinguisher: 0,
    cone: 0,
    drone: 0,
    satellite: 0,
    cryo: 0,
    tesla: 0,
    emf: 0,
    hunter: 0,
    spawnTimer: 1.5,
  };

  private lastFacingX = 1;
  private lastFacingY = 0;

  constructor(public state: SurvivorsGameState = createInitialSurvivorsState()) {}

  start() {
    if (this.state.phase === 'ready') {
      this.state.phase = 'playing';
    }
  }

  update(dt: number, input: GameInput): void {
    if (this.state.phase !== 'playing') return;

    // Reset single-frame kill events
    this.state.lastKilledEvents = [];

    // Micro Freeze / Hit Stop (Impact Screen Juice)
    if (this.state.hitStopTimer && this.state.hitStopTimer > 0) {
      this.state.hitStopTimer = Math.max(0, this.state.hitStopTimer - dt);
      return; // Freeze game physics update for micro duration to deliver weighted impact feel
    }

    // Combo countdown decay
    if (this.state.comboTimer > 0) {
      this.state.comboTimer -= dt;
      if (this.state.comboTimer <= 0) {
        this.state.comboCount = 0;
      }
    }

    // Cap delta time to prevent physics tunneling
    let effectiveDt = Math.min(dt, 0.1);

    // Apply Time Dilation (e.g. boss finish slow-motion)
    if (this.state.timeDilationTimer > 0) {
      this.state.timeDilationTimer -= effectiveDt;
      effectiveDt *= this.state.timeDilation;
      if (this.state.timeDilationTimer <= 0) {
        this.state.timeDilation = 1.0;
      }
    }

    this.state.gameTime += effectiveDt;

    // Update timers
    if (this.state.bossAlertTimer > 0) {
      this.state.bossAlertTimer = Math.max(0, this.state.bossAlertTimer - effectiveDt);
      if (this.state.bossAlertTimer === 0) {
        this.state.bossName = null;
      }
    }

    if (this.state.evolutionBanner) {
      this.state.evolutionBanner.timer -= effectiveDt;
      if (this.state.evolutionBanner.timer <= 0) {
        this.state.evolutionBanner = null;
      }
    }

    // Director Shout Ultimate update
    if (this.state.directorShoutTimer > 0) {
      this.state.directorShoutTimer = Math.max(0, this.state.directorShoutTimer - effectiveDt);
      const remaining = this.state.directorShoutTimer;
      if (remaining > 1.5) {
        this.state.directorCutinPhase = 'cutin';
      } else if (remaining > 1.0) {
        this.state.directorCutinPhase = 'shout';
      } else if (remaining > 0.6) {
        this.state.directorCutinPhase = 'invert';
      } else {
        this.state.directorCutinPhase = 'recovering';
      }

      if (this.state.directorShoutTimer === 0) {
        this.state.directorCutinPhase = 'none';
      }
    }

    this.updatePlayer(effectiveDt, input);
    this.updateWeapons(effectiveDt, input);
    this.updateProjectiles(effectiveDt);
    this.updateSpawns(effectiveDt);
    this.updateHazards(effectiveDt);
    this.updateStageHazards(effectiveDt);
    this.updateDrops(effectiveDt);
    this.checkCollisions();
    this.checkStarChallenges();

    // Check survival victory
    if (this.state.gameTime >= this.state.maxTime) {
      this.state.phase = 'victory';
      this.state.score += 5000;
      this.state.psiCredits += Math.round(this.state.score / 10);
      this.checkStarChallenges();
    }
  }

  triggerDirectorShout(): boolean {
    if (this.state.phase !== 'playing') return false;
    if (this.state.ultimateCharge < this.state.maxUltimateCharge) {
      return false;
    }

    this.state.ultimateCharge = 0;
    this.state.directorShoutTimer = 2.0;
    this.state.directorCutinPhase = 'cutin';

    // 1. Time freeze & stun all existing hazards, deal massive damage
    for (const h of this.state.hazards) {
      h.isStunned = 3.5;
      h.hp -= 9999;
    }

    // 2. Spawn massive expanding shockwave
    this.state.projectiles.push({
      id: genId('proj_shout'),
      x: this.state.player.x,
      y: this.state.player.y,
      vx: 0,
      vy: 0,
      radius: 40,
      damage: 9999,
      duration: 1.5,
      pierce: 9999,
      kind: 'shout_shockwave',
      scale: 1.0,
      color: '#f59e0b',
    });

    // 3. Hyper magnet: pull all drops immediately to player
    for (const d of this.state.drops) {
      const dx = this.state.player.x - d.x;
      const dy = this.state.player.y - d.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = Math.min(dist, 800);
      d.x += (dx / dist) * step;
      d.y += (dy / dist) * step;
    }

    this.state.score += 1500;
    return true;
  }

  private updatePlayer(dt: number, input: GameInput) {
    const { player } = this.state;

    // Environmental zone effects (Floodlight buff, Slurry drag)
    let speedMod = 1.0;
    let inFloodlight = false;
    if (this.state.interactiveHazards) {
      for (const h of this.state.interactiveHazards) {
        if (h.state === 'destroyed') continue;
        const dist = Math.hypot(player.x - h.x, player.y - h.y);
        if (h.type === 'floodlight_tower' && dist <= h.radius) {
          inFloodlight = true;
        } else if (h.type === 'slurry_puddle' && dist <= h.radius) {
          speedMod *= 0.65;
        }
      }
    }
    if (inFloodlight) {
      speedMod *= 1.25; // 25% speed buff under floodlight
    }
    this.state.inFloodlight = inFloodlight;

    // Direction normalize
    const len = Math.hypot(input.moveX, input.moveY);
    if (len > 0.001) {
      const nx = input.moveX / len;
      const ny = input.moveY / len;
      const currentSpeed = player.speed * speedMod;
      player.x += nx * currentSpeed * dt;
      player.y += ny * currentSpeed * dt;
      this.lastFacingX = nx;
      this.lastFacingY = ny;
    }

    // Clamp inside world boundaries
    const padding = 20;
    player.x = Math.max(padding, Math.min(WORLD_WIDTH - padding, player.x));
    player.y = Math.max(padding, Math.min(WORLD_HEIGHT - padding, player.y));

    // Invincibility decay
    if (player.invincibleTime > 0) {
      player.invincibleTime = Math.max(0, player.invincibleTime - dt);
    }

    // HP regen
    if (player.regenRate > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + player.regenRate * dt);
    }

    // Drone orbit angle
    if (this.state.activePerks.safety_drone > 0 || this.state.activePerks.hunter_swarm > 0) {
      const speed = this.state.activePerks.hunter_swarm > 0 ? 4.5 : 2.5;
      this.state.droneAngle = ((this.state.droneAngle ?? 0) + dt * speed) % (Math.PI * 2);
    }
  }

  private updateWeapons(dt: number, _input?: GameInput) {
    const { activePerks, hazards } = this.state;
    // Apply 30% damage buff if standing in floodlight zone
    const floodlightDmgBonus = this.state.inFloodlight ? 1.3 : 1.0;
    const player = {
      ...this.state.player,
      damageMultiplier: this.state.player.damageMultiplier * floodlightDmgBonus,
    };
    const cdReduction = 1 - Math.min(0.6, player.cooldownReduction);

    // ==========================================
    // 1. Radio Weapon & Evolution: Satellite Broadcast
    // ==========================================
    const hasSatellite = activePerks.satellite_broadcast > 0;
    if (hasSatellite) {
      this.cooldowns.satellite -= dt;
      if (this.cooldowns.satellite <= 0) {
        this.cooldowns.satellite = 1.1 * cdReduction;
        // Fire 8-directional cosmic sonic waves across the screen
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count;
          this.state.projectiles.push({
            id: genId('proj_satellite'),
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 580,
            vy: Math.sin(angle) * 580,
            radius: 28,
            damage: 95 * player.damageMultiplier,
            duration: 2.2,
            pierce: 99,
            kind: 'satellite_wave',
            color: '#38bdf8',
          });
        }
      }
    } else {
      const radioLvl = activePerks.radio_boost;
      if (radioLvl > 0) {
        this.cooldowns.radio -= dt;
        const radioBaseCd = Math.max(0.4, 1.2 - radioLvl * 0.15) * cdReduction;
        if (this.cooldowns.radio <= 0) {
          this.cooldowns.radio = radioBaseCd;
          const target = this.findNearestHazard(player.x, player.y);
          if (target) {
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            const dist = Math.hypot(dx, dy) || 1;
            const bulletCount = radioLvl >= 4 ? 3 : radioLvl >= 2 ? 2 : 1;

            for (let i = 0; i < bulletCount; i++) {
              const spreadAngle = (i - (bulletCount - 1) / 2) * 0.22;
              const cos = Math.cos(spreadAngle);
              const sin = Math.sin(spreadAngle);
              const ndx = (dx / dist) * cos - (dy / dist) * sin;
              const ndy = (dx / dist) * sin + (dy / dist) * cos;

              this.state.projectiles.push({
                id: genId('proj_radio'),
                x: player.x,
                y: player.y,
                vx: ndx * 480,
                vy: ndy * 480,
                radius: 10,
                damage: (22 + radioLvl * 8) * player.damageMultiplier,
                duration: 1.4,
                pierce: radioLvl >= 3 ? 2 : 1,
                kind: 'radio',
              });
            }
          }
        }
      }
    }

    // ==========================================
    // 2. Extinguisher Weapon & Evolution: Cryo Blizzard
    // ==========================================
    const hasCryo = activePerks.cryo_blizzard > 0;
    if (hasCryo) {
      this.cooldowns.cryo -= dt;
      if (this.cooldowns.cryo <= 0) {
        this.cooldowns.cryo = 1.6 * cdReduction;
        // 360-degree freezing blizzard
        const sprays = 16;
        for (let i = 0; i < sprays; i++) {
          const angle = (i * Math.PI * 2) / sprays + (Math.random() - 0.5) * 0.2;
          this.state.projectiles.push({
            id: genId('proj_cryo'),
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 360,
            vy: Math.sin(angle) * 360,
            radius: 20,
            damage: 60 * player.damageMultiplier,
            duration: 0.8,
            pierce: 99,
            kind: 'cryo_blast',
            color: '#a5f3fc',
          });
        }
      }
    } else {
      const extLvl = activePerks.extinguisher;
      if (extLvl > 0) {
        this.cooldowns.extinguisher -= dt;
        const extBaseCd = Math.max(0.6, 2.0 - extLvl * 0.25) * cdReduction;
        if (this.cooldowns.extinguisher <= 0) {
          this.cooldowns.extinguisher = extBaseCd;
          const sprayCount = 4 + extLvl * 2;
          const baseAngle = Math.atan2(this.lastFacingY, this.lastFacingX);

          for (let i = 0; i < sprayCount; i++) {
            const angleOffset = (Math.random() - 0.5) * 0.75;
            const sprayAngle = baseAngle + angleOffset;
            const speed = 260 + Math.random() * 80;

            this.state.projectiles.push({
              id: genId('proj_ext'),
              x: player.x,
              y: player.y,
              vx: Math.cos(sprayAngle) * speed,
              vy: Math.sin(sprayAngle) * speed,
              radius: 12 + extLvl * 2,
              damage: (14 + extLvl * 6) * player.damageMultiplier,
              duration: 0.65,
              pierce: 3,
              kind: 'extinguisher',
            });
          }
        }
      }
    }

    // ==========================================
    // 3. Floodlight Weapon & Evolution: Tesla Dome
    // ==========================================
    const hasTesla = activePerks.tesla_dome > 0;
    if (hasTesla) {
      this.cooldowns.tesla -= dt;
      const radius = 220;
      // Continuous aura + chain lightning
      for (const h of hazards) {
        const dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (dist <= radius + h.radius) {
          h.hp -= 90 * player.damageMultiplier * dt;
          h.speed = Math.max(25, h.speed * 0.7);
        }
      }
      if (this.cooldowns.tesla <= 0) {
        this.cooldowns.tesla = 0.5 * cdReduction;
        // Strike up to 4 targets with lightning
        let strikes = 0;
        for (const h of hazards) {
          if (strikes >= 4) break;
          const dist = Math.hypot(h.x - player.x, h.y - player.y);
          if (dist <= radius + 100) {
            h.hp -= 80 * player.damageMultiplier;
            strikes++;
            this.state.projectiles.push({
              id: genId('proj_tesla'),
              x: h.x,
              y: h.y,
              vx: 0,
              vy: 0,
              radius: 25,
              damage: 40 * player.damageMultiplier,
              duration: 0.3,
              pierce: 99,
              kind: 'tesla_bolt',
              color: '#fbbf24',
            });
          }
        }
      }
    } else {
      const floodLvl = activePerks.floodlight;
      if (floodLvl > 0) {
        const radius = 90 + floodLvl * 22;
        const auraDps = (18 + floodLvl * 9) * player.damageMultiplier;
        for (const h of hazards) {
          const dist = Math.hypot(h.x - player.x, h.y - player.y);
          if (dist <= radius + h.radius) {
            h.hp -= auraDps * dt;
            h.speed = Math.max(30, h.speed * 0.85); // slow down
          }
        }
      }
    }

    // ==========================================
    // 4. Traffic Cone Trap & Evolution: EMF Barricade
    // ==========================================
    const hasEmf = activePerks.emf_barricade > 0;
    if (hasEmf) {
      this.cooldowns.emf -= dt;
      if (this.cooldowns.emf <= 0) {
        this.cooldowns.emf = 1.2 * cdReduction;
        // Drop high-tech laser pylon
        this.state.projectiles.push({
          id: genId('proj_emf'),
          x: player.x,
          y: player.y,
          vx: 0,
          vy: 0,
          radius: 36,
          damage: 180 * player.damageMultiplier,
          duration: 15.0,
          pierce: 99,
          kind: 'emf_beam',
          color: '#ec4899',
        });
      }
    } else {
      const coneLvl = activePerks.cone_trap;
      if (coneLvl > 0) {
        this.cooldowns.cone -= dt;
        const coneCd = Math.max(1.8, 3.5 - coneLvl * 0.4) * cdReduction;
        if (this.cooldowns.cone <= 0) {
          this.cooldowns.cone = coneCd;
          this.state.projectiles.push({
            id: genId('proj_cone'),
            x: player.x,
            y: player.y,
            vx: 0,
            vy: 0,
            radius: 16 + coneLvl * 2,
            damage: (50 + coneLvl * 25) * player.damageMultiplier,
            duration: 12.0,
            pierce: 1 + Math.floor(coneLvl / 2),
            kind: 'cone_trap',
          });
        }
      }
    }

    // ==========================================
    // 5. Safety Drone & Evolution: Hunter Swarm
    // ==========================================
    const hasHunter = activePerks.hunter_swarm > 0;
    if (hasHunter) {
      this.cooldowns.hunter -= dt;
      if (this.cooldowns.hunter <= 0) {
        this.cooldowns.hunter = 0.22 * cdReduction;
        // 3 drones firing
        const angleBase = this.state.droneAngle ?? 0;
        for (let d = 0; d < 3; d++) {
          const angle = angleBase + (d * Math.PI * 2) / 3;
          const droneX = player.x + Math.cos(angle) * 85;
          const droneY = player.y + Math.sin(angle) * 85;
          const target = this.findNearestHazard(droneX, droneY);
          if (target) {
            const dx = target.x - droneX;
            const dy = target.y - droneY;
            const dist = Math.hypot(dx, dy) || 1;
            this.state.projectiles.push({
              id: genId('proj_hunter'),
              x: droneX,
              y: droneY,
              vx: (dx / dist) * 750,
              vy: (dy / dist) * 750,
              radius: 9,
              damage: 48 * player.damageMultiplier,
              duration: 1.2,
              pierce: 4,
              kind: 'hunter_beam',
              color: '#a855f7',
            });
          }
        }
      }
    } else {
      const droneLvl = activePerks.safety_drone;
      if (droneLvl > 0) {
        this.cooldowns.drone -= dt;
        const droneCd = Math.max(0.3, 0.9 - droneLvl * 0.12) * cdReduction;
        if (this.cooldowns.drone <= 0) {
          this.cooldowns.drone = droneCd;
          const angle = this.state.droneAngle ?? 0;
          const droneX = player.x + Math.cos(angle) * 65;
          const droneY = player.y + Math.sin(angle) * 65;
          const target = this.findNearestHazard(droneX, droneY);
          if (target) {
            const dx = target.x - droneX;
            const dy = target.y - droneY;
            const dist = Math.hypot(dx, dy) || 1;
            this.state.projectiles.push({
              id: genId('proj_drone'),
              x: droneX,
              y: droneY,
              vx: (dx / dist) * 550,
              vy: (dy / dist) * 550,
              radius: 7,
              damage: (16 + droneLvl * 8) * player.damageMultiplier,
              duration: 1.0,
              pierce: 1,
              kind: 'drone_laser',
            });
          }
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    const alive: Projectile[] = [];
    for (const p of this.state.projectiles) {
      p.duration -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Expand shockwave radius smoothly
      if (p.kind === 'shout_shockwave') {
        p.radius += 600 * dt;
      }

      if (
        p.duration > 0 &&
        p.x >= -100 &&
        p.x <= WORLD_WIDTH + 100 &&
        p.y >= -100 &&
        p.y <= WORLD_HEIGHT + 100
      ) {
        alive.push(p);
      }
    }
    this.state.projectiles = alive;
  }

  private updateSpawns(dt: number) {
    this.cooldowns.spawnTimer -= dt;
    const timeProgress = this.state.gameTime / this.state.maxTime; // 0.0 to 1.0

    // Progressive spawn rate (faster as time goes on)
    const spawnInterval = Math.max(0.2, 1.4 - timeProgress * 1.15);

    if (this.cooldowns.spawnTimer <= 0) {
      this.cooldowns.spawnTimer = spawnInterval;

      // Boss event checking at 60s, 120s
      const time = Math.floor(this.state.gameTime);
      const stage = this.state.stage;
      const stageBossName = stage ? `${stage.bossName} (${stage.bossTitle})` : '타이탄 크레인 8000 (TITAN CRANE)';
      const stageBossType = stage?.bossType || 'CRANE_BOSS';
      const stageBossHp = stage?.bossHp;
      if (time === 60 && !this.state.hazards.some(h => h.type === stageBossType)) {
        this.triggerBossAlert(stageBossName);
        this.spawnHazard(stageBossType, stageBossHp);
        return;
      }

      // Determine enemy type by elapsed time
      const rand = Math.random();
      let type: HazardType = 'UNHELMETED';

      if (this.state.gameTime > 120 && rand < 0.12) {
        type = stageBossType;
      } else if (this.state.gameTime > 60 && rand < 0.35) {
        type = 'RUNAWAY_CART';
      } else if (this.state.gameTime > 30 && rand < 0.6) {
        type = 'GAS_LEAK';
      }

      this.spawnHazard(type);
    }
  }

  private triggerBossAlert(name: string) {
    this.state.bossAlertTimer = 3.5;
    this.state.bossName = name;
  }

  private spawnHazard(type: HazardType, overrideHp?: number) {
    let x = 0;
    let y = 0;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) {
      x = Math.random() * WORLD_WIDTH;
      y = -20;
    } else if (side === 1) {
      x = WORLD_WIDTH + 20;
      y = Math.random() * WORLD_HEIGHT;
    } else if (side === 2) {
      x = Math.random() * WORLD_WIDTH;
      y = WORLD_HEIGHT + 20;
    } else {
      x = -20;
      y = Math.random() * WORLD_HEIGHT;
    }

    let hp = 30;
    let speed = 90;
    let radius = 15;
    let damage = 12;
    let expValue = 3;

    if (type === 'RUNAWAY_CART') {
      hp = 65;
      speed = 180;
      radius = 18;
      damage = 22;
      expValue = 7;
    } else if (type === 'GAS_LEAK') {
      hp = 22;
      speed = 70;
      radius = 12;
      damage = 8;
      expValue = 3;
    } else if (type === 'CRANE_BOSS') {
      hp = overrideHp || 500;
      speed = 65;
      radius = 34;
      damage = 35;
      expValue = 45;
    }

    // Time scaling (if not explicit boss HP override)
    if (overrideHp) {
      hp = overrideHp;
    } else {
      const scale = 1 + (this.state.gameTime / 60) * 0.45;
      hp = Math.round(hp * scale);
    }

    this.state.hazards.push({
      id: genId(`haz_${type}`),
      type,
      x,
      y,
      hp,
      maxHp: hp,
      speed,
      radius,
      damage,
      expValue,
    });
  }

  private updateHazards(dt: number) {
    const { player } = this.state;
    for (const h of this.state.hazards) {
      // 1. Radial Physics Knockback Deceleration
      if (h.vx || h.vy) {
        h.x += (h.vx || 0) * dt;
        h.y += (h.vy || 0) * dt;
        const friction = Math.pow(0.03, dt);
        h.vx = (h.vx || 0) * friction;
        h.vy = (h.vy || 0) * friction;
        if (Math.abs(h.vx) < 1) h.vx = 0;
        if (Math.abs(h.vy) < 1) h.vy = 0;
      }

      if (h.isStunned && h.isStunned > 0) {
        h.isStunned -= dt;
        continue;
      }

      // Environmental zone speed modifier (Light beam suppression, Slurry puddle drag)
      let hazardSpeed = h.speed;
      if (this.state.interactiveHazards) {
        for (const env of this.state.interactiveHazards) {
          if (env.state === 'destroyed') continue;
          const dist = Math.hypot(env.x - h.x, env.y - h.y);
          if (env.type === 'floodlight_tower' && dist <= env.radius) {
            hazardSpeed *= 0.55; // 45% slow under spotlight
          } else if (env.type === 'slurry_puddle' && dist <= env.radius) {
            hazardSpeed *= 0.65; // 35% slow in slurry mud
          }
        }
      }

      // Chase player
      const dx = player.x - h.x;
      const dy = player.y - h.y;
      const dist = Math.hypot(dx, dy) || 1;

      h.x += (dx / dist) * hazardSpeed * dt;
      h.y += (dy / dist) * hazardSpeed * dt;
    }
  }

  private checkCollisions() {
    const { player, hazards, projectiles } = this.state;

    // 1. Projectiles vs Hazards
    for (const p of projectiles) {
      for (const h of hazards) {
        if (h.hp <= 0) continue;
        const dist = Math.hypot(p.x - h.x, p.y - h.y);
        if (dist <= p.radius + h.radius) {
          // Critical hit calculation
          const isCrit = Math.random() < player.critRate;
          const damageDealt = isCrit ? p.damage * 2.0 : p.damage;
          h.hp -= damageDealt;
          p.pierce -= 1;

          // Impact Hit Stop (Micro Freeze Juice)
          if (isCrit) {
            this.state.hitStopTimer = Math.max(this.state.hitStopTimer || 0, 0.045);
          }

          // Dynamic Physics Radial Knockback impulse
          const knockBase = p.kind === 'shout_shockwave' ? 340
            : p.kind === 'satellite_wave' ? 190
            : p.kind === 'cone_trap' ? 140
            : p.kind === 'radio' ? 95
            : 55;
          // Boss has high mass resistance
          const massFactor = h.type === 'CRANE_BOSS' ? 0.2 : h.type === 'RUNAWAY_CART' ? 0.5 : 1.0;
          const knockForce = knockBase * massFactor;

          const kx = (h.x - player.x) || 1;
          const ky = (h.y - player.y) || 1;
          const klen = Math.hypot(kx, ky) || 1;
          h.vx = (h.vx || 0) + (kx / klen) * knockForce;
          h.vy = (h.vy || 0) + (ky / klen) * knockForce;

          // Direct displacement fallback
          const directPush = knockForce * 0.15;
          h.x += (kx / klen) * directPush;
          h.y += (ky / klen) * directPush;

          if (p.pierce <= 0) {
            p.duration = 0; // destroyed
            break;
          }
        }
      }
    }

    // 1-b. Projectiles vs Interactive Hazards (Barrels, Transformers)
    if (this.state.interactiveHazards) {
      for (const p of projectiles) {
        if (p.duration <= 0) continue;
        for (const env of this.state.interactiveHazards) {
          if (env.state === 'destroyed' || env.state === 'active') continue;
          if (env.type === 'explosive_barrel' && env.state === 'idle') {
            const dist = Math.hypot(p.x - env.x, p.y - env.y);
            if (dist <= p.radius + env.radius) {
              env.hp -= p.damage;
              p.pierce -= 1;
              if (env.hp <= 0) {
                env.state = 'warning';
                env.timer = 0.8; // 0.8s countdown fuse
              }
              if (p.pierce <= 0) {
                p.duration = 0;
                break;
              }
            }
          } else if (env.type === 'electric_transformer' && env.state === 'idle' && env.timer <= 0) {
            const dist = Math.hypot(p.x - env.x, p.y - env.y);
            if (dist <= p.radius + env.radius) {
              env.hp -= p.damage;
              p.pierce -= 1;
              if (env.hp <= 0) {
                env.state = 'active';
                env.timer = 2.0; // 2 seconds arc discharge
              }
              if (p.pierce <= 0) {
                p.duration = 0;
                break;
              }
            }
          }
        }
      }
    }

    // Filter dead hazards and spawn drops + Combo & Impact Juice events
    const survivingHazards: Hazard[] = [];
    if (!this.state.lastKilledEvents) {
      this.state.lastKilledEvents = [];
    }

    for (const h of hazards) {
      if (h.hp <= 0) {
        this.state.score += h.expValue * 15;
        this.state.hazardsNeutralized += 1;

        // Combo chain system
        this.state.comboCount = (this.state.comboCount || 0) + 1;
        this.state.comboTimer = 2.4; // 2.4 seconds combo window
        this.state.lastKilledEvents.push({
          type: h.type,
          x: h.x,
          y: h.y,
        });

        // Ultimate gauge increment
        const ultGain = h.type === 'CRANE_BOSS' ? 12 : 2.5;
        this.state.ultimateCharge = Math.min(
          this.state.maxUltimateCharge,
          this.state.ultimateCharge + ultGain,
        );

        // Boss death slow-motion execution finish
        if (h.type === 'CRANE_BOSS') {
          this.state.timeDilation = 0.25;
          this.state.timeDilationTimer = 0.8;
          this.state.hitStopTimer = 0.08;
          this.state.score += 2500;
        }

        // Drop safety log (exp gem) - always provides EXP
        this.state.drops.push({
          id: genId('drop_log'),
          x: h.x,
          y: h.y,
          exp: h.expValue,
        });

        // 6% chance to drop separate heal pack
        if (Math.random() < 0.06) {
          this.state.drops.push({
            id: genId('drop_heal'),
            x: h.x + (Math.random() - 0.5) * 20,
            y: h.y + (Math.random() - 0.5) * 20,
            exp: 0,
            isHeal: true,
          });
        }
      } else {
        survivingHazards.push(h);
      }
    }
    this.state.hazards = survivingHazards;

    // 2. Hazards vs Player
    if (player.invincibleTime <= 0) {
      for (const h of hazards) {
        const dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (dist <= h.radius + 14) {
          player.hp -= h.damage;
          player.invincibleTime = 0.6; // 0.6s grace period
          // Knockback hazard slightly
          const dx = h.x - player.x || 1;
          const dy = h.y - player.y || 1;
          const dlen = Math.hypot(dx, dy);
          h.x += (dx / dlen) * 30;
          h.y += (dy / dlen) * 30;

          if (player.hp <= 0) {
            // Check 1-time Revive from R&D First Aid upgrade
            if (!this.state.hasRevived && this.state.permanentUpgrades.firstAid > 0) {
              this.state.hasRevived = true;
              player.hp = Math.round(player.maxHp * 0.5);
              player.invincibleTime = 3.0; // 3 seconds invincible
              // Trigger emergency shockwave
              this.state.projectiles.push({
                id: genId('proj_revive_wave'),
                x: player.x,
                y: player.y,
                vx: 0,
                vy: 0,
                radius: 120,
                damage: 300,
                duration: 0.5,
                pierce: 99,
                kind: 'shout_shockwave',
                color: '#10b981',
              });
            } else {
              player.hp = 0;
              this.state.phase = 'defeat';
              this.state.psiCredits += Math.round(this.state.score / 15);
              break;
            }
          }
        }
      }
    }
  }

  private updateStageHazards(dt: number) {
    const { player, interactiveHazards, hazards } = this.state;
    if (!interactiveHazards) return;

    for (const hazard of (interactiveHazards as StageHazardObject[])) {
      // 1. Explosive Barrel
      if (hazard.type === 'explosive_barrel') {
        if (hazard.state === 'warning') {
          hazard.timer -= dt;
          if (hazard.timer <= 0) {
            hazard.state = 'active';
            hazard.timer = 0.45;

            // Massive 3000 AoE blast
            const blastRadius = 220;
            let killedCount = 0;
            for (const h of hazards) {
              const d = Math.hypot(h.x - hazard.x, h.y - hazard.y);
              if (d <= blastRadius + h.radius) {
                h.hp -= 3000;
                if (h.hp <= 0) {
                  killedCount++;
                }
              }
            }
            this.state.environmentalKills += killedCount;
            this.state.score += killedCount * 50;

            // Player caught too close takes minor self-damage
            const pDist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
            if (pDist <= 100 && player.invincibleTime <= 0) {
              player.hp = Math.max(1, player.hp - 15);
              player.invincibleTime = 0.8;
            }

            // Explosion shockwave projectile
            this.state.projectiles.push({
              id: genId('barrel_blast'),
              x: hazard.x,
              y: hazard.y,
              vx: 0,
              vy: 0,
              radius: 60,
              damage: 600,
              duration: 0.5,
              pierce: 99,
              kind: 'shout_shockwave',
              color: '#f97316',
            });
          }
        } else if (hazard.state === 'active') {
          hazard.timer -= dt;
          if (hazard.timer <= 0) {
            hazard.state = 'destroyed';
          }
        }
      }

      // 2. Crane Drop Zone (Periodic overhead crush hazard)
      if (hazard.type === 'crane_drop_zone') {
        hazard.timer -= dt;
        if (hazard.state === 'idle') {
          if (hazard.timer <= 0) {
            hazard.state = 'warning';
            hazard.timer = 2.2; // 2.2s warning telegraph
          }
        } else if (hazard.state === 'warning') {
          if (hazard.timer <= 0) {
            hazard.state = 'active';
            hazard.timer = 0.6; // Impact duration

            let crushedCount = 0;
            for (const h of hazards) {
              const d = Math.hypot(h.x - hazard.x, h.y - hazard.y);
              if (d <= hazard.radius + h.radius) {
                h.hp -= 5000;
                if (h.hp <= 0) {
                  crushedCount++;
                }
              }
            }
            this.state.environmentalKills += crushedCount;
            this.state.score += crushedCount * 80;

            // Player crushed if inside
            const pDist = Math.hypot(player.x - hazard.x, player.y - hazard.y);
            if (pDist <= hazard.radius && player.invincibleTime <= 0) {
              player.hp = Math.max(1, player.hp - 30);
              player.invincibleTime = 1.0;
            }

            // Impact shockwave
            this.state.projectiles.push({
              id: genId('crane_slam'),
              x: hazard.x,
              y: hazard.y,
              vx: 0,
              vy: 0,
              radius: 70,
              damage: 1000,
              duration: 0.5,
              pierce: 99,
              kind: 'shout_shockwave',
              color: '#ef4444',
            });
          }
        } else if (hazard.state === 'active') {
          if (hazard.timer <= 0) {
            hazard.state = 'idle';
            hazard.timer = 14; // Next drop in 14 seconds
          }
        }
      }

      // 3. Electric Transformer (Surge discharge)
      if (hazard.type === 'electric_transformer') {
        if (hazard.state === 'active') {
          hazard.timer -= dt;
          for (const h of hazards) {
            const d = Math.hypot(h.x - hazard.x, h.y - hazard.y);
            if (d <= 200 + h.radius) {
              h.hp -= 1500 * dt;
              h.isStunned = 0.8;
              if (h.hp <= 0) {
                this.state.environmentalKills++;
              }
            }
          }
          if (hazard.timer <= 0) {
            hazard.state = 'idle';
            hazard.hp = hazard.maxHp;
            hazard.timer = 12; // Cooldown
          }
        } else if (hazard.state === 'idle' && hazard.timer > 0) {
          hazard.timer -= dt;
        }
      }
    }
  }

  private checkStarChallenges() {
    const { stage, gameTime, maxTime, environmentalKills, hazardsNeutralized, player, directorShoutTimer, phase } = this.state;
    if (!stage || !stage.starChallenges) return;

    const challenges = stage.starChallenges;

    // Challenge 1: Survival time >= maxTime or victory
    if (challenges[0]) {
      challenges[0].currentValue = Math.min(challenges[0].targetValue, phase === 'victory' || gameTime >= maxTime ? 1 : 0);
      if (challenges[0].currentValue >= challenges[0].targetValue) {
        challenges[0].isCompleted = true;
      }
    }

    // Challenge 2: Stage specific targets
    if (challenges[1]) {
      if (stage.id === 'stage_01' || stage.id === 'stage_03' || stage.id === 'stage_05') {
        challenges[1].currentValue = environmentalKills;
      } else {
        challenges[1].currentValue = hazardsNeutralized;
      }
      if (challenges[1].currentValue >= challenges[1].targetValue) {
        challenges[1].isCompleted = true;
      }
    }

    // Challenge 3: Mastery / Shout / HP check
    if (challenges[2]) {
      if (stage.id === 'stage_01' || stage.id === 'stage_04' || stage.id === 'stage_05') {
        if (directorShoutTimer > 0) {
          challenges[2].currentValue = 1;
          challenges[2].isCompleted = true;
        }
      } else if (stage.id === 'stage_02') {
        if (phase === 'victory') {
          const hpPercent = (player.hp / player.maxHp) * 100;
          challenges[2].currentValue = Math.round(hpPercent);
          if (hpPercent >= challenges[2].targetValue) {
            challenges[2].isCompleted = true;
          }
        }
      } else if (stage.id === 'stage_03') {
        challenges[2].currentValue = hazardsNeutralized;
        if (challenges[2].currentValue >= challenges[2].targetValue) {
          challenges[2].isCompleted = true;
        }
      }
    }

    this.state.starsEarned = [
      Boolean(challenges[0]?.isCompleted),
      Boolean(challenges[1]?.isCompleted),
      Boolean(challenges[2]?.isCompleted),
    ];
  }

  private updateDrops(dt: number) {
    const { player, drops } = this.state;
    const remainingDrops: SafetyDrop[] = [];

    for (const drop of drops) {
      const dist = Math.hypot(player.x - drop.x, player.y - drop.y);

      // Magnet pickup range
      if (dist <= player.pickupRadius) {
        if (dist <= 26) {
          this.collectDrop(drop);
          continue;
        }

        const step = Math.min(dist, Math.max(380, (player.pickupRadius - dist) * 9) * dt);
        const dx = player.x - drop.x;
        const dy = player.y - drop.y;
        drop.x += (dx / dist) * step;
        drop.y += (dy / dist) * step;

        const newDist = Math.hypot(player.x - drop.x, player.y - drop.y);
        if (newDist <= 26) {
          this.collectDrop(drop);
          continue;
        }
      }

      remainingDrops.push(drop);
    }
    this.state.drops = remainingDrops;
  }

  private collectDrop(drop: SafetyDrop) {
    if (drop.isHeal) {
      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 25);
    } else {
      this.addExp(drop.exp);
    }
    // Increment ultimate charge by +0.8%
    this.state.ultimateCharge = Math.min(
      this.state.maxUltimateCharge,
      this.state.ultimateCharge + 0.8,
    );
  }

  addExp(amount: number) {
    this.state.currentExp += amount;
    if (this.state.currentExp >= this.state.nextLevelExp) {
      this.state.currentExp -= this.state.nextLevelExp;
      this.state.level += 1;
      this.state.nextLevelExp = Math.round(this.state.nextLevelExp * 1.35 + 8);
      this.triggerLevelUp();
    }
  }

  triggerLevelUp() {
    this.state.phase = 'levelup';

    // 1. Check if any Super Protocol evolution is ready!
    // Ready when base weapon is Lv.5 and support perk is at least Lv.1
    const availableEvolutions: EvolutionPerkId[] = [];
    for (const [evoId, recipe] of Object.entries(EVOLUTION_RECIPES) as [EvolutionPerkId, { weapon: BaseWeaponId; support: SupportPerkId }][]) {
      const isAlreadyEvolved = (this.state.activePerks[evoId] ?? 0) > 0;
      if (!isAlreadyEvolved) {
        const weaponLvl = this.state.activePerks[recipe.weapon] ?? 0;
        const supportLvl = this.state.activePerks[recipe.support] ?? 0;
        if (weaponLvl >= 5 && supportLvl >= 1) {
          availableEvolutions.push(evoId);
        }
      }
    }

    // 2. Regular perks that can level up
    const availablePerkIds = (Object.keys(PERK_CATALOG) as PerkId[]).filter(id => {
      const meta = PERK_CATALOG[id];
      if (meta.category === 'evolution') return false; // Handled separately
      const currentLevel = this.state.activePerks[id] ?? 0;
      return currentLevel < meta.maxLevel;
    });

    const shuffled = [...availablePerkIds].sort(() => Math.random() - 0.5);

    // If an evolution is available, include it as the first gold option!
    const selectedIds: PerkId[] = [];
    if (availableEvolutions.length > 0) {
      selectedIds.push(availableEvolutions[0]!);
    }

    for (const id of shuffled) {
      if (selectedIds.length >= 3) break;
      if (!selectedIds.includes(id)) {
        selectedIds.push(id);
      }
    }

    this.state.perkOptions = selectedIds.map(id => {
      const meta = PERK_CATALOG[id];
      const currentLevel = this.state.activePerks[id] ?? 0;
      return {
        ...meta,
        level: currentLevel + 1,
      };
    });

    // Fallback if all perks maxed out
    if (this.state.perkOptions.length === 0) {
      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 30);
      this.state.score += 500;
      this.state.phase = 'playing';
    }
  }

  rerollPerks(): boolean {
    if (this.state.rerollsLeft <= 0 || this.state.phase !== 'levelup') {
      return false;
    }
    this.state.rerollsLeft -= 1;
    this.triggerLevelUp();
    return true;
  }

  applyPerk(perkId: PerkId) {
    const currentLvl = this.state.activePerks[perkId] ?? 0;
    const nextLvl = currentLvl + 1;
    this.state.activePerks[perkId] = nextLvl;

    const { player } = this.state;
    const perkMeta = PERK_CATALOG[perkId];

    // Check Evolution Announcement Banner
    if (perkMeta.category === 'evolution') {
      this.state.evolutionBanner = {
        title: perkMeta.name,
        subtitle: '★ SUPER PROTOCOL EVOLUTION ACTIVATED ★',
        icon: perkMeta.icon,
        timer: 3.5,
      };
      this.state.score += 1000;
    }

    // Apply immediate passive stat effects
    if (perkId === 'steel_boots') {
      player.speed += 30;
    } else if (perkId === 'magnet_beacon') {
      player.pickupRadius += 35;
    } else if (perkId === 'safety_harness') {
      player.maxHp += 30;
      player.hp = Math.min(player.maxHp, player.hp + 30);
      player.regenRate += 1.5;
    } else if (perkId === 'quick_reflexes') {
      player.cooldownReduction += 0.12;
    } else if (perkId === 'data_chip') {
      player.critRate += 0.10;
      player.damageMultiplier += 0.15;
    }

    this.state.perkOptions = [];
    this.state.phase = 'playing';
  }

  private findNearestHazard(x: number, y: number): Hazard | null {
    let bestDist = Infinity;
    let nearest: Hazard | null = null;
    for (const h of this.state.hazards) {
      const dist = Math.hypot(h.x - x, h.y - y);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = h;
      }
    }
    return nearest;
  }
}
