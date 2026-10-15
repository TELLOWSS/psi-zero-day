import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import audio from '../content/defense/guard-audio-v1.json';
import art from '../content/defense/guard-art-v1.json';
describe('guard supplied and generated binary integrity',()=>{
 it('ships all 32 distinct supplied files and three distinct boards without changing their recorded hashes',()=>{
  expect(audio.assets).toHaveLength(32);expect(art.boards).toHaveLength(3);
  const assets=[...audio.assets,...art.boards];expect(new Set(assets.map(a=>a.sha256)).size).toBe(35);
  for(const asset of assets){const bytes=readFileSync('public/'+asset.uri);expect(bytes.length).toBe(asset.bytes);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);}
 });
});
