export type Episode01TbmPhase =
  | 'first-briefing'
  | 'changed-condition'
  | 'role-voice'
  | 'group-judgment'
  | 'field-rebrief'
  | 'consequence-return'
  | 'instruction-share';

export type Episode01TbmCameraProfile =
  | 'briefing-circle'
  | 'condition-wide'
  | 'speaker-arc'
  | 'decision-circle'
  | 'rebrief-wide'
  | 'consequence-medium'
  | 'instruction-arc';

export type Episode01TbmDepthProfile =
  | 'circle-open'
  | 'changed-work-layers'
  | 'speaker-ring'
  | 'decision-ring'
  | 'rebrief-open'
  | 'consequence-ring'
  | 'instruction-layers';

export type Episode01TbmLightingProfile =
  | 'morning-neutral'
  | 'changed-condition-neutral'
  | 'speaker-focus'
  | 'decision-amber'
  | 'rebrief-clear'
  | 'consequence-soft'
  | 'instruction-neutral';

export type Episode01TbmUiProfile =
  | 'briefing'
  | 'context'
  | 'dialogue'
  | 'judgment'
  | 'result'
  | 'verify';

export type Episode01TbmCastProfile =
  | 'mentor-pair'
  | 'four-person-circle'
  | 'active-speaker'
  | 'decision-circle'
  | 'rebrief-crew'
  | 'aftermath-circle'
  | 'instruction-crew';

export interface Episode01TbmProduction {
  readonly phase: Episode01TbmPhase;
  readonly camera_profile: Episode01TbmCameraProfile;
  readonly depth_profile: Episode01TbmDepthProfile;
  readonly lighting_profile: Episode01TbmLightingProfile;
  readonly ui_profile: Episode01TbmUiProfile;
  readonly cast_profile: Episode01TbmCastProfile;
  readonly hero_character_id?: 'player' | 'lee_jaehoon' | 'kang_taesik' | 'lim_junho';
}

const TBM_SPEAKER_BY_NODE: Readonly<Record<string, 'lee_jaehoon' | 'kang_taesik' | 'lim_junho'>> = Object.freeze({
  lee: 'lee_jaehoon',
  kang: 'kang_taesik',
  junho: 'lim_junho',
});

const TBM_GAP_RESULTS = new Set([
  'form_first_result',
  'worker_blame_result',
  'change_control_result',
]);

const TBM_RETURN_RESULTS = new Set([
  'paper',
  'silenced',
  'controlled',
]);

/**
 * Phase C-3 TBM production direction.
 *
 * Presentation-only metadata. TBM is treated as a live group briefing, not a
 * dialogue carousel: changed conditions remain visible, each role takes the
 * foreground when speaking, the decision returns the whole crew to one frame,
 * and the outcome shows whether the new control survives into field behavior.
 */
export function episode01TbmProduction(
  eventId: string | null | undefined,
  nodeId?: string | null,
): Episode01TbmProduction | undefined {
  if (!eventId) return undefined;

  if (eventId === 'e01_02_meet_kang') {
    return Object.freeze({
      phase: 'first-briefing',
      camera_profile: 'briefing-circle',
      depth_profile: 'circle-open',
      lighting_profile: 'morning-neutral',
      ui_profile: 'briefing',
      cast_profile: 'mentor-pair',
      hero_character_id: nodeId === 'player' ? 'player' : 'kang_taesik',
    });
  }

  if (eventId === 'e01_08g_tbm_field_gap') {
    const hero = nodeId ? TBM_SPEAKER_BY_NODE[nodeId] : undefined;
    if (hero) {
      return Object.freeze({
        phase: 'role-voice',
        camera_profile: 'speaker-arc',
        depth_profile: 'speaker-ring',
        lighting_profile: 'speaker-focus',
        ui_profile: 'dialogue',
        cast_profile: 'active-speaker',
        hero_character_id: hero,
      });
    }

    if (nodeId === 'tbm_action') {
      return Object.freeze({
        phase: 'group-judgment',
        camera_profile: 'decision-circle',
        depth_profile: 'decision-ring',
        lighting_profile: 'decision-amber',
        ui_profile: 'judgment',
        cast_profile: 'decision-circle',
        hero_character_id: 'player',
      });
    }

    if (nodeId && TBM_GAP_RESULTS.has(nodeId)) {
      if (nodeId === 'change_control_result') {
        return Object.freeze({
          phase: 'field-rebrief',
          camera_profile: 'rebrief-wide',
          depth_profile: 'rebrief-open',
          lighting_profile: 'rebrief-clear',
          ui_profile: 'result',
          cast_profile: 'rebrief-crew',
          hero_character_id: 'player',
        });
      }
      return Object.freeze({
        phase: 'consequence-return',
        camera_profile: 'consequence-medium',
        depth_profile: 'consequence-ring',
        lighting_profile: 'consequence-soft',
        ui_profile: 'result',
        cast_profile: 'aftermath-circle',
        hero_character_id: nodeId === 'worker_blame_result' ? 'lim_junho' : 'lee_jaehoon',
      });
    }

    return Object.freeze({
      phase: 'changed-condition',
      camera_profile: 'condition-wide',
      depth_profile: 'changed-work-layers',
      lighting_profile: 'changed-condition-neutral',
      ui_profile: 'context',
      cast_profile: 'four-person-circle',
    });
  }

  if (eventId === 'e01_08h_tbm_return') {
    if (nodeId === 'resolve') {
      return Object.freeze({
        phase: 'group-judgment',
        camera_profile: 'decision-circle',
        depth_profile: 'decision-ring',
        lighting_profile: 'decision-amber',
        ui_profile: 'verify',
        cast_profile: 'decision-circle',
        hero_character_id: 'player',
      });
    }

    if (nodeId && TBM_RETURN_RESULTS.has(nodeId)) {
      const controlled = nodeId === 'controlled';
      return Object.freeze({
        phase: controlled ? 'field-rebrief' : 'consequence-return',
        camera_profile: controlled ? 'rebrief-wide' : 'consequence-medium',
        depth_profile: controlled ? 'rebrief-open' : 'consequence-ring',
        lighting_profile: controlled ? 'rebrief-clear' : 'consequence-soft',
        ui_profile: 'result',
        cast_profile: controlled ? 'rebrief-crew' : 'aftermath-circle',
        hero_character_id: controlled ? 'lim_junho' : undefined,
      });
    }
  }

  if (eventId === 'e01_08m_instruction_cascade') {
    return Object.freeze({
      phase: 'instruction-share',
      camera_profile: 'instruction-arc',
      depth_profile: 'instruction-layers',
      lighting_profile: 'instruction-neutral',
      ui_profile: nodeId === 'instruction_action' ? 'judgment' : 'dialogue',
      cast_profile: 'instruction-crew',
    });
  }

  return undefined;
}
