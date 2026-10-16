import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import art from '../content/episode01/home-premium-art-v4.json';
for(const[id,asset]of Object.entries(art.assets))it('verifies the '+id+' title composition and its mobile download budget',async()=>{
 const bytes=readFileSync('public'+asset.uri),meta=await sharp(bytes).metadata();
 expect(meta.width).toBe(asset.width);expect(meta.height).toBe(asset.height);
 expect(bytes.length).toBe(asset.bytes);expect(bytes.length).toBeLessThan(500000);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
 expect((await sharp(bytes).stats()).channels.every(c=>c.stdev>20)).toBe(true);
 expect(asset.width/asset.height).toBe(id==='wide'?1672/940:940/1672);
});
