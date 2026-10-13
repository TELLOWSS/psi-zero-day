import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect, it, vi} from 'vitest';
import {STAGE_ART, drawStageWorkface,cacheStageFloor} from '../src/ui/survivors-stage-art';
import {STAGE_IDS} from '../src/app/survivors-save';
import {stageGroundUri} from '../src/ui/survivors-equipment-art';
it('assigns every campaign workface an existing raster asset and monotonic detail tier', () => {
  expect(Object.keys(STAGE_ART)).toEqual(STAGE_IDS);
  let previous = 0;
  for (const id of STAGE_IDS) {
    expect(existsSync(`public${stageGroundUri(id)}`)).toBe(true);
    expect(STAGE_ART[id]!.detail).toBeGreaterThanOrEqual(previous); previous = STAGE_ART[id]!.detail;
  }
  expect(new Set(Object.values(STAGE_ART).map(p => p.ground)).size).toBe(50);
  expect(stageGroundUri('stage_06')).toContain('remodel');
  expect(stageGroundUri('stage_04')).toContain('winter');
  expect(stageGroundUri('stage_13')).toContain('pour');
  expect(stageGroundUri('stage_16')).toContain('roof');
  expect(stageGroundUri('stage_20')).toContain('handover');
});
it('assigns fifty independent image binaries, not renamed copies',()=>{
  const hashes=STAGE_IDS.map(id=>createHash('sha256').update(readFileSync(`public${stageGroundUri(id)}`)).digest('hex'));
  expect(new Set(hashes).size).toBe(50);
});
it('bounds floor references, touches recent selections and preserves the live floor',()=>{
  const cache:Record<string,number>={};
  cacheStageFloor(cache,'live',0);
  for(let i=1;i<=50;i++){cacheStageFloor(cache,`map-${i}`,i,'live');expect(Object.keys(cache).length).toBeLessThanOrEqual(3);expect(cache.live).toBe(0);}
  expect(cache['map-50']).toBe(50);expect(cache['map-49']).toBe(49);expect(cache['map-48']).toBeUndefined();
  cacheStageFloor(cache,'map-49',49,'live');cacheStageFloor(cache,'next',51,'live');
  expect(cache['map-49']).toBe(49);expect(cache['map-50']).toBeUndefined();
});
it('adds workface paint without mutating equipment rules or states', () => {
  const ctx = {save:vi.fn(),restore:vi.fn(),strokeRect:vi.fn(),setLineDash:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn(),fillText:vi.fn()};
  const hazards = [{x:600,y:300,state:'destroyed',label:'격리 설비'}] as unknown as Parameters<typeof drawStageWorkface>[2];
  const before = JSON.stringify(hazards);
  drawStageWorkface(ctx as unknown as CanvasRenderingContext2D, 'stage_20', hazards);
  expect(ctx.fillText).toHaveBeenCalledWith('격리 설비',600,356);
  expect(JSON.stringify(hazards)).toBe(before);
});
