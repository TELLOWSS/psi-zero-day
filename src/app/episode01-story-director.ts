import director from '../../content/episode01/story-director-v1.json';

export const EPISODE01_SCENE_PRESETS = [
  'STRATEGY_MAP',
  'FIELD_DIALOGUE',
  'TBM',
  'STOP_WORK',
  'OFFICE_DIALOGUE',
  'DAY_RESULT',
  'NEXT_DAY_TEASER',
] as const;

export type Episode01ScenePreset = (typeof EPISODE01_SCENE_PRESETS)[number];
export type Episode01HudDensity = 'operational' | 'minimal' | 'guided' | 'critical' | 'summary';
export type Episode01InteractionMode = 'explore' | 'dialogue' | 'communicate' | 'decision' | 'evidence' | 'reflect' | 'continue';
export type Episode01Pacing = 'slow' | 'medium' | 'fast';

export interface Episode01StoryDirection {
  readonly event_id: string;
  readonly act_id: string;
  readonly beat: string;
  readonly preset: Episode01ScenePreset;
  readonly pacing: Episode01Pacing;
  readonly dramatic_function: string;
  readonly hud_density: Episode01HudDensity;
  readonly interaction_mode: Episode01InteractionMode;
  readonly camera_rule: string;
}

type DirectorEvent = {
  readonly act_id: string;
  readonly beat: string;
  readonly preset: Episode01ScenePreset;
  readonly pacing: Episode01Pacing;
  readonly dramatic_function: string;
};

type DirectorPreset = {
  readonly hud_density: Episode01HudDensity;
  readonly interaction_mode: Episode01InteractionMode;
  readonly camera_rule: string;
};

const eventDirections = director.runtime_event_directions as Readonly<Record<string, DirectorEvent>>;
const presets = director.presets as Readonly<Record<Episode01ScenePreset, DirectorPreset>>;

export function episode01StoryDirection(eventId: string | null | undefined): Episode01StoryDirection | undefined {
  if (!eventId) return undefined;
  const direction = eventDirections[eventId];
  if (!direction) return undefined;
  const preset = presets[direction.preset];
  if (!preset) return undefined;

  return Object.freeze({
    event_id: eventId,
    ...direction,
    ...preset,
  });
}

export function episode01StoryPreset(eventId: string | null | undefined): Episode01ScenePreset | undefined {
  return episode01StoryDirection(eventId)?.preset;
}


/**
 * Curated presentation pacing only. These nodes carry exposition or deterministic
 * consequence text; choices are never auto-advanced. The Continue control remains
 * available so the player can move faster than the director timer.
 */
const AUTO_ADVANCE_NODES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  e01_02_meet_kang: ['kang'],
  e01_03_plan_breaks: ['situation', 'lee', 'kang', 'yoon'],
  e01_04_junho_signal: ['signal', 'detail'],
  e01_05_command: ['situation'],
  e01_06_pump_arrival: [
    'relation_conflict', 'relation_conflict_react',
    'best_control', 'best_control_react',
    'near_miss', 'near_miss_react',
    'controlled_delay', 'controlled_delay_react',
  ],
  e01_07_first_pour: ['pour', 'kang', 'pressure', 'lee', 'after'],
  e01_08_reactions: ['kang.high', 'kang.low', 'yoon.high', 'yoon.low', 'junho.high', 'junho.low'],
  e01_08a_reporting_return: ['reinforced', 'suppressed', 'missed'],
  e01_08b_inspection_find: ['inspection', 'lee'],
  e01_08c_site_pushback: ['full_stop', 'quick_photo', 'sequence'],
  e01_08d_reinspection: ['full', 'reject', 'lee_rework', 'sequence'],
  e01_08e_responsibility_clash: ['gc', 'lee', 'kang'],
  e01_08f_report_return: ['correction', 'evidence', 'timeline'],
  e01_08g_tbm_field_gap: ['situation', 'lee', 'kang', 'junho'],
  e01_08h_tbm_return: ['paper', 'silenced', 'controlled'],
  e01_08i_restart_pressure: ['situation', 'kang', 'lee', 'junho'],
  e01_08j_restart_return: ['premature', 'distorted', 'controlled'],
  e01_08k_stopwork_aftershock: ['situation', 'kang', 'junho', 'lee'],
  e01_08l_stopwork_return: ['silenced', 'cold', 'route'],
  e01_08m_instruction_cascade: ['situation', 'lee', 'kang', 'junho'],
  e01_08n_instruction_return: ['gap', 'chilled', 'reconstructed'],
  e01_08o_record_pressure: ['situation', 'oh', 'lee', 'kang'],
  e01_08p_record_return: ['correction', 'conflict', 'preserved'],
  e01_09_evening: ['rest', 'family', 'study', 'field_note'],
});

export function episode01AutoAdvanceDelay(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  textLength: number,
): number | undefined {
  if (!eventId || !nodeId || !AUTO_ADVANCE_NODES[eventId]?.includes(nodeId)) return undefined;
  const pacing = episode01StoryDirection(eventId)?.pacing ?? 'medium';
  const base = pacing === 'fast' ? 1500 : pacing === 'slow' ? 2200 : 1850;
  const perCharacter = pacing === 'fast' ? 58 : pacing === 'slow' ? 78 : 68;
  return Math.max(4200, Math.min(9000, base + Math.max(0, textLength) * perCharacter));
}


const AUTO_RESOLVE_CHOICE_EVENTS = new Set([
  'e01_08a_reporting_return',
  'e01_08f_report_return',
  'e01_08h_tbm_return',
  'e01_08j_restart_return',
  'e01_08l_stopwork_return',
  'e01_08n_instruction_return',
  'e01_08p_record_return',
]);

/**
 * These are consequence-routing nodes, not new player decisions.
 * In directed campaign mode the runtime may select the sole enabled branch automatically.
 */
export function episode01AutoResolveChoice(eventId: string | null | undefined): boolean {
  return Boolean(eventId && AUTO_RESOLVE_CHOICE_EVENTS.has(eventId));
}
