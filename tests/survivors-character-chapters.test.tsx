import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {SurvivorsGrowthRecord} from '../src/ui/SurvivorsGrowthRecord';
import type {PatrolClearRecord} from '../src/domain/survivors-growth';
import copy from '../content/localization/survivors-character-chapters-ko.json';
const records:PatrolClearRecord[]=[
 {characterId:'player',stageId:'stage_12',stars:[true,true,false]},
 {characterId:'player',stageId:'stage_12',stars:[true,false,true]},
 {characterId:'lim_junho',stageId:'stage_41',stars:[true,true,true]},
];
describe('character chapter records',()=>{
 it('shows only owned chapters with deduplicated actual controls',()=>{
  const before=JSON.stringify(records);
  const html=renderToStaticMarkup(<SurvivorsGrowthRecord records={records} characterId="player"/>);
  expect(html).toContain(copy.roles.player[1]);
  expect(html).toContain('완수 구역 1/10 · 통제 목표 완수 1');
  expect(html).not.toContain(copy.roles.lim_junho[4]);
  expect(JSON.stringify(records)).toBe(before);
 });
 it('does not invent an arc for legacy global progress',()=>{
  const html=renderToStaticMarkup(<SurvivorsGrowthRecord records={records} characterId="kang_taesik" legacy/>);
  expect(html).not.toContain(copy.title);
 });
 it('keeps actor perspective separate on character switch',()=>{
  const html=renderToStaticMarkup(<SurvivorsGrowthRecord records={records} characterId="lim_junho"/>);
  expect(html).toContain(copy.roles.lim_junho[4]);
  expect(html).not.toContain(copy.roles.player[1]);
 });
 it('provides all five chapter perspectives for each current actor',()=>{
  for(const role of Object.values(copy.roles))expect(role).toHaveLength(5);
 });
});
