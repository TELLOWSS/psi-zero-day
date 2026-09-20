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
