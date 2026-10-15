/** @vitest-environment jsdom */
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderToStaticMarkup} from 'react-dom/server';
import {DefenseCombatFX} from '../src/ui/DefenseCombatFX';
import {GUARD_WEAPON_FX as art,guardFlightPresentation} from '../src/ui/guard-projectile-presentation';
import {guardContents} from '../src/content/guard-campaign';
import type {DefenseCombatShot} from '../src/domain/defense';
const shot:DefenseCombatShot={id:'material',towerId:'BURST',levelId:'L3A',padId:'P1',targets:[{id:'risk',enemyId:'SWARM',distance:200,point:{x:250,y:200},damage:20,resolved:false}]};
const render=(shots:DefenseCombatShot[])=>renderToStaticMarkup(<svg><DefenseCombatFX content={guardContents[3]!} shots={shots}/></svg>);
describe('Guard weapon material presentation',()=>{
 it('ships a pinned genuine alpha material atlas with sixteen addressable cells',async()=>{
  const bytes=readFileSync('public/'+art.atlas.uri),meta=await sharp(bytes).metadata();
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(art.atlas.sha256);
  expect(bytes.length).toBe(art.atlas.bytes);expect(meta).toMatchObject({width:art.atlas.width,height:art.atlas.height,hasAlpha:true});
  expect(art.atlas.cellWidth*art.atlas.columns).toBe(meta.width);expect(art.atlas.cellHeight*art.atlas.rows).toBe(meta.height);
 });
 it('uses a heavy arc and fast straight optical flight while keeping the loft screen-up after rotation',()=>{
  const start={x:0,y:0},end={x:200,y:0};
  const heavy=guardFlightPresentation(shot,start,end),optical=guardFlightPresentation({...shot,towerId:'SENSOR'},start,end);
  const control=heavy.path.split('Q')[1]!.split(' ').slice(0,2).map(Number);
  expect(control[0]).toBeCloseTo(100);expect(control[1]).toBeCloseTo(-56);expect(heavy.durationMs).toBeGreaterThan(optical.durationMs);
  expect(optical.path).toBe('M0 0L200 0');
  const rotated=guardFlightPresentation(shot,start,end,true).path.split('Q')[1]!.split(' ').slice(0,2).map(Number);
  expect(rotated[0]).toBeCloseTo(44);expect(rotated[1]).toBe(0);
 });
 it('bounds expensive contacts, flights, muzzles and damage labels across a dense volley',()=>{
  const html=render(Array.from({length:24},(_,i)=>({...shot,id:String(i),targets:Array.from({length:8},(_,j)=>({...shot.targets[0]!,id:String(j)}))})));
  expect((html.match(/data-weapon-contact=/g)??[])).toHaveLength(art.budgets.contacts);
  expect((html.match(/data-weapon-flight=/g)??[])).toHaveLength(art.budgets.flights);
  expect((html.match(/data-weapon-muzzle=/g)??[])).toHaveLength(art.budgets.muzzles);
  expect((html.match(/class="guard-damage-number/g)??[])).toHaveLength(art.budgets.damageLabels);
  expect(html).not.toContain('zb-shot-core');expect(html).not.toContain('zb-shot-projectile');
 });
 it('never paints contact or damage on delayed launches and never replays a muzzle on real impacts',()=>{
  const launch=render([{...shot,phase:'LAUNCH',mechanic:'DELAY',targets:[],targetPoint:{x:250,y:200}}]);
  expect(launch).toContain('data-weapon-flight=');expect(launch).not.toContain('data-weapon-contact=');expect(launch).not.toContain('data-combat-damage=');
  const impact=render([{...shot,phase:'IMPACT',mechanic:'DELAY'}]);
  expect(impact).toContain('data-weapon-contact=');expect(impact).not.toContain('data-weapon-flight=');expect(impact).not.toContain('data-weapon-muzzle=');
  expect(render([{...shot,phase:'LAUNCH',mechanic:'WAVE',targets:[],targetPoint:{x:250,y:200}}])).not.toContain('data-weapon-flight=');
 });
});
