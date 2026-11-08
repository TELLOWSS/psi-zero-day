import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {omegaMirroredAlphaIoU,omegaDetectNWNEBitmapMirroring,omegaMirrorVerdict} from '../scripts/omega-art-mirror-audit.mjs';

const W=64,H=96;
async function generateSprite(file,frame,side){
 const data=Buffer.alloc(W*H*4);
 const base=13+(frame%4)*2;
 for(let y=15;y<88;y++)for(let x=6;x<50;x++){
  const torso=y>=21&&y<=55&&x>=base&&x<base+13;
  const shoulder=y>=30&&y<=40&&x>=base-5&&x<=base+14;
  const leg=y>55&&(((x>=base+2&&x<base+7)||(x>=base+10&&x<base+14)));
  const hair=y>=15&&y<=35&&x>=base-5&&x<base+3;
  const present=torso||shoulder||leg||hair;
  const outputX=side==='mirror'?W-1-x:side==='independent'?Math.min(W-1,x+8):x;
  if(present){
   const i=(y*W+outputX)*4;data[i]=200;data[i+1]=170;data[i+2]=210;data[i+3]=255;
  }
 }
 await sharp(data,{raw:{width:W,height:H,channels:4}}).png().toFile(file);
}
describe('OMEGA image-based independent NE audit',()=>{
 it('scores exactly flipped alpha silhouette as suspicious',()=>{
  const a=new Uint8Array(8*6),b=new Uint8Array(8*6);
  a[1*8+1]=1;a[2*8+1]=1;a[3*8+2]=1;
  b[1*8+6]=1;b[2*8+6]=1;b[3*8+5]=1;
  expect(omegaMirroredAlphaIoU(a,b,8,6)).toBe(1);
  expect(omegaMirroredAlphaIoU(a,a,8,6)).toBeLessThan(.5);
  expect(()=>omegaMirroredAlphaIoU(a,b,8,5)).toThrow();
 });
 it('catches six mirrored files even with different gait frames',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'omega-mirror-'));
  try{
   const nw=[],ne=[];
   for(let phase=0;phase<6;phase++){
    const f1=join(dir,'nw_'+phase+'.png'),f2=join(dir,'ne_'+phase+'.png');
    await generateSprite(f1,phase,'original');
    await generateSprite(f2,phase,'mirror');
    nw.push(f1);ne.push(f2);
   }
   const report=await omegaDetectNWNEBitmapMirroring(nw,ne);
   expect(report.method).toBe('FLIPPED_ALPHA_64x96');
   expect(report.scores).toHaveLength(6);
   expect(report.peak).toBe(1);
   expect(report.mean).toBe(1);
   expect(report.suspectedMirror).toBe(true);
   for(let phase=0;phase<6;phase++)await generateSprite(ne[phase],phase,'independent');
   const acceptedForFurtherHumanReview=await omegaDetectNWNEBitmapMirroring(nw,ne);
   expect(acceptedForFurtherHumanReview.suspectedMirror).toBe(false);
  }finally{rmSync(dir,{recursive:true,force:true})}
 });
 it('blocks previously observed mirrored source despite 64x96 downsample loss',()=>{
  const measured=[0.9663,0.9493,0.9564,0.9678,0.9243,0.9243];
  const old=omegaMirrorVerdict(measured);
  expect(old.mean).toBeGreaterThan(.94);
  expect(old.peak).toBeGreaterThan(.965);
  expect(old.suspectedMirror).toBe(true);
  expect(omegaMirrorVerdict([.680,.704,.660,.688,.699,.665]).suspectedMirror).toBe(false);
  expect(()=>omegaMirrorVerdict([1,.9])).toThrow('six');
 });
 it('requires complete six-phase files on both headings',async()=>{
  await expect(omegaDetectNWNEBitmapMirroring([],[])).rejects.toThrow('6 NW');
 });
});
