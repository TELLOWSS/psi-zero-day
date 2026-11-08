import type {OmegaFieldPlan,OmegaFieldPoint} from '../domain/omega-protocol-field';

/**
 * Original procedural art direction for the first construction-site sector.
 * This is an inexpensive, asset-free 2.5D VISUAL SLICE, not final painted art.
 * Every mark is non-solid floor/lighting: real collision geometry stays in
 * omegaFieldPlan(), Watch native terrain and the existing boss telegraph.
 */
export interface OmegaSceneBudget {
 readonly dust:number;
 readonly floodlights:number;
 readonly puddles:number;
}
export function omegaSceneBudget(canvasWidth:number,canvasHeight:number):OmegaSceneBudget {
 if(!Number.isFinite(canvasWidth)||!Number.isFinite(canvasHeight)||
     canvasWidth<=0||canvasHeight<=0)throw new RangeError('Invalid scene dimensions');
 const pixels=canvasWidth*canvasHeight;
 return pixels<350_000
  ?{dust:8,floodlights:2,puddles:3}
  :pixels<750_000
   ?{dust:14,floodlights:3,puddles:4}
   :{dust:20,floodlights:4,puddles:5};
}
export function omegaSectorOneDust(
 seconds:number,index:number,
):Readonly<{x:number;y:number;opacity:number;length:number}> {
 if(!Number.isFinite(seconds)||!Number.isInteger(index)||index<0)
  throw new RangeError('Invalid scene particle');
 const phase=index*1.61803398875;
 // Stable positions on a repeating 1400 x 900 field: no Math.random,
 // no per-frame allocations of retained particles or third-party assets.
 return {
  x:((index*211+seconds*(11+index%4*7))%1400+1400)%1400,
  y:((index*137+Math.sin(seconds*.55+phase)*17)%900+900)%900,
  opacity:.055+(index%5)*.022,
  length:11+index%4*4,
 };
}
const eligible=(plan:OmegaFieldPlan)=>plan.sector===1;
function softLight(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,color:string):void{
 const g=ctx.createRadialGradient(x,y,6,x,y,radius);
 g.addColorStop(0,color);
 g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=g;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
function paintGroundPanel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number):void{
 // Floor inset, not a collision object or raised architectural barrier.
 ctx.fillStyle='rgba(10,22,34,.43)';ctx.fillRect(x,y,w,h);
 ctx.strokeStyle='rgba(134,174,186,.24)';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 ctx.strokeStyle='rgba(236,179,97,.28)';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(x+8,y+h-10);ctx.lineTo(x+w-8,y+h-10);ctx.stroke();
 ctx.strokeStyle='rgba(152,197,210,.12)';ctx.lineWidth=1.5;
 for(let i=1;i<5;i++){
  const dx=w*i/5;
  ctx.beginPath();ctx.moveTo(x+dx,y+8);ctx.lineTo(x+dx-11,y+h-15);ctx.stroke();
 }
}
export function drawOmegaSectorOneGround(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan):void{
 if(!eligible(plan))return;
 ctx.save();
 const budget=omegaSceneBudget(ctx.canvas.width,ctx.canvas.height);
 // Under-foot painted service grids and weathered steel plate seams:
 // deliberately no false walls, pickups, or interactive objects.
 paintGroundPanel(ctx,42,95,485,182);
 paintGroundPanel(ctx,850,90,452,155);
 paintGroundPanel(ctx,103,593,298,165);
 paintGroundPanel(ctx,973,585,305,197);
 ctx.lineWidth=2;
 for(let i=0;i<13;i++){
  const x=85+i*96;
  ctx.strokeStyle=i%3===0?'rgba(248,180,93,.28)':'rgba(112,183,207,.12)';
  ctx.beginPath();ctx.moveTo(x,384);ctx.lineTo(x+22,362);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+22,542);ctx.lineTo(x+5,556);ctx.stroke();
 }
 // Painted wayfinding on the road; interaction markers always draw later.
 ctx.save();ctx.translate(632,448);
 ctx.fillStyle='rgba(217,229,230,.28)';
 ctx.beginPath();ctx.moveTo(-38,-8);ctx.lineTo(37,-8);ctx.lineTo(37,-24);
 ctx.lineTo(81,0);ctx.lineTo(37,24);ctx.lineTo(37,8);ctx.lineTo(-38,8);
 ctx.closePath();ctx.fill();ctx.restore();
 // Wet-asphalt reflections are simple, clipped ellipses. No GPU filters.
 const wet:readonly (readonly [number,number,number])[]=[
  [165,341,76],[450,686,86],[830,290,101],[1190,435,115],[1045,787,78]
 ];
 for(const [x,y,r] of wet.slice(0,budget.puddles)){
  ctx.fillStyle='rgba(50,114,145,.17)';
  ctx.beginPath();ctx.ellipse(x,y,r,13,-.09,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(123,201,230,.18)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(x-r*.65,y+2);ctx.lineTo(x+r*.4,y-1);ctx.stroke();
 }
 // Floor-level sodium/safety lighting suggests real work-zone depth.
 const lamps:readonly (readonly [number,number,number,string])[]=[
  [280,158,186,'rgba(92,192,227,.16)'],
  [650,260,218,'rgba(248,172,91,.13)'],
  [1020,220,207,'rgba(94,192,231,.16)'],
  [1140,700,224,'rgba(246,163,80,.12)'],
 ];
 for(const [x,y,r,color] of lamps.slice(0,budget.floodlights))softLight(ctx,x,y,r,color);
 ctx.restore();
}
/** Real hero position controls this light; it never affects Watch visibility,
 * damage, hitboxes, player movement, or boss attack warning geometry. */
