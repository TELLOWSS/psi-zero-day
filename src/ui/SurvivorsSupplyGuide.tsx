import copy from '../../content/localization/survivors-items-ko.json';
import { EVOLUTION_RECIPES, PERK_CATALOG } from '../engine/patrol-survivors-engine';
import { TACTICAL_ITEMS } from '../engine/survivors-items';
import type { PerkId, TacticalItemId } from '../domain/patrol-survivors';

export function SurvivorsSupplyGuide({activePerks}: {activePerks?: Partial<Record<PerkId, number>>}) {
  return <details className="survivors-supply-guide">
    <summary>{copy.guide_title}</summary>
    <p>{copy.supply_rule}</p>
    <div className="survivors-supply-cards">
      {(Object.keys(TACTICAL_ITEMS) as TacticalItemId[]).map(id => {
        const cell = TACTICAL_ITEMS[id].atlasCell;
        return <article key={id}>
          <span className="survivors-supply-art" role="img" aria-label={copy[id].name} style={{backgroundPosition:`${cell % 4 * (100/3)}% ${Math.floor(cell / 4) * 100}%`}} />
          <div><strong>{copy[id].name}</strong><p>{copy[id].description}</p></div>
        </article>;
      })}
    </div>
    <strong>{copy.equipment_progress}</strong><p>{copy.equipment_rule}</p>
    <strong>{copy.evolution_title}</strong><p>{copy.evolution_rule}</p>
    <ul>{Object.entries(EVOLUTION_RECIPES).map(([id, recipe]) => <li key={id}>
      {PERK_CATALOG[recipe.weapon].name} + {PERK_CATALOG[recipe.support].name} → {PERK_CATALOG[id as PerkId].name}
      {activePerks && <small> · {Math.min(5,activePerks[recipe.weapon] ?? 0)}/5 + {Math.min(1,activePerks[recipe.support] ?? 0)}/1</small>}
    </li>)}</ul>
  </details>;
}
