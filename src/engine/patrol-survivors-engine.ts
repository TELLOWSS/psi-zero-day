import type {
  Hazard,
  HazardType,
  Perk,
  PerkId,
  PlayerStats,
  Projectile,
  SafetyDrop,
  SurvivorsGameState,
} from '../domain/patrol-survivors';

export const WORLD_WIDTH = 1400;
export const WORLD_HEIGHT = 900;
export const TARGET_SURVIVAL_TIME = 180; // 3 minutes

export const PERK_CATALOG: Record<PerkId, Omit<Perk, 'level'>> = {
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
};

export interface GameInput {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  aimX?: number; // target coordinate
  aimY?: number;
  triggerAction?: boolean;
}

export function createInitialSurvivorsState(): SurvivorsGameState {
  const initialPlayer: PlayerStats = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    hp: 100,
    maxHp: 100,
    speed: 220,
    invincibleTime: 0,
    pickupRadius: 90,
    cooldownReduction: 0,
    damageMultiplier: 1.0,
    regenRate: 0,
  };

  return {
    phase: 'ready',
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
    activePerks: {
      radio_boost: 1,
      extinguisher: 0,
      floodlight: 0,
      cone_trap: 0,
      safety_drone: 0,
      steel_boots: 0,
      magnet_beacon: 0,
      safety_harness: 0,
      quick_reflexes: 0,
    },
    perkOptions: [],
    droneAngle: 0,
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
  spawnTimer: number;
}

export class SurvivorsEngine {
  private cooldowns: Cooldowns = {
    radio: 0,
    extinguisher: 0,
    cone: 0,
    drone: 0,
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
    const delta = Math.min(dt, 0.1);
    this.state.gameTime += delta;

    this.updatePlayer(delta, input);
    this.updateWeapons(delta, input);
    this.updateProjectiles(delta);
    this.updateSpawns(delta);
    this.updateHazards(delta);
    this.updateDrops(delta);
    this.checkCollisions();

    // Check survival victory
    if (this.state.gameTime >= this.state.maxTime) {
      this.state.phase = 'victory';
      this.state.score += 5000;
    }
  }

  private updatePlayer(dt: number, input: GameInput) {
    const { player } = this.state;

    // Direction normalize
    let len = Math.hypot(input.moveX, input.moveY);
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
    if (this.state.activePerks.safety_drone > 0) {
      this.state.droneAngle = ((this.state.droneAngle ?? 0) + dt * 2.5) % (Math.PI * 2);
    }
  }

