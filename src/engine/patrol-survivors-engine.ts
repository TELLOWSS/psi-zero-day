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
} from '../domain/patrol-survivors';

export const WORLD_WIDTH = 1400;
export const WORLD_HEIGHT = 900;
export const TARGET_SURVIVAL_TIME = 180; // 3 minutes

export const CHARACTER_PROFILES: Record<CharacterId, CharacterProfile> = {
  yoon: {
    id: 'yoon',
    name: '윤재호',
    role: '신임 안전관리자',
    title: '초감각 감지관',
    description: '현장 위험 신호를 빠르게 캐치합니다. PSI 데이터 흡수 반경 +30%, 레벨업 요구치 경감.',
    startingWeapon: 'radio_boost',
    avatar: '👨‍💼',
    color: '#38bdf8',
  },
  park: {
    id: 'park',
    name: '박기철',
    role: '베테랑 골조반장',
    title: '현장 돌파 맷집',
    description: '수십 년 현장 경험으로 다져진 강인한 체력. 최대 HP +50, 충돌 넉백 저항 및 높은 위력.',
    startingWeapon: 'extinguisher',
    avatar: '👷‍♂️',
    color: '#f97316',
  },
  jung: {
    id: 'jung',
    name: '정민주',
    role: '스마트 안전 연구원',
    title: 'AI 오버클러커',
    description: '드론과 센서 통제 전문가. 모든 쿨다운 -15%, 치명타 확률 +15%, 스마트 드론으로 순찰 시작.',
    startingWeapon: 'safety_drone',
    avatar: '👩‍🔬',
    color: '#a855f7',
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
): SurvivorsGameState {
  const profile = CHARACTER_PROFILES[characterId];

  // Base stats influenced by character & permanent upgrades
  const baseHp = (characterId === 'park' ? 150 : 100) + upgrades.vitality * 15;
  const baseSpeed = (characterId === 'park' ? 200 : characterId === 'yoon' ? 230 : 220) + upgrades.mobility * 15;
  const basePickup = (characterId === 'yoon' ? 115 : 90) + upgrades.intelligence * 20;
  const baseCooldown = characterId === 'jung' ? 0.15 : 0;
  const baseCrit = characterId === 'jung' ? 0.20 : 0.05;
  const baseDmg = characterId === 'park' ? 1.2 : 1.0;

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
    this.updateDrops(effectiveDt);
    this.checkCollisions();

    // Check survival victory
    if (this.state.gameTime >= this.state.maxTime) {
      this.state.phase = 'victory';
      this.state.score += 5000;
      this.state.psiCredits += Math.round(this.state.score / 10);
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

    // Direction normalize
    const len = Math.hypot(input.moveX, input.moveY);
    if (len > 0.001) {
      const nx = input.moveX / len;
      const ny = input.moveY / len;
      player.x += nx * player.speed * dt;
      player.y += ny * player.speed * dt;
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
    const { player, activePerks, hazards } = this.state;
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

      // Boss event checking at 60s, 120s, 160s
      const time = Math.floor(this.state.gameTime);
      if (time === 60 && !this.state.hazards.some(h => h.type === 'CRANE_BOSS')) {
        this.triggerBossAlert('타이탄 크레인 8000 (TITAN CRANE)');
        this.spawnHazard('CRANE_BOSS');
        return;
      }

      // Determine enemy type by elapsed time
      const rand = Math.random();
      let type: HazardType = 'UNHELMETED';

      if (this.state.gameTime > 120 && rand < 0.12) {
        type = 'CRANE_BOSS';
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

  private spawnHazard(type: HazardType) {
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
      hp = 500;
      speed = 65;
      radius = 34;
      damage = 35;
      expValue = 45;
    }

    // Time scaling
    const scale = 1 + (this.state.gameTime / 60) * 0.45;
    hp = Math.round(hp * scale);

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
      if (h.isStunned && h.isStunned > 0) {
        h.isStunned -= dt;
        continue;
      }

      // Chase player
      const dx = player.x - h.x;
      const dy = player.y - h.y;
      const dist = Math.hypot(dx, dy) || 1;

      h.x += (dx / dist) * h.speed * dt;
      h.y += (dy / dist) * h.speed * dt;
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

          // Push back
          const knockback = p.kind === 'cone_trap' ? 55 : p.kind === 'radio' ? 25 : 8;
          const kx = (h.x - player.x) || 1;
          const ky = (h.y - player.y) || 1;
          const klen = Math.hypot(kx, ky);
          h.x += (kx / klen) * knockback;
          h.y += (ky / klen) * knockback;

          if (p.pierce <= 0) {
            p.duration = 0; // destroyed
            break;
          }
        }
      }
    }

    // Filter dead hazards and spawn drops
    const survivingHazards: Hazard[] = [];
    for (const h of hazards) {
      if (h.hp <= 0) {
        this.state.score += h.expValue * 15;
        this.state.hazardsNeutralized += 1;

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
