import type {OmegaActorView} from './omega-protocol-actor-render';
import {omegaG5cReview,type OmegaG5cLocalPainterlyReview} from './omega-protocol-m12g5c-local-art-review';
import {omegaG5eCue,omegaG5eFx,type OmegaG5eNativeAction,
 type OmegaG5eNativeActionFx} from './omega-protocol-m12g5e-silver-action-fx';

/**
 * M12-G5g. Actual in-game player body-POSE changes sourced from four
 * SHA-256-VERIFIED original painterly E WALK source WebPs already checked into
 * GitHub under G5d, NOT independent FIRE/DASH/HIT paintings.
 *
 * Example: the old G5f 12 PNG/WebP derivatives mostly preserved one
 * standing body and changed just the effect. In this G5g DEVELOPMENT-ONLY
 * study distinct four native source silhouettes enter the real action render
 * when a matching actual Watch fire/dash/hit event is active.
 */
export const OMEGA_G5G_ART_APPROVAL={
 origin:'FOUR_ORIGINAL_E_WALK_WEBPS_REUSED_FOR_COMBAT_POSE_STUDY',
 candidateActionCount:3,candidatePoseIndicesPerAction:4,
 actionIndependentPaintedSources:0,
 approved160PaintedFrames:0,approved320Masks:0,
 artistSignedOff:false,commercialReleaseAllowed:false,
 canReplaceDefaultHero:false,
} as const;
export const OMEGA_G5G_NATIVE_POSE_MAP={
 fire:[0,1,2,3],
 dash:[0,1,2,3],
 hit:[0,3,2,1],
} as const satisfies Record<OmegaG5eNativeAction,readonly number[]>;
export type OmegaG5gAction=keyof typeof OMEGA_G5G_NATIVE_POSE_MAP;
export function omegaG5gLabRequested(search:string,enabled:boolean):boolean {
 if(!enabled)return false;
 const p=new URLSearchParams(search);
 return p.get('omegaLab')==='1'&&p.get('omegaM12G5g')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5',
    'omegaM12G5b','omegaM12G5c','omegaM12G5d','omegaM12G5e',
    'omegaG5VectorStudy'].some(k=>p.has(k));
}
export function omegaG5gPoseIndex(action:OmegaG5gAction,frame:number):0|1|2|3|null{
 if(!Number.isInteger(frame)||frame<0||frame>=4)return null;
 const arr=OMEGA_G5G_NATIVE_POSE_MAP[action];
 if(!arr)return null;
 return arr[frame] as 0|1|2|3;
}
interface VerifiedReview{
 readonly active:boolean;
 verifiedFrame(index:number):Readonly<{image:HTMLImageElement;toeRow:number}>|null;
}
interface SourceFx{
 draw(ctx:CanvasRenderingContext2D,image:CanvasImageSource,
  view:OmegaActorView,height:number):boolean;
}
export class OmegaG5gNativeActionPoseStudy {
 private count:Record<OmegaG5gAction,number>={fire:0,dash:0,hit:0};
 private seen:Record<OmegaG5gAction,Set<number>>={
  fire:new Set(),dash:new Set(),hit:new Set(),
 };
 constructor(
  private readonly source:VerifiedReview=omegaG5cReview as Pick<OmegaG5cLocalPainterlyReview,'active'|'verifiedFrame'>,
  private readonly painter:SourceFx=omegaG5eFx as Pick<OmegaG5eNativeActionFx,'draw'>,
 ){}
 evidence():Readonly<{counts:Readonly<Record<OmegaG5gAction,number>>;
  sourceFrames:Readonly<Record<OmegaG5gAction,readonly number[]>>}>{
  return {counts:{...this.count},sourceFrames:{
   fire:[...this.seen.fire].sort(),dash:[...this.seen.dash].sort(),
   hit:[...this.seen.hit].sort(),
  }};
 }
 reset():void{
  this.count={fire:0,dash:0,hit:0};
  for(const s of Object.values(this.seen))s.clear();
 }
 draw(ctx:CanvasRenderingContext2D,view:OmegaActorView,height:number):boolean {
  if(!this.source.active)return false;
  const cue=omegaG5eCue(view,height);
  if(!cue)return false;
  const frame=omegaG5gPoseIndex(cue.action,cue.frame);
  if(frame===null)return false;
  const original=this.source.verifiedFrame(frame);
  if(!original)return false;
  // G5d's painted boots end at 485-487 of 512: preserve their TRUE ground
  // coordinate without changing Watch hitboxes/collisions/player position.
  ctx.save();
  ctx.translate(0,height*(512-original.toeRow)/512);
  let done=false;
  try{done=this.painter.draw(ctx,original.image,view,height);}
  finally{ctx.restore();}
  if(!done)return false;
  this.count[cue.action]++;
  this.seen[cue.action].add(frame);
  return true;
 }
}
export const omegaG5gNativePoseStudy=new OmegaG5gNativeActionPoseStudy();
