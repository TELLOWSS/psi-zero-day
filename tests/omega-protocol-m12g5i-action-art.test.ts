import {describe,it,expect} from 'vitest';
import {
 OMEGA_G5I_ACTIONS,OMEGA_G5I_FILE_NAMES,OMEGA_G5I_ART_GATE,
 omegaG5iLabRequested,omegaG5iFileSelectionValid,
 omegaG5iSourceHashesValid,omegaG5iGeometryAudit,OmegaG5iLocalActionArtPreview,
 omegaG5iInspectPixelAlpha,
 omegaWideManifest,omegaWideAlphaValid,omegaWidePlacement,omegaWideNativeFrame,
} from '../src/ui/omega-protocol-m12g5i-action-art';
import {OMEGA_G5D_ACTUAL_E_WALK} from '../src/ui/omega-protocol-m12g5d-actual-source';
import {OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED} from '../src/ui/omega-protocol-art-slot';
function imageSilhouette(offset:number):Uint8ClampedArray{
 const a=new Uint8ClampedArray(384*512*4);
 for(let y=155;y<485;y++)for(let x=104+offset;x<151+offset;x++){
  if(x>=384)continue;
  a[(y*384+x)*4+3]=255;
 }
 return a;
}
describe('M12-G5i independently supplied E FIRE / DASH / HIT art candidate reviewer',()=>{
 it('requires DEV + explicit, isolated candidate lab, never public gameplay',()=>{
  const q='?omegaLab=1&omegaM12G5i=1';
  expect(omegaG5iLabRequested(q,true)).toBe(true);
  expect(omegaG5iLabRequested(q,false)).toBe(false);
  expect(omegaG5iLabRequested('?omegaM12G5i=1',true)).toBe(false);
  expect(omegaG5iLabRequested(q+'&omegaM12G5h=1',true)).toBe(false);
  expect(omegaG5iLabRequested(q+'&omegaSilverPreview=1',true)).toBe(false);
  expect(omegaG5iLabRequested(q+'&omegaM12G5d=1',true)).toBe(false);
 });
 it('requires exact 12 named E combat WebPs, not rebranded WALK, duplications or disguised files',()=>{
  expect(OMEGA_G5I_ACTIONS).toEqual(['fire','dash','hit']);
  expect(OMEGA_G5I_FILE_NAMES).toHaveLength(12);
  expect(new Set(OMEGA_G5I_FILE_NAMES).size).toBe(12);
  const files=OMEGA_G5I_FILE_NAMES.map(name=>({name,size:42_000,type:'image/webp'}));
  expect(omegaG5iFileSelectionValid(files)).toBe(true);
  expect(omegaG5iFileSelectionValid(files.slice(1))).toBe(false);
  expect(omegaG5iFileSelectionValid(files.map(f=>({...f,type:'image/png'})))).toBe(false);
  expect(omegaG5iFileSelectionValid(files.map(f=>({...f,size:400})))).toBe(false);
  expect(omegaG5iFileSelectionValid([...files.slice(0,11),files[0]!])).toBe(false);
  expect(omegaG5iFileSelectionValid(files.map(f=>({...f,name:f.name.replace('fire','walk')})))).toBe(false);
 });
 it('checks SHA uniqueness and excludes all four real G5d WALK source hashes',()=>{
  const hashes=Array.from({length:12},(_,i)=>(i+1).toString(16).padStart(64,'0'));
  expect(omegaG5iSourceHashesValid(hashes)).toBe(true);
  expect(omegaG5iSourceHashesValid(hashes.slice(1))).toBe(false);
  expect(omegaG5iSourceHashesValid(hashes.map(()=>hashes[0]!))).toBe(false);
  expect(omegaG5iSourceHashesValid([OMEGA_G5D_ACTUAL_E_WALK[0]!.sha256,...hashes.slice(1)])).toBe(false);
  expect(omegaG5iSourceHashesValid([...hashes.slice(0,11),'NOT_A_HASH'])).toBe(false);
 });
 it('reports measured alpha bounds for a low pose without calling them verified feet',()=>{
  const pixels=new Uint8ClampedArray(384*512*4);
  for(let y=175;y<495;y++)for(let x=50;x<330;x++)pixels[(y*384+x)*4+3]=255;
  expect(()=>omegaG5iInspectPixelAlpha(pixels)).toThrow(/상단 175, 하단 494, 높이 320px/);
  expect(()=>omegaG5iInspectPixelAlpha(new Uint8ClampedArray(4))).toThrow(/384x512/);
 });
 it('requires explicit in-bounds foot and muzzle anchors for each unique wide frame',()=>{
  const frames=OMEGA_G5I_FILE_NAMES.map((file,i)=>({file,sha256:(i+1).toString(16).padStart(64,'0'),foot:{x:320,y:480},muzzle:{x:450,y:200}}));
  expect(omegaWideManifest({version:1,frames})).toHaveLength(12);
  expect(()=>omegaWideManifest({version:1,frames:frames.slice(1)})).toThrow();
  expect(()=>omegaWideManifest({version:1,frames:frames.map((f,i)=>i?f:{...f,foot:{x:640,y:480}})})).toThrow();
  expect(()=>omegaWideManifest({version:1,frames:frames.map((f,i)=>i?f:{...f,muzzle:{x:NaN,y:200}})})).toThrow();
  expect(()=>omegaWideManifest({version:1,frames:[...frames.slice(0,11),frames[0]]})).toThrow();
 });
 it('rejects clipped edges, empty and opaque wide images',()=>{
  const pixels=new Uint8ClampedArray(640*512*4);
  expect(omegaWideAlphaValid(pixels)).toBe(false);
  for(let y=80;y<470;y++)for(let x=200;x<400;x++)pixels[(y*640+x)*4+3]=255;
  expect(omegaWideAlphaValid(pixels)).toBe(true);
  pixels[(100*640)*4+3]=255;expect(omegaWideAlphaValid(pixels)).toBe(false);
  expect(omegaWideAlphaValid(new Uint8ClampedArray(4))).toBe(false);
 });
 it('maps the supplied foot to the world origin and muzzle relative to it',()=>{
  const p=omegaWidePlacement({file:'frame',sha256:'0'.repeat(64),foot:{x:320,y:480},muzzle:{x:460,y:200}},128);
  expect(p).toEqual({left:-80,top:-120,width:160,height:128,muzzleX:35,muzzleY:-70});
 });
 it('spans four poses within actual native action windows without extending them',()=>{
  for(const [action,window] of [['fire',.09],['dash',.22],['hit',.15]] as const){
   expect([0,.26,.51,.76].map(t=>omegaWideNativeFrame(action,t*window))).toEqual([0,1,2,3]);
   expect(omegaWideNativeFrame(action,-1)).toBe(0);
   expect(omegaWideNativeFrame(action,window*2)).toBe(3);
  }
 });
 it('requires each action 4 different body-core silhouettes AND cross-action body changes',()=>{
  const independentShapes=Array.from({length:12},(_,i)=>imageSilhouette(i*12));
  const audit=omegaG5iGeometryAudit(independentShapes);
  expect(audit.candidateGeometryEligible).toBe(true);
  expect(audit.minimumPerAction.fire).toBeGreaterThan(.10);
  expect(audit.minimumPerAction.dash).toBeGreaterThan(.10);
  expect(audit.minimumPerAction.hit).toBeGreaterThan(.10);
  expect(audit.crossAction).toHaveLength(12);
  // A color or muzzle FX that preserves the BODY cannot pass.
  const repeatedFire=independentShapes.slice();
  repeatedFire[1]=repeatedFire[0]!;
  expect(omegaG5iGeometryAudit(repeatedFire).candidateGeometryEligible).toBe(false);
  const crossActionClone=independentShapes.slice();
  crossActionClone[4]=crossActionClone[0]!;
  expect(omegaG5iGeometryAudit(crossActionClone).candidateGeometryEligible).toBe(false);
  expect(omegaG5iGeometryAudit([]).candidateGeometryEligible).toBe(false);
 });
 it('does NOT activate without real decoded source upload and never invents 160/320 approval',()=>{
  const preview=new OmegaG5iLocalActionArtPreview();
  expect(preview.ready).toBe(false);
  expect(preview.activate(true)).toBe(false);
  expect(preview.active).toBe(false);
  expect(preview.audit).toBeNull();
  expect(preview.evidence().counts).toEqual({fire:0,dash:0,hit:0});
  expect(OMEGA_G5I_ART_GATE).toMatchObject({
   candidateActionFilesCommittedToRepo:0,independentlyPaintedActionFramesApproved:0,
   independentlyPaintedInfectedFramesApproved:0,final160FramesApproved:0,
   final320MasksApproved:0,humanArtworkSignoff:false,
   commercialReleaseAllowed:false,automaticHeroReplacement:false,
  });
  expect(OMEGA_PROTOCOL_APPROVED_ART).toBe(null);
  expect(OMEGA_PROTOCOL_BINARY_AUDIT_PASSED).toBe(false);
 });
});
