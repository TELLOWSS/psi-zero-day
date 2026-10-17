import type {GameState} from './state';

export type StoryEvidenceMode = 'watch' | 'guard' | 'breaker';
export interface StoryEvidenceReceipt {
  readonly schemaVersion: 1;
  readonly sourceMode: StoryEvidenceMode;
  readonly sourceRecordId: string;
  readonly incidentId: 'ep01.ramp' | 'ep01.edge';
  readonly observationIds: readonly string[];
  readonly outcome: 'observed' | 'verified-clear' | 'incomplete';
  readonly contentVersion: 'ep01.story-evidence.v1';
}
const MODES = ['watch','guard','breaker'];
export function isStoryEvidenceReceipt(value: unknown): value is StoryEvidenceReceipt {
  if (!value || typeof value !== 'object') return false;
  const r=value as Record<string,unknown>;
  return r.schemaVersion===1 && MODES.includes(String(r.sourceMode))
    && typeof r.sourceRecordId==='string' && r.sourceRecordId.length>0 && r.sourceRecordId.length<=240
    && ['ep01.ramp','ep01.edge'].includes(String(r.incidentId))
    && ['observed','verified-clear','incomplete'].includes(String(r.outcome))
    && r.contentVersion==='ep01.story-evidence.v1'
    && Array.isArray(r.observationIds) && r.observationIds.length<=12
    && r.observationIds.every(x=>typeof x==='string' && x.length>0 && x.length<=100);
}
export function mergeStoryEvidence(previous: readonly StoryEvidenceReceipt[], incoming: readonly StoryEvidenceReceipt[]): StoryEvidenceReceipt[] {
  const rows=new Map<string,StoryEvidenceReceipt>();
  for (const r of [...previous,...incoming]) if (isStoryEvidenceReceipt(r)) rows.set(`${r.sourceMode}:${r.incidentId}:${r.sourceRecordId}`,r);
  return [...rows.values()].slice(-50);
}
/** Narrative projection only: a training win never changes real inspection facts. */
export function storyEvidenceReaction(receipt:StoryEvidenceReceipt,state:GameState|null):string {
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
  return modes.flatMap(mode=>{const r=[...receipts].reverse().find(x=>x.sourceMode===mode);return r?[r]:[];});
}
