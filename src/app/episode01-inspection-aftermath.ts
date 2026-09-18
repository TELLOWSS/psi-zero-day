import type { FlagMap } from '../domain';

export type InspectionAftermathPhase = 'pushback' | 'reinspection' | 'verdict';
export type InspectionAftermathTone = 'schedule' | 'evidence' | 'coordination' | 'verification' | 'result';

export interface InspectionAftermathStage {
  readonly time: '10:16' | '10:24' | '10:39';
  readonly label_text_id: string;
  readonly state: 'done' | 'current' | 'next';
}

export interface InspectionAftermathCard {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: InspectionAftermathTone;
}

export interface InspectionAftermathModel {
  readonly phase: InspectionAftermathPhase;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly stages: readonly InspectionAftermathStage[];
  readonly cards: readonly InspectionAftermathCard[];
}

function actionCard(action: unknown): InspectionAftermathCard | undefined {
  switch (action) {
    case 'full_stop':
      return { title_text_id: 'ui.inspection_aftermath.full_stop.title', body_text_id: 'ui.inspection_aftermath.full_stop.body', tone: 'schedule' };
    case 'quick_photo':
      return { title_text_id: 'ui.inspection_aftermath.quick_photo.title', body_text_id: 'ui.inspection_aftermath.quick_photo.body', tone: 'evidence' };
    case 'sequence':
      return { title_text_id: 'ui.inspection_aftermath.sequence.title', body_text_id: 'ui.inspection_aftermath.sequence.body', tone: 'coordination' };
    default:
      return undefined;
  }
}

function focusCard(action: unknown): InspectionAftermathCard | undefined {
  switch (action) {
    case 'full_stop':
      return { title_text_id: 'ui.inspection_aftermath.focus.full_stop.title', body_text_id: 'ui.inspection_aftermath.focus.full_stop.body', tone: 'verification' };
    case 'quick_photo':
      return { title_text_id: 'ui.inspection_aftermath.focus.quick_photo.title', body_text_id: 'ui.inspection_aftermath.focus.quick_photo.body', tone: 'verification' };
    case 'sequence':
      return { title_text_id: 'ui.inspection_aftermath.focus.sequence.title', body_text_id: 'ui.inspection_aftermath.focus.sequence.body', tone: 'verification' };
    default:
      return undefined;
  }
}

function verdictCard(result: unknown): InspectionAftermathCard | undefined {
  switch (result) {
    case 'accepted':
      return { title_text_id: 'ui.inspection_aftermath.verdict.accepted.title', body_text_id: 'ui.inspection_aftermath.verdict.accepted.body', tone: 'result' };
    case 'rework_after_reinspection':
      return { title_text_id: 'ui.inspection_aftermath.verdict.rework.title', body_text_id: 'ui.inspection_aftermath.verdict.rework.body', tone: 'result' };
    case 'accepted_after_sequence':
      return { title_text_id: 'ui.inspection_aftermath.verdict.sequence.title', body_text_id: 'ui.inspection_aftermath.verdict.sequence.body', tone: 'result' };
    default:
      return undefined;
  }
}

function stagesFor(eventId: string): readonly InspectionAftermathStage[] {
  const atPushback = eventId === 'e01_08c_site_pushback';
  return Object.freeze([
    { time: '10:16', label_text_id: 'ui.inspection_aftermath.stage.find', state: 'done' },
    { time: '10:24', label_text_id: 'ui.inspection_aftermath.stage.pushback', state: atPushback ? 'current' : 'done' },
    { time: '10:39', label_text_id: 'ui.inspection_aftermath.stage.reinspection', state: atPushback ? 'next' : 'current' },
  ]);
}

export function episode01InspectionAftermath(eventId: string | null | undefined, flags: FlagMap | undefined): InspectionAftermathModel | undefined {
  if (!flags || (eventId !== 'e01_08c_site_pushback' && eventId !== 'e01_08d_reinspection')) return undefined;
  const route = actionCard(flags.inspection_action);
  if (!route) return undefined;

  if (eventId === 'e01_08c_site_pushback') {
    return Object.freeze({
      phase: 'pushback',
      eyebrow_text_id: 'ui.inspection_aftermath.pushback.eyebrow',
      title_text_id: 'ui.inspection_aftermath.pushback.title',
      stages: stagesFor(eventId),
      cards: Object.freeze([route]),
    });
  }

  const verdict = verdictCard(flags.inspection_result);
  if (verdict) {
    return Object.freeze({
      phase: 'verdict',
      eyebrow_text_id: 'ui.inspection_aftermath.verdict.eyebrow',
      title_text_id: 'ui.inspection_aftermath.verdict.title',
      stages: stagesFor(eventId),
      cards: Object.freeze([route, verdict]),
    });
  }

  const focus = focusCard(flags.inspection_action);
  return Object.freeze({
    phase: 'reinspection',
    eyebrow_text_id: 'ui.inspection_aftermath.reinspection.eyebrow',
    title_text_id: 'ui.inspection_aftermath.reinspection.title',
    stages: stagesFor(eventId),
    cards: Object.freeze([route, ...(focus ? [focus] : [])]),
  });
}
