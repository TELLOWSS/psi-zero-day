import type {
  DefenseCombatFrame, DefenseCombatShot, DefenseCommand, DefenseContent, DefenseEnemyDefinition, DefenseEnemyState, DefenseLevelId,
  DefensePoint, DefenseResult, DefenseRunState, DefenseSlowEffect, DefenseTargetMode,
  DefenseTowerDefinition, DefenseTowerLevelDefinition, DefenseTowerState,
} from '../domain/defense';
import {withDefenseTacticalStats,recordDefenseCombat,closeDefenseTacticalWave} from './defense-tactical-stats';
import {defensePathLength,defenseEnemyPath,defenseEnemyPosition,defenseTowerPoint,defenseObservationPoints,defenseGuidanceContains} from './defense-geometry';
import {fireDefenseUltimate,resolveDefensePending,updateDefenseUltimateFields,updateDefenseAnalysis} from './defense-ultimate';
export {defensePathLength,defensePositionAtDistance} from './defense-geometry';

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
function distanceSquared(a: DefensePoint, b: DefensePoint): number {
  const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy;
}
function enemyVisible(enemy: DefenseEnemyState, definition: DefenseEnemyDefinition, tick: number): boolean {
  return !definition.hidden || enemy.revealUntilTick > tick;
}
function effectiveArmor(enemy: DefenseEnemyState, definition: DefenseEnemyDefinition, tick: number): number {
  const armor=definition.boss&&definition.phase&&tick>=enemy.bossArmorFromTick&&tick<enemy.bossArmorUntilTick?definition.phase.armor:definition.armor;
  return Math.max(0,armor-((enemy.armorExposedUntilTick??0)>tick?(enemy.armorExposeFraction??0):0));
}

