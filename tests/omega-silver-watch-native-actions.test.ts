import {describe,expect,it} from 'vitest';
import {OmegaSilverWatchNativeActionTracker} from '../src/ui/omega-silver-watch-native-actions';

type Launch={phase:'launch';kind:'radio'|'grout_slug'|'drone_laser';x:number;y:number};
const sample=(t:OmegaSilverWatchNativeActionTracker,time:number,opts:{
  phase?:string;moving?:boolean;reaction?:number;dashing?:boolean;
  projectiles?:Launch[];playerX?:number;playerY?:number;
}={})=>t.sample({
 time,phase:opts.phase??'playing',
 pose:{moving:opts.moving??false,reaction:opts.reaction??0},
 dashing:opts.dashing??false,
 playerX:opts.playerX??10,playerY:opts.playerY??10,
 projectiles:opts.projectiles??[],
});
describe('REAL SIGNAL WATCH native AIRA action cues (NO painted action frames)',()=>{
 it('reports actual movement but never claims authored action artwork',()=>{
  const t=new OmegaSilverWatchNativeActionTracker();
  const still=sample(t,0);
  expect(still).toEqual({action:'idle',age:0,art:'neutral-original-only'});
  expect(sample(t,.15,{moving:true})).toMatchObject({action:'walk',art:'neutral-original-only'});
  expect(sample(t,.3,{moving:false}).action).toBe('idle');
 });
 it('only native handheld nearby LAUNCH triggers short fire window',()=>{
  const t=new OmegaSilverWatchNativeActionTracker();
  const remote:Launch={phase:'launch',kind:'radio',x:900,y:800};
  expect(sample(t,1,{projectiles:[remote]}).action).toBe('idle');
  const drone:Launch={phase:'launch',kind:'drone_laser',x:10,y:10};
  expect(sample(t,1.1,{projectiles:[drone]}).action).toBe('idle');
  const handheld:Launch={phase:'launch',kind:'grout_slug',x:21,y:12};
  expect(sample(t,2,{projectiles:[handheld]}).action).toBe('fire');
  expect(sample(t,2.07).action).toBe('fire');
  expect(sample(t,2.15).action).toBe('idle');
 });
 it('actual hit overrides dash and firing, then dash overrides fire',()=>{
  const t=new OmegaSilverWatchNativeActionTracker();
  const shot:Launch={phase:'launch',kind:'radio',x:10,y:10};
  expect(sample(t,1,{projectiles:[shot],dashing:true,reaction:1}).action).toBe('hit');
  expect(sample(t,1.01,{dashing:true}).action).toBe('dash');
  expect(sample(t,1.02).action).toBe('fire');
  expect(sample(t,1.20).action).toBe('idle');
 });
 it('does not invent attacks while paused and resets on retry/rewind',()=>{
  const t=new OmegaSilverWatchNativeActionTracker();
  const shot:Launch={phase:'launch',kind:'radio',x:11,y:10};
  expect(sample(t,5,{projectiles:[shot]}).action).toBe('fire');
  expect(sample(t,5.001,{phase:'paused',projectiles:[shot]}).action).toBe('idle');
  expect(sample(t,5.01).action).toBe('idle');
  expect(sample(t,.1,{moving:true}).action).toBe('walk');
  expect(sample(t,.2).action).toBe('idle');
 });
 it('treats nonfinite native times as inactive, never leaking prior events',()=>{
  const t=new OmegaSilverWatchNativeActionTracker();
  const shot:Launch={phase:'launch',kind:'radio',x:10,y:10};
  sample(t,1,{projectiles:[shot]});
  expect(sample(t,NaN).action).toBe('idle');
  expect(sample(t,Infinity).action).toBe('idle');
  expect(sample(t,2).action).toBe('idle');
 });
});
