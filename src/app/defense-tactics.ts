import type {DefenseCommand, DefenseContent, DefenseRunState, DefenseTowerId, DefenseTowerLevelDefinition} from '../domain/defense';
import type {GuardPlanningStyle} from './guard-planning-style';
import {defenseRoutes,defensePositionAtDistance,defensePathLength} from '../engine/defense-geometry';

/** Read-only advice. Commands are still validated and charged by the defense engine. */
export function defensePlanningWave(content: DefenseContent, state: DefenseRunState) {
  const nextId = state.status === 'RUNNING' ? state.waveId + 1 : state.waveId;
  return content.waves.find(wave => wave.id === nextId) ?? null;
}

export function defenseRouteCoverage(content: DefenseContent, padId: string, radius: number,state?:DefenseRunState): number {
  const pad = content.map.pads.find(item => item.id === padId);
  if (!pad) return 0;
  let covered = 0;
  for(const route of defenseRoutes(content,state))for (let index = 1; index < route.path.length; index++) {
    const a = route.path[index - 1]!, b = route.path[index]!;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(length / 10));
    for (let n = 0; n < steps; n++) {
      const fraction = (n + .5) / steps;
      if (Math.hypot(a[0] + (b[0] - a[0]) * fraction - pad.x, a[1] + (b[1] - a[1]) * fraction - pad.y) <= radius) covered += length / steps;
    }
  }
  return covered;
}

export interface DefenseAdvice {
  readonly command: Extract<DefenseCommand, {type: 'Build' | 'Upgrade'}>;
  readonly padId: string;
  readonly towerId: DefenseTowerId;
  readonly cost: number;
  readonly reasonId: string;
}

