import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaGateTransitLink,omegaGateTransitStart,omegaGateTransitArrive,
 omegaGateTransitStep,
} from '../src/domain/omega-protocol-field-transit';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const idle={moveX:0,moveY:0,triggerAction:false} as const;
const advance=(s:OmegaProtocolCombatSession,frames:number)=>{
 for(let i=0;i<frames;i++)s.update(.05,idle);
};
describe('M04 physically entered quarantine passage: deterministic real field handoff',()=>{
 it('joins only adjacent world nodes, uses meaningful real gate types at act boundaries',()=>{
  const a=omegaFieldPlan(88,1),b=omegaFieldPlan(88,2);
  expect(omegaGateTransitLink(a,b)).toMatchObject({
   fromWave:1,toWave:2,fromSector:1,toSector:1,kind:'cargo_door',
  });
  const bridges=[
   [3,4,'scaffold_lift'],[6,7,'crane_elevator'],
   [9,10,'service_tunnel'],[12,13,'control_airlock'],
  ] as const;
  for(const [from,to,kind] of bridges)
   expect(omegaGateTransitLink(omegaFieldPlan(88,from),
    omegaFieldPlan(88,to)).kind).toBe(kind);
  expect(()=>omegaGateTransitLink(a,omegaFieldPlan(88,3))).toThrow();
  expect(()=>omegaGateTransitLink(omegaFieldPlan(88,15),a)).toThrow();
 });
 it('closes the old scene before reopening the new scene at the native gate',()=>{
  const link=omegaGateTransitLink(omegaFieldPlan(1,1),omegaFieldPlan(1,2));
  const start=omegaGateTransitStart(link);
  expect(start.opacity).toBe(0);
  expect(start.phase).toBe('depart');
  let s=start;
  for(let i=0;i<15;i++)s=omegaGateTransitStep(s,.05).next;
  expect(s.opacity).toBeCloseTo(1);
  expect(omegaGateTransitStep(s,0).complete).toBe(true);
  s=omegaGateTransitArrive(link);
  for(let i=0;i<14;i++)s=omegaGateTransitStep(s,.05).next;
  expect(s.phase).toBe('arrive');
  expect(s.opacity).toBeCloseTo(0);
  expect(omegaGateTransitStep(s,0).complete).toBe(true);
  expect(()=>omegaGateTransitStep(start,-1)).toThrow();
 });
 it('does not leave the old world on E unless the exit gate is really in range',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true,qaGateTravel:true,
  });
  expect(s.field?.progress.phase).toBe('exit');
  expect(s.run.wave).toBe(1);
  expect(s.interact()).toEqual({success:false,reason:'OUT_OF_RANGE'});
  expect(s.snapshot.gateTransit).toBeNull();
  const exit=s.field!.plan.exit;
  s.engine.state.player.x=exit.x-55;s.engine.state.player.y=exit.y;
  const first=s.interact();
  expect(first).toEqual({success:true,reason:'EXIT_OPENED'});
  expect(s.run.wave).toBe(1); // field stays present while shutter CLOSES
  expect(s.field?.plan.wave).toBe(1);
  expect(s.snapshot.gateTransit?.phase).toBe('depart');
  expect(s.interact().success).toBe(false);
  expect(s.blade()).toBeNull();
  advance(s,15);
  expect(s.run.wave).toBe(2);
  expect(s.field?.plan.wave).toBe(2);
  expect(s.snapshot.gateTransit?.phase).toBe('arrive');
  expect(s.engine.state.player.x).toBe(s.field!.plan.exit.x-190);
  advance(s,14);
  expect(s.snapshot.gateTransit).toBeNull();
  expect(s.run.phase).toBe('battle');
 });
 it('passes two actual exits consecutively, retaining mandatory run-only safe-room upgrade after the second',()=>{
  const s=new OmegaProtocolCombatSession(373737,50,false,{
   fieldTraversal:true,gateTransition:true,qaGateTravel:true,
  });
  const reachGate=()=>{
   const exit=s.field!.plan.exit;
   s.engine.state.player.x=exit.x-50;s.engine.state.player.y=exit.y;
   expect(s.interact()).toEqual({success:true,reason:'EXIT_OPENED'});
   advance(s,15);
  };
  reachGate();
  expect(s.run.wave).toBe(2);
  advance(s,14);
  reachGate();
  expect(s.run).toMatchObject({wave:3,phase:'reward',victories:2});
  expect(s.snapshot.gateTransit).toBeNull();
  expect(s.field?.plan.wave).toBe(2); // reward is a gate safe-room
  const offer=s.run.offers[0]!;
  s.selectUpgrade(offer);
  expect(s.run.wave).toBe(3);
  expect(s.field?.plan.wave).toBe(3);
  expect(s.snapshot.gateTransit?.phase).toBe('arrive');
  advance(s,14);
  expect(s.snapshot.gateTransit).toBeNull();
 });
 it('normal OMEGA requires all native enemies and event steps, even if portal transitions are enabled',()=>{
  const s=new OmegaProtocolCombatSession(1919,50,false,{
   fieldTraversal:true,gateTransition:true,
  });
  expect(s.field?.progress.phase).toBe('combat');
  expect(s.engine.state.hazards.some(h=>h.hp>0)).toBe(true);
  expect(s.interact()).toEqual({success:false,reason:'NOT_READY'});
  expect(s.snapshot.gateTransit).toBeNull();
 });
});
