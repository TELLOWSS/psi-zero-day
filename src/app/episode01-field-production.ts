export type Episode01FieldPhase =
  | 'arrival-observe'
  | 'signal-read'
  | 'signal-judgment'
  | 'signal-consequence'
  | 'active-work'
  | 'human-aftershock'
  | 'next-day-tease';

export type Episode01FieldCameraProfile =
  | 'site-wide'
  | 'worker-intimate'
  | 'decision-context'
  | 'signal-release'
  | 'work-dynamic'
  | 'relationship-medium'
  | 'weather-wide';

export type Episode01FieldDepthProfile =
  | 'open-site'
  | 'signal-layered'
  | 'decision-layered'
  | 'release-layered'
  | 'work-layers'
  | 'human-layered'
  | 'weather-open';

export type Episode01FieldLightingProfile =
  | 'dawn-neutral'
  | 'signal-natural'
  | 'decision-focus'
  | 'signal-release'
  | 'work-contrast'
  | 'aftershock-soft'
  | 'rain-foreshadow';

export type Episode01FieldUiProfile =
  | 'observe'
  | 'dialogue'
  | 'judgment'
  | 'result'
  | 'work'
  | 'human'
  | 'tease';

export type Episode01FieldCastProfile =
  | 'solo-observer'
  | 'junho-lead'
  | 'junho-player-balance'
  | 'signal-release'
  | 'crew-motion'
  | 'human-ensemble'
  | 'solo-return';

export interface Episode01FieldProduction {
  readonly phase: Episode01FieldPhase;
  readonly camera_profile: Episode01FieldCameraProfile;
  readonly depth_profile: Episode01FieldDepthProfile;
  readonly lighting_profile: Episode01FieldLightingProfile;
  readonly ui_profile: Episode01FieldUiProfile;
  readonly cast_profile: Episode01FieldCastProfile;
  readonly hero_character_id?: 'player' | 'lim_junho' | 'kang_taesik' | 'lee_jaehoon';
}

const SIGNAL_RESULT_NODES = new Set([
  'listen_more_result',
  'crosscheck_result',
  'dismiss_result',
]);

const ACTIVE_WORK_EVENTS = new Set([
  'e01_07_first_pour',
  'e01_08i_restart_pressure',
]);

const HUMAN_AFTERSHOCK_EVENTS = new Set([
  'e01_08_reactions',
  'e01_08a_reporting_return',
  'e01_08j_restart_return',
  'e01_08k_stopwork_aftershock',
  'e01_08l_stopwork_return',
]);

/**
 * Phase C-2 FIELD visual direction.
 *
 * Presentation-only metadata. It never changes event topology, choice availability,
 * engine effects or outcomes. FIELD keeps the construction world visible while
 * shifting emphasis between observation, a small worker signal, active work pressure,
 * human aftermath and the next-day risk context.
 */
export function episode01FieldProduction(
  eventId: string | null | undefined,
  nodeId?: string | null,
): Episode01FieldProduction | undefined {
  if (!eventId) return undefined;

  if (eventId === 'e01_01_arrival') {
    return Object.freeze({
      phase: 'arrival-observe',
      camera_profile: 'site-wide',
      depth_profile: 'open-site',
      lighting_profile: 'dawn-neutral',
      ui_profile: 'observe',
      cast_profile: 'solo-observer',
      hero_character_id: 'player',
    });
  }

  if (eventId === 'e01_04_junho_signal') {
    if (nodeId === 'listen') {
      return Object.freeze({
        phase: 'signal-judgment',
        camera_profile: 'decision-context',
        depth_profile: 'decision-layered',
        lighting_profile: 'decision-focus',
        ui_profile: 'judgment',
        cast_profile: 'junho-player-balance',
        hero_character_id: 'lim_junho',
      });
    }

    if (nodeId && SIGNAL_RESULT_NODES.has(nodeId)) {
      return Object.freeze({
        phase: 'signal-consequence',
        camera_profile: 'signal-release',
        depth_profile: 'release-layered',
        lighting_profile: 'signal-release',
        ui_profile: 'result',
        cast_profile: 'signal-release',
        hero_character_id: nodeId === 'crosscheck_result' ? 'player' : 'lim_junho',
      });
    }

    return Object.freeze({
      phase: 'signal-read',
      camera_profile: 'worker-intimate',
      depth_profile: 'signal-layered',
      lighting_profile: 'signal-natural',
      ui_profile: 'dialogue',
      cast_profile: 'junho-lead',
      hero_character_id: 'lim_junho',
    });
  }

  if (ACTIVE_WORK_EVENTS.has(eventId)) {
    return Object.freeze({
      phase: 'active-work',
      camera_profile: 'work-dynamic',
      depth_profile: 'work-layers',
      lighting_profile: 'work-contrast',
      ui_profile: 'work',
      cast_profile: 'crew-motion',
    });
  }

  if (HUMAN_AFTERSHOCK_EVENTS.has(eventId)) {
    return Object.freeze({
      phase: 'human-aftershock',
      camera_profile: 'relationship-medium',
      depth_profile: 'human-layered',
      lighting_profile: 'aftershock-soft',
      ui_profile: 'human',
      cast_profile: 'human-ensemble',
    });
  }

  if (eventId === 'e01_10_next_day_tease') {
    return Object.freeze({
      phase: 'next-day-tease',
      camera_profile: 'weather-wide',
      depth_profile: 'weather-open',
      lighting_profile: 'rain-foreshadow',
      ui_profile: 'tease',
      cast_profile: 'solo-return',
      hero_character_id: 'player',
    });
  }

  return undefined;
}
