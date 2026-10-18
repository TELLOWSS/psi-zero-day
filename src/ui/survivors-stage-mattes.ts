import {PATROL_STAGE_IDS,type PatrolStageId} from '../domain/patrol-survivors';
import {stageGroundUri} from './survivors-equipment-art';

/**
 * The stage ground is a single authored opaque image. A foreground layer may
 * only be added after its alpha cut-out is hand reviewed against THAT image.
 *
 * Stage 01 uses a reviewed alpha-coverage cut-out; other stages remain empty.
 * Coverage colors are restored from the exact original source before drawing.
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
  readonly sourceCoverage?:boolean;
  readonly sourceCrop?:{readonly x:number;readonly y:number;readonly width:number;readonly height:number};
}
export const FOREGROUND_MATTE_ASSETS:Partial<Record<PatrolStageId,readonly ApprovedForegroundMatte[]>>={
  stage_01:[{
    id:'stage-01-bottom-rail',stageId:'stage_01',
    sourceGround:'/assets/survivors/stage-01-ground-v3.webp',
    imageUri:'/assets/survivors/foreground/stage-01-bottom-coverage-v1.png',
    x:0,y:836.4811133200795,width:1400,height:63.51888667992048,feetY:900,
    sourceCoverage:true,sourceCrop:{x:0,y:935,width:1564,height:71},
    approval:'source-alignment-reviewed-20261019',
  }],
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
    (!matte.sourceCrop || [matte.sourceCrop.x,matte.sourceCrop.y,matte.sourceCrop.width,matte.sourceCrop.height].every(Number.isFinite) && matte.sourceCrop.x>=0 && matte.sourceCrop.y>=0 && matte.sourceCrop.width>0 && matte.sourceCrop.height>0 && matte.sourceCoverage===true) &&
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
  // Only when a depth-sorted matte can cross the player, reduce its opacity.
  let opacity=matte.feetY>=player.y&&contains(player.x,player.y,12) ? 0.55 : 1;
  for(const signal of warningSignals){
    if(signal.warning&&contains(signal.x,signal.y,Math.max(8,signal.radius))){
      opacity=Math.min(opacity,.25);break;
    }
  }
  return opacity;
}
