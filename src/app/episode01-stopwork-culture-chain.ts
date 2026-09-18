import type { FlagMap } from '../domain';

export type StopworkCulturePhase = 'aftershock' | 'return' | 'verdict';
export type StopworkCultureTone = 'previous' | 'principle' | 'action' | 'verification' | 'result';

export interface StopworkCultureStage {
  readonly time: '14:11' | '15:10' | '15:32';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface StopworkCultureCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: StopworkCultureTone;
}

export interface StopworkCultureModel {
  readonly phase: StopworkCulturePhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly StopworkCultureStage[];
  readonly cards: readonly StopworkCultureCard[];
}

const principleCard: StopworkCultureCard = Object.freeze({
  title_text_id: 'ui.stopwork_chain.principle.title',
  body_text_id: 'ui.stopwork_chain.principle.body',
  tone: 'principle',
});

function previousCard(flags: FlagMap): StopworkCultureCard | undefined {
  switch (flags.restart_result) {
    case 'premature_restart_second_stop':
      return { title_text_id: 'ui.stopwork_chain.previous.premature.title', body_text_id: 'ui.stopwork_chain.previous.premature.body', tone: 'previous' };
    case 'conditional_instruction_distorted':
      return { title_text_id: 'ui.stopwork_chain.previous.distorted.title', body_text_id: 'ui.stopwork_chain.previous.distorted.body', tone: 'previous' };
    case 'controlled_restart':
      return { title_text_id: 'ui.stopwork_chain.previous.controlled.title', body_text_id: 'ui.stopwork_chain.previous.controlled.body', tone: 'previous' };
    default:
      return undefined;
  }
}

function actionCard(flags: FlagMap): StopworkCultureCard | undefined {
  switch (flags.stopwork_culture_action) {
    case 'ignore_social':
      return { title_text_id: 'ui.stopwork_chain.action.ignore.title', body_text_id: 'ui.stopwork_chain.action.ignore.body', tone: 'action' };
    case 'public_boundary':
      return { title_text_id: 'ui.stopwork_chain.action.public.title', body_text_id: 'ui.stopwork_chain.action.public.body', tone: 'action' };
    case 'protect_process':
      return { title_text_id: 'ui.stopwork_chain.action.process.title', body_text_id: 'ui.stopwork_chain.action.process.body', tone: 'action' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): StopworkCultureCard | undefined {
  switch (flags.stopwork_culture_action) {
    case 'ignore_social':
      return { title_text_id: 'ui.stopwork_chain.focus.ignore.title', body_text_id: 'ui.stopwork_chain.focus.ignore.body', tone: 'verification' };
    case 'public_boundary':
      return { title_text_id: 'ui.stopwork_chain.focus.public.title', body_text_id: 'ui.stopwork_chain.focus.public.body', tone: 'verification' };
    case 'protect_process':
      return { title_text_id: 'ui.stopwork_chain.focus.process.title', body_text_id: 'ui.stopwork_chain.focus.process.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): StopworkCultureCard | undefined {
  switch (flags.stopwork_culture_result) {
    case 'reporting_silenced':
      return { title_text_id: 'ui.stopwork_chain.result.silenced.title', body_text_id: 'ui.stopwork_chain.result.silenced.body', tone: 'result' };
    case 'formal_protection_private_friction':
      return { title_text_id: 'ui.stopwork_chain.result.cold.title', body_text_id: 'ui.stopwork_chain.result.cold.body', tone: 'result' };
    case 'reporting_route_preserved':
      return { title_text_id: 'ui.stopwork_chain.result.route.title', body_text_id: 'ui.stopwork_chain.result.route.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly StopworkCultureStage[] {
  const aftershock = eventId === 'e01_08k_stopwork_aftershock';
  return Object.freeze([
    { time: '14:11', label_text_id: 'ui.stopwork_chain.stage.restart', state: 'done' },
    { time: '15:10', label_text_id: 'ui.stopwork_chain.stage.aftershock', state: aftershock ? 'current' : 'done' },
    { time: '15:32', label_text_id: 'ui.stopwork_chain.stage.next_signal', state: aftershock ? 'next' : 'current' },
  ]);
}

export function episode01StopworkCultureChain(eventId: string | null | undefined, flags: FlagMap | undefined): StopworkCultureModel | undefined {
  if (!flags || (eventId !== 'e01_08k_stopwork_aftershock' && eventId !== 'e01_08l_stopwork_return')) return undefined;

  const previous = previousCard(flags);
  const action = actionCard(flags);

  if (eventId === 'e01_08k_stopwork_aftershock') {
    const cards = [previous, principleCard, action].filter((card): card is StopworkCultureCard => Boolean(card));
    return Object.freeze({
      phase: 'aftershock',
      eyebrow_text_id: 'ui.stopwork_chain.aftershock.eyebrow',
      title_text_id: 'ui.stopwork_chain.aftershock.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const result = resultCard(flags);
  if (result) {
    const cards = [previous, principleCard, action, result].filter((card): card is StopworkCultureCard => Boolean(card));
    return Object.freeze({
      phase: 'verdict',
      eyebrow_text_id: 'ui.stopwork_chain.verdict.eyebrow',
      title_text_id: 'ui.stopwork_chain.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const focus = focusCard(flags);
  const cards = [previous, principleCard, action, focus].filter((card): card is StopworkCultureCard => Boolean(card));
  return Object.freeze({
    phase: 'return',
    eyebrow_text_id: 'ui.stopwork_chain.return.eyebrow',
    title_text_id: 'ui.stopwork_chain.return.title',
    stages: stages(eventId),
    cards: Object.freeze(cards),
  });
}
