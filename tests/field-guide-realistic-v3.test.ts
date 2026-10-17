import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import guide from '../content/art/field-guide-realistic-v3.json';
import catalog from '../content/episode01/scene-element-catalog.json';
import master from '../content/episode01/field-guide-master.json';
import assets from '../content/episode01/assets.json';

it('replaces every previously unillustrated guide item with an individual authored raster',()=>{
 const legacy=Object.entries(catalog.elements).filter(([,e])=>{
  const visual=(e as {field_guide_visual?:{asset_path?:string;presentation?:string;asset_id?:string}}).field_guide_visual;
  return !visual?.asset_path && (visual?.presentation==='generated_item_art'||!assets.assets.some(a=>a.asset_id===(visual?.asset_id??e.planned_asset_id)&&a.variants?.[0]?.uri));
 }).map(([key])=>key).sort();
 expect(legacy).toHaveLength(61);expect(Object.keys(guide.items).sort()).toEqual(legacy);
 expect(new Set(Object.values(guide.items).map(a=>a.sha256)).size).toBe(61);
 for(const key of legacy)expect(master.items.some(x=>x.key===key)).toBe(true);
});

for(const[key,a]of Object.entries(guide.items))it('ships transparent full-size art and lightweight thumbnail: '+key,async()=>{
 const bytes=readFileSync('public'+a.uri),meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 expect(meta.width).toBe(a.width);expect(meta.height).toBe(a.height);expect(meta.width).toBeGreaterThanOrEqual(768);expect(meta.height).toBeGreaterThanOrEqual(512);
 expect(meta.hasAlpha).toBe(true);expect(stats.channels[3]?.min).toBe(0);expect(stats.channels[3]?.max).toBe(255);
 expect(bytes.length).toBe(a.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(a.sha256);
 expect(existsSync('public'+a.thumbnail)).toBe(true);const thumb=await sharp('public'+a.thumbnail).metadata();expect(thumb.width).toBeLessThanOrEqual(240);expect(thumb.hasAlpha).toBe(true);
});
