import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-protocol-actor-render';
import {
 OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED,
 OMEGA_SPRITE_ACTIONS,omegaCanRenderApprovedArt,omegaSpriteFrameForView,
 OmegaApprovedImageCache,drawOmegaApprovedActor,omegaApprovedFrameLookahead,
 type OmegaApprovedSpriteManifest,type OmegaApprovedSpriteFrame,
} from '../src/ui/omega-protocol-art-slot';

const positive=(letter:string):OmegaApprovedSpriteManifest=>{
 const frames=Object.fromEntries(OMEGA_DIRECTIONS.map(d=>[d,
  OMEGA_SPRITE_ACTIONS.map((action,i)=>({
   action,authoredUnmirrored:true,
   actor:'/assets/omega/approved/'+letter+'_'+d+'_'+i+'_actor.png',
   rearMask:'/assets/omega/approved/'+letter+'_'+d+'_'+i+'_rear.png',
   frontMask:'/assets/omega/approved/'+letter+'_'+d+'_'+i+'_front.png',
   actorSha256:(1+OMEGA_DIRECTIONS.indexOf(d)+i*8).toString(16).padStart(64,'0'),
   rearSha256:'b'.repeat(64),
   frontSha256:'c'.repeat(64),
  } as OmegaApprovedSpriteFrame)),
 ])) as OmegaApprovedSpriteManifest['frames'];
 return {identity:'AIRA_MASTER',status:'ARTIST_APPROVED',artistSignoff:'QA synthetic test',
  visualQa:'PASS',combatQa:'PASS',mobileDeviceQa:'PASS',width:384,height:512,
  feetLine:454,frames};
};
const sample={
 facingX:1,facingY:0,moving:false,time:1,dashing:false,shooting:false,
} as const;
const canvas=()=>{
 const calls:Array<{name:string;args:unknown[]}>= [];
 const ctx=new Proxy({},{
  get(_target,key){return (...args:unknown[])=>calls.push({name:String(key),args});},
  set(){return true},
 }) as unknown as CanvasRenderingContext2D;
 return {ctx,calls};
};

