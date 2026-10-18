import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
function advisor(){
 const context={module:{exports:{}}};
 vm.runInNewContext(fs.readFileSync('public/signal-breaker-dev/src/boss-raid-advisor.js','utf8'),context);
 return context.module.exports as {visual:(s:any,x:number,n?:number)=>any};
}
const b={state:'WARNING',trueSignal:false,laneX:600,half:120,counter:'anchor',phase:2,remaining:2,warningDuration:2,pattern:'tension.2',attempts:1};
describe('Signal Breaker voice-free boss mechanics',()=>{
 const m=advisor();
 it('distinguishes fake from true warning and calculates safe movement from live lane',()=>{
  expect(m.visual(b,600)).toMatchObject({phase:'read',mode:'pending'});
  expect(m.visual({...b,trueSignal:true},600)).toMatchObject({phase:'evade',mode:'danger',direction:'left'});
  expect(m.visual({...b,trueSignal:true},70)).toMatchObject({phase:'counter',direction:null});
 });
 it('uses actual node count and five counter tool families',()=>{
  expect(m.visual({...b,state:'SUPPORT'},650,2)).toMatchObject({phase:'support',remainingNodes:2});
  expect(m.visual({...b,state:'BURST'},650).phase).toBe('burst');
  expect(m.visual({...b,state:'RECOVERY'},650).phase).toBe('retry');
  expect(m.visual({...b,state:'FINISHER'},650)).toBeNull();
  for(const counter of ['bank','belt','mist','anchor','scan']) expect(m.visual({...b,counter},650).action).toBe('breaker.raid.visual.action.'+counter);
 });
 it('does not alter the combat engine, prizes or opt-out controls',()=>{
  const ui=fs.readFileSync('public/signal-breaker-dev/src/boss-raid-ui.js','utf8');
  const vfx=fs.readFileSync('public/signal-breaker-dev/src/combat-vfx.js','utf8');
  const app=fs.readFileSync('public/signal-breaker-dev/src/app.js','utf8');
  expect(ui).toContain("prefs.mode==='full'?root.SignalBreakerRaidAdvisor.visual");
  expect(ui).toContain("visual.hidden=!guide");
  expect(vfx).toContain("q.kind==='bosshit'");
  expect(vfx).toContain("'raidcounter','raidburst','raidfailure'");
  expect(app).toContain("game.time-lastRaidImpact>=.12");
 });
});
