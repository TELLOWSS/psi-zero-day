import {PINBALL_BUMPERS,type SurvivorsPinballEngine} from '../engine/survivors-pinball-engine';
export function drawPinball(ctx:CanvasRenderingContext2D,s:SurvivorsPinballEngine['state'],table:HTMLImageElement,paddle:HTMLImageElement,cargo:HTMLImageElement,reduced:boolean){
 ctx.clearRect(0,0,600,900);ctx.drawImage(table,0,0,600,900);
 const lift=s.effects.find(e=>e.kind==='crane'||e.kind==='jackpot'),progress=lift&&!reduced?Math.sin((1-lift.life/1.2)*Math.PI):0;
 ctx.save();ctx.translate(300,110-progress*25);ctx.rotate(progress*.035);
 ctx.shadowColor='#0009';ctx.shadowBlur=8+progress*6;ctx.shadowOffsetY=7+progress*6;
 ctx.drawImage(cargo,-70,-35,140,70);ctx.restore();
 PINBALL_BUMPERS.forEach((b,i)=>{if(!s.lit[i])return;
  ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(b.x,b.y,14,b.x,b.y,65);
  g.addColorStop(0,'#8fffcc90');g.addColorStop(1,'#42dfac00');ctx.fillStyle=g;ctx.fillRect(b.x-65,b.y-65,130,130);ctx.restore();
 });
 for(const [x,angle] of [[185,s.leftAngle],[415,s.rightAngle]] as const){
  ctx.save();ctx.translate(x,735);ctx.rotate(angle);ctx.shadowColor='#000b';ctx.shadowBlur=8;ctx.shadowOffsetY=7;
  ctx.drawImage(paddle,-18,-22,132,44);ctx.restore();
 }
 for(const [index,b] of [s,...s.extraBalls].entries()){
 // Restrained velocity streak helps follow the small sphere on portrait phones.
 if(!reduced&&s.phase==='playing'){
  const speed=Math.hypot(b.vx,b.vy),length=Math.min(38,speed*.025);
  if(speed>200){const tx=b.x-b.vx/speed*length,ty=b.y-b.vy/speed*length,g=ctx.createLinearGradient(tx,ty,b.x,b.y);
   g.addColorStop(0,'#d9f3ff00');g.addColorStop(1,index?'#ffe2a888':'#d9f3ff88');ctx.save();ctx.strokeStyle=g;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();}
 }
 // A reflective moving sphere and live collision lighting are presentation, not art stand-ins.
 ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=6;ctx.shadowOffsetY=7;
 const ball=ctx.createRadialGradient(b.x-4,b.y-5,1,b.x,b.y,12);
 ball.addColorStop(0,'#fff');ball.addColorStop(.25,'#e1edf0');ball.addColorStop(.5,'#7e949a');ball.addColorStop(.72,'#233c46');ball.addColorStop(.86,'#f6cc7d');ball.addColorStop(1,'#71868c');
 ctx.fillStyle=ball;ctx.beginPath();ctx.arc(b.x,b.y,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle=index?'#ffe1a8dd':'#e6fbffb0';ctx.lineWidth=1.3;ctx.stroke();ctx.restore();}
 if(!reduced)for(const e of s.effects){ctx.save();ctx.globalCompositeOperation='screen';
  const radius=e.kind==='crane'||e.kind==='jackpot'?100:e.kind==='perfect'?42:60,alpha=Math.min(1,e.life*4),g=ctx.createRadialGradient(e.x,e.y,2,e.x,e.y,radius);
  g.addColorStop(0,e.kind==='metal'?`rgba(255,214,132,${alpha})`:`rgba(111,255,202,${alpha*.8})`);g.addColorStop(1,'transparent');
  ctx.fillStyle=g;ctx.fillRect(e.x-radius,e.y-radius,radius*2,radius*2);
  ctx.restore();}
}
