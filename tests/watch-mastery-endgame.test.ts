import {describe,it,expect} from 'vitest';
import {PATROL_DIFFICULTIES,counterplayBreather} from '../src/domain/survivors-challenge';
import {resourceProfile} from '../src/engine/survivors-resources';
import {spawnPressure,selectStageHazard} from '../src/engine/survivors-difficulty';
import {masteryStageFocus,authoredStageHazardMix} from '../src/engine/survivors-mastery-focus';
import {PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {stageThreatTraits} from '../src/engine/survivors-stage-threats';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {awardDifficultyClear} from '../src/domain/survivors-difficulty-records';
import {stageClearReward} from '../src/domain/survivors-recreation';

describe('Signal Watch mastery: opt-in after campaign completion',()=>{
  it('keeps old contracts unchanged while increasing late-wave decisions',()=>{
    const extreme=spawnPressure(50,125,'extreme'),mastery=spawnPressure(50,125,'mastery');
    expect(mastery.hpScale).toBeGreaterThan(extreme.hpScale);
    expect(mastery.interval).toBeLessThan(extreme.interval);
    expect(mastery.telegraphLimit).toBe(extreme.telegraphLimit);
    expect(mastery.wave).toBe(extreme.wave);
    expect(counterplayBreather('mastery')).toBeLessThan(counterplayBreather('extreme'));
    expect(resourceProfile('mastery').controlCharge).toBeLessThan(resourceProfile('extreme').controlCharge);
    expect(PATROL_DIFFICULTIES.standard.hp).toBe(1.15);
    expect(PATROL_DIFFICULTIES.extreme.spawn).toBe(.7);
  });
  it('makes warning-readable specialist movement more frequent, without a boss rewrite',()=>{
    expect(stageThreatTraits('GAS_LEAK',5,60,12,.75,'standard')).toEqual({});
    expect(stageThreatTraits('GAS_LEAK',5,60,12,.75,'mastery')).toEqual({behavior:'crosswind'});
    expect(stageThreatTraits('GAS_LEAK',5,14,12,.75,'mastery')).toEqual({});
    expect(stageThreatTraits('GAS_LEAK',1,60,12,.75,'mastery')).toEqual({});
  });
  it('separates best medals from old extreme records without repeating first clear payment',()=>{
    const stage='stage_50' as const;
    const old=awardDifficultyClear({},stage,'extreme',3);
    const next=awardDifficultyClear(old,stage,'mastery',2);
    expect(next[stage]).toEqual({extreme:3,mastery:2});
    const advanced=awardDifficultyClear(next,stage,'mastery',1);
    expect(advanced).toEqual(next);
    expect(stageClearReward(stage,'mastery',false,3).first).toBe(0);
    expect(createInitialSurvivorsState('yoon',undefined,stage,'mastery').difficulty).toBe('mastery');
  });
  it('focuses one already authored stage hazard in Waves 2/3 without a Wave 1 surprise',()=>{
    const stage=PATROL_STAGES.stage_05,before=JSON.stringify(stage),focus=masteryStageFocus(stage);
    expect(focus).not.toBeNull();
    expect(authoredStageHazardMix(stage)).toContain(focus!.type);
    expect(selectStageHazard(stage,145,.5,180,.8,'mastery')).toBe(focus!.type);
    expect(selectStageHazard(stage,0,.5,180,.8,'mastery')).toBe('UNHELMETED');
    expect(selectStageHazard(stage,0,.5,180,.8,'extreme')).toBe('UNHELMETED');
    expect(JSON.stringify(stage)).toBe(before);
    expect(new Set(Object.values(PATROL_STAGES).map(s=>masteryStageFocus(s)?.type).filter(Boolean)).size).toBeGreaterThan(1);
  });
});
