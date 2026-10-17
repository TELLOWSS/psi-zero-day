import rawContent from '../../content/defense/zero-breach-v1.json';
import type {
  DefenseContent, DefenseDamageType, DefenseEnemyDefinition, DefenseEnemyId, DefenseLevelId, DefensePad,
  DefenseSpawnGroup, DefenseSupportDefinition, DefenseSupportId, DefenseTargetMode, DefenseTowerDefinition,
  DefenseTowerId, DefenseTowerLevelDefinition, DefenseWaveDefinition,
} from '../domain/defense';

export class DefenseContentError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(issues.join('\n'));
    this.name = 'DefenseContentError';
  }
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown): value is number => finite(value) && Number.isInteger(value);
const stringValue = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;
const positive = (value: unknown): value is number => finite(value) && value > 0;
const towerIdValue = (value: unknown): value is DefenseTowerId =>
  value === 'PULSE' || value === 'BURST' || value === 'CONTROL' || value === 'SENSOR';
const enemyIdValue = (value: unknown): value is DefenseEnemyId =>
  value === 'NORMAL' || value === 'SWIFT' || value === 'ARMORED' || value === 'SWARM' || value === 'VEILED' || value === 'BOSS';
const supportIdValue = (value: unknown): value is DefenseSupportId =>
  value === 'COORDINATOR' || value === 'OBSERVER' || value === 'COMMANDER' || value === 'REBAR_LEAD' || value === 'ENGINEER'||value==='SIGNALER';
const levelIdValue = (value: unknown): value is DefenseLevelId =>
  value === 'L1' || value === 'L2' || value === 'L3A' || value === 'L3B'||value==='L4A'||value==='L4B';

function uniqueIds(items: readonly { readonly id: string }[], label: string, issues: string[]) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) issues.push(`${label}: duplicate id ${item.id}`);
    seen.add(item.id);
  }
}
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function parseLevel(value: unknown, path: string, issues: string[]): DefenseTowerLevelDefinition | null {
  if (!record(value)) { issues.push(`${path}: object required`); return null; }
  const damageType = value.damageType;
  const typeOk = damageType === 'PHYSICAL' || damageType === 'PURE';
  const id = value.id;
  const from = value.from;
  const numericKeys = ['cost','damage','intervalTicks','range','splashRadius','maxTargets','slowFraction','slowTicks','revealRadius','revealIntervalTicks','revealTicks'] as const;
  if (!levelIdValue(id)) issues.push(`${path}.id: invalid level id`);
  if (!(from === null || levelIdValue(from))) issues.push(`${path}.from: invalid parent level id`);
  if (!typeOk) issues.push(`${path}.damageType: invalid`);
  for (const key of numericKeys) if (!nonNegative(value[key])) issues.push(`${path}.${key}: finite non-negative number required`);
  if (!positive(value.cost)) issues.push(`${path}.cost: must be > 0`);
  if (!positive(value.intervalTicks) || !integer(value.intervalTicks)) issues.push(`${path}.intervalTicks: positive integer required`);
  if (!positive(value.maxTargets) || !integer(value.maxTargets)) issues.push(`${path}.maxTargets: positive integer required`);
  if (!finite(value.slowFraction) || value.slowFraction < 0 || value.slowFraction >= 1) issues.push(`${path}.slowFraction: must be in [0,1)`);
  if (!levelIdValue(id) || !(from === null || levelIdValue(from)) || !typeOk || numericKeys.some(key => !nonNegative(value[key]))) return null;
  return {
    id, from, cost: value.cost as number, damage: value.damage as number,
    damageType: damageType as DefenseDamageType, intervalTicks: value.intervalTicks as number, range: value.range as number,
    splashRadius: value.splashRadius as number, maxTargets: value.maxTargets as number,
    slowFraction: value.slowFraction as number, slowTicks: value.slowTicks as number,
    revealRadius: value.revealRadius as number, revealIntervalTicks: value.revealIntervalTicks as number,
    revealTicks: value.revealTicks as number,
  };
}

