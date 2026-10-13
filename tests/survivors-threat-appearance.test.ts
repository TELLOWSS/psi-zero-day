import {describe,it,expect} from 'vitest';
import {stageThreatAppearance,threatSilhouettePose,THREAT_SILHOUETTES,THREAT_ART_GRID,STAGE_THREAT_ART} from '../src/ui/survivors-threat-appearance';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

describe('authored ordinary risk silhouettes',()=>{
  it('maps three distinct shapes to each material family without changing the hazard',()=>{
    const rows=[
      [{type:'RUNAWAY_CART'},0],
      [{type:'RUNAWAY_CART',variant:'reinforced_cart'},1],
      [{type:'RUNAWAY_CART',behavior:'flanking_cart'},2],
      [{type:'GAS_LEAK',variant:'pulse_gas'},3],
      [{type:'GAS_LEAK',variant:'split_gas'},4],
      [{type:'GAS_LEAK',behavior:'crosswind'},5],
      [{type:'FALLING_DEBRIS'},6],
      [{type:'FALLING_DEBRIS',behavior:'wide_debris'},7],
    ] as const;
    for(const [h,cell]of rows){const before=JSON.stringify(h);expect(stageThreatAppearance(h,3,'highrise_slab')!.cell).toBe(cell);expect(JSON.stringify(h)).toBe(before);}
    expect(stageThreatAppearance({type:'FALLING_DEBRIS'},5,'surface_logistics')!.cell).toBe(8);
    expect(stageThreatAppearance({type:'RUNAWAY_CART'},10,'datacenter')!.cell).toBe(2);
  });
  it('keeps dedicated boss/signature art and worker identity',()=>{
    expect(stageThreatAppearance({type:'RUNAWAY_CART',isStageBoss:true},10,'datacenter')).toBeNull();
    expect(stageThreatAppearance({type:'GAS_LEAK',signatureEventId:'authored'},5,'curing_chamber')).toBeNull();
    expect(stageThreatAppearance({type:'UNHELMETED'},5,'surface_logistics')).toBeNull();
    expect(stageThreatAppearance({type:'CRANE_BOSS'},5,'surface_logistics')).toBeNull();
  });
  it('freezes cosmetic animation while preserving the silhouette in reduced motion',()=>{
    const h={type:'GAS_LEAK' as const,behavior:'crosswind' as const};
    expect(threatSilhouettePose(h,1,true)).toEqual(threatSilhouettePose(h,99,true));
    expect(threatSilhouettePose(h,1,false).scaleX).toBeGreaterThan(1);
    const pulse={type:'GAS_LEAK' as const,variant:'pulse_gas' as const,motion:{phase:'warning' as const,timer:0,directionX:0,directionY:0}};
    expect(threatSilhouettePose(pulse,1,false).scaleY).toBeCloseTo(1.08);
  });
  it('loads nine complete alpha sprites with transparent gutters in one compact atlas',async()=>{
    const buffer=await readFile('public'+STAGE_THREAT_ART);
    expect(buffer.length).toBeLessThan(400_000);
    const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    expect(info.width).toBe(1254);expect(info.height).toBe(1254);
    expect(THREAT_SILHOUETTES).toHaveLength(THREAT_ART_GRID.columns*THREAT_ART_GRID.rows);
    for(let cell=0;cell<9;cell++){
      const x0=cell%3*418,y0=Math.floor(cell/3)*418;let painted=0,minX=418,minY=418,maxX=0,maxY=0;
      for(let y=0;y<418;y++)for(let x=0;x<418;x++){
        const alpha=data[((y0+y)*info.width+x0+x)*4+3]!;
        if(alpha>32){painted++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      }
      expect(painted).toBeGreaterThan(1000);expect(minX).toBeGreaterThan(0);expect(minY).toBeGreaterThan(0);expect(maxX).toBeLessThan(417);expect(maxY).toBeLessThan(417);
    }
  });
});
