import type {DefenseCombatShot,DefenseContent,DefenseEnemyState,DefensePendingAttack,DefensePoint,DefenseRunState,DefenseTowerLevelDefinition,DefenseTowerState} from '../domain/defense';
import {defenseBoundary,defenseDistanceSquared,defenseEnemyPosition,defenseGuidanceContains,defenseSegmentDistance,defenseTowerPoint} from './defense-geometry';
import {compareDefenseTargets} from './defense-targeting';
import type {DefenseTargetMode} from '../domain/defense';

const visible=(e:DefenseEnemyState,c:DefenseContent,tick:number)=>!c.enemies.find(d=>d.id===e.enemyId)!.hidden||e.revealUntilTick>tick;
function ordered(enemies:readonly DefenseEnemyState[],state:DefenseRunState,content:DefenseContent,mode:DefenseTargetMode){
 return [...enemies].sort((a,b)=>compareDefenseTargets(a,b,mode,content,state));
}
export function ultimateHit(enemy:DefenseEnemyState,content:DefenseContent,tick:number,level:DefenseTowerLevelDefinition,source:string,multiplier=1){
 const definition=content.enemies.find(e=>e.id===enemy.enemyId)!,armorBase=definition.boss&&definition.phase&&tick>=enemy.bossArmorFromTick&&tick<enemy.bossArmorUntilTick?definition.phase.armor:definition.armor;
 const armor=Math.max(0,armorBase-((enemy.armorExposedUntilTick??0)>tick?(enemy.armorExposeFraction??0):0));
 const raw=Math.floor(level.damage*multiplier),damage=level.damageType==='PURE'?raw:Math.max(1,Math.floor(raw*(1-armor)));
 let updated={...enemy,hp:Math.max(0,enemy.hp-damage)};
 if(updated.hp>0&&level.slowFraction>0)updated={...updated,slowEffects:[...updated.slowEffects.filter(e=>e.sourceId!==source&&e.endTick>tick),{sourceId:source,fraction:level.slowFraction,startTick:tick,endTick:tick+level.slowTicks}]};
 if(updated.hp>0&&level.ultimate==='LOCK'&&!definition.boss)updated={...updated,lockedUntilTick:Math.max(updated.lockedUntilTick??0,tick+12)};
 return updated;
}
function hitTargets(state:DefenseRunState,content:DefenseContent,attack:{id:string;towerId:DefenseTowerState['towerId'];levelId:DefenseTowerState['levelId'];padId:string;origin:DefensePoint;center:DefensePoint;level:DefenseTowerLevelDefinition},targets:readonly DefenseEnemyState[],phase?:'IMPACT',multipliers?:readonly number[]){
 let enemies=state.enemies;const hits:DefenseCombatShot['targets'][number][]=[];
 for(const [i,target] of targets.entries()){
  const current=enemies.find(e=>e.id===target.id);if(!current||current.hp<=0)continue;
  const updated=ultimateHit(current,content,state.tick,attack.level,attack.id,multipliers?.[i]??1);
  hits.push({id:current.id,enemyId:current.enemyId,distance:current.distance,point:defenseEnemyPosition(content,current,state),damage:current.hp-updated.hp,resolved:updated.hp===0});
  enemies=enemies.map(e=>e.id===current.id?updated:e);
 }
 const shot:DefenseCombatShot={id:attack.id,towerId:attack.towerId,levelId:attack.levelId,padId:attack.padId,origin:attack.origin,targetPoint:attack.center,mechanic:attack.level.ultimate,targets:hits,...(phase?{phase}:{})};
 return {state:{...state,enemies},shot};
}
export function updateDefenseUltimateFields(state:DefenseRunState,content:DefenseContent){
 let enemies=state.enemies;
 for(const tower of state.towers){const level=content.towers.find(t=>t.id===tower.towerId)!.levels.find(l=>l.id===tower.levelId)!;if(level.ultimate!=='BOUNDARY')continue;
  const line=defenseBoundary(content,state,tower);enemies=enemies.map(e=>{
   if(e.hp<=0||!visible(e,content,state.tick)||defenseSegmentDistance(defenseEnemyPosition(content,e,state),line.a,line.b)>line.width)return e;
   const sourceId=`${tower.id}:boundary`;return {...e,slowEffects:[...e.slowEffects.filter(s=>s.sourceId!==sourceId&&s.endTick>state.tick),{sourceId,fraction:.6,startTick:state.tick,endTick:state.tick+6}]};
  });
 }
 return enemies===state.enemies?state:{...state,enemies};
}
export function updateDefenseAnalysis(state:DefenseRunState,content:DefenseContent){
 const towers=state.towers.map(tower=>{const level=content.towers.find(t=>t.id===tower.towerId)!.levels.find(l=>l.id===tower.levelId)!;if(level.ultimate!=='ANALYSIS')return tower;
  const origin=defenseTowerPoint(content,tower),target=ordered(state.enemies.filter(e=>e.hp>0&&visible(e,content,state.tick)&&(defenseDistanceSquared(origin,defenseEnemyPosition(content,e,state))<=level.range**2||defenseGuidanceContains(state,tower,origin,defenseEnemyPosition(content,e,state),level.range))),state,content,tower.targetMode)[0];
  if(!target)return {...tower,analysisTicks:Math.max(0,(tower.analysisTicks??0)-4),analysisTargetId:(tower.analysisTicks??0)>4?tower.analysisTargetId:null};
  return {...tower,analysisTargetId:target.id,analysisTicks:tower.analysisTargetId===target.id?Math.min(80,(tower.analysisTicks??0)+1):1};
 });return {...state,towers};
}
/** Returns only engine-owned launches or real contacts. All delayed damage remains pending state. */
export function fireDefenseUltimate(state:DefenseRunState,content:DefenseContent,tower:DefenseTowerState,level:DefenseTowerLevelDefinition,target:DefenseEnemyState){
 const origin=defenseTowerPoint(content,tower),center=defenseEnemyPosition(content,target,state),id=`${state.runId}:${state.tick}:${tower.id}`,base={id,towerId:tower.towerId,levelId:tower.levelId,padId:tower.padId,origin,center,level};
 if(level.ultimate==='DELAY'||level.ultimate==='WAVE'){
  const kind=level.ultimate,attack:DefensePendingAttack={...base,id:`${id}:pending`,kind,towerInstanceId:tower.id,targetMode:tower.targetMode,startedTick:state.tick,dueTick:state.tick+(kind==='DELAY'?12:1),expiresTick:state.tick+12,hitEnemyIds:[],progressRadius:0};
  return {state:{...state,pendingAttacks:[...(state.pendingAttacks??[]),attack]},tower,shots:[{id:`${id}:launch`,towerId:tower.towerId,levelId:tower.levelId,padId:tower.padId,origin,targetPoint:center,mechanic:level.ultimate,phase:'LAUNCH' as const,radius:level.splashRadius,targets:[]}]};
 }
 let targets:DefenseEnemyState[]=[target];let multipliers:number[]|undefined;
 if(level.ultimate==='PIERCE'){
  const dx=center.x-origin.x,dy=center.y-origin.y,length=Math.hypot(dx,dy)||1,end={x:center.x+dx/length*160,y:center.y+dy/length*160};
  targets=[target,...state.enemies.filter(e=>e.id!==target.id&&e.hp>0&&visible(e,content,state.tick)).filter(e=>{const p=defenseEnemyPosition(content,e,state);return (p.x-center.x)*dx+(p.y-center.y)*dy>=0&&defenseSegmentDistance(p,center,end)<=18;}).sort((a,b)=>defenseDistanceSquared(defenseEnemyPosition(content,a,state),center)-defenseDistanceSquared(defenseEnemyPosition(content,b,state),center))].slice(0,3);multipliers=[1,.65,.45];
 }else if(level.splashRadius>0){targets=[target,...ordered(state.enemies.filter(e=>e.id!==target.id&&e.hp>0&&visible(e,content,state.tick)&&defenseDistanceSquared(defenseEnemyPosition(content,e,state),center)<=level.splashRadius**2),state,content,'FIRST')].slice(0,level.maxTargets);}
 const actualLevel=level.ultimate==='ANALYSIS'?{...level,damage:level.damage+Math.floor((tower.analysisTicks??0)/20)*10}:level;
 const result=hitTargets(state,content,{...base,level:actualLevel},targets,undefined,multipliers);let next=result.state,nextTower=tower;
 if(level.ultimate==='VOLLEY'){
  const charging=(state.pendingAttacks??[]).some(a=>a.towerInstanceId===tower.id&&a.kind==='VOLLEY');
  const charge=charging?(tower.charge??0):(tower.charge??0)+1;nextTower={...tower,charge:charge>=4?0:charge};
  if(charge>=4&&!charging){const pending=[3,6].map(delay=>({...base,id:`${id}:repeat:${delay}`,kind:'VOLLEY' as const,towerInstanceId:tower.id,targetMode:tower.targetMode,startedTick:state.tick,dueTick:state.tick+delay,expiresTick:state.tick+delay,hitEnemyIds:[],progressRadius:0}));next={...next,pendingAttacks:[...(state.pendingAttacks??[]),...pending]};}
 }
 return {state:next,tower:nextTower,shots:[result.shot]};
}
export function resolveDefensePending(state:DefenseRunState,content:DefenseContent){
 let next=state;const keep:DefensePendingAttack[]=[],shots:DefenseCombatShot[]=[];
 for(const attack of state.pendingAttacks??[]){
  if(state.tick<attack.dueTick){keep.push(attack);continue;}
  let targets:DefenseEnemyState[]=[];let progressRadius=attack.progressRadius;
  const valid=next.enemies.filter(e=>e.hp>0&&visible(e,content,state.tick));
  if(attack.kind==='VOLLEY'){targets=ordered(valid.filter(e=>defenseDistanceSquared(defenseEnemyPosition(content,e,next),attack.origin)<=attack.level.range**2),next,content,attack.targetMode).slice(0,1);}
  else if(attack.kind==='DELAY'){targets=ordered(valid.filter(e=>defenseDistanceSquared(defenseEnemyPosition(content,e,next),attack.center)<=attack.level.splashRadius**2),next,content,'FIRST').slice(0,attack.level.maxTargets);}
  else{
   progressRadius=attack.level.splashRadius*Math.min(1,(state.tick-attack.startedTick)/12);
   targets=ordered(valid.filter(e=>{if(attack.hitEnemyIds.includes(e.id))return false;const d=Math.sqrt(defenseDistanceSquared(defenseEnemyPosition(content,e,next),attack.center));return d<=progressRadius&&d>=Math.max(0,attack.progressRadius-6);}),next,content,'FIRST').slice(0,Math.max(0,attack.level.maxTargets-attack.hitEnemyIds.length));
  }
  if(targets.length){const result=hitTargets(next,content,{...attack,id:`${attack.id}:${state.tick}`},targets,'IMPACT');next=result.state;shots.push(result.shot);}
  const hitEnemyIds=[...attack.hitEnemyIds,...targets.map(e=>e.id)];
  if(attack.kind==='WAVE'&&state.tick<attack.expiresTick&&hitEnemyIds.length<attack.level.maxTargets)keep.push({...attack,hitEnemyIds,progressRadius});
 }
 return {state:{...next,pendingAttacks:keep},shots};
}
