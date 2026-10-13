import type { PerkId } from '../domain/patrol-survivors';
import { evolutionPreview } from '../engine/survivors-evolution-preview';
import { PERK_CATALOG } from '../engine/patrol-survivors-engine';
import copy from '../../content/localization/survivors-items-ko.json';

export function SurvivorsEvolutionPreview({id, level, active}: {id: PerkId; level: number; active: Partial<Record<PerkId, number>>}) {
  const preview = evolutionPreview(id, level, active);
  if (!preview) return null;
  return <div className="survivors-choice-evolution" data-status={preview.status}>
    <strong>{copy.choice_evolution} · {PERK_CATALOG[preview.evolution].name}</strong>
    <span>{PERK_CATALOG[preview.weapon].name} {preview.weaponLevel}/5 · {PERK_CATALOG[preview.support].name} {preview.supportLevel}/1</span>
    <small>{preview.status === 'evolved' ? copy.evolution_complete : preview.status === 'ready' ? copy.evolution_ready : copy.evolution_progress}</small>
  </div>;
}
