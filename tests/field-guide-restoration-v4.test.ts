import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import restored from '../content/art/field-guide-restoration-v4.json';
import previous from '../content/art/field-guide-realistic-v3.json';
import catalog from '../content/episode01/scene-element-catalog.json';
import assets from '../content/episode01/assets.json';

it('routes FG109 to a detailed illustrated workface instead of the old flat overlay',()=>{
 expect(Object.keys(restored.items)).toHaveLength(19);
 expect(restored.items.vehicle_overlap_zone.uri).toContain('/restoration-v4/');
 expect(restored.items.vehicle_overlap_zone.bytes).toBeGreaterThan(100000);
 expect(new Set(Object.values(restored.items).map(a=>a.sha256)).size).toBe(19);
});

for(const[key,a]of Object.entries(restored.items))it('ships clean alpha corners and separate thumbnail: '+key,async()=>{
 const bytes=readFileSync('public'+a.uri),meta=await sharp(bytes).metadata();
 expect(meta.hasAlpha).toBe(true);expect(meta.width).toBeGreaterThanOrEqual(768);expect(meta.height).toBeGreaterThanOrEqual(768);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(a.sha256);
 for(const[left,top]of[[0,0],[meta.width!-16,0],[0,meta.height!-16],[meta.width!-16,meta.height!-16]]){
  const raw=await sharp(bytes).ensureAlpha().extract({left:left!,top:top!,width:16,height:16}).raw().toBuffer();
  const alpha=[...raw].filter((_,i)=>i%4===3);expect(Math.max(...alpha)).toBeLessThanOrEqual(8);
 }
 const thumb=await sharp('public'+a.thumbnail).metadata();expect(thumb.hasAlpha).toBe(true);expect(thumb.width).toBeLessThanOrEqual(240);
});

it('every live Field Guide route has an alpha channel and actual transparent pixels',async()=>{
 const replacements={...previous.items,...restored.items} as Record<string,{uri:string}>;
 for(const[key,entry]of Object.entries(catalog.elements)){
  const visual=(entry as {field_guide_visual?:{asset_path?:string;asset_id?:string}}).field_guide_visual;
  const uri=replacements[key]?.uri??visual?.asset_path??assets.assets.find(a=>a.asset_id===(visual?.asset_id??entry.planned_asset_id))?.variants[0]?.uri;
  expect(uri,key).toBeTruthy();const image=sharp('public/'+uri!.replace(/^\//,''));expect((await image.metadata()).hasAlpha,key).toBe(true);expect((await image.stats()).isOpaque,key).toBe(false);
 }
},30000);
