import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {drawAuthoredImpactSequence} from './survivors-authored-metal-impact';
export const VOICE_LENS_RELEASE_ART='/assets/survivors/voice-lens-release-v1.png';
export const VOICE_LENS_RELEASE_DURATION=.24;
const origins=[[164,262],[133,264],[64,264],[142,233],[130,233],[130,233]] as const;

/** The original pressure filament belongs only to this gear's confirmed radio muzzle. */
export function drawAuthoredRadioLaunch(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,
 event:Readonly<ProjectileFeedback>,age:number,duration:number,reduced:boolean,busy:boolean,equipped:readonly string[]):boolean {
 if(reduced||event.worker||event.blocked||event.phase!=='launch'||event.kind!=='radio'||
  !equipped.includes('voice_lens')||!atlas?.naturalWidth)return false;
 return drawAuthoredImpactSequence(ctx,atlas,event,age,duration,busy,origins,.85,72);
}