describe('OMEGA art release slot: no provisional character is misrepresented',()=>{
 it('is fail-closed in production until reviewed 160+320 binaries actually exist',()=>{
  const cache=new OmegaApprovedImageCache(12,()=>{throw new Error('MUST NOT LOAD')});
  const c=canvas();
  expect(OMEGA_PROTOCOL_APPROVED_ART).toBeNull();
  expect(OMEGA_PROTOCOL_BINARY_AUDIT_PASSED).toBe(false);
  expect(omegaCanRenderApprovedArt(OMEGA_PROTOCOL_APPROVED_ART,true)).toBe(false);
  expect(drawOmegaApprovedActor(c.ctx,null,false,cache,sample)).toBe(false);
  expect(cache.size).toBe(0);
  expect(c.calls).toHaveLength(0);
 });
 it('rejects an unapproved, mirrored or incomplete artist candidate',()=>{
  const real=positive('testa');
  expect(omegaCanRenderApprovedArt(real,false)).toBe(false);
  const missing=positive('testb');
  (missing.frames.NE as OmegaApprovedSpriteFrame[]).splice(3,1);
  expect(omegaCanRenderApprovedArt(missing,true)).toBe(false);
  const unreviewed=positive('testc');
  Object.assign(unreviewed,{status:'CONCEPT_REVIEW_ONLY'});
  expect(omegaCanRenderApprovedArt(unreviewed,true)).toBe(false);
  const mirror=positive('testd');
  Object.assign((mirror.frames.NE as OmegaApprovedSpriteFrame[])[0]!,{authoredUnmirrored:false});
  expect(omegaCanRenderApprovedArt(mirror,true)).toBe(false);
  const invalid=positive('teste');
  Object.assign((invalid.frames.E as OmegaApprovedSpriteFrame[])[0]!,{actor:'/private.png'});
  expect(omegaCanRenderApprovedArt(invalid,true)).toBe(false);
  const duplicates=positive('testg');
  Object.assign((duplicates.frames.NE as OmegaApprovedSpriteFrame[])[19]!,{
   actorSha256:duplicates.frames.E[0]!.actorSha256,
  });
  expect(omegaCanRenderApprovedArt(duplicates,true)).toBe(false);
 });
 it('does not reuse stale approval after mutable manifest tampering',()=>{
  const m=positive('mutabl');
  expect(omegaCanRenderApprovedArt(m,true)).toBe(true);
  Object.assign(m,{artistSignoff:''});
  expect(omegaCanRenderApprovedArt(m,true)).toBe(false);
  Object.assign(m,{artistSignoff:'restored for isolated test'});
  expect(omegaCanRenderApprovedArt(m,true)).toBe(true);
  Object.assign((m.frames.E as OmegaApprovedSpriteFrame[])[4]!,{
   actorSha256:'0'.repeat(64),
  });
  // 0 is a valid shape, but duplicates break 160 unique actor digests.
  expect(omegaCanRenderApprovedArt(m,true)).toBe(false);
  const wrong=positive('badtype');
  Object.assign(wrong,{artistSignoff:8});
  expect(omegaCanRenderApprovedArt(wrong,true)).toBe(false);
  const frozen=positive('frozen');
  for(const h of OMEGA_DIRECTIONS){
   for(const frame of frozen.frames[h])Object.freeze(frame);
   Object.freeze(frozen.frames[h]);
  }
  Object.freeze(frozen.frames);Object.freeze(frozen);
  expect(omegaCanRenderApprovedArt(frozen,true)).toBe(true);
  expect(Object.isFrozen(frozen)).toBe(true);
 });
 it('samples eight headings and exact 20-frame action windows without changing physics',()=>{
  expect(OMEGA_SPRITE_ACTIONS).toHaveLength(20);
  expect(omegaSpriteFrameForView(sample)).toEqual({heading:'E',frame:0,action:'walk'});
  expect(omegaSpriteFrameForView({...sample,moving:true,time:.11}).frame).toBe(1);
  expect(omegaSpriteFrameForView({...sample,shooting:true,actionAge:0}).frame).toBe(6);
  expect(omegaSpriteFrameForView({...sample,shooting:true,actionAge:.07}).frame).toBe(7);
  expect(omegaSpriteFrameForView({...sample,shooting:true,actionAge:.15}).frame).toBe(8);
  expect(omegaSpriteFrameForView({...sample,shooting:true,actionAge:5}).frame).toBe(8);
  expect(omegaSpriteFrameForView({...sample,dashing:true,actionAge:0}).frame).toBe(9);
  expect(omegaSpriteFrameForView({...sample,hurt:true,actionAge:0}).frame).toBe(12);
  expect(omegaSpriteFrameForView({...sample,dashing:true}).action).toBe('dash');
  expect(omegaSpriteFrameForView({...sample,hurt:true}).action).toBe('hit');
  expect(omegaSpriteFrameForView({...sample,ultimate:true}).action).toBe('ultimate');
  expect(omegaSpriteFrameForView({...sample,finished:true}).action).toBe('finish');
  expect(omegaSpriteFrameForView({...sample,facingX:-1,facingY:-1}).heading).toBe('NW');
 });
 it('paints only complete, verified back/actor/front layers and respects foot pivot',()=>{
  const manifest=positive('testf');
  expect(omegaCanRenderApprovedArt(manifest,true)).toBe(true);
  const loaded=new OmegaApprovedImageCache(10,()=>({
   complete:true,naturalWidth:384,naturalHeight:512,
  } as unknown as HTMLImageElement));
  const c=canvas();
  expect(drawOmegaApprovedActor(c.ctx,manifest,true,loaded,sample,86)).toBe(true);
  const drawn=c.calls.filter(call=>call.name==='drawImage');
  expect(drawn).toHaveLength(3);
  expect(drawn[0]!.args.slice(1)).toEqual([-32.25,-86*454/512,64.5,86]);
  // Render begins with three complete current layers; speculative prefetch
  // uses no more than the configured ten-image cache for this fixture.
  expect(loaded.size).toBeGreaterThanOrEqual(3);
  expect(loaded.size).toBeLessThanOrEqual(10);
  const pending=new OmegaApprovedImageCache(10,()=>({
   complete:false,naturalWidth:0,naturalHeight:0,
  } as unknown as HTMLImageElement));
  const empty=canvas();
  expect(drawOmegaApprovedActor(empty.ctx,manifest,true,pending,sample)).toBe(false);
  expect(empty.calls).toHaveLength(0);
 });
 it('preloads only next and adjacent approved frames while retaining fallback',()=>{
  const manifest=positive('warm');
  const pose=omegaSpriteFrameForView(sample);
  const upcoming=omegaApprovedFrameLookahead(manifest,pose);
  expect(upcoming).toHaveLength(9); // next E frame, same-index SE and NE
  expect(upcoming).toContain(manifest.frames.E[1]!.actor);
  expect(upcoming).toContain(manifest.frames.SE[0]!.actor);
  expect(upcoming).toContain(manifest.frames.NE[0]!.actor);
  const loadLog:string[]=[];
  const cache=new OmegaApprovedImageCache(36,uri=>{
   loadLog.push(uri);
   return {complete:true,naturalWidth:384,naturalHeight:512} as HTMLImageElement;
  });
  const c=canvas();
  expect(drawOmegaApprovedActor(c.ctx,manifest,true,cache,sample)).toBe(true);
  expect(loadLog).toHaveLength(12); // current 3 + 9 bounded lookahead
  expect(cache.size).toBe(12);
  // Preloaded current frame is reused; no duplicate loads on repeat draw.
  drawOmegaApprovedActor(c.ctx,manifest,true,cache,sample);
  expect(loadLog).toHaveLength(12);
  const oneShot=omegaApprovedFrameLookahead(manifest,{
   heading:'E',frame:8,action:'fire'});
  expect(oneShot).toContain(manifest.frames.E[8]!.actor);
  expect(oneShot).not.toContain(manifest.frames.E[9]!.actor);
  const never=canvas();
  expect(drawOmegaApprovedActor(never.ctx,manifest,false,cache,sample)).toBe(false);
  expect(never.calls).toHaveLength(0);
 });
 it('does not mistake the offline 8×6 directional preview for released art',()=>{
  const data=JSON.parse(readFileSync(new URL(
   '../content/art/omega-protocol-8dir-tech-preview-20261108.json',import.meta.url,
  ),'utf8')) as {
   status:string;playable:boolean;artistApproved:boolean;totalPreviewPng:number;
   finalRequiredFrames:number;finalRequiredMasks:number;githubBinaryAssetsIncluded:boolean;
   runtimeReleasePermitted:boolean;archiveSha256:string;
  };
  expect(data.status).toBe('TECHNICAL_PREVIEW_ONLY');
  expect(data.playable).toBe(false);
  expect(data.artistApproved).toBe(false);
  expect(data.githubBinaryAssetsIncluded).toBe(false);
  expect(data.runtimeReleasePermitted).toBe(false);
  expect(data.totalPreviewPng).toBe(48);
  expect(data.finalRequiredFrames).toBe(160);
  expect(data.finalRequiredMasks).toBe(320);
  expect(data.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(OMEGA_PROTOCOL_APPROVED_ART).toBeNull();
 });

});
