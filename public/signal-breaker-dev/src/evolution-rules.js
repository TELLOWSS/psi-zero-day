/* Pure veteran combat rules. Hazard signals, never people, are the targets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.SignalBreakerEvolution=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EpisodeTwo=typeof module==='object'&&module.exports?require('./episode-two.js'):globalThis.SignalBreakerEpisodeTwo;
const RECIPES=Object.freeze({
 storm:{frame:'arc',support:'mist',targets:3,color:'#93e9ff'},
 singularity:{frame:'arc',support:'magnet',targets:3,color:'#73ffdd'},
 prism:{frame:'laser',support:'scan',targets:3,color:'#f2a9ff'},
 plasma:{frame:'laser',support:'net',targets:2,color:'#ffc2a0'}
});
const stage=g=>Number(g.config.id.slice(-2));
const BRANCHES=Object.freeze(['spread','focus']);
function preferredFrame(id){return id==='CH-03'?'arc':'laser';}
function recommendation(g){if(!g.veteran||g.state!=='intermission')return null;if(!g.evolution.recipe){if(g.pickupCount<EpisodeTwo.requiredParts(g))return null;return g.evolution.frame==='arc'?'storm':g.config.gateStable?'plasma':'prism';}if(canAdvance(g,'spread'))return 'spread';if(canAdvance(g,'capstone'))return 'capstone';return null;}
function reset(g){g.pressureWarningWave=0;g.evolution={frame:'arc',recipe:null,branch:null,capstone:false};}
function canAdvance(g,id){const e=g.evolution;if(!g.veteran||g.state!=='intermission'||!e.recipe)return false;return BRANCHES.includes(id)?!e.branch&&g.wave>=2&&g.pickupCount>=9:id==='capstone'&&!!e.branch&&!e.capstone&&g.wave>=3&&g.pickupCount>=14;}
function advance(g,id){if(!canAdvance(g,id))return false;if(id==='capstone')g.evolution.capstone=true;else g.evolution.branch=id;g.event('evolved',g.player.x,g.player.y,1,id);return true;}
function restore(g,e){if(!e||!['arc','laser'].includes(e.frame)||e.recipe!==null&&(!RECIPES[e.recipe]||RECIPES[e.recipe].frame!==e.frame||g.pickupCount<EpisodeTwo.requiredParts(g)||g.config.gateStable&&!['mist','net'].includes(RECIPES[e.recipe].support)))return false;const branch=e.branch??null,capstone=e.capstone??false;if(branch!==null&&(!BRANCHES.includes(branch)||!e.recipe||g.wave<2||g.pickupCount<9)||typeof capstone!=='boolean'||capstone&&(!branch||g.wave<3||g.pickupCount<14))return false;g.evolution={frame:e.frame,recipe:e.recipe,branch,capstone};return true;}
function armor(g,spec){if(g.encounterVersion>=2&&spec.reinforcement&&spec.tier===0&&(!spec.role||spec.role==='runner'))return 0;return g.veteran&&!spec.echo?Math.round((18+stage(g)*6)*(spec.tier+1)*(1+(g.wave-1)*.35)):0;}
function identity(e){const wide=e.branch==='spread',focus=e.branch==='focus',final=!!e.capstone,base=RECIPES[e.recipe];if(!base)return null;
 const variants={storm:{targets:wide?(final?8:6):focus?(final?4:3):3,reach:focus?(final?340:260):190},singularity:{targets:wide?(final?6:4):3,reach:wide?300:240,radius:wide?(final?340:285):focus?240:220,strength:focus?(final?850:650):420,duration:final?2.4:1.2},prism:{targets:wide?(final?7:5):focus?(final?6:4):3,reach:focus?(final?800:600):480,width:wide?50:24,fan:wide?(final?.22:.13):0},plasma:{targets:wide?(final?8:5):focus?(final?5:3):3,radius:wide?(final?230:160):focus?(final?150:110):120,duration:final?2.4:1.2}};
 return {...base,...variants[e.recipe]};
}
function active(g){const e=g.evolution;return g.veteran&&e.recipe&&g.loadout.includes(RECIPES[e.recipe]?.support)?identity(e):null;}
// Real projectiles own their launch build. Plain legacy diagnostic shots retain the old API.
function shotBuild(g,s){const snapshot=Object.hasOwn(s,'recipe');const e=snapshot?{frame:s.element,recipe:s.recipe,branch:s.branch,capstone:!!s.capstone}:g.evolution;
 const base=snapshot?identity(e):active(g);const spec=base&&base.frame===e.frame?base:null;return {e,spec};}
function fire(g,s){const {spec}=shotBuild(g,s);if(!spec||s.kind!=='pulse'||!spec.fan)return;g.cooldown*=1.45;const a=Math.atan2(s.vy,s.vx),speed=Math.hypot(s.vx,s.vy);for(const sign of [-1,1])if(g.shots.length<32)g.shots.push({...s,id:++g.id,vx:Math.cos(a+sign*spec.fan)*speed,vy:Math.sin(a+sign*spec.fan)*speed,trail:[],path:[],evolutionWing:true});}
function progress(g){const e=g.evolution,next=!e.recipe?'recipe':!e.branch?'branch':!e.capstone?'capstone':null,parts=next==='recipe'?EpisodeTwo.requiredParts(g):next==='branch'?9:next==='capstone'?14:0,wave=next==='branch'?2:next==='capstone'?3:1;return {next,parts,wave,collected:g.pickupCount,eligible:!!next&&g.pickupCount>=parts&&g.wave>=wave,active:!!active(g),support:RECIPES[e.recipe]?.support||null};}
function selectFrame(g,frame){if(g.episode===3)return false;if(!g.veteran||g.state!=='ready'||!['arc','laser'].includes(frame))return false;g.evolution={frame,recipe:null,branch:null,capstone:false};return true;}
function canEvolve(g,recipe){const spec=RECIPES[recipe];return !!(g.veteran&&g.state==='intermission'&&g.pickupCount>=EpisodeTwo.requiredParts(g)&&spec&&!g.evolution.recipe&&(!g.config.gateStable||['mist','net'].includes(spec.support)));}
function evolve(g,recipe){
 const spec=RECIPES[recipe];if(!canEvolve(g,recipe))return false;
 g.evolution={frame:spec.frame,recipe,branch:null,capstone:false};g.loadout=['pulse',spec.support];g.weapon='pulse';
 g.event('evolved',g.player.x,g.player.y,1,recipe);return true;
}
function damage(g,s,target){
 if(!g.veteran)return 1;
 if(s.kind!=='pulse'||!['arc','laser'].includes(s.element))return 1;
 const favorable=s.element==='arc'?['dust','power'].includes(target.kind):['metal','load'].includes(target.kind);
 const {e,spec:evolved}=shotBuild(g,s);return (favorable?3:1)+(evolved?4:0)+(s.bounces>0?1:0)+(evolved&&favorable?(e.branch==='focus'?3+(e.capstone?3:0):e.capstone?1:0):0);
}
function hit(g,s,c){
 if(!g.veteran||c.echo||!c.armor)return false;
 const before=c.armor;c.armor=Math.max(0,c.armor-damage(g,s,c)*g.growthDamage(s,true));c.glow=.18;
 g.event('armorhit',c.x,c.y,c.armor,c.kind);
 if(before>0&&c.armor===0){g.event('armorbreak',c.x,c.y,c.r,c.kind);Object.assign(g.events.at(-1),{element:s.element,recipe:s.recipe,weapon:s.kind});}
 return c.armor>0;
}
function contact(g,s,c){
 if(!g.veteran||s.kind!=='pulse'||c.echo)return false;
 const {e,spec}=shotBuild(g,s),targets=[c];
 if(spec){
  const dx=s.vx,dy=s.vy,len=Math.hypot(dx,dy)||1;
  const candidates=g.cores.filter(q=>q.id!==c.id&&!q.echo).filter(q=>{
   if(e.recipe==='plasma')return Math.hypot(q.x-c.x,q.y-c.y)<=spec.radius;
   if(e.frame==='arc')return Math.hypot(q.x-c.x,q.y-c.y)<spec.reach;
   const x=q.x-c.x,y=q.y-c.y,along=(x*dx+y*dy)/len,side=Math.abs(x*dy-y*dx)/len;
   return along>0&&along<spec.reach&&side<q.r+spec.width;
  }).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));
  if(e.recipe==='storm'){let origin=c;const pool=g.cores.filter(q=>q!==c&&!q.echo);while(targets.length<spec.targets){const next=pool.filter(q=>!targets.includes(q)&&Math.hypot(q.x-origin.x,q.y-origin.y)<spec.reach).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];if(!next)break;targets.push(next);origin=next;}}
  else targets.push(...candidates.slice(0,spec.targets-1));
  if(['singularity','plasma'].includes(e.recipe)){const field={kind:e.recipe==='singularity'?'magnet':'net',x:c.x,y:c.y,radius:spec.radius,until:g.time+spec.duration,polarity:1,tier:e.capstone?4:3,allMaterials:true,pullStrength:spec.strength||350,evolutionRecipe:e.recipe};g.fields=g.fields.filter(f=>f.evolutionRecipe!==e.recipe);g.fields.push(field);g.fields=g.fields.slice(-3);g.event('evolutionfield',c.x,c.y,spec.radius,c.kind);Object.assign(g.events.at(-1),{recipe:e.recipe,capstone:e.capstone,duration:spec.duration});}
 }
 for(const q of targets){if(!g.cores.includes(q))continue;
  if(!hit(g,s,q))g.pulse(q,{...s,bounces:q===c?s.bounces:0});
  if(q!==c){const origin=e.recipe==='storm'?targets[targets.indexOf(q)-1]:c;g.event(e.frame==='arc'?'electrochain':'laserline',origin.x,origin.y,1,q.kind);Object.assign(g.events.at(-1),{toX:q.x,toY:q.y,color:spec.color,recipe:e.recipe,branch:e.branch,capstone:e.capstone});}
 }
 return true;
}
function limit(g){return 135-stage(g)*5-(g.wave-1)*10;}
function step(g){if(g.veteran&&g.state==='playing'&&g.pressureWarningWave!==g.wave&&limit(g)-(g.time-g.waveStart.time)<=8){g.pressureWarningWave=g.wave;g.event('pressuretimewarning',g.player.x,g.player.y,Math.max(0,Math.ceil(limit(g)-(g.time-g.waveStart.time))));}if(g.veteran&&g.state==='playing'&&g.time-g.waveStart.time>limit(g)){g.event('pressuretimeout',g.player.x,g.player.y);g.failureReason='pressure';g.finish(false);}}
return {preferredFrame,recommendation,RECIPES,BRANCHES,canEvolve,canAdvance,advance,restore,reset,armor,active,identity,fire,shotBuild,progress,selectFrame,evolve,damage,hit,contact,limit,step};
});
