import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

describe('OMEGA opt-in gun control',()=>{
 it('waits for the manual trigger, aims along the last movement and stops on release',()=>{
  const session=new OmegaProtocolCombatSession(9182,50);
  const input={moveX:1,moveY:0,protocolGunMode:'manual' as const};
  for(let i=0;i<90;i++)session.update(1/60,{...input,triggerAction:false});
  expect(session.engine.drainProjectileFeedback().filter(e=>e.kind==='radio'&&e.phase==='launch')).toHaveLength(0);
  for(let i=0;i<60;i++)session.update(1/60,{...input,moveX:0,triggerAction:true});
  const shots=session.engine.drainProjectileFeedback().filter(e=>e.kind==='radio'&&e.phase==='launch');
  expect(shots.length).toBeGreaterThan(0);
  expect(Math.abs(shots[0]!.angle)).toBeLessThan(.1);
  for(let i=0;i<90;i++)session.update(1/60,{...input,moveX:0,triggerAction:false});
  expect(session.engine.drainProjectileFeedback().filter(e=>e.kind==='radio'&&e.phase==='launch')).toHaveLength(0);
 });
 it('keeps the evolved satellite shot behind the manual trigger too',()=>{
  const session=new OmegaProtocolCombatSession(9182,50);
  session.engine.state.activePerks.satellite_broadcast=1;
  for(let i=0;i<120;i++)session.update(1/60,{moveX:0,moveY:0,protocolGunMode:'manual',triggerAction:false});
  expect(session.engine.drainProjectileFeedback().filter(e=>e.kind==='satellite_wave'&&e.phase==='launch')).toHaveLength(0);
  for(let i=0;i<60;i++)session.update(1/60,{moveX:0,moveY:0,protocolGunMode:'manual',triggerAction:true});
  expect(session.engine.drainProjectileFeedback().some(e=>e.kind==='satellite_wave'&&e.phase==='launch')).toBe(true);
 });
 it('allows the explicitly selected automatic mode to shoot without trigger input',()=>{
  const session=new OmegaProtocolCombatSession(9182,50);
  for(let i=0;i<120;i++)session.update(1/60,{moveX:0,moveY:0,protocolGunMode:'auto',triggerAction:false});
  expect(session.engine.drainProjectileFeedback().some(e=>e.kind==='radio'&&e.phase==='launch')).toBe(true);
 });
});
