import {describe,expect,it} from 'vitest';
import {createEpisode01Registry} from '../src/content/episode01';
import {characterHighResPortraitUri,characterPortraitUri,HIRES_PORTRAITS} from '../src/app/episode-visual-assets';
import {CHARACTER_PROFILES} from '../src/engine/patrol-survivors-engine';
import cast from '../content/episode01/character-art-production.json';

describe('approved WATCH character identity across portraits',()=>{
 const registry=createEpisode01Registry();
 const resolve=(id:string)=>registry.getAsset(id)?.variants.find(file=>file.format==='webp')?.uri;
 it('all eight hub companions and detail portraits resolve to the approved production portraits',()=>{
  for(const character of cast.characters){const standard=characterPortraitUri(character.id,resolve);expect(standard).toBe(character.portrait_path);expect(characterHighResPortraitUri(character.id,resolve)).toBe(standard);}
 });
 it('three previously inconsistent detail overrides use their own roster image',()=>{
  for(const id of ['kang_taesik','yoon_sungho','lim_junho'] as const)expect('/'+HIRES_PORTRAITS[id]).toBe(CHARACTER_PROFILES[id].portraitUri);
 });
 it('all six patrol heroes and legacy aliases use the same identity as their selection thumbnails',()=>{
  for(const profile of Object.values(CHARACTER_PROFILES))expect(profile.heroBannerUri).toBe(profile.portraitUri);
 });
});
