const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const count=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const number=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const point=(v:unknown)=>record(v)&&number(v.x)&&number(v.y)&&v.x<=1000&&v.y<=600;
const strings=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='string')&&new Set(v).size===v.length;
const mechanics=['VOLLEY','PIERCE','WAVE','DELAY','LOCK','BOUNDARY','OBSERVATION','ANALYSIS'];
export function validDefenseP2State(v:Record<string,unknown>){
 const guard=String(v.scenarioId).startsWith('guard-gd-');
 if(!guard)return !(v.towers as {levelId:string}[]).some(t=>t.levelId.startsWith('L4'))&&v.pendingAttacks===undefined&&v.guidance===undefined;
 if(v.ultimateUnlocked!==undefined&&typeof v.ultimateUnlocked!=='boolean')return false;
 if(v.mapPhase!==undefined&&!['INITIAL','SHIFTED'].includes(String(v.mapPhase)))return false;
 if(v.redeploymentCredits!==undefined&&(!count(v.redeploymentCredits)||v.redeploymentCredits>1))return false;
 if(v.appliedTransitionIds!==undefined&&(!strings(v.appliedTransitionIds)||(v.appliedTransitionIds as unknown[]).length>1))return false;
 if(v.guidance!==undefined){const g=v.guidance;if(!record(g)||typeof g.padId!=='string'||!point(g.direction)||!count(g.untilTick)||!number(g.bonus)||g.bonus>200||!number(g.halfAngle)||g.halfAngle>Math.PI/2)return false;}
 if(v.pendingAttacks!==undefined){
  if(!Array.isArray(v.pendingAttacks)||v.pendingAttacks.length>8)return false;
  if(!v.pendingAttacks.every(a=>{
   if(!record(a)||!['VOLLEY','WAVE','DELAY'].includes(String(a.kind))||!['id','towerInstanceId','padId'].every(k=>typeof a[k]==='string')||!['PULSE','BURST','CONTROL','SENSOR'].includes(String(a.towerId))||!['L4A','L4B'].includes(String(a.levelId)))return false;
   if(!point(a.origin)||!point(a.center)||!['FIRST','STRONG'].includes(String(a.targetMode))||!['startedTick','dueTick','expiresTick'].every(k=>count(a[k]))||Number(a.startedTick)>Number(a.dueTick)||Number(a.dueTick)>Number(a.expiresTick)||!number(a.progressRadius)||!strings(a.hitEnemyIds)||(a.hitEnemyIds as unknown[]).length>12)return false;
   const l=a.level;if(!record(l)||l.id!==a.levelId||!['damage','intervalTicks','range','splashRadius','maxTargets','slowFraction','slowTicks','revealRadius','revealIntervalTicks','revealTicks','cost'].every(k=>number(l[k]))||!mechanics.includes(String(l.ultimate))||!['PHYSICAL','PURE'].includes(String(l.damageType)))return false;
   return Number(l.maxTargets)<=12&&Number(l.intervalTicks)>0&&Number(a.progressRadius)<=Number(l.splashRadius);
  }))return false;
  if(new Set(v.pendingAttacks.map(a=>(a as {id:string}).id)).size!==v.pendingAttacks.length)return false;
 }
 return (v.towers as {levelId:string}[]).filter(t=>t.levelId.startsWith('L4')).length<=1;
}
