import {zeroBreachContent} from '../content/defense';
import {decodeDefenseSave,encodeDefenseSave} from './defense-save';
export const GUARD_RULES_VERSION='guard-rules-2';
export const GUARD_CONTENT_VERSION='guard-underground-2.0.0';
export const guardPersistenceContent={...zeroBreachContent,rulesVersion:GUARD_RULES_VERSION,contentVersion:GUARD_CONTENT_VERSION};
/** Pure migration. The caller keeps the original v1 key as the recoverable backup. */
export function migrateGuardSaveV1(raw:string):string{
 const old=decodeDefenseSave(raw);if(!old||old.schemaVersion!==1)throw Error('Original Guard save needs recovery');
 const run=old.payload.activeRun;
 const activeRun=run?{...run,ultimateUnlocked:old.payload.records.some(r=>r.scenarioId==='guard-gd-03-v1'&&r.clears>0),pendingAttacks:[],mapPhase:'INITIAL' as const,appliedTransitionIds:[],redeploymentCredits:0}:null;
 return encodeDefenseSave({...old.payload,activeRun},guardPersistenceContent,old.revision,old.savedAt);
}
