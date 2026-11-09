import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 omegaFieldCanInteract,omegaFieldCurrentStep,OMEGA_QUARTER_VIEW,
 type OmegaFieldPoint,
} from '../src/domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';
import {omegaBossInStrikeZone} from '../src/engine/omega-protocol-boss-pattern';

/**
 * M04-D4 AUTHENTIC fixed-step comparison pilot. Never edits HP, hazards, player position,
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
   const beforeDamageEvents=s.damageEvents.length;
   const warned=s.snapshot.bossTelegraph;
   if(warned?.phase==='warning'&&warned.timer<.24&&
      omegaBossInStrikeZone(warned,player)&&
      (player.dashCooldown??0)<=0){
    s.update(DT,movement);
    s.dash();
   }else s.update(DT,movement);
   // Observe the fatal WATCH engine hit in the SAME native update frame.
   // "reportedSource" is the engine's own lastDamage label, while nearest
   // hazards are context-only and NEVER promoted to causal certainty.
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
 policy:Policy;cleared:number;firstFailure:number|null;botBlockedAt:number|null;endHp:number;
 runPhase:string;rewardChoices:Array<{afterWave:number;offered:UpgradeChoice[];chosen:UpgradeChoice}>;
 segments:SegmentAudit[];
 failureReason:string|null;
}
function runActualBuild(policy:Policy):BuildResult{
 const s=new OmegaProtocolCombatSession(20261109,50,false,{
  fieldTraversal:true,gateTransition:true,
 });
 const segments:SegmentAudit[]=[];
 const rewardChoices:BuildResult['rewardChoices']=[];
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
   complete=completeRealNode(s,wave===9||wave===15?300:180);
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
  policy,cleared,firstFailure,botBlockedAt,endHp:s.engine.state.player.hp,
  runPhase:s.run.phase,rewardChoices,segments,failureReason,
 };
}
describe('M04-D4 legitimate upgrade path comparison at same seed and native difficulty',()=>{
 it('compares 4 genuinely offered upgrade priorities without hiding real 13–15 losses',()=>{
  const results=Object.keys(priorities).map(p=>runActualBuild(p as Policy));
  for(const result of results){
   console.log('M04_D4_BUILD_RESULT',JSON.stringify(result));
   expect(result.segments[0]?.wave).toBe(1);
   expect(result.cleared).toBeGreaterThanOrEqual(1);
   expect(result.segments.every(x=>x.observedDamage>=0)).toBe(true);
   expect(result.rewardChoices.every(x=>x.offered.includes(x.chosen))).toBe(true);
   if(result.firstFailure!==null){
    expect(result.firstFailure).toBe(result.cleared+1);
    expect(result.runPhase).toBe('defeat');
    expect(result.endHp).toBe(0);
   }else if(result.botBlockedAt!==null){
    expect(result.botBlockedAt).toBe(result.cleared+1);
    expect(result.runPhase).toBe('battle');
    expect(result.endHp).toBeGreaterThan(0);
   }else{
    expect(result.cleared).toBe(15);
    expect(result.runPhase).toBe('victory');
   }
  }
  const baseline=results.find(r=>r.policy==='original')!;
  expect(baseline.cleared).toBe(12);
  expect(baseline.firstFailure).toBe(13);
  expect(baseline.segments.find(s=>s.wave===13)?.bySource).toMatchObject({
   INFECTED_SPRINTER:16,WATCH_NATIVE_NET:17,
  });
  const ranked=results.map(x=>({policy:x.policy,cleared:x.cleared,
   firstFailure:x.firstFailure,botBlockedAt:x.botBlockedAt,hp:x.endHp,offeredAt:x.rewardChoices.map(c=>c.afterWave)}))
   .sort((a,b)=>b.cleared-a.cleared||a.policy.localeCompare(b.policy));
  console.log('M04_D4_VERIFIED_COMPARISON',JSON.stringify({
   seed:20261109,baselineCleared:baseline.cleared,
   results:ranked,limitation:'fixed scripted pilot; strategy comparison is not human/Android validation',
   disclaimer:'Comparison PASS means only complete facts and original rules; strict 15/15 milestone remains independent.',
  }));
 },240000);
});
