import type {Hazard} from '../domain/patrol-survivors';
import text from '../../content/localization/survivors-boss-ko.json';
import {bossCoreStatus} from '../engine/survivors-boss-pattern';

export function bossCombatReadout(h: Readonly<Hazard>): string {
  const p=h.bossGameplay;
  if(p)return text.combat[p.combatPhase]+(p.combatPhase==='burst'?` ${Math.max(0,p.burstRemaining).toFixed(1)}s`:'');
  const core=bossCoreStatus(h);return core==='active'?text.status[h.motion?.phase??'approach']:text.core[core];
}
export function bossCombatHint(h: Readonly<Hazard>): string {
  return h.bossGameplay?text.combatHint[h.bossGameplay.combatPhase]:bossCoreStatus(h)==='interlocked'?text.interlock:text.hint[h.type];
}
