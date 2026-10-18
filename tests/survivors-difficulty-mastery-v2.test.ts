import {describe,it,expect} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {difficultyComplexBias,counterplayBreather,PATROL_DIFFICULTIES} from '../src/domain/survivors-challenge';
import {awardDifficultyClear,mergeDifficultyClearRecords,sanitizeDifficultyClearRecords} from '../src/domain/survivors-difficulty-records';
import {PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {selectStageHazard} from '../src/engine/survivors-difficulty';
import {stageClearReward} from '../src/domain/survivors-recreation';

describe('50-stage authored difficulty and mastery rules',()=>{
  it('preserves entry tutorial, raises complex Wave 2/3 choice instead of mutating bosses',()=>{
    for(const stage of Object.values(PATROL_STAGES)){
      expect(selectStageHazard(stage,0,.61,180,.4,'extreme')).toBe('UNHELMETED');
      for(const t of [70,130]){
        const sample=Array.from({length:100},(_,i)=>{
          const roll=(i+.5)/100;
          return {roll,accent:(i*23%100+.5)/100};
        });
        const complex=(difficulty: keyof typeof PATROL_DIFFICULTIES)=>sample.filter(({roll,accent})=>
          selectStageHazard(stage,t,roll,180,accent,difficulty)!=='UNHELMETED').length;
        expect(complex('extreme')).toBeGreaterThanOrEqual(complex('hard'));
        expect(complex('hard')).toBeGreaterThanOrEqual(complex('standard'));
        expect(complex('standard')).toBeGreaterThanOrEqual(complex('story'));
      }
    }
    expect(difficultyComplexBias('extreme',1)).toBe(0);
    expect(difficultyComplexBias('extreme',3)).toBeGreaterThan(0);
    expect(counterplayBreather('story')).toBeGreaterThan(counterplayBreather('extreme'));
  });

  it('keeps individual earned difficulty stars without repeated first-clear claims',()=>{
    let record=awardDifficultyClear({},'stage_01','story',1);
    record=awardDifficultyClear(record,'stage_01','extreme',3);
    record=awardDifficultyClear(record,'stage_01','extreme',1);
    expect(record.stage_01).toEqual({story:1,extreme:3});
    expect(awardDifficultyClear(record,'stage_01','hard',0)).toEqual(record);
    expect(mergeDifficultyClearRecords({stage_01:{standard:2}},record).stage_01)
      .toEqual({story:1,standard:2,extreme:3});
    expect(sanitizeDifficultyClearRecords({stage_01:{standard:99},stage_51:{extreme:3}})).toEqual({});
    expect(Object.keys(record).every(id=>PATROL_STAGE_IDS.includes(id as typeof PATROL_STAGE_IDS[number]))).toBe(true);
  });

  it('rewards skillful star records more at higher difficulty but caps the payout',()=>{
    const base=stageClearReward('stage_20','standard',false,3);
    const hard=stageClearReward('stage_20','hard',false,3);
    const extreme=stageClearReward('stage_20','extreme',false,3);
    expect(hard.mastery).toBeGreaterThan(base.mastery);
    expect(extreme.mastery).toBeGreaterThan(hard.mastery);
    expect(stageClearReward('stage_20','extreme',false,9999).mastery).toBe(300);
    expect(stageClearReward('stage_20','story',false,0).mastery).toBe(0);
  });
});
