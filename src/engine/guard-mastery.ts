import type {DefenseEnemyId} from '../domain/defense';
/** Opt-in post-clear Guard challenge. Keep authored wave timing, enemy identity and previews stable. */
const HP_SCALE:Record<DefenseEnemyId,number>={NORMAL:1.26,SWIFT:1.22,ARMORED:1.33,SWARM:1.12,VEILED:1.3,BOSS:1.45};
const SPEED_SCALE:Record<DefenseEnemyId,number>={NORMAL:1,SWIFT:1.22,ARMORED:1.05,SWARM:1.08,VEILED:1.12,BOSS:1};
export function guardMasteryHp(hp:number,id:DefenseEnemyId,wave:number):number {
  return Math.ceil(hp*HP_SCALE[id]*(1+Math.min(.12,Math.max(0,wave-1)*.018)));
}
export function guardMasterySpeed(id:DefenseEnemyId):number {return SPEED_SCALE[id];}
