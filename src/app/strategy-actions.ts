import type { FlagMap, Id, PresentationCommand, TextId } from '../domain';
import type { FieldResourceAxisId } from './product-contract';

export type StrategyActionIntent = 'inspect' | 'coordinate' | 'control' | 'report' | 'protect' | 'record';
export type StrategyActionTarget =
  | { readonly kind: 'character'; readonly character_id: Id }
  | { readonly kind: 'signal'; readonly signal_id: Id }
  | { readonly kind: 'anchor'; readonly anchor: 'overview' | 'yard' | 'entry' | 'core' | 'ramp' | 'gate' }
  | { readonly kind: 'site' };

export interface StrategyAction {
  readonly event_id: Id;
  readonly instance_id: Id;
  readonly node_id: Id;
  /** UI identity. Support-assisted shortcuts may differ from the engine choice they execute. */
  readonly choice_id: Id;
  /** Existing content choice reused by a support shortcut. Omitted for ordinary actions. */
  readonly execution_choice_id?: Id;
  readonly label_text_id: TextId;
  readonly enabled: boolean;
  readonly intent: StrategyActionIntent;
  readonly target: StrategyActionTarget;
  readonly actor_character_id: Id;
  /** Related field resources only. Direction/magnitude remains balance-pending. */
  readonly resource_axes: readonly FieldResourceAxisId[];
  readonly skill?: {
    readonly source: 'equipment' | 'growth';
    readonly label_text_id: TextId;
  };
}

interface ActionMetadata {
  readonly intent: StrategyActionIntent;
  readonly target: StrategyActionTarget;
  readonly actor_character_id?: Id;
  readonly resource_axes?: readonly FieldResourceAxisId[];
  readonly skill?: StrategyAction['skill'];
}

interface SupportShortcut {
  readonly action_id: Id;
  readonly required_flag_id: Id;
  readonly event_id: Id;
  readonly node_id: Id;
  readonly execution_choice_id: Id;
  readonly label_text_id: TextId;
  readonly metadata: ActionMetadata;
}

const RESOURCE_AXES_BY_INTENT: Readonly<Record<StrategyActionIntent, readonly FieldResourceAxisId[]>> = {
  inspect: ['time', 'safety'],
  coordinate: ['time', 'schedule'],
  control: ['schedule', 'safety'],
  report: ['time', 'safety'],
  protect: ['schedule', 'safety'],
  record: ['time', 'safety'],
};

