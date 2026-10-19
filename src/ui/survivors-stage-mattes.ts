import {PATROL_STAGE_IDS,type PatrolStageId} from '../domain/patrol-survivors';
import {stageGroundUri} from './survivors-equipment-art';
import reviewedMattes from '../../content/design/survivors-stage-foreground-v1.json';

/**
 * The stage ground is a single authored opaque image. A foreground layer may
 * only be added after its alpha cut-out is hand reviewed against THAT image.
 *
 * STAGE 02's source-matched alpha cutout was explicitly approved on 2026-10-19.
 * Later per-stage extractions are reviewed against their own native source and
 * registered under the user's explicit request to apply the remaining work.
 * The renderer never invents masks from flat colour, alpha thresholds, or
 * hard-coded silhouettes of an unknown site.
 */
export interface ApprovedForegroundMatte {
  readonly id:string;
  readonly stageId:PatrolStageId;
  readonly sourceGround:string;
  readonly imageUri:string;
  readonly x:number;
  readonly y:number;
  readonly width:number;
  readonly height:number;
  readonly feetY:number;
  readonly approval:string;
}
export const FOREGROUND_MATTE_ASSETS:Partial<Record<PatrolStageId,readonly ApprovedForegroundMatte[]>>={
  stage_02:[{...reviewedMattes.stage02,stageId:'stage_02'}],
  ...Object.fromEntries(Object.entries(reviewedMattes.stages).map(([stageId,layer])=>
    [stageId,[{...layer,stageId:stageId as PatrolStageId}]])),
};
export const WORKFACE_WIDTH=1400;
export const WORKFACE_HEIGHT=900;
const isAssetPath=(uri:string)=>/^\/assets\/survivors\/foreground\/[-a-z0-9/]+\.(webp|png)$/.test(uri);

export function approvedForegroundMattes(stageId:PatrolStageId):readonly ApprovedForegroundMatte[]{
  if(!PATROL_STAGE_IDS.includes(stageId))return [];
  return (FOREGROUND_MATTE_ASSETS[stageId]??[]).filter(matte=>
    matte.stageId===stageId &&
    matte.approval.length>=6 &&
    matte.sourceGround===stageGroundUri(stageId) &&
    isAssetPath(matte.imageUri) &&
    Number.isFinite(matte.x)&&Number.isFinite(matte.y)&&
    Number.isFinite(matte.width)&&Number.isFinite(matte.height)&&Number.isFinite(matte.feetY)&&
    matte.width>0&&matte.height>0&&
    matte.x>=0&&matte.y>=0&&matte.x+matte.width<=WORKFACE_WIDTH&&matte.y+matte.height<=WORKFACE_HEIGHT&&
    matte.feetY>=matte.y&&matte.feetY<=matte.y+matte.height
  );
}

export interface SafetySignal {readonly x:number;readonly y:number;readonly radius:number;readonly warning:boolean}
/**
 * Foreground masking must never hide the safety officer or a nearby warning.
 * The art is purely presentational; gameplay collision/alerts are independent.
 */
export function matteVisibleAlpha(
  matte:Pick<ApprovedForegroundMatte,'x'|'y'|'width'|'height'|'feetY'>,
  player:{readonly x:number;readonly y:number},
  warningSignals:readonly SafetySignal[],
):number {
  const contains=(x:number,y:number,padding=0)=>
    x>=matte.x-padding&&x<=matte.x+matte.width+padding&&
    y>=matte.y-padding&&y<=matte.y+matte.height+padding;
  // Feet alone miss the shoulder/helmet at a lateral edge. Use the existing
  // 74-world-unit body, with a soft spatial approach instead of an opacity pop.
  const body={left:player.x-22,right:player.x+22,top:player.y-74,bottom:player.y+4};
  const dx=Math.max(matte.x-body.right,body.left-(matte.x+matte.width),0);
  const dy=Math.max(matte.y-body.bottom,body.top-(matte.y+matte.height),0);
  const t=Math.max(0,1-Math.hypot(dx,dy)/16),ease=t*t*(3-2*t);
  let opacity=matte.feetY>=player.y ? 1-.45*ease : 1;
  for(const signal of warningSignals){
    if(signal.warning&&contains(signal.x,signal.y,Math.max(8,signal.radius))){
      opacity=Math.min(opacity,.25);break;
    }
  }
  return opacity;
}