export function validateDefenseContent(input: unknown): DefenseContent {
  const issues: string[] = [];
  if (!record(input)) throw new DefenseContentError(['root: object required']);

  const towers: DefenseTowerDefinition[] = [];
  const towerInput = Array.isArray(input.towers) ? input.towers : [];
  if (!Array.isArray(input.towers)) issues.push('towers: array required');
  for (const [index, value] of towerInput.entries()) {
    const path = `towers[${index}]`;
    if (!record(value) || !towerIdValue(value.id) || !stringValue(value.nameTextId) || !stringValue(value.roleTextId) || !Array.isArray(value.levels)) {
      issues.push(`${path}: invalid tower`); continue;
    }
    const levels = value.levels.map((level, i) => parseLevel(level, `${path}.levels[${i}]`, issues)).filter((v): v is DefenseTowerLevelDefinition => v !== null);
    uniqueIds(levels, `${path}.levels`, issues);
    const byId = new Map(levels.map(level => [level.id, level]));
    const roots = levels.filter(level => level.from === null);
    if (roots.length !== 1 || roots[0]?.id !== 'L1') issues.push(`${path}: exactly one L1 root required`);
    for (const level of levels) {
      if (level.from !== null && !byId.has(level.from)) issues.push(`${path}: level ${level.id} references missing parent ${level.from}`);
      const seen = new Set<string>();
      let cursor: DefenseTowerLevelDefinition | undefined = level;
      while (cursor?.from) {
        if (seen.has(cursor.id)) { issues.push(`${path}: upgrade cycle at ${cursor.id}`); break; }
        seen.add(cursor.id);
        cursor = byId.get(cursor.from);
      }
    }
    towers.push({ id: value.id, levels });
  }

  const enemies: DefenseEnemyDefinition[] = [];
  const enemyInput = Array.isArray(input.enemies) ? input.enemies : [];
  if (!Array.isArray(input.enemies)) issues.push('enemies: array required');
  for (const [index, value] of enemyInput.entries()) {
    const path = `enemies[${index}]`;
    if (!record(value) || !enemyIdValue(value.id) || !stringValue(value.nameTextId)
      || !positive(value.hp) || !positive(value.speed) || !nonNegative(value.armor) || value.armor >= 1
      || !nonNegative(value.reward) || !positive(value.leak) || typeof value.hidden !== 'boolean' || typeof value.boss !== 'boolean') {
      issues.push(`${path}: invalid enemy`); continue;
    }
    let phase: DefenseEnemyDefinition['phase'];
    if (value.phase !== undefined) {
      if (!record(value.phase) || !positive(value.phase.triggerHpRatio) || value.phase.triggerHpRatio >= 1
        || !nonNegative(value.phase.armor) || value.phase.armor >= 1 || !positive(value.phase.durationTicks)
        || !integer(value.phase.durationTicks) || value.phase.maxTriggers !== 1) {
        issues.push(`${path}.phase: invalid boss phase`);
      } else {
        phase = {
          triggerHpRatio: value.phase.triggerHpRatio,
          armor: value.phase.armor,
          durationTicks: value.phase.durationTicks,
          maxTriggers: value.phase.maxTriggers,
        };
      }
    }
    enemies.push({
      id: value.id, hp: value.hp, speed: value.speed, armor: value.armor,
      reward: value.reward, leak: value.leak, hidden: value.hidden, boss: value.boss, ...(phase ? { phase } : {}),
    });
  }

  const supports: DefenseSupportDefinition[] = [];
  const supportInput = Array.isArray(input.supports) ? input.supports : [];
  if (!Array.isArray(input.supports)) issues.push('supports: array required');
  for (const [index, value] of supportInput.entries()) {
    const path = `supports[${index}]`;
    if (!record(value) || !supportIdValue(value.id) || !(value.characterBinding === null || stringValue(value.characterBinding))
      || !stringValue(value.skillTextId)) { issues.push(`${path}: invalid support`); continue; }
    const keys = ['cooldownTicks','initialCooldownTicks','freezeMovementTicks','revealAllTicks','rangeBonus','rangeBonusTicks'] as const;
    if (keys.some(key => !nonNegative(value[key]))) { issues.push(`${path}: invalid support numeric value`); continue; }
    if(value.armorExposeTicks!==undefined&&(!integer(value.armorExposeTicks)||value.armorExposeTicks<0))issues.push(path+': invalid expose duration');
    if(value.armorExposeFraction!==undefined&&(!finite(value.armorExposeFraction)||value.armorExposeFraction<0||value.armorExposeFraction>.75))issues.push(path+': invalid armor reduction');
    if(value.readyOneTower!==undefined&&typeof value.readyOneTower!=='boolean')issues.push(path+': invalid ready tower flag');
    supports.push({
      ...(value.armorExposeTicks!==undefined?{armorExposeTicks:value.armorExposeTicks as number,armorExposeFraction:value.armorExposeFraction as number}:{}),
      ...(value.readyOneTower===true?{readyOneTower:true}:{}),
      id: value.id, characterBinding: value.characterBinding as string | null,
      cooldownTicks: value.cooldownTicks as number, initialCooldownTicks: value.initialCooldownTicks as number,
      freezeMovementTicks: value.freezeMovementTicks as number, revealAllTicks: value.revealAllTicks as number,
      rangeBonus: value.rangeBonus as number, rangeBonusTicks: value.rangeBonusTicks as number,
    });
  }

  const waves: DefenseWaveDefinition[] = [];
  const waveInput = Array.isArray(input.waves) ? input.waves : [];
  if (!Array.isArray(input.waves)) issues.push('waves: array required');
  for (const [index, value] of waveInput.entries()) {
    const path = `waves[${index}]`;
    if (!record(value) || !integer(value.id) || !Array.isArray(value.groups)) { issues.push(`${path}: invalid wave`); continue; }
    const groups: DefenseSpawnGroup[] = [];
    for (const [groupIndex, group] of value.groups.entries()) {
      if (!record(group) || !enemyIdValue(group.enemy) || !positive(group.count) || !integer(group.count)
        || !nonNegative(group.startTick) || !integer(group.startTick) || !positive(group.intervalTicks) || !integer(group.intervalTicks)) {
        issues.push(`${path}.groups[${groupIndex}]: invalid spawn group`); continue;
      }
      groups.push({ enemy: group.enemy, count: group.count, startTick: group.startTick, intervalTicks: group.intervalTicks });
    }
    waves.push({ id: value.id, groups });
  }

  uniqueIds(towers, 'towers', issues); uniqueIds(enemies, 'enemies', issues); uniqueIds(supports, 'supports', issues);
  if (((record(input.scenario)&&String(input.scenario.id).startsWith('guard-gd-')) ? waves.length<6||waves.length>12 : waves.length!==10) || waves.some((wave, index) => wave.id !== index + 1)) issues.push('waves: ids must be exactly 1..10');

  if (!record(input.map) || !stringValue(input.map.id) || !stringValue(input.map.nameTextId)
    || !positive(input.map.width) || !positive(input.map.height) || !Array.isArray(input.map.path) || !Array.isArray(input.map.pads)) {
    issues.push('map: invalid');
  }
  const map = record(input.map) ? input.map : {};
  const pathPoints: [number, number][] = [];
  if (Array.isArray(map.path)) for (const [index, point] of map.path.entries()) {
    if (!Array.isArray(point) || point.length !== 2 || !finite(point[0]) || !finite(point[1])) issues.push(`map.path[${index}]: invalid point`);
    else pathPoints.push([point[0], point[1]]);
  }
  if (pathPoints.length < 2) issues.push('map.path: at least two points required');
  const pads: DefensePad[] = [];
  if (Array.isArray(map.pads)) for (const [index, pad] of map.pads.entries()) {
    if (!record(pad) || !stringValue(pad.id) || !finite(pad.x) || !finite(pad.y)) { issues.push(`map.pads[${index}]: invalid pad`); continue; }
    pads.push({ id: pad.id, x: pad.x, y: pad.y });
  }
  uniqueIds(pads, 'map.pads', issues);
  const width = finite(map.width) ? map.width : 0; const height = finite(map.height) ? map.height : 0;
  for (const pad of pads) {
    if (pad.x <= 0 || pad.x >= width || pad.y <= 0 || pad.y >= height) issues.push(`map.pads.${pad.id}: outside board`);
    for (let i = 1; i < pathPoints.length; i++) {
      const a = pathPoints[i - 1]!; const b = pathPoints[i]!;
      if (distanceToSegment(pad.x, pad.y, a[0], a[1], b[0], b[1]) < 24) issues.push(`map.pads.${pad.id}: overlaps path clearance`);
    }
  }

  const towerIds = new Set(towers.map(t => t.id)); const enemyIds = new Set(enemies.map(e => e.id)); const supportIds = new Set(supports.map(s => s.id));
  for (const wave of waves) for (const group of wave.groups) if (!enemyIds.has(group.enemy)) issues.push(`wave ${wave.id}: missing enemy ${group.enemy}`);
  const bossSpawns = waves.flatMap(w => w.groups).reduce((sum, group) => sum + (enemies.find(e => e.id === group.enemy)?.boss ? group.count : 0), 0);
  const guardCampaign=record(input.scenario)&&String(input.scenario.id).startsWith('guard-gd-');
  if (guardCampaign?bossSpawns>1:bossSpawns!==1) issues.push(`waves: expected exactly one boss spawn, got ${bossSpawns}`);

  const targetModes = Array.isArray(input.targetModes) ? input.targetModes.filter((v): v is DefenseTargetMode => v === 'FIRST' || v === 'STRONG' || (guardCampaign&&v === 'THREAT')) : [];
  const speeds = Array.isArray(input.speeds) ? input.speeds.filter((v): v is number => v === 1 || v === 2) : [];
  const scenario = record(input.scenario) ? input.scenario : {};
  const rawAvailableTowers = Array.isArray(scenario.availableTowers) ? scenario.availableTowers : [];
  const rawAvailableSupports = Array.isArray(scenario.availableSupports) ? scenario.availableSupports : [];
  if (rawAvailableTowers.some(id => !towerIdValue(id))) issues.push('scenario.availableTowers: invalid tower id');
  if (rawAvailableSupports.some(id => !supportIdValue(id))) issues.push('scenario.availableSupports: invalid support id');
  const availableTowers = rawAvailableTowers.filter(towerIdValue);
  const availableSupports = rawAvailableSupports.filter(supportIdValue);
  if (availableTowers.some(id => !towerIds.has(id))) issues.push('scenario: missing tower reference');
  if (availableSupports.some(id => !supportIds.has(id))) issues.push('scenario: missing support reference');
  if (scenario.mapId !== map.id) issues.push('scenario.mapId: missing map reference');

  const requiredTop = [
    ['schemaVersion', input.schemaVersion === 1], ['rulesVersion', stringValue(input.rulesVersion)],
    ['contentVersion', stringValue(input.contentVersion)], ['balanceStatus', stringValue(input.balanceStatus)],
    ['tickMs', input.tickMs === 50], ['initialShield', positive(input.initialShield)], ['initialResource', nonNegative(input.initialResource)],
    ['intermissionTicks', positive(input.intermissionTicks)], ['waveClearReward', nonNegative(input.waveClearReward)],
    ['sellRate', finite(input.sellRate) && input.sellRate > 0 && input.sellRate < 1],
    ['defaultTargetMode', input.defaultTargetMode === 'FIRST' || input.defaultTargetMode === 'STRONG'],
  ] as const;
  for (const [key, ok] of requiredTop) if (!ok) issues.push(`${key}: invalid`);
  const mechanics=['VOLLEY','PIERCE','WAVE','DELAY','LOCK','BOUNDARY','OBSERVATION','ANALYSIS'];
  if(input.ultimateEnabled!==undefined&&typeof input.ultimateEnabled!=='boolean')issues.push('ultimateEnabled: invalid');
  for(const t of towerInput)if(record(t)&&Array.isArray(t.levels))for(const l of t.levels)if(record(l)){
    if(l.ultimate!==undefined&&(!mechanics.includes(String(l.ultimate))||!String(l.id).startsWith('L4')))issues.push('ultimate mechanic: invalid');
    if(String(l.id).startsWith('L4')&&(!input.ultimateEnabled||!record(input.scenario)||!String(input.scenario.id).startsWith('guard-gd-')||!mechanics.includes(String(l.ultimate))))issues.push('ultimate: campaign-only');
  }
  for(const s of supportInput)if(record(s)){
    if(s.relocation!==undefined&&typeof s.relocation!=='boolean')issues.push('relocation: invalid');
    if((s.armorExposeTicks===undefined)!==(s.armorExposeFraction===undefined))issues.push('armor expose: incomplete pair');
    if(s.directionalRange!==undefined){const d=s.directionalRange;if(!record(d)||!positive(d.bonus)||d.bonus>200||!positive(d.halfAngle)||d.halfAngle>Math.PI/2||!positive(d.durationTicks)||!integer(d.durationTicks))issues.push('directional range: invalid');}
  }
  if(map.routes!==undefined){
    const checkRoutes=(routes:unknown,label:string):string[]=>{
      if(!Array.isArray(routes)||routes.length<1||routes.length>2){issues.push(label+': invalid route list');return [];}
      const ids:string[]=[];for(const route of routes){if(!record(route)||!stringValue(route.id)||!Array.isArray(route.path)||route.path.length<2){issues.push(label+': invalid route');continue;}ids.push(route.id);
        const points=route.path;if(points.some(p=>!Array.isArray(p)||p.length!==2||!finite(p[0])||!finite(p[1])||p[0]<0||p[0]>width||p[1]<0||p[1]>height)){issues.push(label+': invalid geometry');continue;}
        for(const pad of pads)for(let j=1;j<points.length;j++){const a=points[j-1] as number[],b=points[j] as number[];if(distanceToSegment(pad.x,pad.y,a[0]!,a[1]!,b[0]!,b[1]!)<24)issues.push(label+': pad overlaps route');}
      }if(new Set(ids).size!==ids.length)issues.push(label+': duplicate route');return ids;
    };
    const ids=checkRoutes(map.routes,'map.routes');
    if(map.transition!==undefined){const tr=map.transition;if(!record(tr)||!stringValue(tr.id)||!integer(tr.beforeWave)||tr.beforeWave<2||tr.beforeWave>waves.length)issues.push('map.transition: invalid');else{const after=checkRoutes(tr.routes,'map.transition.routes');if(ids.some(id=>!after.includes(id))||after.some(id=>!ids.includes(id)))issues.push('map.transition: route IDs must persist');}}
    for(const wave of waveInput)if(record(wave)&&Array.isArray(wave.groups))for(const g of wave.groups)if(record(g)&&g.routeId!==undefined&&!ids.includes(String(g.routeId)))issues.push('wave route: unknown');
  }else if(map.transition!==undefined)issues.push('map.transition: requires routes');
  if(input.preparationMode!==undefined&&input.preparationMode!=='MANUAL')issues.push('preparationMode: invalid');
  if(input.combatReportEnabled!==undefined&&typeof input.combatReportEnabled!=='boolean')issues.push('combatReportEnabled: invalid');
  if (speeds.length !== 2 || !speeds.includes(1) || !speeds.includes(2)) issues.push('speeds: must contain 1 and 2');
  if (targetModes.length < 2 || targetModes.length > (guardCampaign?3:2) || new Set(targetModes).size!==targetModes.length || (Array.isArray(input.targetModes)&&targetModes.length!==input.targetModes.length) || !targetModes.includes('FIRST') || !targetModes.includes('STRONG')) issues.push('targetModes: must contain FIRST and STRONG; THREAT is optional for Guard');

  const supportResetWaveIds = Array.isArray(scenario.supportResetWaveIds) ? scenario.supportResetWaveIds : [];
  if (supportResetWaveIds.some(id => !integer(id) || id < 1 || id > waves.length)
    || new Set(supportResetWaveIds).size !== supportResetWaveIds.length) {
    issues.push('scenario.supportResetWaveIds: invalid wave ids');
  }
  const nullableString = (value: unknown): boolean => value === null || stringValue(value);
  if (!stringValue(scenario.id) || !stringValue(scenario.firstClearCosmetic) || !nullableString(scenario.threeStarCosmetic)
    || !integer(scenario.rewardVersion) || !Array.isArray(scenario.mainStoryStatRewards)
    || !Array.isArray(scenario.supportResetWaveIds)
    || !nullableString(scenario.eventId) || !nullableString(scenario.eventContentVersion)
    || ((scenario.eventId === null) !== (scenario.eventContentVersion === null))) issues.push('scenario: invalid');

  if(input.sensorPressure!==undefined){const p=input.sensorPressure;if(!record(p)||!Array.isArray(p.waves)||!p.waves.length||p.waves.length>3||new Set(p.waves).size!==p.waves.length||!p.waves.every(w=>integer(w)&&w>=1&&w<=3)||![p.warningTicks,p.activeTicks].every(n=>integer(n)&&n>=20&&n<=200)||!enemyInput.some(e=>record(e)&&e.id==='ARMORED')||!String((input.scenario as Record<string,unknown>)?.id).startsWith('guard-'))issues.push('sensorPressure: invalid rule');}
  if (issues.length) throw new DefenseContentError(issues);
  return input as unknown as DefenseContent;
}

export const zeroBreachContent = validateDefenseContent(rawContent);
