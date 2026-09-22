import type {
  DefenseCommand, DefenseCommandResult, DefenseContent, DefenseEnemyDefinition, DefenseEnemyState,
  DefenseRunState, DefenseTowerDefinition, DefenseTowerLevel, DefenseTowerState,
} from '../domain/defense';

export function createDefenseRun(content: DefenseContent, supportId: string | null = null): DefenseRunState {
  const support = supportId ? content.supports.find(item => item.id === supportId) : undefined;
  if (supportId && !support) throw new Error(`Unknown support: ${supportId}`);
  return Object.freeze({
    rulesVersion: content.rulesVersion,
    contentVersion: content.contentVersion,
    phase: 'READY',
    paused: false,
    speed: 1,
    globalTick: 0,
    waveIndex: 0,
    waveTick: 0,
    intermissionRemainingTicks: 0,
    resource: content.initialResource,
    shield: content.initialShield,
    completedWaves: 0,
    score: 0,
    enemies: Object.freeze([]),
    towers: Object.freeze([]),
    spawnSequence: 0,
    towerSequence: 0,
    selectedSupportId: supportId,
    supportCooldownRemainingTicks: support?.initialCooldownTicks ?? 0,
    freezeMovementUntilTick: 0,
    revealAllUntilTick: 0,
    rangeBonusUntilTick: 0,
  });
}

const ok = (state: DefenseRunState): DefenseCommandResult => ({ ok: true, state });
const reject = (state: DefenseRunState, reason: string): DefenseCommandResult => ({ ok: false, state, reason });
const replace = (state: DefenseRunState, patch: Partial<DefenseRunState>): DefenseRunState => Object.freeze({ ...state, ...patch });

