import type { Id, TextId } from '../domain/common';

export type FieldFrictionKind =
  | 'schedule_pressure'
  | 'coordination_conflict'
  | 'reporting_hesitation'
  | 'hierarchy_pressure'
  | 'responsibility_shift'
  | 'inspection_pressure';

export interface FieldFriction {
  readonly friction_id: Id;
  readonly kind: FieldFrictionKind;
  readonly label_text_id: TextId;
  readonly detail_text_id: TextId;
}

const FRICTIONS_BY_EVENT: Readonly<Record<Id, readonly FieldFriction[]>> = {
  e01_03_plan_breaks: [
    { friction_id: 'friction.schedule.early_rebar', kind: 'schedule_pressure', label_text_id: 'ui.friction.schedule', detail_text_id: 'ui.friction.schedule.early_rebar' },
    { friction_id: 'friction.coordination.overlap', kind: 'coordination_conflict', label_text_id: 'ui.friction.coordination', detail_text_id: 'ui.friction.coordination.overlap' },
  ],
  e01_04_junho_signal: [
    { friction_id: 'friction.reporting.hesitation', kind: 'reporting_hesitation', label_text_id: 'ui.friction.reporting', detail_text_id: 'ui.friction.reporting.hesitation' },
    { friction_id: 'friction.hierarchy.junior', kind: 'hierarchy_pressure', label_text_id: 'ui.friction.hierarchy', detail_text_id: 'ui.friction.hierarchy.junior' },
  ],
  e01_05_command: [
    { friction_id: 'friction.schedule.pump', kind: 'schedule_pressure', label_text_id: 'ui.friction.schedule', detail_text_id: 'ui.friction.schedule.pump' },
    { friction_id: 'friction.coordination.crews', kind: 'coordination_conflict', label_text_id: 'ui.friction.coordination', detail_text_id: 'ui.friction.coordination.crews' },
    { friction_id: 'friction.responsibility.command', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.command' },
  ],
  e01_06_pump_arrival: [
    { friction_id: 'friction.schedule.waiting_vehicle', kind: 'schedule_pressure', label_text_id: 'ui.friction.schedule', detail_text_id: 'ui.friction.schedule.waiting_vehicle' },
    { friction_id: 'friction.responsibility.entry', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.entry' },
  ],
};

export function projectEpisode01Frictions(activeEventId: Id | null): readonly FieldFriction[] {
  return activeEventId ? (FRICTIONS_BY_EVENT[activeEventId] ?? []) : [];
}
