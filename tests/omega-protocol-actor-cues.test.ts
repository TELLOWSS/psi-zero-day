import {describe,it,expect} from 'vitest';
import type {ProjectileFeedback} from '../src/domain/survivors-projectile-feedback';
import {
 OMEGA_EMPTY_FIRE_CUE,OMEGA_ACTOR_FIRE_CUE_MS,
 omegaAdvanceActorFireCue,omegaActorCueActive,
} from '../src/ui/omega-protocol-actor-cues';
import {drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';

const feedback=(
 kind:ProjectileFeedback['kind'],phase:ProjectileFeedback['phase']='launch',angle=0,
):ProjectileFeedback=>({projectileId:'p1',kind,phase,x:10,y:10,angle,radius:2});
const sample=()=>{
 const calls:Array<{method:string,args:unknown[]}>= [];
 const ctx=new Proxy({},{
  get(_target,key){
   return (...args:unknown[])=>{calls.push({method:String(key),args});};
  },
  set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};

describe('OMEGA procedural actor timing follows real Watch projectile release',()=>{
 it('renders handheld muzzle only for fresh real radio/grout launch, not lingering bullets',()=>{
  const initial=omegaAdvanceActorFireCue(OMEGA_EMPTY_FIRE_CUE,[],3);
  expect(omegaActorCueActive(initial,3,true)).toBe(false);
  const drone=omegaAdvanceActorFireCue(initial,[feedback('drone_laser')],3);
  expect(omegaActorCueActive(drone,3,true)).toBe(false);
  const legacy=omegaAdvanceActorFireCue(drone,[feedback('radio','impact')],3);
  expect(omegaActorCueActive(legacy,3,true)).toBe(false);
  const firing=omegaAdvanceActorFireCue(legacy,[feedback('radio','launch')],3);
  expect(omegaActorCueActive(firing,3,true)).toBe(true);
  expect(omegaActorCueActive(firing,3,false)).toBe(false); // paused/terminal
  expect(firing.until).toBeCloseTo(3+OMEGA_ACTOR_FIRE_CUE_MS/1000);
  expect(omegaActorCueActive(firing,firing.until,true)).toBe(false);
  expect(omegaAdvanceActorFireCue(firing,[],firing.until)).toEqual(OMEGA_EMPTY_FIRE_CUE);
  expect(omegaAdvanceActorFireCue(OMEGA_EMPTY_FIRE_CUE,[feedback('shout_shockwave')],4))
   .toEqual(OMEGA_EMPTY_FIRE_CUE);
 });
 it('projects actual world-space shot heading into skewed screen-space directions',()=>{
  const east=omegaAdvanceActorFireCue(OMEGA_EMPTY_FIRE_CUE,[feedback('radio','launch',0)],1);
  const north=omegaAdvanceActorFireCue(east,[feedback('grout_slug','launch',-Math.PI/2)],1.01);
  expect(east.screenX).toBeCloseTo(1);
  expect(east.screenY).toBeCloseTo(0);
  expect(north.screenX).toBeGreaterThan(0); // quarter-view shear
  expect(north.screenY).toBeLessThan(0);
  expect(Math.hypot(north.screenX,north.screenY)).toBeCloseTo(1);
  const ignored=omegaAdvanceActorFireCue(north,[feedback('radio','launch',NaN)],1.03);
  expect(ignored).toEqual(north);
  expect(()=>omegaAdvanceActorFireCue(north,[],NaN)).toThrow(RangeError);
 });
 it('keeps flash tied to attack and draws eight direction-correct weapon angles',()=>{
  const idle=sample(),shoot=sample(),north=sample(),left=sample(),hit=sample();
  const base={facingX:1,facingY:0,moving:false,time:5,dashing:false,shooting:false};
  drawOmegaProtocolActor(idle.ctx,base);
  drawOmegaProtocolActor(shoot.ctx,{...base,shooting:true});
  drawOmegaProtocolActor(north.ctx,{...base,facingX:0,facingY:-1,shooting:true});
  drawOmegaProtocolActor(left.ctx,{...base,facingX:-1,shooting:true});
  drawOmegaProtocolActor(hit.ctx,{...base,moving:true,dashing:true,hurt:true});
  const muzzle=(calls:typeof idle.calls)=>calls.filter(c=>c.method==='arc'&&c.args[2]===5.5).length;
  expect(muzzle(idle.calls)).toBe(0);
  expect(muzzle(shoot.calls)).toBe(1);
  expect(muzzle(north.calls)).toBe(1);
  expect(north.calls.some(c=>c.method==='rotate'&&c.args[0]===-Math.PI/2)).toBe(true);
  expect(left.calls.some(c=>c.method==='scale'&&c.args[0]===-1&&c.args[1]===1)).toBe(true);
  expect(hit.calls.some(c=>c.method==='arc'&&c.args[2]===26)).toBe(true);
  expect(hit.calls.filter(c=>c.method==='lineTo').length).toBeGreaterThan(
   idle.calls.filter(c=>c.method==='lineTo').length);
 });
});
