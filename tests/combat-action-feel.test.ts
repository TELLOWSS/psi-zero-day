import {describe,it,expect} from 'vitest';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {guardFeedbackPulse} from '../src/app/guard-battle-feedback';
import type {DefenseCombatShot} from '../src/domain/defense';

function oneShot(resolved:boolean,enemyId='NORMAL'){
 return [{id:'defense-shot',phase:'IMPACT',targets:[{id:'enemy-1',resolved,enemyId,damage:30}]}] as unknown as DefenseCombatShot[];
}
describe('Tactical action receipts respect real engine acceptance and existing audio budgets',()=>{
 it('emits one distinct cue after a dash and never repeats on cooldown',()=>{
  const state=createInitialSurvivorsState('player',undefined,'stage_01');
  const engine=new SurvivorsEngine(state);engine.start();engine.drainAudioEvents();
  expect(engine.triggerPlayerDash()).toBe(true);
  expect(engine.drainAudioEvents().map(event=>event.type)).toEqual(['dash']);
  expect(engine.triggerPlayerDash()).toBe(false);
  expect(engine.drainAudioEvents()).toEqual([]);
 });
 it('does not play action confirmation for denied support or control line',()=>{
  const state=createInitialSurvivorsState();const engine=new SurvivorsEngine(state);engine.start();engine.drainAudioEvents();
  state.bossEncounter={bossId:'test',phase:'arrival',remaining:1};
  expect(engine.requestSupport()).toBe(false);
  expect(engine.deployControlLine()).toBe(false);
  expect(engine.drainAudioEvents()).toEqual([]);
  state.bossEncounter.phase='combat';
  expect(engine.requestSupport()).toBe(true);
  expect(engine.deployControlLine()).toBe(true);
  expect(engine.drainAudioEvents().map(event=>event.type)).toEqual(['support','control_line']);
  expect(engine.requestSupport()).toBe(false);
  expect(engine.deployControlLine()).toBe(false);
  expect(engine.drainAudioEvents()).toEqual([]);
 });
 it('keeps contact feedback silent until an actual resolved enemy and caps spam',()=>{
  expect(guardFeedbackPulse(oneShot(false),Infinity)).toBeNull();
  expect(guardFeedbackPulse(oneShot(true),500)).toBeNull();
  expect(guardFeedbackPulse(oneShot(true),1100)).toMatchObject({resolved:1,tier:'CONTACT',bossResolved:false});
  expect(guardFeedbackPulse(oneShot(true,'BOSS'),0)).toMatchObject({resolved:1,tier:'BOSS',bossResolved:true});
 });
});
