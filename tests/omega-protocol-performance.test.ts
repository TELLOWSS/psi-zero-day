import {describe,it,expect} from 'vitest';
import {performance} from 'node:perf_hooks';
import {OmegaProtocolCombatSession,OMEGA_MAX_LIVE_THREATS} from '../src/engine/omega-protocol-combat';

/**
 * Node/CI CPU simulation only. This is NOT Android GPU FPS, thermals,
 * JavaScript main-thread layout, audio latency, battery or touch QA.
 */
describe('OMEGA PROTOCOL bounded CPU integration profile',()=>{
 it('reports 60Hz engine-step cost without confusing it with real device FPS',()=>{
  const session=new OmegaProtocolCombatSession(20261108,10);
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
});
