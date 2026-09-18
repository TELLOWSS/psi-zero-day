import type { FlagMap } from '../domain';

export type RestartChainPhase = 'decision' | 'return' | 'verdict';
export type RestartChainTone = 'previous' | 'gate' | 'action' | 'verification' | 'result';

export interface RestartChainStage {
  readonly time: '13:56' | '14:03' | '14:11';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface RestartChainCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: RestartChainTone;
}

export interface RestartChainModel {
  readonly phase: RestartChainPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly RestartChainStage[];
  readonly cards: readonly RestartChainCard[];
}

const gateCard: RestartChainCard = Object.freeze({
  title_text_id: 'ui.restart_chain.condition.title',
  body_text_id: 'ui.restart_chain.condition.body',
  tone: 'gate',
});

function previousCard(flags: FlagMap): RestartChainCard | undefined {
  switch (flags.tbm_gap_result) {
    case 'paper_field_gap_remains':
      return { title_text_id: 'ui.restart_chain.previous.paper.title', body_text_id: 'ui.restart_chain.previous.paper.body', tone: 'previous' };
    case 'reporting_chilled':
      return { title_text_id: 'ui.restart_chain.previous.silenced.title', body_text_id: 'ui.restart_chain.previous.silenced.body', tone: 'previous' };
    case 'changed_work_rebriefed':
      return { title_text_id: 'ui.restart_chain.previous.controlled.title', body_text_id: 'ui.restart_chain.previous.controlled.body', tone: 'previous' };
    default:
      return undefined;
  }
}

function actionCard(flags: FlagMap): RestartChainCard | undefined {
  switch (flags.restart_action) {
    case 'follow_verbal':
      return { title_text_id: 'ui.restart_chain.action.follow.title', body_text_id: 'ui.restart_chain.action.follow.body', tone: 'action' };
    case 'trace_instruction':
      return { title_text_id: 'ui.restart_chain.action.trace.title', body_text_id: 'ui.restart_chain.action.trace.body', tone: 'action' };
    case 'verify_controls':
      return { title_text_id: 'ui.restart_chain.action.verify.title', body_text_id: 'ui.restart_chain.action.verify.body', tone: 'action' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): RestartChainCard | undefined {
  switch (flags.restart_action) {
    case 'follow_verbal':
      return { title_text_id: 'ui.restart_chain.focus.follow.title', body_text_id: 'ui.restart_chain.focus.follow.body', tone: 'verification' };
    case 'trace_instruction':
      return { title_text_id: 'ui.restart_chain.focus.trace.title', body_text_id: 'ui.restart_chain.focus.trace.body', tone: 'verification' };
    case 'verify_controls':
      return { title_text_id: 'ui.restart_chain.focus.verify.title', body_text_id: 'ui.restart_chain.focus.verify.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): RestartChainCard | undefined {
  switch (flags.restart_result) {
    case 'premature_restart_second_stop':
      return { title_text_id: 'ui.restart_chain.result.premature.title', body_text_id: 'ui.restart_chain.result.premature.body', tone: 'result' };
    case 'conditional_instruction_distorted':
      return { title_text_id: 'ui.restart_chain.result.distorted.title', body_text_id: 'ui.restart_chain.result.distorted.body', tone: 'result' };
    case 'controlled_restart':
      return { title_text_id: 'ui.restart_chain.result.controlled.title', body_text_id: 'ui.restart_chain.result.controlled.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly RestartChainStage[] {
  const decision = eventId === 'e01_08i_restart_pressure';
  return Object.freeze([
    { time: '13:56', label_text_id: 'ui.restart_chain.stage.change', state: 'done' },
    { time: '14:03', label_text_id: 'ui.restart_chain.stage.decision', state: decision ? 'current' : 'done' },
    { time: '14:11', label_text_id: 'ui.restart_chain.stage.return', state: decision ? 'next' : 'current' },
  ]);
}

export function episode01RestartChain(eventId: string | null | undefined, flags: FlagMap | undefined): RestartChainModel | undefined {
  if (!flags || (eventId !== 'e01_08i_restart_pressure' && eventId !== 'e01_08j_restart_return')) return undefined;

  const previous = previousCard(flags);
  const action = actionCard(flags);

  if (eventId === 'e01_08i_restart_pressure') {
    const cards = [previous, gateCard, action].filter((card): card is RestartChainCard => Boolean(card));
    return Object.freeze({
      phase: 'decision',
      eyebrow_text_id: 'ui.restart_chain.decision.eyebrow',
      title_text_id: 'ui.restart_chain.decision.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const result = resultCard(flags);
  if (result) {
    const cards = [previous, gateCard, action, result].filter((card): card is RestartChainCard => Boolean(card));
    return Object.freeze({
      phase: 'verdict',
      eyebrow_text_id: 'ui.restart_chain.verdict.eyebrow',
      title_text_id: 'ui.restart_chain.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const focus = focusCard(flags);
  const cards = [previous, gateCard, action, focus].filter((card): card is RestartChainCard => Boolean(card));
  return Object.freeze({
    phase: 'return',
    eyebrow_text_id: 'ui.restart_chain.return.eyebrow',
    title_text_id: 'ui.restart_chain.return.title',
    stages: stages(eventId),
    cards: Object.freeze(cards),
  });
}
