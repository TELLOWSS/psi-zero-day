import {describe,it,expect} from 'vitest';
import {
 OMEGA_G5I_ACTIONS,OMEGA_G5I_FILE_NAMES,OMEGA_G5I_ART_GATE,
 omegaG5iLabRequested,omegaG5iFileSelectionValid,
 omegaG5iSourceHashesValid,omegaG5iGeometryAudit,OmegaG5iLocalActionArtPreview,
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
