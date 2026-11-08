import {describe,it,expect,vi} from 'vitest';
import {OMEGA_DIRECTIONS} from '../src/ui/omega-operator-motion';
import {OMEGA_ACTION_LAYOUT,omegaReleaseDecision,drawOmegaApprovedLayers,type OmegaApprovedManifest,type OmegaApprovedFrame} from '../src/ui/omega-combat-art-contract';

function validManifest():OmegaApprovedManifest {
 const frames=Object.fromEntries(OMEGA_DIRECTIONS.map((heading,i)=>[heading,OMEGA_ACTION_LAYOUT.map((action,n):OmegaApprovedFrame=>{
  const id=heading.toLowerCase()+'_'+n;
  return {
   action,art:'/assets/omega/approved/'+id+'.png',
   sha256:(i.toString(16)+n.toString(16)).padEnd(64,'a'),
   frontOcclusion:'/assets/omega/approved/front_'+id+'.png',
   backOcclusion:'/assets/omega/approved/back_'+id+'.png',
   frontSha256:'b'.repeat(64),backSha256:'c'.repeat(64),
   feet:[{x:11,y:52},{x:19,y:53}],radio:{x:7,y:16},muzzle:{x:34,y:30},
   mirrored:false,
  };
 }])) as OmegaApprovedManifest['frames'];
 return {
  identity:'AIRA_MASTER',approval:'ARTIST_APPROVED',artistSignoff:'reviewer-sample',
  visualQa:'PASS',deviceQa:'PASS',combatQa:'PASS',frames,
 };
}
describe('OMEGA combat asset import must fail closed until real approved 8x20 art is verified',()=>{
 it('rejects missing manifest, missing mastery and missing independent binary audit',()=>{
  expect(OMEGA_ACTION_LAYOUT.length).toBe(20);
  expect(OMEGA_ACTION_LAYOUT.filter(x=>x==='walk').length).toBe(6);
  expect(omegaReleaseDecision(true,null).missing).toContain('APPROVED_MANIFEST_MISSING');
  expect(omegaReleaseDecision(false,validManifest(),true).missing).toContain('MASTER_50_OF_50_3STAR_REQUIRED');
  expect(omegaReleaseDecision(true,validManifest()).missing).toContain('SOURCE_BINARY_AUDIT_MISSING');
 });
 it('rejects incomplete/mirrored/inaccurate art, and does not silently repeat walk frames',()=>{
  const all=validManifest();
  const missing={...all,frames:{...all.frames,NW:[]}};
  expect(omegaReleaseDecision(true,missing,true).missing).toContain('NW_20_FRAMES_MISSING');
  const old=all.frames.NE![4]!;
  const bad={...all,frames:{...all.frames,NE:all.frames.NE!.map((x,index)=>index===4?{...x,mirrored:true}:x)}};
  expect(omegaReleaseDecision(true,bad,true).missing).toContain('NE_FRAME_4_INVALID');
  const repeats={...all,frames:{...all.frames,W:all.frames.W!.map((f,i)=>i===19?{...f,art:all.frames.W![18]!.art}:f)}};
  expect(omegaReleaseDecision(true,repeats,true).missing).toContain('W_DUPLICATED_ART');
  expect(old.action).toBe('walk');
 });
 it('allows technical compositing only after all signoffs and independent file checks',()=>{
  const approved=omegaReleaseDecision(true,validManifest(),true);
  expect(approved).toMatchObject({playable:true,reason:'APPROVED_AND_MASTERED',missing:[]});
  const rejected=omegaReleaseDecision(true,validManifest());
  const drawing=vi.fn(),ctx={drawImage:drawing} as unknown as CanvasRenderingContext2D;
  const layers={behind:{} as CanvasImageSource,actor:{} as CanvasImageSource,front:{} as CanvasImageSource,effect:{} as CanvasImageSource};
  expect(drawOmegaApprovedLayers(ctx,layers,0,0,60,90,rejected)).toBe(false);
  expect(drawing).not.toHaveBeenCalled();
  expect(drawOmegaApprovedLayers(ctx,layers,0,0,60,90,approved)).toBe(true);
  expect(drawing).toHaveBeenCalledTimes(4);
  expect(drawing.mock.calls[0]![0]).toBe(layers.behind);
  expect(drawing.mock.calls[1]![0]).toBe(layers.actor);
  expect(drawing.mock.calls[2]![0]).toBe(layers.front);
  expect(drawing.mock.calls[3]![0]).toBe(layers.effect);
 });
 it('does not compose invalid stage placement even with an approved manifest',()=>{
  const ctx={drawImage:vi.fn()} as unknown as CanvasRenderingContext2D,approved=omegaReleaseDecision(true,validManifest(),true);
  const layers={behind:{} as CanvasImageSource,actor:{} as CanvasImageSource,front:{} as CanvasImageSource};
  expect(drawOmegaApprovedLayers(ctx,layers,NaN,0,60,90,approved)).toBe(false);
  expect(drawOmegaApprovedLayers(ctx,layers,0,0,0,90,approved)).toBe(false);
  expect(ctx.drawImage).not.toHaveBeenCalled();
 });
});