import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import art from '../content/episode01/home-new-psi-art-v6.json';
for(const[id,asset]of Object.entries(art.assets))it('decodes NEW-PSI '+id+' final artwork within download budget',async()=>{
 const bytes=readFileSync('public'+asset.uri),meta=await sharp(bytes).metadata();
 expect(meta.width).toBe(asset.width);expect(meta.height).toBe(asset.height);expect(bytes.length).toBe(asset.bytes);expect(bytes.length).toBeLessThan(500000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
});
it('keeps the original shield geometry and transparent outside pixels',async()=>{
 const {data,info}=await sharp('public'+art.mark.uri).ensureAlpha().raw().toBuffer({resolveWithObject:true});const pixel=(x:number,y:number)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];
 expect(pixel(10,15)[3]).toBe(0);expect(pixel(160,15)[3]).toBe(255);expect(pixel(90,106)).toEqual([255,255,255,255]);expect(art.mark.companyName).toBe('NEW-PSI');
});