const ACTION_METADATA: Readonly<Record<Id, ActionMetadata>> = {
  delegate_kang: { intent: 'coordinate', target: { kind: 'character', character_id: 'kang_taesik' }, actor_character_id: 'kang_taesik' },
  negotiate_yoon: { intent: 'coordinate', target: { kind: 'character', character_id: 'yoon_sungho' }, actor_character_id: 'yoon_sungho' },
  coordinate_schedule: { intent: 'coordinate', target: { kind: 'character', character_id: 'lee_jaehoon' }, actor_character_id: 'lee_jaehoon', resource_axes: ['time', 'schedule', 'safety'] },
  follow_junho: { intent: 'inspect', target: { kind: 'character', character_id: 'lim_junho' } },
  listen_more: { intent: 'inspect', target: { kind: 'character', character_id: 'lim_junho' } },
  dismiss: { intent: 'control', target: { kind: 'character', character_id: 'lim_junho' } },
  check_self: { intent: 'inspect', target: { kind: 'anchor', anchor: 'ramp' } },
  ask_minseok: { intent: 'coordinate', target: { kind: 'character', character_id: 'choi_minseok' }, actor_character_id: 'choi_minseok' },
  keep_schedule: { intent: 'control', target: { kind: 'character', character_id: 'lee_jaehoon' }, resource_axes: ['time', 'schedule', 'safety'] },
  assign_crew: { intent: 'coordinate', target: { kind: 'character', character_id: 'kang_taesik' }, actor_character_id: 'kang_taesik' },
  request_delay: { intent: 'coordinate', target: { kind: 'character', character_id: 'lee_jaehoon' }, resource_axes: ['time', 'schedule', 'safety'] },
  force_clear: { intent: 'control', target: { kind: 'signal', signal_id: 'signal.work_vehicle_overlap' }, resource_axes: ['time', 'schedule', 'safety'] },
  inspection_full_stop: { intent: 'control', target: { kind: 'signal', signal_id: 'signal.inspection_access' }, resource_axes: ['time', 'schedule', 'safety'] },
  inspection_quick_photo: { intent: 'record', target: { kind: 'signal', signal_id: 'signal.inspection_access' } },
  inspection_sequence_agreement: { intent: 'coordinate', target: { kind: 'character', character_id: 'seo_jeongmin' }, resource_axes: ['time', 'schedule', 'safety'] },
  report_one_sided: { intent: 'report', target: { kind: 'character', character_id: 'oh_seungjae' } },
  report_defensive: { intent: 'report', target: { kind: 'character', character_id: 'kang_taesik' } },
  report_verify_timeline: { intent: 'inspect', target: { kind: 'site' } },
  tbm_form_first: { intent: 'record', target: { kind: 'signal', signal_id: 'signal.tbm_field_gap' } },
  tbm_worker_blame: { intent: 'report', target: { kind: 'character', character_id: 'kang_taesik' } },
  tbm_change_control: { intent: 'control', target: { kind: 'signal', signal_id: 'signal.tbm_field_gap' }, resource_axes: ['time', 'schedule', 'safety'] },
  restart_follow_verbal: { intent: 'coordinate', target: { kind: 'character', character_id: 'lee_jaehoon' }, resource_axes: ['time', 'schedule', 'safety'] },
  restart_trace_instruction: { intent: 'inspect', target: { kind: 'character', character_id: 'kang_taesik' } },
  restart_verify_controls: { intent: 'control', target: { kind: 'signal', signal_id: 'signal.restart_unverified' }, resource_axes: ['time', 'schedule', 'safety'] },
  stopwork_ignore_social: { intent: 'control', target: { kind: 'character', character_id: 'lim_junho' }, resource_axes: ['time', 'schedule', 'safety'] },
  stopwork_public_boundary: { intent: 'protect', target: { kind: 'character', character_id: 'kang_taesik' }, resource_axes: ['time', 'schedule', 'safety'] },
  stopwork_protect_process: { intent: 'protect', target: { kind: 'character', character_id: 'lim_junho' }, resource_axes: ['time', 'schedule', 'safety'] },
  instruction_accept_top: { intent: 'report', target: { kind: 'character', character_id: 'lee_jaehoon' } },
  instruction_blame_worker: { intent: 'report', target: { kind: 'character', character_id: 'lim_junho' } },
  instruction_reconstruct_chain: { intent: 'inspect', target: { kind: 'character', character_id: 'kang_taesik' } },
  record_minimize_scope: { intent: 'record', target: { kind: 'character', character_id: 'oh_seungjae' } },
  record_retrofit_paper: { intent: 'record', target: { kind: 'character', character_id: 'lee_jaehoon' } },
  record_preserve_timeline: { intent: 'record', target: { kind: 'site' } },
  next_day_standard_check: { intent: 'inspect', target: { kind: 'site' } },
  next_day_camera_compare: {
    intent: 'record', target: { kind: 'site' },
    skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
  },
  next_day_radio_checkin: {
    intent: 'report', target: { kind: 'character', character_id: 'lim_junho' },
    skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
  },
};

/**
 * Paid support never creates a better safety outcome than the existing free choice.
 * It only surfaces a convenience path that executes an already-approved content choice.
 */
const SUPPORT_SHORTCUTS: readonly SupportShortcut[] = [
  {
    action_id: 'support.inspection_kit.verify_ramp',
    required_flag_id: 'support.equipment.inspection_kit.active',
    event_id: 'e01_05_command',
    node_id: 'ramp',
    execution_choice_id: 'check_self',
    label_text_id: 'ui.paid_item.action.inspection_kit_check',
    metadata: {
      intent: 'inspect',
      target: { kind: 'anchor', anchor: 'ramp' },
      resource_axes: ['time', 'safety'],
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    },
  },
  {
    action_id: 'support.access_lane.control_entrance',
    required_flag_id: 'support.facility.access_lane.active',
    event_id: 'e01_05_command',
    node_id: 'entrance',
    execution_choice_id: 'assign_crew',
    label_text_id: 'ui.paid_item.action.access_lane_control',
    metadata: {
      intent: 'control',
      target: { kind: 'anchor', anchor: 'entry' },
      resource_axes: ['time', 'schedule', 'safety'],
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    },
  },
  {
    action_id: 'support.traffic_control.control_entrance',
    required_flag_id: 'support.equipment.traffic_control_pack.active',
    event_id: 'e01_05_command',
    node_id: 'entrance',
    execution_choice_id: 'assign_crew',
    label_text_id: 'ui.paid_item.action.traffic_control',
    metadata: {
      intent: 'control',
      target: { kind: 'signal', signal_id: 'signal.work_vehicle_overlap' },
      resource_axes: ['time', 'schedule', 'safety'],
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    },
  },
  {
    action_id: 'support.radio.verify_instruction_chain',
    required_flag_id: 'support.equipment.radio_pack.active',
    event_id: 'e01_08m_instruction_cascade',
    node_id: 'instruction_action',
    execution_choice_id: 'instruction_reconstruct_chain',
    label_text_id: 'ui.paid_item.action.radio_chain_check',
    metadata: {
      intent: 'inspect',
      target: { kind: 'site' },
      resource_axes: ['time', 'safety'],
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    },
  },
] as const;

