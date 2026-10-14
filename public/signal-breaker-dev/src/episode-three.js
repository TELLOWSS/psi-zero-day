/* EP03: finite, seeded encounter score. Gameplay only; no renderer or persistence. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEpisodeThree=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const IDS=['CH-01','CH-02','CH-03','CH-04','CH-05'];
const STAGES=IDS.map((id,i)=>({id,number:i+11,nameId:'breaker.ep03.'+(i+1)+'.name',hookId:'breaker.ep03.'+(i+1)+'.hook',goalId:'breaker.ep03.goal'}));
const stage=id=>STAGES.find(s=>s.id===id)||STAGES[0];
const key=id=>'E3-'+id;
function unlocked(records,id){const i=IDS.indexOf(id);return i>=0&&records?.['V-CH-05']?.won===true&&(i===0||records?.[key(IDS[i-1])]?.won===true);}
function plans(g){let seed=(g.seed^0xe301)>>>0;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},site=Math.max(0,IDS.indexOf(g.config.id));
 const materials=[['metal','load'],['metal','power'],['dust','power'],['load','metal'],['power','dust','metal','load']][site];
 return [6,11,4,14,8].map((base,w)=>{const count=base+Math.floor(random()*3)+site%2;
  return Array.from({length:count},(_,i)=>{const group=Math.floor(i/4),formation=(w+site+group)%3,side=group%2?1:-1,role=w===2?'runner':formation===1&&i%3===0?'diver':formation===2&&i%4===0?'relay':'runner';
   const jitter=Math.round((random()-.5)*32);return {tier:role==='runner'&&i%5===0?1:0,kind:materials[i%materials.length],role,formation,reinforcement:true,
    // Four-member formations, then a quiet interval. All units have a finite budget.
    offset:1.6+group*5.2+(i%4)*.16+(w===2?1.5:0),x:jitter+(formation===0?120+(i%4)*240:formation===1?240+(i%4)*190:side<0?130+(i%4)*50:970-(i%4)*50),
    y:110+(i%3)*50,vx:side*(role==='runner'?115:65),vy:-20};});});
}
function initialize(g){g.assault={breaks:0,surges:0,formation:-1};g.pickupCount=5;
 const frame=g.config.id==='CH-03'?'arc':'laser';g.evolution={frame,recipe:frame==='arc'?'storm':g.config.gateStable?'plasma':'prism',branch:null,capstone:false};
 g.loadout=['pulse',frame==='arc'?'mist':g.config.gateStable?'net':'scan'];g.weapon='pulse';
}
function selectBuild(g,recipe){if(g.episode!==3||g.state!=='ready'||!['storm','singularity','prism','plasma'].includes(recipe)||g.config.gateStable&&!['storm','plasma'].includes(recipe))return false;
 const frame=['storm','singularity'].includes(recipe)?'arc':'laser',support={storm:'mist',singularity:'magnet',prism:'scan',plasma:'net'}[recipe];g.evolution={frame,recipe,branch:null,capstone:false};g.loadout=['pulse',support];g.weapon='pulse';return true;}
function spawnWave(g,rows){g.assault.formation=-1;g.pendingCores=rows.map(s=>({...s,at:g.time+s.offset}));}
function step(g){if(!g.assault)return;
 while(g.pendingCores[0]?.at<=g.time&&g.cores.length<12){const s=g.pendingCores.shift();g.addCore(s);if(g.assault.formation!==Math.floor(s.offset/5.2)){g.assault.formation=Math.floor(s.offset/5.2);g.event('formation',s.x,s.y,s.formation);}g.event('reinforcement',s.x,s.y,1,s.kind);}
}
function motion(g,c,dt){if(!c.role||c.released||c.stable)return;
 if(c.role==='runner')c.vx+=Math.sin(c.age*2.4+c.id)*65*dt;
 if(c.role==='relay')c.vy+=(Math.sin(c.age*3)*50-c.vy)*Math.min(1,dt*4);
 if(c.role==='diver'){
  if(!c.diveAt&&c.age>=1.2){c.diveX=Math.max(60,Math.min(1040,Math.max(c.x-180,Math.min(c.x+180,g.player.x))));c.diveAt=g.time+1.35;c.diveEnd=c.diveAt+.9;g.event('diverwarning',c.diveX,500);}
  if(c.diveAt&&g.time<c.diveAt){c.vx=0;c.vy=-115;}
  else if(c.diveAt&&g.time<c.diveEnd){const remaining=Math.max(.05,c.diveEnd-g.time);c.vx=Math.max(-250,Math.min(250,(c.diveX-c.x)/remaining));c.vy=Math.max(0,Math.min(420,(536-c.r-c.y)/remaining));}
 }
}
function resolved(g,c){if(!g.assault||c.echo)return;g.assault.breaks++;
 // Removing the relay breaks nearby armour. It never generates more enemies.
 if(c.role==='relay'){let count=0;for(const q of g.cores)if(q.id!==c.id&&Math.hypot(q.x-c.x,q.y-c.y)<240){q.armor=0;q.stable=true;count++;}g.event('relaybreak',c.x,c.y,count,c.kind);}
 if(g.assault.breaks%6===0){g.assault.surges++;g.boostUntil=Math.max(g.boostUntil,g.time+3);g.event('assaultsurge',c.x,c.y,3,c.kind);}
}
function restore(g,data){if(!data||!Number.isSafeInteger(data.breaks)||data.breaks<0||data.breaks>g.maxUnits||data.breaks!==g.cleared||!Number.isSafeInteger(data.surges)||data.surges!==Math.floor(data.breaks/6))return false;g.assault={breaks:data.breaks,surges:data.surges,formation:-1};return true;}
return {STAGES,stage,key,unlocked,plans,initialize,selectBuild,spawnWave,step,motion,resolved,restore};
});
