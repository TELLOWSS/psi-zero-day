import type { GameState } from '../domain';

export interface EpisodeMemoryCallback {
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly line_text_ids: readonly string[];
}

function branchChoice(state: GameState): string | undefined {
  const instance = [...state.event_runtime.finished_instances].reverse().find(item => item.event_id === 'e01_03_plan_breaks');
  if (!instance) return undefined;
  return state.event_runtime.choice_history.find(item => item.instance_id === instance.instance_id)?.choice_id;
}

function outcomeLine(state: GameState): string | undefined {
  const flags = state.flags;
  switch (flags.record_result) {
    case 'supplement_requested': return 'ui.memory.outcome.report.supplement';
    case 'document_sync_required': return 'ui.memory.outcome.report.sync';
    case 'timeline_preserved': return 'ui.memory.outcome.report.preserved';
  }
  switch (flags.instruction_chain_result) {
    case 'condition_loss_unresolved':
    case 'worker_blame_hides_chain': return 'ui.memory.outcome.instruction.gap';
    case 'conditional_phrase_restored': return 'ui.memory.outcome.instruction.restored';
  }
  switch (flags.stopwork_culture_result) {
    case 'reporting_silenced':
    case 'formal_protection_private_friction': return 'ui.memory.outcome.stopwork.silenced';
    case 'reporting_route_preserved': return 'ui.memory.outcome.stopwork.route';
  }
  switch (flags.restart_result) {
    case 'premature_restart_second_stop': return 'ui.memory.outcome.restart.premature';
    case 'conditional_instruction_distorted': return 'ui.memory.outcome.instruction.gap';
    case 'controlled_restart': return 'ui.memory.outcome.restart.controlled';
  }
  switch (flags.tbm_gap_result) {
    case 'paper_field_gap_remains': return 'ui.memory.outcome.tbm.paper';
    case 'reporting_chilled': return 'ui.memory.outcome.stopwork.silenced';
    case 'changed_work_rebriefed': return 'ui.memory.outcome.tbm.controlled';
  }
  switch (flags.inspection_result) {
    case 'rework_after_reinspection': return 'ui.memory.outcome.inspection.rework';
    case 'accepted':
    case 'accepted_after_sequence': return 'ui.memory.outcome.inspection.accepted';
  }
  switch (flags.reporting_return_state) {
    case 'reinforced': return 'ui.memory.outcome.reporting.reinforced';
    case 'suppressed':
    case 'missed': return 'ui.memory.outcome.reporting.suppressed';
  }
  return undefined;
}

export function episode01MemoryCallback(state: GameState | null, activeEventId: string | null): EpisodeMemoryCallback | undefined {
  if (!state || (activeEventId !== 'e01_09_evening' && activeEventId !== 'e01_10_next_day_tease')) return undefined;
  const branch = branchChoice(state);
  const branchText = branch === 'delegate_kang' ? 'ui.memory.branch.delegate'
    : branch === 'negotiate_yoon' ? 'ui.memory.branch.negotiate'
    : branch === 'coordinate_schedule' ? 'ui.memory.branch.coordinate'
    : branch === 'follow_junho' ? 'ui.memory.branch.follow'
    : undefined;
  const outcomeText = outcomeLine(state);
  const nextDay = activeEventId === 'e01_10_next_day_tease';
  const line_text_ids = [branchText, outcomeText].filter((id): id is string => Boolean(id));
  if (!line_text_ids.length) return undefined;
  return {
    eyebrow_text_id: nextDay ? 'ui.memory.eyebrow.next_day' : 'ui.memory.eyebrow.evening',
    title_text_id: nextDay ? 'ui.memory.title.next_day' : 'ui.memory.title.evening',
    line_text_ids,
  };
}
