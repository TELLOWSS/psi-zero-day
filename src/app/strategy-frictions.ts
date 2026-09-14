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
  e01_08a_reporting_return: [
    { friction_id: 'friction.reporting.aftershock', kind: 'reporting_hesitation', label_text_id: 'ui.friction.aftershock', detail_text_id: 'ui.friction.aftershock.reporting' },
  ],
  e01_08b_inspection_find: [
    { friction_id: 'friction.inspection.first', kind: 'inspection_pressure', label_text_id: 'ui.friction.inspection', detail_text_id: 'ui.friction.inspection.first' },
    { friction_id: 'friction.schedule.remaining_vehicle', kind: 'schedule_pressure', label_text_id: 'ui.friction.schedule', detail_text_id: 'ui.friction.schedule.remaining_vehicle' },
    { friction_id: 'friction.responsibility.inspection', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.inspection' },
  ],
  e01_08c_site_pushback: [
    { friction_id: 'friction.coordination.after_fix', kind: 'coordination_conflict', label_text_id: 'ui.friction.coordination', detail_text_id: 'ui.friction.coordination.after_fix' },
    { friction_id: 'friction.responsibility.pushback', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.pushback' },
  ],
  e01_08d_reinspection: [
    { friction_id: 'friction.inspection.recheck', kind: 'inspection_pressure', label_text_id: 'ui.friction.inspection', detail_text_id: 'ui.friction.inspection.recheck' },
    { friction_id: 'friction.responsibility.rework', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.rework' },
  ],
  e01_08e_responsibility_clash: [
    { friction_id: 'friction.responsibility.crossfire', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.responsibility.crossfire' },
    { friction_id: 'friction.timeline.changed_instruction', kind: 'coordination_conflict', label_text_id: 'ui.friction.timeline', detail_text_id: 'ui.friction.timeline.detail' },
    { friction_id: 'friction.paper_gap.report', kind: 'responsibility_shift', label_text_id: 'ui.friction.paper_gap', detail_text_id: 'ui.friction.paper_gap.report' },
  ],
  e01_08f_report_return: [
    { friction_id: 'friction.paper_gap.returned', kind: 'responsibility_shift', label_text_id: 'ui.friction.paper_gap', detail_text_id: 'ui.friction.paper_gap.returned' },
  ],
  e01_08g_tbm_field_gap: [
    { friction_id: 'friction.tbm.field_gap', kind: 'coordination_conflict', label_text_id: 'ui.friction.tbm_gap', detail_text_id: 'ui.friction.tbm_gap.detail' },
    { friction_id: 'friction.tbm.change_not_shared', kind: 'responsibility_shift', label_text_id: 'ui.friction.change_not_shared', detail_text_id: 'ui.friction.change_not_shared.detail' },
  ],
  e01_08h_tbm_return: [
    { friction_id: 'friction.tbm.return', kind: 'reporting_hesitation', label_text_id: 'ui.friction.tbm_return', detail_text_id: 'ui.friction.tbm_return.detail' },
  ],
  e01_08i_restart_pressure: [
    { friction_id: 'friction.restart.schedule', kind: 'schedule_pressure', label_text_id: 'ui.friction.restart', detail_text_id: 'ui.friction.restart.schedule' },
    { friction_id: 'friction.restart.condition_lost', kind: 'coordination_conflict', label_text_id: 'ui.friction.restart_condition', detail_text_id: 'ui.friction.restart_condition.detail' },
    { friction_id: 'friction.restart.who_ordered', kind: 'responsibility_shift', label_text_id: 'ui.friction.responsibility', detail_text_id: 'ui.friction.restart.who_ordered' },
  ],
  e01_08j_restart_return: [
    { friction_id: 'friction.restart.return', kind: 'responsibility_shift', label_text_id: 'ui.friction.restart_return', detail_text_id: 'ui.friction.restart_return.detail' },
  ],
  e01_08k_stopwork_aftershock: [
    { friction_id: 'friction.stopwork.schedule_blame', kind: 'schedule_pressure', label_text_id: 'ui.friction.stopwork_blame', detail_text_id: 'ui.friction.stopwork_blame.detail' },
    { friction_id: 'friction.stopwork.social_pressure', kind: 'hierarchy_pressure', label_text_id: 'ui.friction.stopwork_social', detail_text_id: 'ui.friction.stopwork_social.detail' },
    { friction_id: 'friction.stopwork.reporting_chill', kind: 'reporting_hesitation', label_text_id: 'ui.friction.stopwork_reporting', detail_text_id: 'ui.friction.stopwork_reporting.detail' },
  ],
  e01_08l_stopwork_return: [
    { friction_id: 'friction.stopwork.return', kind: 'reporting_hesitation', label_text_id: 'ui.friction.stopwork_return', detail_text_id: 'ui.friction.stopwork_return.detail' },
  ],
  e01_08m_instruction_cascade: [
    { friction_id: 'friction.instruction.schedule', kind: 'schedule_pressure', label_text_id: 'ui.friction.instruction_schedule', detail_text_id: 'ui.friction.instruction_schedule.detail' },
    { friction_id: 'friction.instruction.condition_loss', kind: 'coordination_conflict', label_text_id: 'ui.friction.instruction_loss', detail_text_id: 'ui.friction.instruction_loss.detail' },
    { friction_id: 'friction.instruction.hierarchy', kind: 'hierarchy_pressure', label_text_id: 'ui.friction.instruction_hierarchy', detail_text_id: 'ui.friction.instruction_hierarchy.detail' },
  ],
  e01_08n_instruction_return: [
    { friction_id: 'friction.instruction.return', kind: 'reporting_hesitation', label_text_id: 'ui.friction.instruction_return', detail_text_id: 'ui.friction.instruction_return.detail' },
  ],
  e01_08o_record_pressure: [
    { friction_id: 'friction.record.wording', kind: 'hierarchy_pressure', label_text_id: 'ui.friction.record_wording', detail_text_id: 'ui.friction.record_wording.detail' },
    { friction_id: 'friction.record.retrofit', kind: 'responsibility_shift', label_text_id: 'ui.friction.record_retrofit', detail_text_id: 'ui.friction.record_retrofit.detail' },
    { friction_id: 'friction.record.evidence', kind: 'coordination_conflict', label_text_id: 'ui.friction.record_evidence', detail_text_id: 'ui.friction.record_evidence.detail' },
  ],
  e01_08p_record_return: [
    { friction_id: 'friction.record.return', kind: 'responsibility_shift', label_text_id: 'ui.friction.record_return', detail_text_id: 'ui.friction.record_return.detail' },
  ],
};

export function projectEpisode01Frictions(activeEventId: Id | null): readonly FieldFriction[] {
  return activeEventId ? (FRICTIONS_BY_EVENT[activeEventId] ?? []) : [];
}
