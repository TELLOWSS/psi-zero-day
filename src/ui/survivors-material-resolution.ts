import type {SurvivorsGameState,WorkfaceSpecies} from '../domain/patrol-survivors';
import {MATERIAL_FEEL} from '../domain/survivors-material-feel';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {WORKFACE_SPECIES} from '../engine/survivors-workface-roster';
import {drawProp} from './survivors-equipment-art';
import {workfaceAtlas} from './survivors-industrial-art';
import {debrisElevation} from './survivors-animation-rig';
type Kill=NonNullable<SurvivorsGameState['lastKilledEvents']>[number];
interface Resolution {species:WorkfaceSpecies;x:number;y:number;size:number;age:number;elevation:number;facing:number;}
interface Contact {event:ProjectileFeedback;age:number;}
export function resolutionPose(species:WorkfaceSpecies,age:number,index=0,reduced=false){
 const profile=MATERIAL_FEEL[species],t=Math.max(0,Math.min(1,age/1.15));
 const delay=index*.075,p=Math.max(0,Math.min(1,(t-delay)/Math.max(.1,1-delay)));
 const settle=p*p*(3-2*p),osc=Math.sin(p*Math.PI*5)*(1-p);
 const action=profile.action;
 return {x:reduced?0:action==='crumble'||action==='cascade'?(index-1.5)*settle*13:action==='brake'?settle*9:0,
  y:reduced?0:action==='crumble'||action==='cascade'?settle*24:action==='hydraulic'?settle*11:action==='hose'?osc*5:action==='ring'?osc*2:settle*3,
  angle:reduced?0:action==='fold'?settle*.6:action==='crumble'||action==='cascade'?(index%2?1:-1)*settle*.45:action==='dent'?osc*.08:osc*.018,
  scaleY:reduced?1:action==='dent'?1-settle*.25:action==='fold'?1-settle*.35:1,
  alpha:t>=1?0:1-Math.max(0,(t-.55)/.45),t,p,action};
}
/** Receipts only. No RNG, collisions, drops or score; all pools and lifetimes are bounded. */
export class MaterialResolutionLayer {
 private resolutions:Resolution[]=[];
 private contacts:Contact[]=[];
 private marks:Array<{x:number;y:number;age:number;color:string}>=[];
 get size(){return this.resolutions.length;}
 get contactSize(){return this.contacts.length;}
 clear(){this.resolutions=[];this.contacts=[];this.marks=[];}
 observe(events:readonly ProjectileFeedback[],kills:readonly Kill[]){
  const seen=new Set<string>();
  for(const e of events){
   if(e.phase!=='impact'||!e.species||e.worker||e.blocked||(e.appliedDamage??0)<=0)continue;
   const key=e.targetId??`${e.x}:${e.y}`;if(seen.has(key))continue;seen.add(key);
   this.contacts.push({event:e,age:0});
  }
  for(const k of kills){if(!k.species||k.type==='UNHELMETED')continue;
   this.resolutions.push({species:k.species,x:k.x,y:k.y,size:Math.max(k.type==='GAS_LEAK'?76:58,(k.radius??18)*(k.type==='FALLING_DEBRIS'?2.4:2.6)),age:0,elevation:k.type==='FALLING_DEBRIS'?debrisElevation(k.motion?.phase??'fall',k.motion?.timer??0):0,facing:k.type==='RUNAWAY_CART'&&(k.motion?.directionX??0)<0?-1:1});
   this.marks.push({x:k.x,y:k.y,age:0,color:MATERIAL_FEEL[k.species].color});
  }
  this.resolutions=this.resolutions.slice(-16);this.contacts=this.contacts.slice(-24);this.marks=this.marks.slice(-32);
 }
 advance(dt:number){const d=Math.max(0,Math.min(.25,dt));
  this.resolutions=this.resolutions.filter(e=>{e.age+=d;return e.age<1.15;});
  this.contacts=this.contacts.filter(e=>{e.age+=d;return e.age<.32;});
  this.marks=this.marks.filter(e=>{e.age+=d;return e.age<12;});
 }
 drawGround(ctx:CanvasRenderingContext2D){
  for(const m of this.marks){ctx.save();ctx.translate(m.x,m.y);ctx.strokeStyle=m.color;ctx.globalAlpha=.16*Math.min(1,m.age/.4)*Math.min(1,(12-m.age)/2);ctx.lineWidth=1.5;
   // Quiet cleared-workface receipt; never resembles a red/yellow attack telegraph.
   ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(-2,5);ctx.lineTo(9,-6);ctx.stroke();ctx.restore();}
 }
 draw(ctx:CanvasRenderingContext2D,base:HTMLImageElement|undefined,reduced:boolean,busy:boolean,flash=1){
  const atlas=workfaceAtlas(base);if(!atlas)return;
  for(const e of this.resolutions){
   const cell=WORKFACE_SPECIES.indexOf(e.species),parts=['crumble','cascade','fold'].includes(MATERIAL_FEEL[e.species].action)?4:1;
   for(let index=0;index<parts;index++){
    const p=resolutionPose(e.species,e.age,index,reduced);
    const height=e.elevation*(1-p.p);
    ctx.save();ctx.translate(e.x+p.x,e.y+p.y-height);ctx.rotate(p.angle);ctx.scale(e.facing,p.scaleY);ctx.globalAlpha=p.alpha*(busy?.65:1);
    if(parts>1){ctx.beginPath();ctx.rect(-e.size/2+index*e.size/parts,-e.size,e.size/parts,e.size);ctx.clip();}
    drawProp(ctx,atlas,cell,0,0,e.size);ctx.restore();
   }
   const p=resolutionPose(e.species,e.age,0,reduced),profile=MATERIAL_FEEL[e.species];
   if(!reduced&&!busy&&p.t<.85&&['valve','fan','seal','isolate'].includes(p.action)){
    ctx.save();ctx.translate(e.x,e.y-e.size*.5);ctx.strokeStyle=profile.color;ctx.fillStyle=profile.color;ctx.globalAlpha=p.alpha*.65;ctx.lineWidth=1.5;
    if(p.action==='fan'){
      // Fan phase integrates a falling rotation speed rather than stopping instantly.
      ctx.translate(e.size*.17,0);ctx.rotate((1-(1-p.t)**3)*Math.PI*4);
      for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(7,0);ctx.stroke();}
    }else if(p.action==='isolate'){
      for(let i=0;i<3;i++){ctx.globalAlpha=p.t>(i+1)*.2?p.alpha*.2:p.alpha*.7;ctx.beginPath();ctx.arc(-6+i*6,-4,1.5,0,Math.PI*2);ctx.fill();}
    }else if(p.action==='seal'){
      ctx.globalAlpha=p.alpha*.4;ctx.beginPath();ctx.ellipse(e.size*.18,0,3+p.p*4,2+p.p*2,0,0,Math.PI*2);ctx.fill();
    }else{
      ctx.translate(0,-e.size*.13);ctx.rotate(p.p*Math.PI*.8);ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();
    }
    ctx.restore();
   }
   if(!reduced&&!busy&&['valve','fan','seal','isolate'].includes(p.action)){
    ctx.save();ctx.translate(e.x,e.y-e.size*.4);ctx.globalAlpha=(1-p.t)*.35*flash;ctx.strokeStyle=profile.color;ctx.lineWidth=2;
    for(let i=0;i<3;i++){const t=Math.max(0,p.t-i*.12);ctx.beginPath();ctx.arc(i*9-9,-t*18,4+t*10,0,Math.PI*1.4);ctx.stroke();}ctx.restore();
   }
  }
  for(const {event:e,age} of this.contacts){
   const profile=MATERIAL_FEEL[e.species!],t=age/.32;
   ctx.save();ctx.translate(e.x,e.y-8);ctx.rotate(e.angle);ctx.strokeStyle=profile.color;ctx.globalAlpha=(1-t)*(e.finishing?.8:.4)*flash;ctx.lineWidth=e.finishing?2:1;
   const count=reduced?1:busy?2:e.finishing?7:3;
   for(let i=0;i<count;i++){
    const angle=(i/Math.max(1,count-1)-.5)*2.2,distance=reduced?6:5+(1-(1-t)**2)*(e.finishing?30:14);
    ctx.beginPath();ctx.moveTo(Math.cos(angle)*distance,Math.sin(angle)*distance+t*t*8);ctx.lineTo(Math.cos(angle)*(distance+4*(1-t)),Math.sin(angle)*(distance+4*(1-t))+t*t*8);ctx.stroke();
   }
   ctx.restore();
  }
 }
}