function towerDefinition(content: DefenseContent, towerId: string): DefenseTowerDefinition | undefined {
  return content.towers.find(item => item.id === towerId);
}
function towerLevel(definition: DefenseTowerDefinition, levelId: string): DefenseTowerLevel | undefined {
  return definition.levels.find(level => level.id === levelId);
}
function enemyDefinition(content: DefenseContent, enemyId: string): DefenseEnemyDefinition {
  const definition = content.enemies.find(item => item.id === enemyId);
  if (!definition) throw new Error(`Missing enemy definition: ${enemyId}`);
  return definition;
}
function selectedSupport(content: DefenseContent, state: DefenseRunState) {
  return state.selectedSupportId ? content.supports.find(item => item.id === state.selectedSupportId) : undefined;
}
function padPoint(content: DefenseContent, padId: string) {
  return content.map.pads.find(pad => pad.id === padId);
}
function pathLengths(content: DefenseContent): { readonly cumulative: readonly number[]; readonly total: number } {
  const cumulative = [0];
  let total = 0;
  for (let i = 1; i < content.map.path.length; i++) {
    const a = content.map.path[i - 1]!;
    const b = content.map.path[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
    cumulative.push(total);
  }
  return { cumulative, total };
}
export function defensePositionAt(content: DefenseContent, progress: number): { readonly x: number; readonly y: number } {
  const lengths = pathLengths(content);
  const clamped = Math.max(0, Math.min(progress, lengths.total));
  for (let i = 1; i < lengths.cumulative.length; i++) {
    const end = lengths.cumulative[i]!;
    if (clamped <= end) {
      const start = lengths.cumulative[i - 1]!;
      const a = content.map.path[i - 1]!;
      const b = content.map.path[i]!;
      const ratio = end === start ? 0 : (clamped - start) / (end - start);
      return { x: a[0] + (b[0] - a[0]) * ratio, y: a[1] + (b[1] - a[1]) * ratio };
    }
  }
  const last = content.map.path.at(-1)!;
  return { x: last[0], y: last[1] };
}
function remainingDistance(content: DefenseContent, enemy: DefenseEnemyState): number {
  return pathLengths(content).total - enemy.progress;
}
function towerPosition(content: DefenseContent, tower: DefenseTowerState) {
  const pad = padPoint(content, tower.padId);
  if (!pad) throw new Error(`Missing pad: ${tower.padId}`);
  return pad;
}
function distanceSq(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }): number {
  const dx = a.x - b.x; const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
function activeSlow(state: DefenseRunState, enemy: DefenseEnemyState, definition: DefenseEnemyDefinition): number {
  let strongest = 0;
  for (const effect of enemy.slowEffects) if (state.globalTick >= 0 && state.globalTick < effect.endTick) strongest = Math.max(strongest, effect.fraction);
  return definition.boss ? strongest * 0.5 : strongest;
}
function isVisible(state: DefenseRunState, enemy: DefenseEnemyState, definition: DefenseEnemyDefinition): boolean {
  return !definition.hidden || state.globalTick < enemy.revealedUntilTick || state.globalTick < state.revealAllUntilTick;
}
function currentArmor(state: DefenseRunState, enemy: DefenseEnemyState, definition: DefenseEnemyDefinition): number {
  if (enemy.bossArmorStartTick !== null && enemy.bossArmorEndTick !== null
    && state.globalTick >= enemy.bossArmorStartTick && state.globalTick < enemy.bossArmorEndTick) {
    return definition.phase?.armor ?? definition.armor;
  }
  return definition.armor;
}
function damageAmount(raw: number, type: DefenseTowerLevel['damageType'], armor: number): number {
  return type === 'PURE' ? Math.floor(raw) : Math.max(1, Math.floor(raw * (1 - armor)));
}
function sortedTargets(content: DefenseContent, state: DefenseRunState, mode: DefenseTowerState['targetMode'], enemies: readonly DefenseEnemyState[]) {
  return [...enemies].sort((a, b) => {
    if (mode === 'STRONG' && a.hp !== b.hp) return b.hp - a.hp;
    const remain = remainingDistance(content, a) - remainingDistance(content, b);
    return remain !== 0 ? remain : a.spawnSequence - b.spawnSequence;
  });
}
function nextUpgrade(definition: DefenseTowerDefinition, currentLevelId: string, requestedLevelId: string) {
  const requested = towerLevel(definition, requestedLevelId);
  return requested?.from === currentLevelId ? requested : undefined;
}
function frozen<T>(items: readonly T[]): readonly T[] { return Object.freeze([...items]); }

export function applyDefenseCommand(content: DefenseContent, state: DefenseRunState, command: DefenseCommand): DefenseCommandResult {
  if (state.phase === 'WON' || state.phase === 'LOST') return reject(state, 'RUN_FINISHED');

  if (command.type === 'SetPaused') return ok(replace(state, { paused: command.paused }));
  if (command.type === 'SetSpeed') return content.speeds.includes(command.speed)
    ? ok(replace(state, { speed: command.speed })) : reject(state, 'INVALID_SPEED');
  if (command.type === 'SelectSupport') {
    if (state.phase !== 'READY') return reject(state, 'SUPPORT_LOCKED');
    const support = content.supports.find(item => item.id === command.supportId);
    return support ? ok(replace(state, { selectedSupportId: support.id, supportCooldownRemainingTicks: support.initialCooldownTicks }))
      : reject(state, 'UNKNOWN_SUPPORT');
  }

  const placementAllowed = state.phase === 'READY' || state.phase === 'RUNNING' || state.phase === 'INTERMISSION';
  if (command.type === 'Build') {
    if (!placementAllowed) return reject(state, 'BUILD_NOT_ALLOWED');
    if (!padPoint(content, command.padId)) return reject(state, 'UNKNOWN_PAD');
    if (state.towers.some(tower => tower.padId === command.padId)) return reject(state, 'PAD_OCCUPIED');
    const definition = towerDefinition(content, command.towerId);
    if (!definition || !content.scenario.availableTowers.includes(command.towerId)) return reject(state, 'UNKNOWN_TOWER');
    const level = definition.levels.find(item => item.from === null);
    if (!level) return reject(state, 'MISSING_ROOT_LEVEL');
    if (state.resource < level.cost) return reject(state, 'INSUFFICIENT_RESOURCE');
    const sequence = state.towerSequence + 1;
    const tower: DefenseTowerState = Object.freeze({
      instanceId: `T${sequence}`, installationSequence: sequence, padId: command.padId, towerId: definition.id,
      levelId: level.id, invested: level.cost, targetMode: content.defaultTargetMode,
      cooldownRemainingTicks: 0, revealCooldownRemainingTicks: 0,
    });
    return ok(replace(state, { resource: state.resource - level.cost, towerSequence: sequence, towers: frozen([...state.towers, tower]) }));
  }
  if (command.type === 'Upgrade') {
    if (!placementAllowed) return reject(state, 'UPGRADE_NOT_ALLOWED');
    const tower = state.towers.find(item => item.instanceId === command.towerInstanceId);
    if (!tower) return reject(state, 'UNKNOWN_TOWER_INSTANCE');
    const definition = towerDefinition(content, tower.towerId)!;
    const level = nextUpgrade(definition, tower.levelId, command.levelId);
    if (!level) return reject(state, 'INVALID_UPGRADE_PATH');
    if (state.resource < level.cost) return reject(state, 'INSUFFICIENT_RESOURCE');
    const upgraded = Object.freeze({
      ...tower, levelId: level.id, invested: tower.invested + level.cost,
      cooldownRemainingTicks: Math.min(tower.cooldownRemainingTicks, level.intervalTicks),
      revealCooldownRemainingTicks: level.revealIntervalTicks > 0
        ? Math.min(tower.revealCooldownRemainingTicks, level.revealIntervalTicks) : 0,
    });
    return ok(replace(state, {
      resource: state.resource - level.cost,
      towers: frozen(state.towers.map(item => item.instanceId === tower.instanceId ? upgraded : item)),
    }));
  }
  if (command.type === 'Sell') {
    if (!placementAllowed) return reject(state, 'SELL_NOT_ALLOWED');
    const tower = state.towers.find(item => item.instanceId === command.towerInstanceId);
    if (!tower) return reject(state, 'UNKNOWN_TOWER_INSTANCE');
    const refund = Math.floor(tower.invested * content.sellRate);
    return ok(replace(state, {
      resource: state.resource + refund,
      towers: frozen(state.towers.filter(item => item.instanceId !== tower.instanceId)),
    }));
  }
  if (command.type === 'SetTargetMode') {
    const tower = state.towers.find(item => item.instanceId === command.towerInstanceId);
    if (!tower || !content.targetModes.includes(command.mode)) return reject(state, 'INVALID_TARGET_MODE');
    return ok(replace(state, {
      towers: frozen(state.towers.map(item => item.instanceId === tower.instanceId ? Object.freeze({ ...item, targetMode: command.mode }) : item)),
    }));
  }
  if (command.type === 'StartWave') {
    if (state.paused) return reject(state, 'PAUSED');
    if (!(state.phase === 'READY' || state.phase === 'INTERMISSION')) return reject(state, 'WAVE_ALREADY_RUNNING');
    const nextIndex = state.phase === 'READY' ? state.waveIndex : state.waveIndex + 1;
    if (!content.waves[nextIndex]) return reject(state, 'NO_NEXT_WAVE');
    return ok(replace(state, { phase: 'RUNNING', waveIndex: nextIndex, waveTick: 0, intermissionRemainingTicks: 0 }));
  }
  if (command.type === 'UseSupport') {
    if (state.phase !== 'RUNNING' || state.paused) return reject(state, 'SUPPORT_NOT_ALLOWED');
    const support = selectedSupport(content, state);
    if (!support) return reject(state, 'SUPPORT_NOT_SELECTED');
    if (state.supportCooldownRemainingTicks > 0) return reject(state, 'SUPPORT_COOLDOWN');
    const end = state.globalTick;
    const revealUntil = support.revealAllTicks > 0 ? end + support.revealAllTicks : state.revealAllUntilTick;
    return ok(replace(state, {
      supportCooldownRemainingTicks: support.cooldownTicks,
      freezeMovementUntilTick: support.freezeMovementTicks > 0 ? end + support.freezeMovementTicks : state.freezeMovementUntilTick,
      revealAllUntilTick: Math.max(state.revealAllUntilTick, revealUntil),
      rangeBonusUntilTick: Math.max(state.rangeBonusUntilTick, support.rangeBonusTicks > 0 ? end + support.rangeBonusTicks : state.rangeBonusUntilTick),
      enemies: support.revealAllTicks > 0
        ? frozen(state.enemies.map(enemy => Object.freeze({ ...enemy, revealedUntilTick: Math.max(enemy.revealedUntilTick, revealUntil) })))
        : state.enemies,
    }));
  }
  return reject(state, 'UNKNOWN_COMMAND');
}

function spawnForTick(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  const wave = content.waves[state.waveIndex];
  if (!wave) return state;
  let sequence = state.spawnSequence;
  const spawned: DefenseEnemyState[] = [];
  for (const group of wave.groups) {
    if (state.waveTick < group.startTick) continue;
    const delta = state.waveTick - group.startTick;
    if (delta % group.intervalTicks !== 0) continue;
    const index = delta / group.intervalTicks;
    if (index < 0 || index >= group.count) continue;
    const definition = enemyDefinition(content, group.enemy);
    sequence += 1;
    spawned.push(Object.freeze({
      instanceId: `E${sequence}`, definitionId: definition.id, spawnSequence: sequence, hp: definition.hp,
      progress: 0, slowEffects: Object.freeze([]), revealedUntilTick: state.globalTick < state.revealAllUntilTick ? state.revealAllUntilTick : 0,
      leaked: false, bossPhaseTriggers: 0, bossArmorStartTick: null, bossArmorEndTick: null,
    }));
  }
  return spawned.length === 0 ? state : replace(state, { spawnSequence: sequence, enemies: frozen([...state.enemies, ...spawned]) });
}
function moveEnemies(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  if (state.globalTick < state.freezeMovementUntilTick) return state;
  const total = pathLengths(content).total;
  const moved = state.enemies.map(enemy => {
    if (enemy.hp <= 0 || enemy.leaked) return enemy;
    const definition = enemyDefinition(content, enemy.definitionId);
    const slow = activeSlow(state, enemy, definition);
    const distance = definition.speed * (content.tickMs / 1000) * (1 - slow);
    return Object.freeze({ ...enemy, progress: Math.min(total, enemy.progress + distance) });
  });
  return replace(state, { enemies: frozen(moved) });
}
function leakEnemies(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  const total = pathLengths(content).total;
  let shield = state.shield;
  const enemies = state.enemies.map(enemy => {
    if (enemy.hp > 0 && !enemy.leaked && enemy.progress >= total) {
      shield = Math.max(0, shield - enemyDefinition(content, enemy.definitionId).leak);
      return Object.freeze({ ...enemy, leaked: true });
    }
    return enemy;
  });
  return replace(state, { shield, enemies: frozen(enemies) });
}
function updateDetection(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  let enemies = [...state.enemies];
  const bonus = state.globalTick < state.rangeBonusUntilTick ? selectedSupport(content, state)?.rangeBonus ?? 0 : 0;
  const towers: DefenseTowerState[] = [];
  for (const tower of [...state.towers].sort((a, b) => a.installationSequence - b.installationSequence)) {
    const definition = towerDefinition(content, tower.towerId)!;
    const level = towerLevel(definition, tower.levelId)!;
    let revealCooldown = Math.max(0, tower.revealCooldownRemainingTicks - 1);
    if (level.revealRadius > 0 && revealCooldown === 0) {
      const origin = towerPosition(content, tower);
      const radius = level.revealRadius + bonus;
      enemies = enemies.map(enemy => {
        if (enemy.hp <= 0 || enemy.leaked) return enemy;
        const pos = defensePositionAt(content, enemy.progress);
        return distanceSq(origin, pos) <= radius * radius
          ? Object.freeze({ ...enemy, revealedUntilTick: Math.max(enemy.revealedUntilTick, state.globalTick + level.revealTicks) })
          : enemy;
      });
      revealCooldown = level.revealIntervalTicks;
    }
    towers.push(Object.freeze({ ...tower, revealCooldownRemainingTicks: revealCooldown }));
  }
  return replace(state, { enemies: frozen(enemies), towers: frozen(towers) });
}
function attackWithTowers(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  let enemies = [...state.enemies];
  const towers: DefenseTowerState[] = [];
  let reward = 0;
  const bonus = state.globalTick < state.rangeBonusUntilTick ? selectedSupport(content, state)?.rangeBonus ?? 0 : 0;
  const deadBefore = new Set(enemies.filter(enemy => enemy.hp <= 0).map(enemy => enemy.instanceId));

  for (const tower of [...state.towers].sort((a, b) => a.installationSequence - b.installationSequence)) {
    const definition = towerDefinition(content, tower.towerId)!;
    const level = towerLevel(definition, tower.levelId)!;
    let cooldown = Math.max(0, tower.cooldownRemainingTicks - 1);
    if (cooldown === 0) {
      const origin = towerPosition(content, tower);
      const range = level.range + bonus;
      const candidates = enemies.filter(enemy => {
        if (enemy.hp <= 0 || enemy.leaked) return false;
        const definition = enemyDefinition(content, enemy.definitionId);
        return isVisible(state, enemy, definition) && distanceSq(origin, defensePositionAt(content, enemy.progress)) <= range * range;
      });
      const target = sortedTargets(content, state, tower.targetMode, candidates)[0];
      if (target) {
        const center = defensePositionAt(content, target.progress);
        const hit = sortedTargets(content, state, 'FIRST', candidates.filter(enemy =>
          enemy.instanceId === target.instanceId || (level.splashRadius > 0
            && distanceSq(center, defensePositionAt(content, enemy.progress)) <= level.splashRadius * level.splashRadius)))
          .sort((a, b) => a.instanceId === target.instanceId ? -1 : b.instanceId === target.instanceId ? 1 : 0)
          .slice(0, level.maxTargets);
        const hitIds = new Set(hit.map(enemy => enemy.instanceId));
        enemies = enemies.map(enemy => {
          if (!hitIds.has(enemy.instanceId) || enemy.hp <= 0) return enemy;
          const enemyDef = enemyDefinition(content, enemy.definitionId);
          const nextHp = Math.max(0, enemy.hp - damageAmount(level.damage, level.damageType, currentArmor(state, enemy, enemyDef)));
          const slowFraction = level.slowFraction;
          const effects = slowFraction > 0 && nextHp > 0
            ? [...enemy.slowEffects.filter(effect => effect.sourceId !== tower.instanceId),
              { sourceId: tower.instanceId, fraction: slowFraction, endTick: state.globalTick + level.slowTicks }]
            : enemy.slowEffects;
          return Object.freeze({ ...enemy, hp: nextHp, slowEffects: frozen(effects) });
        });
        cooldown = level.intervalTicks;
      }
    }
    towers.push(Object.freeze({ ...tower, cooldownRemainingTicks: cooldown }));
  }

  for (const enemy of enemies) {
    if (enemy.hp <= 0 && !deadBefore.has(enemy.instanceId) && !enemy.leaked) reward += enemyDefinition(content, enemy.definitionId).reward;
  }
  return replace(state, { enemies: frozen(enemies), towers: frozen(towers), resource: state.resource + reward });
}
function updateBossPhase(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  const enemies = state.enemies.map(enemy => {
    const definition = enemyDefinition(content, enemy.definitionId);
    const phase = definition.phase;
    if (!definition.boss || !phase || enemy.hp <= 0 || enemy.bossPhaseTriggers >= phase.maxTriggers) return enemy;
    if (enemy.hp / definition.hp > phase.triggerHpRatio) return enemy;
    return Object.freeze({
      ...enemy, bossPhaseTriggers: enemy.bossPhaseTriggers + 1,
      bossArmorStartTick: state.globalTick + 1,
      bossArmorEndTick: state.globalTick + 1 + phase.durationTicks,
    });
  });
  return replace(state, { enemies: frozen(enemies) });
}
function cleanupEffects(state: DefenseRunState): DefenseRunState {
  return replace(state, {
    enemies: frozen(state.enemies.map(enemy => Object.freeze({
      ...enemy, slowEffects: frozen(enemy.slowEffects.filter(effect => state.globalTick < effect.endTick)),
    }))),
  });
}
function allScheduledSpawned(content: DefenseContent, state: DefenseRunState): boolean {
  const wave = content.waves[state.waveIndex];
  if (!wave) return true;
  return wave.groups.every(group => state.waveTick >= group.startTick + (group.count - 1) * group.intervalTicks);
}
function settleWave(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  if (state.shield <= 0) return replace(state, { phase: 'LOST', shield: 0, score: state.completedWaves * 1000 });
  const alive = state.enemies.some(enemy => enemy.hp > 0 && !enemy.leaked);
  if (!allScheduledSpawned(content, state) || alive) return state;
  const completedWaves = state.waveIndex + 1;
  const resource = state.resource + content.waveClearReward;
  const score = completedWaves * 1000 + state.shield * 100;
  if (completedWaves >= content.waves.length) return replace(state, { phase: 'WON', completedWaves, resource, score });
  return replace(state, { phase: 'INTERMISSION', completedWaves, resource, score, intermissionRemainingTicks: content.intermissionTicks });
}
function tickCooldowns(state: DefenseRunState): DefenseRunState {
  return replace(state, { supportCooldownRemainingTicks: Math.max(0, state.supportCooldownRemainingTicks - 1) });
}

export function tickDefense(content: DefenseContent, state: DefenseRunState): DefenseRunState {
  if (state.paused || state.phase === 'WON' || state.phase === 'LOST' || state.phase === 'READY') return state;

  if (state.phase === 'INTERMISSION') {
    const cooled = tickCooldowns(replace(state, {
      globalTick: state.globalTick + 1,
      towers: frozen(state.towers.map(tower => Object.freeze({
        ...tower,
        cooldownRemainingTicks: Math.max(0, tower.cooldownRemainingTicks - 1),
        revealCooldownRemainingTicks: Math.max(0, tower.revealCooldownRemainingTicks - 1),
      }))),
      intermissionRemainingTicks: Math.max(0, state.intermissionRemainingTicks - 1),
    }));
    return cooled.intermissionRemainingTicks === 0
      ? replace(cooled, { phase: 'RUNNING', waveIndex: cooled.waveIndex + 1, waveTick: 0 })
      : cooled;
  }

  let next = spawnForTick(content, state);
  next = moveEnemies(content, next);
  next = leakEnemies(content, next);
  next = updateDetection(content, next);
  next = attackWithTowers(content, next);
  next = updateBossPhase(content, next);
  next = cleanupEffects(next);
  next = settleWave(content, next);
  if (next.phase === 'RUNNING') next = replace(next, { waveTick: next.waveTick + 1 });
  next = tickCooldowns(next);
  return replace(next, { globalTick: next.globalTick + 1 });
}

export function defenseStars(state: DefenseRunState): 0 | 1 | 2 | 3 {
  if (state.phase !== 'WON') return 0;
  if (state.shield === 20) return 3;
  if (state.shield >= 15) return 2;
  return 1;
}
