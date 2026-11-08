import {describe,it,expect} from 'vitest';
import {omegaFieldHeading,OMEGA_DIRECTIONS} from '../src/ui/omega-protocol-actor-render';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
describe('OMEGA PROCEDURAL actor QA (not approved AIRA art)',()=>{
 it('maps all eight user movement headings into distinct full-view poses',()=>{
  const vectors=[
   [1,0], [1,1], [0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],
  ] as const;
  const actual=vectors.map(([x,y])=>omegaFieldHeading(x,y));
  expect(actual).toEqual([...OMEGA_DIRECTIONS]);
  expect(new Set(actual).size).toBe(8);
  expect(omegaFieldHeading(0,0)).toBe('S');
  expect(omegaFieldHeading(NaN,0)).toBe('S');
 });
 it('uses actual player input for cosmetic facing without affecting saved combat upgrades',()=>{
  const s=new OmegaProtocolCombatSession(1001,10,false,{fieldTraversal:true});
  expect(s.facing).toEqual({x:0,y:1});
  s.update(1/60,{moveX:1,moveY:-1,triggerAction:false});
  expect(omegaFieldHeading(s.facing.x,s.facing.y)).toBe('NE');
  expect(s.moving).toBe(true);
  s.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  expect(s.moving).toBe(false);
  expect(omegaFieldHeading(s.facing.x,s.facing.y)).toBe('NE');
  expect(s.run.owned).toEqual({});
 });
});
