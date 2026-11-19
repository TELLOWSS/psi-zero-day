import {describe,it,expect} from 'vitest';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_G5E_ART_STATUS,omegaG5eLabRequested,omegaG5eCue,
 OmegaG5eNativeActionFx,
} from '../src/ui/omega-protocol-m12g5e-silver-action-fx';
import {omegaFieldPlan,omegaFieldNativeTerrain} from '../src/domain/omega-protocol-field';

const still=(p:Partial<OmegaActorView>={}):OmegaActorView=>({
 facingX:1,facingY:0,weaponFacingX:1,weaponFacingY:0,
 time:9.5,moving:false,dashing:false,shooting:false,hurt:false,
 actionAge:0,...p,
});
function fakeCtx(){
 const calls:string[]=[];let saves=0,restores=0;
 const hit=(key:string)=>()=>calls.push(key);
 const gradient={addColorStop:()=>calls.push('stop')};
 const ctx={
  canvas:{width:1440,height:900},
  save:()=>{saves++;calls.push('save');},
  restore:()=>{restores++;calls.push('restore');},
  translate:hit('translate'),rotate:hit('rotate'),
  beginPath:hit('beginPath'),arc:hit('arc'),ellipse:hit('ellipse'),
  fill:hit('fill'),stroke:hit('stroke'),fillRect:hit('fillRect'),
  moveTo:hit('moveTo'),lineTo:hit('lineTo'),
  drawImage:hit('drawImage'),
  createRadialGradient:()=>{calls.push('radial');return gradient;},
  createLinearGradient:()=>{calls.push('linear');return gradient;},
 } as unknown as CanvasRenderingContext2D;
 return {ctx,calls,getBalance:()=>saves-restores};
}
describe('M12-G5e native silver AIRA action presentation only — zero new fake painted sprites',()=>{
 it('remains DEVELOPMENT-only and 160/320, human art approval and Production all locked',()=>{
  expect(OMEGA_G5E_ART_STATUS).toMatchObject({
   originalFourWalkWebPs:4,paintedFireFramesApproved:0,
   paintedDashFramesApproved:0,paintedHitFramesApproved:0,
   final160Approved:0,final320MasksApproved:0,productionApproved:false,
  });
  expect(omegaG5eLabRequested('?omegaLab=1&omegaM12G5e=1',true)).toBe(true);
  expect(omegaG5eLabRequested('?omegaLab=1&omegaM12G5e=1',false)).toBe(false);
  for(const url of [
   '?omegaM12G5e=1','?omegaLab=1&omegaM12G5e=yes',
   '?omegaLab=1&omegaM12G5e=1&omegaM12G5d=1',
   '?omegaLab=1&omegaM12G5e=1&omegaSilverPreview=1',
   '?omegaLab=1&omegaM12G5e=1&omegaG5VectorStudy=1',
  ])expect(omegaG5eLabRequested(url,true)).toBe(false);
 });
 it('does not invent fire from idle, old events, other 7 headings or terminal/invalid ages',()=>{
  expect(omegaG5eCue(still(),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,actionAge:.2}),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,actionAge:NaN}),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,actionAge:-1}),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,finished:true}),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,ultimate:true}),109)).toBe(null);
  expect(omegaG5eCue(still({shooting:true,facingX:0,facingY:1}),109)).toBe(null);
  expect(omegaG5eCue(still({dashing:true,facingX:-1,facingY:0}),109)).toBe(null);
  expect(omegaG5eCue(still({hurt:true,facingX:1,facingY:-1}),109)).toBe(null);
  expect(omegaG5eCue(still({hurt:true}),0)).toBe(null);
 });
 it('only actual native-fire, dash or hit state uses short four-PRESENTATION phases, ordered hit > dash > fire',()=>{
  const fire=omegaG5eCue(still({shooting:true,actionAge:.03}),120)!;
  expect(fire.action).toBe('fire');
  expect(fire.recoil).toBeGreaterThan(0);
  expect(fire.muzzleX).toBeGreaterThan(0);
  expect(fire.muzzleY).toBeLessThan(0);
  expect(omegaG5eCue(still({shooting:true,actionAge:.10,weaponFacingX:0,weaponFacingY:1}),120)?.directionRadians)
   .toBeCloseTo(Math.PI/2);
  const dash=omegaG5eCue(still({dashing:true,shooting:true,actionAge:.12}),120);
  expect(dash?.action).toBe('dash');
  const hurt=omegaG5eCue(still({hurt:true,dashing:true,shooting:true,actionAge:.10}),120);
  expect(hurt?.action).toBe('hit');
  expect(omegaG5eCue(still({dashing:true,actionAge:.4}),120)).toBe(null);
  expect(omegaG5eCue(still({hurt:true,actionAge:.36}),120)).toBe(null);
 });
 it('painted original WebP is preserved; real event FX have distinct draw operations, with balanced Canvas contexts',()=>{
  const effects=new OmegaG5eNativeActionFx();
  const {ctx,calls,getBalance}=fakeCtx();
  const image={tagName:'IMG'} as unknown as HTMLImageElement;
  expect(effects.draw(ctx,image,still(),115)).toBe(false);
  expect(calls).toEqual([]);
  expect(effects.draw(ctx,image,still({shooting:true,actionAge:.01}),115)).toBe(true);
  const a=calls.splice(0);
  expect(a).toContain('radial');
  expect(a).toContain('drawImage');
  expect(effects.draw(ctx,image,still({dashing:true,actionAge:.10}),115)).toBe(true);
  const b=calls.splice(0);
  expect(b.filter(k=>k==='drawImage').length).toBe(3);
  expect(b).toContain('linear');
  expect(effects.draw(ctx,image,still({hurt:true,actionAge:.05}),115)).toBe(true);
  const c=calls.splice(0);
  expect(c).toContain('ellipse');
  expect(c).toContain('stroke');
  expect(getBalance()).toBe(0);
  expect(effects.evidence().counts).toEqual({fire:1,dash:1,hit:1});
  effects.reset();
  expect(effects.evidence()).toEqual({
   counts:{fire:0,dash:0,hit:0},frames:{fire:[],dash:[],hit:[]},
  });
 });
 it('uses original Watch geometry and does not mutate any of its native world collision/LOS obstacles',()=>{
  const plan=omegaFieldPlan(20261111,1),physical=JSON.stringify(omegaFieldNativeTerrain(plan));
  const initial=JSON.stringify(plan);
  const {ctx}=fakeCtx();
  const effects=new OmegaG5eNativeActionFx();
  for(let i=0;i<12;i++){
   const p=i%3===0?{shooting:true}:i%3===1?{dashing:true}:{hurt:true};
   effects.draw(ctx,{} as CanvasImageSource,still({...p,actionAge:(i%4)*.03}),126);
  }
  expect(JSON.stringify(plan)).toBe(initial);
  expect(JSON.stringify(omegaFieldNativeTerrain(plan))).toBe(physical);
  expect(effects.evidence().counts.fire).toBeGreaterThan(0);
  expect(effects.evidence().counts.dash).toBeGreaterThan(0);
  expect(effects.evidence().counts.hit).toBeGreaterThan(0);
 });
});
