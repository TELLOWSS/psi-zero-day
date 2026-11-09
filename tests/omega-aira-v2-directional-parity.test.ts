import {describe,it,expect} from 'vitest';
import {
 omegaAiraV2ArtParity,omegaAiraV2ActionArtParityComplete,
 OMEGA_AIRA_V2_AUTHORED_ACTION_COUNTS,OMEGA_AIRA_V2_AUTHORED_TARGET,
 OMEGA_AIRA_V2_ALL_HEADINGS,OMEGA_AIRA_V2_ACTIONS,
} from '../src/ui/omega-aira-v2-directional-parity';
import {
 omegaAiraDirectionActionPose,omegaAiraV2ActionForView,
 drawOmegaAiraV2DirectionalAction,
} from '../src/ui/omega-aira-v2-directional-action-rig';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

const base:OmegaActorView={
 facingX:1,facingY:0,moving:false,dashing:false,shooting:false,time:1,
 actionAge:.08,
};
const flags={
 fire:{shooting:true},dash:{dashing:true},hit:{hurt:true},
 ultimate:{ultimate:true},finish:{finished:true},
} as const;
const counter=()=>{
 const call:Record<string,unknown[][]>={};
 const ctx=new Proxy({},{
  get(_t,k:string|symbol){
   return (...args:unknown[])=>{(call[String(k)]??=[]).push(args);};
  },set(){return true;},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,call};
};
describe('AIRA V2 eight-heading visual parity — no false complete-art claims',()=>{
 it('reports all 8 original standing views but only E 14 painted action frames of 160',()=>{
  const audit=omegaAiraV2ArtParity();
  expect(audit.directionCount).toBe(8);
  expect(audit.originalNeutralDirections).toBe(8);
  expect(audit.independentlyPaintedFrames).toBe(14);
  expect(audit.targetActionFrames).toBe(160);
  expect(audit.missingActionFrames).toBe(146);
  expect(audit.fullProductionApproved).toBe(false);
  expect(audit.original320MasksApproved).toBe(false);
  expect(Object.values(OMEGA_AIRA_V2_AUTHORED_TARGET)
   .reduce((sum,n)=>sum+n,0)).toBe(20);
  for(const action of OMEGA_AIRA_V2_ACTIONS){
   const info=audit.actions[action];
   expect(info.requiredDirections).toBe(8);
   expect(info.complete).toBe(false);
   expect(omegaAiraV2ActionArtParityComplete(action)).toBe(false);
   expect(info.missing).toContain('N');
   if(action==='walk')expect(info.missing).toHaveLength(8);
   else{
    expect(info.paintedDirections).toBe(1);
    expect(info.missing).toHaveLength(7);
   }
  }
  expect(OMEGA_AIRA_V2_AUTHORED_ACTION_COUNTS.N.fire).toBe(0);
 });
 it('treats each of the eight original headings with five native action poses',()=>{
  for(const heading of OMEGA_AIRA_V2_ALL_HEADINGS){
   for(const action of ['fire','dash','hit','ultimate','finish'] as const){
    const samples=[0,.075,.152].map(t=>omegaAiraDirectionActionPose(heading,action,t));
    expect(samples.map(p=>p.action)).toEqual([action,action,action]);
    expect(samples.map(p=>p.index)).toEqual(action==='ultimate'||action==='finish'?
     [0,0,0]:[0,1,2]);
    expect(samples.every(p=>Number.isFinite(p.lean)&&p.active)).toBe(true);
    expect(new Set(samples.map(p=>JSON.stringify([
     p.lean,p.rise,p.backX,p.leftLift,p.rightLift,p.leftStride,
     p.rightStride,p.hairLag,
    ]))).size).toBeGreaterThanOrEqual(action==='ultimate'||action==='finish'?1:3);
   }
  }
 });
 it('prioritizes genuine completed/ultimate/hit/dash/fire cues, never fabricates idle combat',()=>{
  expect(omegaAiraV2ActionForView(base)).toBe(null);
  expect(omegaAiraV2ActionForView({...base,shooting:true})).toBe('fire');
  expect(omegaAiraV2ActionForView({...base,shooting:true,dashing:true})).toBe('dash');
  expect(omegaAiraV2ActionForView({...base,dashing:true,hurt:true})).toBe('hit');
  expect(omegaAiraV2ActionForView({...base,hurt:true,ultimate:true})).toBe('ultimate');
  expect(omegaAiraV2ActionForView({...base,finished:true,ultimate:true})).toBe('finish');
 });
 it('draws individual heading images with no flips and a world-foot-anchored upper-body transform',()=>{
  for(const heading of OMEGA_AIRA_V2_ALL_HEADINGS){
   for(const action of Object.keys(flags) as Array<keyof typeof flags>){
    const view={...base,...flags[action],actionAge:action==='ultimate'?.8:action==='finish'?.6:.09};
    const {ctx,call}=counter();
    const img={heading} as unknown as HTMLImageElement;
    expect(drawOmegaAiraV2DirectionalAction(ctx,img,heading,view,136)).toBe(true);
    expect(call.drawImage).toHaveLength(3);
    // The actual original image for that heading is used across all 3 layers.
    expect(call.drawImage.every(args=>args[0]===img)).toBe(true);
    expect(call.scale).toEqual([[136/336,136/336]]);
    // Feet are layered first; each source region uses its own half of
    // the correct original direction image, not a mirrored left sprite.
    expect(call.drawImage[0]?.slice(1,5)).toEqual([0,179,96,157]);
    expect(call.drawImage[1]?.slice(1,5)).toEqual([96,179,96,157]);
    expect(call.drawImage[2]?.slice(1,5)).toEqual([0,0,192,198]);
    expect(call.scale.every(v=>v.every(n=>typeof n==='number'&&n>0))).toBe(true);
    expect(call.save).toHaveLength(call.restore?.length??0);
   }
  }
 });
 it('fails closed on missing/expired/invalid action without any painting',()=>{
  for(const age of [NaN,Infinity,-1]){
   const {ctx,call}=counter();
   expect(drawOmegaAiraV2DirectionalAction(ctx,{} as HTMLImageElement,
    'NE',{...base,shooting:true,actionAge:age},136)).toBe(false);
   expect(Object.keys(call)).toHaveLength(0);
  }
  const {ctx,call}=counter();
  expect(drawOmegaAiraV2DirectionalAction(ctx,{} as HTMLImageElement,
   'E',base,136)).toBe(false);
  expect(drawOmegaAiraV2DirectionalAction(ctx,{} as HTMLImageElement,
   'E',{...base,...flags.fire},0)).toBe(false);
  expect(Object.keys(call)).toHaveLength(0);
 });
});
