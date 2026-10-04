import text from '../../content/localization/survivors-accountability-ko.json';
import { decideAccountability, emptyAccountability, type AccountabilityState, type AccountabilityCase, type AccountabilityOutcome } from '../domain/survivors-accountability';
export const ACCOUNTABILITY_SAVE_KEY='psi.survivors.accountability.v1';
export const ACCOUNTABILITY_CASES=text.cases.map(row=>({...row,kind:row.kind as AccountabilityCase['kind']}));
export function readAccountability(raw:string|null):AccountabilityState {
  let value:unknown;try{value=JSON.parse(raw||'null');}catch{return emptyAccountability();}
  if(!Array.isArray(value))return emptyAccountability();
  let state=emptyAccountability();
  // Rebuild outcomes from known chronological cases; saved counters are never trusted.
  for(const incident of ACCOUNTABILITY_CASES){
    const entry=value.find((v:unknown)=>!!v&&typeof v==='object'&&'caseId' in v&&v.caseId===incident.id);
    if(entry&&typeof entry==='object'&&'action' in entry&&(entry.action==='confirm'||entry.action==='hold'))state=decideAccountability(state,incident,entry.action,[true,true,true]);
  }
  return state;
}
export function writeAccountability(state:AccountabilityState):string {return JSON.stringify(state.decisions.map(d=>({caseId:d.caseId,action:d.action})));}
export function accountabilityResult(outcome:AccountabilityOutcome):string {
  return outcome==='equipment_corrected'?text.repairResult:outcome==='warning_1'?text.firstResult:outcome==='warning_2'?text.secondResult:outcome==='site_excluded'?text.thirdResult:text.holdResult;
}
export function accountabilityMemory(state:AccountabilityState):string {
  if(state.access==='held')return text.carryHeld;if(state.access==='excluded')return text.carryExcluded;
  const last=state.decisions.at(-1);return last?accountabilityResult(last.outcome):'';
}
