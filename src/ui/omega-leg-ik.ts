/**
 * OMEGA art-rig preparation: two-bone IK and cyclic stance/swing foot targets.
 * These math helpers do NOT paint, render or ship a playable AIRA character.
 * The sprite art and sockets remain artist-authored release prerequisites.
 */
export type OmegaPoint=Readonly<{x:number;y:number}>;
export type OmegaSide='left'|'right';
export interface OmegaFootTarget {
 readonly foot:OmegaSide;
 readonly phase:number;
 readonly x:number;
 readonly lift:number;
 readonly planted:boolean;
}
export interface OmegaLegSolve {
 readonly hip:OmegaPoint;
 readonly knee:OmegaPoint;
 readonly ankle:OmegaPoint;
 readonly desiredAnkle:OmegaPoint;
 readonly upperLength:number;
 readonly lowerLength:number;
 readonly adjustedForReach:boolean;
}

/** Normalize time so negative and fractional gait positions are stable. */
export function omegaWrapCycle(phase:number):number{
 if(!Number.isFinite(phase))return 0;
 return ((phase%1)+1)%1;
}

/**
 * Local frame foot tracks for a future authored rig.
 * Stance: heel plant -> toe off (60% of cycle, y=0).
 * Swing: foot comes forward with smooth toe clearance (40%).
 * x is local to the moving pelvis; the game root must provide real world
 * displacement to guarantee a planted foot remains stationary in world space.
 */
export function omegaFootCycle(
 phase:number,foot:OmegaSide,stridePx:number,clearancePx:number,
):OmegaFootTarget{
 const safeStride=Number.isFinite(stridePx)?Math.max(0,stridePx):0;
 const clearance=Number.isFinite(clearancePx)?Math.max(0,clearancePx):0;
 const p=omegaWrapCycle(phase+(foot==='right'?.5:0));
 if(safeStride===0)return {foot,phase:p,x:0,lift:0,planted:true};
 const fraction=.6;
 if(p<fraction)return {foot,phase:p,x:safeStride*(.5-p/fraction),lift:0,planted:true};
 const t=(p-fraction)/(1-fraction);
 return {
  foot,phase:p,
  x:safeStride*(t-.5),
  lift:clearance*Math.sin(Math.PI*t),
  planted:false,
 };
}

/**
 * Planar 2-bone IK. Foot targets outside reach are clamped; the signed bend
 * chooses knee direction. The output is a joint GUIDE, never direct pixel art.
 */
export function omegaSolveLeg(
 hip:OmegaPoint,desiredAnkle:OmegaPoint,
 upperLength:number,lowerLength:number,bend:1|-1=1,
):OmegaLegSolve|null{
 const nums=[hip.x,hip.y,desiredAnkle.x,desiredAnkle.y,upperLength,lowerLength];
 if(nums.some(x=>!Number.isFinite(x))||upperLength<=0||lowerLength<=0)return null;
 const dx=desiredAnkle.x-hip.x,dy=desiredAnkle.y-hip.y;
 const actualDistance=Math.hypot(dx,dy);
 const dX=actualDistance>1e-9?dx/actualDistance:0;
 const dY=actualDistance>1e-9?dy/actualDistance:1;
 const minReach=Math.abs(upperLength-lowerLength)+1e-5;
 const maxReach=upperLength+lowerLength-1e-5;
 const reach=Math.min(maxReach,Math.max(minReach,actualDistance));
 const ankle={x:hip.x+dX*reach,y:hip.y+dY*reach};
 const along=(upperLength**2-lowerLength**2+reach**2)/(2*reach);
 const lateral=Math.sqrt(Math.max(0,upperLength**2-along**2));
 const knee={
  x:hip.x+dX*along-dY*lateral*bend,
  y:hip.y+dY*along+dX*lateral*bend,
 };
 return {
  hip,knee,ankle,desiredAnkle,upperLength,lowerLength,
  adjustedForReach:actualDistance<minReach||actualDistance>maxReach,
 };
}

/** Candidate markers for an independent art rig; not inferred from pixel pose. */
export function omegaTwoFootGuides(
 phase:number,baseY:number,
 stridePx:number,clearancePx:number,
 upperLength:number,lowerLength:number,
):Readonly<{left:OmegaLegSolve|null;right:OmegaLegSolve|null;
  leftFoot:OmegaFootTarget;rightFoot:OmegaFootTarget}> {
 const left=omegaFootCycle(phase,'left',stridePx,clearancePx);
 const right=omegaFootCycle(phase,'right',stridePx,clearancePx);
 const leftHip={x:-8,y:0},rightHip={x:8,y:0};
 return {
  left:omegaSolveLeg(leftHip,{x:leftHip.x+left.x,y:baseY-left.lift},upperLength,lowerLength,1),
  right:omegaSolveLeg(rightHip,{x:rightHip.x+right.x,y:baseY-right.lift},upperLength,lowerLength,-1),
  leftFoot:left,rightFoot:right,
 };
}
