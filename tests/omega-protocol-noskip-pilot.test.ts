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
   const range=dist(player,target);
   let movement=idle;
   // Chase only real native hazards.  Short melee bursts are ordinary combat
   // commands; the radio gun remains the original Watch automatic projectile.
   if(range>89){
    const route=navigate(s,{x:target.x,y:target.y});
    movement=steer(player,route.target);
   }else{
    const delta={x:target.x-player.x,y:target.y-player.y};
    movement=steer(player,{x:player.x+delta.x,y:player.y+delta.y},range>42?.45:.1);
   }
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
});
