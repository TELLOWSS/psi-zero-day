import {describe,it,expect} from 'vitest';
import {OmegaActorFacingController} from '../src/ui/omega-protocol-action-facing';
import {OMEGA_EMPTY_FIRE_CUE} from '../src/ui/omega-protocol-actor-cues';
import {omegaFieldHeading,drawOmegaProtocolActor} from '../src/ui/omega-protocol-actor-render';

const playing={dashing:false,hurting:false,playing:true};
const cue=(x:number,y:number,until:number)=>({screenX:x,screenY:y,until});
const heading=(bodyX:number,bodyY:number)=>omegaFieldHeading(bodyX,bodyY);

describe('OMEGA action-facing without altering Watch physics or fire rate',()=>{
 it('turns through bounded 8-way headings instead of instant 180-degree flips',()=>{
  const c=new OmegaActorFacingController();
  const start=c.advance(0,{x:1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(heading(start.bodyX,start.bodyY)).toBe('E');
  const first=c.advance(.016,{x:-1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(heading(first.bodyX,first.bodyY)).not.toBe('W');
  expect(first.shooting).toBe(false);
  let last=first;
  for(let i=2;i<=40;i++)
   last=c.advance(i*.016,{x:-1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(heading(last.bodyX,last.bodyY)).toBe('W');
 });
 it('locks torso direction during real dash/hit but keeps the genuine shot bearing',()=>{
  const c=new OmegaActorFacingController();
  c.advance(0,{x:1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  const before=c.advance(.02,{x:1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  const whileDashing=c.advance(.04,{x:-1,y:0},cue(-1,0,.1),{
   ...playing,dashing:true,
  });
  expect(whileDashing.headingIndex).toBe(before.headingIndex);
  expect(whileDashing.weaponX).toBe(-1);
  expect(whileDashing.shooting).toBe(true);
  const whileHurt=c.advance(.06,{x:-1,y:0},cue(-1,0,.11),{
   ...playing,hurting:true,
  });
  expect(whileHurt.headingIndex).toBe(before.headingIndex);
  const recovery=c.advance(.08,{x:-1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(recovery.headingIndex).toBe(before.headingIndex);
  expect(recovery.shooting).toBe(false);
 });
 it('holds 8-way pose near sector boundaries to avoid heading flicker',()=>{
  const c=new OmegaActorFacingController();
  c.advance(0,{x:1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  const vector=(angle:number)=>({x:Math.cos(angle),y:Math.sin(angle)});
  let last=c.advance(.05,vector(.41),OMEGA_EMPTY_FIRE_CUE,playing);
  expect(last.headingIndex).toBe(0);
  last=c.advance(.1,vector(.46),OMEGA_EMPTY_FIRE_CUE,playing);
  expect(last.headingIndex).toBe(0);
  last=c.advance(.15,vector(.56),OMEGA_EMPTY_FIRE_CUE,playing);
  expect(last.headingIndex).toBe(1);
  for(const [i,angle] of [.47,.43,.48,.42].entries()){
   last=c.advance(.2+i*.05,vector(angle),OMEGA_EMPTY_FIRE_CUE,playing);
   expect(last.headingIndex).toBe(1);
  }
 });
 it('does not fabricate a weapon shot during pause or after actual cue expiry',()=>{
  const c=new OmegaActorFacingController();
  c.advance(0,{x:0,y:1},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(c.advance(.05,{x:0,y:1},cue(1,0,.06),{...playing,playing:false})
   .shooting).toBe(false);
  expect(c.advance(.06,{x:0,y:1},cue(1,0,.06),playing).shooting).toBe(false);
  expect(c.advance(.08,{x:NaN,y:Infinity},OMEGA_EMPTY_FIRE_CUE,playing)
   .headingIndex).toBe(2);
  expect(c.advance(.09,{x:0,y:1},cue(0,0,.2),playing)
   .shooting).toBe(false);
  const reset=c.advance(NaN,{x:1,y:0},OMEGA_EMPTY_FIRE_CUE,playing);
  expect(reset.headingIndex).toBe(2);
 });
 it('keeps muzzle pointed exactly at real east shot even as body faces west',()=>{
  const c=new OmegaActorFacingController();
  const body=c.advance(0,{x:-1,y:0},cue(1,0,.2),playing);
  expect(heading(body.bodyX,body.bodyY)).toBe('W');
  expect(body.weaponX).toBe(1);
  const rotations:number[]=[];
  const ctx=new Proxy({},{
   get(_target,key){return (...args:unknown[])=>{
    if(key==='rotate')rotations.push(args[0] as number);
   };},
   set(){return true;},
  }) as unknown as CanvasRenderingContext2D;
  drawOmegaProtocolActor(ctx,{
   facingX:body.bodyX,facingY:body.bodyY,
   weaponFacingX:body.weaponX,weaponFacingY:body.weaponY,
   moving:false,time:0,dashing:false,shooting:body.shooting,
  });
  // Renderer now rotates the kinetic torso and the independently aimed
  // weapon. The final transform, NOT the first torso transform, is the real
  // Watch fire bearing (east shot while AIRA's body is facing west).
  expect(rotations).toHaveLength(2);
  expect(Math.abs(rotations[0]!)).toBeLessThan(.4);
  expect(Math.abs(rotations.at(-1)!)).toBeCloseTo(Math.PI);
 });
});
