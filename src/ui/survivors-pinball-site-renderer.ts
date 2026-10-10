import type {PinballSite} from '../engine/survivors-pinball-site';
/** All rigid objects use final authored alpha sprites. Procedural light/water are live surface effects. */
export function drawSiteSprite(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,tile:number,x:number,y:number,width:number,height=width,angle=0,alpha=1,piece?:number){
 const cw=atlas.naturalWidth/4,ch=atlas.naturalHeight/3;let sx=tile%4*cw,sy=Math.floor(tile/4)*ch,sw=cw,sh=ch;if(piece!==undefined){sx+=piece%2*cw/2;sy+=Math.floor(piece/2)*ch/2;sw/=2;sh/=2;}
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.shadowColor='#0009';ctx.shadowBlur=4;ctx.shadowOffsetY=4;ctx.drawImage(atlas,sx,sy,sw,sh,-width/2,-height/2,width,height);ctx.restore();
}
const environmentRects=[
 [.005,.025,.292,.26],[.324,.015,.156,.49],[.507,.025,.22,.47],[.745,.015,.25,.49],
 [.02,.60,.25,.34],[.31,.515,.18,.465],[.52,.52,.205,.45],[.74,.515,.255,.46],
] as const;
function environmentSprite(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,tile:number,x:number,y:number,w:number,h:number,angle=0,alpha=1){const rect=environmentRects[tile];if(!rect)return;const [sx,sy,sw,sh]=rect;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.drawImage(atlas,sx*atlas.naturalWidth,sy*atlas.naturalHeight,sw*atlas.naturalWidth,sh*atlas.naturalHeight,-w/2,-h/2,w,h);ctx.restore();}
export function drawSiteEnvironment(ctx:CanvasRenderingContext2D,site:PinballSite,time:number,reduced:boolean,atlas:HTMLImageElement,environment?:HTMLImageElement){
 const active=site.active>0,t=reduced?0:time;
 // Edge bulbs have staggered breathing. The ball floor is never flooded with white.
 ctx.save();ctx.globalCompositeOperation='screen';for(const x of [35,565])for(let i=0;i<5;i++){const y=290+i*93,pulse=.12+(active?.2:.07)*(1+Math.sin(t*2.1+i*.8));const g=ctx.createRadialGradient(x,y,1,x,y,active?38:25);g.addColorStop(0,`rgba(255,194,83,${pulse})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-38,y-38,76,76);}ctx.restore();
 if(environment){
  for(const x of [65,535]){environmentSprite(ctx,environment,2,x,105,46,46);ctx.save();ctx.beginPath();ctx.arc(x,105,16,0,Math.PI*2);ctx.clip();environmentSprite(ctx,environment,2,x,105,46,46,t*(active?3:1));ctx.restore();}
  if(site.id==='cargo'){
   const boatX=185+Math.sin(t*.18)*45,boatY=44+Math.sin(t*.75)*1.5;environmentSprite(ctx,environment,1,boatX,boatY,24,46,Math.PI/2+.04*Math.sin(t*.4));
   ctx.save();ctx.globalAlpha=reduced?0:.22;ctx.strokeStyle='#d5fbff';ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(boatX-25-i*7,boatY,5+i*4,7+i*3,0,-.7,.7);ctx.stroke();}ctx.restore();
  }
  if(site.id==='cargo'||site.id==='tower'||site.id==='factory'){
   environmentSprite(ctx,environment,0,300,62,185,49);const trolley=300+Math.sin(t*.65)*36,drop=active?Math.sin(t*2)*10:0;
   ctx.save();ctx.strokeStyle='#c0b9a1';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(trolley,65);ctx.lineTo(trolley,108-drop);ctx.stroke();ctx.restore();drawSiteSprite(ctx,atlas,4,trolley,115-drop,55,39,Math.sin(t*.65)*.04);
  }
  if(site.id==='conveyor'||site.id==='foundry'||site.id==='demolition')environmentSprite(ctx,environment,3,300,87+(active?Math.sin(t*4)*5:Math.sin(t)*1.5),94,76);
  if(site.id==='conveyor'||site.id==='rail')environmentSprite(ctx,environment,4,300,110,78,37);
  if(site.id==='rail'||site.id==='power'){environmentSprite(ctx,environment,5,480,92,24,45);ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=site.switch%2?'#62ff9d77':'#ffba6466';ctx.beginPath();ctx.arc(480,site.switch%2?100:83,5,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(site.id==='zeroday'||site.id==='power')environmentSprite(ctx,environment,7,300,88,72,72,t*(active?1.5:.18));
  if(!reduced&&(site.id==='foundry'||site.id==='water'||site.id==='tunnel'||site.id==='demolition'))for(let i=0;i<3;i++){const f=(t*.22+i/3)%1;environmentSprite(ctx,environment,6,site.id==='water'?480:110+i*175,110-f*55,35+f*24,38+f*28,Math.sin(t+i)*.05,(1-f)*(active?.38:.18));}
 }
 if(site.id==='factory')return;
 if(site.id==='cargo'||site.id==='water'){
  // Water highlights remain outside collision space, anchored to harbor/tank surfaces.
  ctx.save();ctx.beginPath();ctx.rect(site.id==='cargo'?130:40,10,site.id==='cargo'?220:210,site.id==='cargo'?58:80);ctx.clip();ctx.globalCompositeOperation='screen';ctx.strokeStyle=active?'#92eaff80':'#9bdbed45';ctx.lineWidth=1.4;
  for(let i=0;i<13;i++){ctx.beginPath();for(let x=0;x<600;x+=8){const y=20+i*5+Math.sin(x*.045+t*1.6+i)*2.8;ctx.lineTo(x,y);}ctx.stroke();}ctx.restore();
 }
 if(site.id==='conveyor'||site.id==='rail'){
  ctx.save();ctx.beginPath();ctx.rect(252,68,96,58);ctx.clip();for(let i=-2;i<8;i++)drawSiteSprite(ctx,atlas,11,300,70+i*12+(t*(active?44:16))%12,80,11);ctx.restore();
 }
 if(site.id==='power'||site.id==='zeroday'){
  ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(300,80,4,300,80,80);g.addColorStop(0,`rgba(57,227,255,${.1+(.08*(1+Math.sin(t*2)))+(active?.25:0)})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(220,0,160,160);ctx.restore();
 }
 if(site.id==='foundry'||site.id==='tunnel'||site.id==='demolition'){
  ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<(reduced?0:7);i++){const f=(t*.25+i*.17)%1,x=120+i*58+Math.sin(t+i)*9,y=115-f*100;const g=ctx.createRadialGradient(x,y,1,x,y,9+f*14);g.addColorStop(0,`rgba(${site.id==='foundry'?'255,154,65':'177,187,182'},${.1*(1-f)})`);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-25,y-25,50,50);}ctx.restore();
 }
 if(site.id==='water')for(const x of [100,490])drawSiteSprite(ctx,atlas,6,x,105,30,30,t*(active?1.2:.25));
 // A separate cargo layer makes the crane physically sway/lift on successful activation.
 if(!environment&&(site.id==='cargo'||site.id==='tower'))drawSiteSprite(ctx,atlas,4,300+Math.sin(t*.7)*6,90-(active?18*(1+Math.sin(t*2)):0),75,55,Math.sin(t*.7)*.035);
}
export function drawSiteObjects(ctx:CanvasRenderingContext2D,site:PinballSite,atlas:HTMLImageElement,time:number,reduced:boolean,lit:readonly boolean[]){
 if(site.id==='factory')return;
 for(const [ax,ay,bx,by] of site.rails)drawSiteSprite(ctx,atlas,11,(ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay)+20,22,Math.atan2(by-ay,bx-ax));
 site.layout.lanes.forEach((lane,i)=>{ctx.save();ctx.strokeStyle=site.laneCooldown[i]?'#f9dfa3':'#63b5b0a0';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.lineDashOffset=reduced?0:-time*20;ctx.beginPath();ctx.arc(lane.x,lane.y,lane.r,0,Math.PI*2);ctx.stroke();ctx.restore();});
 site.layout.bumper.forEach((b,i)=>{const e=lit[i]?1.06:1;drawSiteSprite(ctx,atlas,10,b.x,b.y,(b.r+9)*2*e);});
 site.layout.targets.forEach((target,i)=>{if((site.hp[i]??0)<=0)return;drawSiteSprite(ctx,atlas,site.layout.sprite,target.x,target.y,58,58,site.id==='water'&&!reduced?time*.3:0);ctx.save();ctx.fillStyle='#07141dcc';ctx.fillRect(target.x-17,target.y+21,34,4);ctx.fillStyle=site.id==='power'&&i===site.sequence?'#7cf5ff':'#efd09b';ctx.fillRect(target.x-17,target.y+21,34*(site.hp[i]??0)/target.hp,4);ctx.restore();});
 if(!reduced)for(const fragment of site.fragments)drawSiteSprite(ctx,atlas,fragment.tile,fragment.x,fragment.y,25,25,fragment.angle,fragment.life/.8,fragment.piece);
 // Beams and arcs trace actual damaging projectiles/links, not decorative shooting loops.
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';for(const shot of site.shots){ctx.strokeStyle=site.active>0?'#fff0a3':'#91eaff';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=reduced?0:12;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(shot.x-shot.vx*.018,shot.y-shot.vy*.018);ctx.lineTo(shot.x,shot.y);ctx.stroke();}
 if(!reduced)for(const a of site.arcs){ctx.strokeStyle='#adf8ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.ax,a.ay);ctx.lineTo((a.ax+a.bx)/2+8,(a.ay+a.by)/2-12);ctx.lineTo(a.bx,a.by);ctx.stroke();}ctx.restore();
}
