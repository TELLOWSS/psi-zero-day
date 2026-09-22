import type {
  DefenseCommand, DefenseContent, DefenseEnemyDefinition, DefenseEnemyState, DefenseLevelId,
  DefensePoint, DefenseResult, DefenseRunState, DefenseSlowEffect, DefenseTargetMode,
  DefenseTowerDefinition, DefenseTowerLevelDefinition, DefenseTowerState,
} from '../domain/defense';

const EPSILON = 1e-9;

function replaceAt<T>(items: readonly T[], index: number, value: T): readonly T[] {
  const next = items.slice(); next[index] = value; return next;
}
function towerDefinition(content: DefenseContent, id: string): DefenseTowerDefinition {
  const found = content.towers.find(item => item.id === id);
  if (!found) throw new Error(`Unknown tower: ${id}`);
  return found;
}
function towerLevel(content: DefenseContent, towerId: string, levelId: DefenseLevelId): DefenseTowerLevelDefinition {
  const found = towerDefinition(content, towerId).levels.find(level => level.id === levelId);
  if (!found) throw new Error(`Unknown tower level: ${towerId}/${levelId}`);
  return found;
}
function enemyDefinition(content: DefenseContent, id: string): DefenseEnemyDefinition {
  const found = content.enemies.find(item => item.id === id);
  if (!found) throw new Error(`Unknown enemy: ${id}`);
  return found;
}
function activeRangeBonus(state: DefenseRunState, content: DefenseContent): number {
  if (state.tick >= state.rangeBonusUntilTick) return 0;
  return content.supports.find(s => s.id === state.supportId)?.rangeBonus ?? 0;
}
export function defensePathLength(path: readonly (readonly [number, number])[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!; const b = path[i]!;
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}
export function defensePositionAtDistance(path: readonly (readonly [number, number])[], distance: number): DefensePoint {
  let remaining = Math.max(0, distance);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!; const b = path[i]!;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (remaining <= length || i === path.length - 1) {
      const ratio = length <= EPSILON ? 0 : Math.min(1, remaining / length);
      return { x: a[0] + (b[0] - a[0]) * ratio, y: a[1] + (b[1] - a[1]) * ratio };
    }
    remaining -= length;
  }
  const last = path.at(-1)!; return { x: last[0], y: last[1] };
}
function distanceSquared(a: DefensePoint, b: DefensePoint): number {
  const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy;
}
function enemyVisible(enemy: DefenseEnemyState, definition: DefenseEnemyDefinition, tick: number): boolean {
  return !definition.hidden || enemy.revealUntilTick > tick;
}
function effectiveArmor(enemy: DefenseEnemyState, definition: DefenseEnemyDefinition, tick: number): number {
  if (definition.boss && definition.phase && tick >= enemy.bossArmorFromTick && tick < enemy.bossArmorUntilTick) {
    return definition.phase.armor;
  }
  return definition.armor;
}
function effectiveSlow(enemy: DefenseEnemyState, definition: DefenseEnemyDefinition, tick: number): number {
  let strongest = 0;
  for (const effect of enemy.slowEffects) {
    if (effect.startTick <= tick && tick < effect.endTick) strongest = Math.max(strongest, effect.fraction);
  }
  return definition.boss ? strongest * 0.5 : strongest;
}
function remainingDistance(enemy: DefenseEnemyState, pathLength: number): number {
  return Math.max(0, pathLength - enemy.distance);
}
function compareFirst(a: DefenseEnemyState, b: DefenseEnemyState, pathLength: number): number {
  return remainingDistance(a, pathLength) - remainingDistance(b, pathLength) || a.spawnSequence - b.spawnSequence;
}
function compareTarget(a: DefenseEnemyState, b: DefenseEnemyState, mode: DefenseTargetMode, pathLength: number): number {
  if (mode === 'STRONG') return b.hp - a.hp || compareFirst(a, b, pathLength);
  return compareFirst(a, b, pathLength);
}
function towerPoint(content: DefenseContent, tower: DefenseTowerState): DefensePoint {
  const pad = content.map.pads.find(item => item.id === tower.padId);
  if (!pad) throw new Error(`Unknown pad: ${tower.padId}`);
  return pad;
}
function allSpawned(state: DefenseRunState, content: DefenseContent): boolean {
  const wave = content.waves.find(item => item.id === state.waveId)!;
  return wave.groups.every((group, index) => (state.spawnedByGroup[index] ?? 0) >= group.count);
}
function decrementCooldown(value: number): number { return Math.max(0, value - 1); }

