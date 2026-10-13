import type {Hazard} from '../domain/patrol-survivors';
import text from '../../content/localization/survivors-boss-ko.json';
import {bossCoreStatus} from '../engine/survivors-boss-pattern';

export function bossCombatReadout(h: Readonly<Hazard>): string {
  const p=h.bossGameplay;
  if(p?.gangform&&['pattern','weak_point'].includes(p.combatPhase))return text.gangform[p.gangform.step]+(p.combatPhase==='weak_point'?` ${p.gangform.zones.filter(z=>z.hp===0).length}/2`:'');
  if(p)return text.combat[p.combatPhase]+(p.combatPhase==='burst'?` ${Math.max(0,p.burstRemaining).toFixed(1)}s`:'');
  const core=bossCoreStatus(h);return core==='active'?text.status[h.motion?.phase??'approach']:text.core[core];
}
export function bossCombatHint(h: Readonly<Hazard>): string {
  return h.bossGameplay?text.combatHint[h.bossGameplay.combatPhase]:bossCoreStatus(h)==='interlocked'?text.interlock:text.hint[h.type];
}
