import type {StageHazardObject} from '../domain/patrol-survivors';

/**
 * Authentic stage equipment is drawn from its EXISTING raster sprite, not
 * duplicated as a geometric fake foreground. Floor hazards/telegraphs do
 * not become occluders and all authority stays in the engine.
 */
export type ForegroundFixtureKind='light'|'drum'|'cabinet';
export interface ForegroundFixtureSpec {
  readonly kind:ForegroundFixtureKind;
  readonly anchorY:number;
  readonly size:number;
  readonly imageY:number;
}
export function foregroundFixtureSpec(
  object:Pick<StageHazardObject,'type'|'state'|'y'>,
):ForegroundFixtureSpec | undefined {
  if(object.state==='destroyed')return;
  switch(object.type){
    case 'floodlight_tower':
      return {kind:'light',anchorY:object.y,size:48,imageY:object.y};
    case 'explosive_barrel':
      return {kind:'drum',anchorY:object.y+8,size:64,imageY:object.y+8};
    case 'electric_transformer':
      return {kind:'cabinet',anchorY:object.y+8,size:68,imageY:object.y+8};
    default:
      return undefined;
  }
}

/**
 * In a close pass the fixture remains legible, but becomes translucent so a
 * safety officer cannot disappear behind it. Only solid raster equipment
 * receives this treatment; safety circles and warning text stay fully visible.
 */
export function foregroundFixtureOpacity(
  object:Pick<StageHazardObject,'type'|'state'|'x'|'y'>,
  player:{readonly x:number;readonly y:number},
):number {
  const spec=foregroundFixtureSpec(object);
  if(!spec)return 1;
  const halfWidth=spec.size*.68;
  const dx=Math.abs(object.x-player.x);
  const dy=spec.anchorY-player.y;
  // A fixture can cover the actor's upper body only when its feet sort later.
  if(dx>=halfWidth || dy<0 || dy>spec.size*.94)return 1;
  const lateral=1-dx/halfWidth;
  const depth=1-dy/(spec.size*.94);
  const occlusion=Math.max(0,Math.min(1,lateral*depth));
  return Math.max(.52,1-.48*occlusion);
}

/** Calm equipment motion is locked to the existing warning/isolated state.
 * Never simulates unsafe unprompted barrel rolling or displacement.
 * Production sprite remains the visual source: only a bounded pivot response.
 */
export function foregroundFixtureMotion(
  object:Pick<StageHazardObject,'type'|'state'>,
  gameTime:number,
  reducedMotion:boolean,
):{y:number;angle:number;scaleY:number} {
  const none={y:0,angle:0,scaleY:1};
  if(reducedMotion||!Number.isFinite(gameTime)||object.state!=='warning')return none;
  const phase=gameTime*5.3;
  if(object.type==='floodlight_tower')return {y:0,angle:Math.sin(phase)*.009,scaleY:1};
  if(object.type==='electric_transformer')return {y:0,angle:0,scaleY:1+Math.sin(phase*1.1)*.004};
  if(object.type==='explosive_barrel')return {y:0,angle:Math.sin(phase)*.006,scaleY:1};
  return none;
}