const FIELD_ACTION_EVENTS = new Set<Id>([
  'e01_03_plan_breaks', 'e01_04_junho_signal', 'e01_05_command',
  'e01_08b_inspection_find', 'e01_08e_responsibility_clash', 'e01_08g_tbm_field_gap',
  'e01_08i_restart_pressure', 'e01_08k_stopwork_aftershock', 'e01_08m_instruction_cascade',
  'e01_08o_record_pressure', 'e01_10_next_day_tease',
]);

export function isStrategyFieldActionEvent(eventId: Id | null): boolean {
  return eventId !== null && FIELD_ACTION_EVENTS.has(eventId);
}

export function strategyActionTargetKey(target: StrategyActionTarget): string {
  switch (target.kind) {
    case 'character': return target.character_id;
    case 'signal': return target.signal_id;
    case 'anchor': return `anchor:${target.anchor}`;
    case 'site': return 'site';
  }
}

export function strategyActionExecutionChoiceId(action: StrategyAction): Id {
  return action.execution_choice_id ?? action.choice_id;
}

export function strategyActionsForTarget(actions: readonly StrategyAction[], targetKey: string | null): readonly StrategyAction[] {
  if (!targetKey) return [];
  return Object.freeze(actions.filter(action => strategyActionTargetKey(action.target) === targetKey));
}

function projectedAction(activeEventId: Id, presentation: Extract<PresentationCommand, { type: 'SHOW_CHOICE' }>,
  choice: Extract<PresentationCommand, { type: 'SHOW_CHOICE' }>['choices'][number]): StrategyAction {
  const metadata = ACTION_METADATA[choice.choice_id] ?? { intent: 'control' as const, target: { kind: 'site' as const } };
  return Object.freeze({
    event_id: activeEventId,
    instance_id: presentation.instance_id,
    node_id: presentation.node_id,
    choice_id: choice.choice_id,
    label_text_id: choice.text_id,
    enabled: choice.enabled,
    intent: metadata.intent,
    target: metadata.target,
    actor_character_id: metadata.actor_character_id ?? 'player',
    resource_axes: Object.freeze([...(metadata.resource_axes ?? RESOURCE_AXES_BY_INTENT[metadata.intent])]),
    ...(metadata.skill ? { skill: metadata.skill } : {}),
  });
}

function supportActions(activeEventId: Id, presentation: Extract<PresentationCommand, { type: 'SHOW_CHOICE' }>, flags: FlagMap): readonly StrategyAction[] {
  return Object.freeze(SUPPORT_SHORTCUTS.flatMap(shortcut => {
    if (shortcut.event_id !== activeEventId || shortcut.node_id !== presentation.node_id || flags[shortcut.required_flag_id] !== true) return [];
    const engineChoice = presentation.choices.find(choice => choice.choice_id === shortcut.execution_choice_id);
    if (!engineChoice) return [];
    const metadata = shortcut.metadata;
    return [Object.freeze({
      event_id: activeEventId,
      instance_id: presentation.instance_id,
      node_id: presentation.node_id,
      choice_id: shortcut.action_id,
      execution_choice_id: shortcut.execution_choice_id,
      label_text_id: shortcut.label_text_id,
      enabled: engineChoice.enabled,
      intent: metadata.intent,
      target: metadata.target,
      actor_character_id: metadata.actor_character_id ?? 'player',
      resource_axes: Object.freeze([...(metadata.resource_axes ?? RESOURCE_AXES_BY_INTENT[metadata.intent])]),
      ...(metadata.skill ? { skill: metadata.skill } : {}),
    })];
  }));
}

/** Read-only UI projection. Executing an action still uses an approved choose_event choice. */
export function projectStrategyActions(activeEventId: Id | null, presentation: PresentationCommand | undefined,
  flags: FlagMap = Object.freeze({})): readonly StrategyAction[] {
  if (!isStrategyFieldActionEvent(activeEventId) || presentation?.type !== 'SHOW_CHOICE') return [];
  const base = presentation.choices.map(choice => projectedAction(activeEventId!, presentation, choice));
  return Object.freeze([...base, ...supportActions(activeEventId!, presentation, flags)]);
}
