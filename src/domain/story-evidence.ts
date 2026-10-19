import type {GameState} from './state';

export type StoryEvidenceMode = 'watch' | 'guard' | 'breaker';
export interface StoryEvidenceReceipt {
  readonly schemaVersion: 1 | 2;
  readonly sourceMode: StoryEvidenceMode;
  readonly sourceRecordId: string;
  readonly incidentId: 'ep01.ramp' | 'ep01.edge' | 'training.general';
  readonly sourceAreaId?: string;
  readonly sourceRunId?: string | null;
  readonly observedAt?: string | null;
  readonly sourceKind?: 'handoff' | 'defense-result' | 'encounter-intel' | 'legacy';
  readonly observationIds: readonly string[];
  readonly outcome: 'observed' | 'verified-clear' | 'incomplete' | 'unknown';
  readonly contentVersion: 'ep01.story-evidence.v1' | 'ep01.story-evidence.v2';
}
const MODES = ['watch','guard','breaker'];
const boundedId=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=240;
export const validEvidenceTime=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v));
export function isStoryEvidenceReceipt(value: unknown): value is StoryEvidenceReceipt {
  if (!value || typeof value !== 'object') return false;
  const r=value as Record<string,unknown>;
  return ((r.schemaVersion===1&&r.contentVersion==='ep01.story-evidence.v1')||(r.schemaVersion===2&&r.contentVersion==='ep01.story-evidence.v2')) && MODES.includes(String(r.sourceMode))
    && typeof r.sourceRecordId==='string' && r.sourceRecordId.length>0 && r.sourceRecordId.length<=240
    && ['ep01.ramp','ep01.edge','training.general'].includes(String(r.incidentId))
    && (r.sourceAreaId===undefined||boundedId(r.sourceAreaId))
    && (r.sourceRunId===undefined||r.sourceRunId===null||boundedId(r.sourceRunId))
    && (r.observedAt===undefined||r.observedAt===null||validEvidenceTime(r.observedAt))
    && (r.sourceKind===undefined||['handoff','defense-result','encounter-intel','legacy'].includes(String(r.sourceKind)))
    && ['observed','verified-clear','incomplete','unknown'].includes(String(r.outcome))
    && (r.schemaVersion===1||(boundedId(r.sourceAreaId)&&['handoff','defense-result','encounter-intel','legacy'].includes(String(r.sourceKind))&&(r.sourceRunId===null||boundedId(r.sourceRunId))&&(r.observedAt===null||validEvidenceTime(r.observedAt))))
    && Array.isArray(r.observationIds) && r.observationIds.length<=12
    && r.observationIds.every(x=>typeof x==='string' && x.length>0 && x.length<=100);
}
/** Old receipts did not retain their source area. Keep the history without inventing an incident or a date. */
export function normalizeStoryEvidence(r:StoryEvidenceReceipt):StoryEvidenceReceipt {
  if(r.sourceAreaId&&r.sourceKind)return {...r,schemaVersion:2,contentVersion:'ep01.story-evidence.v2',sourceRunId:r.sourceRunId??null,observedAt:r.observedAt??null};
  return {...r,schemaVersion:2,contentVersion:'ep01.story-evidence.v2',incidentId:'training.general',sourceAreaId:'unknown',sourceRunId:null,observedAt:null,sourceKind:'legacy'};
}
function evidenceOrder(a:StoryEvidenceReceipt,b:StoryEvidenceReceipt):number {
  const time=(r:StoryEvidenceReceipt)=>r.observedAt?Date.parse(r.observedAt):0;
  return time(a)-time(b)||Number(a.sourceKind!=='legacy')-Number(b.sourceKind!=='legacy')||a.sourceRecordId.localeCompare(b.sourceRecordId)||JSON.stringify(a).localeCompare(JSON.stringify(b));
}
export function mergeStoryEvidence(previous: readonly StoryEvidenceReceipt[], incoming: readonly StoryEvidenceReceipt[]): StoryEvidenceReceipt[] {
  const rows=new Map<string,StoryEvidenceReceipt>();
  for (const raw of [...previous,...incoming]) if (isStoryEvidenceReceipt(raw)) {
    const r=normalizeStoryEvidence(raw),key=`${r.sourceMode}:${r.sourceAreaId}:${r.sourceRunId??r.sourceRecordId}`;
    const prior=rows.get(key);
    if(!prior||evidenceOrder(prior,r)<0)rows.set(key,r);
  }
  return [...rows.values()].sort(evidenceOrder).slice(-50);
}
/** Narrative projection only: a training win never changes real inspection facts. */
export function storyEvidenceReaction(receipt:StoryEvidenceReceipt,state:GameState|null):string {
  if(receipt.outcome==='unknown')return 'story.evidence.unknown';
  if(normalizeStoryEvidence(receipt).incidentId==='training.general')return 'story.evidence.general';
  if (receipt.outcome==='incomplete') return `story.evidence.${receipt.sourceMode}.incomplete`;
  const checked=receipt.incidentId==='ep01.ramp'
    ? state?.flags.ramp_signal_known===true
    : ['accepted','accepted_after_sequence'].includes(String(state?.flags.inspection_result));
  return `story.evidence.${receipt.sourceMode}.${checked?'checked':'question'}`;
}
export function storyEvidenceForScene(eventId:string|null|undefined,receipts:readonly StoryEvidenceReceipt[]):StoryEvidenceReceipt[] {
  const modes:readonly string[] = eventId==='e01_04_junho_signal' ? ['watch']
    : eventId==='e01_05_command'||eventId==='e01_06_pump_arrival' ? ['guard']
    : eventId==='e01_08e_responsibility_clash'||eventId==='e01_08n_instruction_return' ? ['breaker']
    : eventId==='e01_09_evening'||eventId==='e01_10_next_day_tease' ? MODES : [];
  const ordered=mergeStoryEvidence([],receipts);
  return modes.flatMap(mode=>{const r=[...ordered].reverse().find(x=>x.sourceMode===mode);return r?[r]:[];});
}
