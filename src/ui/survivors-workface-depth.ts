import {stageActorLight} from './survivors-stage-light';
import {stageArtProfile} from './survivors-stage-art';

export type DepthQuality='low'|'balanced'|'high';
export interface WorkfaceDepthLook {
  readonly floorFilter:string;
  readonly nearShade:number;
  readonly farShade:number;
  readonly bounce:number;
  readonly color:string;
}

/**
 * All fifty authored floor binaries remain unchanged. This is a separate,
 * presentation-only exposure/depth pass, NOT substitute scenery or new art.
 */
export function workfaceDepthLook(stageId:string,quality:DepthQuality):WorkfaceDepthLook {
  const art=stageArtProfile(stageId);
  const light=stageActorLight(stageId);
  const detail=Math.max(1,Math.min(5,art.detail));
  const gain=quality==='high'?1:quality==='balanced'? .72 : .52;
  const contrast=(1+.09*gain+detail*.008).toFixed(3);
  const saturation=(1+.13*gain+detail*.006).toFixed(3);
  const brightness=(1+.015*gain).toFixed(3);
  return {
    floorFilter:`contrast(${contrast}) saturate(${saturation}) brightness(${brightness})`,
    nearShade:(.12+detail*.012)*gain,
    farShade:(.055+detail*.004)*gain,
    bounce:(quality==='high'?.12:quality==='balanced'?.085:.06),
    color:light?.color??'#e4ebf2',
  };
}

const depthLayers=new Map<string,HTMLCanvasElement>();

/**
 * Cached foreground/midground/distance exposure zones, aligned to the real
 * ground image. The central danger/telegraph zone stays unobscured.
 */
export function drawWorkfaceDepth(ctx:CanvasRenderingContext2D,stageId:string,quality:DepthQuality):void {
  const key=stageId+':'+quality;
  let layer=depthLayers.get(key);
  if(!layer){
    const look=workfaceDepthLook(stageId,quality);
    layer=document.createElement('canvas');
    layer.width=700;layer.height=450;
    const paint=layer.getContext('2d');
    if(!paint)return;
    paint.scale(.5,.5);
    const distance=paint.createLinearGradient(0,0,0,900);
    distance.addColorStop(0,`rgba(8,17,30,${look.farShade.toFixed(3)})`);
    distance.addColorStop(.32,'rgba(8,17,30,0)');
    distance.addColorStop(.67,'rgba(8,17,30,0)');
    distance.addColorStop(1,`rgba(5,11,20,${look.nearShade.toFixed(3)})`);
    paint.fillStyle=distance;paint.fillRect(0,0,1400,900);

    const ambient=paint.createRadialGradient(250,85,30,400,230,900);
    ambient.addColorStop(0,look.color+'24');
    ambient.addColorStop(.65,look.color+'09');
    ambient.addColorStop(1,'rgba(0,0,0,0)');
    paint.globalAlpha=look.bounce*3;
    paint.fillStyle=ambient;paint.fillRect(0,0,1400,900);
    paint.globalAlpha=1;

    // Layered perspective exposure follows the existing artwork, with no
    // duplicate buildings, speculative obstacles or new gameplay geometry.
    const edge=paint.createLinearGradient(0,0,1400,0);
    edge.addColorStop(0,'rgba(6,13,22,.10)');
    edge.addColorStop(.18,'rgba(6,13,22,0)');
    edge.addColorStop(.82,'rgba(6,13,22,0)');
    edge.addColorStop(1,'rgba(6,13,22,.10)');
    paint.fillStyle=edge;paint.fillRect(0,0,1400,900);
    if(depthLayers.size>=6)depthLayers.delete(depthLayers.keys().next().value!);
    depthLayers.set(key,layer);
  }
  ctx.drawImage(layer,0,0,1400,900);
}

/** Essential foot grounding survives low-quality and reduced-motion modes. */
export function drawEssentialFootShadow(ctx:CanvasRenderingContext2D,x:number,y:number):void {
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(4,10,18,.32)';
  ctx.beginPath();ctx.ellipse(5,4,21,7,-.15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(4,10,18,.42)';
  ctx.beginPath();ctx.ellipse(0,2,12,4,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
