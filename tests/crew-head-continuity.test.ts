import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import heads from '../content/art/crew-head-continuity-v1.json';
describe('canonical eight-direction crew identity assets',()=>{
 it('binds eight distinct canonical faces with all eight physical viewing angles',()=>{
  expect(heads.grid).toEqual([4,2]);expect(heads.directions).toEqual(['E','SE','S','SW','W','NW','N','NE']);
  expect(heads.items).toHaveLength(8);expect(new Set(heads.items.map(x=>x.sha256)).size).toBe(8);
  for(const h of heads.items){expect(h.reference).toContain('new-psi-crew-v2');expect(h.width).toBeGreaterThanOrEqual(1024);expect(h.height).toBeGreaterThanOrEqual(512);expect(createHash('sha256').update(readFileSync('public/'+h.uri)).digest('hex')).toBe(h.sha256);}
 });
});
