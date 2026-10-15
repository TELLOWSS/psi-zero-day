/* Rest-mode rules only. Shared swept collision, canonical movement; no DOM/storage/rewards. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.SignalBreakerEngine);if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerRest=api;})(typeof globalThis!=='undefined'?globalThis:this,function(core){'use strict';
const {Game,DT,W,createRng}=core;
const BUILDS=Object.freeze({storm:{frame:'arc',support:'mist',color:'#93e9ff'},singularity:{frame:'arc',support:'magnet',color:'#73ffdd'},prism:{frame:'laser',support:'scan',color:'#f2a9ff'},plasma:{frame:'laser',support:'net',color:'#ffc2a0'}});
const ACTORS=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
const PROFILES=Object.freeze({calm:{cap:8,target:5,interval:4.2,speed:.65},bright:{cap:12,target:8,interval:3.1,speed:.8}});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
class RestGame extends Game{
 constructor(seed=20261015,options={}){
  super('CH-01',Number.isSafeInteger(seed)&&seed>=0&&seed<=2147483647?seed:20261015,{lab:true});this.mode='rest';this.config={...this.config,tension:false,orderedBoss:false,conveyor:false,bumper:[],rail:[]};
  this.cores=[];this.shots=[];this.events=[];this.source=null;this.circuit=[];this.boss=null;this.rail=[{x:860,y:300,length:145,angle:-.4}];this.talentStats=null;
  this.build=Object.hasOwn(BUILDS,options.build)?options.build:'storm';this.rhythm=Object.hasOwn(PROFILES,options.rhythm)?options.rhythm:'calm';this.actor=ACTORS.includes(options.actor)?options.actor:'player';
  this.loadout=['pulse',BUILDS[this.build].support];this.weapon='pulse';this.cycle=Number.isSafeInteger(options.cycle)&&options.cycle>=0&&options.cycle<=1000000?options.cycle:0;
  this.time=0;this.cycleStart=0;this.nextSpawn=0;this.lastReturn=0;this.formation=0;this.lastPattern=-1;this.random=createRng((this.seed^Math.imul(this.cycle+1,7919))>>>0);
  this.counts={resolved:0,returned:0,seconds:0};for(const k of Object.keys(this.counts)){const v=options.counts?.[k];if(Number.isFinite(v)&&v>=0&&v<=2e8&&(k==='seconds'||Number.isSafeInteger(v)))this.counts[k]=v;}this.baseCounts={...this.counts};this.direction=0;this.autoFire=options.autoFire!==false;this.autoAim=options.autoAim!==false;this.manualFire=false;this.manualUntil=0;this.phaseName='arrival';this.state='ready';this.boundaries=0;this.player.x=550;this.player.aimX=600;this.player.aimY=190;
 }
 start(){if(this.state==='ready')this.state='playing';return this.state==='playing';}
 damagePlayer(){return false;}
 finish(){return false;}
 applyTalentStats(){return false;}
 event(kind,x=550,y=310,n=0,material=null){this.events.push({kind,x,y,n,material,t:this.time});if(this.events.length>70)this.events.shift();}
 setDirection(value){this.direction=Number.isFinite(value)?clamp(value,-1,1):0;}
 setAutomation(key,value){if(!['autoFire','autoAim'].includes(key)||typeof value!=='boolean')return false;this[key]=value;return true;}
 aimDirection(dx,dy){if(this.state!=='playing'||![dx,dy].every(Number.isFinite))return;this.setAimDirection(dx,dy);this.manualUntil=this.time+1.5;}
 aimAt(x,y){if(this.state!=='playing'||![x,y].every(Number.isFinite))return;this.setAim(x,y);this.manualUntil=this.time+1.5;}
 clearInput(){this.direction=0;this.manualFire=false;}
 pause(){this.clearInput();this.accumulator=0;return super.pause();}
 setBuild(id){if(!['ready','paused'].includes(this.state)||!Object.hasOwn(BUILDS,id))return false;this.build=id;this.loadout=['pulse',BUILDS[id].support];return true;}
 setRhythm(id){if(!['ready','paused'].includes(this.state)||!Object.hasOwn(PROFILES,id))return false;this.rhythm=id;while(this.cores.length>this.profile().cap)this.safeReturn(this.cores.at(-1));return true;}
 profile(){return PROFILES[this.rhythm];}
 phase(){const t=this.time-this.cycleStart;return t<10?'arrival':t<55?'flow':t<75?'bloom':t<110?'tidy':'quiet';}
 launchGeometry(){return {...super.launchGeometry(),color:BUILDS[this.build].color};}
 assistAim(){if(this.time<this.manualUntil||!this.cores.length)return null;const p=this.player;const target=[...this.cores].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];this.setAim(target.x,target.y);return target;}
 fire(){if(this.state!=='playing'||this.cooldown>0||this.shots.length>=32)return false;const spec=BUILDS[this.build],launch=this.launchGeometry(),bloom=this.phase()==='bloom',speed=650;
  const s={id:++this.id,x:launch.muzzle.x,y:launch.muzzle.y,originX:launch.muzzle.x,originY:launch.muzzle.y,vx:launch.direction.x*speed,vy:launch.direction.y*speed,r:7,kind:'pulse',element:spec.frame,recipe:this.build,branch:'spread',capstone:bloom,equipmentTier:1,life:2.2,bounces:0,trail:[],path:[]};this.shots.push(s);this.cooldown=bloom?.23:.34;this.shotsFired++;
  this.event('fire',s.x,s.y,1);Object.assign(this.events.at(-1),{weapon:'pulse',element:s.element,recipe:s.recipe,capstone:bloom,dx:launch.direction.x,dy:launch.direction.y,sourceId:'shot:'+s.id});return true;
 }
 weaponContact(s,target){if(!this.cores.includes(target))return;const spec=BUILDS[s.recipe];if(!spec)return;
  const length=Math.hypot(s.vx,s.vy)||1,limit=s.capstone?(this.rhythm==='calm'?4:5):3;
  const candidates=this.cores.filter(c=>c!==target).filter(c=>{const dx=c.x-target.x,dy=c.y-target.y;if(spec.frame==='arc')return Math.hypot(dx,dy)<(s.recipe==='singularity'?255:195);return (dx*s.vx+dy*s.vy)/length>0&&(dx*s.vx+dy*s.vy)/length<340&&Math.abs(dx*s.vy-dy*s.vx)/length<c.r+28;}).sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
  const targets=[target,...candidates.slice(0,limit-1)];for(const c of targets){if(!this.cores.includes(c))continue;if(c!==target){this.event(spec.frame==='arc'?'electrochain':'laserline',target.x,target.y,1,c.kind);Object.assign(this.events.at(-1),{toX:c.x,toY:c.y,recipe:s.recipe,color:spec.color,capstone:s.capstone});}this.cores=this.cores.filter(q=>q!==c);this.counts.resolved++;this.event('capture',c.x,c.y,1,c.kind);}
  if(s.recipe==='singularity')for(const c of this.cores){const d=Math.hypot(c.x-target.x,c.y-target.y);if(d>0&&d<330){c.vx=clamp((target.x-c.x)*.28,-85,85);c.vy=clamp((target.y-c.y)*.2,-35,35);}}
  if(s.recipe==='plasma'){this.event('netfield',target.x,target.y,95,'net');Object.assign(this.events.at(-1),{weapon:'net'});}
 }
 safeReturn(c){if(!this.cores.includes(c))return;this.cores=this.cores.filter(q=>q!==c);this.counts.returned++;this.event('safereturn',c.x,c.y,1,c.kind);}
 spawn(){const p=this.profile(),phase=this.phase(),target=phase==='arrival'?3:phase==='tidy'?3:p.target+(phase==='bloom'?2:0);if(['quiet'].includes(phase)||this.time-this.cycleStart>=100)return;
  const room=Math.min(p.cap,this.rhythm==='calm'?8:12,target)-this.cores.length;if(room<=0)return;let pattern=Math.floor(this.random()*3);if(pattern===this.lastPattern)pattern=(pattern+1)%3;this.lastPattern=pattern;const n=Math.min(room,phase==='arrival'?2:3),center=clamp(this.player.x+(this.random()-.5)*180,260,W-260),side=this.formation++%2?-1:1;
  for(let i=0;i<n;i++){const offset=(i-(n-1)/2)*70;this.addCore({tier:0,kind:['metal','dust','power','load'][(i+this.formation)%4],x:clamp(center+offset,40,W-40),y:95+(pattern===0?i*42:pattern===1?Math.abs(offset)*.4:70),vx:side*(48+pattern*15)*p.speed,vy:18*p.speed});const c=this.cores.at(-1);c.r=20;c.homeY=c.y;c.age=0;}
 }
 step(dt){this.time+=dt;this.counts.seconds+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.move(this.direction,dt,false,true);this.phaseName=this.phase();
  if(this.time>=this.nextSpawn){this.spawn();this.nextSpawn=this.time+this.profile().interval;}
  if(this.autoAim)this.assistAim();if(this.autoFire&&this.cores.length>0||this.manualFire)this.fire();
  for(const s of this.shots){s.life-=dt;s.trail.push({x:s.x,y:s.y});if(s.trail.length>7)s.trail.shift();this.advanceShot(s,dt);}this.shots=this.shots.filter(s=>s.life>0).slice(-32);
  for(const c of [...this.cores]){c.age+=dt;c.x+=c.vx*dt;c.y+=c.vy*dt+Math.sin(c.age*1.1+c.id)*4*dt;c.glow=Math.max(0,c.glow-dt);if(c.x<c.r||c.x>W-c.r){c.x=clamp(c.x,c.r,W-c.r);c.vx*=-1;}if(c.y>435){c.y=435;c.vy=-Math.abs(c.vy);}if(c.y<65){c.y=65;c.vy=Math.abs(c.vy);}if(c.age>28||Math.hypot(c.x-this.player.x,c.y-(this.player.y-25))<45)this.safeReturn(c);}
  const local=this.time-this.cycleStart;if(local>=120&&this.cores.length&&this.time-this.lastReturn>.4){this.safeReturn(this.cores[0]);this.lastReturn=this.time;}
  if(local>=120&&(!this.cores.length||local>=126)){for(const c of [...this.cores])this.safeReturn(c);this.cycle++;this.cycleStart=this.time;this.baseCounts={...this.counts};this.boundaries++;this.formation=0;this.lastPattern=-1;this.random=createRng((this.seed^Math.imul(this.cycle+1,7919))>>>0);this.nextSpawn=this.time+.7;this.event('restboundary');}
 }
 checkpoint(){return {seed:this.seed,cycle:this.cycle,counts:{...this.baseCounts}};}
 snapshot(){return {mode:'rest',state:this.state,build:this.build,rhythm:this.rhythm,actor:this.actor,cycle:this.cycle,phase:this.phase(),time:this.time,counts:{...this.counts},cores:this.cores.length,shots:this.shots.length,boundaries:this.boundaries};}
}
return {RestGame,BUILDS,PROFILES,ACTORS,DT};
});
