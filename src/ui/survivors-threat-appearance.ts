import type {Hazard,PatrolStageDefinition} from '../domain/patrol-survivors';

export const STAGE_THREAT_ART='/assets/survivors/stage-threat-silhouettes-v1.webp';
export const THREAT_ART_GRID={columns:3,rows:3} as const;
export const THREAT_SILHOUETTES=[
  {id:'timber_trolley',material:'timber',cell:0},
  {id:'rebar_carrier',material:'reinforced_steel',cell:1},
  {id:'pallet_runner',material:'industrial_vehicle',cell:2},
  {id:'pressure_vapor',material:'vapor',cell:3},
  {id:'split_vapor',material:'vapor',cell:4},
  {id:'wind_vapor',material:'vapor',cell:5},
  {id:'rebar_fall',material:'rebar',cell:6},
  {id:'slab_fall',material:'concrete',cell:7},
  {id:'steel_fall',material:'structural_steel',cell:8},
] as const;

/** Appearance only: never changes health, collision, timing, targeting or saved IDs. */
export function stageThreatAppearance(h:Pick<Hazard,'type'|'variant'|'behavior'|'isStageBoss'|'signatureEventId'>,stageNumber:number,theme:PatrolStageDefinition['theme']) {
  if(h.isStageBoss||h.signatureEventId)return null;
  let cell:number;
  if(h.type==='RUNAWAY_CART')cell=h.variant==='reinforced_cart'?1:h.behavior==='flanking_cart'||theme==='datacenter'?2:0;
  else if(h.type==='GAS_LEAK')cell=h.behavior==='crosswind'?5:h.variant==='split_gas'?4:3;
  else if(h.type==='FALLING_DEBRIS')cell=h.behavior==='wide_debris'||theme==='curing_chamber'?7:theme==='highrise_slab'?6:stageNumber%2?8:7;
  else return null;
  return THREAT_SILHOUETTES[cell]!;
}

/** Motion describes the silhouette's existing behavior; reduced motion preserves identity. */
export function threatSilhouettePose(h:Pick<Hazard,'type'|'variant'|'behavior'|'motion'>,clock:number,reduced:boolean) {
  if(reduced)return {x:0,y:0,rotation:0,scaleX:1,scaleY:1};
  if(h.behavior==='crosswind')return {x:Math.sin(clock*1.6)*2,y:0,rotation:Math.sin(clock*1.6)*.06,scaleX:1.08,scaleY:.94};
  if(h.variant==='split_gas')return {x:0,y:Math.sin(clock*2)*1.5,rotation:0,scaleX:1+Math.sin(clock*2)*.045,scaleY:1};
  if(h.variant==='pulse_gas'){
    const t=h.motion?.phase==='warning'?Math.max(0,Math.min(1,1-(h.motion.timer??0)/1.25)):0;
    return {x:0,y:-t*2,rotation:0,scaleX:1+t*.06,scaleY:1+t*.08};
  }
  return {x:0,y:0,rotation:0,scaleX:1,scaleY:1};
}
