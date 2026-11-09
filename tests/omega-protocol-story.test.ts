import {describe,it,expect} from 'vitest';
import {OMEGA_STORY_ACTS,OMEGA_STORY_NODES,omegaStoryNode} from '../src/domain/omega-protocol-story';
import {OMEGA_PROTOCOL_TOTAL_WAVES} from '../src/domain/omega-protocol-run';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';

describe('OMEGA 50-extreme epilogue is a contiguous exploration, NOT 15 Watch stages',()=>{
 it('defines five unique acts and exactly fifteen navigable authored story locations',()=>{
  expect(OMEGA_STORY_ACTS).toHaveLength(5);
  expect(OMEGA_STORY_NODES).toHaveLength(OMEGA_PROTOCOL_TOTAL_WAVES);
  expect(new Set(OMEGA_STORY_NODES.map(x=>x.title)).size).toBe(15);
  expect(new Set(OMEGA_STORY_ACTS.map(x=>x.title)).size).toBe(5);
  for(let route=1;route<=15;route++){
   const node=omegaStoryNode(route);
   expect(node.route).toBe(route);
   expect(node.act).toBe(Math.ceil(route/3));
   expect(node.airaRadio.length).toBeGreaterThan(10);
   expect(node.atmosphere.length).toBeGreaterThan(10);
   expect(omegaFieldPlan(20261109,route).sector).toBe(node.act);
  }
 });
 it('ties its two dramatic boss encounters to actual Watch hazard-wave 9/15',()=>{
  expect(OMEGA_STORY_NODES.filter(n=>n.boss!=='none').map(n=>n.route)).toEqual([9,15]);
  expect(omegaStoryNode(9).boss).toBe('titan_hook');
  expect(omegaStoryNode(15).boss).toBe('black_signal_core');
 });
 it('records the fictional industrial contamination and preserves uninfected rescue targets',()=>{
  expect(omegaStoryNode(1).reveal).toContain('안전모');
  expect(omegaStoryNode(1).reveal).toContain('좀비');
  expect(omegaStoryNode(5).reveal).toContain('감염');
  expect(omegaStoryNode(11).reveal).toContain('건강한 사람');
  expect(omegaStoryNode(15).reveal).toContain('코어');
  expect(OMEGA_STORY_ACTS.some(x=>x.title==='INFECTED SKYFRAME')).toBe(true);
  expect(()=>omegaStoryNode(0)).toThrow(RangeError);
  expect(()=>omegaStoryNode(16)).toThrow(RangeError);
 });
});