  private updateWeapons(dt: number, _input?: GameInput) {
    const { player, activePerks, hazards } = this.state;
    const cdReduction = 1 - Math.min(0.5, player.cooldownReduction);

    // 1. Radio Weapon (fires at closest enemy)
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
          const speed = 480;
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
              vx: ndx * speed,
              vy: ndy * speed,
              radius: 9 + radioLvl,
              damage: (20 + radioLvl * 8) * player.damageMultiplier,
              duration: 1.2,
              pierce: radioLvl >= 5 ? 2 : 1,
              kind: 'radio',
            });
          }
        }
      }
    }

    // 2. Extinguisher (cone spray in facing direction)
    const extLvl = activePerks.extinguisher;
    if (extLvl > 0) {
      this.cooldowns.extinguisher -= dt;
      const extCd = Math.max(0.12, 0.3 - extLvl * 0.03) * cdReduction;
      if (this.cooldowns.extinguisher <= 0) {
        this.cooldowns.extinguisher = extCd;
        const spread = (Math.random() - 0.5) * 0.7;
        const cos = Math.cos(spread);
        const sin = Math.sin(spread);
        const vx = (this.lastFacingX * cos - this.lastFacingY * sin) * 280;
        const vy = (this.lastFacingX * sin + this.lastFacingY * cos) * 280;

        this.state.projectiles.push({
          id: genId('proj_ext'),
          x: player.x + this.lastFacingX * 15,
          y: player.y + this.lastFacingY * 15,
          vx,
          vy,
          radius: 14 + extLvl * 3,
          damage: (8 + extLvl * 4) * player.damageMultiplier,
          duration: 0.6,
          pierce: 99, // cloud pierces through
          kind: 'extinguisher',
        });
      }
    }

    // 3. Floodlight (Continuous aura damage around player)
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

    // 4. Traffic Cone Trap (drops stationary cones on floor)
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

    // 5. Safety Drone (orbits player and shoots nearest enemy)
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

  private updateProjectiles(dt: number) {
    const alive: Projectile[] = [];
    for (const p of this.state.projectiles) {
      p.duration -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (
        p.duration > 0 &&
        p.x >= -50 &&
        p.x <= WORLD_WIDTH + 50 &&
        p.y >= -50 &&
        p.y <= WORLD_HEIGHT + 50
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
    const spawnInterval = Math.max(0.25, 1.4 - timeProgress * 1.05);

    if (this.cooldowns.spawnTimer <= 0) {
      this.cooldowns.spawnTimer = spawnInterval;

      // Determine enemy type by elapsed time
      const rand = Math.random();
      let type: HazardType = 'UNHELMETED';

      if (this.state.gameTime > 120 && rand < 0.15) {
        type = 'CRANE_BOSS';
      } else if (this.state.gameTime > 60 && rand < 0.35) {
        type = 'RUNAWAY_CART';
      } else if (this.state.gameTime > 30 && rand < 0.6) {
        type = 'GAS_LEAK';
      }

      this.spawnHazard(type);
    }
  }

  private spawnHazard(type: HazardType) {
    // Spawn along border of the world
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
      hp = 60;
      speed = 180;
      radius = 18;
      damage = 22;
      expValue = 7;
    } else if (type === 'GAS_LEAK') {
      hp = 20;
      speed = 70;
      radius = 12;
      damage = 8;
      expValue = 2;
    } else if (type === 'CRANE_BOSS') {
      hp = 450;
      speed = 65;
      radius = 32;
      damage = 35;
      expValue = 40;
    }

    // Time scaling
    const scale = 1 + (this.state.gameTime / 60) * 0.4;
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
          h.hp -= p.damage;
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
        // Drop safety log (exp gem)
        this.state.drops.push({
          id: genId('drop_log'),
          x: h.x,
          y: h.y,
          exp: h.expValue,
          isHeal: Math.random() < 0.05, // 5% chance heal pack
        });
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
            player.hp = 0;
            this.state.phase = 'defeat';
            break;
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
        if (dist <= 24) {
          if (drop.isHeal) {
            player.hp = Math.min(player.maxHp, player.hp + 20);
          } else {
            this.addExp(drop.exp);
          }
          continue;
        }

        const step = Math.min(dist, Math.max(350, (player.pickupRadius - dist) * 8) * dt);
        const dx = player.x - drop.x;
        const dy = player.y - drop.y;
        drop.x += (dx / dist) * step;
        drop.y += (dy / dist) * step;

        const newDist = Math.hypot(player.x - drop.x, player.y - drop.y);
        if (newDist <= 24) {
          if (drop.isHeal) {
            player.hp = Math.min(player.maxHp, player.hp + 20);
          } else {
            this.addExp(drop.exp);
          }
          continue;
        }
      }

      remainingDrops.push(drop);
    }
    this.state.drops = remainingDrops;
  }

  private addExp(amount: number) {
    this.state.currentExp += amount;
    if (this.state.currentExp >= this.state.nextLevelExp) {
      this.state.currentExp -= this.state.nextLevelExp;
      this.state.level += 1;
      this.state.nextLevelExp = Math.round(this.state.nextLevelExp * 1.35 + 8);
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp() {
    this.state.phase = 'levelup';

    // Pick 3 available perks that are not maxed out
    const availablePerkIds = (Object.keys(PERK_CATALOG) as PerkId[]).filter(id => {
      const currentLevel = this.state.activePerks[id] ?? 0;
      return currentLevel < PERK_CATALOG[id].maxLevel;
    });

    // Shuffle and pick up to 3
    const shuffled = [...availablePerkIds].sort(() => Math.random() - 0.5);
    const selectedIds = shuffled.slice(0, 3);

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
      // Heal or bonus score
      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + 30);
      this.state.score += 500;
      this.state.phase = 'playing';
    }
  }

  applyPerk(perkId: PerkId) {
    const currentLvl = this.state.activePerks[perkId] ?? 0;
    const nextLvl = currentLvl + 1;
    this.state.activePerks[perkId] = nextLvl;

    const { player } = this.state;

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
