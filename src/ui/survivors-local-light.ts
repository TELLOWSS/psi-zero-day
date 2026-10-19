import type {StageHazardObject} from '../domain/patrol-survivors';
import type {StageActorLight} from './survivors-stage-light';

export interface ActorLocalLight extends StageActorLight {readonly localInfluence:number}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const mixColor=(base:string,weight:number)=>{
 const warm=[255,230,176];
 return '#'+[0,1,2].map(i=>Math.round(parseInt(base.slice(1+i*2,3+i*2),16)*(1-weight)+warm[i]!*weight).toString(16).padStart(2,'0')).join('');
};

/** Real installed floodlights affect presentation only. No collision, exposure or damage. */
export function actorLocalLight(base:Readonly<StageActorLight>,position:{readonly x:number;readonly y:number},objects:readonly StageHazardObject[]):ActorLocalLight {
 let total=0,shadowX=0,shadowY=0;
 for(const object of objects){
  if(object.type!=='floodlight_tower'||object.state!=='active')continue;
  const dx=position.x-object.x,dy=position.y-object.y,distance=Math.hypot(dx,dy);
  if(!Number.isFinite(distance)||!Number.isFinite(object.radius))continue;
  const range=clamp(object.radius*1.8,180,360);
  const t=clamp(1-distance/range,0,1),weight=t*t*(3-2*t);
  const divisor=Math.max(60,distance);
  total+=weight;shadowX+=dx/divisor*.72*weight;shadowY+=dy/divisor*.42*weight;
 }
 if(total===0)return {...base,localInfluence:0};
 // Opposing fixtures blend continuously instead of snapping to a nearest lamp.
 const localInfluence=Math.min(.8,total*.8),ambient=1-localInfluence;
 return {...base,localInfluence,shadowX:base.shadowX*ambient+shadowX/total*localInfluence,
  shadowY:base.shadowY*ambient+shadowY/total*localInfluence,
  opacity:Math.min(.24,base.opacity+.045*localInfluence),fill:Math.min(.18,base.fill+.12*localInfluence),color:mixColor(base.color,localInfluence)};
}
