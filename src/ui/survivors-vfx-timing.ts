import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';

const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
/** Separate fast exposure from material motion; presentation never extends a projectile's lifetime. */
export function weaponContactEnvelope(phase:ProjectileFeedback['phase'],age:number,duration:number){
  const t=Math.max(0,Math.min(1,age/Math.max(.001,duration)));
  const exposure=phase==='launch'?smooth(t/.08)*(1-smooth((t-.22)/.68)):phase==='impact'?(1-t)**3:(1-t)**2*.35;
  const material=smooth(t/.12)*(1-t)**.7;
  return {t,exposure,material,travel:1-(1-t)**3,settle:t*t};
}
