import {describe,it,expect} from 'vitest';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {omegaOperatorEligibility} from '../src/domain/omega-operator-unlock';

const all=[...PATROL_STAGE_IDS];
const allMaster=Object.fromEntries(all.map(id=>[id,{mastery:3}]));
describe('OMEGA OPERATOR earn-only unlock contract',()=>{
 it('keeps the character locked before normal 50/50 and Master 50×3★',()=>{
  expect(omegaOperatorEligibility([],{})).toMatchObject({earned:false,clears:0,mastered:0,remainingClears:50});
  expect(omegaOperatorEligibility(all,{})).toMatchObject({earned:false,clears:50,mastered:0});
  expect(omegaOperatorEligibility(all.slice(0,49),allMaster)).toMatchObject({earned:false,clears:49,mastered:50});
 });
 it('requires real mastery 3★ per stage, not a Master-mode visit or lower stars',()=>{
  const almost=Object.fromEntries(all.map((id,index)=>[id,{mastery:index===49?2:3}]));
  expect(omegaOperatorEligibility(all,almost)).toMatchObject({earned:false,mastered:49,remainingMastered:1});
  expect(omegaOperatorEligibility(all,allMaster)).toMatchObject({earned:true,clears:50,mastered:50,remainingClears:0,remainingMastered:0});
 });
 it('ignores corrupted, extra, duplicated, and non-Master records without modifying input',()=>{
  const invalid={...allMaster,[all[0]!]:{mastery:4,hard:3},stage_999:{mastery:3}};
  expect(omegaOperatorEligibility(all,invalid)).toMatchObject({earned:false,mastered:49});
  expect(omegaOperatorEligibility([...all,...all],allMaster)).toMatchObject({earned:true,clears:50});
  expect(omegaOperatorEligibility(all,{stage_50:{mastery:'3'}})).toMatchObject({earned:false,mastered:0});
  const copy=structuredClone(allMaster);
  omegaOperatorEligibility(all,copy);
  expect(copy).toEqual(allMaster);
 });
});
