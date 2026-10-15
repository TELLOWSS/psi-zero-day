import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import manifest from '../content/defense/premium-art-v1.json';
import {defenseBoardArtUri,defenseTowerArtUri,defenseEnemyArtUri} from '../src/app/defense-visual-assets';

describe('defense premium runtime art',()=>{
 it('uses real raster art for all four by four equipment states and all six hazard families in the playable ramp',()=>{
  expect(defenseBoardArtUri('ramp-01')).toBe('assets/defense/premium-v1/world.webp');
  const paths=[];
  for(const tower of ['PULSE','BURST','CONTROL','SENSOR'] as const)for(const level of ['L1','L2','L3A','L3B'] as const)paths.push(defenseTowerArtUri(tower,level,'ramp-01'));
  for(const enemy of ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'] as const)paths.push(defenseEnemyArtUri(enemy,'ramp-01'));
  expect(new Set(paths).size).toBe(22);
  expect(paths.every(uri=>uri?.startsWith('assets/defense/premium-v1/')&&uri.endsWith('.webp'))).toBe(true);
  expect(defenseTowerArtUri('PULSE','L1')).toMatch(/\.svg$/);
  expect(defenseTowerArtUri('PULSE','L1','unrelated-map')).toMatch(/\.svg$/);
 });
 it('preserves complete isolated sprite bounds, alpha borders and verified bytes; no uniform atlas slicing',async()=>{
  expect(manifest.assets).toHaveLength(24);
  const hashes=new Set();
  for(const asset of manifest.assets){
   const bytes=fs.readFileSync(`public/${asset.uri}`),meta=await sharp(bytes).metadata();
   const hash=crypto.createHash('sha256').update(bytes).digest('hex');
   expect(hash).toBe(asset.sha256);hashes.add(hash);
   expect(meta.width).toBe(asset.width);expect(meta.height).toBe(asset.height);
   if(asset.alpha){
    const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for(let x=0;x<info.width;x++){expect(data[x*4+3]).toBe(0);expect(data[((info.height-1)*info.width+x)*4+3]).toBe(0);}
    for(let y=0;y<info.height;y++){expect(data[(y*info.width)*4+3]).toBe(0);expect(data[(y*info.width+info.width-1)*4+3]).toBe(0);}
   }
  }
  expect(hashes.size).toBe(24);
  const sensor=manifest.assets.find(asset=>asset.id==='SENSOR.L3A')!;
  expect(sensor.sourceRect?.top).toBeLessThan(900); // full dish begins above the nominal fourth grid row
 });
});