function supportArmoredTarget(state:DefenseRunState,content:DefenseContent){
  return state.enemies.filter(e=>e.hp>0&&enemyVisible(e,enemyDefinition(content,e.enemyId),state.tick)&&effectiveArmor(e,enemyDefinition(content,e.enemyId),state.tick)>0)
    .sort((a,b)=>effectiveArmor(b,enemyDefinition(content,b.enemyId),state.tick)-effectiveArmor(a,enemyDefinition(content,a.enemyId),state.tick)||b.hp-a.hp||a.spawnSequence-b.spawnSequence)[0];
}
export function defenseSupportHasTarget(state:DefenseRunState,content:DefenseContent):boolean{
  const support=content.supports.find(s=>s.id===state.supportId);
  if(support?.armorExposeTicks)return !!supportArmoredTarget(state,content);
  if(support?.readyOneTower)return state.towers.some(t=>t.attackCooldown>0);
  return true;
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
function compareFirst(a: DefenseEnemyState, b: DefenseEnemyState, content:DefenseContent,state:DefenseRunState): number {
  return remainingDistance(a, defensePathLength(defenseEnemyPath(content,a,state))) - remainingDistance(b,defensePathLength(defenseEnemyPath(content,b,state))) || a.spawnSequence - b.spawnSequence || (a.id<b.id?-1:a.id>b.id?1:0);
}
function compareTarget(a: DefenseEnemyState, b: DefenseEnemyState, mode: DefenseTargetMode, content:DefenseContent,state:DefenseRunState): number {
  if (mode === 'STRONG') return b.hp - a.hp || compareFirst(a, b, content,state);
  return compareFirst(a, b, content,state);
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

function startWaveState(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const wave = content.waves.find(item => item.id === state.waveId);
  if (!wave) throw new Error('Missing wave');
  if(content.map.transition?.beforeWave===state.waveId&&!state.appliedTransitionIds?.includes(content.map.transition.id))throw Error('Transition confirmation required');
  const resetSupport = content.scenario.supportResetWaveIds.includes(state.waveId);
  return {
    ...state,
    status: 'RUNNING',
    waveTick: 0,
    intermissionRemaining: 0,
    spawnedByGroup: wave.groups.map(() => 0),
    supportCooldownRemaining: resetSupport ? 0 : state.supportCooldownRemaining,
  };
}

export function createDefenseRun(content: DefenseContent, supportId: DefenseRunState['supportId'], runId = 'run-unassigned',options?:{ultimateUnlocked?:boolean}): DefenseRunState {
  if (!content.scenario.availableSupports.includes(supportId)) throw new Error(`Support unavailable: ${supportId}`);
  const support = content.supports.find(item => item.id === supportId);
  if (!support) throw new Error(`Unknown support: ${supportId}`);
  const eventMode = content.scenario.eventId !== null;
  return withDefenseTacticalStats({
    ...(content.ultimateEnabled?{ultimateUnlocked:options?.ultimateUnlocked===true,pendingAttacks:[],mapPhase:'INITIAL' as const,appliedTransitionIds:[],redeploymentCredits:0}:{}),
    runId,
    mode: eventMode ? 'EVENT' : 'TRAINING',
    variant: eventMode ? 'EVENT_MODIFIED' : 'STANDARD',
    scenarioId: content.scenario.id,
    eventId: content.scenario.eventId,
    eventContentVersion: content.scenario.eventContentVersion,
    status: 'READY', paused: false, speed: 1, tick: 0, waveId: 1, waveTick: 0,
    intermissionRemaining: 0, shield: content.initialShield, resource: content.initialResource,
    towers: [], enemies: [], spawnedByGroup: content.waves[0]!.groups.map(() => 0),
    nextTowerSequence: 1, nextEnemySequence: 1, supportId,
    supportCooldownRemaining: support.initialCooldownTicks,
    freezeMovementUntilTick: 0, revealAllUntilTick: 0, rangeBonusUntilTick: 0, completedWaves: 0,
    leakedByEnemy: {},
  },content);
}

/** A purchase can be refunded only before the simulation or wave has advanced. */
export function canUndoDefenseBuild(state: DefenseRunState): boolean {
  const purchase=state.lastTowerPurchase;
  return !!purchase && ['READY','RUNNING','INTERMISSION'].includes(state.status)
    && purchase.tick===state.tick && purchase.waveId===state.waveId && purchase.status===state.status
    && state.towers.some(t=>t.id===purchase.towerInstanceId && t.padId===purchase.padId && t.levelId==='L1');
}

export function applyDefenseCommand(state: DefenseRunState, content: DefenseContent, command: DefenseCommand): DefenseRunState {
  if (state.status === 'WON' || state.status === 'LOST') return state;
  if(command.type==='UndoBuild'){
    if(!canUndoDefenseBuild(state))throw new Error('Purchase can no longer be undone');
    const tower=state.towers.find(t=>t.id===state.lastTowerPurchase!.towerInstanceId)!;
    return {...state,resource:state.resource+tower.invested,towers:state.towers.filter(t=>t.id!==tower.id),lastTowerPurchase:undefined};
  }
  if (command.type === 'SetPaused') return { ...state, paused: command.paused };
  if(command.type==='ConfirmTransition'){
    const transition=content.map.transition;if(!transition||state.status!=='INTERMISSION'||state.waveId!==transition.beforeWave||state.enemies.length)throw Error('Transition unavailable');
    if(state.appliedTransitionIds?.includes(transition.id))return state;
    return {...state,mapPhase:'SHIFTED',appliedTransitionIds:[...(state.appliedTransitionIds??[]),transition.id],redeploymentCredits:1};
  }
  if(command.type==='RelocateTower'){
    if(!content.ultimateEnabled||!['READY','RUNNING','INTERMISSION'].includes(state.status))throw Error('Relocation unavailable');
    const tower=state.towers.find(t=>t.id===command.towerInstanceId),credit=state.status==='INTERMISSION'&&(state.redeploymentCredits??0)>0;
    const support=content.supports.find(s=>s.id===state.supportId);if(!tower||!content.map.pads.some(p=>p.id===command.padId)||state.towers.some(t=>t.padId===command.padId))throw Error('Relocation needs empty pad');
    if(!credit&&(!support?.relocation||state.supportCooldownRemaining>0))throw Error('Relocation cooling down');
    state=withDefenseTacticalStats(state,content);
    return {...state,towers:state.towers.map(t=>t.id===tower.id?{...t,padId:command.padId}:t),redeploymentCredits:credit?(state.redeploymentCredits??0)-1:state.redeploymentCredits,
     supportCooldownRemaining:credit?state.supportCooldownRemaining:support!.cooldownTicks,
     ...(state.tacticalStats&&!credit?{tacticalStats:{...state.tacticalStats,supportUses:state.tacticalStats.supportUses+1}}:{})};
  }
  if (command.type === 'SetSpeed') {
    if (!content.speeds.includes(command.speed)) throw new Error('Unsupported speed');
    return { ...state, speed: command.speed };
  }
  if (command.type === 'StartWave') {
    if (state.paused) throw new Error('Cannot start while paused');
    if (state.status !== 'READY' && state.status !== 'INTERMISSION') throw new Error('Wave is already running');
    return startWaveState(state, content);
  }
  if (command.type === 'UseSupport') {
    if (state.status !== 'RUNNING' || state.paused) throw new Error('Support requires active combat');
    if (state.supportCooldownRemaining > 0) throw new Error('Support is cooling down');
    const support = content.supports.find(item => item.id === state.supportId)!;
    if(support.relocation)throw Error('Choose tower and destination');
    if(support.directionalRange){
      const tower=state.towers.find(t=>t.id===command.towerInstanceId),point=command.direction;if(!tower||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>content.map.width||point.y<0||point.y>content.map.height)throw Error('Choose tower and direction');
      const origin=defenseTowerPoint(content,tower);if(distanceSquared(origin,point)<1)throw Error('Direction is too close');
      state=withDefenseTacticalStats(state,content);
      return {...state,supportCooldownRemaining:support.cooldownTicks,guidance:{padId:tower.padId,direction:point,untilTick:state.tick+support.directionalRange.durationTicks,bonus:support.directionalRange.bonus,halfAngle:support.directionalRange.halfAngle},...(state.tacticalStats?{tacticalStats:{...state.tacticalStats,supportUses:state.tacticalStats.supportUses+1}}:{})};
    }
    if(!defenseSupportHasTarget(state,content))throw new Error('Support has no eligible target');
    state=withDefenseTacticalStats(state,content);
    const armored=support.armorExposeTicks?supportArmoredTarget(state,content):null;
    const readyTower=support.readyOneTower?[...state.towers].filter(t=>t.attackCooldown>0).sort((a,b)=>b.attackCooldown-a.attackCooldown||a.id.localeCompare(b.id))[0]:null;
    const untilReveal = state.tick + support.revealAllTicks;
    return {
      ...state,
      supportCooldownRemaining: support.cooldownTicks,
      ...(state.tacticalStats?{tacticalStats:{...state.tacticalStats,supportUses:state.tacticalStats.supportUses+1}}:{}),
      towers:readyTower?state.towers.map(t=>t.id===readyTower.id?{...t,attackCooldown:0}:t):state.towers,
      freezeMovementUntilTick: Math.max(state.freezeMovementUntilTick, state.tick + support.freezeMovementTicks),
      revealAllUntilTick: Math.max(state.revealAllUntilTick, untilReveal),
      rangeBonusUntilTick: Math.max(state.rangeBonusUntilTick, state.tick + support.rangeBonusTicks),
      enemies: support.revealAllTicks > 0
        ? state.enemies.map(enemy => ({ ...enemy, revealUntilTick: Math.max(enemy.revealUntilTick, untilReveal) }))
        : armored?state.enemies.map(e=>e.id===armored.id?{...e,armorExposedUntilTick:state.tick+support.armorExposeTicks!,armorExposeFraction:support.armorExposeFraction!}:e):state.enemies,
    };
  }
  if (command.type === 'TriggerEStop') {
    if (state.status !== 'RUNNING' || state.paused) throw new Error('E-Stop requires active combat');
    if ((state.eStopCooldownUntilTick ?? 0) > state.tick) throw new Error('E-Stop is cooling down');
    const freezeTicks = 70; // 3.5 seconds all-stop freeze at 50ms/tick
    state=withDefenseTacticalStats(state,content);
    return {
      ...state,
      eStopCooldownUntilTick: state.tick + 560,
      ...(state.tacticalStats?{tacticalStats:{...state.tacticalStats,eStopUses:state.tacticalStats.eStopUses+1}}:{}),
      eStopActiveUntilTick: state.tick + freezeTicks,
      freezeMovementUntilTick: Math.max(state.freezeMovementUntilTick, state.tick + freezeTicks),
      revealAllUntilTick: Math.max(state.revealAllUntilTick, state.tick + freezeTicks),
      enemies: state.enemies.map(enemy => ({
        ...enemy,
        revealUntilTick: Math.max(enemy.revealUntilTick, state.tick + freezeTicks),
      })),
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
    return { ...state, resource: state.resource - level.cost, towers: [...state.towers, tower], nextTowerSequence: state.nextTowerSequence + 1,
      lastTowerPurchase:{towerInstanceId:tower.id,padId:tower.padId,tick:state.tick,waveId:state.waveId,status:state.status} };
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
    return { ...state, resource: state.resource + refund, towers: state.towers.filter(item => item.id !== tower.id),lastTowerPurchase:undefined };
  }
  const next = towerLevel(content, tower.towerId, command.levelId);
  if(command.levelId.startsWith('L4')&&(!content.ultimateEnabled||!state.ultimateUnlocked))throw Error('Ultimate locked');
  if(command.levelId.startsWith('L4')&&state.towers.some(t=>t.levelId.startsWith('L4')))throw Error('Only one ultimate tower');
  if (next.from !== tower.levelId) throw new Error('Invalid upgrade path');
  if (state.resource < next.cost) throw new Error('Insufficient resource');
  const upgraded: DefenseTowerState = {
    ...tower, levelId: command.levelId, invested: tower.invested + next.cost,
    attackCooldown: Math.min(tower.attackCooldown, next.intervalTicks),
    revealCooldown: next.revealIntervalTicks > 0 ? Math.min(tower.revealCooldown, next.revealIntervalTicks) : 0,
  };
  return { ...state, resource: state.resource - next.cost, towers: replaceAt(state.towers, index, upgraded),lastTowerPurchase:undefined };
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
        ...(content.map.routes?{routeId:group.routeId??content.map.routes[0]!.id}:{}),
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
  let shield = state.shield;
  const leakedByEnemy: Partial<Record<DefenseEnemyState['enemyId'], number>> = { ...(state.leakedByEnemy ?? {}) };
  const moved: DefenseEnemyState[] = [];
  for (const enemy of state.enemies) {
    const definition = enemyDefinition(content, enemy.enemyId);
    const frozen = state.tick < state.freezeMovementUntilTick||state.tick<(enemy.lockedUntilTick??0);
    const slow = effectiveSlow(enemy, definition, state.tick);
    const distance = frozen ? enemy.distance : enemy.distance + definition.speed * (content.tickMs / 1000) * (1 - slow);
    if (distance + EPSILON >= defensePathLength(defenseEnemyPath(content,enemy,state))) {
      shield = Math.max(0, shield - definition.leak);
      leakedByEnemy[enemy.enemyId] = (leakedByEnemy[enemy.enemyId] ?? 0) + 1;
      continue;
    }
    moved.push({ ...enemy, distance });
  }
  return { ...state, shield, enemies: moved, leakedByEnemy };
}

function revealEnemies(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  const bonus = activeRangeBonus(state, content);
  let enemies = state.enemies;
  let towers = state.towers;
  const enemyPositions = new Map(enemies.map(enemy => [enemy.id, defenseEnemyPosition(content,enemy,state)]));
  for (let i = 0; i < towers.length; i++) {
    const tower = towers[i]!;
    const level = towerLevel(content, tower.towerId, tower.levelId);
    let revealCooldown = decrementCooldown(tower.revealCooldown);
    if (level.revealIntervalTicks > 0 && revealCooldown === 0) {
      const center = towerPoint(content, tower); const radius = level.revealRadius + bonus; const radiusSq = radius * radius;
      enemies = enemies.map(enemy => {
        const point = enemyPositions.get(enemy.id)!;
        return distanceSquared(center, point) <= radiusSq + EPSILON ||(level.ultimate==='OBSERVATION'&&defenseObservationPoints(content,state,tower).some(node=>distanceSquared(node,point)<=110**2))
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
function attackWithTowers(state: DefenseRunState, content: DefenseContent): DefenseCombatFrame {
  const shots: DefenseCombatShot[] = [];
  const bonus = activeRangeBonus(state, content);
  let enemies = state.enemies;
  let pendingAttacks=state.pendingAttacks;
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
        const point = defenseEnemyPosition(content,enemy,state);
        return distanceSquared(center, point) <= radiusSq + EPSILON||defenseGuidanceContains(state,tower,center,point,radius);
      }).sort((a, b) => compareTarget(a, b, tower.targetMode, content,state));
      const target = candidates[0];
      if (target) {
        if(level.ultimate){
          const frame=fireDefenseUltimate({...state,enemies,towers,pendingAttacks},content,tower,level,target);enemies=frame.state.enemies;pendingAttacks=frame.state.pendingAttacks;shots.push(...frame.shots);tower=frame.tower;cooldown=level.intervalTicks;
          towers[i]={...tower,attackCooldown:cooldown};continue;
        }
        const targetPoint = defenseEnemyPosition(content,target,state);
        const splashRadiusSq = level.splashRadius * level.splashRadius;
        const ordered = [target, ...enemies.filter(enemy => enemy.id !== target.id && enemy.hp > 0).filter(enemy => {
          const definition = enemyDefinition(content, enemy.enemyId);
          if (!enemyVisible(enemy, definition, state.tick)) return false;
          if (level.splashRadius <= 0) return false;
          const point = defenseEnemyPosition(content,enemy,state);
          return distanceSquared(targetPoint, point) <= splashRadiusSq + EPSILON;
        }).sort((a, b) => compareFirst(a, b, content,state))].slice(0, level.maxTargets);
        const hits: DefenseCombatShot["targets"][number][] = [];
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
          hits.push({id: current.id, enemyId: current.enemyId, distance: current.distance, point:defenseEnemyPosition(content,current,state), damage: current.hp-updated.hp, resolved: updated.hp===0});
          enemies = replaceAt(enemies, enemyIndex, updated);
        }
        shots.push({id: `${state.runId}:${state.tick}:${tower.id}`, towerId:tower.towerId, levelId:tower.levelId, padId:tower.padId, targets:hits});
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
  return { state: { ...state, enemies, towers, resource,...(pendingAttacks?{pendingAttacks}:{}) }, shots };
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
  if (state.shield <= 0) return { ...closeDefenseTacticalWave(state), status: 'LOST', paused: false };
  if (!allSpawned(state, content) || state.enemies.length > 0) return state;
  state=closeDefenseTacticalWave(state);
  const completedWaves = Math.max(state.completedWaves, state.waveId);
  const resource = state.resource + content.waveClearReward;
  if (state.waveId === content.waves.length) return { ...state, status: 'WON', completedWaves, resource, paused: false };
  const waveId = state.waveId + 1;
  const nextWave = content.waves.find(item => item.id === waveId)!;
  return { ...state, status: 'INTERMISSION', completedWaves, resource, waveId, waveTick: 0,
    ...(state.pendingAttacks?{pendingAttacks:[]}:{}),intermissionRemaining: content.intermissionTicks, spawnedByGroup: nextWave.groups.map(() => 0) };
}
function tickCooldownsOnly(state: DefenseRunState): DefenseRunState {
  return {
    ...state,
    towers: state.towers.map(tower => ({ ...tower, attackCooldown: decrementCooldown(tower.attackCooldown), revealCooldown: decrementCooldown(tower.revealCooldown) })),
    supportCooldownRemaining: decrementCooldown(state.supportCooldownRemaining),
  };
}

function tickDefenseFrame(state: DefenseRunState, content: DefenseContent): DefenseCombatFrame {
  if (state.paused || state.status === 'READY' || state.status === 'WON' || state.status === 'LOST') return {state,shots:[]};
  if (state.status === 'INTERMISSION') {
    if(content.preparationMode==='MANUAL')return {state,shots:[]};
    let next = tickCooldownsOnly(state);
    next = { ...next, tick: next.tick + 1, intermissionRemaining: Math.max(0, next.intermissionRemaining - 1) };
    if (next.intermissionRemaining === 0) return {state:startWaveState(next, content),shots:[]};
    return {state:next,shots:[]};
  }
  let next: DefenseRunState = { ...withDefenseTacticalStats(state,content), supportCooldownRemaining: decrementCooldown(state.supportCooldownRemaining) };
  next = spawnDue(next, content);
  if(next.tacticalStats&&next.enemies.length>next.tacticalStats.peakSignals)next={...next,tacticalStats:{...next.tacticalStats,peakSignals:next.enemies.length}};
  if(content.ultimateEnabled)next=updateDefenseUltimateFields(next,content);
  next = moveAndLeak(next, content);
  next = revealEnemies(next, content);
  if(content.ultimateEnabled)next=updateDefenseAnalysis(next,content);
  const pending=content.ultimateEnabled?resolveDefensePending(next,content):{state:next,shots:[]};next=pending.state;
  const combat = attackWithTowers(next, content);
  const shots=[...pending.shots,...combat.shots];next = recordDefenseCombat(combat.state,shots);
  next = triggerBossPhase(next, content);
  next = cleanEffects(next);
  next = beginIntermissionOrWin(next, content);
  if (next.status === 'RUNNING') next = { ...next, tick: next.tick + 1, waveTick: next.waveTick + 1 };
  else next = { ...next, tick: next.tick + 1 };
  return {state:next,shots};
}

export function tickDefense(state: DefenseRunState, content: DefenseContent): DefenseRunState {
  return tickDefenseFrame(state,content).state;
}
export function advanceDefenseWithCombat(state: DefenseRunState, content: DefenseContent, wallSteps = 1): DefenseCombatFrame {
  let next=state;
  const shots: DefenseCombatShot[]=[];
  const steps=Math.max(0,Math.floor(wallSteps))*state.speed;
  for(let i=0;i<steps;i++){
    const frame=tickDefenseFrame(next,content);next=frame.state;shots.push(...frame.shots);
  }
  return {state:next,shots};
}
export function advanceDefense(state: DefenseRunState, content: DefenseContent, wallSteps = 1): DefenseRunState {
  return advanceDefenseWithCombat(state,content,wallSteps).state;
}
export function defenseResult(state: DefenseRunState): DefenseResult {
  const won = state.status === 'WON';
  const stars: 0 | 1 | 2 | 3 = !won ? 0 : state.shield === 20 ? 3 : state.shield >= 15 ? 2 : 1;
  return { won, stars, score: state.completedWaves * 1000 + state.shield * 100, completedWaves: state.completedWaves, shield: state.shield };
}
