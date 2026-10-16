import type {DefenseTacticalStats,DefenseTacticalReport} from '../domain/defense';
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const count=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const tower=(v:unknown)=>['PULSE','BURST','CONTROL','SENSOR'].includes(String(v));
const level=(v:unknown)=>['L1','L2','L3A','L3B','L4A','L4B'].includes(String(v));
const family=(v:unknown)=>record(v)&&['damage','resolved','shots'].every(k=>count(v[k]));
const point=(v:unknown)=>record(v)&&typeof v.x==='number'&&Number.isFinite(v.x)&&v.x>=0&&v.x<=1000&&typeof v.y==='number'&&Number.isFinite(v.y)&&v.y>=0&&v.y<=600;
export function validDefenseFirstContact(v:unknown):boolean{return record(v)&&typeof v.padId==='string'&&v.padId.length<=80&&count(v.tick)&&point(v.point);}
export function validDefenseTacticalStats(v:unknown):v is DefenseTacticalStats{
 if(!record(v)||!family(v)||!['trackedFromTick','initialLeaks','initialShield','supportUses','eStopUses','peakSignals'].every(k=>count(v[k])))return false;
 if(!record(v.byFamily)||Object.entries(v.byFamily).some(([key,value])=>!tower(key)||!family(value)))return false;
 if(v.routeLeaks!==undefined&&(!Array.isArray(v.routeLeaks)||v.routeLeaks.length>24||!v.routeLeaks.every(e=>record(e)&&['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'].includes(String(e.enemyId))&&typeof e.routeId==='string'&&e.routeId.length<=80&&count(e.waveId)&&count(e.tick)&&point(e.point)&&(e.firstContact===undefined||validDefenseFirstContact(e.firstContact)))))return false;
 if(v.supportEvents!==undefined&&(!Array.isArray(v.supportEvents)||v.supportEvents.length>24||!v.supportEvents.every(e=>record(e)&&['SUPPORT','E_STOP'].includes(String(e.kind))&&['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER','COMMANDER','SIGNALER'].includes(String(e.supportId))&&count(e.waveId)&&count(e.tick))))return false;
 if(v.tickMs!==undefined&&(!count(v.tickMs)||v.tickMs<1||v.tickMs>1000))return false;
 if(v.detailTrackedFromTick!==undefined&&!count(v.detailTrackedFromTick))return false;
 if(v.byLevel!==undefined&&(!record(v.byLevel)||Object.keys(v.byLevel).length>24||Object.entries(v.byLevel).some(([key,value])=>{const [t,l,...rest]=key.split(':');return rest.length>0||!tower(t)||!level(l)||!family(value);})))return false;
 const best=v.bestClear;
 if(best!==null&&(!record(best)||!count(best.count)||!tower(best.towerId)||!level(best.levelId)||typeof best.padId!=='string'||!count(best.waveId)))return false;
 if(!Array.isArray(v.waves)||v.waves.length>12||!v.waves.every(w=>record(w)&&['waveId','resolved','leaks','shieldLost'].every(k=>count(w[k]))))return false;
 return new Set(v.waves.map(w=>(w as {waveId:number}).waveId)).size===v.waves.length;
}
export function validDefenseTacticalReport(v:unknown):v is DefenseTacticalReport{
 return record(v)&&typeof v.runId==='string'&&typeof v.contentVersion==='string'&&['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER','COMMANDER','SIGNALER'].includes(String(v.supportId))&&typeof v.won==='boolean'&&count(v.shield)&&validDefenseTacticalStats(v.stats)
  &&Array.isArray(v.loadout)&&v.loadout.length<=8&&v.loadout.every(t=>record(t)&&typeof t.padId==='string'&&tower(t.towerId)&&level(t.levelId)&&['FIRST','STRONG'].includes(String(t.targetMode)));
}
