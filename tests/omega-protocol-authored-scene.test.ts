import {describe,it,expect,vi,afterAll} from 'vitest';
import {omegaFieldPlan} from '../src/domain/omega-protocol-field';
import {
 omegaAuthoredAssetPaths,OMEGA_SECTOR01_ART_ROOT,OMEGA_SECTOR01_PROP_TYPES,
 omegaPrepareAuthoredScene,omegaDrawAuthoredFloor,omegaDrawAuthoredProp,
} from '../src/ui/omega-protocol-authored-scene';

describe('OMEGA sector 01 real terrain-aligned art bridge',()=>{
 afterAll(()=>vi.unstubAllGlobals());
 it('only uses local allowlisted authored assets for the four native Watch solids',()=>{
  const sources=omegaAuthoredAssetPaths();
  expect(sources).toHaveLength(5);
  expect(new Set(sources).size).toBe(5);
  expect(sources).toEqual([
   OMEGA_SECTOR01_ART_ROOT+'night-yard-floor.svg',
   ...OMEGA_SECTOR01_PROP_TYPES.map(k=>OMEGA_SECTOR01_ART_ROOT+k+'.svg'),
  ]);
  expect(sources.every(x=>x.startsWith('/assets/omega/sector01/')&&!x.includes('..'))).toBe(true);
 });
 it('renders real decoded artwork on physical coordinates, not a baked gameplay screenshot',()=>{
  const urls:string[]=[];
  class ImageFixture{
   complete=true;
   naturalWidth=256;
   naturalHeight=180;
   decoding='async';
   set src(x:string){urls.push(x);}
   get src(){return urls.at(-1)??'';}
  }
  vi.stubGlobal('Image',ImageFixture);
  const ctx={drawImage:vi.fn()} as unknown as CanvasRenderingContext2D;
  const plan=omegaFieldPlan(20261108,1);
  const original=JSON.stringify(plan);
  omegaPrepareAuthoredScene();
  expect(urls).toHaveLength(5);
  expect(omegaDrawAuthoredFloor(ctx,plan)).toBe(true);
  for(const o of plan.obstacles)expect(omegaDrawAuthoredProp(ctx,plan,o)).toBe(true);
  expect(ctx.drawImage).toHaveBeenCalledTimes(5);
  const calls=vi.mocked(ctx.drawImage).mock.calls;
  expect(calls[0]!.slice(1)).toEqual([0,0,1400,900]);
  for(let i=0;i<plan.obstacles.length;i++){
   const o=plan.obstacles[i]!;
   const [,x,y,w,h]=calls[i+1]!;
   expect(x).toBe(o.x-12);
   expect(y).toBeLessThan(o.y);
   expect(w).toBe(o.width+24);
   expect(h).toBeGreaterThan(o.height);
  }
  expect(JSON.stringify(plan)).toBe(original);
  expect(omegaDrawAuthoredFloor(ctx,omegaFieldPlan(20261108,4))).toBe(false);
  expect(omegaDrawAuthoredProp(ctx,omegaFieldPlan(20261108,4),plan.obstacles[0]!)).toBe(false);
 });
});
