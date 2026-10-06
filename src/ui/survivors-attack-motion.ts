import type {ProjectileKind} from '../domain/patrol-survivors';
export type AttackMotion='shot'|'spray'|'ultimate';
export const ATTACK_MOTION={shot:{duration:.24,rise:.025,strength:1},spray:{duration:.34,rise:.055,strength:.7},ultimate:{duration:.42,rise:.045,strength:1}} as const;
const ease=(value:number)=>value*value*(3-2*value);
export function commandFrame(progress = 0): number {
 return Number.isFinite(progress) && progress > 0 && progress < 1 ? Math.min(7, Math.floor(progress * 8)) : 0;
}
export function attackProgress(elapsed:number,kind:AttackMotion='shot'):number {
 return Number.isFinite(elapsed)&&elapsed>=0&&elapsed<ATTACK_MOTION[kind].duration ? elapsed/ATTACK_MOTION[kind].duration : 0;
}
/** Fast recoil onset and eased recovery, in simulation seconds after emission. */
export function attackEnvelope(elapsed:number,kind:AttackMotion='shot'):number {
 if(!Number.isFinite(elapsed)||elapsed<0)return 0;
 const p=ATTACK_MOTION[kind];if(elapsed>=p.duration)return 0;
 return p.strength*(elapsed<p.rise?ease(elapsed/p.rise):1-ease((elapsed-p.rise)/(p.duration-p.rise)));
}
export function projectileAttackMotion(kind:ProjectileKind):AttackMotion|undefined {
 if(kind==='radio'||kind==='satellite_wave')return 'shot';
 if(kind==='extinguisher'||kind==='cryo_blast'||kind==='grout_slug'||kind==='hydraulic_wave')return 'spray';
 if(kind==='shout_shockwave'||kind==='emp_pulse'||kind==='plasma_arc')return 'ultimate';
 return undefined;
}
