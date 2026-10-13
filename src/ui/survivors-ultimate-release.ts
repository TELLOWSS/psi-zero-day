import {drawVfxCell} from './survivors-cinematic-vfx';
import {ATTACK_MOTION} from './survivors-attack-motion';

export const ULTIMATE_RELEASE_DURATION=ATTACK_MOTION.ultimate.duration;
export function ultimateSourceObscured(phase:string):boolean {return phase==='cutin'||phase==='shout';}
/** Presentation clock only: ignition, pressure release, then a quiet material tail. */
export function ultimateReleaseFrame(age:number){
  if(!Number.isFinite(age)||age<0||age>=ULTIMATE_RELEASE_DURATION)return undefined;
  const t=age/ULTIMATE_RELEASE_DURATION;
  const release=Math.max(0,Math.min(1,(t-.12)/.60));
  const travel=1-(1-release)**3;
  const ignition=Math.sin(Math.min(1,t/.18)*Math.PI/2)*(1-t)**2;
  return {t,travel,radius:18+travel*34,core:ignition*.52,
    front:Math.sin(release*Math.PI)*.36,tail:Math.sin(t*Math.PI)*(1-t)*.24};
}

/** Reuses painted materials; at most seven local stamps, two in crowded combat. */
export function drawUltimateRelease(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,age:number,reduced:boolean,busy:boolean):boolean {
  const frame=ultimateReleaseFrame(age);
  if(!frame||reduced||!atlas?.naturalWidth)return false;
  const {t,travel,radius,core,front,tail}=frame;
  ctx.save();ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,0,0,-22,24+14*core,38-12*travel,core);
  drawVfxCell(ctx,atlas,7,0,5,radius*2,radius*.65,front);
  if(!busy){
    drawVfxCell(ctx,atlas,0,0,-12-8*travel,42+18*travel,28+16*travel,tail);
    for(let i=0;i<4;i++){
      const angle=i*Math.PI/2+Math.PI/4,r=10+travel*32;
      drawVfxCell(ctx,atlas,4,Math.cos(angle)*r,Math.sin(angle)*r*.40-8,
        10+travel*12,3+2*(1-t),front*.55,angle);
    }
  }
  ctx.restore();return true;
}
