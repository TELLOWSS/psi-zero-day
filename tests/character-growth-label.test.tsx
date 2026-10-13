import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import growth from '../content/episode01/character-growth.json';
import {projectCharacterGrowth} from '../src/app/character-growth';
import {characterGrowthExpressionLabel} from '../src/app/character-growth-label';
import {CharacterCard} from '../src/ui/VisualSlot';
describe('localized growth presentation without state changes',()=>{
 for(const [id,config] of Object.entries(growth.characters))for(const [stage,definition] of Object.entries(config.stages))it(`${id} ${stage} renders a localized expression`,()=>{
  const flags={[config.stage_flag]:stage},before=JSON.stringify(flags),view=projectCharacterGrowth(flags,id)!;
  const label=characterGrowthExpressionLabel(definition.expression);expect(label).toMatch(/[가-힣]/);
  const html=renderToStaticMarkup(<CharacterCard person={{id,name:'검증 인물',role:'기존 역할'}} growth={view}/>);
  expect(html).toContain(label);expect(html).not.toContain(`>${definition.expression}<`);expect(view.expression).toBe(definition.expression);expect(JSON.stringify(flags)).toBe(before);
 });
 it('does not expose unknown internal values or object properties',()=>{
  for(const expression of ['unapproved_expression','constructor','toString','__proto__'])expect(characterGrowthExpressionLabel(expression)).toBeUndefined();
 });
 it('selects the approved focused portrait only for matching player growth',()=>{
  const person={id:'player',name:'주인공',role:'안전관리자'},focused=projectCharacterGrowth({'growth.player':'focused'},'player')!;
  const render=(id:string,view=focused)=>renderToStaticMarkup(<CharacterCard person={{...person,id}} portraitUri="assets/episode01/characters/player-portrait.webp" growth={view}/>);
  expect(render('player')).toContain('player-focused-portrait-v1.png');
  expect(render('lim_junho')).not.toContain('player-focused-portrait-v1.png');
  for(const stage of ['initial','skilled','invalid'])expect(render('player',projectCharacterGrowth({'growth.player':stage},'player')!)).not.toContain('player-focused-portrait-v1.png');
  expect(render('player',projectCharacterGrowth({'growth.player':'skilled'},'player')!)).toContain('player-skilled-portrait-v1.png');
  expect(render('lim_junho',projectCharacterGrowth({'growth.player':'skilled'},'player')!)).not.toContain('player-skilled-portrait-v1.png');
 });
});
