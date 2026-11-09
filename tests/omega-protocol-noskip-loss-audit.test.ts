import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 omegaFieldCanInteract,omegaFieldCurrentStep,OMEGA_QUARTER_VIEW,
 type OmegaFieldPoint,
} from '../src/domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';
import {omegaBossInStrikeZone} from '../src/engine/omega-protocol-boss-pattern';

/**
 * M04-D AUTHENTIC fixed-step pilot. Never edits HP, hazards, player position,
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
/** A tactical *test player*, not a game-side buff. Picks a route around
 * existing solid field props and kites warned infected charges. Does not
 * read/write game internals beyond readonly hazard positions and native
 * movement commands. */
function tacticalStep(
 s:OmegaProtocolCombatSession,enemy:{x:number;y:number;id:string},forceClose=false,
):Readonly<{moveX:number;moveY:number;triggerAction:boolean}>{
 const actor=s.engine.state.player,field=s.field!.plan;
 const gap=dist(actor,enemy);
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
function completeRealNode(s:OmegaProtocolCombatSession,maxSeconds=125):NodeEvidence{
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
   const movement=tacticalStep(s,target,stallTicks>105);
   // A fighter can use the actual charged Watch dash during the final
   // telegraphed window. Dash grants only native .28s invulnerability and
   // enforces its real cooldown, without manipulating hazard HP.
   const warned=s.snapshot.bossTelegraph;
   if(warned?.phase==='warning'&&warned.timer<.24&&
      omegaBossInStrikeZone(warned,player)&&
      (player.dashCooldown??0)<=0){
    s.update(DT,movement);
    s.dash();
   }else s.update(DT,movement);
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
   remaining:s.snapshot.enemiesAlive,steps,simSeconds,logs:logs.slice(-8),
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
/** This is a forensic replay, not a 15/15 victory test.
 * The PR #243 strict milestone test remains FAILING/unmerged until actual
 * complete game victory. Here an observed real defeat is a valid recorded
 * outcome ONLY if 1→12 native segments genuinely completed first.
 */
describe('M04-D3 field-movement+gun+sword genuine defeat provenance replay',()=>{
 it('replays all real objectives up to the late-game block and reports source-attributed HP damage',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true, // explicitly NO DEV pre-clear
  });
  const cleared:NodeEvidence[]=[];
  const rewards:Array<{afterWave:number;offered:readonly string[];chosen:string;hpBefore:number}>=[];
  const perWave:Array<{wave:number;entryHp:number;exitHp:number;phase:string;totalObservedDamage:number;
   bySource:ReturnType<typeof s.damageSummary>['bySource'];gunHits:number;bladeDamage:number;seconds:number}>=[];
  const pref=['recovery_protocol','shield_matrix','radio_overdrive','blade_edge',
   'rapid_step','shockwave','emp_link'];
  let failedWave:number|null=null;
  let reason:string|null=null;
  for(let wave=1;wave<=15;wave++){
   for(let i=0;i<60&&s.snapshot.gateTransit;i++)s.update(DT,idle);
   expect(s.snapshot.gateTransit).toBeNull();
   expect(s.run.wave).toBe(wave);
   expect(s.run.phase).toBe('battle');
   expect(s.field?.plan.wave).toBe(wave);
   const entryHp=s.engine.state.player.hp;
   let completed:NodeEvidence|null=null;
   try{
    completed=completeRealNode(s,wave===9||wave===15?300:180);
   }catch(err){
    reason=String(err);
    if(s.run.phase!=='defeat'||!reason.includes('NO-SKIP ACTUAL PLAYER DEFEAT')){
     console.log('M04_D3_UNEXPECTED_FAILURE',JSON.stringify({
      wave,reason,clearedWaves:cleared.map(n=>n.wave),damage:s.damageSummary(wave),
     }));
     throw err;
    }
    failedWave=wave;
   }
   const summary=s.damageSummary(wave);
   perWave.push({
    wave,entryHp,exitHp:s.engine.state.player.hp,phase:s.run.phase,
    totalObservedDamage:summary.totalObservedDamage,
    bySource:summary.bySource,
    gunHits:completed?.nativeGunHits??-1,
    bladeDamage:completed?.nativeBladeDamage??-1,
    seconds:completed?.simulationSeconds??-1,
   });
   console.log('M04_D3_PER_WAVE',JSON.stringify(perWave[perWave.length-1]));
   if(failedWave!==null){
    const hitStream=s.damageEvents.filter(e=>e.wave===wave);
    console.log('M04_D3_CAUSAL_DEFEAT_REPORT',JSON.stringify({
     wave,entryHp,exitHp:s.engine.state.player.hp,
     enemiesRemaining:s.snapshot.enemiesAlive,fieldPhase:s.field?.progress.phase,
     damage:summary,firstHits:hitStream.slice(0,15),finalHits:hitStream.slice(-25),
     damageEventCount:hitStream.length,earnedCards:rewards,
     priorClears:cleared.map(n=>n.wave),reason,
     note:'Observed failure, NOT a 15-zone completion. WATCH_NATIVE_NET is net loss, not gross damage.',
    }));
    break;
   }
   if(!completed)throw Error('Unexpected null node with no terminal defeat');
   cleared.push(completed);
   if(s.run.phase==='reward'){
    const offered=[...s.run.offers];
    expect(offered).toHaveLength(3);
    const chosen=pref.find(id=>offered.includes(id as typeof offered[number]))??offered[0]!;
    rewards.push({afterWave:wave,offered,chosen,hpBefore:s.engine.state.player.hp});
    s.selectUpgrade(chosen as Parameters<typeof s.selectUpgrade>[0]);
   }
   if(wave<15)expect(s.run.phase).toBe('battle');
  }
  console.log('M04_D3_OUTCOME',JSON.stringify({
   completed:cleared.map(x=>x.wave),failedWave,
   finalPhase:s.run.phase,remainingHp:s.engine.state.player.hp,
   rewards,perWave,
   coverage:'actual engine, no pre-clear and no direct mutation of enemies/mission/player',
  }));
  expect(cleared.map(x=>x.wave)).toEqual(Array.from({length:cleared.length},(_,i)=>i+1));
  expect(cleared.length).toBeGreaterThanOrEqual(12);
  // This test is a loss diagnosis. The separate PR #243 keeps the strict
  // all-15-clear acceptance FAILED until there is a real native victory.
  if(failedWave!==null){
   expect(s.run.phase).toBe('defeat');
   expect(failedWave).toBeGreaterThanOrEqual(13);
   expect(s.damageSummary(failedWave).totalObservedDamage).toBeGreaterThan(0);
  }else{
   expect(s.run.phase).toBe('victory');
   expect(cleared).toHaveLength(15);
  }
 },240000);
});
