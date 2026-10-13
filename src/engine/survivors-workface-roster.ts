import type { Hazard, HazardType, WorkfaceSpecies } from '../domain/patrol-survivors';

/** Atlas order is a production contract; identities retain existing counterplay. */
export const WORKFACE_SPECIES = ['forklift','excavator','rebar_rack','pump_trolley','masonry','formwork_panel','scaffold_tubes','ductwork','gas_cylinders','curing_heater','chemical_drum','coolant_manifold'] as const;
// Each stage owns its carrier, falling material and pressure source, in that order.
const ROSTER: readonly (readonly [number,number,number])[] = [
  [0,4,8],[1,4,8],[2,5,8],[3,5,9],[0,7,11],
  [0,7,8],[1,4,8],[0,4,10],[0,7,11],[3,7,11],
  [0,5,8],[2,6,8],[3,5,9],[2,5,8],[0,6,8],
  [0,7,8],[3,5,10],[0,7,10],[0,7,11],[0,7,11],
  [1,5,8],[3,7,8],[1,4,8],[1,5,8],[1,4,8],
  [0,7,8],[1,4,8],[2,6,8],[3,7,11],[1,5,8],
  [0,5,8],[0,5,8],[2,6,8],[3,5,9],[0,6,8],
  [0,7,8],[3,5,10],[0,7,10],[2,6,8],[3,5,8],
  [0,7,8],[3,7,8],[0,7,11],[2,6,8],[3,7,8],
  [0,7,11],[3,7,8],[0,7,10],[0,7,11],[2,6,8],
];
export function workfaceSpecies(stageNumber: number, type: HazardType): WorkfaceSpecies | undefined {
  const row=ROSTER[Math.max(0,Math.min(49,Math.floor(stageNumber)-1))] ?? ROSTER[0]!;
  const column=type==='RUNAWAY_CART'?0:type==='FALLING_DEBRIS'?1:type==='GAS_LEAK'?2:undefined;
  return column===undefined?undefined:WORKFACE_SPECIES[row[column]];
}
export function workfaceSpeedScale(species: WorkfaceSpecies | undefined): number {
  return species==='excavator'?.72:species==='rebar_rack'?.86:species==='pump_trolley'?.92:species==='curing_heater'?.78:species==='chemical_drum'?.85:species==='coolant_manifold'?.9:1;
}
/** Smooth acceleration and settling, preserving the locked charge direction and warning. */
export function workfaceChargeScale(h: Pick<Hazard,'species'|'motion'>): number {
  if(!h.species||h.motion?.phase!=='charge')return 1;
  const progress=Math.max(0,Math.min(1,(1.05-h.motion.timer)/1.05));
  const acceleration=Math.min(1,progress/.16);
  const brake=Math.min(1,(1-progress)/.2);
  return .35+.65*Math.min(acceleration*acceleration*(3-2*acceleration),brake*brake*(3-2*brake));
}
