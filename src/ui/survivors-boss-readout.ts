import type {Hazard} from '../domain/patrol-survivors';
import type {PatrolDifficulty} from '../domain/survivors-challenge';
import text from '../../content/localization/survivors-boss-ko.json';
import {bossCoreStatus} from '../engine/survivors-boss-pattern';

/** Report completed warned boss attack cycles, never hypothetical evasions.
 * The counter resets with each phase and cannot exceed the authored limit. */
export function bossPatternReadCount(h:Readonly<Hazard>,difficulty:PatrolDifficulty='standard'):string {
 if(!h.isStageBoss||!h.bossEncounterManaged||h.bossGameplay)return '';
 const phase=h.bossPhase===2?2:1;
 const target=phase===1?(difficulty==='story'?1:2):
  difficulty==='story'?1:difficulty==='standard'?2:difficulty==='mastery'?4:3;
 const cycles=Number.isFinite(h.bossAttackCycles)?Math.floor(h.bossAttackCycles!):0;
 const completed=Math.max(0,Math.min(target,cycles));
 return `P${phase} ${completed}/${target}`;
}
export function bossCombatReadout(h: Readonly<Hazard>,difficulty:PatrolDifficulty='standard'): string {
  const p=h.bossGameplay;
  if(p?.gangform&&['pattern','weak_point'].includes(p.combatPhase))return text.gangform[p.gangform.step]+(p.combatPhase==='weak_point'?` ${p.gangform.zones.filter(z=>z.hp===0).length}/2`:'');
  if(p)return text.combat[p.combatPhase]+(p.combatPhase==='burst'?` ${Math.max(0,p.burstRemaining).toFixed(1)}s`:'');
  const core=bossCoreStatus(h,difficulty),cycles=bossPatternReadCount(h,difficulty);
  const status=core==='active'?text.status[h.motion?.phase??'approach']:text.core[core];
  return cycles?`${status} · ${cycles}`:status;
}
export function bossCombatHint(h: Readonly<Hazard>,difficulty:PatrolDifficulty='standard'): string {
  if(h.bossGameplay?.gangform?.step==='drop_zone'&&h.bossGameplay.combatPhase==='weak_point')return text.gangformIntervention;
  return h.bossGameplay?text.combatHint[h.bossGameplay.combatPhase]:bossCoreStatus(h,difficulty)==='interlocked'?text.interlock:text.hint[h.type];
}
