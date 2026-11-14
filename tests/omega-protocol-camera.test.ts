import {describe,it,expect,vi} from 'vitest';
import {
 OMEGA_QUARTER_VIEW,omegaProjectFieldPoint,omegaQuarterViewCamera,applyOmegaQuarterView,omegaCameraTargetZoom,omegaScreenToWorld
} from '../src/ui/omega-protocol-camera';
import {OMEGA_FIELD_WIDTH as W,OMEGA_FIELD_HEIGHT as H,omegaFieldScreenMoveToWorld} from '../src/domain/omega-protocol-field';
describe('OMEGA field quarter view camera has no effect on combat physics',()=>{
 it('projects each world coordinate to a foreshortened view without changing the source point',()=>{
  const actor={x:450,y:300};
  const before={...actor};
  const projected=omegaProjectFieldPoint(actor);
  expect(actor).toEqual(before);
  expect(projected).toEqual({
   x:actor.x+OMEGA_QUARTER_VIEW.skewX*actor.y,
   y:OMEGA_QUARTER_VIEW.groundYScale*actor.y,
  });
  expect(projected).not.toEqual(actor);
 });
 it.each([[1440,900],[390,844],[844,390],[320,240]])(
  'keeps projected camera and scale finite at %i×%i', (width,height)=>{
   const c=omegaQuarterViewCamera({x:700,y:450},width,height);
   expect(c.scale).toBeGreaterThan(0);
   for(const n of Object.values(c))expect(Number.isFinite(n)).toBe(true);
   expect(c.playerScreenX).toBeGreaterThan(0);
   expect(c.playerScreenX).toBeLessThan(width);
   expect(c.playerScreenY).toBeGreaterThan(0);
   expect(c.playerScreenY).toBeLessThan(height);
  }
 );
 it('moves the camera toward the actual actor instead of dragging terrain with it',()=>{
  const left=omegaQuarterViewCamera({x:80,y:450},390,844);
  const right=omegaQuarterViewCamera({x:W-80,y:450},390,844);
  expect(left.projectedOffsetX).toBeGreaterThan(right.projectedOffsetX);
  const near=omegaQuarterViewCamera({x:700,y:70},844,390);
  const far=omegaQuarterViewCamera({x:700,y:H-70},844,390);
  expect(near.projectedOffsetY).toBeGreaterThanOrEqual(far.projectedOffsetY);
 });
 it('applies a world projection with exact matrix order to a Canvas context',()=>{
  const ctx={scale:vi.fn(),translate:vi.fn(),transform:vi.fn()} as unknown as CanvasRenderingContext2D;
  const c=omegaQuarterViewCamera({x:300,y:350},844,390);
  applyOmegaQuarterView(ctx,c);
  expect(ctx.scale).toHaveBeenCalledWith(c.scale,c.scale);
  expect(ctx.translate).toHaveBeenCalledWith(c.projectedOffsetX,c.projectedOffsetY);
  expect(ctx.transform).toHaveBeenCalledWith(1,0,-.22,.78,0,0);
 });
 it('separates combat presence, boss visibility and objective wayfinding with no physics mutation',()=>{
  const actor={x:700,y:450},saved={...actor};
  const [combat,boss,explore]=(['battle','boss','traversal'] as const)
   .map(mode=>omegaCameraTargetZoom(mode,844,390)) as [number,number,number];
  expect(combat).toBeGreaterThan(boss);
  expect(boss).toBeGreaterThan(explore);
  const wide=omegaQuarterViewCamera(actor,844,390,combat);
  const roomy=omegaQuarterViewCamera(actor,844,390,explore);
  expect(wide.scale).toBeGreaterThan(roomy.scale);
  expect(actor).toEqual(saved);
  expect(omegaCameraTargetZoom('battle',844,390)).toBeGreaterThan(
   omegaCameraTargetZoom('battle',390,844));
  expect(()=>omegaCameraTargetZoom('battle',0,390)).toThrow(RangeError);
  expect(()=>omegaQuarterViewCamera(actor,844,390,0)).toThrow(RangeError);
  expect(()=>omegaQuarterViewCamera(actor,844,390,Infinity)).toThrow(RangeError);
 });
 it('converts WASD and touch movement to intuitive screen-space directions',()=>{
  const up=omegaFieldScreenMoveToWorld(0,-1);
  const right=omegaFieldScreenMoveToWorld(1,0);
  const none=omegaFieldScreenMoveToWorld(0,0);
  const screenUp=omegaProjectFieldPoint(up);
  const screenRight=omegaProjectFieldPoint(right);
  expect(Math.abs(screenUp.x)).toBeLessThan(1e-10);
  expect(screenUp.y).toBeLessThan(0);
  expect(screenRight.x).toBeGreaterThan(0);
  expect(Math.abs(screenRight.y)).toBeLessThan(1e-10);
  expect(none).toEqual({x:0,y:0});
  expect(()=>omegaFieldScreenMoveToWorld(Infinity,0)).toThrow(RangeError);
 });
 it('rejects invalid dimensions and illegal hero positions',()=>{
  expect(()=>omegaQuarterViewCamera({x:0,y:NaN},844,390)).toThrow(RangeError);
  expect(()=>omegaQuarterViewCamera({x:0,y:0},844,0)).toThrow(RangeError);
 });
});

it('inverts the camera projection for mouse aim across screen sizes and zooms',()=>{
 for(const [width,height,zoom] of [[1440,900,1.4],[844,390,1.8],[390,844,1.55]]){
  const camera=omegaQuarterViewCamera({x:630,y:400},width!,height!,zoom!);
  const world={x:850,y:600};const projected=omegaProjectFieldPoint(world);
  const screen={x:(projected.x+camera.projectedOffsetX)*camera.scale,y:(projected.y+camera.projectedOffsetY)*camera.scale};
  const actual=omegaScreenToWorld(screen,camera);
  expect(actual.x).toBeCloseTo(world.x,8);expect(actual.y).toBeCloseTo(world.y,8);
 }
});
