import {describe,it,expect} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {omegaProtocolAccessFromRecords} from '../src/domain/omega-protocol-run';
import {readOmegaProtocolAccess} from '../src/app/omega-protocol-access';

const records=(count:number,difficulty:'extreme'|'standard'|'hard'|'mastery'='extreme')=>
 Object.fromEntries(PATROL_STAGE_IDS.slice(0,count).map(id=>[id,{[difficulty]:1}]));
const storage=(value:unknown)=>({
 getItem:(key:string)=>key==='psi.survivors.store_wallet'?JSON.stringify(value):null,
});

describe('OMEGA special edition STRICT Watch Extreme 50/50 gate',()=>{
 it('rejects 10, 49 and 50 standard clears, any mastery substitutes and forged records',()=>{
  expect(omegaProtocolAccessFromRecords(records(10))).toMatchObject({
   canEnter:false,extremeStagesCleared:10,requiredExtremeStages:50,
   reason:'COMPLETE_50_EXTREME_STAGES',
  });
  expect(omegaProtocolAccessFromRecords(records(49)).canEnter).toBe(false);
  expect(omegaProtocolAccessFromRecords(records(50,'standard')).canEnter).toBe(false);
  expect(omegaProtocolAccessFromRecords(records(50,'mastery')).canEnter).toBe(false);
  expect(omegaProtocolAccessFromRecords({stage_50:{extreme:3}}).canEnter).toBe(false);
  expect(omegaProtocolAccessFromRecords({stage_01:{extreme:99}}).canEnter).toBe(false);
 });
 it('unlocks exactly at 50 independent extreme medals, one star each is enough',()=>{
  const full=records(50);
  expect(omegaProtocolAccessFromRecords(full,false)).toEqual({
   canEnter:true,masterCosmeticEligible:false,reason:'UNLOCKED',
   extremeStagesCleared:50,requiredExtremeStages:50,
  });
  expect(omegaProtocolAccessFromRecords(full,true).masterCosmeticEligible).toBe(true);
 });
 it('uses actual wallet difficulty records and never writes or assumes a normal clear',()=>{
  const wallet={difficultyClearRecords:records(50),clearRewardClaims:['stage_50']};
  let writes=0;
  const reader={...storage(wallet),setItem:()=>{writes++;}};
  expect(readOmegaProtocolAccess(reader).canEnter).toBe(true);
  expect(writes).toBe(0);
  expect(readOmegaProtocolAccess(storage({difficultyClearRecords:records(49)})).canEnter).toBe(false);
  expect(readOmegaProtocolAccess(storage({clearRewardClaims:PATROL_STAGE_IDS})).canEnter).toBe(false);
  expect(readOmegaProtocolAccess({getItem:()=>{throw Error('unavailable');}}).canEnter).toBe(false);
  expect(readOmegaProtocolAccess(undefined).canEnter).toBe(false);
 });
});
