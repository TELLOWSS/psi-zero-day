import {describe,it,expect} from 'vitest';
import {omegaFieldPlan,omegaFieldNativeTerrain} from '../src/domain/omega-protocol-field';
import {omegaQuarterViewCamera} from '../src/ui/omega-protocol-camera';
import {
 omegaG3Budget,omegaG3ParallaxShift,OMEGA_G3_DEPTH_RATIO,
 drawOmegaG3ParallaxArchitecture,drawOmegaG3NativeMesh,
} from '../src/ui/omega-protocol-m12-parallax';

const scene=omegaFieldPlan(20261108,1);
function fakeCanvas(){
 const calls:string[]=[];
 const hit=(s:string)=>()=>calls.push(s);
 const gradient={addColorStop:(_n:number,_s:string)=>calls.push('colorStop')};
 return {ctx:{
  save:hit('save'),restore:hit('restore'),setTransform:hit('setTransform'),
  beginPath:hit('beginPath'),closePath:hit('closePath'),rect:hit('rect'),
  clip:hit('clip'),translate:hit('translate'),moveTo:hit('moveTo'),lineTo:hit('lineTo'),
  stroke:hit('stroke'),fill:hit('fill'),fillRect:hit('fillRect'),
  createLinearGradient:()=>{calls.push('gradient');return gradient;},
 } as unknown as CanvasRenderingContext2D,calls};
}
describe('M12-G3 real camera parallax atmospheric structure',()=>{
 it('bounds GPU-free detail on mobile/tablet/PC and rejects invalid viewport',()=>{
  expect(omegaG3Budget(390,844)).toEqual({tier:'mobile',distantBeams:5,meshPitch:26,luminous:false});
  expect(omegaG3Budget(844,390).tier).toBe('mobile');
  expect(omegaG3Budget(1024,768).tier).toBe('medium');
  expect(omegaG3Budget(1440,900)).toEqual({tier:'high',distantBeams:14,meshPitch:12,luminous:true});
  expect(()=>omegaG3Budget(Infinity,390)).toThrow(RangeError);
  expect(()=>omegaG3Budget(0,390)).toThrow(RangeError);
 });
 it('three layers have distinct camera-derived displacement and do not scroll at entry',()=>{
  const camera=omegaQuarterViewCamera(scene.entry,1440,900,1.55);
  const moved=omegaQuarterViewCamera({x:1000,y:650},1440,900,1.55);
  for(const layer of ['far','mid','near'] as const)
   expect(omegaG3ParallaxShift(camera,camera,layer)).toEqual({dx:0,dy:0});
  const distances=(['far','mid','near'] as const).map(layer=>{
   const p=omegaG3ParallaxShift(moved,camera,layer);
   return Math.hypot(p.dx,p.dy);
  });
  expect(distances[0]).toBeGreaterThan(0);
  expect(distances[0]).toBeLessThan(distances[1]!);
  expect(distances[1]).toBeLessThan(distances[2]!);
  expect(OMEGA_G3_DEPTH_RATIO.far).toBeLessThan(OMEGA_G3_DEPTH_RATIO.near);
  expect(()=>omegaG3ParallaxShift({...camera,scale:NaN},camera,'far')).toThrow(RangeError);
 });
 it('original screen-background and native mesh render without mutating domain solids',()=>{
  const before=JSON.stringify(scene);
  const physical=JSON.stringify(omegaFieldNativeTerrain(scene));
  const {ctx,calls}=fakeCanvas(),camera=omegaQuarterViewCamera(scene.entry,1440,900);
  drawOmegaG3ParallaxArchitecture(ctx,scene,camera,1440,900,1.55,omegaG3Budget(1440,900));
  expect(calls.filter(x=>x==='setTransform')).toHaveLength(1);
  expect(calls.filter(x=>x==='clip').length).toBeGreaterThanOrEqual(3);
  const first=calls.length;
  drawOmegaG3NativeMesh(ctx,scene,scene.obstacles.find(x=>x.id==='scaffold')!,omegaG3Budget(1440,900));
  drawOmegaG3NativeMesh(ctx,scene,scene.obstacles.find(x=>x.id==='machine')!,omegaG3Budget(1440,900));
  expect(calls.length).toBeGreaterThan(first+30);
  expect(JSON.stringify(scene)).toBe(before);
  expect(JSON.stringify(omegaFieldNativeTerrain(scene))).toBe(physical);
 });
 it('never paints unsupported solids, fake scenery on future acts, or negative zoom',()=>{
  const other=omegaFieldPlan(20261108,4),{ctx,calls}=fakeCanvas();
  const camera=omegaQuarterViewCamera(other.entry,390,844);
  drawOmegaG3ParallaxArchitecture(ctx,other,camera,390,844,1.55,omegaG3Budget(390,844));
  drawOmegaG3NativeMesh(ctx,other,other.obstacles[0]!,omegaG3Budget(390,844));
  drawOmegaG3ParallaxArchitecture(ctx,scene,camera,390,844,-1,omegaG3Budget(390,844));
  drawOmegaG3NativeMesh(ctx,scene,{...scene.obstacles[1]!},omegaG3Budget(390,844));
  expect(calls).toEqual([]);
 });
});
