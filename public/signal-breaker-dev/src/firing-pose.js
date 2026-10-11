/* SIGNAL BREAKER: keep the visible weapon and muzzle synchronized with the last actual shot.
   Presentation-only: game aim, collisions, cooldowns and saved controls remain authoritative. */
(function(root){'use strict';
const HOLD_SECONDS=.115;
class FiringPose {
 constructor(){this.reset();}
 reset(){this.last=null;}
 register(event){
  if(!event||event.kind!=='fire'||!Number.isFinite(event.t)||!Number.isFinite(event.dx)||!Number.isFinite(event.dy))return false;
  const length=Math.hypot(event.dx,event.dy);if(length<.001)return false;
  this.last={at:event.t,x:event.dx/length,y:event.dy/length,weapon:event.weapon||null,sourceId:event.sourceId||null};
  return true;
 }
 sample(game){
  const original=game.launchGeometry(),last=this.last,age=last?game.time-last.at:Infinity;
  const active=game.state==='playing'&&last&&age>=0&&age<=HOLD_SECONDS;
  const direction=active?{x:last.x,y:last.y}:original.direction;
  const selected=active&&last.weapon&&root.SignalBreakerChapter?.WEAPONS[last.weapon]?last.weapon:game.weapon;
  const spec=root.SignalBreakerChapter?.WEAPONS[selected];
  const launch={...original,direction,muzzle:{x:original.grip.x+direction.x*22,y:original.grip.y+direction.y*22},
   ...(spec?{cell:spec.cell,color:spec.color}:{})};
  return {launch,weapon:selected,active:!!active,age:active?age:Infinity,sourceId:active?last.sourceId:null};
 }
}
root.SignalBreakerFiringPose={FiringPose,HOLD_SECONDS};
if(typeof module==='object'&&module.exports)module.exports=root.SignalBreakerFiringPose;
})(typeof window!=='undefined'?window:globalThis);
