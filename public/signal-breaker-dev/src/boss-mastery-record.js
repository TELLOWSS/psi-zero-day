/* Additive, defensive records. Old campaign/save contracts remain independent. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRaidMastery=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const ids=['delivery','conveyor','extraction','tension','grid'],modes=['story','standard','veteran','nightmare'];
 const number=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,n)):0;
 function normalize(value){const entries={};for(const episode of[1,2,3])for(const id of ids){const key=episode+':'+id,v=value?.entries?.[key];if(!v||typeof v!=='object')continue;const patterns={};for(const phase of[1,2,3])patterns[phase]=Math.min(2,Math.floor(number(v.patterns?.[phase])));const best={};for(const mode of modes){const b=v.best?.[mode];if(b&&number(b.time)>0)best[mode]={time:number(b.time),score:number(b.score),noHit:b.noHit===true};}entries[key]={patterns,best,attempts:Math.floor(number(v.attempts)),failures:Math.floor(number(v.failures)),successes:Math.floor(number(v.successes)),completed:(Array.isArray(v.completed)?v.completed:[]).filter(x=>typeof x==='string').slice(-20),cosmetic:v.cosmetic===true};}return {version:1,entries};}
 function update(value,episode,runId,snap,state,score=0){const result=normalize(value);if(!snap||snap.practice||!ids.includes(snap.identity)||![1,2,3].includes(episode))return result;const key=episode+':'+snap.identity,e=result.entries[key]||{patterns:{1:0,2:0,3:0},best:{},attempts:0,failures:0,successes:0,completed:[],cosmetic:false};
  for(const row of snap.log||[]){if(![1,2,3].includes(row.phase))continue;if(row.kind==='warning')e.patterns[row.phase]=Math.max(e.patterns[row.phase]||0,1);if(row.kind==='counter')e.patterns[row.phase]=2;}
  if(['won','lost'].includes(state)&&!e.completed.includes(runId)){e.completed.push(runId);e.completed=e.completed.slice(-20);e.attempts++;e.failures+=number(snap.failures);e.successes+=number(snap.successes);if(state==='won'&&modes.includes(snap.difficulty)){const old=e.best[snap.difficulty],time=number(snap.elapsed);if(time>0)e.best[snap.difficulty]={time:old?Math.min(old.time,time):time,score:Math.max(old?.score||0,number(score)),noHit:old?.noHit===true||snap.damageTaken===0};e.cosmetic=true;}}
  result.entries[key]=e;return result;
 }
 return {normalize,update};
});