export function recommendDefenseAction(content: DefenseContent, state: DefenseRunState,style:GuardPlanningStyle='BALANCED'): DefenseAdvice | null {
  if (state.status === 'WON' || state.status === 'LOST') return null;
  const wave = defensePlanningWave(content,state) ?? content.waves.find(item => item.id === state.waveId);
  if (!wave) return null;
  const total = wave.groups.reduce((sum, group) => sum + group.count, 0) || 1;
  const hidden = content.waves.filter(item=>item.id>=wave.id&&item.id<=wave.id+1)
    .some(item=>item.groups.some(group=>content.enemies.find(enemy=>enemy.id===group.enemy)?.hidden));
  const swarm = wave.groups.filter(group => group.enemy === 'SWARM').reduce((sum, group) => sum + group.count, 0) / total;
  const armored = wave.groups.some(group => ['ARMORED', 'BOSS'].includes(group.enemy));
  const fast = wave.groups.some(group => group.enemy === 'SWIFT');
  const guard=content.map.id.startsWith('guard-gd-');
  const utility = (level: DefenseTowerLevelDefinition, padId: string) => {
    const coverage = defenseRouteCoverage(content, padId, level.range,state) / 100;
    const damage = level.damage * (armored && level.damageType !== 'PURE' ? .55 : 1);
    const density=guard&&level.splashRadius>0?wave.groups.reduce((sum,g)=>{
      const enemy=content.enemies.find(e=>e.id===g.enemy)!;
      const spacing=Math.max(1,enemy.speed*g.intervalTicks*content.tickMs/1000);
      return sum+Math.min(g.count,1+2*level.splashRadius/spacing)*g.count/total;
    },0):1;
    const targets = guard?Math.min(level.maxTargets,density):1 + Math.min(level.maxTargets - 1, swarm * 5);
    const attack = guard?wave.groups.reduce((sum,g)=>{
      const enemy=content.enemies.find(e=>e.id===g.enemy)!;
      const hit=level.damageType==='PURE'?level.damage:Math.max(1,Math.floor(level.damage*(1-enemy.armor)));
      const hitCount=Math.max(1,Math.ceil(enemy.hp/Math.max(1,hit)));
      const spacing=Math.max(1,enemy.speed*g.intervalTicks*content.tickMs/1000);
      const nearby=level.splashRadius>0?Math.min(level.maxTargets,1+Math.floor(2*level.splashRadius/spacing)):1;
      return sum+enemy.hp/hitCount/(level.intervalTicks*content.tickMs/1000)*nearby*g.count/total;
    },0):damage * targets / (level.intervalTicks * content.tickMs / 1000);
    const control = level.slowFraction * (fast ? 15 : 8) * Math.min(level.maxTargets, 2);
    const underground=guard&&content.scenario.id>='guard-gd-04-v1';
    let reveal = hidden && level.revealRadius > 0 ? 60 * defenseRouteCoverage(content,padId,level.revealRadius,state)/100 : 0;
    if(underground&&hidden&&level.revealRadius>0){
      const pad=content.map.pads.find(p=>p.id===padId)!;let overlap=0;
      for(const route of defenseRoutes(content,state))for(let d=0;d<defensePathLength(route.path);d+=20){
        const at=defensePositionAtDistance(route.path,d);
        if(Math.hypot(at.x-pad.x,at.y-pad.y)>level.revealRadius)continue;
        if(state.towers.some(t=>t.padId!==padId&&(()=>{const p=content.map.pads.find(p=>p.id===t.padId)!,l=content.towers.find(f=>f.id===t.towerId)!.levels.find(l=>l.id===t.levelId)!;return l.revealRadius>0&&Math.hypot(at.x-p.x,at.y-p.y)<=l.revealRadius;})()))continue;
        if(state.towers.some(t=>t.padId!==padId&&(()=>{const p=content.map.pads.find(p=>p.id===t.padId)!,l=content.towers.find(f=>f.id===t.towerId)!.levels.find(l=>l.id===t.levelId)!;return Math.hypot(at.x-p.x,at.y-p.y)<=l.range;})()))overlap+=20;
      }
      reveal=overlap/100*80;
    }
    let entryFactor=1;
    if(guard&&state.towers.length===0){
      const pad=content.map.pads.find(p=>p.id===padId)!;let distance=0,first=Infinity;
      for(let i=1;i<content.map.path.length;i++){const a=content.map.path[i-1]!,b=content.map.path[i]!,length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/10);for(let n=0;n<=steps;n++){if(Math.hypot(a[0]+(b[0]-a[0])*n/steps-pad.x,a[1]+(b[1]-a[1])*n/steps-pad.y)<=level.range)first=Math.min(first,distance+length*n/steps);}distance+=length;}
      entryFactor=Number.isFinite(first)?1/(1+first/500):0;
    }
    return (coverage * (attack + control) + reveal)*entryFactor;
  };
  const candidates: (DefenseAdvice & {score: number})[] = [];
  for (const definition of content.towers) {
    if (!content.scenario.availableTowers.includes(definition.id)) continue;
    if (state.towers.length===0&&definition.id!=='PULSE'&&content.scenario.availableTowers.includes('PULSE')&&(!guard||((content.scenario.id==='guard-gd-01-v1'||content.scenario.id>='guard-gd-04-v1')&&style==='BALANCED'))) continue;
    const level = definition.levels.find(item => item.id === 'L1');
    if (!level || state.resource < level.cost) continue;
    for (const pad of content.map.pads) {
      if (state.towers.some(tower => tower.padId === pad.id)) continue;
      const sameType = state.towers.filter(tower => tower.towerId === definition.id).length;
      candidates.push({command:{type:'Build',padId:pad.id,towerId:definition.id},padId:pad.id,towerId:definition.id,cost:level.cost,
        reasonId:`defense.tactics.reason.${definition.id}`,score:utility(level,pad.id)/level.cost/(1+sameType*.4)});
    }
  }
  for (const tower of state.towers) {
    const definition = content.towers.find(item => item.id === tower.towerId)!;
    const before = definition.levels.find(item => item.id === tower.levelId)!;
    for (const level of definition.levels.filter(item => item.from === before.id && item.cost <= state.resource)) {
      if(level.id.startsWith('L4')&&(!state.ultimateUnlocked||state.towers.some(t=>t.levelId.startsWith('L4'))))continue;
      candidates.push({command:{type:'Upgrade',towerInstanceId:tower.id,levelId:level.id},padId:tower.padId,towerId:tower.towerId,cost:level.cost,
        reasonId:'defense.tactics.reason.upgrade',score:(utility(level,tower.padId)-utility(before,tower.padId))/level.cost});
    }
  }
  if(guard&&style!=='BALANCED')for(const candidate of candidates){
    const isArea=candidate.towerId==='BURST'||candidate.towerId==='CONTROL';
    candidate.score*=style==='AREA_CONTROL'?(isArea?1.28:.94):(isArea?.94:1.28);
  }
  candidates.sort((a,b)=>b.score-a.score || a.cost-b.cost || a.padId.localeCompare(b.padId));
  const best = candidates[0];
  if (!best || best.score <= 0) return null;
  const {score: _score, ...advice} = best;
  return advice;
}
