import type { Episode01ScenePreset } from './episode01-story-director';

export type Episode01ProductionScene =
  | 'STRATEGY'
  | 'FIELD'
  | 'TBM'
  | 'STOP_WORK'
  | 'OFFICE'
  | 'DAY_RESULT';

export function episode01ProductionScene(
  preset: Episode01ScenePreset | null | undefined,
): Episode01ProductionScene | undefined {
  switch (preset) {
    case 'STRATEGY_MAP': return 'STRATEGY';
    case 'FIELD_DIALOGUE':
    case 'NEXT_DAY_TEASER':
      return 'FIELD';
    case 'TBM': return 'TBM';
    case 'STOP_WORK': return 'STOP_WORK';
    case 'OFFICE_DIALOGUE': return 'OFFICE';
    case 'DAY_RESULT': return 'DAY_RESULT';
    default: return undefined;
  }
}