export function createDefenseRun(content: DefenseContent, supportId: DefenseRunState['supportId']): DefenseRunState {
  if (!content.scenario.availableSupports.includes(supportId)) throw new Error(`Support unavailable: ${supportId}`);
  const support = content.supports.find(item => item.id === supportId);
  if (!support) throw new Error(`Unknown support: ${supportId}`);
  return {
    status: 'READY', paused: false, speed: 1, tick: 0, waveId: 1, waveTick: 0,
    intermissionRemaining: 0, shield: content.initialShield, resource: content.initialResource,
    towers: [], enemies: [], spawnedByGroup: content.waves[0]!.groups.map(() => 0),
    nextTowerSequence: 1, nextEnemySequence: 1, supportId,
    supportCooldownRemaining: support.initialCooldownTicks,
    freezeMovementUntilTick: 0, revealAllUntilTick: 0, rangeBonusUntilTick: 0, completedWaves: 0,
  };
}

export function applyDefenseCommand(state: DefenseRunState, content: DefenseContent, command: DefenseCommand): DefenseRunState {
  if (state.status === 'WON' || state.status === 'LOST') return state;
  if (command.type === 'SetPaused') return { ...state, paused: command.paused };
  if (command.type === 'SetSpeed') {
    if (!content.speeds.includes(command.speed)) throw new Error('Unsupported speed');
    return { ...state, speed: command.speed };
  }
  if (command.type === 'StartWave') {
    if (state.paused) throw new Error('Cannot start while paused');
    if (state.status !== 'READY' && state.status !== 'INTERMION') throw new Error('Wave is already running');
    const wave = content.waves.find(item => item.id === state.waveId);
    if (!wave) throw new Error('Missing wave');
    return { ...state, status: 'RUNNING', waveTick: 0, intermissionRemaining: 0, spawnedByGroup: wave.groups.map(() => 0) };
  }
  if (command.type === 'UseSupport') {
    if (state.status !== 'RUNNING' || state.paused) throw new Error('Support requires active combat');
    if (state.supportCooldownRemaining > 0) throw new Error('Support is cooling down');
    const support = content.supports.find(item => item.id === state.supportId)!;
    const untilReveal = state.tick + support.revealAllTicks;
    return {
      ...state,
      supportCooldownRemaining: support.cooldownTicks,
      freezeMovementUntilTick: Math.max(state.freezeMovementUntilTick, state.tick + support.freezeMovementTicks),
      revealAllUntilTick: Math.max(state.revealAllUntilTick, untilReveal),
      rangeBonusUntilTick: Math.max(state.rangeBonusUntilTick, state.tick + support.rangeBonusTicks),
      enemies: support.revealAllTicks > 0
        ? state.enemies.map(enemy => ({ ...enemy, revealUntilTick: Math.max(enemy.revealUntilTick, untilReveal) }))
        : state.enemies,
    };
  }
  const canManageTower = state.status === 'READY' || state.status === 'RUNNING' || state.status === 'INTERMISSION';
  if (!canManageTower) return state;
  if (command.type === 'Build') {
    if (state.towers.some(tower => tower.padId === command.padId)) throw new Error('Pad occupied');
    if (!content.map.pads.some(pad => pad.id === command.padId)) throw new Error('Unknown pad');
    if (!content.scenario.availableTowers.includes(command.towerId)) throw new Error('Tower unavailable');
    const level = towerLevel(content, command.towerId, 'L1');
    if (state.resource < level.cost) throw new Error('Insufficient resource');
    const tower: DefenseTowerState = {
      id: `tower-${state.nextTowerSequence}`, padId: command.padId, towerId: command.towerId, levelId: 'L1',
      targetMode: content.defaultTargetMode, invested: level.cost, attackCooldown: 0, revealCooldown: 0,
    };
    return { ...state, resource: state.resource - level.cost, towers: [...state.towers, tower], nextTowerSequence: state.nextTowerSequence + 1 };
  }
  const index = state.towers.findIndex(tower => tower.id === command.towerInstanceId);
  if (index < 0) throw new Error('Unknown tower instance');
  const tower = state.towers[index]!;
  if (command.type === 'SetTargetMode') {
    if (!content.targetModes.includes(command.targetMode)) throw new Error('Unsupported target mode');
    return { ...state, towers: replaceAt(state.towers, index, { ...tower, targetMode: command.targetMode }) };
  }
  if (command.type === 'Sell') {
    const refund = Math.floor(tower.invested * content.sellRate);
    return { ...state, resource: state.resource + refund, towers: state.towers.filter(item => item.id !== tower.id) };
  }
  const next = towerLevel(content, tower.towerId, command.levelId);
  if (next.from !== tower.levelId) throw new Error('Invalid upgrade path');
  if (state.resource < next.cost) throw new Error('Insufficient resource');
  const upgraded: DefenseTowerState = {
    ...tower, levelId: command.levelId, invested: tower.invested + next.cost,
    attackCooldown: Math.min(tower.attackCooldown, next.intervalTicks),
    revealCooldown: next.revealIntervalTicks > 0 ? Math.min(tower.revealCooldown, next.revealIntervalTicks) : 0,
  };
  return { ...state, resource: state.resource - next.cost, towers: replaceAt(state.towers, index, upgraded) };
}

