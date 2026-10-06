import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {drawAuthoredImpactSequence} from './survivors-authored-metal-impact';

export const INSPECTION_DRONE_LAUNCH_ART='/assets/survivors/inspection-drone-launch-v1.png';
export const HUNTER_DRONE_LAUNCH_ART='/assets/survivors/hunter-drone-launch-v1.png';
const origins=[[169,259],[208,262],[208,262],[208,262],[208,262],[208,262]] as const;
const hunterOrigins=Array.from({length:6},()=>[194,263] as const);

/** A short directional muzzle sequence at the engine's recorded emission origin. */
export function drawAuthoredDroneLaunch(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,event:Readonly<ProjectileFeedback>,age:number,duration:number,reduced:boolean,busy:boolean,equipped:readonly string[],hunterAtlas?:HTMLImageElement):boolean {
 if(reduced||event.worker||event.blocked||event.phase!=='launch')return false;
 if(event.kind==='hunter_beam')return hunterAtlas?.naturalWidth?
  drawAuthoredImpactSequence(ctx,hunterAtlas,event,age,duration,busy,hunterOrigins,.9,80):false;
 if(event.kind!=='drone_laser'||!equipped.includes('inspection_wing')||!atlas?.naturalWidth)return false;
 return drawAuthoredImpactSequence(ctx,atlas,event,age,duration,busy,origins,.85,64);
}
