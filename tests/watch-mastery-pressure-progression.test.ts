import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import {masteryBossPressureProfile,MASTERY_WARNING_SECONDS} from '../src/engine/survivors-mastery-pressure';
describe('Stage 50 mastery adaptive warning and dodge skill',()=>{
 it('clamps pressure to three readable tiers, never shortening warning',()=>{
  expect(MASTERY_WARNING_SECONDS).toBe(2.2);
  expect(masteryBossPressureProfile(0)).toEqual({tier:1,radius:118,cooldownSeconds:4.8,dodgeScore:100});
  expect(masteryBossPressureProfile(3)).toEqual({tier:2,radius:132,cooldownSeconds:4.3,dodgeScore:140});
  expect(masteryBossPressureProfile(6)).toEqual({tier:3,radius:144,cooldownSeconds:3.8,dodgeScore:180});
  expect(masteryBossPressureProfile(200).radius).toBe(144);
  expect(masteryBossPressureProfile(-1).tier).toBe(1);
  expect(masteryBossPressureProfile(NaN).tier).toBe(1);
 });
 it('tracks a real successful dodge streak, escalates next ring, and resets on exposure',()=>{
  const state=createInitialSurvivorsState('yoon',undefined,'stage_50','mastery',{owned:['shock_mantle'],equipped:['shock_mantle']});
  state.phase='playing';state.bossEncounter={bossId:'test-stage50',phase:'arrival',remaining:0};
  const engine=new SurvivorsEngine(state,902);
  const internal=engine as unknown as {beginBossCombat:()=>void;updateStageHazards:(dt:number)=>void};
  internal.beginBossCombat();
  const zone=state.interactiveHazards.find(h=>h.id==='mastery-boss-50-lock');
  expect(zone).toBeDefined();if(!zone)throw Error('no mastery lock');
  const tick=(seconds:number)=>{for(let i=0;i<Math.ceil(seconds*60);i++)internal.updateStageHazards(1/60);};
  for(let n=1;n<=6;n++){
   if(n>1){zone.state='idle';zone.timer=0;internal.updateStageHazards(1/60);}
   expect(zone.state).toBe('warning');expect(zone.timer).toBe(MASTERY_WARNING_SECONDS);
   if(n===4)expect(zone.radius).toBe(132);
   // Alternate sides; otherwise the bot may run into a world boundary.
   state.player.x=zone.x+(n%2===0?-1:1)*(zone.radius+45);
   state.player.y=zone.y;
   tick(2.25);
   expect(state.masteryBossPressure?.streak).toBe(n);
   expect(state.masteryBossPressure?.bestStreak).toBe(n);
  }
  zone.state='idle';zone.timer=0;internal.updateStageHazards(1/60);
  expect(zone.radius).toBe(144);
  state.player.x=zone.x;state.player.y=zone.y;state.player.invincibleTime=0;
  tick(2.25);
  expect(state.masteryBossPressure?.exposures).toBe(1);
  expect(state.masteryBossPressure?.streak).toBe(0);
  expect(state.masteryBossPressure?.bestStreak).toBe(6);
  zone.state='idle';zone.timer=0;internal.updateStageHazards(1/60);
  expect(zone.radius).toBe(118);
 });
 it('does not activate mastery targeting in Extreme',()=>{
  const state=createInitialSurvivorsState('yoon',undefined,'stage_50','extreme');
  state.phase='playing';state.bossEncounter={bossId:'test-boss',phase:'arrival',remaining:0};
  const engine=new SurvivorsEngine(state,902);
  (engine as unknown as {beginBossCombat:()=>void}).beginBossCombat();
  expect(state.masteryBossPressure).toBeUndefined();
  expect(state.interactiveHazards.some(h=>h.id==='mastery-boss-50-lock')).toBe(false);
 });
});
