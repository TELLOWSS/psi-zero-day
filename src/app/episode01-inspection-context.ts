import type { FlagMap } from '../domain';

export interface EpisodeInspectionTrace {
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: 'control' | 'warning' | 'communication';
}

export interface EpisodeInspectionContextModel {
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly traces: readonly EpisodeInspectionTrace[];
}

function pumpTrace(flags: FlagMap): EpisodeInspectionTrace | undefined {
  switch (flags.pump_result) {
    case 'BEST_CONTROL':
      return { title_text_id: 'ui.inspection_context.pump.control.title', body_text_id: 'ui.inspection_context.pump.control.body', tone: 'control' };
    case 'NEAR_MISS':
      return { title_text_id: 'ui.inspection_context.pump.near_miss.title', body_text_id: 'ui.inspection_context.pump.near_miss.body', tone: 'warning' };
    case 'RELATION_CONFLICT':
      return { title_text_id: 'ui.inspection_context.pump.relation.title', body_text_id: 'ui.inspection_context.pump.relation.body', tone: 'warning' };
    case 'CONTROLLED_DELAY':
      return { title_text_id: 'ui.inspection_context.pump.delay.title', body_text_id: 'ui.inspection_context.pump.delay.body', tone: 'warning' };
    default:
      return undefined;
  }
}

function reportingTrace(flags: FlagMap): EpisodeInspectionTrace | undefined {
  switch (flags.reporting_return_state) {
    case 'reinforced':
      return { title_text_id: 'ui.inspection_context.reporting.reinforced.title', body_text_id: 'ui.inspection_context.reporting.reinforced.body', tone: 'communication' };
    case 'suppressed':
      return { title_text_id: 'ui.inspection_context.reporting.suppressed.title', body_text_id: 'ui.inspection_context.reporting.suppressed.body', tone: 'warning' };
    case 'missed':
      return { title_text_id: 'ui.inspection_context.reporting.missed.title', body_text_id: 'ui.inspection_context.reporting.missed.body', tone: 'warning' };
    default:
      return undefined;
  }
}

export function episode01InspectionContext(eventId: string | null | undefined, flags: FlagMap | undefined): EpisodeInspectionContextModel | undefined {
  if (eventId !== 'e01_08b_inspection_find' || !flags) return undefined;
  const traces = [pumpTrace(flags), reportingTrace(flags)].filter((trace): trace is EpisodeInspectionTrace => Boolean(trace));
  if (!traces.length) return undefined;
  return Object.freeze({
    eyebrow_text_id: 'ui.inspection_context.eyebrow',
    title_text_id: 'ui.inspection_context.title',
    traces: Object.freeze(traces),
  });
}
