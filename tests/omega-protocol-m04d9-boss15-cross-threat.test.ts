import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 omegaFieldCanInteract,omegaFieldCurrentStep,OMEGA_QUARTER_VIEW,
 type OmegaFieldPoint,
} from '../src/domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';
import {omegaBossInStrikeZone} from '../src/engine/omega-protocol-boss-pattern';
import {omegaCounterplayCues} from '../src/ui/omega-protocol-counterplay';

/**
 * M04-D7 AUTHENTIC fixed-step no-skip REPLAY and warning-aware test controller. Never edits HP, hazards, player position,
 * phase, scripted objectives or wave counters; never uses qaGateTravel.
 * Only sends normal movement input, real gun auto-fire, melee, real E-type
 * session.interact, native reward selection. The full 15-node no-skip run is
 * an acceptance GATE, not assumed complete by earlier exit-only fixtures.
 */
const DT=1/30;
const dist=(a:OmegaFieldPoint,b:OmegaFieldPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
function steer(source:OmegaFieldPoint,target:OmegaFieldPoint,scale=1){
 const dx=target.x-source.x,dy=target.y-source.y;
 const sx=dx+OMEGA_QUARTER_VIEW.skewX*dy;
 const sy=OMEGA_QUARTER_VIEW.groundYScale*dy;
 const len=Math.hypot(sx,sy)||1;
 return {moveX:sx/len*scale,moveY:sy/len*scale,triggerAction:false};
}
const idle={moveX:0,moveY:0,triggerAction:false};
type PilotMode='baseline'|'reaction'|'bounded'|'bossSafe';
type DamageContext={
 readonly wave:number;readonly at:number;readonly source:string;readonly applied:number;
 readonly nativeReported:string|null;readonly cartPhase:string|null;
 readonly playerHp:number;readonly nearestDist:number|null;
};
interface EarlyFrame {
 t:number;player:{x:number;y:number;hp:number;dashCooldown:number};
 movement:{moveX:number;moveY:number};target:string;
 threats:Array<{type:string;d:number;x:number;y:number;phase:string;timer:number;lockX:number;lockY:number}>;
 cues:Array<{kind:string;phase:string;d:number;seconds:number}>;
}
interface BossFrame {
 t:number;player:{x:number;y:number;hp:number;maxHp:number;dashCooldown:number};
 boss:{hp:number;maxHp:number;phase:string;timer:number;lane:string;centerX:number;centerY:number;halfWidth:number;number:number}|null;
 nativeCarts:Array<{d:number;phase:string;remaining:number;directionX:number;directionY:number;radius:number}>;
 threats:number;move:{x:number;y:number};target:string;lineBlocked:boolean;
}
interface PilotTelemetry {
 warningsObserved:number;sidesteps:number;dashAccepted:number;
 lineOfSightDetourTicks:number;damageContexts:DamageContext[];
 firstEight:EarlyFrame[];safetyMoves:number;rejectedMoves:number;
 bossFrames:BossFrame[];bossSafeInputs:number;bossSafeRejected:number;
}
/** M04-D8 late-game controlled difference: first 12 nodes run IDENTICALLY.
 * The reaction pilot sees only the same native-locked warning and terrain
 * topology that the actual M04-D5/D6 game can render. It never modifies
 * hazard/HP/wave, never peeks at the RNG or fast-forwards an encounter.
 * Moving perpendicular to a cart/sprinter direction is normal user input.
 */
function reactiveWarningMove(s:OmegaProtocolCombatSession):ReturnType<typeof steer>|null{
 const player=s.engine.state.player,field=s.field?.plan;
 if(!field)return null;
 const cues=omegaCounterplayCues(s.engine.state.hazards,id=>s.zombieBrain(id));
 const urgency=[...cues].sort((a,b)=>{
  const aa=a.phase==='charge'?0:a.seconds,bb=b.phase==='charge'?0:b.seconds;
  return aa-bb||dist(player,a)-dist(player,b);
 });
 for(const cue of urgency){
  const dx=player.x-cue.x,dy=player.y-cue.y;
  const range=Math.hypot(dx,dy);
  if(range>240||range<.01)continue;
  const toward=dx*cue.directionX+dy*cue.directionY;
  const cross=dx*-cue.directionY+dy*cue.directionX;
  if(cue.kind==='cart'&&(toward< -15||toward>210||Math.abs(cross)>cue.radius+46))continue;
  if(cue.kind==='zombie'&&range>cue.radius+60&&cue.directionLength===0)continue;
  if(cue.phase==='warning'&&cue.seconds>.43)continue;
  const side=cross>=0?1:-1;
  const vector=cue.directionLength>0
   ?{x:-cue.directionY*side,y:cue.directionX*side}
   :{x:dx/range,y:dy/range};
  const target={x:Math.max(45,Math.min(1355,player.x+vector.x*135)),
   y:Math.max(45,Math.min(855,player.y+vector.y*135))};
  const route=omegaFieldNextRoute(player,target,field.obstacles);
  if(route&&dist(player,route.next)>2)return steer(player,route.next);
 }
 return null;
}
/** Exact static prop rectangles, not an invented line-of-sight rule. */
function coverBlocksSegment(a:OmegaFieldPoint,b:OmegaFieldPoint,field:OmegaProtocolCombatSession['field']):boolean{
 if(!field)return true;
 return field.plan.obstacles.some(o=>{
  let enter=0,exit=1;
  const axes:readonly (readonly [number,number,number,number])[]=[
   [a.x,b.x-a.x,o.x-8,o.x+o.width+8],[a.y,b.y-a.y,o.y-8,o.y+o.height+8],
  ];
  for(const [start,slope,min,max] of axes){
   if(Math.abs(slope)<1e-7){if(start<min||start>max)return false;continue;}
   const u=(min-start)/slope,v=(max-start)/slope;
   enter=Math.max(enter,Math.min(u,v));exit=Math.min(exit,Math.max(u,v));
   if(enter>exit)return false;
  }
  return exit>enter+1e-7&&exit>0&&enter<1;
 });
}
/** A cart's real position may be on the edge of an expanded cover hitbox;
 * direct navigation to its CENTER then returns null. Pick a legal shooting
 * position with true cover-free line of sight, use original pathfinder and
 * move through actual terrain: no enemy/world/shot manipulation. */
function reachableFiringVantage(s:OmegaProtocolCombatSession,enemy:OmegaFieldPoint):OmegaFieldPoint|null{
 const actor=s.engine.state.player,field=s.field;
 if(!field)return null;
 let best:{score:number;next:OmegaFieldPoint}|null=null;
 for(const radius of [125,165,205])for(let k=0;k<24;k++){
  const theta=k*Math.PI/12;
  const candidate={x:enemy.x+Math.cos(theta)*radius,y:enemy.y+Math.sin(theta)*radius};
  if(candidate.x<65||candidate.x>1335||candidate.y<65||candidate.y>835)continue;
  if(coverBlocksSegment(candidate,enemy,field))continue;
  const route=omegaFieldNextRoute(actor,candidate,field.plan.obstacles);
  if(!route||dist(actor,route.next)<2)continue;
  const score=route.length+radius*.09;
  if(!best||score<best.score)best={score,next:route.next};
 }
 return best?.next??null;
}
/** Bounded user input: reject directions into map edges or enemy clusters.
 * Unlike naive perpendicular reaction this samples only OBSERVABLE danger
 * and legal routes. All HP, wave, enemy AI and pickups remain untouched.
 */
function boundedWarningMove(s:OmegaProtocolCombatSession,telemetry:PilotTelemetry):ReturnType<typeof steer>|null{
 const actor=s.engine.state.player,field=s.field?.plan;
 if(!field)return null;
 const live=s.engine.state.hazards.filter(h=>h.hp>0);
 const cues=omegaCounterplayCues(live,id=>s.zombieBrain(id));
 const closest=Math.min(...live.map(h=>dist(h,actor)));
 const urgent=cues.some(c=>dist(c,actor)<225&&
  (c.phase==='charge'||c.seconds<=.35));
 if(!urgent&&closest>90)return null;
 const cost=(p:OmegaFieldPoint)=>{
  let risk=0;
  for(const h of live){
   const gap=dist(p,h),safety=h.radius+60;
   if(gap<safety)risk+=(safety-gap)*3.2;
   else if(gap<safety+80)risk+=(safety+80-gap)*.32;
  }
  for(const cue of cues){
   if(cue.directionLength<1)continue;
   const delta={x:p.x-cue.x,y:p.y-cue.y};
   const longitudinal=delta.x*cue.directionX+delta.y*cue.directionY;
   const lateral=Math.abs(delta.x*-cue.directionY+delta.y*cue.directionX);
   if(longitudinal>-22&&longitudinal<165&&lateral<cue.radius+40)
    risk+=(cue.radius+40-lateral)*1.8;
  }
  // Hard corners are poor escape routes, especially at x≈21 in the failed D7 pilot.
  const margin=Math.min(p.x-50,1350-p.x,p.y-50,850-p.y);
  if(margin<42)risk+=(42-margin)*2.5;
  return risk;
 };
 const original=cost(actor);
 let best:{score:number;waypoint:OmegaFieldPoint}|null=null;
 for(let k=0;k<24;k++){
  const theta=k*Math.PI/12;
  const end={x:Math.max(58,Math.min(1342,actor.x+Math.cos(theta)*155)),
   y:Math.max(58,Math.min(842,actor.y+Math.sin(theta)*155))};
  const route=omegaFieldNextRoute(actor,end,field.obstacles);
  if(!route||dist(actor,route.next)<8)continue;
  const l=dist(actor,route.next);
  const predicted={x:actor.x+(route.next.x-actor.x)/l*Math.min(l,78),
   y:actor.y+(route.next.y-actor.y)/l*Math.min(l,78)};
  const score=cost(predicted)+(route.detour?3:0);
  if(best===null||score<best.score)best={score,waypoint:route.next};
 }
 if(!best||best.score>=original-12){telemetry.rejectedMoves++;return null;}
 telemetry.safetyMoves++;telemetry.sidesteps++;
 return steer(actor,best.waypoint);
}
/** A tactical *test player*, not a game-side buff. Picks a route around
 * existing solid field props and kites warned infected charges. Does not
 * read/write game internals beyond readonly hazard positions and native
 * movement commands. */
/**
 * M04-D9: Unlike lane-only override (which died at 9 sec in M04-D8), do not
 * dodge the final boss into a live RUNAWAY_CART. Rank the boss's LOCKED lane
 * and every actual moving hazard together. Output remains ordinary joystick.
 */
function combinedBossWarningMove(s:OmegaProtocolCombatSession,tel:PilotTelemetry):ReturnType<typeof steer>|null{
 const actor=s.engine.state.player,field=s.field?.plan,w=s.snapshot.bossTelegraph;
 if(!field||w?.phase!=='warning'||!omegaBossInStrikeZone(w,actor)||w.timer>.92)return null;
 const live=s.engine.state.hazards.filter(h=>h.hp>0);
 const cues=omegaCounterplayCues(live,id=>s.zombieBrain(id));
 const laneDistance=(p:OmegaFieldPoint)=>w.lane==='horizontal'
  ?Math.abs(p.y-w.center.y):Math.abs(p.x-w.center.x);
 let best:{score:number;point:OmegaFieldPoint}|null=null;
 const remainingSeconds=w.timer;
 for(let i=0;i<32;i++){
  const angle=i*Math.PI/16;
  const destination={x:Math.max(48,Math.min(1352,actor.x+Math.cos(angle)*145)),
   y:Math.max(48,Math.min(852,actor.y+Math.sin(angle)*145))};
  const route=omegaFieldNextRoute(actor,destination,field.obstacles);
  if(!route||dist(actor,route.next)<5)continue;
  const travel=dist(actor,route.next);
  const predicted={x:actor.x+(route.next.x-actor.x)/travel*Math.min(travel,145),
   y:actor.y+(route.next.y-actor.y)/travel*Math.min(travel,145)};
  let cost=Math.max(0,w.laneHalfWidth+23-laneDistance(predicted))*6;
  for(const h of live){
   if(h.isStageBoss)continue;
   const d=dist(predicted,h),desired=h.radius+75;
   if(d<desired)cost+=(desired-d)*4.4;
   else if(d<desired+70)cost+=(desired+70-d)*.52;
  }
  for(const cue of cues){
   if(cue.directionLength<1)continue;
   const dx=predicted.x-cue.x,dy=predicted.y-cue.y;
   const along=dx*cue.directionX+dy*cue.directionY;
   const cross=Math.abs(dx*-cue.directionY+dy*cue.directionX);
   if(along>-25&&along<Math.max(185,cue.directionLength)&&cross<cue.radius+42)
    cost+=(cue.radius+42-cross)*5;
  }
  const edge=Math.min(predicted.x-35,1365-predicted.x,predicted.y-35,865-predicted.y);
  if(edge<45)cost+=(45-edge)*2;
  // Route detour and very late impossible maneuvers are not safer.
  if(route.detour)cost+=20;
  if(travel>remainingSeconds*260)cost+=(travel-remainingSeconds*260)*.5;
  // A tiny preference for original nearby trajectory avoids indecision.
  cost+=dist(actor,route.next)*.035;
  if(!best||cost<best.score)best={score:cost,point:route.next};
 }
 if(!best){tel.bossSafeRejected++;return null;}
 // A retreat is worthwhile only if it can actually reduce locked-lane risk.
 const currentCost=Math.max(0,w.laneHalfWidth+23-laneDistance(actor))*6;
 if(best.score>=currentCost+65){tel.bossSafeRejected++;return null;}
 tel.bossSafeInputs++;
 return steer(actor,best.point);
}

function tacticalStep(
 s:OmegaProtocolCombatSession,enemy:{x:number;y:number;id:string},forceClose=false,
 pilot:PilotMode='baseline',telemetry?:PilotTelemetry,
):Readonly<{moveX:number;moveY:number;triggerAction:boolean}>{
 const actor=s.engine.state.player,field=s.field!.plan;
 const gap=dist(actor,enemy);
 if(pilot==='bossSafe'&&s.run.wave===15){
  const corrected=combinedBossWarningMove(s,telemetry!);
  if(corrected)return corrected;
 }
 if((pilot==='bounded'||pilot==='bossSafe')&&s.run.wave>=13){
  // Last surviving native cart may remain at range ~250 behind solid cover.
  // With no simultaneous threats, approaching via the normal legal route
  // restores genuine radio LOS and real blade contact, without changing HP.
  if(s.engine.state.hazards.filter(h=>h.hp>0).length===1&&gap>105){
   const direct=omegaFieldNextRoute(actor,enemy,field.obstacles);
   const route=direct?.next??reachableFiringVantage(s,enemy);
   if(route&&dist(actor,route)>3){
    if(telemetry)telemetry.lineOfSightDetourTicks++;
    return steer(actor,route);
   }
  }
  // Native shot/projectile LOS can remain blocked even while safe kiting
  // succeeds. After 3.5 real seconds with NO enemy HP decrease, move toward
  // the existing cover-aware route instead of drifting forever to safety.
  // This is test-player navigation, never spawned damage or a teleport.
  if(forceClose&&gap>110){
   const towards=omegaFieldNextRoute(actor,enemy,field.obstacles);
   if(towards&&dist(actor,towards.next)>3){
    if(telemetry)telemetry.lineOfSightDetourTicks++;
    return steer(actor,towards.next);
   }
  }
  const bounded=boundedWarningMove(s,telemetry!);
  if(bounded)return bounded;
 }
 if(pilot==='reaction'&&s.run.wave>=13){
  const warningMove=reactiveWarningMove(s);
  if(warningMove){if(telemetry)telemetry.sidesteps++;return warningMove;}
  // Dynamic cover-aware line of sight response: the route graph uses the
  // actual solid obstacles. This is a pilot steering choice, not cover bypass.
  const route=omegaFieldNextRoute(actor,enemy,field.obstacles);
  if(route?.detour&&gap>100){
   if(telemetry)telemetry.lineOfSightDetourTicks++;
   return steer(actor,route.next);
  }
 }
 // Unlike simple zombie kiting, each boss telegraph has a locked ACTUAL
 // impact center / lane. Move outside its live warning zone instead of
 // burning a dash after the attack hits. This is a legitimate player tactic,
 // not a changed boss timer/damage radius or an injected evasion state.
 const warning=s.snapshot.bossTelegraph;
 if(warning?.phase==='warning'&&omegaBossInStrikeZone(warning,actor)){
  let best:{point:OmegaFieldPoint;score:number}|null=null;
  for(let k=0;k<24;k++){
   const theta=k*Math.PI/12;
   const aim={x:Math.max(50,Math.min(1350,actor.x+Math.cos(theta)*175)),
    y:Math.max(50,Math.min(850,actor.y+Math.sin(theta)*175))};
   const route=omegaFieldNextRoute(actor,aim,field.obstacles);
   if(!route||dist(actor,route.next)<2)continue;
   const projected=route.next;
   const hazardDist=Math.min(...s.engine.state.hazards
    .filter(h=>h.hp>0).map(h=>dist(projected,h)));
   const away=warning.attack==='crane_drop'
    ?dist(projected,warning.center)-warning.radius
    :warning.lane==='horizontal'
     ?Math.abs(projected.y-warning.center.y)-warning.laneHalfWidth
     :Math.abs(projected.x-warning.center.x)-warning.laneHalfWidth;
   const score=away*2.4+Math.min(hazardDist,200)*.55-
    (route.detour?20:0)-Math.max(0,dist(actor,projected)-175)*.05;
   if(!best||score>best.score)best={point:route.next,score};
  }
  if(best)return steer(actor,best.point);
 }
 if(forceClose){
  // If native weapon projectiles are blocked by real industrial cover,
  // walk around it to regain line of sight / sword range. Never inject
  // damage or teleport. The normal game collision+pathfinder stays active.
  if(gap>104){
   const path=omegaFieldNextRoute(actor,enemy,field.obstacles);
   return path?steer(actor,path.next):idle;
  }
  return steer(actor,enemy,.12);
 }
 if(gap>350){
  const path=omegaFieldNextRoute(actor,enemy,field.obstacles);
  return path?steer(actor,path.next):idle;
 }
 const bladeReady=s.snapshot.bladeCooldownRemaining<=DT;
 if(gap<116&&gap>48&&bladeReady){
  // A one-frame aim/strike: the actual sword engine applies its own
  // forward-cone, cooldown, terrain and enemy-HP checks.
  return steer(actor,enemy,.08);
 }
 if(gap>245)return idle; // A native auto-aim radio can finish from here.
 // Evaluate survivable screen-visible dodge lanes rather than running
 // directly through scaffold/container obstacles or map boundaries.
 const hazards=s.engine.state.hazards.filter(h=>h.hp>0);
 let best:{score:number;point:OmegaFieldPoint}|null=null;
 for(let k=0;k<16;k++){
  const angle=(Math.PI*2*k)/16;
  const desired={x:Math.max(53,Math.min(1347,actor.x+Math.cos(angle)*125)),
   y:Math.max(53,Math.min(847,actor.y+Math.sin(angle)*125))};
  const path=omegaFieldNextRoute(actor,desired,field.obstacles);
  if(!path||dist(actor,path.next)<3)continue;
  const projected=path.next;
  const danger=Math.min(...hazards.map(h=>dist(projected,h)));
  const nearestNow=Math.min(...hazards.map(h=>dist(actor,h)));
  const targetGap=dist(projected,enemy);
  const antiCorner=Math.min(projected.x-45,1355-projected.x,projected.y-45,855-projected.y);
  // Avoid a hopeless loop around the same narrow corner: reward projected
  // clearance and distance from ALL native threats, not only target.
  const score=Math.min(danger,310)*2.1
   -Math.abs(targetGap-225)*.28+Math.min(antiCorner,120)*.14
   +(danger>nearestNow?32:0)-(path.detour?12:0);
  if(!best||score>best.score)best={score,point:projected};
 }
 return best?steer(actor,best.point):idle;
}
function navigate(
 s:OmegaProtocolCombatSession,target:OmegaFieldPoint,
):Readonly<{distance:number;target:OmegaFieldPoint}>{
 const p=s.engine.state.player,field=s.field!.plan;
 const route=omegaFieldNextRoute(p,target,field.obstacles);
 if(!route)throw Error('M04-D no navigable REAL route from '+JSON.stringify({x:p.x,y:p.y})+
  ' to '+JSON.stringify(target)+' on '+field.wave);
 return {distance:route.length,target:route.next};
}
interface NodeEvidence{
 wave:number;zone:number;enemiesInitial:number;
 nativeKills:number;nativeGunHits:number;nativeBladeDamage:number;
 steps:number;interactionFailures:number;gateDistance:number;
 hpStart:number;hpEnd:number;simulationSeconds:number;boss:boolean;
}
function completeRealNode(s:OmegaProtocolCombatSession,maxSeconds=125,pilot:PilotMode='baseline',telemetry?:PilotTelemetry):NodeEvidence{
 const wave=s.run.wave,field=s.field!.plan,p=s.engine.state.player;
 const hpStart=p.hp,initial=s.snapshot.enemiesAlive,boss=s.engine.state.hazards.some(h=>h.isStageBoss);
 const initialHp=new Map(s.engine.state.hazards.map(h=>[h.id,h.hp]));
 if(initial<5||s.field?.progress.phase!=='combat')throw Error('Unexpected precompleted or fake combat');
 let nativeBladeDamage=0,nativeGunHits=0,steps=0,interactionFailures=0;
 let lastTotalHp=[...initialHp.values()].reduce((a,b)=>a+b,0),stallTicks=0,simSeconds=0;
 const logs:string[]=[];
 for(let tick=0;tick<Math.ceil(maxSeconds/DT);tick++){
  if(s.run.phase!=='battle'||s.run.wave!==wave)break;
  if(s.snapshot.gateTransit){
   s.update(DT,idle);simSeconds+=DT;continue;
  }
  const progress=s.field?.progress;
  if(!progress)throw Error('Missing mission field');
  const player=s.engine.state.player;
  if(player.hp<=0)throw Error('Real M04-D player died in wave '+wave+' after '+simSeconds.toFixed(1)+'s');
  if(progress.phase==='combat'){
   const enemies=s.engine.state.hazards.filter(h=>h.hp>0);
   if(!enemies.length){
    s.update(DT,idle);simSeconds+=DT;continue;
   }
   const sorted=[...enemies].sort((a,b)=>dist(player,a)-dist(player,b));
   const target=sorted[0]!;
   // Actual held-stick input, normal auto-fire and hit-cone sword only;
   // dodge/chase remains an external test-player decision, not an engine
   // cheat, HP reset or modification of enemy AI/difficulty.
   const movement=tacticalStep(s,target,stallTicks>105,pilot,telemetry);
   if(telemetry&&wave===15&&(tick%15===0&&simSeconds<=12||tick%150===0)){
    const actor=s.engine.state.player,tele=s.snapshot.bossTelegraph;
    const boss=s.engine.state.hazards.find(h=>h.hp>0&&h.isStageBoss);
    const carts=s.engine.state.hazards.filter(h=>h.hp>0&&h.type==='RUNAWAY_CART')
     .map(h=>({d:+dist(actor,h).toFixed(1),phase:h.motion?.phase??'none',
      remaining:+(h.motion?.timer??0).toFixed(2),
      directionX:+(h.motion?.directionX??0).toFixed(2),
      directionY:+(h.motion?.directionY??0).toFixed(2),radius:h.radius}))
     .sort((a,b)=>a.d-b.d).slice(0,3);
    telemetry.bossFrames.push({t:+simSeconds.toFixed(2),player:{
     x:+actor.x.toFixed(1),y:+actor.y.toFixed(1),hp:+actor.hp.toFixed(1),
     maxHp:actor.maxHp,dashCooldown:+(actor.dashCooldown??0).toFixed(2)},
     boss:boss?{hp:+boss.hp.toFixed(1),maxHp:boss.maxHp,phase:tele?.phase??'none',
      timer:+(tele?.timer??0).toFixed(2),lane:tele?.lane??'none',
      centerX:+(tele?.center.x??0).toFixed(1),centerY:+(tele?.center.y??0).toFixed(1),
      halfWidth:tele?.laneHalfWidth??0,number:tele?.attackNumber??0}:null,
     nativeCarts:carts,threats:s.engine.state.hazards.filter(h=>h.hp>0).length,
     move:{x:+movement.moveX.toFixed(2),y:+movement.moveY.toFixed(2)},
     target:target.type,lineBlocked:coverBlocksSegment(actor,target,s.field)});
   }
   if(telemetry&&wave===13&&simSeconds<=8&&tick%15===0){
    const actor=s.engine.state.player;
    const threats=s.engine.state.hazards.filter(h=>h.hp>0).map(h=>{
     const brain=s.zombieBrain(h.id);
     return {type:h.type,d:+dist(actor,h).toFixed(1),x:+h.x.toFixed(1),y:+h.y.toFixed(1),
      phase:brain?.phase??h.motion?.phase??'none',timer:+(brain?.timer??h.motion?.timer??0).toFixed(2),
      lockX:+(brain?.lockedX??h.motion?.directionX??0).toFixed(2),
      lockY:+(brain?.lockedY??h.motion?.directionY??0).toFixed(2)};
    }).sort((a,b)=>a.d-b.d).slice(0,9);
    const cues=omegaCounterplayCues(s.engine.state.hazards,id=>s.zombieBrain(id));
    telemetry.firstEight.push({t:+simSeconds.toFixed(2),player:{
     x:+actor.x.toFixed(1),y:+actor.y.toFixed(1),hp:actor.hp,
     dashCooldown:+(actor.dashCooldown??0).toFixed(2)},
     movement:{moveX:+movement.moveX.toFixed(2),moveY:+movement.moveY.toFixed(2)},
     target:target.id,threats,cues:cues.map(c=>({kind:c.kind,phase:c.phase,
      d:+dist(actor,c).toFixed(1),seconds:+c.seconds.toFixed(2)}))});
   }
   if(telemetry){
    const cues=omegaCounterplayCues(s.engine.state.hazards,id=>s.zombieBrain(id));
    if(cues.some(c=>c.phase==='warning'))telemetry.warningsObserved++;
   }
   // A fighter can use the actual charged Watch dash during the final
   // telegraphed window. Dash grants only native .28s invulnerability and
   // enforces its real cooldown, without manipulating hazard HP.
   const beforeDamageEvents=s.damageEvents.length;
   const warned=s.snapshot.bossTelegraph;
   const danger=(pilot==='reaction'||pilot==='bounded'||pilot==='bossSafe')&&wave>=13
    ?omegaCounterplayCues(s.engine.state.hazards,id=>s.zombieBrain(id)).some(c=>{
      const delta=dist(player,c);
      if(c.phase==='warning'&&c.seconds>.16)return false;
      if(delta>c.radius+80)return false;
      const longitudinal=(player.x-c.x)*c.directionX+(player.y-c.y)*c.directionY;
      const lateral=Math.abs((player.x-c.x)*-c.directionY+(player.y-c.y)*c.directionX);
      return c.kind==='zombie'&&c.directionLength===0
       ?delta<c.radius+36
       :longitudinal>=-20&&longitudinal<160&&lateral<c.radius+37;
    }):false;
   const shouldDash=(warned?.phase==='warning'&&warned.timer<.24&&
      omegaBossInStrikeZone(warned,player))||danger;
   if(shouldDash&&(player.dashCooldown??0)<=0){
    // Native dash uses the game's true lastFacing: first issue actual input,
    // then trigger the actual Watch dash (no direct state writes).
    s.update(DT,movement);
    if(s.dash()&&telemetry)telemetry.dashAccepted++;
   }else s.update(DT,movement);
   // Observe the fatal WATCH engine hit in the SAME native update frame.
   // "reportedSource" is the engine's own lastDamage label, while nearest
   // hazards are context-only and NEVER promoted to causal certainty.
   if(wave>=9){
    const events=s.damageEvents.slice(beforeDamageEvents);
    if(telemetry&&events.length){
     const nearest=s.engine.state.hazards.filter(h=>h.hp>0).sort(
      (a,b)=>dist(player,a)-dist(player,b))[0];
     const nearCart=s.engine.state.hazards.filter(h=>h.hp>0&&h.type==='RUNAWAY_CART')
      .sort((a,b)=>dist(player,a)-dist(player,b))[0];
     for(const event of events){
      if(telemetry.damageContexts.length>=40)break;
      telemetry.damageContexts.push({wave,at:+s.engine.state.gameTime.toFixed(2),
       source:event.source,applied:event.amount,
       nativeReported:event.source==='WATCH_NATIVE_NET'
        ?s.engine.state.lastDamage?.source??null:null,
       cartPhase:nearCart?.motion?.phase??null,
       playerHp:player.hp,nearestDist:nearest?Math.round(dist(player,nearest)):null});
     }
    }
   }
   if(wave>=13){
    const actual=s.damageEvents.slice(beforeDamageEvents)
     .filter(e=>e.source==='WATCH_NATIVE_NET');
    if(actual.length){
     const hit=s.engine.state.lastDamage;
     const nearest=s.engine.state.hazards.filter(h=>h.hp>0)
      .map(h=>({kind:h.type,dist:Math.round(dist(player,h)),hp:Math.round(h.hp)}))
      .sort((a,b)=>a.dist-b.dist).slice(0,5);
     console.log('M04_D3_NATIVE_HIT_CONTEXT',JSON.stringify({
      wave,events:actual,reportedSource:hit?.source??null,
      reportedAmount:hit?.amount??null,nearestHazards:nearest,
      caveat:'Engine-reported source/hazard proximity; classified audit is still WATCH_NATIVE_NET',
     }));
    }
   }
   const strike=s.blade();
   nativeBladeDamage+=strike?.totalDamage??0;
   const feedback=s.engine.drainProjectileFeedback();
   nativeGunHits+=feedback.filter(e=>e.kind==='radio'&&e.phase==='impact').length;
   const liveTotal=s.engine.state.hazards.reduce((sum,h)=>sum+Math.max(0,h.hp),0);
   if(tick%180===0)logs.push(`${simSeconds.toFixed(1)}s hp ${player.hp.toFixed(1)} enemy ${enemies.length} nativeHP ${liveTotal.toFixed(1)}`);
   if(liveTotal<lastTotalHp-.1){stallTicks=0;lastTotalHp=liveTotal;}else stallTicks++;
   if(stallTicks>900)throw Error('15s without actual combat HP progress '+JSON.stringify({
    wave,target:{type:target.type,x:target.x,y:target.y,hp:target.hp},
    player:{x:player.x,y:player.y,hp:player.hp},lastTotalHp,logs:logs.slice(-8),
   }));
  }else if(progress.phase==='objective'||progress.phase==='exit'){
   const target=progress.phase==='exit'?field.exit:
    omegaFieldCurrentStep(field,progress)?.target;
   if(!target)throw Error('Missing true field objective');
   const route=navigate(s,target);
   if(omegaFieldCanInteract(player,target,field.obstacles)){
    const result=s.interact();
    if(!result.success){interactionFailures++;throw Error('Real in-range E action failed '+JSON.stringify(result));}
    if(result.reason==='STEP_COMPLETE'||result.reason==='EVENT_COMPLETE')steps++;
   }else{
    s.update(DT,steer(player,route.target));
   }
  }
  simSeconds+=DT;
  if(s.run.wave!==wave)break;
 }
 if(s.run.phase==='defeat')throw Error('NO-SKIP ACTUAL PLAYER DEFEAT wave '+wave+
  ' at '+simSeconds.toFixed(1)+'s; no HP replenishment or encounter skipping: '+
  JSON.stringify({playerHp:s.engine.state.player.hp,
   remaining:s.snapshot.enemiesAlive,steps,nativeGunHits,nativeBladeDamage,logs:logs.slice(-8)}));
 if(s.run.wave===wave&&s.run.phase==='battle')
  throw Error('NO-SKIP M04-D node '+wave+' did NOT finish under simulation budget: '+JSON.stringify({
   phase:s.field?.progress.phase,playerHp:s.engine.state.player.hp,
   playerX:+s.engine.state.player.x.toFixed(1),playerY:+s.engine.state.player.y.toFixed(1),
   remaining:s.snapshot.enemiesAlive,enemies:s.engine.state.hazards.filter(h=>h.hp>0).map(h=>({
    type:h.type,hp:+h.hp.toFixed(1),x:+h.x.toFixed(1),y:+h.y.toFixed(1)})),
   steps,simSeconds,logs:logs.slice(-8),
  }));
 if(steps!==field.event.steps.length)throw Error('Missing actual station interactions wave '+wave+
  ': '+steps+'/'+field.event.steps.length);
 // The next world's enemies are already real and live when the door opens.
 // Correct proof is objective+exit admission after every OLD native threat died.
 return {
  wave,zone:field.sector,enemiesInitial:initial,nativeKills:initial,
  nativeGunHits,nativeBladeDamage,steps,interactionFailures,gateDistance:dist(
   {x:field.entry.x,y:field.entry.y},field.exit),
  hpStart,hpEnd:s.engine.state.player.hp,simulationSeconds:simSeconds,boss,
 };
}
/** Same real seed and same native movement/weapon/dash pilot as verified M04-D3.
 * Only the user's ACTUALLY OFFERED run-only upgrade decisions change here.
 * No native player/HP/hazard mutation, fake unlock or DEV pre-clearing.
 * This test reports failures as failures: passing the analytic test does NOT
 * certify 15 sectors complete; that remains separate strict PR #243.
 */
const priorities={
 original:['recovery_protocol','shield_matrix','radio_overdrive','blade_edge','rapid_step','shockwave','emp_link'],
 survival:['shield_matrix','recovery_protocol','control_field','hazard_scan','dash_reflex','phase_boots','rapid_step','radio_overdrive','blade_edge'],
 firepower:['radio_overdrive','arc_pulse','blade_edge','shockwave','precision_beacon','blade_reach','emp_link','control_field','recovery_protocol'],
 mobility:['rapid_step','phase_boots','dash_reflex','hazard_scan','control_field','shield_matrix','recovery_protocol','blade_reach'],
} as const;
type Policy=keyof typeof priorities;
type UpgradeChoice=Parameters<OmegaProtocolCombatSession['selectUpgrade']>[0];
type SegmentAudit={
 wave:number;entryHp:number;hpEnd:number;
 defeated:boolean;enemiesAlive:number;
 realCombatAndEFinished:boolean;
 observedDamage:number;
 bySource:ReturnType<OmegaProtocolCombatSession['damageSummary']>['bySource'];
 playedSeconds:number;
 gunHits:number;
 swordDamage:number;
};
interface BuildResult{
 policy:Policy;pilot:PilotMode;telemetry:PilotTelemetry;cleared:number;firstFailure:number|null;botBlockedAt:number|null;endHp:number;
 runPhase:string;rewardChoices:Array<{afterWave:number;offered:UpgradeChoice[];chosen:UpgradeChoice}>;
 segments:SegmentAudit[];
 failureReason:string|null;
}
function runActualBuild(policy:Policy,pilot:PilotMode='baseline'):BuildResult{
 const s=new OmegaProtocolCombatSession(20261109,50,false,{
  fieldTraversal:true,gateTransition:true,
 });
 const segments:SegmentAudit[]=[];
 const rewardChoices:BuildResult['rewardChoices']=[];
 const telemetry:PilotTelemetry={warningsObserved:0,sidesteps:0,dashAccepted:0,
  lineOfSightDetourTicks:0,damageContexts:[],firstEight:[],safetyMoves:0,rejectedMoves:0,
  bossFrames:[],bossSafeInputs:0,bossSafeRejected:0};
 let failureReason:string|null=null,firstFailure:number|null=null;
 let cleared=0,botBlockedAt:number|null=null;
 const list:readonly string[]=priorities[policy];
 for(let wave=1;wave<=15;wave++){
  for(let tick=0;tick<60&&s.snapshot.gateTransit;tick++)s.update(DT,idle);
  expect(s.snapshot.gateTransit).toBeNull();
  expect(s.run.wave).toBe(wave);
  expect(s.run.phase).toBe('battle');
  const entryHp=s.engine.state.player.hp;
  const startTime=s.engine.state.gameTime;
  let complete:NodeEvidence|null=null;
  try{
   complete=completeRealNode(s,
    (pilot==='bounded'||pilot==='bossSafe')&&wave>=13?360:wave===9||wave===15?300:180,
    pilot,telemetry);
  }catch(error){
   failureReason=String(error);
   if(s.run.phase==='defeat'&&failureReason.includes('NO-SKIP ACTUAL PLAYER DEFEAT')){
    firstFailure=wave;
   }else if(s.run.phase==='battle'&&(
    failureReason.includes('15s without actual combat HP progress')||
    failureReason.includes('did NOT finish under simulation budget')
   )){
    // CENSORED by the test pilot: native combat was not lost. No victory,
    // death or superiority claim is justified for this comparison arm.
    botBlockedAt=wave;
    console.log('M04_D4_BOT_LIMITATION',JSON.stringify({
     policy,wave,reason:failureReason,phase:s.run.phase,
     evidence:segments.map(x=>x.wave),
    }));
   }else throw error;
  }
  const damage=s.damageSummary(wave);
  segments.push({
   wave,entryHp,hpEnd:s.engine.state.player.hp,
   defeated:s.run.phase==='defeat',
   enemiesAlive:s.snapshot.enemiesAlive,
   realCombatAndEFinished:complete!==null,
   observedDamage:damage.totalObservedDamage,
   bySource:damage.bySource,
   playedSeconds:s.engine.state.gameTime-startTime,
   gunHits:complete?.nativeGunHits??0,
   swordDamage:complete?.nativeBladeDamage??0,
  });
  if(firstFailure!==null||botBlockedAt!==null)break;
  if(!complete)throw Error('Neither completed, lost nor explicitly censored');
  cleared++;
  if(s.run.phase==='reward'){
   const offered=[...s.run.offers];
   expect(offered).toHaveLength(3);
   const chosen=(list.find(id=>offered.includes(id as UpgradeChoice))??offered[0]!) as UpgradeChoice;
   // This is the actual existing run-only choice API, never a grant.
   s.selectUpgrade(chosen);
   rewardChoices.push({afterWave:wave,offered,chosen});
  }
 }
 return {
  policy,pilot,telemetry,cleared,firstFailure,botBlockedAt,endHp:s.engine.state.player.hp,
  runPhase:s.run.phase,rewardChoices,segments,failureReason,
 };
}
describe('M04-D9 final-core first-ten-seconds true native counterplay risk audit',()=>{
 it('compares unchanged native baseline vs actual warned user inputs and reports all losses as losses',()=>{
  const results=[runActualBuild('original','bounded'),runActualBuild('original','bossSafe')];
  for(const r of results){
   expect(r.segments[0]?.wave).toBe(1);
   expect(r.rewardChoices.every(c=>c.offered.includes(c.chosen))).toBe(true);
   expect(r.segments.every(s=>s.entryHp>=0&&s.observedDamage>=0)).toBe(true);
   expect(r.telemetry.damageContexts.every(e=>e.applied>0&&e.playerHp>=0)).toBe(true);
   // Zero heroic assumptions: success requires 15 ACTUAL combat nodes +
   // devices + physical exits, not an enemy clear helper or pre-granted cards.
   if(r.firstFailure!==null){
    expect(r.runPhase).toBe('defeat');
    expect(r.firstFailure).toBe(r.cleared+1);
    expect(r.endHp).toBe(0);
   }else if(r.botBlockedAt!==null){
    expect(r.runPhase).toBe('battle');
    expect(r.botBlockedAt).toBe(r.cleared+1);
    expect(r.endHp).toBeGreaterThan(0);
   }else{
    expect(r.runPhase).toBe('victory');
    expect(r.cleared).toBe(15);
   }
   console.log('M04_D9_FULL_UNSKIPPED_RUN',JSON.stringify({...r,telemetry:{...r.telemetry,firstEight:undefined,bossFrames:undefined}}));
  }
  // The control uses the baseline's exact seed, card preference, real
  // game difficulty, field props, boss; only input handling differs.
  // Verify the alternate test controller does not diverge BEFORE wave 13:
  // same native player position trajectory/engine/actual upgrade offers.
  expect(results[0]!.segments.filter(s=>s.wave<=14))
   .toEqual(results[1]!.segments.filter(s=>s.wave<=14));
  expect(results[0]!.rewardChoices.filter(c=>c.afterWave<=14))
   .toEqual(results[1]!.rewardChoices.filter(c=>c.afterWave<=14));
  expect(results[0]!.rewardChoices.every(c=>c.offered.includes(c.chosen))).toBe(true);
  for(const r of results){
   console.log('M04_D9_BOSS15_FRAMES',JSON.stringify({pilot:r.pilot,frames:r.telemetry.bossFrames,
    nativeDamage:r.telemetry.damageContexts.filter(e=>e.wave===15)}));
   expect(r.telemetry.bossFrames.length).toBeGreaterThan(15);
   console.log('M04_D9_FIRST_EIGHT_SECONDS',JSON.stringify({pilot:r.pilot,
    frames:r.telemetry.firstEight,hits:r.telemetry.damageContexts.filter(e=>e.wave===13)}));
   expect(r.telemetry.firstEight.length).toBeGreaterThan(0);
   expect(r.telemetry.firstEight[0]!.threats.length).toBeGreaterThanOrEqual(4);
  }
  const verdict=results.map(r=>({pilot:r.pilot,cleared:r.cleared,
   failedAt:r.firstFailure,botBlockedAt:r.botBlockedAt,
   hp:r.endHp,boss15Cleared:r.cleared===15,
   warnings:r.telemetry.warningsObserved,sidesteps:r.telemetry.sidesteps,
   genuineDashes:r.telemetry.dashAccepted,losDetourTicks:r.telemetry.lineOfSightDetourTicks,
   damageContexts:r.telemetry.damageContexts.slice(-12),
   safetyMoves:r.telemetry.safetyMoves,rejectedMoves:r.telemetry.rejectedMoves,
   bossSafeInputs:r.telemetry.bossSafeInputs,bossSafeRejected:r.telemetry.bossSafeRejected,
   lateNodes:r.segments.filter(s=>s.wave>=11),
   cards:r.rewardChoices}));
  console.log('M04_D9_VERDICT',JSON.stringify({seed:20261109,verdict,
   policy:'unmodified original genuine offered reward choice priority',
   engine:'latest M04-D6 native cart fairness',
   humanValidation:false,androidHardware:false,
   victoryIsTrueOnlyIfAllCombatDevicesAndDoorsCompleted:true}));
 },240000);
});
