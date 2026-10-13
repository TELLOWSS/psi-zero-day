import {expect,it,vi} from 'vitest';
import {EquipmentAscensionLayer} from '../src/ui/survivors-equipment-ascension';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {cinematicLook} from '../src/ui/survivors-cinematic-vfx';
const atlas={naturalWidth:1448,naturalHeight:1086} as HTMLImageElement;
const ctx=()=>({save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),drawImage:vi.fn()}) as unknown as CanvasRenderingContext2D;
it('fires once per acquisition, expires, resets per run and never changes gameplay',()=>{
  const layer=new EquipmentAscensionLayer(),state=createInitialSurvivorsState(),c=ctx();
  state.activePerks.radio_boost=5;layer.draw(c,state,atlas,false,false);expect(layer.count).toBe(0);
  state.activePerks.satellite_broadcast=1;
  const before=JSON.stringify(state);layer.draw(c,state,atlas,false,false);expect(layer.count).toBe(1);
  state.gameTime=.2;layer.draw(c,state,atlas,false,false);expect(layer.count).toBe(1);
  state.gameTime=1;layer.draw(c,state,atlas,false,false);expect(layer.count).toBe(0);
  expect(JSON.stringify({...state,gameTime:0})).toBe(before);
  layer.draw(c,createInitialSurvivorsState(),atlas,false,false);expect(layer.count).toBe(0);
});
it('caps simultaneous activation and suppresses motion effects when requested',()=>{
  const layer=new EquipmentAscensionLayer(),state=createInitialSurvivorsState(),c=ctx();
  Object.assign(state.activePerks,{satellite_broadcast:1,cryo_blizzard:1,tesla_dome:1,emf_barricade:1,hunter_swarm:1});
  layer.draw(c,state,atlas,true,false);expect(c.drawImage).not.toHaveBeenCalled();
  state.gameTime=.2;layer.draw(c,state,atlas,false,true);expect(c.drawImage).toHaveBeenCalledOnce();
  expect(layer.count).toBeLessThanOrEqual(6);
  expect(c.save).toHaveBeenCalledTimes(2);expect(c.restore).toHaveBeenCalledTimes(2);
});
it('uses distinct cryogenic and electrical contact materials',()=>{
  expect(cinematicLook('cryo_blast',5).impactCell).toBe(1);
  expect(cinematicLook('tesla_bolt',5).impactCell).toBe(2);
  expect(cinematicLook('hunter_beam',5).impactCell).toBe(10);
});
