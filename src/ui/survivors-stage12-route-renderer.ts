import type {PatrolStageId} from '../domain/patrol-survivors';
import type {TerrainObject} from '../domain/survivors-terrain';
import {stage12RubbleRoute} from '../engine/survivors-stage12-route';

/** A lightweight world-space signal, never a floating gameplay-blocking HUD. */
export function drawStage12RubbleRoute(
  ctx:CanvasRenderingContext2D,
  stageId:PatrolStageId,
  terrain:readonly TerrainObject[],
  reducedMotion:boolean,
):void {
  if(stageId!=='stage_12')return;
  const route=stage12RubbleRoute(terrain);
  if(!route)return;
  const {from,to,open}=route;
  const midX=(from.x+to.x)/2,midY=(from.y+to.y)/2;
  const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);
  if(length===0)return;
  const ux=dx/length,uy=dy/length;
  ctx.save();
  // The route is proven open only when the SAME terrain collision check
  // used by movement does not find a blocking object.
  ctx.globalAlpha=.94;
  ctx.strokeStyle=open?'#69f0b1':'#f8bd72';
  ctx.lineWidth=open?4:2.5;
  ctx.setLineDash(open?[]:[8,7]);
  ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();ctx.setLineDash([]);
  if(open){
    ctx.fillStyle='#69f0b1';
    ctx.beginPath();ctx.moveTo(to.x,to.y);ctx.lineTo(to.x-11*ux-5*uy,to.y-11*uy+5*ux);ctx.lineTo(to.x-11*ux+5*uy,to.y-11*uy-5*ux);ctx.closePath();ctx.fill();
  }else{
    ctx.strokeStyle='#f8bd72';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(midX-7,midY-7);ctx.lineTo(midX+7,midY+7);
    ctx.moveTo(midX+7,midY-7);ctx.lineTo(midX-7,midY+7);ctx.stroke();
  }
  // No animated shimmer in crowded scenes or reduced-motion mode. Spatial
  // placement alone conveys the change and survives low visual quality.
  ctx.font='700 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
  const label=open?'잔재 정리 · 직접 통과 가능':'잔재 장애 · 우회 필요';
  const labelY=Math.min(from.y,to.y)-18;
  ctx.lineWidth=3;ctx.strokeStyle='#0b1c1b';ctx.strokeText(label,midX,labelY);
  ctx.fillStyle=open?'#adffdb':'#ffe1ad';ctx.fillText(label,midX,labelY);
  if(!reducedMotion&&open){ /* Static by design: collision truth over decoration. */ }
  ctx.restore();
}
