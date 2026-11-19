import {describe,it,expect} from 'vitest';
import {performance} from 'node:perf_hooks';
import {OmegaProtocolCombatSession,OMEGA_MAX_LIVE_THREATS} from '../src/engine/omega-protocol-combat';

/**
 * Node/CI CPU simulation only. This is NOT Android GPU FPS, thermals,
 * JavaScript main-thread layout, audio latency, battery or touch QA.
 */
describe('OMEGA PROTOCOL bounded CPU integration profile',()=>{
 it('reports 60Hz engine-step cost without confusing it with real device FPS',()=>{
  const session=new OmegaProtocolCombatSession(20261108,50);
  session.engine.state.player.invincibleTime=999;
  const sampleMs:number[]=[];
  let maxThreats=0,maxProjectiles=0;
  const input={moveX:0.25,moveY:0,triggerAction:true};
  for(let n=0;n<360;n++){
   const start=performance.now();
   const snapshot=session.update(1/60,input);
   const elapsed=performance.now()-start;
   sampleMs.push(elapsed);
   maxThreats=Math.max(maxThreats,snapshot.enemiesAlive);
   maxProjectiles=Math.max(maxProjectiles,session.engine.state.projectiles.length);
   if(snapshot.run.phase==='reward')session.selectUpgrade(snapshot.run.offers[0]!);
   if(snapshot.run.phase==='defeat'||snapshot.run.phase==='victory')break;
  }
  const ordered=[...sampleMs].sort((a,b)=>a-b);
  const p95=ordered[Math.floor((ordered.length-1)*.95)]!;
  const mean=sampleMs.reduce((total,x)=>total+x,0)/sampleMs.length;
  const report={
   environment:'CI_NODE_CPU_ONLY',
   simulatedStepHz:60,
   frames:sampleMs.length,
   meanStepMs:Number(mean.toFixed(3)),
   p95StepMs:Number(p95.toFixed(3)),
   maxThreats,
   maxProjectiles,
   realAndroidGPUVerified:false,
   originalCharacterArtPerformanceVerified:false
  };
  console.log('OMEGA_PROTOCOL_ENGINE_CPU_PROFILE='+JSON.stringify(report));
  expect(sampleMs.length).toBeGreaterThan(100);
  expect(sampleMs.every(Number.isFinite)).toBe(true);
  expect(maxThreats).toBeLessThanOrEqual(OMEGA_MAX_LIVE_THREATS);
  expect(maxProjectiles).toBeLessThan(2000);
  expect(report.realAndroidGPUVerified).toBe(false);
 });

 it('profiles the actual fifteenth-wave boss pressure with maximum run threat cap',()=>{
  const s=new OmegaProtocolCombatSession(20261108,50);
  for(let wave=1;wave<15;wave++){
   s.engine.state.hazards=[];
   s.update(1/60,{moveX:0,moveY:0,triggerAction:false});
   if(s.run.phase==='reward')s.selectUpgrade(s.run.offers[0]!);
  }
  expect(s.run.wave).toBe(15);
  expect(s.engine.state.hazards.some(h=>h.isStageBoss)).toBe(true);
  const initialThreats=s.snapshot.enemiesAlive;
  expect(initialThreats).toBeGreaterThanOrEqual(8);
  expect(initialThreats).toBeLessThanOrEqual(OMEGA_MAX_LIVE_THREATS);
  s.engine.state.player.invincibleTime=999;
  const durations:number[]=[];
  let peakProjectiles=0,peakHazards=initialThreats;
  for(let frame=0;frame<360;frame++){
   const t=performance.now();
   s.update(1/60,{moveX:.25,moveY:.1,triggerAction:true});
   durations.push(performance.now()-t);
   peakProjectiles=Math.max(peakProjectiles,s.engine.state.projectiles.length);
   peakHazards=Math.max(peakHazards,s.snapshot.enemiesAlive);
   if(s.run.phase==='victory'||s.run.phase==='defeat')break;
  }
  const sorted=[...durations].sort((a,b)=>a-b);
  const report={
   environment:'CI_NODE_CPU_ONLY_BOSS_PRESSURE',
   wave:15,
   initialThreats,
   frames:durations.length,
   meanStepMs:Number((durations.reduce((sum,x)=>sum+x,0)/durations.length).toFixed(3)),
   p95StepMs:Number(sorted[Math.floor(.95*(sorted.length-1))]!.toFixed(3)),
   maxThreats:peakHazards,
   maxProjectiles:peakProjectiles,
   androidFpsValidated:false,
   mobileMemoryValidated:false,
  };
  console.log('OMEGA_PROTOCOL_BOSS_CPU_PROFILE='+JSON.stringify(report));
  expect(report.frames).toBeGreaterThan(100);
  expect(durations.every(Number.isFinite)).toBe(true);
  expect(peakHazards).toBeLessThanOrEqual(OMEGA_MAX_LIVE_THREATS);
  expect(report.androidFpsValidated).toBe(false);
 });
});
