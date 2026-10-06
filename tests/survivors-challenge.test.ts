import {describe,it,expect} from 'vitest';
import {spawnPressure} from '../src/engine/survivors-difficulty';
import {tacticalSupplyFor,applyTacticalItem} from '../src/engine/survivors-items';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
describe('selected patrol challenge',()=>{
  it('provides stronger supplies on extreme while preserving charge caps',()=>{
    const state=createInitialSurvivorsState('yoon',undefined,'stage_01','extreme');
    applyTacticalItem(state,'control_kit');expect(state.controlKit).toEqual({charges:3,remaining:18});
    state.ultimateCharge=90;applyTacticalItem(state,'radio_battery');expect(state.ultimateCharge).toBe(state.maxUltimateCharge);
  });
  it('preserves the old default and increases pressure while preserving warning caps and recovery',()=>{
    const normal=spawnPressure(5,100),hard=spawnPressure(5,100,'hard'),extreme=spawnPressure(5,100,'extreme');
    expect(spawnPressure(5,100,'standard')).toEqual(normal);
    expect(hard.interval).toBeLessThan(normal.interval);expect(extreme.interval).toBeLessThan(hard.interval);
    expect(extreme.hpScale).toBeGreaterThan(hard.hpScale);
    expect(extreme.telegraphLimit).toBe(normal.telegraphLimit);expect(extreme.recovery).toBe(normal.recovery);
    expect(spawnPressure(5,63,'extreme').recovery).toBe(true);
  });
  it('guarantees tactical supplies at the selected milestone and preserves boss drops',()=>{
    expect(tacticalSupplyFor(8,false,8)).toBe('record_beacon');expect(tacticalSupplyFor(7,false,8)).toBeNull();
    expect(tacticalSupplyFor(1,true,8)).toBe('control_kit');expect(tacticalSupplyFor(12,false)).toBe('record_beacon');
  });
  it('stores the contract per run while legacy runs default to standard',()=>{
    expect(createInitialSurvivorsState().difficulty).toBe('standard');
    expect(createInitialSurvivorsState('yoon',undefined,'stage_01','extreme').difficulty).toBe('extreme');
  });
});
