import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import manifest from '../content/art/omega-motion-study-v0.1.json';

/**
 * Offline design QA contract: the HTML must stay explicitly non-playable,
 * self-contained and tied to the exact 48-frame concept atlas checksum.
 */
const html=readFileSync(fileURLToPath(new URL('../tools/omega-motion-review-v2.html',import.meta.url)),'utf8');
function embeddedMetadata(){
 const body=html.match(/<script id="motionMetadata" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
 if(!body)throw Error('Missing inline review metadata');
 return JSON.parse(body) as {
  gameplayApproved:boolean;status:string;rows:number;columns:number;sourceSha256:string;
  frames:{frame:number;floorY:number;feetProxy:(number[]|null)[]}[][];
  mirror:{max:number;mean:number;invalidAsIndependentNE:boolean};
  directionNames:string[];
 };
}
describe('OMEGA motion review lab v2 is reproducible and not a playable character',()=>{
 it('preserves exactly 48 cells and source provenance',()=>{
  const meta=embeddedMetadata();
  expect([meta.columns,meta.rows]).toEqual([8,6]);
  expect(meta.directionNames).toEqual(['E','SE','S','SW','W','NW','N','NE']);
  expect(meta.frames).toHaveLength(8);
  for(const col of meta.frames){
   expect(col).toHaveLength(6);
   expect(col.map(x=>x.frame)).toEqual([0,1,2,3,4,5]);
   for(const frame of col){
    expect(frame.floorY).toBeGreaterThanOrEqual(0);
    expect(frame.floorY).toBeLessThan(512);
    expect(frame.feetProxy).toHaveLength(2);
   }
  }
  expect(meta.sourceSha256).toBe(manifest.atlas.sha256);
 });
 it('explicitly disallows unapproved mirror-source as a live fighter',()=>{
  const meta=embeddedMetadata();
  expect(meta.gameplayApproved).toBe(false);
  expect(meta.status).toBe('PROTOTYPE_NOT_PLAYABLE');
  expect(meta.mirror.invalidAsIndependentNE).toBe(true);
  expect(meta.mirror.max).toBeGreaterThan(.99);
  expect(html).toContain('NOT PLAYABLE');
  expect(html).toContain('PIXEL MOTION STUDY');
 });
 it('has functional offline directions, frame controls, image fallback and reviewer export',()=>{
  for(const id of ['dirControls','frame','speed','onion','foot','reduce','qa','export','qaResult']){
   expect(html).toContain('id="'+id+'"');
  }
  expect(html).toContain('omega-walk-MOTION-STUDY-8x6.png');
  expect(html).toContain('omega-walk-MOTION-STUDY-mobile-8x6.webp');
  expect(html).toContain('URL.createObjectURL');
  expect(html).toContain('atlas.onerror');
  expect(html).not.toMatch(/<script[^>]+src=["']https?:/);
  expect(html).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/);
 });
});
