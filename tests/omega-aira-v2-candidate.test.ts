import {afterEach,describe,expect,it,vi} from 'vitest';
import {
 OMEGA_AIRA_V2_HEADINGS,OMEGA_AIRA_V2_ROOT,OMEGA_AIRA_V2_IDENTITY,
 OmegaAiraV2CandidateImages,omegaAiraV2Path,drawOmegaAiraV2Candidate,
} from '../src/ui/omega-aira-v2-candidate';

afterEach(()=>vi.unstubAllGlobals());
describe('AIRA V2 user-selected eight-direction identity in live Watch Canvas',()=>{
 it('uses eight distinct ORIGINAL images and the native game-space face mapping',()=>{
  expect(OMEGA_AIRA_V2_IDENTITY).toBe('AIRA_V2_USER_APPROVED_20261109');
  expect(OMEGA_AIRA_V2_HEADINGS).toEqual(['E','SE','S','SW','W','NW','N','NE']);
  const paths=OMEGA_AIRA_V2_HEADINGS.map(omegaAiraV2Path);
  expect(new Set(paths).size).toBe(8);
  expect(paths.every(path=>path.startsWith(OMEGA_AIRA_V2_ROOT)&&
   path.endsWith('-idle.webp'))).toBe(true);
  // Sheet's N(front)/S(back) labels differ from the native game axes.
  expect(omegaAiraV2Path('S')).toContain('s-idle');
  expect(omegaAiraV2Path('N')).toContain('n-idle');
 });
 it('never claims a missing or undecoded image is production-ready',()=>{
  class MissingImage{
   complete=false;naturalWidth=0;naturalHeight=0;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
   src='';
  }
  vi.stubGlobal('Image',MissingImage);
  const cache=new OmegaAiraV2CandidateImages();
  cache.prepare();
  expect(cache.hasAllDirections()).toBe(false);
  expect(cache.image('S')).toBe(null);
  expect(Object.values(cache.status()).every(v=>!v)).toBe(true);
 });
 it('keeps the real player foot-pivot and never mirrors a direction',()=>{
  class LoadedImage {
   complete=true;naturalWidth=192;naturalHeight=336;decoding='';
   onload:(()=>void)|null=null;onerror:(()=>void)|null=null;src='';
  }
  vi.stubGlobal('Image',LoadedImage);
  const cache=new OmegaAiraV2CandidateImages();
  cache.prepare();
  expect(cache.hasAllDirections()).toBe(true);
  const events:Array<{name:string;args:unknown[]}>= [];
  const ctx=new Proxy({},{
   get(_t,k){return(...args:unknown[])=>events.push({name:String(k),args});},
   set(){return true;},
  }) as unknown as CanvasRenderingContext2D;
  const view={
   facingX:0,facingY:1,moving:false,time:3,dashing:false,shooting:false,
  };
  expect(drawOmegaAiraV2Candidate(ctx,view,cache)).toBe(true);
  const draw=events.find(e=>e.name==='drawImage');
  expect(draw?.args.slice(1)).toEqual([-118*192/336/2,-118,118*192/336,118]);
  expect(events.filter(e=>e.name==='scale').length).toBe(0);
  expect(events.some(e=>e.name==='ellipse')).toBe(true);
 });
 it('orders real canvas gun pixels behind original back views and ahead of front views',()=>{
  class LoadedImage{
   complete=true;naturalWidth=192;naturalHeight=336;decoding='';
   src='';onload=null;onerror=null;
  }
  vi.stubGlobal('Image',LoadedImage);
  const cache=new OmegaAiraV2CandidateImages();
  cache.prepare();
  const sample=(direction:'N'|'S')=>{
   const event:string[]=[];
   const gradient={addColorStop:(_a:number,_b:string)=>{}};
   const ctx=new Proxy({},{
    get(_t,k){
     if(k==='createLinearGradient'||k==='createRadialGradient')return()=>{
      event.push(String(k));return gradient;
     };
     return (..._args:unknown[])=>{event.push(String(k));};
    },
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   const view={facingX:0,facingY:direction==='N'?-1:1,moving:false,time:2.4,
    shooting:true,dashing:false,actionAge:.04,weaponFacingX:1,weaponFacingY:0};
   expect(drawOmegaAiraV2Candidate(ctx,view,cache)).toBe(true);
   return event;
  };
  const back=sample('N'),front=sample('S');
  expect(back.indexOf('createRadialGradient')).toBeGreaterThanOrEqual(0);
  expect(front.indexOf('createRadialGradient')).toBeGreaterThanOrEqual(0);
  expect(back.indexOf('createRadialGradient')).toBeLessThan(back.indexOf('drawImage'));
  expect(front.indexOf('createRadialGradient')).toBeGreaterThan(front.indexOf('drawImage'));
  expect(back.filter(k=>k==='createRadialGradient')).toHaveLength(1);
  expect(front.filter(k=>k==='createRadialGradient')).toHaveLength(1);
 });
 it('adds only visual motion derived from native action booleans',()=>{
  class LoadedImage{
   complete=true;naturalWidth=192;naturalHeight=336;decoding='';
   src='';onload=null;onerror=null;
  }
  vi.stubGlobal('Image',LoadedImage);
  const c=new OmegaAiraV2CandidateImages();
  const trace=(flags:{shooting?:boolean;dashing?:boolean;hurt?:boolean})=>{
   const moves:number[][]=[];
   // The mock must support CanvasGradient's methods now that actual source
   // AIRA V2 firearms have a multi-stop metal and muzzle-light material.
   const gradient={addColorStop:(_offset:number,_color:string)=>{}};
   const ctx=new Proxy({},{
    get(_t,k){
     if(k==='createLinearGradient'||k==='createRadialGradient')
      return ()=>gradient;
     return(...args:unknown[])=>{if(k==='translate')moves.push(args as number[]);};
    },
    set(){return true;},
   }) as unknown as CanvasRenderingContext2D;
   drawOmegaAiraV2Candidate(ctx,{
    facingX:1,facingY:0,moving:false,time:2,shooting:false,dashing:false,
    ...flags,
   },c);
   return moves;
  };
  expect(trace({dashing:true})).not.toEqual(trace({}));
  expect(trace({shooting:true})).not.toEqual(trace({}));
  expect(trace({hurt:true})).not.toEqual(trace({}));
 });
});
