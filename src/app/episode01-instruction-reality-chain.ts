import type { FlagMap } from '../domain';
import { FIELD_REALITY_DOCTRINE_ID } from './gameplay-doctrine';

export type InstructionRealityPhase = 'cascade' | 'return' | 'verdict';
export type InstructionRealityTone = 'previous' | 'floor' | 'voices' | 'action' | 'verification' | 'result';

export interface InstructionRealityStage {
  readonly time: '15:32' | '16:05' | '16:24';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface InstructionRealityCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: InstructionRealityTone;
}

export interface InstructionRealityModel {
  readonly doctrine_id: typeof FIELD_REALITY_DOCTRINE_ID;
  readonly phase: InstructionRealityPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly InstructionRealityStage[];
  readonly cards: readonly InstructionRealityCard[];
}

const floorCard: InstructionRealityCard = Object.freeze({
  title_text_id: 'ui.instruction_reality.floor.title',
  body_text_id: 'ui.instruction_reality.floor.body',
  tone: 'floor',
});

const voicesCard: InstructionRealityCard = Object.freeze({
  title_text_id: 'ui.instruction_reality.voices.title',
  body_text_id: 'ui.instruction_reality.voices.body',
  tone: 'voices',
});

function previousCard(flags: FlagMap): InstructionRealityCard | undefined {
  switch (flags.stopwork_culture_result) {
    case 'reporting_silenced':
      return { title_text_id: 'ui.instruction_reality.previous.silenced.title', body_text_id: 'ui.instruction_reality.previous.silenced.body', tone: 'previous' };
    case 'formal_protection_private_friction':
      return { title_text_id: 'ui.instruction_reality.previous.cold.title', body_text_id: 'ui.instruction_reality.previous.cold.body', tone: 'previous' };
    case 'reporting_route_preserved':
      return { title_text_id: 'ui.instruction_reality.previous.route.title', body_text_id: 'ui.instruction_reality.previous.route.body', tone: 'previous' };
    default:
      return undefined;
  }
}

function actionCard(flags: FlagMap): InstructionRealityCard | undefined {
  switch (flags.instruction_chain_action) {
    case 'accept_top':
      return { title_text_id: 'ui.instruction_reality.action.top.title', body_text_id: 'ui.instruction_reality.action.top.body', tone: 'action' };
    case 'blame_worker':
      return { title_text_id: 'ui.instruction_reality.action.blame.title', body_text_id: 'ui.instruction_reality.action.blame.body', tone: 'action' };
    case 'reconstruct_chain':
      return { title_text_id: 'ui.instruction_reality.action.reconstruct.title', body_text_id: 'ui.instruction_reality.action.reconstruct.body', tone: 'action' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): InstructionRealityCard | undefined {
  switch (flags.instruction_chain_action) {
    case 'accept_top':
      return { title_text_id: 'ui.instruction_reality.focus.top.title', body_text_id: 'ui.instruction_reality.focus.top.body', tone: 'verification' };
    case 'blame_worker':
      return { title_text_id: 'ui.instruction_reality.focus.blame.title', body_text_id: 'ui.instruction_reality.focus.blame.body', tone: 'verification' };
    case 'reconstruct_chain':
      return { title_text_id: 'ui.instruction_reality.focus.reconstruct.title', body_text_id: 'ui.instruction_reality.focus.reconstruct.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): InstructionRealityCard | undefined {
  switch (flags.instruction_chain_result) {
    case 'condition_loss_unresolved':
      return { title_text_id: 'ui.instruction_reality.result.gap.title', body_text_id: 'ui.instruction_reality.result.gap.body', tone: 'result' };
    case 'worker_blame_hides_chain':
      return { title_text_id: 'ui.instruction_reality.result.chilled.title', body_text_id: 'ui.instruction_reality.result.chilled.body', tone: 'result' };
    case 'conditional_phrase_restored':
      return { title_text_id: 'ui.instruction_reality.result.reconstructed.title', body_text_id: 'ui.instruction_reality.result.reconstructed.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly InstructionRealityStage[] {
  const cascade = eventId === 'e01_08m_instruction_cascade';
  return Object.freeze([
    { time: '15:32', label_text_id: 'ui.instruction_reality.stage.report', state: 'done' },
    { time: '16:05', label_text_id: 'ui.instruction_reality.stage.cascade', state: cascade ? 'current' : 'done' },
    { time: '16:24', label_text_id: 'ui.instruction_reality.stage.return', state: cascade ? 'next' : 'current' },
  ]);
}

export function episode01InstructionRealityChain(eventId: string | null | undefined, flags: FlagMap | undefined): InstructionRealityModel | undefined {
  if (!flags || (eventId !== 'e01_08m_instruction_cascade' && eventId !== 'e01_08n_instruction_return')) return undefined;

  const previous = previousCard(flags);
  const action = actionCard(flags);

  if (eventId === 'e01_08m_instruction_cascade') {
    const cards = [previous, floorCard, voicesCard, action].filter((card): card is InstructionRealityCard => Boolean(card));
    return Object.freeze({
      doctrine_id: FIELD_REALITY_DOCTRINE_ID,
      phase: 'cascade',
      eyebrow_text_id: 'ui.instruction_reality.cascade.eyebrow',
      title_text_id: 'ui.instruction_reality.cascade.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const result = resultCard(flags);
  if (result) {
    const cards = [floorCard, voicesCard, action, result].filter((card): card is InstructionRealityCard => Boolean(card));
    return Object.freeze({
      doctrine_id: FIELD_REALITY_DOCTRINE_ID,
      phase: 'verdict',
      eyebrow_text_id: 'ui.instruction_reality.verdict.eyebrow',
      title_text_id: 'ui.instruction_reality.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const focus = focusCard(flags);
  const cards = [floorCard, voicesCard, action, focus].filter((card): card is InstructionRealityCard => Boolean(card));
  return Object.freeze({
    doctrine_id: FIELD_REALITY_DOCTRINE_ID,
    phase: 'return',
    eyebrow_text_id: 'ui.instruction_reality.return.eyebrow',
    title_text_id: 'ui.instruction_reality.return.title',
    stages: stages(eventId),
    cards: Object.freeze(cards),
  });
}
