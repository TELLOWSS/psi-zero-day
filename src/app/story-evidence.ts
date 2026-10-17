import {isStoryEvidenceReceipt,mergeStoryEvidence,type StoryEvidenceReceipt} from '../domain/story-evidence';
import {readOperationHandoffs} from './operation-handoff-store';
import {inspectDefenseSave,DEFENSE_SAVE_KEY} from './defense-save';
import {GUARD_SAVE_KEY} from './guard-storage';
import {guardPersistenceContent} from './guard-save-version';
import {zeroBreachContent} from '../content/defense';
import {browserLocalStoragePort} from '../platform/browser-storage';

export const STORY_EVIDENCE_KEY='psi.story.evidence.v1';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
function local():StorageLike|null {try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
export function readStoryEvidence(storage:StorageLike|null=local()):StoryEvidenceReceipt[] {
  try {const r:unknown=JSON.parse(storage?.getItem(STORY_EVIDENCE_KEY)??'[]');return Array.isArray(r)?mergeStoryEvidence([],r.filter(isStoryEvidenceReceipt)):[];}catch{return [];}
}
export function persistStoryEvidence(incoming:readonly StoryEvidenceReceipt[],storage:StorageLike|null=local()) {
  const receipts=mergeStoryEvidence(readStoryEvidence(storage),incoming);
  try {if(!storage)return {receipts,saved:false};storage.setItem(STORY_EVIDENCE_KEY,JSON.stringify(receipts));return {receipts,saved:true};}
  catch {return {receipts,saved:false};}
}
export async function collectStoryEvidence() {
  const incoming:StoryEvidenceReceipt[]=[];
  const create=(r:Omit<StoryEvidenceReceipt,'schemaVersion'|'contentVersion'>)=>incoming.push({...r,schemaVersion:1,contentVersion:'ep01.story-evidence.v1'});
  for(const r of readOperationHandoffs()){
    // Legacy handoffs have no run UUID. A stable content identity avoids inventing one.
    const recordId=`handoff:${r.characterId}:${r.stageId}:${r.outcome}:${r.zones}:${r.cartStops}:${r.rubbleCleared}`;
    create({sourceMode:'watch',sourceRecordId:recordId,incidentId:'ep01.ramp',outcome:r.outcome==='victory'?'verified-clear':'incomplete',observationIds:[...(r.zones>0?['controlled-zone']:[]),...(r.cartStops>0?['cart-stop']:[]),...(r.rubbleCleared>0?['route-cleared']:[])]});
  }
  try{
    const port=browserLocalStoragePort();
    // Read the campaign's current version without migrating or writing combat saves.
    const inspections=await Promise.all([inspectDefenseSave(port,zeroBreachContent),inspectDefenseSave({read:key=>port.read(key===DEFENSE_SAVE_KEY?GUARD_SAVE_KEY:key),write:port.write.bind(port),remove:port.remove.bind(port),keys:port.keys.bind(port)},guardPersistenceContent)]);
    for(const inspection of inspections)if(inspection.kind==='ready')for(const r of inspection.document.records){
      if(r.lastResultRunId&&r.finishedRuns>0)create({sourceMode:'guard',sourceRecordId:r.lastResultRunId,incidentId:'ep01.ramp',outcome:r.clears>0?'observed':'incomplete',observationIds:['defense-route-review']});
    }
  }catch{/* Optional external records never block a reader. */}
  try{
    const intel=window.SignalEncounterIntel?.read?.();
    if(intel)for(const mode of ['watch','guard','breaker'] as const){
      const r=intel[mode];if(r.mastery==='unseen')continue;
      const verified=r.mastery==='verified'&&typeof r.verifiedAt==='string'&&Number.isFinite(Date.parse(r.verifiedAt));
      create({sourceMode:mode,sourceRecordId:`intel:${r.encounterId}:${verified?r.verifiedAt:'observed'}`,incidentId:mode==='breaker'?'ep01.edge':'ep01.ramp',outcome:verified?'verified-clear':'observed',observationIds:[`${mode}-load-pattern`]});
    }
  }catch{/* Missing/corrupt optional intel remains empty. */}
  return persistStoryEvidence(incoming);
}
