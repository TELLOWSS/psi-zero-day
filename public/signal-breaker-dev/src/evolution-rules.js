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
function restore(g,e){if(!e||!['arc','laser'].includes(e.frame)||e.recipe!==null&&(!RECIPES[e.recipe]||RECIPES[e.recipe].frame!==e.frame||g.pickupCount<EpisodeTwo.requiredParts(g)))return false;const branch=e.branch??null,capstone=e.capstone??false;if(branch!==null&&(!BRANCHES.includes(branch)||!e.recipe||g.wave<2||g.pickupCount<9)||typeof capstone!=='boolean'||capstone&&(!branch||g.wave<3||g.pickupCount<14))return false;g.evolution={frame:e.frame,recipe:e.recipe,branch,capstone};return true;}
function armor(g,spec){return g.veteran&&!spec.echo?Math.round((18+stage(g)*6)*(spec.tier+1)*(1+(g.wave-1)*.35)):0;}
function active(g){const e=g.evolution,spec=g.veteran&&e.recipe&&g.loadout.includes(RECIPES[e.recipe]?.support)?RECIPES[e.recipe]:null;return spec?{...spec,targets:Math.min(5,spec.targets+(e.branch==='spread'?1+(e.capstone?1:0):0))}:null;}
function selectFrame(g,frame){if(g.episode===3)return false;if(!g.veteran||g.state!=='ready'||!['arc','laser'].includes(frame))return false;g.evolution={frame,recipe:null,branch:null,capstone:false};return true;}
function evolve(g,recipe){
 const spec=RECIPES[recipe];if(!g.veteran||g.state!=='intermission'||g.pickupCount<EpisodeTwo.requiredParts(g)||!spec||g.evolution.recipe||g.config.gateStable&&!['mist','net'].includes(spec.support))return false;
 g.evolution={frame:spec.frame,recipe,branch:null,capstone:false};g.loadout=['pulse',spec.support];g.weapon='pulse';
 g.event('evolved',g.player.x,g.player.y,1,recipe);return true;
}
function damage(g,s,target){
 if(!g.veteran)return 1;
 if(s.kind!=='pulse'||!['arc','laser'].includes(s.element))return 1;
 const favorable=s.element==='arc'?['dust','power'].includes(target.kind):['metal','load'].includes(target.kind);
 const evolved=active(g);return (favorable?3:1)+(evolved?4:0)+(s.bounces>0?1:0)+(evolved&&favorable?(g.evolution.branch==='focus'?3+(g.evolution.capstone?3:0):g.evolution.capstone?1:0):0);
}
function hit(g,s,c){
 if(!g.veteran||c.echo||!c.armor)return false;
 c.armor=Math.max(0,c.armor-damage(g,s,c)*g.growthDamage(s,true));c.glow=.18;
 g.event('armorhit',c.x,c.y,c.armor,c.kind);
 return c.armor>0;
}
function contact(g,s,c){
 if(!g.veteran||s.kind!=='pulse'||c.echo)return false;
 const spec=active(g),targets=[c];
 if(spec){
  const dx=s.vx,dy=s.vy,len=Math.hypot(dx,dy)||1;
  const candidates=g.cores.filter(q=>q.id!==c.id&&!q.echo).filter(q=>{
   if(g.evolution.frame==='arc')return Math.hypot(q.x-c.x,q.y-c.y)<((g.evolution.recipe==='singularity'?210:155)+(g.evolution.branch==='spread'?35:0));
   const x=q.x-c.x,y=q.y-c.y,along=(x*dx+y*dy)/len,side=Math.abs(x*dy-y*dx)/len;
   return along>0&&along<260+(g.evolution.branch==='spread'?60:0)&&side<q.r+14;
  }).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y));
  targets.push(...candidates.slice(0,spec.targets-1));
 }
 for(const q of targets){if(!g.cores.includes(q))continue;
  if(!hit(g,s,q))g.pulse(q,{...s,bounces:q===c?s.bounces:0});
  if(q!==c){g.event(g.evolution.frame==='arc'?'electrochain':'laserline',c.x,c.y,1,q.kind);Object.assign(g.events.at(-1),{toX:q.x,toY:q.y,color:spec.color});}
 }
 return true;
}
function limit(g){return 135-stage(g)*5-(g.wave-1)*10;}
function step(g){if(g.veteran&&g.state==='playing'&&g.pressureWarningWave!==g.wave&&limit(g)-(g.time-g.waveStart.time)<=8){g.pressureWarningWave=g.wave;g.event('pressuretimewarning',g.player.x,g.player.y,Math.max(0,Math.ceil(limit(g)-(g.time-g.waveStart.time))));}if(g.veteran&&g.state==='playing'&&g.time-g.waveStart.time>limit(g)){g.event('pressuretimeout',g.player.x,g.player.y);g.failureReason='pressure';g.finish(false);}}
return {preferredFrame,recommendation,RECIPES,BRANCHES,canAdvance,advance,restore,reset,armor,active,selectFrame,evolve,damage,hit,contact,limit,step};
});
