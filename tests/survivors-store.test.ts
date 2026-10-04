import {describe,it,expect} from 'vitest';
import {STORE_ITEMS,buyStoreItem,equipStoreItem,sanitizeInventory,storeEffects} from '../src/domain/survivors-store';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
describe('PSI purchased equipment',()=>{
  it('charges once and rejects insufficient funds and unknown equipment',()=>{
    const empty={owned:[],equipped:[]};
    expect(buyStoreItem(empty,799,'voice_lens')).toBeNull();
    expect(buyStoreItem(empty,10000,'missing')).toBeNull();
    const result=buyStoreItem(empty,800,'voice_lens')!;
    expect(result.credits).toBe(0);
    expect(buyStoreItem(result.inventory,9000,'voice_lens')).toBeNull();
    expect(empty.owned).toEqual([]);
  });
  it('requires ownership, replaces a category and allows unequipping',()=>{
    const inventory={owned:STORE_ITEMS.map(i=>i.id),equipped:['voice_lens','rescue_shell']};
    const next=equipStoreItem(inventory,'command_array');
    expect(next.equipped).toEqual(['rescue_shell','command_array']);
    expect(equipStoreItem(next,'command_array').equipped).toEqual(['rescue_shell']);
    expect(equipStoreItem({owned:[],equipped:[]},'voice_lens').equipped).toEqual([]);
  });
  it('cleans corrupt saves and prevents stacking same-category gear',()=>{
    const cleaned=sanitizeInventory({owned:['voice_lens','command_array','voice_lens','missing'],equipped:['voice_lens','command_array','rescue_shell']});
    expect(cleaned).toEqual({owned:['voice_lens','command_array'],equipped:['voice_lens']});
    expect(sanitizeInventory(null)).toEqual({owned:[],equipped:[]});
    expect(storeEffects(cleaned).damage).toBe(.15);
  });
  it('applies purchased loadout to a new run without advancing weapon technology',()=>{
    const plain=createInitialSurvivorsState();
    const inventory={owned:['command_array','relay_core','recovery_mesh','recovery_cell'],equipped:['command_array','relay_core','recovery_mesh','recovery_cell']};
    const equipped=createInitialSurvivorsState('yoon',undefined,undefined,undefined,inventory);
    expect(equipped.player.damageMultiplier).toBeCloseTo(plain.player.damageMultiplier+.25);
    expect(equipped.player.cooldownReduction).toBeCloseTo(plain.player.cooldownReduction+.06);
    expect(equipped.player.pickupRadius).toBe(plain.player.pickupRadius+45);
    expect(equipped.player.regenRate).toBe(.6);
    expect(equipped.activePerks).toEqual(plain.activePerks);
    expect(equipped.psiCredits).toBe(0);
  });
});
