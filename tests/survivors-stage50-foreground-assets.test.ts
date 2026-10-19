import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PATROL_STAGE_IDS} from '../src/domain/patrol-survivors';
import {approvedForegroundMattes} from '../src/ui/survivors-stage-mattes';
import provenance from '../docs/art-source/watch-remaining-20261019/provenance.json';
import authorization from '../docs/art-source/watch-remaining-20261019/authorization.json';
sharp.cache(false);
sharp.concurrency(1);
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex');

it('keeps user runtime authorization distinct from per-asset human visual lock',()=>{
 expect(authorization.userInstruction).toBe('이어서 나머지 사항 적용하여 완료실시');
 expect(authorization.humanPerAssetVisualReview).toBe(false);expect(authorization.finalVisualLock).toBe(false);
 expect(provenance.assets).toHaveLength(49);
});

it.each(PATROL_STAGE_IDS.filter(id=>id!=='stage_02'))('%s ships its own native alpha crop and unchanged canonical floor',async id=>{
 const record=provenance.assets.find(row=>row.stageId===id);expect(record).toBeDefined();if(!record)return;
 const [layer]=approvedForegroundMattes(id);expect(layer).toMatchObject(record.layer);
 expect(hash('public'+record.sourceGround)).toBe(record.sourceSha256);expect(hash(record.generatedSource)).toBe(record.generatedSha256);
 expect(hash('public'+record.alphaUri)).toBe(record.alphaSha256);
 const original=await sharp('public'+record.sourceGround).metadata(),generated=await sharp(record.generatedSource).metadata(),alpha=await sharp('public'+record.alphaUri).metadata();
 expect({width:original.width,height:original.height}).toEqual(record.nativeSize);
 expect(generated.width).toBe(original.width);expect(generated.height).toBe(original.height);
 expect(alpha.width).toBe(record.crop.width);expect(alpha.height).toBe(record.crop.height);expect(alpha.hasAlpha).toBe(true);
 const [crop,delivery]=await Promise.all([sharp(record.generatedSource).extract(record.crop).ensureAlpha().raw().toBuffer(),sharp('public'+record.alphaUri).ensureAlpha().raw().toBuffer()]);
 expect(crop.equals(delivery)).toBe(true);
 expect(record.generatedRgbUsed).toBe(false);expect(record.humanVisualLock).toBe(false);
 expect(layer!.feetY).toBeCloseTo(layer!.y+layer!.height);expect(layer!.x+layer!.width).toBeLessThanOrEqual(1400);expect(layer!.y+layer!.height).toBeLessThanOrEqual(900);
});
