import {describe,it,expect} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {omegaCreateZombieBrain} from '../src/domain/omega-protocol-zombie-ai';
import {
 omegaCounterplayCues,omegaNearestCounterplayCue,omegaDashAvailability,
} from '../src/ui/omega-protocol-counterplay';

const hazard=(id:string,type:Hazard['type']):Hazard=>({
 id,type,x:200,y:320,hp:100,maxHp:100,speed:180,radius:18,damage:22,expValue:3,
});
describe('OMEGA M04-D5 presentation-only counterplay',()=>{
 it('exposes actual native cart warning direction/timer without inventing an attack',()=>{
  const cart=hazard('cart','RUNAWAY_CART');
  cart.motion={phase:'warning',timer:.47,directionX:.6,directionY:-.8};
  const cues=omegaCounterplayCues([cart],()=>null);
  expect(cues).toHaveLength(1);
  expect(cues[0]).toMatchObject({
   id:'cart',kind:'cart',phase:'warning',seconds:.47,
   directionX:.6,directionY:-.8,label:'폭주 운반장비 돌진',
  });
  cart.motion.phase='charge';cart.motion.timer=.6;
  expect(omegaCounterplayCues([cart],()=>null)[0]?.phase).toBe('charge');
  expect(omegaCounterplayCues([cart],()=>null)[0]?.seconds).toBe(0);
  cart.motion.phase='cooldown';
  expect(omegaCounterplayCues([cart],()=>null)).toHaveLength(0);
 });
 it('fails closed for approach, un-locked heading, defeated targets',()=>{
  const cart=hazard('cart','RUNAWAY_CART');
  cart.motion={phase:'warning',timer:.9,directionX:0,directionY:0};
  expect(omegaCounterplayCues([cart],()=>null)).toHaveLength(0);
  cart.motion.phase='approach';cart.motion.directionX=1;
  expect(omegaCounterplayCues([cart],()=>null)).toHaveLength(0);
  cart.motion.phase='warning';cart.hp=0;
  expect(omegaCounterplayCues([cart],()=>null)).toHaveLength(0);
 });
 it('reads distinct actual infected warning/charge brains; no normal human target',()=>{
  const zombie=hazard('infected','UNHELMETED');
  const brain=omegaCreateZombieBrain(zombie,'sprinter',0);
  brain.phase='warning';brain.timer=.31;brain.lockedX=0;brain.lockedY=1;
  expect(omegaCounterplayCues([zombie],id=>id==='infected'?brain:null)[0]).toMatchObject({
   kind:'zombie',label:'질주 감염체 돌진',seconds:.31,
   directionX:0,directionY:1,directionLength:150,
  });
  brain.phase='charge';
  expect(omegaCounterplayCues([zombie],()=>brain)[0]?.phase).toBe('charge');
  brain.phase='recovery';
  expect(omegaCounterplayCues([zombie],()=>brain)).toHaveLength(0);
  const drifter=omegaCreateZombieBrain(zombie,'drifter',0);
  drifter.phase='warning';drifter.lockedX=1;drifter.lockedY=0;
  expect(omegaCounterplayCues([zombie],()=>drifter)[0]?.directionLength).toBe(0);
 });
 it('ranks active charge before far warnings and uses native dash cooldown',()=>{
  const near=hazard('near','RUNAWAY_CART'),far=hazard('far','RUNAWAY_CART');
  near.x=180;near.motion={phase:'warning',timer:.2,directionX:1,directionY:0};
  far.x=580;far.motion={phase:'charge',timer:.9,directionX:-1,directionY:0};
  const selected=omegaNearestCounterplayCue(
   omegaCounterplayCues([near,far],()=>null),{x:200,y:320});
  expect(selected?.id).toBe('far');
  expect(omegaDashAvailability({dashCooldown:0,isDashing:false})).toMatchObject({ready:true,label:'회피 가능'});
  expect(omegaDashAvailability({dashCooldown:1.25,isDashing:false})).toMatchObject({ready:false,label:'회피 1.3초 후'});
  expect(omegaDashAvailability({dashCooldown:2,isDashing:true}).label).toBe('회피 중');
 });
});
