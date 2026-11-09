import {afterEach,describe,it,expect,vi} from 'vitest';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_AIRA_E_SPECIAL_ART,OMEGA_AIRA_SPECIAL_DURATIONS,
 OmegaAiraV2SpecialFrames,omegaAiraSpecialFrameAt,omegaAiraSpecialSourceRect,
} from '../src/ui/omega-aira-v2-special-frames';

afterEach(()=>vi.unstubAllGlobals());
const base:OmegaActorView={
 facingX:1,facingY:0,time:4,moving:false,shooting:false,dashing:false,
 hurt:false,ultimate:false,finished:false,actionAge:0,
};
const art=(patch:Partial<OmegaActorView>):OmegaActorView=>({...base,...patch});
function ctxTrace(){
 const calls:unknown[][]=[];
 const ctx={drawImage:(...args:unknown[])=>{calls.push(args);}} as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
}
describe('AIRA V2 original one-heading illustrated ultimate and victory studies',()=>{
 it('maps native ultimate and terminal clock to real 3+2 frames, not a looping idle',()=>{
  expect([0,.54,.55,1.26,1.27,1.99,2].map(x=>
   omegaAiraSpecialFrameAt('ultimate',x))).toEqual([0,0,1,1,2,2,2]);
  expect([0,.3,.419,.42,.8,1].map(x=>
   omegaAiraSpecialFrameAt('finish',x))).toEqual([0,0,0,1,1,1]);
  expect(omegaAiraSpecialFrameAt('ultimate',Infinity)).toBe(0);
  expect(OMEGA_AIRA_SPECIAL_DURATIONS).toEqual({ultimate:2,finish:1});
  for(const x of Object.values(OMEGA_AIRA_E_SPECIAL_ART)){
   expect(x.binaryPresent).toBe(true);
   expect(x.productionApproved).toBe(false);
   expect(x.atlasWidth).toBe(x.count*x.cellWidth);
   expect(x.svgSha256).toMatch(/^[0-9a-f]{64}$/);
   expect(x.webpSha256).toMatch(/^[0-9a-f]{64}$/);
  }
 });
 it('keeps shared foot pivot and rejects invalid source frame crops',()=>{
  for(const action of ['ultimate','finish'] as const){
   const entry=OMEGA_AIRA_E_SPECIAL_ART[action];
   const rectangles=Array.from({length:entry.count},(_,i)=>
    omegaAiraSpecialSourceRect(action,i as 0|1|2,150));
   expect(rectangles.map(v=>v.sx)).toEqual(
    Array.from({length:entry.count},(_,i)=>i*entry.cellWidth));
   expect(rectangles.every(v=>v.sw===entry.cellWidth&&v.sh===240&&
    v.dx===-v.dw/2&&Math.abs(v.dy+v.dh*228/240)<1e-8)).toBe(true);
   expect(()=>omegaAiraSpecialSourceRect(action,0,NaN)).toThrow(RangeError);
   expect(()=>omegaAiraSpecialSourceRect(action,0,0)).toThrow(RangeError);
  }
  expect(()=>omegaAiraSpecialSourceRect('finish',2,150)).toThrow(RangeError);
 });
 it('decodes exactly two committed sources and paints only genuine E special state',()=>{
  const urls:string[]=[];
  class ReadySource{
   complete=true;naturalWidth=0;naturalHeight=240;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   private path='';
   set src(value:string){
    this.path=value;urls.push(value);
    this.naturalWidth=value.includes('ultimate')?960:1160;
   }
   get src(){return this.path;}
  }
  vi.stubGlobal('Image',ReadySource);
  const cache=new OmegaAiraV2SpecialFrames();
  cache.prepare();cache.prepare();
  expect(urls).toEqual([
   OMEGA_AIRA_E_SPECIAL_ART.ultimate.path,
   OMEGA_AIRA_E_SPECIAL_ART.finish.path,
  ]);
  expect(cache.ready('ultimate')).toBe(true);
  expect(cache.ready('finish')).toBe(true);
  const {ctx,calls}=ctxTrace();
  for(const [age,sx] of [[.15,0],[.8,320],[1.65,640]] as const){
   expect(cache.draw(ctx,'E',art({ultimate:true,actionAge:age}),190)).toBe('ultimate');
   expect(calls.at(-1)?.slice(1)).toEqual(
    Object.values(omegaAiraSpecialSourceRect('ultimate',(sx/320) as 0|1|2,190)));
  }
  for(const [age,sx] of [[.15,0],[.8,580]] as const){
   expect(cache.draw(ctx,'E',art({finished:true,actionAge:age}),161)).toBe('finish');
   expect(calls.at(-1)?.slice(1)).toEqual(
    Object.values(omegaAiraSpecialSourceRect('finish',(sx/580) as 0|1|2,161)));
  }
  expect(calls).toHaveLength(5);
  for(const heading of ['SE','S','SW','W','NW','N','NE'] as const){
   expect(cache.draw(ctx,heading,art({ultimate:true,actionAge:.8}),190)).toBe(false);
   expect(cache.draw(ctx,heading,art({finished:true,actionAge:.8}),161)).toBe(false);
  }
  for(const [view,height] of [
   [art({actionAge:.3}),190],
   [art({ultimate:true,actionAge:NaN}),190],
   [art({finished:true,actionAge:Infinity}),161],
   [art({ultimate:true,actionAge:2.1}),190],
   [art({finished:true,actionAge:1.1}),161],
   [art({ultimate:true,actionAge:undefined}),190],
   [art({finished:true,actionAge:-1}),161],
  ] as const)expect(cache.draw(ctx,'E',view,height)).toBe(false);
  expect(calls).toHaveLength(5);
 });
 it('falls back safely when source cannot decode or the image is tampered',()=>{
  class WrongImage{
   complete=true;naturalWidth=40;naturalHeight=40;decoding='';
   onload=null;onerror=null;src='';
  }
  vi.stubGlobal('Image',WrongImage);
  const s=new OmegaAiraV2SpecialFrames();s.prepare();
  expect(s.ready('ultimate')).toBe(false);
  expect(s.ready('finish')).toBe(false);
  const {ctx,calls}=ctxTrace();
  expect(s.draw(ctx,'E',art({ultimate:true}),170)).toBe(false);
  expect(s.draw(ctx,'E',art({finished:true}),170)).toBe(false);
  expect(calls).toHaveLength(0);
 });
});
