import {describe,it,expect} from 'vitest';
import {zeroBreachContent as content} from '../src/content/defense';
import {advanceDefense,advanceDefenseWithCombat,createDefenseRun,tickDefense} from '../src/engine/defense';
import type {DefenseRunState,DefenseTowerId} from '../src/domain/defense';

function fixture(family:DefenseTowerId='PULSE',hp=1000):DefenseRunState{
 const base=createDefenseRun(content,'COORDINATOR','combat-contract');
 return {...base,status:'RUNNING',waveTick:2000,spawnedByGroup:content.waves[0]!.groups.map(g=>g.count),
  towers:[{id:'tower-1',towerId:family,levelId:'L1',padId:'P1',targetMode:'FIRST',invested:80,attackCooldown:0,revealCooldown:0}],
  enemies:[{id:'target-1',enemyId:'NORMAL',hp,distance:100,spawnSequence:1,revealUntilTick:0,slowEffects:[],bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0}]};
}
describe('authoritative ephemeral defense combat output',()=>{
 it.each(['PULSE','BURST','CONTROL','SENSOR'] as const)('reports the actual %s target, capped HP damage and world contact point',family=>{
  const state=fixture(family),before=structuredClone(state),frame=advanceDefenseWithCombat(state,content);
  expect(state).toEqual(before);expect(frame.state).toEqual(tickDefense(state,content));
  expect(frame.shots).toHaveLength(1);expect(frame.shots[0]).toMatchObject({towerId:family,levelId:'L1',padId:'P1'});
  const hit=frame.shots[0]!.targets[0]!;
  expect(hit.id).toBe('target-1');expect(hit.point.y).toBe(300);expect(hit.point.x).toBeGreaterThan(100);
  expect(hit.damage).toBe(1000-frame.state.enemies[0]!.hp);expect(hit.resolved).toBe(false);
 });
 it('reports all actual splash targets and only true resolutions, without persisting presentation fields',()=>{
  const state=fixture('BURST',1);const enemy=state.enemies[0]!;
  const frame=advanceDefenseWithCombat({...state,enemies:[enemy,{...enemy,id:'target-2',distance:110,spawnSequence:2}]},content);
  expect(frame.shots[0]!.targets).toHaveLength(2);
  expect(frame.shots[0]!.targets.every(h=>h.resolved&&h.damage===1)).toBe(true);
  expect(frame.state).not.toHaveProperty('shots');expect(frame.state.enemies).toHaveLength(0);
 });
 it('collects both ticks at 2x, matches sequential simulation, and never emits while paused',()=>{
  const state={...fixture(),speed:2 as const};
  const frame=advanceDefenseWithCombat(state,content,32);
  let sequential=state as DefenseRunState;for(let i=0;i<64;i++)sequential=tickDefense(sequential,content);
  expect(frame.state).toEqual(sequential);expect(frame.shots.length).toBeGreaterThan(1);
  expect(new Set(frame.shots.map(s=>s.id)).size).toBe(frame.shots.length);
  expect(advanceDefense(state,content,32)).toEqual(frame.state);
  expect(advanceDefenseWithCombat({...state,paused:true},content,10).shots).toEqual([]);
 });
 it('does not emit from cooldown ticks without a valid or visible target',()=>{
  expect(advanceDefenseWithCombat({...fixture(),enemies:[]},content).shots).toEqual([]);
  const state=fixture();expect(advanceDefenseWithCombat({...state,enemies:[{...state.enemies[0]!,enemyId:'VEILED'}]},content).shots).toEqual([]);
 });
});
