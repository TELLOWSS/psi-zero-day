import type { FlagMap } from '../domain';

export type TbmChangePhase = 'change' | 'return' | 'verdict';
export type TbmChangeTone = 'record' | 'baseline' | 'field' | 'action' | 'verification' | 'result';

export interface TbmChangeStage {
  readonly time: '11:31' | '13:42' | '13:56';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface TbmChangeCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: TbmChangeTone;
}

export interface TbmChangeModel {
  readonly phase: TbmChangePhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly TbmChangeStage[];
  readonly cards: readonly TbmChangeCard[];
}

const morningCard: TbmChangeCard = Object.freeze({
  title_text_id: 'ui.tbm_chain.morning.title',
  body_text_id: 'ui.tbm_chain.morning.body',
  tone: 'baseline',
});

const afternoonCard: TbmChangeCard = Object.freeze({
  title_text_id: 'ui.tbm_chain.afternoon.title',
  body_text_id: 'ui.tbm_chain.afternoon.body',
  tone: 'field',
});

function recordLesson(flags: FlagMap): TbmChangeCard | undefined {
  switch (flags.report_result) {
    case 'correction_required':
      return { title_text_id: 'ui.tbm_chain.record.correction.title', body_text_id: 'ui.tbm_chain.record.correction.body', tone: 'record' };
    case 'evidence_requested':
      return { title_text_id: 'ui.tbm_chain.record.evidence.title', body_text_id: 'ui.tbm_chain.record.evidence.body', tone: 'record' };
    case 'timeline_confirmed':
      return { title_text_id: 'ui.tbm_chain.record.timeline.title', body_text_id: 'ui.tbm_chain.record.timeline.body', tone: 'record' };
    default:
      return undefined;
  }
}

function actionCard(flags: FlagMap): TbmChangeCard | undefined {
  switch (flags.tbm_gap_action) {
    case 'form_first':
      return { title_text_id: 'ui.tbm_chain.action.form_first.title', body_text_id: 'ui.tbm_chain.action.form_first.body', tone: 'action' };
    case 'worker_blame':
      return { title_text_id: 'ui.tbm_chain.action.worker_blame.title', body_text_id: 'ui.tbm_chain.action.worker_blame.body', tone: 'action' };
    case 'change_control':
      return { title_text_id: 'ui.tbm_chain.action.change_control.title', body_text_id: 'ui.tbm_chain.action.change_control.body', tone: 'action' };
    default:
      return undefined;
  }
}

function focusCard(flags: FlagMap): TbmChangeCard | undefined {
  switch (flags.tbm_gap_action) {
    case 'form_first':
      return { title_text_id: 'ui.tbm_chain.focus.form_first.title', body_text_id: 'ui.tbm_chain.focus.form_first.body', tone: 'verification' };
    case 'worker_blame':
      return { title_text_id: 'ui.tbm_chain.focus.worker_blame.title', body_text_id: 'ui.tbm_chain.focus.worker_blame.body', tone: 'verification' };
    case 'change_control':
      return { title_text_id: 'ui.tbm_chain.focus.change_control.title', body_text_id: 'ui.tbm_chain.focus.change_control.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function resultCard(flags: FlagMap): TbmChangeCard | undefined {
  switch (flags.tbm_gap_result) {
    case 'paper_field_gap_remains':
      return { title_text_id: 'ui.tbm_chain.result.paper.title', body_text_id: 'ui.tbm_chain.result.paper.body', tone: 'result' };
    case 'reporting_chilled':
      return { title_text_id: 'ui.tbm_chain.result.silenced.title', body_text_id: 'ui.tbm_chain.result.silenced.body', tone: 'result' };
    case 'changed_work_rebriefed':
      return { title_text_id: 'ui.tbm_chain.result.controlled.title', body_text_id: 'ui.tbm_chain.result.controlled.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stages(eventId: string): readonly TbmChangeStage[] {
  const change = eventId === 'e01_08g_tbm_field_gap';
  return Object.freeze([
    { time: '11:31', label_text_id: 'ui.tbm_chain.stage.record', state: 'done' },
    { time: '13:42', label_text_id: 'ui.tbm_chain.stage.change', state: change ? 'current' : 'done' },
    { time: '13:56', label_text_id: 'ui.tbm_chain.stage.return', state: change ? 'next' : 'current' },
  ]);
}

export function episode01TbmChangeChain(eventId: string | null | undefined, flags: FlagMap | undefined): TbmChangeModel | undefined {
  if (!flags || (eventId !== 'e01_08g_tbm_field_gap' && eventId !== 'e01_08h_tbm_return')) return undefined;

  const lesson = recordLesson(flags);
  const action = actionCard(flags);

  if (eventId === 'e01_08g_tbm_field_gap') {
    const cards = [lesson, morningCard, afternoonCard, action].filter((card): card is TbmChangeCard => Boolean(card));
    return Object.freeze({
      phase: 'change',
      eyebrow_text_id: 'ui.tbm_chain.change.eyebrow',
      title_text_id: 'ui.tbm_chain.change.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const result = resultCard(flags);
  if (result) {
    const cards = [morningCard, afternoonCard, action, result].filter((card): card is TbmChangeCard => Boolean(card));
    return Object.freeze({
      phase: 'verdict',
      eyebrow_text_id: 'ui.tbm_chain.verdict.eyebrow',
      title_text_id: 'ui.tbm_chain.verdict.title',
      stages: stages(eventId),
      cards: Object.freeze(cards),
    });
  }

  const focus = focusCard(flags);
  const cards = [morningCard, afternoonCard, action, focus].filter((card): card is TbmChangeCard => Boolean(card));
  return Object.freeze({
    phase: 'return',
    eyebrow_text_id: 'ui.tbm_chain.return.eyebrow',
    title_text_id: 'ui.tbm_chain.return.title',
    stages: stages(eventId),
    cards: Object.freeze(cards),
  });
}
