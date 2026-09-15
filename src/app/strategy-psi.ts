import type { PsiIndicatorId } from './product-contract';

const PSI_CUES_BY_CHOICE: Readonly<Record<string, readonly PsiIndicatorId[]>> = Object.freeze({
  delegate_kang: ['practice_participation', 'communication_reporting'],
  negotiate_yoon: ['practice_participation', 'communication_reporting'],
  coordinate_schedule: ['communication_reporting', 'stop_work_acceptance'],
  follow_junho: ['risk_awareness', 'communication_reporting'],
  listen_more: ['risk_awareness', 'communication_reporting'],
  dismiss: ['risk_awareness', 'communication_reporting'],

  check_self: ['risk_awareness'],
  ask_minseok: ['risk_awareness', 'practice_participation', 'communication_reporting'],
  keep_schedule: ['risk_awareness', 'stop_work_acceptance'],
  assign_crew: ['practice_participation', 'communication_reporting'],
  request_delay: ['communication_reporting', 'stop_work_acceptance'],
  force_clear: ['practice_participation', 'communication_reporting'],

  inspection_full_stop: ['ppe_rule_compliance', 'stop_work_acceptance'],
  inspection_quick_photo: ['ppe_rule_compliance', 'communication_reporting'],
  inspection_sequence_agreement: ['practice_participation', 'communication_reporting'],

  report_one_sided: ['communication_reporting'],
  report_defensive: ['communication_reporting'],
  report_verify_timeline: ['risk_awareness', 'communication_reporting'],

  tbm_form_first: ['training_comprehension', 'ppe_rule_compliance'],
  tbm_worker_blame: ['training_comprehension', 'communication_reporting'],
  tbm_change_control: ['training_comprehension', 'practice_participation', 'ppe_rule_compliance'],

  restart_follow_verbal: ['communication_reporting', 'ppe_rule_compliance'],
  restart_trace_instruction: ['risk_awareness', 'communication_reporting'],
  restart_verify_controls: ['risk_awareness', 'ppe_rule_compliance', 'stop_work_acceptance'],

  stopwork_ignore_social: ['communication_reporting', 'stop_work_acceptance'],
  stopwork_public_boundary: ['communication_reporting', 'stop_work_acceptance'],
  stopwork_protect_process: ['practice_participation', 'communication_reporting', 'stop_work_acceptance'],

  instruction_accept_top: ['training_comprehension', 'communication_reporting'],
  instruction_blame_worker: ['training_comprehension', 'communication_reporting'],
  instruction_reconstruct_chain: ['risk_awareness', 'training_comprehension', 'communication_reporting'],

  record_minimize_scope: ['ppe_rule_compliance', 'communication_reporting'],
  record_retrofit_paper: ['ppe_rule_compliance', 'communication_reporting'],
  record_preserve_timeline: ['risk_awareness', 'ppe_rule_compliance', 'communication_reporting'],

  next_day_standard_check: ['risk_awareness'],
  next_day_camera_compare: ['risk_awareness', 'ppe_rule_compliance'],
  next_day_radio_checkin: ['communication_reporting'],
});

export function psiCuesForChoice(choiceId: string | undefined): readonly PsiIndicatorId[] {
  return choiceId ? PSI_CUES_BY_CHOICE[choiceId] ?? Object.freeze([]) : Object.freeze([]);
}

export function psiIndicatorTextId(indicator: PsiIndicatorId): string {
  return `ui.psi.indicator.${indicator}`;
}
