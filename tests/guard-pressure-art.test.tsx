/** @vitest-environment jsdom */
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {renderToStaticMarkup} from 'react-dom/server';
import art from '../content/defense/guard-pressure-art-v1.json';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand,advanceDefense} from '../src/engine/defense';
import {GuardSensorPressureOverlay} from '../src/ui/GuardSensorPressure';

const content=guardContents[5]!;
function warning(){
 let state=createDefenseRun(content,'COMMANDER','pressure-art');
 state=applyDefenseCommand(state,content,{type:'Build',towerId:'SENSOR',padId:'P2'});
 state=applyDefenseCommand(state,content,{type:'StartWave'});
 return advanceDefense(state,content,1);
}
it('ships a verified alpha sprite with transparent padding and bounded mobile download size',async()=>{
 const bytes=readFileSync('public/'+art.core.uri),meta=await sharp(bytes).metadata();
 expect(meta).toMatchObject({width:384,height:384,hasAlpha:true});
 expect(createHash('sha256').update(bytes).digest('hex')).toBe(art.core.sha256);
 expect(bytes.length).toBe(art.core.bytes);expect(bytes.length).toBeLessThan(80000);
 const alpha=await sharp(bytes).extractChannel(3).raw().toBuffer();
 expect(alpha[0]).toBe(0);expect(alpha[383]).toBe(0);
 expect(alpha[383*384]).toBe(0);expect(alpha[384*384-1]).toBe(0);
 expect(alpha.filter(v=>v>200).length).toBeGreaterThan(384*384*.25);
});
it('projects the actual locked pad and renders tick-derived time without mutating the run',()=>{
 const state=warning(),before=JSON.stringify(state),p=state.enemies.find(e=>e.sensorPressure)!.sensorPressure!;
 expect(p.phase).toBe('WARNING');
 const html=renderToStaticMarkup(<svg><GuardSensorPressureOverlay content={content} state={state} rotated/></svg>);
 expect(html).toContain('data-pressure-target="P2"');
 expect(html).toContain('rotate(-90)');expect(html).toContain('data-pressure-remaining="'+p.remainingTicks+'"');
 expect(html).not.toContain('NaN');expect(JSON.stringify(state)).toBe(before);
 const paused=renderToStaticMarkup(<svg><GuardSensorPressureOverlay content={content} state={{...state,paused:true}} rotated/></svg>);
 expect(paused).toBe(html);
});
it('removes expired targeting instruments and never introduces them into an old save',()=>{
 const state=warning();
 expect(renderToStaticMarkup(<svg><GuardSensorPressureOverlay content={content} state={{...state,sensorPressureEnabled:undefined}}/></svg>)).toBe('<svg></svg>');
 const spent={...state,enemies:state.enemies.map(e=>e.sensorPressure?{...e,sensorPressure:{...e.sensorPressure,phase:'SPENT' as const,remainingTicks:0}}:e)};
 expect(renderToStaticMarkup(<svg><GuardSensorPressureOverlay content={content} state={spent}/></svg>)).not.toContain('data-pressure-phase');
});
