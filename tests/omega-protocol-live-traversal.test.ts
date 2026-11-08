import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {
 omegaFieldCanInteract,OMEGA_QUARTER_VIEW,type OmegaFieldPoint,
} from '../src/domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../src/domain/omega-protocol-navigation';

const idle={moveX:0,moveY:0,triggerAction:false} as const;

/** Real session.update() and Watch player movement, NEVER teleport to a target.
 * Hazards are cleared artificially here so this test only proves navigable
 * mission traversal. Boss kills/full combat remain separate QA obligations.
 */
function walkAndOperate(s:OmegaProtocolCombatSession,target:OmegaFieldPoint):number{
 const field=s.field;
 if(!field)throw Error('No OMEGA field');
 for(let tick=0;tick<1600;tick++){
  const actor=s.engine.state.player;
  if(omegaFieldCanInteract(actor,target,field.plan.obstacles))return tick;
  const route=omegaFieldNextRoute(actor,target,field.plan.obstacles);
  if(!route)throw Error('No safe path at node '+field.plan.wave+' tick '+tick);
  const dx=route.next.x-actor.x,dy=route.next.y-actor.y;
  const screenDx=dx+OMEGA_QUARTER_VIEW.skewX*dy;
  const screenDy=OMEGA_QUARTER_VIEW.groundYScale*dy;
  const length=Math.hypot(screenDx,screenDy);
  if(length<1e-8)throw Error('Route returned a zero-length segment');
  // Real user controls are screen-relative and analog; decelerate near
  // corner waypoints to avoid tunneling/overshooting into physical cover.
  const analog=Math.min(1,Math.hypot(dx,dy)/16);
  s.update(1/60,{
   moveX:screenDx/length*analog,
   moveY:screenDy/length*analog,
   triggerAction:false,
  });
  if(s.run.phase!=='battle')throw Error('Unexpected battle termination in traversal test');
 }
 throw Error('Player failed to reach node '+field.plan.wave+' target '+JSON.stringify(target));
}

describe('OMEGA actual Watch-engine input-driven mission traversal',()=>{
 it('walks through all 15 nodes/55 event checkpoints without player teleports',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  let interactions=0,frames=0,bosses=0,rewards=0;
  for(let wave=1;wave<=15;wave++){
   expect(s.run.wave).toBe(wave);
   const field=s.field;
   if(!field)throw Error('No field at node '+wave);
   if(s.engine.state.hazards.some(h=>h.isStageBoss))bosses++;
   // Only combat is bypassed here; every subsequent traversal operation
   // uses real input, real position, real collision and the genuine interact().
   s.engine.state.hazards=[];
   s.update(1/60,idle);
   expect(s.field?.progress.phase).toBe('objective');
   for(const step of field.plan.event.steps){
    frames+=walkAndOperate(s,step.target);
    expect(s.interact().success).toBe(true);
    interactions++;
   }
   expect(s.field?.progress.phase).toBe('exit');
   frames+=walkAndOperate(s,field.plan.exit);
   expect(s.interact()).toEqual({success:true,reason:'EXIT_OPENED'});
   interactions++;
   if(s.run.phase==='reward'){
    rewards++;s.selectUpgrade(s.run.offers[0]!);
   }
  }
  expect(interactions).toBe(55);
  expect(bosses).toBe(2);
  expect(rewards).toBe(7);
  expect(frames).toBeGreaterThan(1000);
  expect(s.run).toMatchObject({phase:'victory',victories:15});
 },60000);
});
