import type { FlagMap } from '../domain';

export type ReportChainPhase = 'clash' | 'return' | 'verdict';
export type ReportChainTone = 'fact' | 'pressure' | 'basis' | 'verification' | 'result';

export interface ReportChainStage {
  readonly time: '10:39' | '11:12' | '11:31';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface ReportChainCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: ReportChainTone;
}

export interface ReportChainModel {
  readonly phase: ReportChainPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly ReportChainStage[];
  readonly cards: readonly ReportChainCard[];
}

function inspectionFact(flags: FlagMap): ReportChainCard | undefined {
  switch (flags.inspection_result) {
    case 'accepted':
      return { title_text_id: 'ui.report_chain.inspection.accepted.title', body_text_id: 'ui.report_chain.inspection.accepted.body', tone: 'fact' };
    case 'rework_after_reinspection':
      return { title_text_id: 'ui.report_chain.inspection.rework.title', body_text_id: 'ui.report_chain.inspection.rework.body', tone: 'fact' };
    case 'accepted_after_sequence':
      return { title_text_id: 'ui.report_chain.inspection.sequence.title', body_text_id: 'ui.report_chain.inspection.sequence.body', tone: 'fact' };
    default:
      return undefined;
  }
}

function basisCard(flags: FlagMap): ReportChainCard | undefined {
  switch (flags.report_basis) {
    case 'one_sided':
      return { title_text_id: 'ui.report_chain.basis.one_sided.title', body_text_id: 'ui.report_chain.basis.one_sided.body', tone: 'basis' };
    case 'defensive':
      return { title_text_id: 'ui.report_chain.basis.defensive.title', body_text_id: 'ui.report_chain.basis.defensive.body', tone: 'basis' };
    case 'timeline':
      return { title_text_id: 'ui.report_chain.basis.timeline.title', body_text_id: 'ui.report_chain.basis.timeline.body', tone: 'basis' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): ReportChainCard | undefined {
  switch (flags.report_basis) {
    case 'one_sided':
      return { title_text_id: 'ui.report_chain.focus.one_sided.title', body_text_id: 'ui.report_chain.focus.one_sided.body', tone: 'verification' };
    case 'defensive':
      return { title_text_id: 'ui.report_chain.focus.defensive.title', body_text_id: 'ui.report_chain.focus.defensive.body', tone: 'verification' };
    case 'timeline':
      return { title_text_id: 'ui.report_chain.focus.timeline.title', body_text_id: 'ui.report_chain.focus.timeline.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): ReportChainCard | undefined {
  switch (flags.report_result) {
    case 'correction_required':
      return { title_text_id: 'ui.report_chain.result.correction.title', body_text_id: 'ui.report_chain.result.correction.body', tone: 'result' };
    case 'evidence_requested':
      return { title_text_id: 'ui.report_chain.result.evidence.title', body_text_id: 'ui.report_chain.result.evidence.body', tone: 'result' };
    case 'timeline_confirmed':
      return { title_text_id: 'ui.report_chain.result.timeline.title', body_text_id: 'ui.report_chain.result.timeline.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly ReportChainStage[] {
  const clash = eventId === 'e01_08e_responsibility_clash';
  return Object.freeze([
    { time: '10:39', label_text_id: 'ui.report_chain.stage.inspection', state: 'done' },
    { time: '11:12', label_text_id: 'ui.report_chain.stage.clash', state: clash ? 'current' : 'done' },
    { time: '11:31', label_text_id: 'ui.report_chain.stage.return', state: clash ? 'next' : 'current' },
  ]);
}

const deadlineCard: ReportChainCard = Object.freeze({
  title_text_id: 'ui.report_chain.deadline.title',
  body_text_id: 'ui.report_chain.deadline.body',
  tone: 'pressure',
});

export function episode01ReportChain(eventId: string | null | undefined, flags: FlagMap | undefined): ReportChainModel | undefined {
  if (!flags || (eventId !== 'e01_08e_responsibility_clash' && eventId !== 'e01_08f_report_return')) return undefined;

  const fact = inspectionFact(flags);
  const basis = basisCard(flags);

  if (eventId === 'e01_08e_responsibility_clash') {
    const cards = [fact, deadlineCard, basis].filter((card): card is ReportChainCard => Boolean(card));
    return Object.freeze({
      phase: 'clash',
      eyebrow_text_id: 'ui.report_chain.clash.eyebrow',
      title_text_id: 'ui.report_chain.clash.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const result = resultCard(flags);
  if (result) {
    const cards = [fact, basis, result].filter((card): card is ReportChainCard => Boolean(card));
    return Object.freeze({
      phase: 'verdict',
      eyebrow_text_id: 'ui.report_chain.verdict.eyebrow',
      title_text_id: 'ui.report_chain.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const focus = focusCard(flags);
  const cards = [fact, basis, focus].filter((card): card is ReportChainCard => Boolean(card));
  return Object.freeze({
    phase: 'return',
    eyebrow_text_id: 'ui.report_chain.return.eyebrow',
    title_text_id: 'ui.report_chain.return.title',
    stages: stages(eventId),
    cards: Object.freeze(cards),
  });
}
