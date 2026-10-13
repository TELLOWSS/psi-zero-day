export type AccountabilityAction = 'confirm' | 'hold';
export type AccountabilityOutcome = 'equipment_corrected' | 'warning_1' | 'warning_2' | 'site_excluded' | 'review_hold';
export interface AccountabilityDecision { readonly caseId:string; readonly action:AccountabilityAction; readonly outcome:AccountabilityOutcome; readonly warnings:number; }
export interface AccountabilityState { readonly decisions:readonly AccountabilityDecision[]; readonly warnings:number; readonly access:'active'|'held'|'excluded'; }
export interface AccountabilityCase { readonly id:string; readonly kind:'equipment'|'conduct'; }
export const emptyAccountability = ():AccountabilityState => ({decisions:[],warnings:0,access:'active'});
/** Site-specific fiction rule, separate from simulation damage, score and employment. */
export function decideAccountability(state:AccountabilityState, incident:AccountabilityCase, action:AccountabilityAction, evidence:readonly boolean[]):AccountabilityState {
  if(state.access!=='active'||state.decisions.some(d=>d.caseId===incident.id))return state;
  if(action==='confirm'&&(evidence.length!==3||evidence.some(v=>v!==true)))return state;
  const warnings=action==='hold'||incident.kind==='equipment'?state.warnings:Math.min(3,state.warnings+1);
  const outcome:AccountabilityOutcome=action==='hold'?'review_hold':incident.kind==='equipment'?'equipment_corrected':warnings===3?'site_excluded':warnings===2?'warning_2':'warning_1';
  return {decisions:[...state.decisions,{caseId:incident.id,action,outcome,warnings}],warnings,access:outcome==='review_hold'?'held':outcome==='site_excluded'?'excluded':'active'};
}
