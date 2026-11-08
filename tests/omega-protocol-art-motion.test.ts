import {describe,it,expect} from 'vitest';
import {omegaResolveArtAction,OmegaTerminalMotionClock,type OmegaNativeActionSample} from '../src/ui/omega-protocol-art-motion';
import {omegaSpriteFrameForView} from '../src/ui/omega-protocol-art-slot';

const normal:OmegaNativeActionSample={
 gameTime:12,runPhase:'battle',enginePhase:'playing',
 directorShoutTimer:0,isDashing:false,dashRemaining:0,
 hurtRemaining:0,fireUntil:0,
};
const sample=(values:Partial<OmegaNativeActionSample>)=>
 omegaResolveArtAction({...normal,...values});
const view={facingX:1,facingY:0,moving:false,time:12,dashing:false,shooting:false};
describe('OMEGA AIRA 8x20 native action crossfade priority',()=>{
 it('uses only genuine Watch/OMEGA ultimate and victory states',()=>{
  expect(sample({}).action).toBe('walk');
  expect(sample({directorShoutTimer:2})).toMatchObject({action:'ultimate',actionAge:0});
  expect(sample({directorShoutTimer:1.85}).actionAge).toBeCloseTo(.15);
  expect(sample({directorShoutTimer:0}).ultimate).toBe(false);
  expect(sample({enginePhase:'paused',directorShoutTimer:1}).ultimate).toBe(false);
  expect(sample({runPhase:'defeat',directorShoutTimer:1}).ultimate).toBe(false);
  expect(sample({runPhase:'victory',directorShoutTimer:1}).action).toBe('finish');
  expect(sample({gameTime:NaN,fireUntil:12.05}).action).toBe('walk');
 });
 it('resolves finish > ultimate > hit > dash > fire > walk',()=>{
  const fire={fireUntil:12.07};
  expect(sample(fire).action).toBe('fire');
  expect(sample({...fire,isDashing:true,dashRemaining:.2}).action).toBe('dash');
  expect(sample({...fire,isDashing:true,dashRemaining:.2,hurtRemaining:1.92}).action).toBe('hit');
  expect(sample({...fire,isDashing:true,dashRemaining:.2,hurtRemaining:1.92,
   directorShoutTimer:1.9}).action).toBe('ultimate');
  expect(sample({...fire,isDashing:true,dashRemaining:.2,hurtRemaining:1.92,
   directorShoutTimer:1.9,runPhase:'victory'}).action).toBe('finish');
 });
 it('maps native motion frames to the intended independent approved sprite groups',()=>{
  const states=[
   [{},'walk',0],
   [{fireUntil:12.07},'fire',6],
   [{fireUntil:12.07,isDashing:true,dashRemaining:.2},'dash',9],
   [{hurtRemaining:1.93},'hit',12],
   [{directorShoutTimer:2},'ultimate',15],
   [{runPhase:'victory'},'finish',18],
  ] as const;
  for(const [updates,expected,frame] of states){
   const action=sample(updates);
   expect(action.action).toBe(expected);
   const result=omegaSpriteFrameForView({...view,...action});
   expect(result.action).toBe(expected);
   expect(result.frame).toBe(frame);
  }
  const dash=sample({fireUntil:12.07,isDashing:true,dashRemaining:.05});
  expect(dash.action).toBe('dash');
  expect(omegaSpriteFrameForView({...view,...dash}).frame).toBe(11);
 });
 it('rejects an expired launch or fabricated visual ultimate',()=>{
  expect(sample({fireUntil:11.5}).shooting).toBe(false);
  expect(sample({fireUntil:12.07,enginePhase:'paused'}).shooting).toBe(false);
  expect(sample({fireUntil:NaN}).shooting).toBe(false);
  expect(sample({directorShoutTimer:NaN}).ultimate).toBe(false);
  expect(sample({isDashing:true,dashRemaining:0}).dashing).toBe(false);
 });
 it('plays both final poses after Watch gameTime freezes on victory',()=>{
  const clock=new OmegaTerminalMotionClock();
  const samples=[
   [100,18],[100.05,18],[100.13,18],[100.17,19],[101.5,19],
  ] as const;
  for(const [now,expected] of samples){
   const terminalElapsed=clock.advance('victory',now);
   const motion=sample({runPhase:'victory',terminalElapsed});
   // gameTime stays 12 for every sample: presentation clock is separate.
   expect(omegaSpriteFrameForView({...view,...motion}).frame).toBe(expected);
  }
  expect(clock.advance('battle',102)).toBe(0);
  expect(clock.advance('victory',105)).toBe(0);
  expect(clock.advance('victory',105.17)).toBeGreaterThan(.16);
  expect(clock.advance('victory',NaN)).toBe(0);
  expect(clock.advance('victory',104)).toBe(0); // clock rewind resets
 });
 it('avoids conflicting procedural dash/hurt/shoot labels during ultimate or victory',()=>{
  const all={fireUntil:12.07,isDashing:true,dashRemaining:.2,
   hurtRemaining:1.9,directorShoutTimer:1.8};
  const supreme=sample(all);
  expect(supreme).toMatchObject({
   action:'ultimate',shooting:false,dashing:false,hurt:false,ultimate:true,finished:false,
  });
  const terminal=sample({...all,runPhase:'victory',terminalElapsed:.2});
  expect(terminal).toMatchObject({
   action:'finish',shooting:false,dashing:false,hurt:false,ultimate:false,finished:true,
  });
  expect(omegaSpriteFrameForView({...view,...terminal}).frame).toBe(19);
 });

});
