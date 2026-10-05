import type { Hazard } from '../domain/patrol-survivors';

/** A new phase latches only between attacks, never inside an existing warning. */
export function advanceBossPhase(h: Hazard): boolean {
  if (!h.isStageBoss || h.hp <= 0 || h.hp > h.maxHp * .5 || h.bossPhase === 2) return false;
  if(h.bossEncounterManaged && (h.bossAttackCycles??0)<1)return false;
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
