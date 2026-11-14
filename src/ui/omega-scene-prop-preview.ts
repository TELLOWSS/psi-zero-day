import type {OmegaFieldObstacle,OmegaFieldPlan} from '../domain/omega-protocol-field';
import type {OmegaCameraState} from './omega-protocol-camera';

/** Unapproved 2D candidates anchored to the EXISTING obstacle solids. */
const candidates=new Map<string,HTMLImageElement>();
export function drawOmegaSceneProp(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,o:OmegaFieldObstacle,camera:OmegaCameraState):boolean{
 if(plan.sector!==1||(o.kind!=='machine'&&o.kind!=='scaffold')||typeof Image==='undefined')return false;
 let image=candidates.get(o.kind);
 if(!image){image=new Image();image.decoding='async';image.src=`/assets/omega/scene-art-preview/${o.kind==='machine'?'forklift-v3':'scaffold-v1'}.webp`;candidates.set(o.kind,image);}
 if(!image.complete||!image.naturalWidth||!image.naturalHeight)return false;
 const width=o.width*.94,height=width*image.naturalHeight/image.naturalWidth;
 ctx.save();ctx.translate(o.x+o.width/2,o.y+o.height);
 // Stand the picture upright as for the real actor, while the foot anchor
 // remains tied to this object's native world depth and collision footprint.
 ctx.transform(1,0,-camera.skewX/camera.groundYScale,1/camera.groundYScale,0,0);
 ctx.drawImage(image,-width/2,-height,width,height);ctx.restore();
 return true;
}
