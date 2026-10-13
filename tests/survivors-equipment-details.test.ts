import {describe,it,expect} from 'vitest';
import {equipmentDetails,equipmentCharacterIdentity} from '../src/app/survivors-equipment-details';
import {STORE_ITEMS} from '../src/domain/survivors-store';
import {PERK_CATALOG,EVOLUTION_RECIPES,createInitialSurvivorsState,SurvivorsEngine} from '../src/engine/patrol-survivors-engine';
import type {CharacterId} from '../src/domain/patrol-survivors';
import {mountedNormalEquipment,carriedTool} from '../src/ui/survivors-carried-equipment';
describe('character equipment detail coverage',()=>{
 it('provides complete distinct guides for every free, evolved and PSI item',()=>{
  for(const [kind,ids] of [['normal',Object.keys(PERK_CATALOG)],['premium',STORE_ITEMS.map(item=>item.id)]] as const){
   for(const id of ids){const detail=equipmentDetails(id,kind)!;expect(detail).toBeDefined();for(const key of ['name','mount','feedback','synergy','limit','note'] as const)expect(detail[key].length).toBeGreaterThan(5);expect(detail.stats.length).toBeGreaterThan(0);expect(detail.stats.every(stat=>stat.label&&stat.value&&!stat.value.includes('NaN'))).toBe(true);}
  }
 });
 it('ties support level detail to actual engine stat gains for all six characters',()=>{
  for(const id of ['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'] as CharacterId[]){
   const state=createInitialSurvivorsState(id),engine=SurvivorsEngine.equipmentPreview(state,'steel_boots',3);
   expect(engine.state.player.speed-state.player.speed).toBe(90);
   expect(equipmentDetails('steel_boots','normal',3)?.stats).toContainEqual({label:'이동 속도',value:'+90'});
   expect(equipmentCharacterIdentity(id).length).toBeGreaterThan(30);
  }
 });
 it('shows real shield timing and complete evolution recipes without fictitious unlocks',()=>{
  expect(equipmentDetails('shock_mantle','premium')?.stats).toContainEqual({label:'보호막 소진 후 충전 / 초',value:'18'});
  for(const id of Object.keys(EVOLUTION_RECIPES))expect(equipmentDetails(id,'normal')?.recipe).toMatch(/Lv\.5.*Lv\.1/);
  expect(equipmentDetails('missing','premium')).toBeUndefined();expect(equipmentDetails('toString','normal')).toBeUndefined();
  expect(equipmentDetails('radio_boost','normal',99)?.name).toContain('Lv.5');
 });
 it('reflects character and purchased equipment in attack power and capped cadence',()=>{
  const state=createInitialSurvivorsState('kang_taesik',undefined,undefined,undefined,{owned:['voice_lens'],equipped:['voice_lens']});
  const engine=SurvivorsEngine.equipmentPreview(state,'radio_boost',1);
  const detail=equipmentDetails('radio_boost','normal',1,engine.state.player)!;
  expect(detail.stats).toContainEqual({label:'기본 타격 위력',value:'40.5'});
  engine.state.player.cooldownReduction=.9;
  expect(equipmentDetails('radio_boost','normal',1,engine.state.player)?.stats).toContainEqual({label:'기본 발동 간격 / 초',value:'0.26'});
  expect(detail.stats).toContainEqual({label:'타격 접촉 반경',value:'10'});
 });
 it('replaces mounted base modules with their evolutions while retaining carried tools',()=>{
  const state=createInitialSurvivorsState();state.activePerks.floodlight=5;state.activePerks.tesla_dome=1;state.activePerks.cone_trap=2;state.activePerks.emp_generator=3;state.activePerks.radio_boost=1;
  const modules=mountedNormalEquipment(state);
  expect(modules.map(module=>module.id)).toEqual(['tesla_dome','cone_trap','emp_generator']);
  expect(carriedTool(state)?.id).toBe('radio_boost');
  expect(modules.every(module=>module.level>0)).toBe(true);
 });
});
