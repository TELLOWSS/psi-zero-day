import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaArtAction} from './omega-protocol-art-motion';

/**
 * Real 8-way AIRA V2 IMAGE-BASED action motion: uses a DIFFERENT ORIGINAL
 * neutral illustration for each real heading. This is a technical cutout
 * bridge, not fake artist-painted action frames and not 160-frame approval.
 *
 * Transform upper silhouette about the waist and lower limbs about the hips.
 * No left/right sprite mirroring or changes to Watch collision / projectiles.
 * Its foot/world pivot remains (0,0) at the actor's real native XY.
 */
type CutoutAction=Exclude<OmegaArtAction,'walk'>;
const width=192,height=336,hipY=179,torsoOverlap=198;
const hipXLeft=70,hipXRight=121;
const duration:Readonly<Record<CutoutAction,number>>={
 fire:.165,dash:.22,hit:.18,ultimate:2,finish:1,
};
type ActionKey=Readonly<{
 lean:number;rise:number;backX:number;leftLift:number;rightLift:number;
 leftStride:number;rightStride:number;hairLag:number;
}>;
export interface OmegaAiraDirectionActionPose extends ActionKey{
 readonly action:CutoutAction;
 readonly direction:OmegaHeading;
 readonly index:number;
 readonly active:boolean;
}
/** Small perspective coefficients preserve source identity and feel alike
 * from all eight headings without falsely mirroring the source PNGs. */
const bearing:Readonly<Record<OmegaHeading,Readonly<{
 lean:number;mass:number;hair:number;
}>>>={
 E:{lean:-.008,mass:1.04,hair:1},
 SE:{lean:-.005,mass:1.0,hair:1.03},
 S:{lean:0,mass:.95,hair:.96},
 SW:{lean:.005,mass:1.0,hair:.99},
 W:{lean:.008,mass:1.04,hair:1},
 NW:{lean:.008,mass:1,hair:1.03},
 N:{lean:0,mass:.94,hair:.97},
 NE:{lean:-.008,mass:1,hair:1.03},
};
const keys:Readonly<Record<CutoutAction,readonly ActionKey[]>>={
 fire:[
  {lean:-.035,rise:0,backX:-2,leftLift:0,rightLift:0,leftStride:0,rightStride:0,hairLag:1},
  {lean:-.11,rise:2,backX:-5,leftLift:0,rightLift:0,leftStride:1,rightStride:-1,hairLag:5},
  {lean:.018,rise:1,backX:-1,leftLift:0,rightLift:0,leftStride:0,rightStride:0,hairLag:-2},
 ],
 dash:[
  {lean:.16,rise:5,backX:1,leftLift:1,rightLift:0,leftStride:5,rightStride:-5,hairLag:9},
  {lean:.29,rise:9,backX:4,leftLift:13,rightLift:0,leftStride:11,rightStride:-9,hairLag:16},
  {lean:.10,rise:3,backX:0,leftLift:0,rightLift:5,leftStride:-5,rightStride:5,hairLag:5},
 ],
 hit:[
  {lean:-.11,rise:1,backX:-2,leftLift:0,rightLift:0,leftStride:0,rightStride:0,hairLag:5},
  {lean:.19,rise:9,backX:4,leftLift:0,rightLift:1,leftStride:2,rightStride:-1,hairLag:-9},
  {lean:-.035,rise:2,backX:-1,leftLift:0,rightLift:0,leftStride:0,rightStride:0,hairLag:2},
 ],
 ultimate:[
  {lean:-.09,rise:2,backX:-2,leftLift:0,rightLift:0,leftStride:-4,rightStride:3,hairLag:3},
  {lean:-.17,rise:-8,backX:-2,leftLift:1,rightLift:1,leftStride:-10,rightStride:9,hairLag:11},
  {lean:.09,rise:-4,backX:2,leftLift:1,rightLift:1,leftStride:-7,rightStride:6,hairLag:15},
 ],
 finish:[
  {lean:-.14,rise:-2,backX:-2,leftLift:0,rightLift:0,leftStride:3,rightStride:-3,hairLag:3},
  {lean:.07,rise:-8,backX:1,leftLift:0,rightLift:0,leftStride:-3,rightStride:3,hairLag:9},
 ],
};
const pick=(action:CutoutAction,age:number):number=>{
 const count=keys[action].length;
 const safe=Math.max(0,Math.min(duration[action],age));
 return Math.min(count-1,Math.floor((safe/duration[action])*count));
};
/** Sub-frame ease between individually authored TECHNICAL skeleton keys.
 * This does not fabricate new painted source frames and never edits input
 * images; it prevents abrupt one-frame body jumps on 60Hz and 120Hz devices.
 */
