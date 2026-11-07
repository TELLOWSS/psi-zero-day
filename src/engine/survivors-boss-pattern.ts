import type { Hazard } from '../domain/patrol-survivors';
import type {PatrolDifficulty} from '../domain/survivors-challenge';

export function bossCoreFloor(h:Readonly<Hazard>):number {
  if(!h.bossEncounterManaged)return 0;
  if(h.bossGameplay)return h.bossGameplay.combatPhase==='burst'||h.bossGameplay.combatPhase==='secured'?0:h.hp;
  return h.bossPhase!==2?h.maxHp*.5:(h.bossAttackCycles??0)<1?h.maxHp*.08:0;
}
export function bossCoreStatus(h:Readonly<Hazard>,difficulty:PatrolDifficulty|boolean='standard'):'active'|'interlocked'|'exposed' {
 const tier=typeof difficulty==='boolean'?(difficulty?'mastery':'standard'):difficulty;
  if(h.bossGameplay){
    const gameplay=h.bossGameplay;
    if(gameplay.combatPhase==='burst'&&gameplay.burstFloorHp!==undefined&&h.hp<=gameplay.burstFloorHp+.001)return 'interlocked';
    return gameplay.combatPhase==='weak_point'||gameplay.combatPhase==='burst'?'exposed':'interlocked';
  }
  const floor=h.isStageBoss?Math.max(bossCoreFloor(h),bossCycleFloor(h,tier)):bossCoreFloor(h);
  if(floor>0&&h.hp<=floor+.001)return 'interlocked';
  return floor===0&&(h.motion?.phase==='cooldown'||h.motion?.phase==='spent')?'exposed':'active';
}

/** A new phase latches only between attacks, never inside an existing warning. */
export function advanceBossPhase(h: Hazard,difficulty:PatrolDifficulty='standard'): boolean {
  if (!h.isStageBoss || h.hp <= 0 || h.hp > h.maxHp * .5 || h.bossPhase === 2) return false;
  if(h.bossEncounterManaged && (h.bossAttackCycles??0)<(!h.bossGameplay&&difficulty!=='story'?2:1))return false;
  if(h.bossGameplay&&h.bossGameplay.combatPhase!=='recovery')return false;
  const phase=h.motion?.phase;
  if (phase==='warning'||phase==='charge'||phase==='fall') return false;
  h.bossPhase=2;
  if(h.bossEncounterManaged)h.bossAttackCycles=0;
  if(h.motion&&(phase==='cooldown'||phase==='spent'))h.motion.timer=Math.max(h.motion.timer,1.5);
  return true;
}

export function bossPattern(h: Hazard) {
  const intensified=h.isStageBoss&&h.bossPhase===2;
  return {
    warning:h.type==='CRANE_BOSS'?1.4:h.type==='RUNAWAY_CART'?1.2:1.25,
    burst:intensified?1.18:1,
    recovery:h.type==='FALLING_DEBRIS'?(intensified?2:3):h.type==='CRANE_BOSS'?(intensified?1.7:2.2):1.5,
    pulseDuration:intensified?.9:.65,
  };
}

/** Stage-50 structural core: every phase releases only after warned attacks.
 * Phase 1: story 1 read, otherwise 2. Phase 2: story 1, standard 2,
 * hard/extreme 3, mastery 4. DPS alone cannot break the core.
 */
export function bossCycleFloor(h:Readonly<Hazard>,difficulty:PatrolDifficulty='standard'):number {
 if(!h.isStageBoss||!h.bossEncounterManaged||h.bossGameplay)return 0;
 const cycles=Math.max(0,Math.floor(h.bossAttackCycles??0));
 const phase1Reads=difficulty==='story'?1:2;
 const phase2Reads=difficulty==='story'?1:difficulty==='standard'?2:difficulty==='mastery'?4:3;
 return h.bossPhase===2
  ?Math.max(0,h.maxHp*.5*(1-Math.min(phase2Reads,cycles)/phase2Reads))
  :Math.max(h.maxHp*.5,h.maxHp*(1-.5*Math.min(phase1Reads,cycles)/phase1Reads));
}
/** Stable mastery API used by existing deterministic audit. */
export function masteryBossCycleFloor(h:Readonly<Hazard>):number {return bossCycleFloor(h,'mastery');}
