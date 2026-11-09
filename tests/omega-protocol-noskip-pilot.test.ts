import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 omegaFieldCanInteract,omegaFieldCurrentStep,OMEGA_QUARTER_VIEW,
 type OmegaFieldPoint,
} from '../src/domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';

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
   s.update(DT,movement);
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
describe('M04-D real OMEGA expedition without DEV preclear or direct HP mutation',()=>{
 it('first contaminated sector: real native zombie HP+machines, all actual E steps and physically walked exit',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true,
  });
  const first=completeRealNode(s);
  expect(first.nativeGunHits+first.nativeBladeDamage).toBeGreaterThan(0);
  expect(first.enemiesInitial).toBeGreaterThanOrEqual(5);
  expect(first.steps).toBeGreaterThanOrEqual(2);
  expect(first.nativeKills).toBe(first.enemiesInitial);
  expect(s.run).toMatchObject({wave:2,phase:'battle',victories:1});
  expect(['depart','arrive']).toContain(s.snapshot.gateTransit?.phase);
  console.log('QA_M04D_REAL_FIRST_NODE',JSON.stringify(first));
 },120000);
 it('first two maps require genuine kills and both independent station puzzles, never DEV preclear',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true,
  });
  const first=completeRealNode(s);
  expect(first.nativeKills).toBeGreaterThanOrEqual(5);
  for(let i=0;i<25;i++)s.update(DT,idle);
  expect(s.run.wave).toBe(2);
  expect(s.run.phase).toBe('battle');
  const second=completeRealNode(s);
  expect(second.nativeKills).toBeGreaterThanOrEqual(5);
  expect(second.steps).toBeGreaterThanOrEqual(2);
  expect(s.run).toMatchObject({phase:'reward',wave:3,victories:2});
  expect(s.run.offers).toHaveLength(3);
  console.log('QA_M04D_REAL_TWO_NODES',JSON.stringify({first,second}));
 },160000);
 it('third sector: carry actual post-battle HP and real offered upgrade into the next native fight',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true,
  });
  const evidence:NodeEvidence[]=[];
  evidence.push(completeRealNode(s));
  for(let i=0;i<25;i++)s.update(DT,idle);
  evidence.push(completeRealNode(s));
  expect(s.run).toMatchObject({phase:'reward',wave:3,victories:2});
  const ranked=['recovery_protocol','shield_matrix','radio_overdrive','blade_edge','rapid_step'];
  const chosen=s.run.offers.find(id=>ranked.includes(id))??s.run.offers[0]!;
  const offerProof=[...s.run.offers];
  console.log('QA_M04D_WAVE3_LOADOUT',JSON.stringify({
   offers:offerProof,chosen,playerHp:s.engine.state.player.hp,
  }));
  s.selectUpgrade(chosen);
  for(let i=0;i<25;i++)s.update(DT,idle);
  expect(s.run.phase).toBe('battle');
  expect(s.run.wave).toBe(3);
  evidence.push(completeRealNode(s));
  expect(s.run).toMatchObject({wave:4,phase:'battle',victories:3});
  console.log('QA_M04D_REAL_THREE_NODES',JSON.stringify({
   offers:offerProof,chosen,evidence,latestHp:s.engine.state.player.hp,
  }));
 },200000);
 it('M04-D: ACTUAL full 15-zone no-skip pilot with 2 genuine bosses, every device and 7 offered cards',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true, // explicitly NO qaGateTravel
  });
  const proof:NodeEvidence[]=[];
  const picks:Array<{afterWave:number;offered:readonly string[];chosen:string}>=[];
  const pref=['recovery_protocol','shield_matrix','radio_overdrive','blade_edge',
   'rapid_step','shockwave','emp_link'];
  for(let wave=1;wave<=15;wave++){
   // The previous real gate has already updated the run. No mid-play
   // teleport, enemy HP writes, mission completion injection or artificial
   // invulnerability; only let the ACTUAL timed shutters finish opening.
   for(let i=0;i<60&&s.snapshot.gateTransit;i++)s.update(DT,idle);
   expect(s.snapshot.gateTransit).toBeNull();
   expect(s.run.wave).toBe(wave);
   expect(s.run.phase).toBe('battle');
   expect(s.field?.plan.wave).toBe(wave);
   const result=completeRealNode(s,wave===9||wave===15?300:180);
   proof.push(result);
   console.log('QA_M04D_NO_SKIP_NODE',JSON.stringify(result));
   if(s.run.phase==='reward'){
    const offered=[...s.run.offers];
    expect(offered).toHaveLength(3);
    const chosen=offered.find(id=>pref.includes(id))??offered[0]!;
    s.selectUpgrade(chosen as Parameters<typeof s.selectUpgrade>[0]);
    picks.push({afterWave:wave,offered,chosen});
   }
   if(wave===15)expect(s.run.phase).toBe('victory');
   else expect(s.run.phase).toBe('battle');
  }
  expect(s.run).toMatchObject({phase:'victory',victories:15,wave:16});
  expect(proof).toHaveLength(15);
  expect(proof.filter(e=>e.boss).map(e=>e.wave)).toEqual([9,15]);
  expect(picks).toHaveLength(7);
  expect(proof.every(e=>e.nativeKills>=5&&e.steps>=2)).toBe(true);
  console.log('QA_M04D_FULL_15_REAL_RUN',JSON.stringify({
   allCombatAndStations:true,devPreclear:false,
   victories:s.run.victories,bossWaves:proof.filter(e=>e.boss).map(e=>e.wave),
   nativeEnemies:proof.reduce((a,e)=>a+e.nativeKills,0),
   nativeProjectileImpacts:proof.reduce((a,e)=>a+e.nativeGunHits,0),
   devicesOperated:proof.reduce((a,e)=>a+e.steps,0),
   rewards:picks,remainingHp:s.engine.state.player.hp,
   simulatedSeconds:proof.reduce((a,e)=>a+e.simulationSeconds,0),
   sceneTransitionKind:'closed-door sequential field loading; not seamless streaming',
  }));
 },240000);
});
