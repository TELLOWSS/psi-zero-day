import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {OMEGA_G5N_RECOVERED_ART,OMEGA_G5N_RECOVERY_GATE,OMEGA_STRIDE_REPAINT_DIR,OMEGA_STRIDE_REPAINT_FILES} from '../src/ui/omega-m12g5n-recovered-sources';

function validate(kind:'aira'|'infected'){
 const {dir,anchor,names}=OMEGA_G5N_RECOVERED_ART[kind];
 const root=dir.slice(1);
 const manifest=JSON.parse(readFileSync(root+'/'+anchor,'utf8')) as {
  version:number;frames:{file:string;sha256:string;foot:{x:number;y:number};muzzle?:{x:number;y:number};referenceHeight?:number}[];
 };
 const hashes:string[]=[];const lengths:number[]=[];
 for(const frame of manifest.frames){
  const bytes=readFileSync(root+'/'+frame.file);
  const digest=createHash('sha256').update(bytes).digest('hex');
  expect(digest).toBe(frame.sha256);
  expect(bytes.toString('ascii',0,4)).toBe('RIFF');
  expect(bytes.toString('ascii',8,12)).toBe('WEBP');
  expect(Number.isFinite(frame.foot.x)&&Number.isFinite(frame.foot.y)).toBe(true);
  expect(bytes.length).toBeGreaterThan(8192);
  hashes.push(digest);lengths.push(bytes.length);
 }
 expect(manifest.frames.map(x=>x.file)).toEqual(names);
 expect(new Set(hashes).size).toBe(names.length);
 expect(manifest.version).toBe(1);
 return {count:hashes.length,bytes:lengths.reduce((a,b)=>a+b,0)};
}
describe('M12-G5n authentic recovered artwork, not approved or default-shipped',()=>{
 it('recovers 12 actual SHA-verified G5j E FIRE/DASH/HIT images and original anchor JSON',()=>{
  const x=validate('aira');expect(x.count).toBe(12);expect(x.bytes).toBeGreaterThan(1_200_000);
 });
 it('recovers 16 actual SHA-verified infected 4×4 images and original anchor JSON',()=>{
  const x=validate('infected');expect(x.count).toBe(16);expect(x.bytes).toBeGreaterThan(2_500_000);
 });
 it('changes exactly two SHA-pinned stride frames and retains the original anchor metadata',()=>{
  const base=OMEGA_G5N_RECOVERED_ART.infected.dir.slice(1);
  const replacement=OMEGA_STRIDE_REPAINT_DIR.slice(1);
  const original=JSON.parse(readFileSync(base+'/infected-anchors.json','utf8'));
  const alternate=JSON.parse(readFileSync(replacement+'/infected-anchors.json','utf8'));
  expect(alternate.frames.map((f:{file:string})=>f.file)).toEqual(original.frames.map((f:{file:string})=>f.file));
  const changed=alternate.frames.filter((f:{sha256:string},i:number)=>f.sha256!==original.frames[i].sha256);
  expect(changed.map((f:{file:string})=>f.file)).toEqual([...OMEGA_STRIDE_REPAINT_FILES]);
  for(const frame of changed){
   const bytes=readFileSync(replacement+'/'+frame.file);
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(frame.sha256);
   const matching=original.frames.find((f:{file:string})=>f.file===frame.file);
   expect(frame.foot).toEqual(matching.foot);
   expect(frame.referenceHeight).toBe(matching.referenceHeight);
  }
 });
 it('cannot silently replace production art or claim human approval',()=>{
  expect(OMEGA_G5N_RECOVERY_GATE).toMatchObject({
   sourcesRestoredToQaBranch:28,defaultGameArtReplaced:false,
   independentlyPaintedArtProven:false,artDirectorApproved:false,
   mainMerged:false,productionAllowed:false,
  });
 });
});
