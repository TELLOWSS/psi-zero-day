import {PINBALL_BUMPERS,type SurvivorsPinballEngine} from '../engine/survivors-pinball-engine';
export function drawPinball(ctx:CanvasRenderingContext2D,s:SurvivorsPinballEngine['state'],table:HTMLImageElement,paddle:HTMLImageElement,cargo:HTMLImageElement,reduced:boolean){
 ctx.clearRect(0,0,600,900);ctx.drawImage(table,0,0,600,900);
 const lift=s.effects.find(e=>e.kind==='crane'),progress=lift&&!reduced?Math.sin((1-lift.life/1.2)*Math.PI):0;
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
 // A reflective moving sphere and live collision lighting are presentation, not art stand-ins.
 ctx.save();ctx.shadowColor='#000b';ctx.shadowBlur=6;ctx.shadowOffsetY=7;
 const ball=ctx.createRadialGradient(s.x-4,s.y-5,1,s.x,s.y,12);
 ball.addColorStop(0,'#fff');ball.addColorStop(.25,'#e1edf0');ball.addColorStop(.5,'#7e949a');ball.addColorStop(.72,'#233c46');ball.addColorStop(.86,'#f6cc7d');ball.addColorStop(1,'#71868c');
 ctx.fillStyle=ball;ctx.beginPath();ctx.arc(s.x,s.y,11,0,Math.PI*2);ctx.fill();ctx.restore();
 if(!reduced)for(const e of s.effects){ctx.save();ctx.globalCompositeOperation='screen';
  const radius=e.kind==='crane'?100:60,alpha=Math.min(1,e.life*4),g=ctx.createRadialGradient(e.x,e.y,2,e.x,e.y,radius);
  g.addColorStop(0,e.kind==='metal'?`rgba(255,214,132,${alpha})`:`rgba(111,255,202,${alpha*.8})`);g.addColorStop(1,'transparent');
  ctx.fillStyle=g;ctx.fillRect(e.x-radius,e.y-radius,radius*2,radius*2);
  ctx.restore();}
}
