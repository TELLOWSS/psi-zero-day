export type Episode01StopWorkPhase = 'hazard-read' | 'zero-moment' | 'restart-gate';
export type Episode01StopWorkCameraProfile = 'hazard-wide' | 'decision-compressed' | 'verification-medium';
export type Episode01StopWorkDepthProfile = 'deep-field' | 'compressed-pressure' | 'open-verification';
export type Episode01StopWorkLightingProfile = 'hazard-cool' | 'stop-red' | 'restart-neutral';
export type Episode01StopWorkUiProfile = 'observe' | 'judgment' | 'verify';
export type Episode01StopWorkCastProfile = 'inspector-lead' | 'player-hero' | 'verification-lead';

export interface Episode01StopWorkMarker {
  readonly key: 'edge' | 'route' | 'restart';
  readonly label_text_id: string;
}

export interface Episode01StopWorkProduction {
  readonly phase: Episode01StopWorkPhase;
  readonly kicker_text_id: string;
  readonly title_text_id: string;
  readonly detail_text_id: string;
  readonly markers: readonly Episode01StopWorkMarker[];
  readonly hero_character_id: 'player' | 'seo_jeongmin';
  readonly camera_profile: Episode01StopWorkCameraProfile;
  readonly depth_profile: Episode01StopWorkDepthProfile;
  readonly lighting_profile: Episode01StopWorkLightingProfile;
  readonly ui_profile: Episode01StopWorkUiProfile;
  readonly cast_profile: Episode01StopWorkCastProfile;
}

const HAZARD_MARKERS = Object.freeze([
  Object.freeze({ key: 'edge', label_text_id: 'ui.stopwork.marker.edge' }),
  Object.freeze({ key: 'route', label_text_id: 'ui.stopwork.marker.route' }),
] as const);

const RESTART_MARKERS = Object.freeze([
  Object.freeze({ key: 'edge', label_text_id: 'ui.stopwork.marker.edge' }),
  Object.freeze({ key: 'restart', label_text_id: 'ui.stopwork.marker.restart' }),
] as const);

/**
 * Phase C-1 STOP WORK visual direction.
 *
 * This is presentation-only metadata: no safety outcome, score or engine rule is
 * derived from it. The three moments deliberately read differently:
 * hazard discovery -> zero moment -> restart gate.
 */
export function episode01StopWorkProduction(
  eventId: string | null | undefined,
): Episode01StopWorkProduction | undefined {
  switch (eventId) {
    case 'e01_08b_inspection_find':
      return Object.freeze({
        phase: 'hazard-read',
        kicker_text_id: 'ui.stopwork.kicker.hazard',
        title_text_id: 'ui.stopwork.title.hazard',
        detail_text_id: 'ui.stopwork.detail.hazard',
        markers: HAZARD_MARKERS,
        hero_character_id: 'seo_jeongmin',
        camera_profile: 'hazard-wide',
        depth_profile: 'deep-field',
        lighting_profile: 'hazard-cool',
        ui_profile: 'observe',
        cast_profile: 'inspector-lead',
      });
    case 'e01_08c_site_pushback':
      return Object.freeze({
        phase: 'zero-moment',
        kicker_text_id: 'ui.stopwork.kicker.zero',
        title_text_id: 'ui.stopwork.title.zero',
        detail_text_id: 'ui.stopwork.detail.zero',
        markers: HAZARD_MARKERS,
        hero_character_id: 'player',
        camera_profile: 'decision-compressed',
        depth_profile: 'compressed-pressure',
        lighting_profile: 'stop-red',
        ui_profile: 'judgment',
        cast_profile: 'player-hero',
      });
    case 'e01_08d_reinspection':
      return Object.freeze({
        phase: 'restart-gate',
        kicker_text_id: 'ui.stopwork.kicker.restart',
        title_text_id: 'ui.stopwork.title.restart',
        detail_text_id: 'ui.stopwork.detail.restart',
        markers: RESTART_MARKERS,
        hero_character_id: 'seo_jeongmin',
        camera_profile: 'verification-medium',
        depth_profile: 'open-verification',
        lighting_profile: 'restart-neutral',
        ui_profile: 'verify',
        cast_profile: 'verification-lead',
      });
    default:
      return undefined;
  }
}