export function drawOmegaSectorOneActorLight(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 actor:OmegaFieldPoint,seconds:number,
):void{
 if(!eligible(plan)||!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||!Number.isFinite(seconds))
  return;
 ctx.save();
 const pulse=1+.04*Math.sin(seconds*2);
 softLight(ctx,actor.x,actor.y,108*pulse,'rgba(100,234,237,.22)');
 ctx.strokeStyle='rgba(146,247,237,.34)';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(actor.x,actor.y,28,12,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
/** Lightweight ambient airborne dust, reduced on mobile viewports.
 * Event glyphs, UI and boss warnings are drawn on top of this pass. */
export function drawOmegaSectorOneAir(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,seconds:number,budget:OmegaSceneBudget,
):void{
 if(!eligible(plan)||!Number.isFinite(seconds))return;
 ctx.save();
 ctx.lineWidth=1.4;
 for(let i=0;i<budget.dust;i++){
  const p=omegaSectorOneDust(seconds,i);
  ctx.strokeStyle='rgba(166,219,230,'+p.opacity.toFixed(3)+')';
  ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+4,p.y-p.length);ctx.stroke();
 }
 ctx.restore();
}
/** Screen-space tone mapping is intentionally mild; users must still read
 * boss telegraphs, HP, interaction directions and mobile action buttons. */
export function drawOmegaSectorOneGrade(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 viewWidth:number,viewHeight:number,
):void{
 if(!eligible(plan)||!Number.isFinite(viewWidth)||!Number.isFinite(viewHeight)||
   viewWidth<=0||viewHeight<=0)return;
 ctx.save();
 const w=viewWidth,h=viewHeight;
 const rim=ctx.createRadialGradient(w*.51,h*.52,Math.min(w,h)*.27,
                                   w*.51,h*.52,Math.max(w,h)*.8);
 rim.addColorStop(0,'rgba(2,7,15,0)');
 rim.addColorStop(.74,'rgba(2,7,15,.07)');
 rim.addColorStop(1,'rgba(2,7,15,.31)');
 ctx.fillStyle=rim;ctx.fillRect(0,0,w,h);
 const sky=ctx.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,'rgba(37,80,115,.055)');
 sky.addColorStop(.5,'rgba(37,80,115,0)');
 sky.addColorStop(1,'rgba(184,105,67,.047)');
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 ctx.restore();
}
