import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {drawAuthoredImpactSequence} from './survivors-authored-metal-impact';
export const DEBRIS_IMPACT_ART='/assets/survivors/debris-impact-sequence-v1.png';
const origins=[[256,278],[256,280],[256,256],[256,256],[256,256],[256,256]] as const;
export function drawAuthoredDebrisImpact(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,event:Readonly<ProjectileFeedback>,age:number,duration:number,reduced:boolean,busy:boolean):boolean{
 if(reduced||event.worker||event.blocked||event.phase!=='impact'||event.actorKind!=='FALLING_DEBRIS'||!atlas?.naturalWidth)return false;
 return drawAuthoredImpactSequence(ctx,atlas,event,age,duration,busy,origins);
}
