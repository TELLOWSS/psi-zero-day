import { describe,expect,it } from 'vitest';
import { decideAccountability,emptyAccountability } from '../src/domain/survivors-accountability';
import { ACCOUNTABILITY_CASES,readAccountability,writeAccountability } from '../src/app/survivors-accountability';
const evidence=[true,true,true];
describe('site-specific confirmed repeat conduct',()=>{
 it('requires evidence, excludes faulty equipment and counts independent conduct only',()=>{
  const initial=emptyAccountability(),equipment=ACCOUNTABILITY_CASES[0]!;
  expect(decideAccountability(initial,equipment,'confirm',[true,false,true])).toBe(initial);
  let state=decideAccountability(initial,equipment,'confirm',evidence);
  expect(state.warnings).toBe(0);expect(state.decisions[0]!.outcome).toBe('equipment_corrected');
  for(const incident of ACCOUNTABILITY_CASES.slice(1))state=decideAccountability(state,incident,'confirm',evidence);
  expect(state.warnings).toBe(3);expect(state.access).toBe('excluded');
  expect(state.decisions.map(d=>d.outcome)).toEqual(['equipment_corrected','warning_1','warning_2','site_excluded']);
  expect(decideAccountability(state,ACCOUNTABILITY_CASES[3]!,'confirm',evidence)).toBe(state);
 });
 it('does not invent prior strikes for a saved late-stage unlock, or count a replay twice',()=>{
  const incident=ACCOUNTABILITY_CASES[3]!;
  const state=decideAccountability(emptyAccountability(),incident,'confirm',evidence);
  expect(state.warnings).toBe(1);expect(state.access).toBe('active');
  expect(decideAccountability(state,incident,'confirm',evidence)).toBe(state);
  expect(readAccountability(writeAccountability(state))).toEqual(state);
 });
 it('keeps uncertain cases out of the count and restricts work pending review',()=>{
  const state=decideAccountability(emptyAccountability(),ACCOUNTABILITY_CASES[1]!,'hold',[]);
  expect(state.warnings).toBe(0);expect(state.access).toBe('held');
  expect(decideAccountability(state,ACCOUNTABILITY_CASES[2]!,'confirm',evidence)).toBe(state);
  expect(readAccountability(writeAccountability(state))).toEqual(state);
 });
 it('reconstructs known actions and rejects corrupt or unknown records',()=>{
  expect(readAccountability('broken')).toEqual(emptyAccountability());
  expect(readAccountability('{"warnings":3}')).toEqual(emptyAccountability());
  expect(readAccountability('[{"caseId":"fake","action":"confirm"}]')).toEqual(emptyAccountability());
  const raw=JSON.stringify([{caseId:'route-first',action:'confirm',warnings:3},{caseId:'route-first',action:'confirm'}]);
  expect(readAccountability(raw).warnings).toBe(1);
 });
});
