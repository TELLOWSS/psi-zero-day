import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {OMEGA_QUARTER_VIEW} from '../domain/omega-protocol-field';

/**
 * QA-only visual response to the real Watch engine's emitted shot events.
 * No invented fire cadence, gameplay damage, ammo or premium reward changes.
 * Radio/grout launchers use the visible rifle; drones/area/ultimate effects do not.
 */
export interface OmegaActorFireCue{
 readonly until:number;
 readonly screenX:number;
 readonly screenY:number;
}
export const OMEGA_ACTOR_FIRE_CUE_MS=90;
export const OMEGA_EMPTY_FIRE_CUE:OmegaActorFireCue={
 until:0,screenX:1,screenY:0,
};
const handheld=new Set<ProjectileFeedback['kind']>(['radio','grout_slug']);
export function omegaAdvanceActorFireCue(
 previous:OmegaActorFireCue,
 events:readonly ProjectileFeedback[],
 gameTime:number,
):OmegaActorFireCue{
 if(!Number.isFinite(gameTime)||gameTime<0)throw new RangeError('Invalid OMEGA cue time');
 let next=previous.until>gameTime?previous:OMEGA_EMPTY_FIRE_CUE;
 for(const event of events){
  if(event.phase!=='launch'||!handheld.has(event.kind)||!Number.isFinite(event.angle))continue;
  const worldX=Math.cos(event.angle),worldY=Math.sin(event.angle);
  const rawX=worldX+OMEGA_QUARTER_VIEW.skewX*worldY;
  const rawY=OMEGA_QUARTER_VIEW.groundYScale*worldY;
  const length=Math.hypot(rawX,rawY);
  if(length<1e-6)continue;
  next={until:gameTime+OMEGA_ACTOR_FIRE_CUE_MS/1000,
        screenX:rawX/length,screenY:rawY/length};
 }
 return next;
}
export function omegaActorCueActive(
 cue:OmegaActorFireCue,gameTime:number,playing:boolean,
):boolean{
 return playing&&Number.isFinite(gameTime)&&Number.isFinite(cue.until)&&
  gameTime>=0&&cue.until>gameTime;
}