function spawnDue(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const wave = content.waves.find(item => item.id === state.waveId)!;
  let nextSequence = state.nextEnemySequence;
  const spawned = state.spawnedByGroup.slice();
  const enemies = state.enemies.slice();
  for (let groupIndex = 0; groupIndex < wave.groups.length; groupIndex++) {
    const group = wave.groups[groupIndex]!;
    let count = spawned[groupIndex] ?? 0;
    while (count < group.count && group.startTick + count * group.intervalTicks === state.waveTick) {
      const definition = enemyDefinition(content, group.enemy);
      enemies.push({
        id: `enemy-${nextSequence}`, enemyId: group.enemy, hp: definition.hp, distance: 0,
        spawnSequence: nextSequence, revealUntilTick: state.tick < state.revealAllUntilTick ? state.revealAllUntilTick : 0,
        slowEffects: [], bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
      });
      nextSequence += 1; count += 1;
    }
    spawned[groupIndex] = count;
  }
  return { ...state, enemies, spawnedByGroup: spawned, nextEnemySequence: nextSequence };
}

function moveAndLeak(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const pathLength = defensePathLength(content.map.path);
  let shield = state.shield;
  const moved: DefenseEnemyState[] = [];
  for (const enemy of state.enemies) {
    const definition = enemyDefinition(content, enemy.enemyId);
    const frozen = state.tick < state.freezeMovementUntilTick;
    const slow = effectiveSlow(enemy, definition, state.tick);
    const distance = frozen ? enemy.distance : enemy.distance + definition.speed * (content.tickMs / 1000) * (1 - slow);
    if (distance + EPSILON >= pathLength) { shield = Math.max(0, shield - definition.leak); continue; }
    moved.push({ ...enemy, distance });
  }
  return { ...state, shield, enemies: moved };
}

