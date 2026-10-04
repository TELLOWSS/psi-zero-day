import {drawCinematicFlight,type CinematicLook} from './survivors-cinematic-vfx';
import type { Projectile, ProjectileKind } from '../domain/patrol-survivors';

/** Presentation only: no collision, damage, lifetime or simulation mutation. */
export const PROJECTILE_VFX = {
  radio: { family:'signal', color:'#f9ce78', trail:26, life:.24 },
  satellite_wave: { family:'signal', color:'#87d9ed', trail:38, life:.24 },
  extinguisher: { family:'powder', color:'#e2e8e9', trail:24, life:.22 },
  cryo_blast: { family:'frost', color:'#bcf1f3', trail:32, life:.22 },
  drone_laser: { family:'beam', color:'#8ce7ed', trail:36, life:.14 },
  hunter_beam: { family:'beam', color:'#ceb8ef', trail:52, life:.14 },
  tesla_bolt: { family:'arc', color:'#f8d98c', trail:0, life:.3 },
  emf_beam: { family:'barrier', color:'#dfb4d4', trail:0, life:.3 },
  shout_shockwave: { family:'shock', color:'#f7d689', trail:0, life:.3 },
  cone_trap: { family:'physical', color:'#f7b34f', trail:0, life:.3 },
} as const satisfies Record<ProjectileKind,{family:string;color:string;trail:number;life:number}>;

export function projectileVisual(p: Readonly<Projectile>, level: number, reducedMotion: boolean, busy: boolean) {
  const spec=PROJECTILE_VFX[p.kind];
  return {spec, angle:Math.atan2(p.vy,p.vx), radius:Math.max(1,p.radius),
    tier:Math.min(3,Math.max(1,Math.ceil(level/2))),
    alpha:Math.max(0,Math.min(1,p.duration/spec.life)),
    trail:reducedMotion?0:spec.trail*(.7+Math.min(3,Math.max(1,Math.ceil(level/2)))*.1), detail:!reducedMotion&&!busy};
}

