import type {OmegaFieldObstacle,OmegaFieldPlan,OmegaFieldPoint} from '../domain/omega-protocol-field';

/**
 * M12-G1: original industrial-depth lighting for the real OMEGA canvas.
 * Presentation only: all positions come from existing native terrain solids.
 * Never adds collision, changes Watch line of sight, or saves to an account.
 */
export interface OmegaM12Budget {
 readonly shadowBlur:boolean;
 readonly structuralGlints:boolean;
 readonly hazeBands:number;
}
export function omegaM12Budget(width:number,height:number):OmegaM12Budget{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw new RangeError('Invalid industrial scene viewport');
 const pixels=width*height;
 return pixels<350_000
  ?{shadowBlur:false,structuralGlints:false,hazeBands:1}
  :pixels<800_000
   ?{shadowBlur:true,structuralGlints:false,hazeBands:2}
   :{shadowBlur:true,structuralGlints:true,hazeBands:3};
}
const rise:Readonly<Record<OmegaFieldObstacle['kind'],number>>={
 container:72,scaffold:95,machine:80,barrier:38,
};
const eligible=(plan:OmegaFieldPlan)=>plan.sector===1;

/** Hero/enemy foot depth vs. existing tall native cover. No invented solids. */
export function omegaM12Occluders(
 plan:OmegaFieldPlan,actor:OmegaFieldPoint,radius=20,
):readonly OmegaFieldObstacle[]{
 if(!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||
    !Number.isFinite(radius)||radius<0)throw new RangeError('Invalid actor position');
 if(!eligible(plan))return [];
 return plan.obstacles.filter(o=>
  actor.x+radius>o.x&&actor.x-radius<o.x+o.width&&
  actor.y>=o.y-rise[o.kind]-15&&actor.y<o.y+o.height
 );
}

/** Floor-shadow footprint of genuine world props, drawn BELOW gameplay. */
export function drawOmegaM12TerrainShadows(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,budget:OmegaM12Budget,
):void{
 if(!eligible(plan))return;
 ctx.save();
 for(const o of plan.obstacles){
  const centerX=o.x+o.width*.5+26,centerY=o.y+o.height+11;
  ctx.beginPath();
  ctx.ellipse(centerX,centerY,o.width*.63,Math.max(14,o.height*.28),-.16,0,Math.PI*2);
  ctx.fillStyle='rgba(0,5,15,.34)';
  ctx.fill();
  if(budget.shadowBlur){
   ctx.strokeStyle='rgba(10,30,42,.25)';ctx.lineWidth=14;ctx.stroke();
  }
 }
 ctx.restore();
}

/** Inexpensive grounded contact shadows: position follows REAL native feet. */
export function drawOmegaM12ActorFootShadow(
 ctx:CanvasRenderingContext2D,position:OmegaFieldPoint,size=25,
):void{
 if(!Number.isFinite(position.x)||!Number.isFinite(position.y)||
    !Number.isFinite(size)||size<=0)return;
 ctx.save();
 ctx.translate(position.x,position.y+5);
 ctx.fillStyle='rgba(0,6,17,.42)';
 ctx.beginPath();ctx.ellipse(3,0,size,Math.max(5,size*.31),0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(111,217,224,.17)';ctx.lineWidth=1.2;ctx.stroke();
 ctx.restore();
}

/**
 * Extruded glints and steel members are registered to the native cover art.
 * Structural sides stay inside the native X footprint and never suggest an
 * additional playable blocking shape. Painter order supplies live occlusion.
 */
export function drawOmegaM12StructureFacets(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,o:OmegaFieldObstacle,
 seconds:number,budget:OmegaM12Budget,
):void{
 if(!eligible(plan)||!Number.isFinite(seconds))return;
 const {x,y,width:w,height:h}=o,top=y-rise[o.kind];
 ctx.save();
 ctx.strokeStyle='rgba(174,222,229,.35)';ctx.lineWidth=2;
 ctx.beginPath();
 ctx.moveTo(x+4,top+12);ctx.lineTo(x+w-4,top+12);
 ctx.moveTo(x+w-5,top+12);ctx.lineTo(x+w-5,y+h+4);
 ctx.stroke();
 // The broad unlit right face gives the existing SVG a visible side plane.
 ctx.fillStyle='rgba(4,15,29,.26)';
 ctx.beginPath();ctx.moveTo(x+w-16,top+14);ctx.lineTo(x+w-4,top+12);
 ctx.lineTo(x+w-4,y+h+4);ctx.lineTo(x+w-16,y+h-5);ctx.closePath();ctx.fill();
 if(o.kind==='scaffold'){
  ctx.lineWidth=2.4;ctx.strokeStyle='rgba(153,201,205,.66)';
  for(let n=0;n<3;n++){
   const bx=x+8+n*(w-16)/2;
   ctx.beginPath();ctx.moveTo(bx,top+24);ctx.lineTo(bx+8,y+h+4);ctx.stroke();
  }
  ctx.strokeStyle='rgba(247,198,120,.75)';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x+8,top+40);ctx.lineTo(x+w-9,top+40);ctx.stroke();
 }else if(o.kind==='container'){
  ctx.strokeStyle='rgba(171,215,231,.27)';
  for(let n=1;n<6;n++){
   const bx=x+n*w/6;
   ctx.beginPath();ctx.moveTo(bx,top+18);ctx.lineTo(bx,y+h-4);ctx.stroke();
  }
 }else if(o.kind==='machine'){
  ctx.fillStyle='rgba(105,228,233,.24)';ctx.fillRect(x+w*.38,top+18,w*.24,7);
 }else{
  ctx.fillStyle='rgba(250,179,95,.42)';ctx.fillRect(x+9,top+18,w-18,5);
 }
 if(budget.structuralGlints){
  const pulse=.45+.17*Math.sin(seconds*.7+x*.02);
  ctx.strokeStyle='rgba(205,238,246,'+pulse.toFixed(3)+')';
  ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(x+7,top+14);ctx.lineTo(x+w*.4,top+14);ctx.stroke();
 }
 ctx.restore();
}

/** Subtle haze in the far northern field only; no full-screen combat wash. */
export function drawOmegaM12DistanceHaze(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,seconds:number,budget:OmegaM12Budget,
):void{
 if(!eligible(plan)||!Number.isFinite(seconds))return;
 ctx.save();
 for(let n=0;n<budget.hazeBands;n++){
  const y=90+n*52+Math.sin(seconds*.12+n)*5;
  ctx.fillStyle='rgba(129,186,203,'+(0.024+n*.008).toFixed(3)+')';
  ctx.fillRect(0,y,1400,24+n*9);
 }
 ctx.restore();
}

/** Visible locator for a genuinely hidden actor, not a see-through sprite. */
export function drawOmegaM12OcclusionBeacon(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,actor:OmegaFieldPoint,seconds:number,
):boolean{
 const covers=omegaM12Occluders(plan,actor);
 if(covers.length===0||!Number.isFinite(seconds))return false;
 ctx.save();ctx.translate(actor.x,actor.y);
 const pulse=.64+.18*Math.sin(seconds*4);
 ctx.strokeStyle='rgba(161,249,232,'+pulse.toFixed(3)+')';
 ctx.lineWidth=3;ctx.setLineDash([8,5]);
 ctx.beginPath();ctx.ellipse(0,0,30,13,0,0,Math.PI*2);ctx.stroke();
 ctx.setLineDash([]);
 ctx.fillStyle='rgba(194,249,234,.89)';
 ctx.beginPath();ctx.arc(0,-22,3.4,0,Math.PI*2);ctx.fill();
 ctx.restore();
 return true;
}
