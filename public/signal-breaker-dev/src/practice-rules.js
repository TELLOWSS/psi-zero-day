/* Pure, isolated 90-second complete-build rehearsal. No persistent rewards or unlocks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerPractice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BUILDS=Object.freeze({
 player:{recipe:'prism',frame:'laser',support:'scan',branch:'focus',textId:'breaker.practice.player'},
 kang_taesik:{recipe:'storm',frame:'arc',support:'mist',branch:'spread',textId:'breaker.practice.kang'},
 yoon_sungho:{recipe:'singularity',frame:'arc',support:'magnet',branch:'spread',textId:'breaker.practice.yoon'},
 lee_jaehoon:{recipe:'plasma',frame:'laser',support:'net',branch:'focus',textId:'breaker.practice.lee'},
 lim_junho:{recipe:'storm',frame:'arc',support:'mist',branch:'focus',textId:'breaker.practice.lim'},
 safety_monitor:{recipe:'prism',frame:'laser',support:'scan',branch:'spread',textId:'breaker.practice.monitor'}
});
function configure(g,id){if(!g.practice||g.state!=='ready'||!BUILDS[id])return false;const b=BUILDS[id];g.practiceCharacter=id;g.practiceBuild=b;g.evolution={frame:b.frame,recipe:b.recipe,branch:b.branch,capstone:true};g.loadout=['pulse',b.support];g.weapon='pulse';g.weaponLevel=3;g.weaponUpgrade='range';g.tunings=['bank','capture','cadence','memory','field'];return true;}
function replenish(g){const missing=Math.max(0,28-g.cores.length);for(let i=0;i<missing;i++){const n=g.practiceSpawned++,kind=['metal','dust','load','power'][n%4];g.addCore({kind,tier:0,x:100+(n%8)*125,y:90+(Math.floor(n/8)%3)*70,vx:n%2?-65:65,vy:-20,stable:true});const c=g.cores.at(-1);c.released=true;c.releaseAt=g.time;}g.maxUnits=g.cleared+g.cores.reduce((n,c)=>n+2**c.tier,0);}
function reset(g){if(!g.practice)return;g.operation=false;g.veteran=false;g.continuous=false;g.burstMode=false;g.premiumRun=false;g.lab=true;g.source=null;g.boss=null;g.circuit=[];g.cores=[];g.pendingCores=[];g.pickups=[];g.pickupCount=14;g.waveCount=1;g.practiceDuration=90;g.practiceSpawned=0;g.practiceNextSpawn=3;configure(g,BUILDS[g.practiceCharacter]?g.practiceCharacter:'player');replenish(g);}
function step(g){if(!g.practice||g.state!=='playing')return;if(g.time>=g.practiceDuration){g.finish(true);return;}if(g.time>=g.practiceNextSpawn||g.cores.length<8){g.practiceNextSpawn=g.time+3;replenish(g);}}
function armor(g,spec){return (spec.kind==='load'?12:spec.kind==='metal'?10:8)*(spec.tier+1);}
function fire(g,s){if(!g.practice||s.kind!=='pulse')return;g.cooldown*=.38;if(g.practiceBuild.branch==='spread'){const angle=Math.atan2(s.vy,s.vx),speed=Math.hypot(s.vx,s.vy);for(const offset of [-.16,.16])if(g.shots.length<32)g.shots.push({...s,id:++g.id,vx:Math.cos(angle+offset)*speed,vy:Math.sin(angle+offset)*speed,trail:[],path:[]});}}
return {BUILDS,configure,reset,step,armor,fire};
});