// Bake soft light, powder granules and directional beam materials once per page.
// Every steady frame uses cached drawImage; no per-projectile shadowBlur/filter.
const textures=new Map<string,HTMLCanvasElement>();
function texture(name:string,color:string):HTMLCanvasElement | undefined {
  const key=name+color;if(textures.has(key))return textures.get(key);
  const c=document.createElement('canvas');c.width=256;c.height=128;c.dataset.projectileVfx=name;
  const ctx=c.getContext('2d');if(!ctx)return;
  if(name==='beam') {
    const g=ctx.createLinearGradient(12,0,242,0);g.addColorStop(0,'transparent');g.addColorStop(.6,color);g.addColorStop(1,'#fffce8');
    ctx.fillStyle=g;
    for(let i=5;i>=1;i--){ctx.globalAlpha=i===1?.95:.08;ctx.beginPath();ctx.ellipse(132,64,110,i*5,0,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;ctx.fillStyle='#f4fcff';ctx.fillRect(95,62,144,3);
    ctx.globalAlpha=.5;ctx.fillStyle=color;for(let i=0;i<9;i++)ctx.fillRect(32+i*21,57+(i%3),9,1);
    ctx.globalAlpha=1;
  } else {
    const g=ctx.createRadialGradient(128,64,2,128,64,60);
    g.addColorStop(0,color);g.addColorStop(.30,color);g.addColorStop(1,'transparent');
    ctx.globalAlpha=name==='powder'?.32:.20;ctx.fillStyle=g;ctx.fillRect(0,0,256,128);
    if(name==='powder'||name==='frost') {
      // Deterministic granules avoid random flicker and allocate no particle objects.
      for(let i=0;i<48;i++){
        const a=i*2.39996,r=Math.sqrt((i+.5)/48)*54,x=128+Math.cos(a)*r,y=64+Math.sin(a)*r*.75;
        const dust=ctx.createRadialGradient(x,y,0,x,y,2+(i%5)*1.8);
        dust.addColorStop(0,color);dust.addColorStop(1,'transparent');ctx.fillStyle=dust;ctx.globalAlpha=.18+(i%4)*.10;
        ctx.fillRect(x-10,y-10,20,20);
      }
      if(name==='frost'){ctx.globalAlpha=.65;ctx.strokeStyle='#e8fdff';ctx.lineWidth=1;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(128+Math.cos(a)*12,64+Math.sin(a)*12);ctx.lineTo(128+Math.cos(a)*36,64+Math.sin(a)*36);ctx.stroke();}}
    }
  }
  textures.set(key,c);return c;
}
function stamp(ctx:CanvasRenderingContext2D,name:string,color:string,x:number,y:number,w:number,h:number) {
  const image=texture(name,color);if(image)ctx.drawImage(image,x-w/2,y-h/2,w,h);
}
/** Local exposure from a cached texture, never a fullscreen flash or live blur. */
export function drawProjectileLight(ctx:CanvasRenderingContext2D,color:string,x:number,y:number,radius:number,alpha:number):void {
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;
  stamp(ctx,'light',color,x,y,radius*2,radius*1.2);ctx.restore();
}
function line(ctx:CanvasRenderingContext2D,points:readonly (readonly [number,number])[],color:string,width:number) {
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
}

export function drawProjectileVfx(ctx:CanvasRenderingContext2D,p:Readonly<Projectile>,level:number,time:number,reducedMotion=false,busy=false,cinematic?:{atlas?:HTMLImageElement;look:CinematicLook}):void {
  if(cinematic && drawCinematicFlight(ctx,p,cinematic.look,cinematic.atlas,reducedMotion,busy))return;
  if(p.kind==='cone_trap')return; // Approved equipment sprite belongs to the ground pass.
  const v=projectileVisual(p,level,reducedMotion,busy),{spec,radius:r}=v;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=v.alpha;ctx.lineCap='round';ctx.lineJoin='round';
  const phase=reducedMotion?0:time*3;
  if(spec.family==='powder'||spec.family==='frost'){
    ctx.rotate(v.angle);const cloud=spec.family==='powder'?'powder':'frost';
    ctx.globalAlpha=v.alpha*.82;stamp(ctx,cloud,spec.color,0,0,r*2.3,r*1.45);
    if(v.trail){ctx.globalAlpha=v.alpha*.26;stamp(ctx,cloud,spec.color,-v.trail*.6,0,r*2.5,r*1.25);}
    if(v.detail){
      // Separate turbulent lobes, with a moving granular wake instead of one flat disc.
      ctx.globalAlpha=v.alpha*.32;
      for(let i=0;i<3;i++)stamp(ctx,cloud,spec.color,-i*7,Math.sin(phase+i*2)*r*.22,r*1.1,r*.8);
      for(let i=0;i<6;i++){
        const drift=(time*2+i/6)%1,spread=Math.sin(i*2.39996)*r*(.2+drift*.45);
        ctx.globalAlpha=v.alpha*(1-drift)*.4;
        stamp(ctx,cloud,spec.color,-drift*(v.trail+r),spread,r*(.3+drift*.45),r*(.25+drift*.35));
      }
    }
  } else if(spec.family==='beam'){
    ctx.rotate(v.angle);
    const length=v.trail*(1+v.tier*.18)+r*2;
    // Wide optical envelope, narrow hot core, directional wake. No parallel wire bundle.
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=v.alpha*.38;stamp(ctx,'beam',spec.color,-length*.32,0,length,r*3);
    ctx.globalAlpha=v.alpha;stamp(ctx,'beam',spec.color,-length*.25,0,length,r*1.1);
    if(v.detail){drawProjectileLight(ctx,spec.color,0,0,r*2,.5*v.alpha);
      ctx.globalAlpha=v.alpha*.45;
      for(let i=0;i<2;i++){const progress=(time*7+i*.5)%1;stamp(ctx,'light',spec.color,-progress*length,0,r*(1-progress*.6),r*.45);}
    }
  } else if(spec.family==='signal'){
    ctx.rotate(v.angle);stamp(ctx,'beam',spec.color,-v.trail*.30,0,v.trail+r,r*.85);
    for(let i=0;i<v.tier+1;i++){
      ctx.globalAlpha=v.alpha*(.82-i*.14);ctx.strokeStyle=i===0?'#fff6db':spec.color;ctx.lineWidth=i===0?2:1.2;
      ctx.beginPath();ctx.arc(-i*5,0,r*(.58+i*.16),-1.25,1.25);ctx.stroke();
    }
    if(p.kind==='satellite_wave'&&v.detail){ctx.globalAlpha=v.alpha*.55;line(ctx,[[-12,-r*.5],[-4,0],[-12,r*.5]],spec.color,1);}
  } else if(spec.family==='arc'){
    stamp(ctx,'light',spec.color,0,0,r*2.3,r*1.4);
    const branches=v.detail?5:3;
    for(let i=0;i<branches;i++){
      const a=i*Math.PI*2/branches+(v.detail?Math.sin(phase)*.12:0),cx=Math.cos(a),cy=Math.sin(a);
      const points: [number,number][]=[[cx*r,cy*r],[cx*r*.65-cy*4,cy*r*.65+cx*4],[cx*r*.36+cy*3,cy*r*.36-cx*3],[0,0]];
      line(ctx,points,spec.color,3);line(ctx,points,'#fff7df',1);
    }
    ctx.globalAlpha=v.alpha*.60;ctx.strokeStyle=spec.color;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,2,r*.8,r*.42,0,0,Math.PI*2);ctx.stroke();
  } else if(spec.family==='barrier'){
    // A translucent grounded containment grid; radius remains the collision radius.
    ctx.globalAlpha=v.alpha*.10;ctx.fillStyle=spec.color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=v.alpha*.55;ctx.strokeStyle=spec.color;ctx.lineWidth=1.5;
    ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    const columns=v.detail?5:3;
    for(let i=0;i<columns;i++){const x=(i/(columns-1)-.5)*r*1.5,h=Math.sqrt(Math.max(0,r*r-x*x));line(ctx,[[x,-h],[x,h]],spec.color,.8);}
    ctx.globalAlpha=v.alpha*.8;line(ctx,[[-r*.75,0],[r*.75,0]],'#fceafa',2);
  } else if(spec.family==='shock'){
    // Thin concentric pressure fronts retain the floor and hazard telegraphs.
    for(let i=0;i<3;i++){
      const rr=Math.max(1,r-i*6);ctx.globalAlpha=v.alpha*(i===0?.80:.28);ctx.strokeStyle=i===0?'#fff4cb':spec.color;ctx.lineWidth=i===0?2.5:1;
      ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();
    }
    if(v.detail){ctx.globalAlpha=v.alpha*.45;for(let i=0;i<12;i++){const a=i*Math.PI/6;line(ctx,[[Math.cos(a)*(r-4),Math.sin(a)*(r-4)],[Math.cos(a)*(r+4),Math.sin(a)*(r+4)]],spec.color,1.5);}}
  }
  ctx.restore();
}
