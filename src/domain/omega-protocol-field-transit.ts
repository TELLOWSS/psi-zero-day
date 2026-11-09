import type {OmegaFieldPlan} from './omega-protocol-field';

/**
 * M04 quarantine-compound gate transfer — a physical exit is the ONLY way
 * to start it. The doors slide across the current rendered 2.5D field;
 * destination coordinates and actual terrain/hazards change at peak closure.
 * Browser camera/player spawn is protected from a visible one-frame jump.
 * This is a staged portal seam, NOT a finished contiguous 15-zone world.
 */
export type OmegaFieldTransitPhase='depart'|'arrive';
export type OmegaFieldTransitKind='cargo_door'|'scaffold_lift'|'crane_elevator'|'service_tunnel'|'control_airlock';
export interface OmegaFieldTransitLink{
 readonly fromWave:number;
 readonly toWave:number;
 readonly fromSector:number;
 readonly toSector:number;
 readonly fromName:string;
 readonly toName:string;
 readonly kind:OmegaFieldTransitKind;
 readonly passageLabel:string;
}
export interface OmegaFieldTransit{
 readonly phase:OmegaFieldTransitPhase;
 readonly link:OmegaFieldTransitLink;
 readonly elapsed:number;
 readonly duration:number;
 readonly opacity:number;
}
const DURATIONS={depart:.75,arrive:.7} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function omegaGateTransitLink(from:OmegaFieldPlan,to:OmegaFieldPlan):OmegaFieldTransitLink{
 if(!Number.isInteger(from.wave)||from.wave<1||from.wave>14||
  to.wave!==from.wave+1||to.sector<from.sector||to.sector>from.sector+1)
  throw new RangeError('OMEGA field exit must connect exactly the next explorable node');
 const change=to.sector>from.sector;
 const kind:OmegaFieldTransitKind=change
  ?(['scaffold_lift','crane_elevator','service_tunnel','control_airlock'] as const)[from.sector-1]??'cargo_door'
  :'cargo_door';
 return {fromWave:from.wave,toWave:to.wave,fromSector:from.sector,toSector:to.sector,
  fromName:from.sectorName,toName:to.sectorName,kind,
  passageLabel:{
   cargo_door:'격리 화물 게이트',scaffold_lift:'비계 구역 수직 리프트',
   crane_elevator:'크레인 관리 승강기',service_tunnel:'지하 설비 연결터널',
   control_airlock:'중앙 통제 에어록',
  }[kind],
 };
}
export function omegaGateTransitStart(link:OmegaFieldTransitLink):OmegaFieldTransit{
 return {phase:'depart',link,elapsed:0,duration:DURATIONS.depart,opacity:0};
}
export function omegaGateTransitArrive(link:OmegaFieldTransitLink):OmegaFieldTransit{
 return {phase:'arrive',link,elapsed:0,duration:DURATIONS.arrive,opacity:1};
}
/** Playback is bounded and pure; advances in *game* time, no setTimeout. */
export function omegaGateTransitStep(
 state:OmegaFieldTransit,dt:number,
):Readonly<{next:OmegaFieldTransit;complete:boolean}>{
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid transition delta');
 const elapsed=Math.min(state.duration,state.elapsed+Math.min(.1,dt));
 const fraction=clamp(elapsed/state.duration);
 // Ease to opaque before the world/coordinates swap, then reopen at arrival.
 const eased=fraction*fraction*(3-2*fraction);
 const opacity=state.phase==='depart'?eased:1-eased;
 return {next:{...state,elapsed,opacity},complete:elapsed>=state.duration};
}
export function omegaGateTransitIsLocked(state:OmegaFieldTransit|null):boolean{
 return state!==null;
}
