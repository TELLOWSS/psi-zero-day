import {describe,it,expect} from 'vitest';
import {
 OMEGA_SILVER_NATIVE_WATCH_HEADINGS,
 omegaSilverWatchHeading,drawOmegaSilverWatchNativeActor,
} from '../src/ui/omega-silver-watch-native';
import type {OmegaHeading} from '../src/ui/omega-protocol-actor-render';

const order:readonly OmegaHeading[]=['E','SE','S','SW','W','NW','N','NE'];
const map=():ReadonlyMap<OmegaHeading,HTMLImageElement>=>new Map<OmegaHeading,HTMLImageElement>(
 order.map((heading,i)=>[heading,{
  complete:true,naturalWidth:384,naturalHeight:512,
  src:'blob:original-'+i,
 } as HTMLImageElement]));
const record=()=>{
 const calls:unknown[][]=[];
 const ctx={drawImage:(...args:unknown[])=>calls.push(args)} as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};
describe('ACTUAL SIGNAL WATCH native AIRA silver source renderer — DEV only',()=>{
 it('matches Watch SpriteMotionTracker numeric 8-way order exactly',()=>{
  expect(OMEGA_SILVER_NATIVE_WATCH_HEADINGS).toEqual(order);
  for(let i=0;i<8;i++)
   expect(omegaSilverWatchHeading(i)).toBe(order[i]);
  for(const wrong of [undefined,NaN,Infinity,-1,8,1.2,-Infinity])
   expect(omegaSilverWatchHeading(wrong)).toBe(null);
 });
 it('draws each of the eight separately reviewed WebPs at the original world boot pivot without mirroring',()=>{
  const images=map();
  for(let i=0;i<8;i++){
   const {ctx,calls}=record();
   expect(drawOmegaSilverWatchNativeActor(ctx,images,i,74)).toBe(true);
   expect(calls).toHaveLength(1);
   const [img,x,y,w,h]=calls[0]!;
   expect(img).toBe(images.get(order[i] as OmegaHeading));
   expect(x).toBe(-27.75);expect(y).toBe(-74);
   expect(w).toBe(55.5);expect(h).toBe(74);
   // No Canvas scale(-1,1), no mirrored direction or invented bullet.
  }
 });
 it('fails closed without an original image, on invalid geometry or undecoded files',()=>{
  const pictures=map(),{ctx,calls}=record();
  expect(drawOmegaSilverWatchNativeActor(ctx,new Map(),0,74)).toBe(false);
  expect(drawOmegaSilverWatchNativeActor(ctx,pictures,0,0)).toBe(false);
  expect(drawOmegaSilverWatchNativeActor(ctx,pictures,0,NaN)).toBe(false);
  expect(drawOmegaSilverWatchNativeActor(ctx,pictures,13,74)).toBe(false);
  expect(drawOmegaSilverWatchNativeActor(ctx,new Map([
   ['E',{complete:true,naturalWidth:384,naturalHeight:384} as HTMLImageElement],
  ]),0,74)).toBe(false);
  expect(drawOmegaSilverWatchNativeActor(ctx,new Map([
   ['E',{complete:false,naturalWidth:384,naturalHeight:512} as HTMLImageElement],
  ]),0,74)).toBe(false);
  expect(calls).toHaveLength(0);
 });
});
