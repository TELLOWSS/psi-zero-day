import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {drawAuthoredImpactSequence} from './survivors-authored-metal-impact';
export const VAPOR_IMPACT_ART='/assets/survivors/vapor-impact-sequence-v1.png';
const origins=[[267,296],[256,313],[256,256],[256,256],[256,256],[256,256]] as const;
export function drawAuthoredVaporImpact(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,event:Readonly<ProjectileFeedback>,age:number,duration:number,reduced:boolean,busy:boolean):boolean{
 if(reduced||event.worker||event.blocked||event.phase!=='impact'||event.actorKind!=='GAS_LEAK'||!atlas?.naturalWidth)return false;
 return drawAuthoredImpactSequence(ctx,atlas,event,age,duration,busy,origins,.75);
}