function revealEnemies(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const bonus = activeRangeBonus(state, content);
  let enemies = state.enemies;
  let towers = state.towers;
  const enemyPositions = new Map(enemies.map(enemy => [enemy.id, defensePositionAtDistance(content.map.path, enemy.distance)]));
  for (let i = 0; i < towers.length; i++) {
    const tower = towers[i]!;
    const level = towerLevel(content, tower.towerId, tower.levelId);
    let revealCooldown = decrementCooldown(tower.revealCooldown);
    if (level.revealIntervalTicks > 0 && revealCooldown === 0) {
      const center = towerPoint(content, tower); const radius = level.revealRadius + bonus; const radiusSq = radius * radius;
      enemies = enemies.map(enemy => {
        const point = enemyPositions.get(enemy.id)!;
        return distanceSquared(center, point) <= radiusSq + EPSILON
          ? { ...enemy, revealUntilTick: Math.max(enemy.revealUntilTick, state.tick + level.revealTicks) }
          : enemy;
      });
      revealCooldown = level.revealIntervalTicks;
    }
    if (revealCooldown !== tower.revealCooldown) towers = replaceAt(towers, i, { ...tower, revealCooldown });
  }
  return { ...state, enemies, towers };
}

function applySlow(enemy: DefenseEnemyState, effect: DefenseSlowEffect): DefenseEnemyState {
  const withoutSource = enemy.slowEffects.filter(item => item.sourceId !== effect.sourceId && item.endTick > effect.startTick);
  return { ...enemy, slowEffects: [...withoutSource, effect] };
}
function attackWithTowers(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const pathLength = defensePathLength(content.map.path);
  const bonus = activeRangeBonus(state, content);
  let enemies = state.enemies;
  let towers = [...state.towers].sort((a, b) => Number(a.id.slice(6)) - Number(b.id.slice(6)));
  let resource = state.resource;
  const rewarded = new Set<string>();
  for (let i = 0; i < towers.length; i++) {
    let tower = towers[i]!; const level = towerLevel(content, tower.towerId, tower.levelId);
    let cooldown = decrementCooldown(tower.attackCooldown);
    if (cooldown === 0) {
      const center = towerPoint(content, tower); const radius = level.range + bonus; const radiusSq = radius * radius;
      const candidates = enemies.filter(enemy => {
        if (enemy.hp <= 0) return false;
        const definition = enemyDefinition(content, enemy.enemyId);
        if (!enemyVisible(enemy, definition, state.tick)) return false;
        const point = defensePositionAtDistance(content.map.path, enemy.distance);
        return distanceSquared(center, point) <= radiusSq + EPSILON;
      }).sort((a, b) => compareTarget(a, b, tower.targetMode, pathLength));
      const target = candidates[0];
      if (target) {
        const targetPoint = defensePositionAtDistance(content.map.path, target.distance);
        const splashRadiusSq = level.splashRadius * level.splashRadius;
        const ordered = [target, ...enemies.filter(enemy => enemy.id !== target.id && enemy.hp > 0).filter(enemy => {
          const definition = enemyDefinition(content, enemy.enemyId);
          if (!enemyVisible(enemy, definition, state.tick)) return false;
          if (level.splashRadius <= 0) return false;
          const point = defensePositionAtDistance(content.map.path, enemy.distance);
          return distanceSquared(targetPoint, point) <= splashRadiusSq + EPSILON;
        }).sort((a, b) => compareFirst(a, b, pathLength))].slice(0, level.maxTargets);
        for (const hit of ordered) {
          const enemyIndex = enemies.findIndex(enemy => enemy.id === hit.id);
          if (enemyIndex < 0) continue;
          const current = enemies[enemyIndex]!;
          if (current.hp <= 0) continue;
          const definition = enemyDefinition(content, current.enemyId);
          const armor = effectiveArmor(current, definition, state.tick);
          const damage = level.damageType === 'PURE' ? level.damage : Math.max(1, Math.floor(level.damage * (1 - armor)));
          let updated: DefenseEnemyState = { ...current, hp: Math.max(0, current.hp - damage) };
          if (updated.hp > 0 && level.slowFraction > 0 && level.slowTicks > 0) {
            updated = applySlow(updated, { sourceId: tower.id, fraction: level.slowFraction, startTick: state.tick, endTick: state.tick + level.slowTicks });
          }
          enemies = replaceAt(enemies, enemyIndex, updated);
        }
        cooldown = level.intervalTicks;
      }
    }
    tower = { ...tower, attackCooldown: cooldown };
    towers[i] = tower;
  }
  for (const enemy of enemies) {
    if (enemy.hp <= 0 && !rewarded.has(enemy.id)) { resource += enemyDefinition(content, enemy.enemyId).reward; rewarded.add(enemy.id); }
  }
  enemies = enemies.filter(enemy => enemy.hp > 0);
  return { ...state, enemies, towers, resource };
}

