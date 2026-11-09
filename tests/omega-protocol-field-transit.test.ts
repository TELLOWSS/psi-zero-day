import {describe,it,expect} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaGateTransitLink,omegaGateTransitStart,omegaGateTransitArrive,
 omegaGateTransitStep,omegaActBoundaryDock,
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
 it('M04-B: first ACT lift has exactly one matching 3→4 link and dock-foot collision coordinates',()=>{
  const p3=omegaFieldPlan(20261109,3),p4=omegaFieldPlan(20261109,4);
  const exit=omegaActBoundaryDock(p3)!,entry=omegaActBoundaryDock(p4)!;
  const link=omegaGateTransitLink(p3,p4);
  expect(exit).toMatchObject({role:'departure',kind:'scaffold_lift',
   point:p3.exit,fromWave:3,toWave:4,verticalMeters:18});
  expect(entry).toMatchObject({role:'arrival',kind:'scaffold_lift',
   point:p4.entry,fromWave:3,toWave:4,verticalMeters:18});
  expect(exit.linkId).toBe(entry.linkId);
  expect(exit.linkId).toBe(link.linkId);
  expect(link.departure).toEqual(exit.point);
  expect(link.arrival).toEqual(entry.point);
  expect(omegaActBoundaryDock(omegaFieldPlan(20261109,2))).toBeNull();
  expect(omegaActBoundaryDock(omegaFieldPlan(20261109,5))).toBeNull();
  for(const [from,to,kind] of [[6,7,'crane_elevator'],[9,10,'service_tunnel'],
   [12,13,'control_airlock']] as const){
   const source=omegaActBoundaryDock(omegaFieldPlan(20261109,from))!;
   const dest=omegaActBoundaryDock(omegaFieldPlan(20261109,to))!;
   expect(source.linkId).toBe(dest.linkId);
   expect(source.kind).toBe(kind);
  }
 });
 it('M04-B: real 3→4 lift retains old exit during departure then enters sector-2 at the true entry',()=>{
  const s=new OmegaProtocolCombatSession(20261109,50,false,{
   fieldTraversal:true,gateTransition:true,qaGateTravel:true,
  });
  for(let wave=1;wave<=3;wave++){
   expect(s.field?.plan.wave).toBe(wave);
   const exit=s.field!.plan.exit;
   // Unit test prepares a known in-range player state; browser QA separately
   // proves ALL 3 exits by genuine keyboard/touch movement.
   s.engine.state.player.x=exit.x-50;s.engine.state.player.y=exit.y;
   expect(s.interact()).toEqual({success:true,reason:'EXIT_OPENED'});
   if(wave===3){
    const depart=s.snapshot.gateTransit!;
    expect(depart).toMatchObject({phase:'depart',
     link:{fromWave:3,toWave:4,kind:'scaffold_lift'}});
    expect(s.field?.plan.wave).toBe(3);
    expect(s.run.wave).toBe(3);
    expect(s.blade()).toBeNull();
    expect(s.interact().success).toBe(false);
   }
   advance(s,15);
   if(s.run.phase==='reward'){
    s.selectUpgrade(s.run.offers[0]!);
   }
   if(wave===3){
    expect(s.field?.plan.wave).toBe(4);
    expect(s.field?.plan.sector).toBe(2);
    expect(s.snapshot.gateTransit?.phase).toBe('arrive');
    expect(s.snapshot.gateTransit?.link.kind).toBe('scaffold_lift');
    expect(s.engine.state.player.x).toBe(s.field!.plan.entry.x);
    expect(s.engine.state.player.y).toBe(s.field!.plan.entry.y);
    expect(omegaActBoundaryDock(s.field!.plan)?.role).toBe('arrival');
   }
   advance(s,14);
   expect(s.snapshot.gateTransit).toBeNull();
  }
  expect(s.run.wave).toBe(4);
  expect(s.run.victories).toBe(3);
  expect(s.run.phase).toBe('battle');
 });

});
