import {describe,expect,it} from 'vitest';
import copy from '../content/localization/survivors-store-ko.json';
import {STORE_ITEMS,STORE_CLEAR_WEAR} from '../src/domain/survivors-store';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {applyPremiumLoadout} from '../src/engine/survivors-premium-gear';

describe('store effect claims match actual equipment',()=>{
  it.each(STORE_ITEMS)('$id applies the advertised additive stats and resource counts',item=>{
    const plain=createInitialSurvivorsState('player');
    const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:[item.id],equipped:[item.id]});
    const e=item.effects,text=copy.items[item.id as keyof typeof copy.items].description;
    for(const [effect,stat] of [['damage','damageMultiplier'],['cooldown','cooldownReduction'],['crit','critRate'],
      ['pickup','pickupRadius'],['speed','speed'],['hp','maxHp'],['regen','regenRate']] as const){
      expect(state.player[stat]-plain.player[stat]).toBeCloseTo(e[effect]??0);
      if(e[effect]!==undefined)expect(text).toContain(`+${Number((e[effect]!*(effect==='damage'||effect==='cooldown'||effect==='crit'?100:1)).toFixed(2))}${effect==='damage'||effect==='cooldown'||effect==='crit'?'%p':''}`);
    }
    if(e.shield){expect(state.premiumGear!.shield).toBe(e.shield);expect(text).toContain(`보호막 ${e.shield}`);expect(text).toContain(`${e.shieldPeriod}초`);}
    if(e.lines){expect(state.fieldTactics!.lineCharges-plain.fieldTactics!.lineCharges).toBe(e.lines);expect(text).toContain(`통제선 +${e.lines}회`);}
    if(e.support){expect(state.fieldTactics!.supportCharges-plain.fieldTactics!.supportCharges).toBe(e.support);expect(text).toContain(`보급 호출 +${e.support}회`);}
    if(e.ultimate)expect(text).toContain(`초당 샤우팅 충전 +${e.ultimate}`);
    if(e.suppression)expect(text).toContain(`${e.suppression*100}% 감속`);
  });
  it.each(['barrier_forge','predictive_watch'])('%s grants at first mid-run equip, not every re-equip',id=>{
    const state=createInitialSurvivorsState();state.phase='paused';
    const before={...state.fieldTactics!},inventory={owned:[id],equipped:[id]};
    expect(copy.items[id as keyof typeof copy.items].description).toContain('작전당 최초 장착 시');
    expect(applyPremiumLoadout(state,inventory)).toBe(true);
    const after={...state.fieldTactics!},e=STORE_ITEMS.find(item=>item.id===id)!.effects;
    expect(after.lineCharges-before.lineCharges).toBe(e.lines??0);
    expect(after.supportCharges-before.supportCharges).toBe(e.support??0);
    applyPremiumLoadout(state,{owned:[id],equipped:[]});applyPremiumLoadout(state,inventory);
    expect(state.fieldTactics!.lineCharges).toBe(after.lineCharges);
    expect(state.fieldTactics!.supportCharges).toBe(after.supportCharges);
  });
  it('keeps wear and failed-save currency wording aligned with the existing rule',()=>{
    expect(copy.wearRule).toContain(`−${STORE_CLEAR_WEAR}`);
    expect(copy.failure).toContain('PSI');
    expect(copy.failure).not.toContain('크레딧');
  });
});
