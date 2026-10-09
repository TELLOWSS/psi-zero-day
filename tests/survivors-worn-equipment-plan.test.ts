import {expect,it} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {wornEquipmentPlans,WORN_CALIBRATIONS,DIRECTIONAL_WORN_CALIBRATIONS,wornView} from '../src/ui/survivors-worn-equipment-plan';
it('maps every noncommunication purchase to its own worn art without granting effects',()=>{
 for(const item of STORE_ITEMS.filter(item=>item.category!=='communication')){
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:[item.id],equipped:[item.id]});const before=JSON.stringify(state);
  const plan=wornEquipmentPlans(state).find(plan=>plan.id===item.id)!;expect(plan.cell).toBe(item.art);expect(plan.atlas).toBe('premium');expect(JSON.stringify(state)).toBe(before);
 }
});
it('replaces each base mount with its evolution and keeps passive training unmounted',()=>{
 const s=createInitialSurvivorsState();s.activePerks.extinguisher=5;s.activePerks.cryo_blizzard=1;s.activePerks.quick_reflexes=3;
 const plans=wornEquipmentPlans(s);expect(plans.some(p=>p.id==='extinguisher')).toBe(false);expect(plans.find(p=>p.id==='cryo_blizzard')?.cell).toBe(1);expect(plans.some(p=>p.id==='quick_reflexes')).toBe(false);
});
it('mounts support hardware to the relevant body parts and calibrates all six originals',()=>{
 const s=createInitialSurvivorsState();for(const id of ['safety_harness','steel_boots','magnet_beacon','data_chip'] as const)s.activePerks[id]=1;
 const plans=wornEquipmentPlans(s);expect(plans.find(p=>p.id==='steel_boots')?.part).toBe('boots');expect(plans.find(p=>p.id==='safety_harness')?.part).toBe('chest');
 for(const id of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor']){
  const fitting=WORN_CALIBRATIONS[id]!;expect(fitting).toBeDefined();for(const point of [fitting.chest,fitting.tempo,fitting.back,fitting.belt,fitting.wrist])for(const value of point)expect(value).toBeGreaterThan(0);
 }
 expect(WORN_CALIBRATIONS.kang_taesik!.wrist).not.toEqual(WORN_CALIBRATIONS.player!.wrist);
});

it('selects side and rear construction and mirrors the opposite side',()=>{
 expect(wornView()).toEqual({view:'front',mirror:false});
 for(const d of [0,4])expect(wornView(d).view).toBe('side');
 expect(wornView(4).mirror).toBe(true);expect(wornView(0).mirror).toBe(false);
 for(const d of [5,6,7])expect(wornView(d).view).toBe('rear');
 for(const d of [1,2,3])expect(wornView(d).view).toBe('front');
 expect(wornView(-1)).toEqual(wornView(7));
});
it('keeps the foreman wrist at the pointing hand and other role wrists at their own tools',()=>{
 const profiles=Object.values(DIRECTIONAL_WORN_CALIBRATIONS);expect(profiles).toHaveLength(6);
 for(const p of profiles){expect(p.wristX).toHaveLength(8);expect(p.beltY).toBeGreaterThan(p.chestY);expect(p.wristX.every(Number.isFinite)).toBe(true);}
 expect(DIRECTIONAL_WORN_CALIBRATIONS.kang_taesik!.wristY).toBeLessThan(DIRECTIONAL_WORN_CALIBRATIONS.player!.wristY);
 expect(DIRECTIONAL_WORN_CALIBRATIONS.yoon_sungho!.wristY).toBeGreaterThan(DIRECTIONAL_WORN_CALIBRATIONS.player!.wristY);
});
