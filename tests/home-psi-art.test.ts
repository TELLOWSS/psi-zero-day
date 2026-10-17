import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import art from '../content/episode01/home-psi-art-v5.json';
for(const[id,asset]of Object.entries(art.assets))it('verifies the PSI-branded '+id+' art, actual decoding and bounded download',async()=>{
 const bytes=readFileSync('public'+asset.uri),meta=await sharp(bytes).metadata();
 expect(meta.width).toBe(asset.width);expect(meta.height).toBe(asset.height);
 expect(bytes.length).toBe(asset.bytes);expect(bytes.length).toBeLessThan(500000);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
 expect(id==='wide'?asset.width>asset.height:asset.height>asset.width).toBe(true);
});
it('retains the reference mark asymmetry, white concentric eye and independent vector rendering',async()=>{
 const {data,info}=await sharp('public'+art.mark.uri).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const pixel=(x:number,y:number)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];
 expect(pixel(10,15)[3]).toBe(0);expect(pixel(160,15)[3]).toBe(255);
 expect(pixel(90,106)).toEqual([255,255,255,255]);expect(pixel(90,68)).toEqual([255,255,255,255]);
 expect(pixel(90,80)).toEqual([0,90,187,255]);
 expect(art.mark.companyName).toBe('PSI');
});
