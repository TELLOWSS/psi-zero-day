/* Approved tactical growth effects. Pure engine extension: no DOM or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerGrowthCombat=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function install(Game){
 const proto=Game.prototype,base={};
 for(const name of ['reset','applyTalentStats','event','fire','update','step','cycleShield','pulse','netBurst','capture','coreMotion','fieldForces','deployField','weaponContact','checkpoint','assistAim'])base[name]=proto[name];
 proto.reset=function(){base.reset.call(this);this.lastDamage=null;this.growthState={emergencyUsed:false,reflectionHits:0,nextTriple:false,cleanAt:0,scanReadyAt:0,slowRemaining:0};};
 proto.applyTalentStats=function(stats){base.applyTalentStats.call(this,stats?JSON.parse(JSON.stringify(stats)):null);};
 proto.growthStats=function(key=this.weapon){const stats={...(this.talentStats||{})};for(const [name,value] of Object.entries(this.talentStats?.weaponSocketStats?.[key]||{}))stats[name]=(stats[name]||0)+value;return stats;};
 proto.equipmentTier=function(key=this.weapon){return Math.round(clamp(this.talentStats?.weaponLevels?.[key]||1,1,4));};
 proto.growthDamage=function(shot,armored=false){const stats=this.growthStats(shot.kind);return (1+clamp(stats.pulseImpact,0,3))*(armored?Math.max(1,clamp(stats.armorPierceMultiplier||1,1,2)):1);};
 proto.damagePlayer=function(kind,x=this.player.x,y=this.player.y,source='core'){
  if(this.lab||this.godMode||this.player.invuln>0||kind==='power'&&this.growthStats().powerImmunity>0)return false;
  this.lastDamage={kind,source,time:this.time};this.player.life--;this.player.invuln=1.8;this.shake=7;
  if(this.player.life===1&&this.talentStats?.emergencyShield&&!this.growthState.emergencyUsed){this.growthState.emergencyUsed=true;this.player.invuln=3;this.event('emergencyshield',x,y,3,kind);}
  this.event('hurt',x,y,this.player.life,kind);if(this.player.life<=0)this.finish(false);return true;
 };
 proto.event=function(kind,x,y,n,material){
  base.event.call(this,kind,x,y,n,material);
  if(!this.growthState)return;
  if(kind==='chain'&&n>=5&&this.burstMode&&this.time>=this.boostReadyAt){this.boostUntil=this.time+6;this.boostReadyAt=this.time+14;base.event.call(this,'overdrive',x,y,6,material);}
  if(!this.talentStats)return;
  if(kind==='impact'){
   this.growthState.reflectionHits=n>0?Math.min(3,this.growthState.reflectionHits+1):0;
   if(this.growthState.reflectionHits>=3&&this.talentStats.tripleSplitChance>0){const roll=((Math.imul((this.seed^Math.imul(this.shotsFired+1,7919))>>>0,1664525)+1013904223)>>>0)/4294967296;this.growthState.nextTriple=roll<Math.min(1,this.talentStats.tripleSplitChance/.6);this.growthState.reflectionHits=0;}
   if(this.talentStats.hitStopBoost>0)base.event.call(this,'growthimpact',x,y,clamp(this.talentStats.hitStopBoost,0,.04),material);
  }
  if(kind==='node'&&this.talentStats.kineticOverdrive){this.chain=Math.max(10,this.chain);this.bestChain=Math.max(this.chain,this.bestChain);this.comboTime=this.comboWindow();this.boostUntil=Math.max(this.boostUntil,this.time+6);this.growthShockwave(x,y,200);base.event.call(this,'overdrive',x,y,6,material);}
 };
 proto.growthShockwave=function(x,y,radius){
  for(const c of this.cores){const d=distance(c,{x,y});if(d>0&&d<=radius){c.vx+=(c.x-x)/d*120;c.vy+=(c.y-y)/d*120;}}
 };
 proto.fire=function(){
  const before=new Set(this.shots.map(s=>s.id)),key=this.weapon,stats=this.growthStats(key),tier=this.equipmentTier(key),oldStats=this.talentStats;
  // Trait splitting requires three reflected impacts; socket splitting stays probabilistic.
  this.talentStats={...stats,pulseSpeed:(stats.pulseSpeed||0)+(key==='pulse'&&tier>=2?.15:0),tripleSplitChance:key==='pulse'&&this.growthState.nextTriple?1:(oldStats?.weaponSocketStats?.pulse?.tripleSplitChance||0)};
  let fired;try{fired=base.fire.call(this);}finally{this.talentStats=oldStats;}
  if(!fired)return false;
  if(key==='pulse'){this.growthState.nextTriple=false;if(tier>=2)this.cooldown*=.75;}
  if(key!=='pulse'&&this.supportCadenceUntil>this.time)this.cooldown*=1-clamp(stats.cooldownReduction,0,.5);
  const shots=this.shots.filter(s=>!before.has(s.id));
  for(const shot of shots){shot.pierceBudget=key==='pulse'&&tier>=4?3:0;if(key==='pulse'&&tier>=3)shot.splashRadius=95;}
  return true;
 };
 proto.update=function(elapsed){
  const dt=clamp(elapsed,0,.066),slow=this.growthState.slowRemaining;
  if(this.state==='playing'&&slow>0)this.growthState.slowRemaining=Math.max(0,slow-dt);
  base.update.call(this,slow>0?dt*.35:elapsed);
 };
 proto.step=function(dt){base.step.call(this,dt);if(this.state!=='playing')return;
  // Trait auto-recovery uses ordinary capture validation, preserving armor and mass.
  if(this.talentStats?.autoCleanDrone&&this.pendingCores.length===0&&this.cores.length>0&&this.cores.length<=3&&this.time>=this.growthState.cleanAt){
   const candidates=[...this.cores].filter(c=>!c.armor);if(candidates.length){this.growthState.cleanAt=this.time+.75;for(const c of candidates){c.stable=true;this.capture(c,true);}this.event('cleandrone',this.player.x,this.player.y,candidates.length);}
  }
  for(const c of this.cores)if(c.frozenUntil>this.time){c.vx=0;c.vy=0;}
 };
 proto.cycleShield=function(){base.cycleShield.call(this);if(!['ready','playing'].includes(this.state)||!this.talentStats?.absoluteShieldShockwave)return;
  const target=this.cores.filter(c=>!c.stable&&c.y<this.player.y).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0];
  if(target){target.stable=true;this.growthShockwave(this.player.x,this.player.y,200);this.event('shieldstabilize',target.x,target.y,1,target.kind);}
 };
 proto.pulse=function(core,shot){
  if(!this.cores.some(c=>c.id===core.id))return;
  const stats=this.growthStats('pulse'),x=core.x,y=core.y,before=new Set(this.cores.map(c=>c.id)),neighbours=this.cores.filter(c=>c.id!==core.id&&distance(c,core)<=(shot.splashRadius||0));
  base.pulse.call(this,core,shot);
  if(stats.pulseImpact>0)for(const child of this.cores)if(!before.has(child.id)){child.vx*=1+stats.pulseImpact;child.vy*=1+stats.pulseImpact;}
  if(stats.knockbackRadius>0)this.growthShockwave(x,y,stats.knockbackRadius);
  if(shot.splashRadius)for(const c of neighbours.slice(0,3))if(this.cores.some(q=>q.id===c.id))base.pulse.call(this,c,{...shot,splashRadius:0,bounces:0});
 };
 proto.netBurst=function(target){
  const tier=this.equipmentTier('net'),stats=this.growthStats('net'),radius=this.captureRadius();
  if(tier>=3){for(const c of this.cores)if(distance(c,target)<=radius+c.r)c.frozenUntil=this.time+1.5;}
  const additional=stats.netCapacity>0?this.cores.filter(c=>distance(c,target)>radius+c.r&&distance(c,target)<=radius*1.5+c.r).sort((a,b)=>distance(a,target)-distance(b,target)).slice(0,Math.round(stats.netCapacity)):[];
  base.netBurst.call(this,target);for(const c of additional)this.capture(c,true);
  if(tier>=3){this.fields=this.fields.filter(f=>f.kind!=='net');this.fields.push({kind:'net',tier,x:target.x,y:target.y,radius:radius*(tier>=4?1.5:1),until:this.time+(tier>=4?3:1.5)});}
 };
 proto.capture=function(core,byNet){const before=this.cleared;base.capture.call(this,core,byNet);if(this.cleared>before&&this.talentStats?.cooldownReduction>0)this.supportCadenceUntil=this.time+this.comboWindow();};
 proto.coreMotion=function(core,dt){if(core.frozenUntil>this.time){core.age+=dt;return;}base.coreMotion.call(this,core,dt);};
 proto.fieldForces=function(c,dt){
  base.fieldForces.call(this,c,dt);
  for(const f of this.fields){const d=distance(c,f);if(d>f.radius)continue;
   if(f.kind==='net'){if(f.tier===3)c.frozenUntil=f.until;else if(d>10){c.vx+=(f.x-c.x)/d*350*dt;c.vy+=(f.y-c.y)/d*350*dt;}}
   if(f.kind==='magnet'&&c.kind==='metal'){
    if(f.tier>=2&&d>12){const force=(1-d/f.radius)*300*(this.growthStats('magnet').magnetPull||0);c.vx+=(f.x-c.x)/d*force*dt;c.vy+=(f.y-c.y)/d*force*dt;}
    if(f.tier>=3){c.magneticExposure=(c.magneticExposure||0)+dt;if(c.magneticExposure>=.75)c.stable=true;if(f.tier===3&&d>20){c.vx+=(f.y-c.y)/d*200*dt;c.vy-=(f.x-c.x)/d*200*dt;}}
    if(f.tier>=4){c.vx+=(this.config.gate.x-c.x)*dt*2;c.vy+=(this.config.gate.y-c.y)*dt*2;}
   }
   if(f.kind==='mist'&&['dust','power'].includes(c.kind)){
    const stats=this.growthStats('mist');c.mistExposure=(c.mistExposure||0)+dt*((f.tier>=2?1:0)+(stats.mistRate||0));
    if(f.tier>=3||c.mistExposure>=.75){if(!c.stable)this.event('stabilize',c.x,c.y,0,c.kind);c.stable=true;}
    if(f.tier>=4&&c.kind==='dust'){c.vx*=Math.exp(-dt*6);c.vy*=Math.exp(-dt*6);}
   }
  }
  if(this.equipmentTier('anchor')>=2&&c.kind==='load'&&this.anchors.some(a=>a.id===c.id)){c.vx*=Math.exp(-dt*2);c.vy*=Math.exp(-dt*2);}
 };
 proto.deployField=function(kind,x,y){
  base.deployField.call(this,kind,x,y);const field=this.fields.find(f=>f.kind===kind);if(!field)return;
  field.tier=this.equipmentTier(kind);const stats=this.growthStats(kind);
  if(kind==='magnet'&&field.tier>=2)field.pulsing=true;
  if(kind==='magnet')field.radius*=1+clamp(stats.magnetRadius,0,2);
  if(kind==='scan'&&field.tier>=4&&this.time>=this.growthState.scanReadyAt){this.growthState.slowRemaining=1.5;this.growthState.scanReadyAt=this.time+5;this.event('scanslow',x,y,1.5);}
 };
 proto.weaponContact=function(shot,target){
  if(shot.kind!=='anchor'){base.weaponContact.call(this,shot,target);return;}
  const tier=this.equipmentTier('anchor'),existing=this.anchors.find(a=>a.id===target.id);
  if(existing){this.anchors=this.anchors.filter(a=>a.id!==target.id);this.event('anchor',target.x,target.y,0);return;}
  if(tier>=2&&target.kind==='load'){target.vx*=.5;target.vy*=.5;}
  const limit=tier>=3?3:1;this.anchors.push({id:target.id,x:target.x,y:target.y,until:this.time+3+(this.weaponLevel-1)+(this.hasTuning('field')?.5:0)+(this.growthStats('anchor').anchorDuration||0)});this.anchors=this.anchors.slice(-limit);this.event('anchor',target.x,target.y,1);
 };
 proto.assistAim=function(smart){const target=base.assistAim.call(this,smart);if(target&&this.equipmentTier('scan')>=3&&this.scanUntil>this.time){this.setAim(target.x,target.y);target.aligned=!target.blocked;}return target;};
 proto.predictiveThreats=function(){
  if(!this.talentStats?.predictiveScanner&&!(this.equipmentTier('scan')>=2&&this.scanUntil>this.time))return [];
  return this.pendingCores.filter(c=>c.at>this.time&&c.at<=this.time+1.5).slice(0,8).map(c=>({x:c.x,y:c.y,kind:c.kind,remaining:c.at-this.time}));
 };
 proto.enterTraining=function(){this.training=true;this.flowCheckpoint=null;};
 proto.spawnTrainingCores=function(kind,count=5){if(!['metal','dust','power','load'].includes(kind))return 0;this.enterTraining();let added=0;for(let n=0;n<Math.min(5,Math.max(0,Math.floor(count)));n++)if(this.addCore({x:120+this.random()*860,y:90+this.random()*220,tier:Math.floor(this.random()*3),kind,stable:false,vx:(this.random()-.5)*160,vy:(this.random()-.5)*140}))added++;return added;};
 proto.clearTrainingCores=function(){this.enterTraining();this.cores=[];};
 proto.spawnTrainingBoss=function(){if(!this.operation)return false;this.enterTraining();this.wave=this.waveCount-1;this.cores=[];this.pendingCores=[];this.beginNextWave();return true;};
 proto.exposeTrainingBoss=function(){if(!this.boss)return false;this.enterTraining();this.boss.exposure=0;this.boss.trainingExposedUntil=this.time+4;this.boss.phase='exposed';this.boss.nodes.forEach(n=>{n.hit=true;});return true;};
 proto.forceTrainingFever=function(){this.enterTraining();this.boostUntil=this.time+10;};
 proto.toggleTrainingImmunity=function(){this.enterTraining();return this.godMode=!this.godMode;};
 proto.checkpoint=function(){if(this.training)return null;const value=base.checkpoint.call(this);return value?{...value,growthState:{...this.growthState}}:value;};
 const restore=Game.restoreCheckpoint;
 Game.restoreCheckpoint=function(value){const g=restore.call(this,value);if(!g)return null;if(value.growthState){const state=value.growthState;if(typeof state.emergencyUsed!=='boolean'||typeof state.nextTriple!=='boolean'||!Number.isInteger(state.reflectionHits)||state.reflectionHits<0||state.reflectionHits>3||['cleanAt','scanReadyAt','slowRemaining'].some(k=>!Number.isFinite(state[k])||state[k]<0)||state.slowRemaining>1.5)return null;g.growthState={...state};}return g;};
}
return {install};
});
