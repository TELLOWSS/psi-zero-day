import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import type {Hazard} from '../src/domain/patrol-survivors';

const idle={moveX:0,moveY:0,triggerAction:false} as const;
function cartFixture(protocol:boolean,phase:'warning'|'charge'|'cooldown'|'approach'){
 const omega=new OmegaProtocolCombatSession(20261110,50);
 const state=omega.engine.state;
 const cart=state.hazards.find(h=>h.type==='RUNAWAY_CART');
 if(!cart)throw Error('No genuine native WATCH cart was spawned');
 const x=state.player.x,y=state.player.y;
 state.hazards=[cart];
 state.projectiles=[];
 state.drops=[];
 state.activePerks.radio_boost=0;
 state.player.hp=100;state.player.maxHp=100;state.player.invincibleTime=0;
 cart.x=x+8;cart.y=y;cart.speed=0;cart.isStunned=0;cart.vx=0;cart.vy=0;
 cart.motion={phase,timer:.8,directionX:1,directionY:0};
 if(protocol)return {engine:omega.engine,update:()=>omega.update(1/60,idle),cart};
 const watch=new SurvivorsEngine(createInitialSurvivorsState(),20261110);
 watch.start();
 const original=watch.state;
 original.hazards=[{...cart,motion:{...cart.motion}} as Hazard];
 original.projectiles=[];
 original.drops=[];
 original.player.x=x;original.player.y=y;
 original.player.hp=100;original.player.invincibleTime=0;
 original.activePerks.radio_boost=0;
 return {engine:watch,update:()=>watch.update(1/60,idle),cart:original.hazards[0]!};
}

describe('M04-D6 real native cart contact vs on-screen locked warning',()=>{
 it('never damages OMEGA player during actual native cart WARNING collision window',()=>{
  const session=cartFixture(true,'warning');
  const before=session.engine.state.player.hp;
  session.update();
  expect(session.cart.motion?.phase).toBe('warning');
  expect(session.engine.state.player.hp).toBe(before);
  expect(session.engine.state.lastDamage?.source).not.toBe('RUNAWAY_CART');
  expect(session.engine.state.player.invincibleTime).toBe(0);
 });
 it('deals genuine native damage during OMEGA cart CHARGE when not dodging',()=>{
  const session=cartFixture(true,'charge');
  session.update();
  expect(session.engine.state.player.hp).toBe(78);
  expect(session.engine.state.lastDamage?.source).toBe('RUNAWAY_CART');
 });
 it('does not grant pre-warning invulnerability or damage in approach/recovery',()=>{
  for(const phase of ['approach','cooldown'] as const){
   const session=cartFixture(true,phase);
   const before=session.engine.state.player.hp;
   session.update();
   expect(session.engine.state.player.hp).toBe(before);
   expect(session.engine.state.player.invincibleTime).toBe(0);
  }
 });
 it('preserves OMEGA native dash invulnerability on CHARGE',()=>{
  const session=cartFixture(true,'charge');
  session.engine.state.player.isDashing=true;
  session.engine.state.player.dashDuration=.2;
  session.engine.state.player.invincibleTime=.28;
  session.update();
  expect(session.engine.state.player.hp).toBe(100);
 });
 it('does not rewrite original standard WATCH cart collision policy',()=>{
  const session=cartFixture(false,'warning');
  session.update();
  expect(session.engine.state.player.hp).toBeLessThan(100);
  expect(session.engine.state.lastDamage?.source).toBe('RUNAWAY_CART');
 });
});
