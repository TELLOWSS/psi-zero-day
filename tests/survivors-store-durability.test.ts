import {expect,it} from 'vitest';
import {sanitizeInventory,itemDurability,repairStoreItem,storeRepairCost,wearStoreItems,buyAndEquipLoadout,equipStoreItem,storeEffects} from '../src/domain/survivors-store';
import {fittingLoadout} from '../src/domain/survivors-fitting';
import {applyPremiumLoadout} from '../src/engine/survivors-premium-gear';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';

it('migrates old ownership at full condition and sanitizes broken/unknown equipment',()=>{
 const old={owned:['voice_lens','inspection_wing'],equipped:['voice_lens','inspection_wing']};
 expect(itemDurability(sanitizeInventory(old),'voice_lens')).toBe(100);
 const broken=sanitizeInventory({...old,durability:{voice_lens:-10,inspection_wing:200,unknown:7}});
 expect(broken.equipped).toEqual(['inspection_wing']);expect(broken.durability).toEqual({voice_lens:0,inspection_wing:100});
 expect(storeEffects(broken).damage).toBe(0);expect(equipStoreItem(broken,'voice_lens')).toBe(broken);
});
it('wears every used item once, including unequipped gear, without consuming ownership',()=>{
 const inventory={owned:['voice_lens','inspection_wing','rescue_shell'],equipped:['inspection_wing'],durability:{voice_lens:10,inspection_wing:85,rescue_shell:100}};
 const before=structuredClone(inventory),worn=wearStoreItems(inventory,['voice_lens','voice_lens','inspection_wing','missing']);
 expect(worn.durability).toEqual({voice_lens:0,inspection_wing:70,rescue_shell:100});
 expect(worn.owned).toEqual(before.owned);expect(inventory).toEqual(before);
});
it('repairs proportionally, charges only on success, and does not auto-equip broken gear',()=>{
 const inventory={owned:['voice_lens'],equipped:[],durability:{voice_lens:85}};
 expect(storeRepairCost(inventory,'voice_lens')).toBe(24);
 expect(repairStoreItem(inventory,23,'voice_lens')).toBeNull();
 const result=repairStoreItem(inventory,24,'voice_lens')!;
 expect(result.credits).toBe(0);expect(result.inventory.durability?.voice_lens).toBe(100);expect(result.inventory.equipped).toEqual([]);
 expect(repairStoreItem(result.inventory,500,'voice_lens')).toBeNull();
 expect(repairStoreItem(inventory,Infinity,'voice_lens')).toBeNull();
});
it('atomically buys a multi-slot loadout; invalid/broken/over-budget quotes never partially charge',()=>{
 const inventory={owned:[],equipped:[]};
 expect(buyAndEquipLoadout(inventory,1699,['voice_lens','rescue_shell'])).toBeNull();
 const result=buyAndEquipLoadout(inventory,1700,['voice_lens','rescue_shell'])!;
 expect(result.credits).toBe(0);expect(result.inventory.equipped).toEqual(['voice_lens','rescue_shell']);
 expect(result.inventory.durability).toEqual({voice_lens:100,rescue_shell:100});
 expect(buyAndEquipLoadout(inventory,10000,['voice_lens','command_array'])).toBeNull();
 expect(buyAndEquipLoadout({...result.inventory,durability:{voice_lens:0,rescue_shell:100}},10000,['voice_lens'])).toBeNull();
 expect(fittingLoadout(inventory,['voice_lens','rescue_shell']).equipped).toHaveLength(2);expect(inventory.owned).toEqual([]);
});
it('applies paused gear without resetting damage, perks, time or repeated shield/tactics grants',()=>{
 const inventory={owned:['rescue_shell','shock_mantle','barrier_forge'],equipped:[]};
 const state=createInitialSurvivorsState('player');state.phase='playing';
 expect(applyPremiumLoadout(state,inventory)).toBe(false);
 state.phase='paused';state.player.hp=25;state.player.damageMultiplier+=.7;state.gameTime=123;
 const perks={...state.activePerks},charges=state.fieldTactics!.lineCharges;
 applyPremiumLoadout(state,{...inventory,equipped:['shock_mantle','barrier_forge']});
 expect(state.player.hp).toBe(25);expect(state.player.maxHp).toBe(120);expect(state.premiumGear?.shield).toBe(45);
 expect(state.fieldTactics?.lineCharges).toBe(charges+3);
 state.premiumGear!.shield=0;state.premiumGear!.shieldCooldown=8;
 applyPremiumLoadout(state,inventory);applyPremiumLoadout(state,{...inventory,equipped:['shock_mantle','barrier_forge']});
 expect(state.premiumGear?.shield).toBe(0);expect(state.premiumGear?.shieldCooldown).toBe(8);
 expect(state.fieldTactics?.lineCharges).toBe(charges+3);expect(state.gameTime).toBe(123);
 expect(state.activePerks).toEqual(perks);expect(state.player.damageMultiplier).toBeCloseTo(1.7);
 expect(state.premiumGear?.used).toEqual(['shock_mantle','barrier_forge']);
});
