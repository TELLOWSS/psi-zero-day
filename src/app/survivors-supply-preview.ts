import type {SurvivorsGameState} from '../domain/patrol-survivors';

const fields=['hp','maxHp','speed','damageMultiplier','critRate','dashMaxCooldown','cooldownReduction','pickupRadius'] as const;
export function previewSupplyUpgrade(state:SurvivorsGameState,apply:(state:SurvivorsGameState)=>void) {
  const next=structuredClone(state);
  apply(next);
  return fields.flatMap(field=>{
    const before=state.player[field]??0,after=next.player[field]??0;
    return before===after?[]:[{field,before,after}];
  });
}
