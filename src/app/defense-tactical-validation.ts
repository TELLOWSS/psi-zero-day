import type {DefenseTacticalStats,DefenseTacticalReport} from '../domain/defense';
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const count=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const tower=(v:unknown)=>['PULSE','BURST','CONTROL','SENSOR'].includes(String(v));
const level=(v:unknown)=>['L1','L2','L3A','L3B'].includes(String(v));
const family=(v:unknown)=>record(v)&&['damage','resolved','shots'].every(k=>count(v[k]));
export function validDefenseTacticalStats(v:unknown):v is DefenseTacticalStats{
 if(!record(v)||!family(v)||!['trackedFromTick','initialLeaks','initialShield','supportUses','eStopUses','peakSignals'].every(k=>count(v[k])))return false;
 if(!record(v.byFamily)||Object.entries(v.byFamily).some(([key,value])=>!tower(key)||!family(value)))return false;
 const best=v.bestClear;
 if(best!==null&&(!record(best)||!count(best.count)||!tower(best.towerId)||!level(best.levelId)||typeof best.padId!=='string'||!count(best.waveId)))return false;
 if(!Array.isArray(v.waves)||v.waves.length>12||!v.waves.every(w=>record(w)&&['waveId','resolved','leaks','shieldLost'].every(k=>count(w[k]))))return false;
 return new Set(v.waves.map(w=>(w as {waveId:number}).waveId)).size===v.waves.length;
}
export function validDefenseTacticalReport(v:unknown):v is DefenseTacticalReport{
 return record(v)&&typeof v.runId==='string'&&typeof v.contentVersion==='string'&&['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER'].includes(String(v.supportId))&&typeof v.won==='boolean'&&count(v.shield)&&validDefenseTacticalStats(v.stats)
  &&Array.isArray(v.loadout)&&v.loadout.length<=8&&v.loadout.every(t=>record(t)&&typeof t.padId==='string'&&tower(t.towerId)&&level(t.levelId)&&['FIRST','STRONG'].includes(String(t.targetMode)));
}
