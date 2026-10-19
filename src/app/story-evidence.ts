import {isStoryEvidenceReceipt,mergeStoryEvidence,validEvidenceTime,type StoryEvidenceReceipt} from '../domain/story-evidence';
import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import type {DefenseScenarioRecord} from '../domain/defense-save';
import {readOperationHandoffs} from './operation-handoff-store';
import {inspectDefenseSave,DEFENSE_SAVE_KEY} from './defense-save';
import {GUARD_SAVE_KEY} from './guard-storage';
import {guardPersistenceContent} from './guard-save-version';
import {zeroBreachContent} from '../content/defense';
import {browserLocalStoragePort} from '../platform/browser-storage';

export const STORY_EVIDENCE_KEY='psi.story.evidence.v2';
export const LEGACY_STORY_EVIDENCE_KEY='psi.story.evidence.v1';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
function local():StorageLike|null {try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}}
export function readStoryEvidence(storage:StorageLike|null=local()):StoryEvidenceReceipt[] {
  try {const r:unknown=JSON.parse(storage?.getItem(STORY_EVIDENCE_KEY)??storage?.getItem(LEGACY_STORY_EVIDENCE_KEY)??'[]');return Array.isArray(r)?mergeStoryEvidence([],r.filter(isStoryEvidenceReceipt)):[];}catch{return [];}
}
export function persistStoryEvidence(incoming:readonly StoryEvidenceReceipt[],storage:StorageLike|null=local()) {
  const receipts=mergeStoryEvidence(readStoryEvidence(storage),incoming);
  try {if(!storage)return {receipts,saved:false};storage.setItem(STORY_EVIDENCE_KEY,JSON.stringify(receipts));return {receipts,saved:true};}
  catch {return {receipts,saved:false};}
}
export function handoffStoryEvidence(r:OperationHandoff):StoryEvidenceReceipt {
  return {schemaVersion:2,contentVersion:'ep01.story-evidence.v2',sourceMode:'watch',sourceKind:'handoff',
    sourceAreaId:r.stageId,sourceRunId:r.runId??null,observedAt:r.observedAt??null,
    sourceRecordId:r.runId??`handoff:${r.characterId}:${r.stageId}:${r.outcome}:${r.zones}:${r.cartStops}:${r.rubbleCleared}`,
    incidentId:'training.general',outcome:r.outcome==='victory'?'verified-clear':'incomplete',
    observationIds:[...(r.zones>0?['controlled-zone']:[]),...(r.cartStops>0?['cart-stop']:[]),...(r.rubbleCleared>0?['route-cleared']:[])]};
}
export function defenseStoryEvidence(r:DefenseScenarioRecord):StoryEvidenceReceipt|null {
  if(!r.lastResultRunId||r.finishedRuns===0)return null;
  const report=r.lastTacticalReport?.runId===r.lastResultRunId?r.lastTacticalReport:undefined;
  // A lifetime clear count is never evidence of the latest run's outcome.
  const won=r.lastResultWon??report?.won;
  return {schemaVersion:2,contentVersion:'ep01.story-evidence.v2',sourceMode:'guard',sourceKind:'defense-result',
    sourceAreaId:r.scenarioId,sourceRunId:r.lastResultRunId,sourceRecordId:r.lastResultRunId,
    observedAt:validEvidenceTime(r.updatedAt)?r.updatedAt:null,
    incidentId:['training-ramp-v1','event-ramp-reconstruction-v1'].includes(r.scenarioId)?'ep01.ramp':'training.general',
    outcome:won===false?'incomplete':won===true?'observed':'unknown',observationIds:['defense-route-review']};
}
export async function collectStoryEvidence() {
  const incoming:StoryEvidenceReceipt[]=[];
  const create=(r:Omit<StoryEvidenceReceipt,'schemaVersion'|'contentVersion'>)=>incoming.push({...r,schemaVersion:2,contentVersion:'ep01.story-evidence.v2'});
  for(const r of readOperationHandoffs()){
    incoming.push(handoffStoryEvidence(r));
  }
  try{
    const port=browserLocalStoragePort();
    // Read the campaign's current version without migrating or writing combat saves.
    const inspections=await Promise.all([inspectDefenseSave(port,zeroBreachContent),inspectDefenseSave({read:key=>port.read(key===DEFENSE_SAVE_KEY?GUARD_SAVE_KEY:key),write:port.write.bind(port),remove:port.remove.bind(port),keys:port.keys.bind(port)},guardPersistenceContent)]);
    for(const inspection of inspections)if(inspection.kind==='ready')for(const r of inspection.document.records){
      const receipt=defenseStoryEvidence(r);if(receipt)incoming.push(receipt);
    }
  }catch{/* Optional external records never block a reader. */}
  try{
    const intel=window.SignalEncounterIntel?.read?.();
    if(intel)for(const mode of ['watch','guard','breaker'] as const){
      const r=intel[mode];if(r.mastery==='unseen')continue;
      const verified=r.mastery==='verified'&&typeof r.verifiedAt==='string'&&Number.isFinite(Date.parse(r.verifiedAt));
      create({sourceMode:mode,sourceKind:'encounter-intel',sourceAreaId:r.encounterId,sourceRunId:null,
        observedAt:verified&&validEvidenceTime(r.verifiedAt)?r.verifiedAt:null,
        sourceRecordId:`intel:${r.encounterId}`,incidentId:'training.general',outcome:verified?'verified-clear':'observed',observationIds:[`${mode}-load-pattern`]});
    }
  }catch{/* Missing/corrupt optional intel remains empty. */}
  return persistStoryEvidence(incoming);
}
