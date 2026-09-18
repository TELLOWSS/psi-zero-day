import type { FlagMap } from '../domain';
import { FIELD_REALITY_DOCTRINE_ID } from './gameplay-doctrine';

export type DayCarryoverPhase = 'evening' | 'day2';
export type DayCarryoverTone = 'record' | 'people' | 'instruction' | 'recovery' | 'first';

export interface DayCarryoverStage {
  readonly time: '17:08' | '20:41' | '06:52';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}
export interface DayCarryoverCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: DayCarryoverTone;
}
export interface DayCarryoverModel {
  readonly doctrine_id: typeof FIELD_REALITY_DOCTRINE_ID;
  readonly phase: DayCarryoverPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly DayCarryoverStage[];
  readonly cards: readonly DayCarryoverCard[];
}

function recordCard(flags:FlagMap):DayCarryoverCard|undefined{
  switch(flags.record_result){
    case 'supplement_requested': return {title_text_id:'ui.day_carryover.record.supplement.title',body_text_id:'ui.day_carryover.record.supplement.body',tone:'record'};
    case 'document_sync_required': return {title_text_id:'ui.day_carryover.record.sync.title',body_text_id:'ui.day_carryover.record.sync.body',tone:'record'};
    case 'timeline_preserved': return {title_text_id:'ui.day_carryover.record.preserved.title',body_text_id:'ui.day_carryover.record.preserved.body',tone:'record'};
    default:return undefined;
  }
}

function peopleCard(flags:FlagMap):DayCarryoverCard|undefined{
  switch(flags.stopwork_culture_result){
    case 'reporting_silenced': return {title_text_id:'ui.day_carryover.people.silenced.title',body_text_id:'ui.day_carryover.people.silenced.body',tone:'people'};
    case 'formal_protection_private_friction': return {title_text_id:'ui.day_carryover.people.cold.title',body_text_id:'ui.day_carryover.people.cold.body',tone:'people'};
    case 'reporting_route_preserved': return {title_text_id:'ui.day_carryover.people.route.title',body_text_id:'ui.day_carryover.people.route.body',tone:'people'};
    default:return undefined;
  }
}

function instructionCard(flags:FlagMap):DayCarryoverCard|undefined{
  switch(flags.instruction_chain_result){
    case 'condition_loss_unresolved':
    case 'worker_blame_hides_chain':
      return {title_text_id:'ui.day_carryover.instruction.gap.title',body_text_id:'ui.day_carryover.instruction.gap.body',tone:'instruction'};
    case 'conditional_phrase_restored':
      return {title_text_id:'ui.day_carryover.instruction.restored.title',body_text_id:'ui.day_carryover.instruction.restored.body',tone:'instruction'};
    default:return undefined;
  }
}

function eveningCard(flags:FlagMap,open:boolean):DayCarryoverCard{
  if(flags.evening_rest===true) return {title_text_id:'ui.day_carryover.evening.rest.title',body_text_id:'ui.day_carryover.evening.rest.body',tone:'recovery'};
  if(flags.evening_family===true) return {title_text_id:'ui.day_carryover.evening.family.title',body_text_id:'ui.day_carryover.evening.family.body',tone:'recovery'};
  if(flags.evening_study===true) return {title_text_id:'ui.day_carryover.evening.study.title',body_text_id:'ui.day_carryover.evening.study.body',tone:'recovery'};
  if(flags.evening_field_note===true) return {title_text_id:'ui.day_carryover.evening.note.title',body_text_id:'ui.day_carryover.evening.note.body',tone:'recovery'};
  return {
    title_text_id:'ui.day_carryover.evening.open.title',
    body_text_id:'ui.day_carryover.evening.open.body',
    tone:'recovery'
  };
}

function firstCheckCard(flags:FlagMap):DayCarryoverCard{
  if(flags.stopwork_culture_result==='reporting_silenced'){
    return {title_text_id:'ui.day_carryover.first.reporting.title',body_text_id:'ui.day_carryover.first.reporting.body',tone:'first'};
  }
  if(flags.stopwork_culture_result==='formal_protection_private_friction'){
    return {title_text_id:'ui.day_carryover.first.relationship.title',body_text_id:'ui.day_carryover.first.relationship.body',tone:'first'};
  }
  if(flags.instruction_chain_result==='condition_loss_unresolved'||flags.instruction_chain_result==='worker_blame_hides_chain'){
    return {title_text_id:'ui.day_carryover.first.instruction.title',body_text_id:'ui.day_carryover.first.instruction.body',tone:'first'};
  }
  if(flags.record_result==='supplement_requested'||flags.record_result==='document_sync_required'){
    return {title_text_id:'ui.day_carryover.first.record.title',body_text_id:'ui.day_carryover.first.record.body',tone:'first'};
  }
  return {title_text_id:'ui.day_carryover.first.stable.title',body_text_id:'ui.day_carryover.first.stable.body',tone:'first'};
}

function stages(eventId:string):readonly DayCarryoverStage[]{
  const evening=eventId==='e01_09_evening';
  return Object.freeze([
    {time:'17:08',label_text_id:'ui.day_carryover.stage.record',state:'done'},
    {time:'20:41',label_text_id:'ui.day_carryover.stage.evening',state:evening?'current':'done'},
    {time:'06:52',label_text_id:'ui.day_carryover.stage.day2',state:evening?'next':'current'},
  ]);
}

export function episode01DayCarryover(eventId:string|null|undefined,flags:FlagMap|undefined):DayCarryoverModel|undefined{
  if(!flags||(eventId!=='e01_09_evening'&&eventId!=='e01_10_next_day_tease')) return undefined;
  const base=[recordCard(flags),peopleCard(flags),instructionCard(flags)].filter((card):card is DayCarryoverCard=>Boolean(card));
  if(eventId==='e01_09_evening'){
    const cards=[...base,eveningCard(flags,true)];
    return Object.freeze({
      doctrine_id:FIELD_REALITY_DOCTRINE_ID,
      phase:'evening',
      eyebrow_text_id:'ui.day_carryover.evening.eyebrow',
      title_text_id:'ui.day_carryover.evening.title',
      stages:stages(eventId),
      cards:Object.freeze(cards)
    });
  }
  const cards=[...base,eveningCard(flags,false),firstCheckCard(flags)];
  return Object.freeze({
    doctrine_id:FIELD_REALITY_DOCTRINE_ID,
    phase:'day2',
    eyebrow_text_id:'ui.day_carryover.day2.eyebrow',
    title_text_id:'ui.day_carryover.day2.title',
    stages:stages(eventId),
    cards:Object.freeze(cards)
  });
}
