import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import helmets from '../content/art/character-crew-continuity-v2.json';
import {resolveCharacterBrandingUri,characterBrandingAssetUri} from '../src/app/character-branding';
import {EpisodeSession} from '../src/app/episode-session';

describe('NEW-PSI helmet presentation routing',()=>{
 it('covers all eight colleagues on portrait and map plus eight performance slots',()=>{
  expect(helmets.items).toHaveLength(24);
  expect(new Set(helmets.items.map(x=>x.assetId)).size).toBe(24);
  const session=EpisodeSession.directed();
  for(const item of helmets.items){
   expect(createHash('sha256').update(readFileSync(`public/${item.uri}`)).digest('hex')).toBe(item.sha256);
   const expected=`${item.uri}?v=${item.sha256.slice(0,12)}`;
   expect(session.assetUri(item.assetId)).toBe(expected);
   expect(characterBrandingAssetUri(item.assetId)).toBe(expected);
   expect(resolveCharacterBrandingUri(item.originalUri+'?v=old#portrait')).toBe(expected);
   expect(resolveCharacterBrandingUri('/'+item.originalUri)).toBe('/'+expected);
   expect(resolveCharacterBrandingUri(expected)).toBe(expected);
  }
 });
 it('leaves remote, unrelated and missing assets alone',()=>{
  for(const uri of ['https://example.com/assets/episode01/characters/player-portrait.webp','data:image/png;base64,abc','assets/episode01/backgrounds/gate.webp'])expect(resolveCharacterBrandingUri(uri)).toBe(uri);
  expect(characterBrandingAssetUri('missing')).toBeUndefined();
 });
});
