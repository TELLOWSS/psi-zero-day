import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {omegaStageEncounterPositions} from '../src/domain/omega-protocol-encounter-stage';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

describe('OMEGA on-screen live threat staging',()=>{
 it('opens the playable first scene with at least two native enemies in visible combat range',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  const player=s.engine.state.player,hazards=s.engine.state.hazards;
  expect(hazards.length).toBeGreaterThanOrEqual(3);
  const close=hazards.filter(h=>Math.hypot(h.x-player.x,h.y-player.y)<=340);
  expect(close.length).toBeGreaterThanOrEqual(2);
  expect(hazards.every(h=>h.hp>0&&h.maxHp>0)).toBe(true);
  expect(s.run.wave).toBe(1);
  const normal=new OmegaProtocolCombatSession(20261108,10);
  const untouched=new OmegaProtocolCombatSession(20261108,10);
  // Existing non-field mode retains the old seeded encounter coordinates.
  expect(normal.engine.state.hazards.map(h=>[h.x,h.y])).toEqual(
   untouched.engine.state.hazards.map(h=>[h.x,h.y]));
  expect(normal.engine.state.hazards.map(h=>[h.x,h.y])).not.toEqual(
   hazards.map(h=>[h.x,h.y]));
 });
 it('keeps all fifteen dense actors away from original collision props and player',()=>{
  for(let wave=1;wave<=15;wave++){
   const plan=omegaFieldPlan(20261108,wave);
   const hero=plan.entry;
   const actors=Array.from({length:15},(_,i)=>({
    x:0,y:0,radius:i%2?58:38,isStageBoss:wave===9||wave===15?i===14:false,
   }));
   const positions=omegaStageEncounterPositions(plan,hero,actors);
   expect(positions).toHaveLength(15);
   expect(omegaStageEncounterPositions(plan,hero,actors)).toEqual(positions);
   for(let i=0;i<positions.length;i++){
    const p=positions[i]!,radius=actors[i]!.radius;
    expect(Math.hypot(p.x-hero.x,p.y-hero.y)).toBeGreaterThanOrEqual(182);
    for(const o of plan.obstacles){
     const closestX=Math.max(o.x,Math.min(o.x+o.width,p.x));
     const closestY=Math.max(o.y,Math.min(o.y+o.height,p.y));
     expect(Math.hypot(p.x-closestX,p.y-closestY)).toBeGreaterThanOrEqual(radius+48);
    }
    expect(positions.every((other,j)=>i===j||Math.hypot(p.x-other.x,p.y-other.y)>73)).toBe(true);
   }
  }
 });
 it('does not accept invalid hostile hitboxes or phantom stages',()=>{
  const plan=omegaFieldPlan(20261108,1);
  expect(()=>omegaStageEncounterPositions(plan,{x:NaN,y:0},[])).toThrow(RangeError);
  expect(()=>omegaStageEncounterPositions(plan,plan.entry,[{x:0,y:0,radius:-2}])).toThrow(RangeError);
  expect(()=>omegaStageEncounterPositions(plan,plan.entry,
   Array.from({length:16},()=>({x:0,y:0,radius:12})))).toThrow(RangeError);
 });
});
