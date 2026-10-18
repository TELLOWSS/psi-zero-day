import { PATROL_STAGE_IDS, type PatrolStageId } from '../domain/patrol-survivors';

export interface StageActorLight {
  readonly color: string;
  readonly fill: number;
  readonly shadowX: number;
  readonly shadowY: number;
  readonly opacity: number;
  readonly beam: number;
}

// One grounding contract, with fills matched to the existing workface art.
// Presentation only: none of these values change collision, detection or damage.
const PALETTES = {
  foundation: { color: '#ffe4b8', fill: .065, shadowX: .42, shadowY: .28, opacity: .19, beam: .36 },
  excavation: { color: '#c5d8df', fill: .055, shadowX: .28, shadowY: .22, opacity: .18, beam: .82 },
  daylight: { color: '#e0edff', fill: .045, shadowX: .38, shadowY: .24, opacity: .20, beam: .30 },
  winter: { color: '#c9e6ff', fill: .055, shadowX: .26, shadowY: .19, opacity: .16, beam: .56 },
  interior: { color: '#f5dfc6', fill: .055, shadowX: .25, shadowY: .20, opacity: .17, beam: .66 },
  industrial: { color: '#c3e7e9', fill: .055, shadowX: .22, shadowY: .18, opacity: .17, beam: .58 },
} satisfies Record<string, StageActorLight>;
type Palette = keyof typeof PALETTES;
const WORKFACE_PALETTES: readonly Palette[] = [
  'foundation', 'excavation', 'daylight', 'winter', 'industrial',
  'interior', 'daylight', 'interior', 'industrial', 'industrial',
  'daylight', 'daylight', 'daylight', 'daylight', 'daylight',
  'daylight', 'daylight', 'interior', 'industrial', 'daylight',
  'excavation', 'excavation', 'excavation', 'excavation', 'excavation',
  'interior', 'daylight', 'daylight', 'interior', 'excavation',
  'daylight', 'daylight', 'daylight', 'daylight', 'daylight',
  'daylight', 'daylight', 'interior', 'daylight', 'daylight',
  'industrial', 'industrial', 'industrial', 'industrial', 'industrial',
  'industrial', 'industrial', 'interior', 'daylight', 'industrial',
];
export const STAGE_LIGHTS: Readonly<Record<PatrolStageId, Readonly<StageActorLight>>> = Object.freeze(
  Object.fromEntries(PATROL_STAGE_IDS.map((id, index) => [id, Object.freeze(PALETTES[WORKFACE_PALETTES[index]!])])) as Record<PatrolStageId, StageActorLight>,
);
export function stageActorLight(stageId: string): Readonly<StageActorLight> | undefined {
  return Object.hasOwn(STAGE_LIGHTS, stageId) ? STAGE_LIGHTS[stageId as PatrolStageId] : undefined;
}
