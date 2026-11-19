import {describe,it,expect} from 'vitest';
import {
 OMEGA_PROTOCOL_ENTRY_CLEARS,OMEGA_PROTOCOL_TOTAL_WAVES,OMEGA_UPGRADES,
 omegaProtocolAccess,omegaSeedHash,omegaWavePlan,omegaUpgradeOffers,
 omegaStartRun,omegaResolveBattle,omegaChooseUpgrade,
} from '../src/domain/omega-protocol-run';

describe('OMEGA PROTOCOL isolated roguelite core',()=>{
 const access=omegaProtocolAccess(50,false);
 it('unlocks only after all 50 extreme clears without granting unapproved cosmetic',()=>{
  expect(OMEGA_PROTOCOL_ENTRY_CLEARS).toBe(50);
  expect(omegaProtocolAccess(49,true)).toMatchObject({canEnter:false,masterCosmeticEligible:false});
  expect(omegaProtocolAccess(50,false)).toMatchObject({canEnter:true,masterCosmeticEligible:false});
  expect(omegaProtocolAccess(50,true)).toMatchObject({canEnter:true,masterCosmeticEligible:true});
  expect(omegaStartRun(5,omegaProtocolAccess(49,false))).toBeNull();
 });
 it('generates fifteen deterministic but variable waves with two final bosses',()=>{
  const a=Array.from({length:15},(_,i)=>omegaWavePlan(20261108,i+1));
  expect(a).toEqual(Array.from({length:15},(_,i)=>omegaWavePlan(20261108,i+1)));
  expect(a.filter(x=>x.isBoss).map(x=>x.wave)).toEqual([9,15]);
  expect(a[0]!.sector).toBe(1);
  expect(a[14]!.sector).toBe(5);
  expect(a[14]!.budget).toBeGreaterThan(a[0]!.budget);
  expect(a.every(x=>x.threatKinds.length>=2&&new Set(x.threatKinds).size===x.threatKinds.length)).toBe(true);
  const b=Array.from({length:15},(_,i)=>omegaWavePlan(99143,i+1));
  expect(b.some((x,i)=>x.modifier!==a[i]!.modifier||
    x.threatKinds.join(':')!==a[i]!.threatKinds.join(':'))).toBe(true);
  expect(omegaSeedHash(42,4)).toBe(omegaSeedHash(42,4));
  expect(()=>omegaWavePlan(7,0)).toThrow(RangeError);
  expect(()=>omegaWavePlan(7,16)).toThrow(RangeError);
 });
 it('offers exactly three nonduplicated upgrade cards from different initial roles',()=>{
  const a=omegaUpgradeOffers(20261108,2,{});
  expect(a).toEqual(omegaUpgradeOffers(20261108,2,{}));
  expect(a.length).toBe(3);
  expect(new Set(a).size).toBe(3);
  expect(new Set(a.map(id=>OMEGA_UPGRADES.find(u=>u.id===id)?.role)).size).toBe(3);
  const capped=Object.fromEntries(OMEGA_UPGRADES.map(x=>[x.id,x.maxStacks]));
  expect(omegaUpgradeOffers(1,10,capped)).toEqual([]);
 });
 it('completes an entire seeded 15-wave run with seven optional upgrades and no persistent wallet writes',()=>{
  let run=omegaStartRun(19191,access);
  expect(run).not.toBeNull();
  if(!run)throw Error('Expected accessible run');
  let choices=0;
  for(let wave=1;wave<=OMEGA_PROTOCOL_TOTAL_WAVES;wave++){
   expect(run.phase).toBe('battle');
   expect(run.wave).toBe(wave);
   run=omegaResolveBattle(run,{won:true,damageTaken:0});
   if(run.phase==='reward'){
    expect(wave%2).toBe(0);
    expect(run.offers.length).toBe(3);
    const choice=run.offers[0]!;
    run=omegaChooseUpgrade(run,choice);
    choices++;
    expect(run.offers.length).toBe(0);
    expect(run.owned[choice]).toBeGreaterThan(0);
   }
  }
  expect(choices).toBe(7);
  expect(run).toMatchObject({phase:'victory',wave:16,victories:15,hp:100});
  expect(()=>omegaResolveBattle(run!,{won:true,damageTaken:0})).toThrow();
  const fresh=omegaStartRun(19191,access);
  expect(fresh?.owned).toEqual({});
  expect(fresh?.phase).toBe('battle');
 });
 it('does not double-award or let players select unoffered cards and rejects damage exploits',()=>{
  let run=omegaStartRun(42,access)!;
  expect(()=>omegaResolveBattle(run,{won:true,damageTaken:-100})).toThrow(RangeError);
  run=omegaResolveBattle(run,{won:true,damageTaken:10});
  run=omegaResolveBattle(run,{won:true,damageTaken:5});
  expect(run.phase).toBe('reward');
  const chosen=run.offers[0]!;
  const notOffered=OMEGA_UPGRADES.map(x=>x.id).find(id=>!run.offers.includes(id))!;
  expect(()=>omegaChooseUpgrade(run,notOffered)).toThrow('not offered');
  const after=omegaChooseUpgrade(run,chosen);
  expect(()=>omegaChooseUpgrade(after,chosen)).toThrow('not offered');
  expect(after.owned[chosen]).toBe(1);
  expect(run.owned[chosen]).toBeUndefined();
  const defeat=omegaResolveBattle(after,{won:false,damageTaken:999});
  expect(defeat).toMatchObject({phase:'defeat',hp:0});
  expect(()=>omegaResolveBattle(defeat,{won:true,damageTaken:0})).toThrow();
 });
});
