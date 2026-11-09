import {describe,it,expect,vi,afterEach} from 'vitest';
import {
 OMEGA_SILVER_REVIEW_DB,OMEGA_SILVER_REVIEW_STORE,
 OMEGA_SILVER_HEADINGS,omegaSilverPreviewEnabled,
 omegaSilverPreviewAcceptableRoster,omegaSilverReviewUrl,
} from '../src/ui/omega-canonical-local-preview';
import {
 OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate,
} from '../src/ui/omega-aira-v2-candidate';

afterEach(()=>vi.unstubAllGlobals());
const roster=()=>({
 stage:'review_only',production_approved:false,
 main_games:['SIGNAL GUARD','SIGNAL WATCH'],
 sha256_by_slot:Object.fromEntries([...OMEGA_SILVER_HEADINGS,'M01']
  .map((s,i)=>[s,String(i).repeat(64)])),
});
describe('silver AIRA 8-view browser-only original-art preview contract',()=>{
 it('rejects release or mode confusion and accepts only opt-in exact query',()=>{
  expect(omegaSilverPreviewEnabled('?omegaLab=1&omegaSilverPreview=1')).toBe(true);
  expect(omegaSilverPreviewEnabled('?omegaSilverPreview=0')).toBe(false);
  expect(omegaSilverPreviewEnabled('?omegaSilverPreview=true')).toBe(false);
  expect(omegaSilverReviewUrl()).toContain('omegaLab=1');
  expect(OMEGA_SILVER_REVIEW_DB).toContain('review');
  expect(OMEGA_SILVER_REVIEW_STORE).toBe('sprites');
  const good=roster();
  expect(omegaSilverPreviewAcceptableRoster(good)).toBe(true);
  expect(omegaSilverPreviewAcceptableRoster({...good,production_approved:true})).toBe(false);
  expect(omegaSilverPreviewAcceptableRoster({...good,stage:'production'})).toBe(false);
  expect(omegaSilverPreviewAcceptableRoster({...good,main_games:['SIGNAL BREAKER','SIGNAL WATCH']})).toBe(false);
  expect(omegaSilverPreviewAcceptableRoster({...good,sha256_by_slot:{E:'f'.repeat(64)}})).toBe(false);
 });
 it('requires 8 complete independent local object URLs without mutating on invalid source',()=>{
  class RealLookingImage{
   decoding='';src='';onload=null;onerror=null;complete=true;
   naturalWidth=384;naturalHeight=512;
  }
  vi.stubGlobal('Image',RealLookingImage);
  const cache=new OmegaAiraV2CandidateImages();
  cache.prepare();
  expect(cache.silverReviewActive).toBe(false);
  const incomplete=new Map([['E','blob:one']]) as unknown as ReadonlyMap<
   (typeof OMEGA_SILVER_HEADINGS)[number],string>;
  expect(()=>cache.setSilverReviewSources(incomplete)).toThrow();
  expect(cache.silverReviewActive).toBe(false);
  const images=new Map(OMEGA_SILVER_HEADINGS.map((h,i)=>[h,'blob:silver-'+i] as const));
  cache.setSilverReviewSources(images);
  expect(cache.silverReviewActive).toBe(true);
  expect(cache.hasAllDirections()).toBe(true);
  const drawn:Array<unknown[]>=[],ctx=new Proxy({canvas:{width:844}},{
   get(target,key){
    if(key==='canvas')return target.canvas;
    return (...args:unknown[])=>{
     if(key==='drawImage')drawn.push(args);
    };
   },
   set(){return true;},
  }) as unknown as CanvasRenderingContext2D;
  // Silver game original is 384x512, not old black-rose 192x336.
  const active=drawOmegaAiraV2Candidate(ctx,{
   facingX:1,facingY:0,shooting:true,dashing:false,
   moving:true,actionAge:.03,time:1,
  },cache);
  expect(active).toBe(true);
  expect(drawn).toHaveLength(1);
  expect(drawn[0]?.length).toBe(5); // one intact source sprite, no 3-part cutout
  expect(drawn[0]?.slice(1)).toEqual([-51,-136,102,136]);
  cache.setSilverReviewSources(null);
  expect(cache.silverReviewActive).toBe(false);
 });
});
