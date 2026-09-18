import type { FlagMap } from '../domain';
import { FIELD_REALITY_DOCTRINE_ID } from './gameplay-doctrine';

export type RecordRealityPhase = 'pressure' | 'return' | 'verdict';
export type RecordRealityTone = 'previous' | 'floor' | 'layers' | 'action' | 'verification' | 'result';

export interface RecordRealityStage {
  readonly time: '16:24' | '16:42' | '17:08';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}
export interface RecordRealityCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: RecordRealityTone;
}
export interface RecordRealityModel {
  readonly doctrine_id: typeof FIELD_REALITY_DOCTRINE_ID;
  readonly phase: RecordRealityPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly RecordRealityStage[];
  readonly cards: readonly RecordRealityCard[];
}

const floorCard: RecordRealityCard = Object.freeze({
  title_text_id:'ui.record_reality.floor.title', body_text_id:'ui.record_reality.floor.body', tone:'floor'
});
const layersCard: RecordRealityCard = Object.freeze({
  title_text_id:'ui.record_reality.layers.title', body_text_id:'ui.record_reality.layers.body', tone:'layers'
});

function previousCard(flags:FlagMap):RecordRealityCard|undefined{
  switch(flags.instruction_chain_result){
    case 'condition_loss_unresolved': return {title_text_id:'ui.record_reality.previous.gap.title',body_text_id:'ui.record_reality.previous.gap.body',tone:'previous'};
    case 'worker_blame_hides_chain': return {title_text_id:'ui.record_reality.previous.chilled.title',body_text_id:'ui.record_reality.previous.chilled.body',tone:'previous'};
    case 'conditional_phrase_restored': return {title_text_id:'ui.record_reality.previous.reconstructed.title',body_text_id:'ui.record_reality.previous.reconstructed.body',tone:'previous'};
    default:return undefined;
  }
}
function actionCard(flags:FlagMap):RecordRealityCard|undefined{
  switch(flags.record_action){
    case 'minimize_scope': return {title_text_id:'ui.record_reality.action.minimize.title',body_text_id:'ui.record_reality.action.minimize.body',tone:'action'};
    case 'retrofit_paper': return {title_text_id:'ui.record_reality.action.retrofit.title',body_text_id:'ui.record_reality.action.retrofit.body',tone:'action'};
    case 'preserve_timeline': return {title_text_id:'ui.record_reality.action.timeline.title',body_text_id:'ui.record_reality.action.timeline.body',tone:'action'};
    default:return undefined;
  }
}
function focusCard(flags:FlagMap):RecordRealityCard|undefined{
  switch(flags.record_action){
    case 'minimize_scope': return {title_text_id:'ui.record_reality.focus.minimize.title',body_text_id:'ui.record_reality.focus.minimize.body',tone:'verification'};
    case 'retrofit_paper': return {title_text_id:'ui.record_reality.focus.retrofit.title',body_text_id:'ui.record_reality.focus.retrofit.body',tone:'verification'};
    case 'preserve_timeline': return {title_text_id:'ui.record_reality.focus.timeline.title',body_text_id:'ui.record_reality.focus.timeline.body',tone:'verification'};
    default:return undefined;
  }
}
function resultCard(flags:FlagMap):RecordRealityCard|undefined{
  switch(flags.record_result){
    case 'supplement_requested': return {title_text_id:'ui.record_reality.result.correction.title',body_text_id:'ui.record_reality.result.correction.body',tone:'result'};
    case 'document_sync_required': return {title_text_id:'ui.record_reality.result.conflict.title',body_text_id:'ui.record_reality.result.conflict.body',tone:'result'};
    case 'timeline_preserved': return {title_text_id:'ui.record_reality.result.preserved.title',body_text_id:'ui.record_reality.result.preserved.body',tone:'result'};
    default:return undefined;
  }
}
function stages(eventId:string):readonly RecordRealityStage[]{
  const pressure=eventId==='e01_08o_record_pressure';
  return Object.freeze([
    {time:'16:24',label_text_id:'ui.record_reality.stage.instruction',state:'done'},
    {time:'16:42',label_text_id:'ui.record_reality.stage.record',state:pressure?'current':'done'},
    {time:'17:08',label_text_id:'ui.record_reality.stage.return',state:pressure?'next':'current'},
  ]);
}
export function episode01RecordRealityChain(eventId:string|null|undefined,flags:FlagMap|undefined):RecordRealityModel|undefined{
  if(!flags||(eventId!=='e01_08o_record_pressure'&&eventId!=='e01_08p_record_return')) return undefined;
  const previous=previousCard(flags);
  const action=actionCard(flags);
  if(eventId==='e01_08o_record_pressure'){
    return Object.freeze({
      doctrine_id:FIELD_REALITY_DOCTRINE_ID,
      phase:'pressure',
      eyebrow_text_id:'ui.record_reality.pressure.eyebrow',
      title_text_id:'ui.record_reality.pressure.title',
      stages:stages(eventId),
      cards:Object.freeze([previous,floorCard,layersCard,action].filter((card):card is RecordRealityCard=>Boolean(card)))
    });
  }
  const result=resultCard(flags);
  if(result){
    return Object.freeze({
      doctrine_id:FIELD_REALITY_DOCTRINE_ID,
      phase:'verdict',
      eyebrow_text_id:'ui.record_reality.verdict.eyebrow',
      title_text_id:'ui.record_reality.verdict.title',
      stages:stages(eventId),
      cards:Object.freeze([floorCard,layersCard,action,result].filter((card):card is RecordRealityCard=>Boolean(card)))
    });
  }
  const focus=focusCard(flags);
  return Object.freeze({
    doctrine_id:FIELD_REALITY_DOCTRINE_ID,
    phase:'return',
    eyebrow_text_id:'ui.record_reality.return.eyebrow',
    title_text_id:'ui.record_reality.return.title',
    stages:stages(eventId),
    cards:Object.freeze([floorCard,layersCard,action,focus].filter((card):card is RecordRealityCard=>Boolean(card)))
  });
}
