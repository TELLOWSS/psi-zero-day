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
function reset(g){g.evolution={frame:'arc',recipe:null};}
function armor(g,spec){return g.veteran&&!spec.echo?Math.round((18+stage(g)*6)*(spec.tier+1)*(1+(g.wave-1)*.35)):0;}
function active(g){return g.veteran&&g.evolution.recipe&&g.loadout.includes(RECIPES[g.evolution.recipe]?.support)?RECIPES[g.evolution.recipe]:null;}
function selectFrame(g,frame){if(!g.veteran||g.state!=='ready'||!['arc','laser'].includes(frame))return false;g.evolution={frame,recipe:null};return true;}
function evolve(g,recipe){
 const spec=RECIPES[recipe];if(!g.veteran||g.state!=='intermission'||g.pickupCount<EpisodeTwo.requiredParts(g)||!spec||g.evolution.recipe||g.config.gateStable&&!['mist','net'].includes(spec.support))return false;
 g.evolution={frame:spec.frame,recipe};g.loadout=['pulse',spec.support];g.weapon='pulse';
 g.event('evolved',g.player.x,g.player.y,1,recipe);return true;
}
function damage(g,s,target){
 if(!g.veteran)return 1;
 if(s.kind!=='pulse'||!['arc','laser'].includes(s.element))return 1;
 const favorable=s.element==='arc'?['dust','power'].includes(target.kind):['metal','load'].includes(target.kind);
 return (favorable?3:1)+(active(g)?4:0)+(s.bounces>0?1:0);
}
function hit(g,s,c){
 if(!g.veteran||c.echo||!c.armor)return false;
 c.armor=Math.max(0,c.armor-damage(g,s,c));c.glow=.18;
 g.event('armorhit',c.x,c.y,c.armor,c.kind);
 return c.armor>0;
}
function contact(g,s,c){
 if(!g.veteran||s.kind!=='pulse'||c.echo)return false;
 const spec=active(g),targets=[c];
 if(spec){
  const dx=s.vx,dy=s.vy,len=Math.hypot(dx,dy)||1;
  const candidates=g.cores.filter(q=>q.id!==c.id&&!q.echo).filter(q=>{
   if(g.evolution.frame==='arc')return Math.hypot(q.x-c.x,q.y-c.y)<(g.evolution.recipe==='singularity'?210:155);
   const x=q.x-c.x,y=q.y-c.y,along=(x*dx+y*dy)/len,side=Math.abs(x*dy-y*dx)/len;
   return along>0&&along<260&&side<q.r+14;
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
function step(g){if(g.veteran&&g.state==='playing'&&g.time-g.waveStart.time>limit(g)){g.event('pressuretimeout',g.player.x,g.player.y);g.failureReason='pressure';g.finish(false);}}
return {RECIPES,reset,armor,active,selectFrame,evolve,damage,hit,contact,limit,step};
});
