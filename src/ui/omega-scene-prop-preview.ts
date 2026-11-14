import type {OmegaFieldObstacle,OmegaFieldPlan} from '../domain/omega-protocol-field';
import type {OmegaCameraState} from './omega-protocol-camera';

/** Unapproved 2D candidates anchored to the EXISTING obstacle solids. */
const candidates=new Map<string,HTMLImageElement>();
let shadow:HTMLCanvasElement|undefined;
const art:{[K in OmegaFieldObstacle['kind']]:{file:string;left:number;top:number;right:number;bottom:number}}={
 container:{file:'site-office-v3',left:75,top:37,right:692,bottom:468},
 barrier:{file:'barrier-v3',left:108,top:75,right:646,bottom:459},
 machine:{file:'forklift-v3',left:59,top:7,right:731,bottom:501},
 scaffold:{file:'scaffold-v1',left:97,top:20,right:659,bottom:503},
};
export function drawOmegaSceneProp(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,o:OmegaFieldObstacle,camera:OmegaCameraState):boolean{
 if(plan.sector!==1||typeof Image==='undefined')return false;
 const spec=art[o.kind];if(!spec)return false;
 let image=candidates.get(o.kind);
 if(!image){image=new Image();image.decoding='async';image.src=`/assets/omega/scene-art-preview/${spec.file}.webp`;candidates.set(o.kind,image);}
 if(!image.complete||!image.naturalWidth||!image.naturalHeight)return false;
 // Include a small antialias margin, but use the visible object bounds for
 // sizing rather than the variable transparent margins in generated files.
 const left=Math.max(0,spec.left-8),top=Math.max(0,spec.top-8);
 const right=Math.min(image.naturalWidth,spec.right+9),bottom=Math.min(image.naturalHeight,spec.bottom+9);
 const sourceWidth=right-left,sourceHeight=bottom-top;
 const width=o.width*.96,height=width*sourceHeight/sourceWidth;
 ctx.save();ctx.translate(o.x+o.width/2,o.y+o.height);
 // Stand the picture upright as for the real actor, while the foot anchor
 // remains tied to this object's native world depth and collision footprint.
 ctx.transform(1,0,-camera.skewX/camera.groundYScale,1/camera.groundYScale,0,0);
 ctx.drawImage(image,left,top,sourceWidth,sourceHeight,-width/2,-height,width,height);ctx.restore();
 return true;
}
/** Soft contact shadows follow existing solid footprints, not painted floors. */
export function drawOmegaScenePropShadows(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan):void{
 if(plan.sector!==1||typeof document==='undefined')return;
 if(!shadow){
  const layer=document.createElement('canvas');layer.width=128;layer.height=64;
  const paint=layer.getContext('2d');if(!paint)return;
  paint.translate(64,32);paint.scale(1,.5);
  const g=paint.createRadialGradient(0,0,2,0,0,62);
  g.addColorStop(0,'rgba(0,4,10,.48)');g.addColorStop(1,'rgba(0,4,10,0)');
  paint.fillStyle=g;paint.fillRect(-64,-64,128,128);shadow=layer;
 }
 for(const o of plan.obstacles){
  ctx.drawImage(shadow,o.x,o.y+o.height*.72,o.width,o.height*.5);
 }
}