function triggerBossPhase(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const enemies = state.enemies.map(enemy => {
    const definition = enemyDefinition(content, enemy.enemyId);
    if (!definition.boss || !definition.phase || enemy.bossPhaseTriggered || enemy.hp <= 0) return enemy;
    if (enemy.hp / definition.hp > definition.phase.triggerHpRatio) return enemy;
    const from = state.tick + 1;
    return { ...enemy, bossPhaseTriggered: true, bossArmorFromTick: from, bossArmorUntilTick: from + definition.phase.durationTicks };
  });
  return { ...state, enemies };
}

function cleanEffects(state: DefenseRunState): DefenseRunState {
  return { ...state, enemies: state.enemies.map(enemy => ({ ...enemy, slowEffects: enemy.slowEffects.filter(effect => effect.endTick > state.tick + 1) })) };
}
function beginIntermissionOrWin(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  if (state.shield <= 0) return { ...state, status: 'LOST', paused: false };
  if (!allSpawned(state, content) || state.enemies.length > 0) return state;
  const completedWaves = Math.max(state.completedWaves, state.waveId);
  const resource = state.resource + content.waveClearReward;
  if (state.waveId === content.waves.length) return { ...state, status: 'WON', completedWaves, resource, paused: false };
  const waveId = state.waveId + 1;
  const nextWave = content.waves.find(item => item.id === waveId)!;
  return { ...state, status: 'INTERMISSION', completedWaves, resource, waveId, waveTick: 0,
    intermissionRemaining: content.intermissionTicks, spawnedByGroup: nextWave.groups.map(() => 0) };
}
function tickCooldownsOnly(state: DefenseRunState): DefenseRunState {
  return {
    ...state,
    towers: state.towers.map(tower => ({ ...tower, attackCooldown: decrementCooldown(tower.attackCooldown), revealCooldown: decrementCooldown(tower.revealCooldown) })),
    supportCooldownRemaining: decrementCooldown(state.supportCooldownRemaining),
  };
}

export function tickDefense(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  if (state.paused || state.status === 'READY' || state.status === 'WON' || state.status === 'LOST') return state;
  if (state.status === 'INTERMISSION') {
    let next = tickCooldownsOnly(state);
    next = { ...next, tick: next.tick + 1, intermissionRemaining: Math.max(0, next.intermissionRemaining - 1) };
    if (next.intermissionRemaining === 0) return { ...next, status: 'RUNNING', waveTick: 0 };
    return next;
  }
  let next: DefenseRunState = { ...state, supportCooldownRemaining: decrementCooldown(state.supportCooldownRemaining) };
  next = spawnDue(next, content);
  next = moveAndLeak(next, content);
  next = revealEnemies(next, content);
  next = attackWithTowers(next, content);
  next = triggerBossPhase(next, content);
  next = cleanEffects(next);
  next = beginIntermissionOrWin(next, content);
  if (next.status === 'RUNNING') next = { ...next, tick: next.tick + 1, waveTick: next.waveTick + 1 };
  else next = { ...next, tick: next.tick + 1 };
  return next;
}

export function advanceDefense(state: DefenseRunState, content: DefenseContent, wallSteps = 1): DefenseRunState {
  let next = state;
  const steps = Math.max(0, Math.floor(wallSteps)) * state.speed;
  for (let i = 0; i < steps; i++) next = tickDefense(next, content);
  return next;
}
export function defenseResult(state: DefenseRunState): DefenseResult {
  const won = state.status === 'WON';
  const stars: 0 | 1 | 2 | 3 = !won ? 0 : state.shield === 20 ? 3 : state.shield >= 15 ? 2 : 1;
  return { won, stars, score: state.completedWaves * 1000 + state.shield * 100, completedWaves: state.completedWaves, shield: state.shield };
}
