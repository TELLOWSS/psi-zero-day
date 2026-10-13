import type {Hazard} from '../domain/patrol-survivors';
import {drawProp} from './survivors-equipment-art';

/** Functional warning geometry uses the same locked zones as engine collision. */
export function drawGangformPattern(ctx:CanvasRenderingContext2D,h:Readonly<Hazard>,atlas:HTMLImageElement|undefined):void {
 const p=h.bossGameplay,g=p?.gangform;if(!g||!p||!['pattern','weak_point'].includes(p.combatPhase))return;
 ctx.save();ctx.lineWidth=2;
 if(g.step==='pendulum_warning'||g.step==='pendulum'){
  ctx.fillStyle='rgba(245,158,11,.12)';ctx.strokeStyle='#fbbf24';ctx.setLineDash([10,8]);
  ctx.fillRect(g.anchorX-110-h.radius,g.anchorY-h.radius-14,220+h.radius*2,(h.radius+14)*2);
  ctx.strokeRect(g.anchorX-110-h.radius,g.anchorY-h.radius-14,220+h.radius*2,(h.radius+14)*2);
 }
 ctx.setLineDash([]);
 for(const z of g.zones){
  if(z.hp<=0)continue;
  const weak=p.combatPhase==='weak_point',fall=g.step==='debris';
  ctx.fillStyle=weak?'rgba(34,211,238,.18)':fall?'rgba(239,68,68,.35)':'rgba(245,158,11,.18)';
  ctx.strokeStyle=weak?'#67e8f9':fall?'#f87171':'#fbbf24';
  ctx.beginPath();ctx.arc(z.x,z.y,z.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(weak){
   drawProp(ctx,atlas,3,z.x,z.y,36);
   ctx.fillStyle='#164e63';ctx.fillRect(z.x-24,z.y+43,48,4);ctx.fillStyle='#67e8f9';ctx.fillRect(z.x-24,z.y+43,48*z.hp/z.maxHp,4);
  }else{
   const elevation=g.step==='debris_warning'?70:70*g.remaining/.4;
   drawProp(ctx,atlas,3,z.x,z.y-elevation,32);
   ctx.beginPath();ctx.arc(z.x,z.y,z.radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-g.remaining/(fall?.4:1.2)));ctx.stroke();
  }
 }
 ctx.restore();
}