const blend=(a:number,b:number,t:number)=>a+(b-a)*t;
const interpolate=(action:CutoutAction,age:number):ActionKey=>{
 const source=keys[action];
 const scaled=Math.min(source.length-1,Math.max(0,age)/duration[action]*source.length);
 const lower=Math.floor(scaled),upper=Math.min(source.length-1,lower+1);
 const frac=scaled-lower,ease=frac*frac*(3-2*frac);
 const from=source[lower]!,to=source[upper]!;
 return {
  lean:blend(from.lean,to.lean,ease),
  rise:blend(from.rise,to.rise,ease),
  backX:blend(from.backX,to.backX,ease),
  leftLift:blend(from.leftLift,to.leftLift,ease),
  rightLift:blend(from.rightLift,to.rightLift,ease),
  leftStride:blend(from.leftStride,to.leftStride,ease),
  rightStride:blend(from.rightStride,to.rightStride,ease),
  hairLag:blend(from.hairLag,to.hairLag,ease),
 };
};
export function omegaAiraDirectionActionPose(
 heading:OmegaHeading,action:CutoutAction,age:number,
):OmegaAiraDirectionActionPose{
 const safe=Number.isFinite(age)?Math.max(0,age):0;
 const index=pick(action,safe);
 const k=interpolate(action,safe);
 const h=bearing[heading];
 return {
  direction:heading,action,index,
  lean:(k.lean+h.lean)*h.mass,
  rise:k.rise,
  backX:k.backX,
  leftLift:k.leftLift,
  rightLift:k.rightLift,
  leftStride:k.leftStride,
  rightStride:k.rightStride,
  hairLag:k.hairLag*h.hair,
  active:Number.isFinite(age)&&age>=0&&age<=duration[action],
 };
}
export function omegaAiraV2ActionForView(view:OmegaActorView):CutoutAction|null{
 if(view.finished)return 'finish';
 if(view.ultimate)return 'ultimate';
 if(view.hurt)return 'hit';
 if(view.dashing)return 'dash';
 if(view.shooting)return 'fire';
 return null;
}
function drawFoot(
 ctx:CanvasRenderingContext2D,img:CanvasImageSource,
 side:'left'|'right',lift:number,stride:number,
):void{
 const sx=side==='left'?0:width/2;
 const hip=side==='left'?hipXLeft:hipXRight;
 const pull=(side==='left'?1:-1)*Math.min(.18,Math.abs(stride)*.012);
 ctx.save();
 ctx.translate(hip+stride,hipY-lift);
 ctx.rotate(pull);
 ctx.translate(-hip,-hipY);
 ctx.drawImage(img,sx,hipY,width/2,height-hipY,
  sx,hipY,width/2,height-hipY);
 ctx.restore();
}
/** Draws a native-action-only cutout rig from heading's own original WebP.
 * Caller is at actual native player XY. Returns false if no action/invalid
 * age; caller retains original neutral pose in that case.
 */
export function drawOmegaAiraV2DirectionalAction(
 ctx:CanvasRenderingContext2D,img:CanvasImageSource,
 heading:OmegaHeading,view:OmegaActorView,displayHeight:number,
):boolean{
 if(!Number.isFinite(displayHeight)||displayHeight<=0)return false;
 const action=omegaAiraV2ActionForView(view);
 if(!action)return false;
 const age=view.actionAge===undefined?0:view.actionAge;
 const pose=omegaAiraDirectionActionPose(heading,action,age);
 if(!pose.active)return false;
 ctx.save();
 const scale=displayHeight/height;
 ctx.scale(scale,scale);
 ctx.translate(-width/2,-height);
 // Keep lower boots in their world-space band; the upper torso pivots
 // independently, preserving real Watch foot contact in all headings.
 drawFoot(ctx,img,'left',pose.leftLift,pose.leftStride);
 drawFoot(ctx,img,'right',pose.rightLift,pose.rightStride);
 ctx.save();
 ctx.translate(width/2,hipY);
 ctx.rotate(pose.lean);
 ctx.translate(-width/2,-hipY);
 ctx.translate(pose.backX,pose.rise);
 ctx.drawImage(img,0,0,width,torsoOverlap,
  0,0,width,torsoOverlap);
 ctx.restore();
 ctx.restore();
 return true;
}
