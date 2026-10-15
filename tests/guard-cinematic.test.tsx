/** @vitest-environment jsdom */
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderToStaticMarkup} from 'react-dom/server';
import cinematic from '../content/defense/guard-cinematic-v1.json';
import {guardContents} from '../src/content/guard-campaign';
import {zeroBreachContent} from '../src/content/defense';
import {DefenseCombatFX} from '../src/ui/DefenseCombatFX';
import {GuardWorldLighting,GuardEquipmentRig,GuardRiskAura} from '../src/ui/GuardCinematicWorld';
import {createDefenseRun,applyDefenseCommand} from '../src/engine/defense';
import type {DefenseCombatShot} from '../src/domain/defense';
const c=guardContents[3]!;
const shot:DefenseCombatShot={id:'resolve',towerId:'BURST',levelId:'L3A',padId:'P1',targets:Array.from({length:8},(_,i)=>({id:'risk-'+i,enemyId:'SWARM',distance:i,point:{x:120+i,y:300},damage:20,resolved:true}))};
describe('Guard cinematic asset and rendering contracts',()=>{
 it('ships a real alpha atlas with eight cells, transparent cell margins and a pinned hash',async()=>{
  const a=cinematic.resolveAtlas,bytes=readFileSync('public/'+a.uri),meta=await sharp(bytes).metadata();
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(a.sha256);expect(bytes.length).toBe(a.bytes);
  expect(meta).toMatchObject({width:1280,height:640,hasAlpha:true});expect(a.frames).toBe(a.columns*a.rows);
  for(let i=0;i<8;i++){const edge=await sharp(bytes).extract({left:i%4*320,top:Math.floor(i/4)*320,width:320,height:16}).extractChannel(3).raw().toBuffer();expect(Math.max(...edge)).toBe(0);}
 });
 it('draws at most four real resolved sprites and eight damage labels for a full 24-group burst',()=>{
  const html=renderToStaticMarkup(<svg><DefenseCombatFX content={c} shots={Array.from({length:24},(_,i)=>({...shot,id:String(i)}))}/></svg>);
  expect((html.match(/data-cinematic-resolve=/g)??[])).toHaveLength(4);
  expect((html.match(/class="guard-damage-number/g)??[])).toHaveLength(8);
  expect(html).toContain(cinematic.resolveAtlas.uri);
  expect(renderToStaticMarkup(<svg><DefenseCombatFX content={c} shots={[{...shot,phase:'LAUNCH',targets:[],targetPoint:{x:120,y:300}}]}/></svg>)).not.toContain('data-cinematic-resolve=');
 });
 it('keeps legacy training visuals separate and never creates a fake resolved risk',()=>{
  expect(renderToStaticMarkup(<svg><DefenseCombatFX content={zeroBreachContent} shots={[shot]}/></svg>)).not.toContain('data-cinematic-resolve=');
  expect(renderToStaticMarkup(<svg><DefenseCombatFX content={c} shots={[{...shot,targets:shot.targets.map(h=>({...h,resolved:false}))}]}/></svg>)).not.toContain('data-cinematic-resolve=');
 });
 it('bounds world lighting at two layers and derives emitters from the actual installed equipment',()=>{
  const html=renderToStaticMarkup(<svg><GuardWorldLighting running/></svg>);expect((html.match(/<rect /g)??[])).toHaveLength(2);
  const run=applyDefenseCommand(createDefenseRun(c,'COORDINATOR','rig'),c,{type:'Build',towerId:'PULSE',padId:'P1'}),before=JSON.stringify(run);
  const rig=renderToStaticMarkup(<svg><GuardEquipmentRig content={c} tower={run.towers[0]!}/><GuardRiskAura enemyId="BOSS" locked armored/></svg>);
  expect(rig).toContain('guard-aperture-core');expect(rig).toContain('guard-lock-state');expect(rig).not.toContain('NaN');expect(JSON.stringify(run)).toBe(before);
 });
});
