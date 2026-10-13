import {expect,it} from 'vitest';
import {ATTACK_MOTION,attackEnvelope,projectileAttackMotion} from '../src/ui/survivors-attack-motion';
import {SpriteMotionTracker} from '../src/ui/survivors-sprite-motion';
it('gives each emitted attack a smooth bounded onset and recovery',()=>{
 for(const kind of ['shot','spray','ultimate'] as const){
  const p=ATTACK_MOTION[kind];expect(attackEnvelope(0,kind)).toBe(0);
  expect(attackEnvelope(p.rise,kind)).toBe(p.strength);expect(attackEnvelope(p.duration,kind)).toBe(0);
  for(let t=0;t<p.duration;t+=.001){const a=attackEnvelope(t,kind);expect(a).toBeGreaterThanOrEqual(0);expect(a).toBeLessThanOrEqual(1);expect(Math.abs(attackEnvelope(t+.001,kind)-a)).toBeLessThan(.07);}
 }
 expect(attackEnvelope(NaN)).toBe(0);expect(attackEnvelope(-1)).toBe(0);
});
it('faces a stationary command toward actual emission and keeps travelling feet in their direction',()=>{
 const tracker=new SpriteMotionTracker(),actor={};tracker.sample(actor,0,0,0);
 tracker.act(actor,.1,'shot',Math.PI);const command=tracker.sample(actor,0,0,.125);
 expect(command.direction).toBe(4);expect(command.attackAngle).toBe(Math.PI);
 tracker.act(actor,.2,'shot',Math.PI/2);const moving=tracker.sample(actor,10,0,.225);
 expect(moving.direction).toBe(0);expect(moving.attackAngle).toBe(Math.PI/2);
 expect(tracker.sample(actor,10,0,.225)).toBe(moving);
});
it('does not animate player recoil for autonomous drone or trap emissions',()=>{
 expect(projectileAttackMotion('drone_laser')).toBeUndefined();expect(projectileAttackMotion('cone_trap')).toBeUndefined();
 expect(projectileAttackMotion('radio')).toBe('shot');expect(projectileAttackMotion('cryo_blast')).toBe('spray');expect(projectileAttackMotion('shout_shockwave')).toBe('ultimate');
});
it('deduplicates same-frame signals, reacts to rapid shots and holds while paused',()=>{
 const tracker=new SpriteMotionTracker(),entity={};tracker.act(entity,0,'spray');tracker.act(entity,0);
 const spray=tracker.sample(entity,0,0,.055);expect(spray.action).toBe(.7);
 tracker.sample(entity,0,0,.1);tracker.act(entity,.1);expect(tracker.sample(entity,0,0,.1).action).toBe(0);
 tracker.act(entity,.1);const shot=tracker.sample(entity,0,0,.125);expect(shot.action).toBe(1);
 expect(tracker.sample(entity,0,0,.125)).toEqual(shot);
 tracker.act(entity,.13,'ultimate');expect(tracker.sample(entity,0,0,.175).action).toBeCloseTo(1);
 tracker.act(entity,.2);expect(tracker.sample(entity,0,0,.2).action).toBeCloseTo(attackEnvelope(.07,'ultimate'));
 expect(tracker.sample(entity,0,0,1).action).toBe(0);
});
