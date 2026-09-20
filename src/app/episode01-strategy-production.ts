export type Episode01StrategyPhase =
  | 'site-read'
  | 'people-network'
  | 'risk-compare'
  | 'tactical-judgment'
  | 'field-shift'
  | 'consequence-read';

export type Episode01StrategyCameraProfile =
  | 'operational-overview'
  | 'network-pan'
  | 'pressure-wide'
  | 'decision-zone'
  | 'action-route'
  | 'consequence-wide';

export type Episode01StrategyDepthProfile =
  | 'site-layers'
  | 'relationship-grid'
  | 'risk-stack'
  | 'decision-layered'
  | 'route-open'
  | 'changed-field';

export type Episode01StrategyLightingProfile =
  | 'survey-neutral'
  | 'network-cool'
  | 'pressure-amber'
  | 'decision-contrast'
  | 'action-clear'
  | 'consequence-reactive';

export type Episode01StrategyUiProfile =
  | 'scan'
  | 'compare'
  | 'judgment'
  | 'result'
  | 'verify';

export type Episode01StrategyFocus =
  | 'overview'
  | 'people'
  | 'yard'
  | 'ramp'
  | 'entry'
  | 'gate';

export interface Episode01StrategyProduction {
  readonly phase: Episode01StrategyPhase;
  readonly camera_profile: Episode01StrategyCameraProfile;
  readonly depth_profile: Episode01StrategyDepthProfile;
  readonly lighting_profile: Episode01StrategyLightingProfile;
  readonly ui_profile: Episode01StrategyUiProfile;
  readonly focus: Episode01StrategyFocus;
}

const PLAN_VOICES = new Set(['lee', 'kang', 'yoon']);

const PLAN_RESULTS: Readonly<Record<string, Episode01StrategyFocus>> = Object.freeze({
  delegate_kang_result: 'yard',
  negotiate_yoon_result: 'yard',
  coordinate_schedule_result: 'overview',
  follow_junho_result: 'ramp',
});

const RAMP_RESULTS = new Set([
  'check_self_result',
  'ask_minseok_result',
  'keep_schedule_result',
]);

const ENTRY_RESULTS = new Set([
  'assign_crew_result',
  'request_delay_result',
  'force_clear_result',
]);

const PUMP_RESULT_NODES = new Set([
  'relation_conflict',
  'relation_conflict_react',
  'best_control',
  'best_control_react',
  'near_miss',
  'near_miss_react',
  'controlled_delay',
  'controlled_delay_react',
]);

/**
 * Phase C-4 STRATEGY production direction.
 *
 * Presentation-only metadata. Strategy scenes read the site before the UI:
 * site-wide context -> people/process relationship -> risk comparison ->
 * tactical judgment -> visible field shift -> consequence read.
 *
 * This does not alter the Phase B event topology or engine-owned choices.
 */
export function episode01StrategyProduction(
  eventId: string | null | undefined,
  nodeId?: string | null,
): Episode01StrategyProduction | undefined {
  if (!eventId) return undefined;

  if (eventId === 'e01_03_plan_breaks') {
    if (nodeId && PLAN_VOICES.has(nodeId)) {
      return Object.freeze({
        phase: 'people-network',
        camera_profile: 'network-pan',
        depth_profile: 'relationship-grid',
        lighting_profile: 'network-cool',
        ui_profile: 'compare',
        focus: 'people',
      });
    }

    if (nodeId === 'plan') {
      return Object.freeze({
        phase: 'tactical-judgment',
        camera_profile: 'decision-zone',
        depth_profile: 'decision-layered',
        lighting_profile: 'decision-contrast',
        ui_profile: 'judgment',
        focus: 'overview',
      });
    }

    if (nodeId && PLAN_RESULTS[nodeId]) {
      return Object.freeze({
        phase: 'field-shift',
        camera_profile: 'action-route',
        depth_profile: 'route-open',
        lighting_profile: 'action-clear',
        ui_profile: 'result',
        focus: PLAN_RESULTS[nodeId],
      });
    }

    return Object.freeze({
      phase: 'site-read',
      camera_profile: 'operational-overview',
      depth_profile: 'site-layers',
      lighting_profile: 'survey-neutral',
      ui_profile: 'scan',
      focus: 'overview',
    });
  }

  if (eventId === 'e01_05_command') {
    if (nodeId === 'ramp') {
      return Object.freeze({
        phase: 'tactical-judgment',
        camera_profile: 'decision-zone',
        depth_profile: 'decision-layered',
        lighting_profile: 'decision-contrast',
        ui_profile: 'judgment',
        focus: 'ramp',
      });
    }

    if (nodeId && RAMP_RESULTS.has(nodeId)) {
      return Object.freeze({
        phase: 'field-shift',
        camera_profile: 'action-route',
        depth_profile: 'route-open',
        lighting_profile: 'action-clear',
        ui_profile: 'result',
        focus: 'ramp',
      });
    }

    if (nodeId === 'entrance') {
      return Object.freeze({
        phase: 'tactical-judgment',
        camera_profile: 'decision-zone',
        depth_profile: 'decision-layered',
        lighting_profile: 'decision-contrast',
        ui_profile: 'judgment',
        focus: 'entry',
      });
    }

    if (nodeId && ENTRY_RESULTS.has(nodeId)) {
      return Object.freeze({
        phase: 'field-shift',
        camera_profile: 'action-route',
        depth_profile: 'route-open',
        lighting_profile: 'action-clear',
        ui_profile: 'result',
        focus: 'entry',
      });
    }

    return Object.freeze({
      phase: 'risk-compare',
      camera_profile: 'pressure-wide',
      depth_profile: 'risk-stack',
      lighting_profile: 'pressure-amber',
      ui_profile: 'compare',
      focus: 'yard',
    });
  }

  if (eventId === 'e01_06_pump_arrival') {
    return Object.freeze({
      phase: 'consequence-read',
      camera_profile: 'consequence-wide',
      depth_profile: 'changed-field',
      lighting_profile: 'consequence-reactive',
      ui_profile: nodeId && PUMP_RESULT_NODES.has(nodeId) ? 'result' : 'verify',
      focus: 'gate',
    });
  }

  return undefined;
}
