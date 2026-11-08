import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const script=resolve('scripts/audit-omega-motion-study.mjs');
async function fixture(mirrored:boolean,approved:boolean,wrongDigest=false){
 const dir=mkdtempSync(join(tmpdir(),'omega-art-audit-'));
 const cw=16,ch=20,width=cw*8,height=ch*6;
 const rgba=Buffer.alloc(width*height*4);
 for(let col=0;col<8;col++)for(let phase=0;phase<6;phase++){
  const nw=3+phase%3;
  const left=col===5?nw:col===7?(mirrored?cw-1-(nw+3):1+phase%3):3+(col+phase)%5;
  for(let y=3;y<17;y++)for(let x=left;x<left+4;x++){
   const index=((phase*ch+y)*width+(col*cw+x))*4;
   rgba[index]=170;rgba[index+1]=100;rgba[index+2]=190;rgba[index+3]=255;
  }
 }
 const atlas=join(dir,'atlas.png');
 await sharp(rgba,{raw:{width,height,channels:4}}).png().toFile(atlas);
 const manifest=join(dir,'manifest.json');
 writeFileSync(manifest,JSON.stringify({id:'unit-study',
  status:approved?'ARTIST_AUTHORED_APPROVED':'CONCEPT_DEFORMATION_ONLY',
  releaseApproved:approved,doNotInstallAsPlayableCharacter:!approved,
  ...(wrongDigest?{atlas:{sha256:'0'.repeat(64)}}:{})}));
 return {dir,atlas,manifest,cleanup:()=>rmSync(dir,{recursive:true,force:true})};
}
function run(atlas:string,manifest:string,release=false){
 const args=[script,'--atlas',atlas,'--manifest',manifest,...(release?['--release']:[])];
 const proc=spawnSync(process.execPath,args,{encoding:'utf8',timeout:15000});
 return {status:proc.status,data:proc.stdout?JSON.parse(proc.stdout):null,stderr:proc.stderr};
}
describe('OMEGA pixel audit prevents unauthored and mirrored artwork releases',()=>{
 it('detects exact NW-to-NE mirror across six frames and blocks release',async()=>{
  const c=await fixture(true,false);try{
   const r=run(c.atlas,c.manifest);
   expect(r.status).toBe(0);
   expect(r.data.input.cell).toEqual([16,20]);
   expect(r.data.evidence.perDirection).toHaveLength(8);
   expect(r.data.evidence.mirroredNWNE.suspectedMirror).toBe(true);
   expect(r.data.evidence.mirroredNWNE.maximumIoU).toBe(1);
   expect(r.data.interpretation.releaseBlockers).toContain('NE_IS_MIRRORED_NW');
   expect(r.data.interpretation.releaseBlockers).toContain('MISSING_ATLAS_SHA256');
   expect(run(c.atlas,c.manifest,true).status).toBe(1);
  }finally{c.cleanup();}
 });
 it('recognizes distinct directional silhouettes but never mistakes prototypes for final art',async()=>{
  const c=await fixture(false,false);try{
   const r=run(c.atlas,c.manifest);
   expect(r.status).toBe(0);
   expect(r.data.evidence.mirroredNWNE.suspectedMirror).toBe(false);
   expect(r.data.interpretation.releaseBlockers).toContain('UNAPPROVED_ART_PROVENANCE');
   expect(r.data.interpretation.playableArtReady).toBe(false);
  }finally{c.cleanup();}
 });
 it('rejects incorrect SHA-256 and absent production sockets despite claimed approval',async()=>{
  const c=await fixture(false,true,true);try{
   const r=run(c.atlas,c.manifest);
   expect(r.data.input.sha256Matches).toBe(false);
   expect(r.data.interpretation.releaseBlockers).toContain('ATLAS_SHA256_MISMATCH');
   expect(r.data.interpretation.releaseBlockers).toContain('NO_PRODUCTION_EQUIPMENT_SOCKETS');
   expect(run(c.atlas,c.manifest,true).status).toBe(1);
  }finally{c.cleanup();}
 });
 it('refuses invalid 8-by-6 atlas geometry',async()=>{
  const c=await fixture(true,false);try{
   await sharp({create:{width:130,height:120,channels:4,background:'#ffffff'}}).png().toFile(c.atlas);
   const r=run(c.atlas,c.manifest);
   expect(r.status).toBe(2);
   expect(r.stderr).toContain('8x6');
  }finally{c.cleanup();}
 });
});
