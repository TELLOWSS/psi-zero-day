import type { FlagMap } from '../domain';
import { FIELD_REALITY_DOCTRINE_ID } from './gameplay-doctrine';

export type Episode02LiftPhase = 'decision' | 'return' | 'verdict';
export type Episode02LiftTone = 'carryover' | 'floor' | 'voices' | 'action' | 'verification' | 'result';

export interface Episode02LiftStage {
  readonly time: '06:52' | '07:06' | '07:18';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface Episode02LiftCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: Episode02LiftTone;
}

export interface Episode02LiftModel {
  readonly doctrine_id: typeof FIELD_REALITY_DOCTRINE_ID;
  readonly phase: Episode02LiftPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly Episode02LiftStage[];
  readonly cards: readonly Episode02LiftCard[];
}

const floorCard: Episode02LiftCard = Object.freeze({
  title_text_id: 'ui.ep02_lift.floor.title',
  body_text_id: 'ui.ep02_lift.floor.body',
  tone: 'floor',
});
const voicesCard: Episode02LiftCard = Object.freeze({
  title_text_id: 'ui.ep02_lift.voices.title',
  body_text_id: 'ui.ep02_lift.voices.body',
  tone: 'voices',
});

function carryoverCard(flags: FlagMap): Episode02LiftCard {
  if (flags.stopwork_culture_result === 'reporting_silenced') {
    return { title_text_id: 'ui.ep02_lift.carryover.silenced.title', body_text_id: 'ui.ep02_lift.carryover.silenced.body', tone: 'carryover' };
  }
  if (flags.stopwork_culture_result === 'formal_protection_private_friction') {
    return { title_text_id: 'ui.ep02_lift.carryover.cold.title', body_text_id: 'ui.ep02_lift.carryover.cold.body', tone: 'carryover' };
  }
  if (flags.instruction_chain_result === 'condition_loss_unresolved' || flags.instruction_chain_result === 'worker_blame_hides_chain') {
    return { title_text_id: 'ui.ep02_lift.carryover.instruction.title', body_text_id: 'ui.ep02_lift.carryover.instruction.body', tone: 'carryover' };
  }
  if (flags.record_result === 'supplement_requested' || flags.record_result === 'document_sync_required') {
    return { title_text_id: 'ui.ep02_lift.carryover.record.title', body_text_id: 'ui.ep02_lift.carryover.record.body', tone: 'carryover' };
  }
  return { title_text_id: 'ui.ep02_lift.carryover.stable.title', body_text_id: 'ui.ep02_lift.carryover.stable.body', tone: 'carryover' };
}

function actionCard(flags: FlagMap): Episode02LiftCard | undefined {
  switch (flags.day02_lift_action) {
    case 'plan_route':
      return { title_text_id: 'ui.ep02_lift.action.plan.title', body_text_id: 'ui.ep02_lift.action.plan.body', tone: 'action' };
    case 'field_route':
      return { title_text_id: 'ui.ep02_lift.action.field.title', body_text_id: 'ui.ep02_lift.action.field.body', tone: 'action' };
    case 'shared_route':
      return { title_text_id: 'ui.ep02_lift.action.shared.title', body_text_id: 'ui.ep02_lift.action.shared.body', tone: 'action' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): Episode02LiftCard | undefined {
  switch (flags.day02_lift_action) {
    case 'plan_route':
      return { title_text_id: 'ui.ep02_lift.focus.plan.title', body_text_id: 'ui.ep02_lift.focus.plan.body', tone: 'verification' };
    case 'field_route':
      return { title_text_id: 'ui.ep02_lift.focus.field.title', body_text_id: 'ui.ep02_lift.focus.field.body', tone: 'verification' };
    case 'shared_route':
      return { title_text_id: 'ui.ep02_lift.focus.shared.title', body_text_id: 'ui.ep02_lift.focus.shared.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): Episode02LiftCard | undefined {
  switch (flags.day02_lift_result) {
    case 'plan_compliant_field_friction':
      return { title_text_id: 'ui.ep02_lift.result.plan.title', body_text_id: 'ui.ep02_lift.result.plan.body', tone: 'result' };
    case 'experience_route_dependency':
      return { title_text_id: 'ui.ep02_lift.result.field.title', body_text_id: 'ui.ep02_lift.result.field.body', tone: 'result' };
    case 'shared_route_controlled':
      return { title_text_id: 'ui.ep02_lift.result.shared.title', body_text_id: 'ui.ep02_lift.result.shared.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly Episode02LiftStage[] {
  const decision = eventId === 'e02_01_lift_route_pressure';
  return Object.freeze([
    { time: '06:52', label_text_id: 'ui.ep02_lift.stage.carryover', state: 'done' },
    { time: '07:06', label_text_id: 'ui.ep02_lift.stage.route', state: decision ? 'current' : 'done' },
    { time: '07:18', label_text_id: 'ui.ep02_lift.stage.return', state: decision ? 'next' : 'current' },
  ]);
}

export function episode02LiftReality(eventId: string | null | undefined, flags: FlagMap | undefined): Episode02LiftModel | undefined {
  if (!flags || (eventId !== 'e02_01_lift_route_pressure' && eventId !== 'e02_02_lift_route_return')) return undefined;
  const carryover = carryoverCard(flags);
  const action = actionCard(flags);

  if (eventId === 'e02_01_lift_route_pressure') {
    return Object.freeze({
      doctrine_id: FIELD_REALITY_DOCTRINE_ID,
      phase: 'decision',
      eyebrow_text_id: 'ui.ep02_lift.decision.eyebrow',
      title_text_id: 'ui.ep02_lift.decision.title',
      stages: stages(eventId),
      cards: Object.freeze([carryover, floorCard, voicesCard, action].filter((card): card is Episode02LiftCard => Boolean(card))),
    });
  }

  const result = resultCard(flags);
  if (result) {
    return Object.freeze({
      doctrine_id: FIELD_REALITY_DOCTRINE_ID,
      phase: 'verdict',
      eyebrow_text_id: 'ui.ep02_lift.verdict.eyebrow',
      title_text_id: 'ui.ep02_lift.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze([carryover, floorCard, voicesCard, action, result].filter((card): card is Episode02LiftCard => Boolean(card))),
    });
  }

  const focus = focusCard(flags);
  return Object.freeze({
    doctrine_id: FIELD_REALITY_DOCTRINE_ID,
    phase: 'return',
    eyebrow_text_id: 'ui.ep02_lift.return.eyebrow',
    title_text_id: 'ui.ep02_lift.return.title',
    stages: stages(eventId),
    cards: Object.freeze([carryover, floorCard, voicesCard, action, focus].filter((card): card is Episode02LiftCard => Boolean(card))),
  });
}
