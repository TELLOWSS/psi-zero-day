import type { GameState, PresentationCommand, ValidatedContent } from '../../src/domain';
import { createEpisode01Registry, episode01Manifest } from '../../src/content/episode01';
import { CoreEngine, createRun, eventCandidates, eventPresentation } from '../../src/engine';
import type { EngineCommand, NewRunOptions, ProgressBounds } from '../../src/engine';

export const episodeContent = createEpisode01Registry().getValidatedContent();
export const eventOrder = episode01Manifest.event_flow.map(id => id.toLowerCase());
// Harness inputs only; these are not new balance defaults or automatic stage thresholds.
export const episodeBounds: ProgressBounds = { FOUNDATION: { min: 0, max: 100 } };
export function episodeOptions(seed = 42): NewRunOptions {
  return {
    run_id: 'ep01.test.run', seed, playthrough: 1, rules_version: 'ep01.test.rules',
    chapter_id: 'foundation', clock: { day: 1, slot: 'PRE_WORK' },
    player: { character_id: 'player', archetype_id: 'test.unassigned', health: 0, fatigue: 0, stress: 0,
      money: 0, family: {}, company_evaluation: 0, reputation: 0, integrity: 0,
      career: { values: {}, flags: {} }, dark_path: { values: {}, flags: {} }, legal_status: {}, safety_record: {} },
    construction: { stage_id: 'FOUNDATION', progress_by_stage: { FOUNDATION: 10 }, milestones: [] },
    audio: { bgm: null, ambience: [], sfx_bus: [], event_bus: [],
      volumes: { master: 1, bgm: 1, ambience: 1, sfx: 1, event: 1 }, muted: false, suspended: false },
  };
}

export interface EpisodeDecisions {
  plan: 'delegate_kang' | 'negotiate_yoon' | 'coordinate_schedule' | 'follow_junho';
  signal?: 'listen_more' | 'dismiss';
  ramp: 'check_self' | 'ask_minseok' | 'keep_schedule';
  entrance: 'assign_crew' | 'request_delay' | 'force_clear';
  inspection?: 'inspection_full_stop' | 'inspection_quick_photo' | 'inspection_sequence_agreement';
  responsibility?: 'report_one_sided' | 'report_defensive' | 'report_verify_timeline';
  tbm?: 'tbm_form_first' | 'tbm_worker_blame' | 'tbm_change_control';
  restart?: 'restart_follow_verbal' | 'restart_trace_instruction' | 'restart_verify_controls';
  evening: 'rest' | 'family' | 'study' | 'field_note';
}
export interface TraceEntry {
  command: EngineCommand;
  presentation: readonly PresentationCommand[];
}

/** Test driver only: no outcome calculations, direct state writes, or replacement event engine. */
export function playEpisode(decisions: EpisodeDecisions, options: {
  seed?: number; resumeEveryCommand?: boolean; content?: ValidatedContent;
} = {}) {
  const content = options.content ?? episodeContent;
  const initial = createRun(content, episodeOptions(options.seed), episodeBounds);
  let engine = new CoreEngine(initial, content, episodeBounds);
  const trace: TraceEntry[] = [];
  const checkpoints: Record<string, GameState> = {};
  const send = (command: EngineCommand) => {
    const result = engine.dispatch(command);
    trace.push({ command, presentation: result.presentation ?? [] });
    if (options.resumeEveryCommand) {
      engine = new CoreEngine(JSON.parse(JSON.stringify(result.state)) as GameState, content, episodeBounds);
      if (JSON.stringify(eventPresentation(engine.getState(), content)) !== JSON.stringify(eventPresentation(result.state, content))) {
        throw new Error('Resume presentation differs');
      }
    }
  };
  const decisionsByNode: Record<string, string | undefined> = {
    'e01_03_plan_breaks/plan': decisions.plan,
    'e01_04_junho_signal/listen': decisions.signal,
    'e01_05_command/ramp': decisions.ramp,
    'e01_05_command/entrance': decisions.entrance,
    'e01_08b_inspection_find/action': decisions.inspection ?? 'inspection_sequence_agreement',
    'e01_08e_responsibility_clash/report': decisions.responsibility ?? 'report_verify_timeline',
    'e01_08g_tbm_field_gap/tbm_action': decisions.tbm ?? 'tbm_change_control',
    'e01_08i_restart_pressure/restart_action': decisions.restart ?? 'restart_verify_controls',
    'e01_09_evening/evening': decisions.evening,
  };
  // Explicit test clock inputs. Content eligibility remains completion/flag based as specified.
  const clockBefore: Record<string, GameState['clock']> = {
    e01_03_plan_breaks: { day: 1, slot: 'MORNING' },
    e01_07_first_pour: { day: 1, slot: 'AFTERNOON' },
    e01_09_evening: { day: 1, slot: 'EVENING' },
    e01_10_next_day_tease: { day: 2, slot: 'PRE_WORK' },
  };
  for (let step = 0; step < 360; step++) {
    const state = engine.getState();
    if (state.flags.episode01_completed === true) return { initial, state, trace, checkpoints };
    const active = state.event_runtime.active_instance;
    if (!active) {
      const candidates = eventCandidates(state, content, 'foundation');
      if (candidates.length !== 1) throw new Error(`Expected one next event, got ${candidates.length}`);
      const candidate = candidates[0]!;
      const time = clockBefore[candidate.event_id];
      if (time && (time.day !== state.clock.day || time.slot !== state.clock.slot)) {
        send({ type: 'advance_slot' }); continue;
      }
      checkpoints[candidate.event_id] = engine.getState();
      send({ type: 'start_event', event_id: candidate.event_id, instance_id: `run.${candidate.event_id}`, chapter_id: 'foundation' });
      continue;
    }
    const view = eventPresentation(state, content);
    const choice = view.find(command => command.type === 'SHOW_CHOICE');
    if (choice?.type === 'SHOW_CHOICE') {
      const key = `${active.event_id}/${active.current_node_id}`;
      const enabled = choice.choices.filter(item => item.enabled);
      const requested = decisionsByNode[key];
      if (Object.hasOwn(decisionsByNode, key) && requested === undefined) throw new Error(`Missing player decision: ${key}`);
      const selected = requested ?? (enabled.length === 1 ? enabled[0]!.choice_id : undefined);
      if (!selected || !enabled.some(item => item.choice_id === selected)) throw new Error(`Unresolved choice: ${key}`);
      send({ type: 'choose_event', instance_id: active.instance_id, node_id: active.current_node_id, choice_id: selected });
    } else send({ type: 'advance_event', instance_id: active.instance_id, node_id: active.current_node_id });
  }
  throw new Error('Episode did not finish within the command bound');
}
