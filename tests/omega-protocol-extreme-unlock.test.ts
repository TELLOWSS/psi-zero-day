import {describe,it,expect,vi} from 'vitest';
import {persistStoreWallet,STORE_WALLET_KEY} from '../src/app/survivors-store-wallet';
import {awardDifficultyClear,type DifficultyClearRecords} from '../src/domain/survivors-difficulty-records';
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
 it('unlocks after exactly 50 individually persisted extreme victories using the real Watch wallet writer',()=>{
  // Exercises real persistStoreWallet/mergeDifficultyClearRecords instead of
  // a hand-written fake completion record. This runs entirely in memory:
  // no user's localStorage, premium credits, network or main branch changes.
  const data=new Map<string,string>();
  let dispatches=0;
  const browserStorage={
   getItem:(key:string)=>data.get(key)??null,
   setItem:(key:string,value:string)=>{data.set(key,value);},
  };
  vi.stubGlobal('localStorage',browserStorage);
  vi.stubGlobal('window',{dispatchEvent:()=>{dispatches++;return true;}});
  try{
   let progress:DifficultyClearRecords={};
   const inventory={owned:[],equipped:[]};
   for(const [i,stage] of PATROL_STAGE_IDS.entries()){
    progress=awardDifficultyClear(progress,stage,'extreme',1);
    persistStoreWallet({credits:121,inventory,difficultyClearRecords:progress});
    const access=readOmegaProtocolAccess(browserStorage);
    expect(access.extremeStagesCleared).toBe(i+1);
    expect(access.canEnter).toBe(i===49);
   }
   expect(dispatches).toBe(50);
   const recorded=JSON.parse(data.get(STORE_WALLET_KEY)!);
   expect(recorded.credits).toBe(121);
   expect(recorded.difficultyClearRecords.stage_50.extreme).toBe(1);
   const before=data.get(STORE_WALLET_KEY);
   expect(readOmegaProtocolAccess(browserStorage).canEnter).toBe(true);
   expect(data.get(STORE_WALLET_KEY)).toBe(before);
  }finally{
   vi.unstubAllGlobals();
  }
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
