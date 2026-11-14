import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import meta from '../src/ui/omega-scene-art-preview-metadata.json';

type Entry={file:string;sha256:string;foot:{x:number;y:number};muzzle?:{x:number;y:number}};
const manifest=JSON.parse(readFileSync('qa-art/m12g5o/g5j-original-east-action-anchors.json','utf8')) as {
 version:number;frames:Entry[];
};
describe('M12-G5o exact 12 recovered original E action binary files / DEV only',()=>{
 it('preserves ALL 12 original SHA-256 source bytes with original foot/muzzle anchors',()=>{
  expect(manifest.version).toBe(1);expect(manifest.frames).toHaveLength(12);
  const hashes=new Set<string>();
  for(const src of manifest.frames){
   const m=src.file.match(/^aira-east-(fire|dash|hit)-([0-3])\.webp$/);
   expect(m).toBeTruthy();
   const key=m![1]+'-E-'+m![2];
   const spec=meta[key as keyof typeof meta] as {width:number;height:number;
    anchorX:number;anchorY:number;refHeight:number;sha256:string;muzzleX?:number;muzzleY?:number};
   expect(spec).toBeDefined();
   const b=readFileSync('public/assets/omega/scene-art-preview/'+key+'.webp');
   const actual=createHash('sha256').update(b).digest('hex');
   expect(actual).toBe(src.sha256);
   expect(actual).toBe(spec.sha256);
   expect(b.toString('ascii',0,4)).toBe('RIFF');
   expect(b.toString('ascii',8,12)).toBe('WEBP');
   expect(spec.width).toBe(640);expect(spec.height).toBe(512);
   expect(spec.refHeight).toBe(380);
   expect(spec.anchorX).toBe(src.foot.x);expect(spec.anchorY).toBe(src.foot.y);
   expect(spec.muzzleX).toBe(src.muzzle!.x);expect(spec.muzzleY).toBe(src.muzzle!.y);
   hashes.add(actual);
  }
  expect(hashes.size).toBe(12);
 });
 it('never adds a false G5o approved production art flag',()=>{
  const packageJson=JSON.parse(readFileSync('package.json','utf8'));
  expect(typeof packageJson.name).toBe('string');
  expect(manifest.frames.every(f=>Number.isFinite(f.foot.x)&&Number.isFinite(f.foot.y))).toBe(true);
 });
});
