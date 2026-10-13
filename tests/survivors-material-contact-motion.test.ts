import {describe,expect,it,vi} from 'vitest';
import {materialContactMotion,materialFragmentMotion} from '../src/ui/survivors-material-contact-motion';
import {drawIndustrialContact,industrialResponse} from '../src/ui/survivors-industrial-art';
vi.mock('../src/ui/survivors-equipment-art',()=>({drawProp:(ctx:CanvasRenderingContext2D,...args:unknown[])=>{ctx.drawImage(...args as Parameters<CanvasRenderingContext2D['drawImage']>);return true;},drawPropReaction:vi.fn()}));
vi.mock('../src/ui/survivors-material-fragments',()=>({materialFragmentTexture:()=>({})}));
describe('reference-informed material motion',()=>{
 it('staggers fragments, curls vapor and fully retires every component',()=>{
  expect(materialFragmentMotion(.001,.3,false,2,5).alpha).toBe(0);
  const solid=materialFragmentMotion(.15,.3,false,3,5),gas=materialFragmentMotion(.15,.3,true,3,5);
  expect(solid.y).not.toBe(gas.y);expect(solid.rotation).not.toBe(gas.rotation);
  for(let i=0;i<5;i++){
   const end=materialFragmentMotion(.3,.3,false,i,5);expect(end.alpha).toBe(0);
   expect(materialFragmentMotion(.15,.3,false,i,5)).toEqual(materialFragmentMotion(.15,.3,false,i,5));
  }
 });
 it('separates fast ignition from delayed material and opposite gravity',()=>{
  const a=materialContactMotion(0,.3,false),b=materialContactMotion(.12,.3,false),c=materialContactMotion(.12,.3,true);
  expect(a.coreAlpha).toBe(1);expect(a.fragmentAlpha).toBe(0);expect(a.tailAlpha).toBe(0);
  expect(b.coreAlpha).toBeLessThan(b.fragmentAlpha);expect(b.fragmentTravel).toBeGreaterThan(a.fragmentTravel);
  expect(b.fragmentFall).toBeGreaterThan(0);expect(c.fragmentFall).toBeLessThan(0);
  expect(materialContactMotion(1,.3,false).coreAlpha).toBe(0);
 });
 it('uses independent painted trajectories, bounded in busy mode and frozen at paused age',()=>{
  const ctx={save:vi.fn(),restore:vi.fn(),rotate:vi.fn(),translate:vi.fn(),drawImage:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn()} as unknown as CanvasRenderingContext2D;
  const atlas={naturalWidth:1536,naturalHeight:1024} as HTMLImageElement;
  const event={projectileId:'test',kind:'radio' as const,phase:'impact' as const,x:0,y:0,angle:0,radius:10,actorKind:'RUNAWAY_CART' as const,critical:true};
  drawIndustrialContact(ctx,atlas,event,.08,.3,false,false);const first=vi.mocked(ctx.drawImage).mock.calls.slice();expect(first).toHaveLength(7);
  vi.mocked(ctx.drawImage).mockClear();drawIndustrialContact(ctx,atlas,event,.08,.3,false,false);expect(vi.mocked(ctx.drawImage).mock.calls).toEqual(first);
  vi.mocked(ctx.drawImage).mockClear();drawIndustrialContact(ctx,atlas,event,.08,.3,false,true);expect(ctx.drawImage).toHaveBeenCalledTimes(3);
  expect(vi.mocked(ctx.save).mock.calls.length).toBe(vi.mocked(ctx.restore).mock.calls.length);
 });
 it('settles chassis recoil back through neutral without moving collision state',()=>{
  const p={reaction:1,moving:false,cycle:0,facing:1 as const};
  expect(industrialResponse({type:'RUNAWAY_CART'},p,false).tilt).toBeGreaterThan(0);
  expect(industrialResponse({type:'RUNAWAY_CART'},{...p,reaction:.4},false).tilt).toBeLessThan(0);
  expect(industrialResponse({type:'RUNAWAY_CART'},{...p,reaction:0},false).tilt).toBe(0);
  expect(industrialResponse({type:'RUNAWAY_CART'},p,true).tilt).toBe(0);
 });
});
