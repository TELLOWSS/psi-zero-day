import type {Hazard} from '../domain/patrol-survivors';

/** World-space ST25 route verification. Visuals read engine state verbatim. */
export function drawStaleRoute(ctx:CanvasRenderingContext2D,h:Readonly<Hazard>):void {
 const p=h.bossGameplay,r=p?.staleRoute;
 if(!r||p?.patternId!=='STALE_ROUTE'||p.combatPhase==='secured')return;
 ctx.save();
 const old=r.oldMark;
 ctx.lineWidth=2;ctx.setLineDash([8,8]);
 ctx.strokeStyle='rgba(249,115,22,.8)';
 ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(old.x,old.y);ctx.stroke();
 ctx.setLineDash([]);
 ctx.fillStyle='rgba(111,32,16,.76)';
 ctx.beginPath();ctx.arc(old.x,old.y,27,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#fb923c';ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(old.x-11,old.y-11);ctx.lineTo(old.x+11,old.y+11);ctx.moveTo(old.x+11,old.y-11);ctx.lineTo(old.x-11,old.y+11);ctx.stroke();
 ctx.font='700 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
 ctx.lineWidth=3;ctx.strokeStyle='#23100a';
 ctx.strokeText('구 표식 · 재확인',old.x,old.y-34);
 ctx.fillStyle='#ffcc99';ctx.fillText('구 표식 · 재확인',old.x,old.y-34);
 ctx.setLineDash([6,7]);ctx.lineWidth=3;ctx.strokeStyle='rgba(120,235,225,.66)';
 ctx.beginPath();ctx.moveTo(r.points[0]!.x,r.points[0]!.y);
 for(let i=1;i<r.points.length;i++)ctx.lineTo(r.points[i]!.x,r.points[i]!.y);
 ctx.stroke();ctx.setLineDash([]);
 for(let i=0;i<r.points.length;i++){
  const pt=r.points[i]!,done=i<r.verified,active=i===r.verified;
  ctx.fillStyle=done?'rgba(16,185,129,.64)':active?'rgba(8,145,178,.7)':'rgba(16,47,59,.65)';
  ctx.strokeStyle=done?'#6ee7b7':active?'#67e8f9':'#5e8792';
  ctx.lineWidth=active?4:2;
  ctx.beginPath();ctx.arc(pt.x,pt.y,active?31:25,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=done?'#d1fae5':'#ecfeff';
  ctx.font='800 15px sans-serif';ctx.textBaseline='middle';
  ctx.fillText(done?'✓':String(i+1),pt.x,pt.y);
 }
 ctx.textBaseline='bottom';
 ctx.font='700 14px sans-serif';
 const text=p.combatPhase==='burst'?'약점 개방 · 4.5초':`새 동선 확인 ${Math.min(3,r.verified)}/3`;
 ctx.strokeStyle='#0d2030';ctx.lineWidth=4;
 ctx.strokeText(text,h.x,h.y-h.radius-45);
 ctx.fillStyle=p.combatPhase==='burst'?'#a7f3d0':'#a5f3fc';
 ctx.fillText(text,h.x,h.y-h.radius-45);
 ctx.restore();
}
